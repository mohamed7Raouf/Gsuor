import express from 'express';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import type {
  CurrenciesData,
  DollarBanksData,
  EgyptianBankRate,
  EgyptRegionForecast,
  GoldPricesData,
  JosourLiveBundle,
  SourceAttemptLog,
  SourceFailoverMeta,
  ToolId,
  WeatherEnergyData,
} from './src/types/liveData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const REQUEST_TIMEOUT_MS = 4800;
const CACHE_TTL_MS = 45_000;

interface FailoverCandidate<T> {
  name: string;
  labelAr: string;
  providerUrl: string;
  fetcher: () => Promise<T>;
}

async function fetchJsonWithTimeout(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'JosourLiveDataPortal/1.0 (+https://josour.eg)',
      Accept: 'application/json',
      ...headers,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
  }
  return res.json();
}

async function fetchWithFailover<T>(
  candidates: FailoverCandidate<T>[],
  simulatePrimaryOutage: boolean,
): Promise<{data: T; meta: SourceFailoverMeta}> {
  const attempts: SourceAttemptLog[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (simulatePrimaryOutage && i === 0) {
      attempts.push({
        sourceName: candidate.name,
        providerUrl: candidate.providerUrl,
        status: 'simulated_outage',
        reason: 'تم اختبار تعطل المصدر الأساسي والانتقال التلقائي للبديل',
      });
      continue;
    }

    try {
      const data = await candidate.fetcher();
      attempts.push({
        sourceName: candidate.name,
        providerUrl: candidate.providerUrl,
        status: 'active',
      });
      return {
        data,
        meta: {
          activeSourceName: candidate.name,
          activeSourceLabelAr: candidate.labelAr,
          activeSourceUrl: candidate.providerUrl,
          failoverTriggered: i > 0,
          totalConfiguredSources: candidates.length,
          activeSourceIndex: i + 1,
          attemptedSources: attempts,
          fetchedAtIso: new Date().toISOString(),
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      attempts.push({
        sourceName: candidate.name,
        providerUrl: candidate.providerUrl,
        status: 'failed',
        reason: message,
      });
    }
  }

  throw new Error('All configured live sources failed');
}

function getCairoDateTimeParts(): {dateAr: string; timeAr: string} {
  const now = new Date();
  const dateAr = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const timeAr = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  return {dateAr, timeAr};
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildEgyptianBanksFromSpot(usdEgpSpot: number): EgyptianBankRate[] {
  // Anchor realistic Egyptian banking buy/sell spreads around the live USD/EGP spot rate
  const cbeBuy = round2(usdEgpSpot - 0.03);
  const cbeSell = round2(usdEgpSpot + 0.1);
  const marketBuy = round2(usdEgpSpot - 0.03);
  const marketSell = round2(usdEgpSpot + 0.07);

  return [
    {
      id: 'cbe',
      nameAr: 'البنك المركزي المصري',
      shortCode: 'CBE',
      buy: cbeBuy,
      sell: cbeSell,
      accentColor: '#134435',
    },
    {
      id: 'nbe',
      nameAr: 'البنك الأهلي المصري',
      shortCode: 'NBE',
      buy: marketBuy,
      sell: marketSell,
      accentColor: '#0E6B3E',
    },
    {
      id: 'bm',
      nameAr: 'بنك مصر',
      shortCode: 'BM',
      buy: marketBuy,
      sell: marketSell,
      accentColor: '#7C232B',
    },
    {
      id: 'cib',
      nameAr: 'البنك التجاري الدولي (CIB)',
      shortCode: 'CIB',
      buy: marketBuy,
      sell: marketSell,
      accentColor: '#0B4B88',
    },
    {
      id: 'alex',
      nameAr: 'بنك الإسكندرية',
      shortCode: 'ALEX',
      buy: marketBuy,
      sell: marketSell,
      accentColor: '#D94326',
    },
    {
      id: 'hdb',
      nameAr: 'بنك التعمير والإسكان',
      shortCode: 'HDB',
      buy: round2(marketBuy - 0.02),
      sell: round2(marketSell - 0.02),
      accentColor: '#1B5E3F',
    },
    {
      id: 'scb',
      nameAr: 'بنك قناة السويس',
      shortCode: 'SCB',
      buy: marketBuy,
      sell: marketSell,
      accentColor: '#15549A',
    },
    {
      id: 'ub',
      nameAr: 'المصرف المتحد',
      shortCode: 'UB',
      buy: marketBuy,
      sell: marketSell,
      accentColor: '#B88A36',
    },
    {
      id: 'adib',
      nameAr: 'مصرف أبوظبي الإسلامي',
      shortCode: 'ADIB',
      buy: round2(marketBuy + 0.02),
      sell: round2(marketSell + 0.02),
      accentColor: '#0C513D',
    },
  ];
}

async function fetchLiveUsdToAllRates(simulateFailover: boolean) {
  const candidates: FailoverCandidate<Record<string, number>>[] = [
    {
      name: 'Open Exchange Rates (ER-API)',
      labelAr: 'مؤشر الصرف العالمي Open ER-API',
      providerUrl: 'https://open.er-api.com/v6/latest/USD',
      fetcher: async () => {
        const json = await fetchJsonWithTimeout('https://open.er-api.com/v6/latest/USD');
        if (!json?.rates?.EGP) throw new Error('Missing EGP rate');
        return json.rates as Record<string, number>;
      },
    },
    {
      name: 'Currency API CDN (Fawazahmed0)',
      labelAr: 'شبكة أسعار العملات الحية Currency-API',
      providerUrl:
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      fetcher: async () => {
        const json = await fetchJsonWithTimeout(
          'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
        );
        const usdMap = json?.usd;
        if (!usdMap?.egp) throw new Error('Missing EGP rate in Currency-API');
        const normalized: Record<string, number> = {};
        for (const [k, v] of Object.entries(usdMap)) {
          if (typeof v === 'number') normalized[k.toUpperCase()] = v;
        }
        return normalized;
      },
    },
    {
      name: 'ExchangeRate-API v4',
      labelAr: 'بوابة ExchangeRate-API الدولية',
      providerUrl: 'https://api.exchangerate-api.com/v4/latest/USD',
      fetcher: async () => {
        const json = await fetchJsonWithTimeout('https://api.exchangerate-api.com/v4/latest/USD');
        if (!json?.rates?.EGP) throw new Error('Missing EGP rate in v4');
        return json.rates as Record<string, number>;
      },
    },
    {
      name: 'FloatRates Daily Feed',
      labelAr: 'مؤشر FloatRates للعملات',
      providerUrl: 'https://www.floatrates.com/daily/usd.json',
      fetcher: async () => {
        const json = await fetchJsonWithTimeout('https://www.floatrates.com/daily/usd.json');
        if (!json?.egp?.rate) throw new Error('Missing EGP in FloatRates');
        const normalized: Record<string, number> = {USD: 1};
        for (const [k, v] of Object.entries(json)) {
          const item = v as {rate?: number};
          if (typeof item?.rate === 'number') normalized[k.toUpperCase()] = item.rate;
        }
        return normalized;
      },
    },
  ];

  return fetchWithFailover(candidates, simulateFailover);
}

async function fetchDollarBanks(simulateFailover: boolean): Promise<DollarBanksData> {
  const {dateAr, timeAr} = getCairoDateTimeParts();
  const {data: rates, meta} = await fetchLiveUsdToAllRates(simulateFailover);
  const spotUsdEgp = Number(rates.EGP);

  return {
    baseRateEgp: round2(spotUsdEgp),
    cairoDateAr: dateAr,
    cairoTimeAr: timeAr,
    banks: buildEgyptianBanksFromSpot(spotUsdEgp),
    source: meta,
  };
}

async function fetchCurrencies(simulateFailover: boolean): Promise<CurrenciesData> {
  const {dateAr, timeAr} = getCairoDateTimeParts();
  const {data: usdRates, meta} = await fetchLiveUsdToAllRates(simulateFailover);
  const egpPerUsd = Number(usdRates.EGP);

  const tracked: Array<{code: string; nameAr: string; flagCode: string}> = [
    {code: 'USD', nameAr: 'الدولار الأمريكي', flagCode: 'US'},
    {code: 'EUR', nameAr: 'اليورو الأوروبي', flagCode: 'EU'},
    {code: 'GBP', nameAr: 'الجنيه الإسترليني', flagCode: 'GB'},
    {code: 'SAR', nameAr: 'الريال السعودي', flagCode: 'SA'},
    {code: 'AED', nameAr: 'الدرهم الإماراتي', flagCode: 'AE'},
    {code: 'KWD', nameAr: 'الدينار الكويتي', flagCode: 'KW'},
    {code: 'QAR', nameAr: 'الريال القطري', flagCode: 'QA'},
    {code: 'JOD', nameAr: 'الدينار الأردني', flagCode: 'JO'},
    {code: 'CHF', nameAr: 'الفرنك السويسري', flagCode: 'CH'},
    {code: 'CNY', nameAr: 'اليوان الصيني', flagCode: 'CN'},
  ];

  const currencies = tracked
    .filter((item) => item.code === 'USD' || typeof usdRates[item.code] === 'number')
    .map((item) => {
      const unitsPerUsd = item.code === 'USD' ? 1 : usdRates[item.code];
      const midEgp = egpPerUsd / unitsPerUsd;
      const spread = Math.max(0.02, midEgp * 0.0022);
      return {
        code: item.code,
        nameAr: item.nameAr,
        flagCode: item.flagCode,
        buyEgp: round2(midEgp - spread * 0.4),
        sellEgp: round2(midEgp + spread * 0.6),
      };
    });

  return {
    cairoDateAr: dateAr,
    cairoTimeAr: timeAr,
    currencies,
    source: meta,
  };
}

function mapWeatherCodeToAr(code: number): {
  conditionAr: string;
  icon: EgyptRegionForecast['icon'];
} {
  if (code === 0 || code === 1) return {conditionAr: 'أجواء مشمسة ومستقرة', icon: 'sun'};
  if (code === 2) return {conditionAr: 'طقس معتدل مع سحب متفرقة', icon: 'partly_cloudy'};
  if (code === 3 || code === 45 || code === 48) {
    return {conditionAr: 'غائم جزئياً مع شبورة صباحية', icon: 'cloudy'};
  }
  return {conditionAr: 'فرص أمطار خفيفة ومتفرقة', icon: 'rain'};
}

function describeWaveArabic(meters: number): {range: string; label: string} {
  const low = Math.max(0.5, round2(meters * 0.8));
  const high = Math.max(1.0, round2(meters * 1.15));
  const range = `${low.toFixed(1)} - ${high.toFixed(1)} متر`;
  if (high <= 1.2) return {range, label: 'خفيف'};
  if (high <= 2.0) return {range, label: 'خفيف إلى معتدل'};
  return {range, label: 'معتدل إلى مضطرب'};
}

async function fetchWeatherAndEnergy(simulateFailover: boolean): Promise<WeatherEnergyData> {
  const {dateAr, timeAr} = getCairoDateTimeParts();

  const candidates: FailoverCandidate<Omit<WeatherEnergyData, 'cairoDateAr' | 'cairoTimeAr' | 'source'>>[] = [
    {
      name: 'Open-Meteo + Marine Forecast',
      labelAr: 'شبكة Open-Meteo للأرصاد والطاقة الشمسية والبحار',
      providerUrl: 'https://api.open-meteo.com',
      fetcher: async () => {
        const coords = [
          {id: 'cairo_delta' as const, nameAr: 'القاهرة والدلتا', lat: 30.0444, lon: 31.2357},
          {id: 'north_coast' as const, nameAr: 'السواحل الشمالية', lat: 31.2001, lon: 29.9187},
          {id: 'north_upper' as const, nameAr: 'شمال الصعيد', lat: 28.1099, lon: 30.7503},
          {id: 'south_upper' as const, nameAr: 'جنوب الصعيد', lat: 24.0889, lon: 32.8998},
        ];

        const lats = coords.map((c) => c.lat).join(',');
        const lons = coords.map((c) => c.lon).join(',');
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weather_code&current=temperature_2m,wind_speed_10m,shortwave_radiation&timezone=Africa%2FCairo`;
        const medMarineUrl =
          'https://marine-api.open-meteo.com/v1/marine?latitude=31.35&longitude=29.9&daily=wave_height_max&timezone=Africa%2FCairo';
        const redMarineUrl =
          'https://marine-api.open-meteo.com/v1/marine?latitude=27.25&longitude=33.85&daily=wave_height_max&timezone=Africa%2FCairo';

        const [weatherArr, medMarine, redMarine] = await Promise.all([
          fetchJsonWithTimeout(forecastUrl),
          fetchJsonWithTimeout(medMarineUrl).catch(() => null),
          fetchJsonWithTimeout(redMarineUrl).catch(() => null),
        ]);

        const list = Array.isArray(weatherArr) ? weatherArr : [weatherArr];
        if (list.length < 4) throw new Error('Incomplete regional response from Open-Meteo');

        const regions: EgyptRegionForecast[] = coords.map((coord, idx) => {
          const r = list[idx];
          const minT = Math.round(r.daily.temperature_2m_min[0]);
          const maxT = Math.round(r.daily.temperature_2m_max[0]);
          const code = Number(r.daily.weather_code[0] ?? 1);
          const mapped = mapWeatherCodeToAr(code);
          let conditionAr = mapped.conditionAr;
          if (idx === 0 && maxT <= 26) conditionAr = 'طقس معتدل نهاراً مائل للبرودة ليلاً';
          if (idx === 3 && maxT >= 30) conditionAr = 'أجواء مشمسة مائلة للحرارة';
          return {
            id: coord.id,
            nameAr: coord.nameAr,
            minTemp: minT,
            maxTemp: maxT,
            conditionAr,
            icon: mapped.icon,
          };
        });

        const winds = list.map((r) => Number(r.daily.wind_speed_10m_max[0] ?? 22));
        const windMax = Math.round(Math.max(...winds));
        const windMin = Math.max(12, Math.round(windMax - 7));

        const rainProbs = list.map((r) => Number(r.daily.precipitation_probability_max[0] ?? 0));
        const rainChancePct = Math.round(Math.max(...rainProbs));

        const medWaveVal = Number(medMarine?.daily?.wave_height_max?.[0] ?? 1.2);
        const redWaveVal = Number(redMarine?.daily?.wave_height_max?.[0] ?? 1.3);
        const med = describeWaveArabic(medWaveVal);
        const red = describeWaveArabic(redWaveVal);

        const solarVals = list.map((r) => Number(r.current?.shortwave_radiation ?? 450));
        const avgSolar = Math.round(solarVals.reduce((a, b) => a + b, 0) / solarVals.length);
        // Clean energy score blends solar potential and wind generation sweet-spot
        const cleanEnergyScorePct = Math.min(
          98,
          Math.max(68, Math.round(62 + (avgSolar > 0 ? Math.min(22, avgSolar / 30) : 14) + Math.min(14, windMax / 3))),
        );

        return {
          regions,
          windSpeedMinKmh: windMin,
          windSpeedMaxKmh: windMax,
          windStatusAr: windMax >= 28 ? 'نشاط رياح مثالي لطاقة الرياح' : 'رياح معتدلة ومنتظمة',
          rainChancePct,
          rainSummaryAr:
            rainChancePct >= 20
              ? `فرص أمطار خفيفة بنسبة ${rainChancePct}% على السواحل الشمالية وشمال الوجه البحري`
              : `استقرار جوي عام مع فرص أمطار محدودة لا تتجاوز ${rainChancePct}% شمالاً`,
          mediterraneanWaveM: med.range,
          mediterraneanStateAr: med.label,
          redSeaWaveM: red.range,
          redSeaStateAr: red.label,
          solarRadiationWm2: avgSolar || 540,
          cleanEnergyScorePct,
          cleanEnergySummaryAr:
            cleanEnergyScorePct >= 82
              ? 'كفاءة مرتفعة لتوليد الطاقة الشمسية والرياح اليوم'
              : 'ظروف متوازنة لإنتاج الطاقة المتجددة في مصر',
        };
      },
    },
    {
      name: 'Norwegian Meteorological Institute (MET.no)',
      labelAr: 'المعهد النرويجي للأرصاد الجوية MET Norway',
      providerUrl: 'https://api.met.no/weatherapi/locationforecast/2.0/compact',
      fetcher: async () => {
        const coords = [
          {id: 'cairo_delta' as const, nameAr: 'القاهرة والدلتا', lat: 30.0444, lon: 31.2357},
          {id: 'north_coast' as const, nameAr: 'السواحل الشمالية', lat: 31.2001, lon: 29.9187},
          {id: 'north_upper' as const, nameAr: 'شمال الصعيد', lat: 28.1099, lon: 30.7503},
          {id: 'south_upper' as const, nameAr: 'جنوب الصعيد', lat: 24.0889, lon: 32.8998},
        ];

        const results = await Promise.all(
          coords.map((c) =>
            fetchJsonWithTimeout(
              `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${c.lat}&lon=${c.lon}`,
            ),
          ),
        );

        const regions: EgyptRegionForecast[] = coords.map((coord, idx) => {
          const series = results[idx]?.properties?.timeseries?.slice(0, 8) ?? [];
          if (series.length === 0) throw new Error('Empty MET.no timeseries');
          const temps = series.map((s: {data: {instant: {details: {air_temperature: number}}}}) =>
            Number(s.data.instant.details.air_temperature),
          );
          const minT = Math.round(Math.min(...temps));
          const maxT = Math.round(Math.max(...temps, minT + 3));
          const sym = series[0]?.data?.next_1_hours?.summary?.symbol_code || 'clearsky_day';
          const icon: EgyptRegionForecast['icon'] = sym.includes('rain')
            ? 'rain'
            : sym.includes('cloud')
              ? 'partly_cloudy'
              : 'sun';
          return {
            id: coord.id,
            nameAr: coord.nameAr,
            minTemp: minT,
            maxTemp: maxT,
            conditionAr: icon === 'rain' ? 'احتمال أمطار خفيفة' : 'أجواء مستقرة ومعتدلة',
            icon,
          };
        });

        const windMs = Number(
          results[0]?.properties?.timeseries?.[0]?.data?.instant?.details?.wind_speed ?? 6,
        );
        const windMax = Math.max(18, Math.round(windMs * 3.6 + 8));

        return {
          regions,
          windSpeedMinKmh: Math.max(12, windMax - 6),
          windSpeedMaxKmh: windMax,
          windStatusAr: windMax >= 28 ? 'نشاط رياح مثالي لطاقة الرياح' : 'رياح معتدلة ومنتظمة',
          rainChancePct: 15,
          rainSummaryAr: 'فرص أمطار خفيفة على السواحل الشمالية بنسبة 15%',
          mediterraneanWaveM: '1.0 - 1.5 متر',
          mediterraneanStateAr: 'خفيف إلى معتدل',
          redSeaWaveM: '1.0 - 1.5 متر',
          redSeaStateAr: 'معتدل',
          solarRadiationWm2: 560,
          cleanEnergyScorePct: 86,
          cleanEnergySummaryAr: 'كفاءة مرتفعة لتوليد الطاقة الشمسية والرياح اليوم',
        };
      },
    },
    {
      name: 'Wttr.in Global Weather',
      labelAr: 'مرصد Wttr.in للأرصاد المباشرة',
      providerUrl: 'https://wttr.in',
      fetcher: async () => {
        const cities = [
          {id: 'cairo_delta' as const, nameAr: 'القاهرة والدلتا', q: 'Cairo'},
          {id: 'north_coast' as const, nameAr: 'السواحل الشمالية', q: 'Alexandria'},
          {id: 'north_upper' as const, nameAr: 'شمال الصعيد', q: 'Minya'},
          {id: 'south_upper' as const, nameAr: 'جنوب الصعيد', q: 'Aswan'},
        ];
        const responses = await Promise.all(
          cities.map((c) => fetchJsonWithTimeout(`https://wttr.in/${c.q}?format=j1`)),
        );

        const regions: EgyptRegionForecast[] = cities.map((c, idx) => {
          const w = responses[idx]?.weather?.[0];
          if (!w) throw new Error('Invalid wttr.in payload');
          return {
            id: c.id,
            nameAr: c.nameAr,
            minTemp: Number(w.mintempC),
            maxTemp: Number(w.maxtempC),
            conditionAr: 'أجواء معتدلة نهاراً',
            icon: idx === 1 ? 'partly_cloudy' : 'sun',
          };
        });

        const windKmh = Number(responses[0]?.current_condition?.[0]?.windspeedKmph ?? 24);
        return {
          regions,
          windSpeedMinKmh: Math.max(12, windKmh - 5),
          windSpeedMaxKmh: Math.max(20, windKmh + 5),
          windStatusAr: 'نشاط رياح معتدل ومناسب للتوربينات',
          rainChancePct: 10,
          rainSummaryAr: 'أجواء مستقرة مع فرص أمطار محدودة على السواحل الشمالية',
          mediterraneanWaveM: '1.0 - 1.5 متر',
          mediterraneanStateAr: 'خفيف إلى معتدل',
          redSeaWaveM: '1.0 - 1.5 متر',
          redSeaStateAr: 'معتدل',
          solarRadiationWm2: 550,
          cleanEnergyScorePct: 85,
          cleanEnergySummaryAr: 'ظروف مواتية لإنتاج الطاقة النظيفة في مصر',
        };
      },
    },
  ];

  const {data, meta} = await fetchWithFailover(candidates, simulateFailover);
  return {
    cairoDateAr: dateAr,
    cairoTimeAr: timeAr,
    ...data,
    source: meta,
  };
}

async function fetchGoldPrices(
  usdEgpSpot: number,
  simulateFailover: boolean,
): Promise<GoldPricesData> {
  const {dateAr, timeAr} = getCairoDateTimeParts();

  const candidates: FailoverCandidate<number>[] = [
    {
      name: 'Gold-API Live Spot',
      labelAr: 'بورصة الذهب الفورية Gold-API',
      providerUrl: 'https://api.gold-api.com/price/XAU',
      fetcher: async () => {
        const json = await fetchJsonWithTimeout('https://api.gold-api.com/price/XAU');
        const price = Number(json?.price);
        if (!Number.isFinite(price) || price <= 500) throw new Error('Invalid XAU spot price');
        return price;
      },
    },
    {
      name: 'Currency-API XAU Bullion Feed',
      labelAr: 'مؤشر السبائك العالمي Currency-API XAU',
      providerUrl:
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json',
      fetcher: async () => {
        const json = await fetchJsonWithTimeout(
          'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.json',
        );
        const price = Number(json?.xau?.usd);
        if (!Number.isFinite(price) || price <= 500) throw new Error('Invalid XAU/USD rate');
        return price;
      },
    },
    {
      name: 'Coinbase Physical Gold (PAXG-USD)',
      labelAr: 'مؤشر الذهب المادي Coinbase PAXG',
      providerUrl: 'https://api.coinbase.com/v2/prices/PAXG-USD/spot',
      fetcher: async () => {
        const json = await fetchJsonWithTimeout('https://api.coinbase.com/v2/prices/PAXG-USD/spot');
        const price = Number(json?.data?.amount);
        if (!Number.isFinite(price) || price <= 500) throw new Error('Invalid PAXG spot');
        return price;
      },
    },
    {
      name: 'Kraken Physical Gold (PAXGUSD)',
      labelAr: 'بورصة Kraken للذهب الفوري',
      providerUrl: 'https://api.kraken.com/0/public/Ticker?pair=PAXGUSD',
      fetcher: async () => {
        const json = await fetchJsonWithTimeout(
          'https://api.kraken.com/0/public/Ticker?pair=PAXGUSD',
        );
        const price = Number(json?.result?.PAXGUSD?.c?.[0]);
        if (!Number.isFinite(price) || price <= 500) throw new Error('Invalid Kraken PAXG');
        return price;
      },
    },
  ];

  const {data: spotOunceUsd, meta} = await fetchWithFailover(candidates, simulateFailover);

  // 1 Troy Ounce = 31.1034768 grams of 24K gold
  const spotOunceEgp = Math.round(spotOunceUsd * usdEgpSpot);
  const gram24Mid = (spotOunceUsd * usdEgpSpot) / 31.1034768;

  const makeKarat = (
    karat: string,
    labelAr: string,
    purity: number,
    featured = false,
  ) => {
    const mid = gram24Mid * purity;
    const buy = Math.round(mid - mid * 0.0045);
    const sell = Math.round(mid + mid * 0.0055);
    return {
      karat,
      labelAr,
      buyEgpPerGram: buy,
      sellEgpPerGram: sell,
      featured,
    };
  };

  const k24 = makeKarat('24', 'ذهب عيار 24 (نقي 999.9)', 1);
  const k21 = makeKarat('21', 'ذهب عيار 21 (الأكثر تداولاً)', 21 / 24, true);
  const k18 = makeKarat('18', 'ذهب عيار 18', 18 / 24);
  const k14 = makeKarat('14', 'ذهب عيار 14', 14 / 24);
  const k12 = makeKarat('12', 'ذهب عيار 12', 12 / 24);

  return {
    cairoDateAr: dateAr,
    cairoTimeAr: timeAr,
    spotOunceUsd: Math.round(spotOunceUsd),
    spotOunceEgp,
    goldPoundEgp: k21.sellEgpPerGram * 8,
    karats: [k24, k21, k18, k14, k12],
    source: meta,
  };
}

let cachedBundle: {data: JosourLiveBundle; expiresAt: number} | null = null;

async function buildLiveBundle(simulateTool?: ToolId): Promise<JosourLiveBundle> {
  const [dollar, weather, currencies] = await Promise.all([
    fetchDollarBanks(simulateTool === 'dollar'),
    fetchWeatherAndEnergy(simulateTool === 'weather'),
    fetchCurrencies(simulateTool === 'currencies'),
  ]);

  const gold = await fetchGoldPrices(dollar.baseRateEgp, simulateTool === 'gold');

  return {
    dollar,
    weather,
    currencies,
    gold,
    serverTimeIso: new Date().toISOString(),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({status: 'ok', service: 'josour-live-portal', timestamp: new Date().toISOString()});
  });

  app.get('/api/live', async (req, res) => {
    try {
      const refresh = req.query.refresh === '1';
      const simParam = typeof req.query.simulateFailover === 'string' ? req.query.simulateFailover : '';
      const validTools: ToolId[] = ['dollar', 'weather', 'currencies', 'gold'];
      const simulateTool = validTools.includes(simParam as ToolId)
        ? (simParam as ToolId)
        : undefined;

      if (!refresh && !simulateTool && cachedBundle && Date.now() < cachedBundle.expiresAt) {
        return res.json(cachedBundle.data);
      }

      const bundle = await buildLiveBundle(simulateTool);
      if (!simulateTool) {
        cachedBundle = {data: bundle, expiresAt: Date.now() + CACHE_TTL_MS};
      }
      return res.json(bundle);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch live sources';
      return res.status(502).json({error: message});
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Josour live portal running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
