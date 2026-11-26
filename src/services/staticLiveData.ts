import type {
  CurrenciesData,
  DollarBanksData,
  EgyptianBankRate,
  EgyptPopulationData,
  EgyptRegionForecast,
  GoldPricesData,
  HaramMakkahData,
  HaramPrayerItem,
  JosourLiveBundle,
  SourceFailoverMeta,
  WeatherEnergyData,
} from '../types/liveData';

const CACHE_KEY = 'josour_live_bundle_cache_v1';
const REQUEST_TIMEOUT_MS = 4500;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
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

function getMakkahDateTimeParts(): {makkahDateAr: string; makkahTimeAr: string; hijriDateAr: string} {
  const now = new Date();
  const makkahDateAr = new Intl.DateTimeFormat('ar-SA', {
    timeZone: 'Asia/Riyadh',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const makkahTimeAr = new Intl.DateTimeFormat('ar-SA', {
    timeZone: 'Asia/Riyadh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  let hijriDateAr = '';
  try {
    hijriDateAr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      timeZone: 'Asia/Riyadh',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
  } catch {
    hijriDateAr = makkahDateAr;
  }

  return {makkahDateAr, makkahTimeAr, hijriDateAr};
}

function makeMeta(name: string, labelAr: string, url: string): SourceFailoverMeta {
  return {
    activeSourceName: name,
    activeSourceLabelAr: labelAr,
    activeSourceUrl: url,
    failoverTriggered: false,
    totalConfiguredSources: 1,
    activeSourceIndex: 0,
    attemptedSources: [{sourceName: name, providerUrl: url, status: 'active'}],
    fetchedAtIso: new Date().toISOString(),
  };
}

const EGYPT_BANK_TEMPLATES: Array<{
  id: string;
  nameAr: string;
  shortCode: string;
  buySpread: number;
  sellSpread: number;
  accentColor: string;
}> = [
  {id: 'cbe', nameAr: 'البنك المركزي المصري', shortCode: 'CBE', buySpread: -0.02, sellSpread: 0.11, accentColor: '#1B4D3E'},
  {id: 'nbe', nameAr: 'البنك الأهلي المصري', shortCode: 'NBE', buySpread: 0.0, sellSpread: 0.1, accentColor: '#134435'},
  {id: 'bm', nameAr: 'بنك مصر', shortCode: 'BM', buySpread: 0.0, sellSpread: 0.1, accentColor: '#8B2635'},
  {id: 'cib', nameAr: 'البنك التجاري الدولي (CIB)', shortCode: 'CIB', buySpread: 0.01, sellSpread: 0.11, accentColor: '#0E4C92'},
  {id: 'qnb', nameAr: 'بنك قطر الوطني (QNB)', shortCode: 'QNB', buySpread: -0.01, sellSpread: 0.09, accentColor: '#6E1839'},
  {id: 'alex', nameAr: 'بنك الإسكندرية', shortCode: 'ALEX', buySpread: 0.0, sellSpread: 0.1, accentColor: '#C84B31'},
  {id: 'hdb', nameAr: 'بنك التعمير والإسكان', shortCode: 'HDB', buySpread: -0.03, sellSpread: 0.07, accentColor: '#1C6E58'},
  {id: 'scb', nameAr: 'بنك قناة السويس', shortCode: 'SCB', buySpread: 0.02, sellSpread: 0.12, accentColor: '#1A5276'},
  {id: 'ub', nameAr: 'المصرف المتحد', shortCode: 'UB', buySpread: 0.0, sellSpread: 0.1, accentColor: '#B8860B'},
];

function buildBanksFromRate(baseUsdEgp: number): EgyptianBankRate[] {
  return EGYPT_BANK_TEMPLATES.map((tpl) => ({
    id: tpl.id,
    nameAr: tpl.nameAr,
    shortCode: tpl.shortCode,
    buy: round2(baseUsdEgp + tpl.buySpread),
    sell: round2(baseUsdEgp + tpl.sellSpread),
    accentColor: tpl.accentColor,
  }));
}

function buildCurrenciesFromRates(ratesVsUsd: Record<string, number>): CurrenciesData {
  const {dateAr, timeAr} = getCairoDateTimeParts();
  const egpPerUsd = ratesVsUsd.EGP || 49.65;

  const list = [
    {code: 'USD', nameAr: 'الدولار الأمريكي', flagCode: 'US'},
    {code: 'EUR', nameAr: 'اليورو الأوروبي', flagCode: 'EU'},
    {code: 'GBP', nameAr: 'الجنيه الإسترليني', flagCode: 'GB'},
    {code: 'SAR', nameAr: 'الريال السعودي', flagCode: 'SA'},
    {code: 'AED', nameAr: 'الدرهم الإماراتي', flagCode: 'AE'},
    {code: 'KWD', nameAr: 'الدينار الكويتي', flagCode: 'KW'},
    {code: 'QAR', nameAr: 'الريال القطري', flagCode: 'QA'},
    {code: 'JOD', nameAr: 'الدينار الأردني', flagCode: 'JO'},
  ];

  return {
    cairoDateAr: dateAr,
    cairoTimeAr: timeAr,
    currencies: list.map((item) => {
      const perUsd = item.code === 'USD' ? 1 : ratesVsUsd[item.code] || 1;
      const midEgp = egpPerUsd / perUsd;
      return {
        code: item.code,
        nameAr: item.nameAr,
        buyEgp: round2(midEgp - midEgp * 0.0025),
        sellEgp: round2(midEgp + midEgp * 0.003),
        flagCode: item.flagCode,
      };
    }),
    source: makeMeta('Builtin + Live Exchange Feed', 'بيانات أسعار الصرف المحدثة', 'https://open.er-api.com'),
  };
}

function buildGoldFromSpot(spotOunceUsd: number, usdEgpSpot: number): GoldPricesData {
  const {dateAr, timeAr} = getCairoDateTimeParts();
  const spotOunceEgp = Math.round(spotOunceUsd * usdEgpSpot);
  const gram24Mid = (spotOunceUsd * usdEgpSpot) / 31.1034768;

  const makeKarat = (karat: string, labelAr: string, purity: number, featured = false) => {
    const mid = gram24Mid * purity;
    return {
      karat,
      labelAr,
      buyEgpPerGram: Math.round(mid - mid * 0.0045),
      sellEgpPerGram: Math.round(mid + mid * 0.0055),
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
    source: makeMeta('Bullion Spot Feed', 'مؤشر أسعار الذهب الفوري', 'https://api.coinbase.com'),
  };
}

function getMakkahNextPrayer(prayers: HaramPrayerItem[]): {
  nextPrayerNameAr: string;
  nextPrayerTime24: string;
  nextPrayerIso: string;
  nextPrayerCountdownAr: string;
} {
  const riyadhOffsetMs = 3 * 3600_000;
  const nowMs = Date.now();
  const riyadhNow = new Date(nowMs + riyadhOffsetMs);
  const y = riyadhNow.getUTCFullYear();
  const m = riyadhNow.getUTCMonth();
  const d = riyadhNow.getUTCDate();

  const prayCandidates = prayers.filter((p) => p.id !== 'sunrise');
  let chosen = prayCandidates[0];
  let targetMs = 0;

  for (const p of prayCandidates) {
    const [hh, mm] = p.time24.split(':').map((x) => Number(x) || 0);
    const utcMs = Date.UTC(y, m, d, hh, mm, 0) - riyadhOffsetMs;
    if (utcMs > nowMs) {
      chosen = p;
      targetMs = utcMs;
      break;
    }
  }

  if (!targetMs) {
    const [hh, mm] = chosen.time24.split(':').map((x) => Number(x) || 0);
    targetMs = Date.UTC(y, m, d + 1, hh, mm, 0) - riyadhOffsetMs;
  }

  const diffMins = Math.max(1, Math.ceil((targetMs - nowMs) / 60_000));
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  const nextPrayerCountdownAr =
    hrs > 0
      ? mins > 0
        ? `باقي ${hrs} س و ${mins} د`
        : `باقي ${hrs} ساعة`
      : `باقي ${mins} دقيقة`;

  return {
    nextPrayerNameAr: chosen.nameAr,
    nextPrayerTime24: chosen.time24,
    nextPrayerIso: new Date(targetMs).toISOString(),
    nextPrayerCountdownAr,
  };
}

export function createDefaultJosourBundle(): JosourLiveBundle {
  const {dateAr, timeAr} = getCairoDateTimeParts();
  const {makkahDateAr, makkahTimeAr, hijriDateAr} = getMakkahDateTimeParts();

  const baseUsdEgp = 49.65;
  const defaultRates: Record<string, number> = {
    USD: 1,
    EUR: 0.945,
    GBP: 0.79,
    SAR: 3.75,
    AED: 3.6725,
    KWD: 0.307,
    QAR: 3.64,
    JOD: 0.709,
    EGP: baseUsdEgp,
  };

  const dollar: DollarBanksData = {
    baseRateEgp: baseUsdEgp,
    cairoDateAr: dateAr,
    cairoTimeAr: timeAr,
    banks: buildBanksFromRate(baseUsdEgp),
    source: makeMeta('Josour Embedded Baseline', 'البيانات المدمجة المحلية', 'local://josour'),
  };

  const regions: EgyptRegionForecast[] = [
    {id: 'cairo_delta', nameAr: 'القاهرة والدلتا', minTemp: 17, maxTemp: 25, conditionAr: 'أجواء معتدلة ومشمسة', icon: 'sun'},
    {id: 'north_coast', nameAr: 'السواحل الشمالية', minTemp: 16, maxTemp: 23, conditionAr: 'غائم جزئياً ولطيف', icon: 'partly_cloudy'},
    {id: 'north_upper', nameAr: 'شمال الصعيد', minTemp: 15, maxTemp: 27, conditionAr: 'طقس صافٍ ومستقر', icon: 'sun'},
    {id: 'south_upper', nameAr: 'جنوب الصعيد', minTemp: 19, maxTemp: 32, conditionAr: 'أجواء مشمسة ودافئة', icon: 'sun'},
  ];

  const weather: WeatherEnergyData = {
    cairoDateAr: dateAr,
    cairoTimeAr: timeAr,
    regions,
    windSpeedMinKmh: 16,
    windSpeedMaxKmh: 26,
    windStatusAr: 'رياح معتدلة ومنتظمة',
    rainChancePct: 12,
    rainSummaryAr: 'استقرار جوي عام مع فرص أمطار محدودة لا تتجاوز 12% شمالاً',
    mediterraneanWaveM: '1.0 - 1.5 متر',
    mediterraneanStateAr: 'خفيف إلى معتدل',
    redSeaWaveM: '1.0 - 1.5 متر',
    redSeaStateAr: 'معتدل',
    solarRadiationWm2: 590,
    cleanEnergyScorePct: 87,
    cleanEnergySummaryAr: 'كفاءة مرتفعة لتوليد الطاقة الشمسية والرياح اليوم',
    source: makeMeta('Josour Embedded Weather', 'البيانات المناخية المدمجة', 'local://josour'),
  };

  const currencies = buildCurrenciesFromRates(defaultRates);
  const gold = buildGoldFromSpot(2640, baseUsdEgp);

  // Anchor population baseline smoothly to current time (approx 117.66M around late 2026)
  const anchorMs = Date.UTC(2026, 10, 26, 0, 0, 0);
  const elapsedDays = (Date.now() - anchorMs) / 86_400_000;
  const dailyNetIncrease = 4280;
  const birthsTodayBase = 5920;
  const deathsTodayBase = 1640;
  const basePopulation = Math.max(115_000_000, Math.round(117_655_000 + elapsedDays * dailyNetIncrease));
  const malePopulation = Math.round(basePopulation * 0.502);
  const femalePopulation = basePopulation - malePopulation;

  const population: EgyptPopulationData = {
    cairoDateAr: dateAr,
    cairoTimeAr: timeAr,
    basePopulation,
    fetchedAtIso: new Date().toISOString(),
    growthPerSecond: dailyNetIncrease / 86_400,
    birthsPerSecond: birthsTodayBase / 86_400,
    deathsPerSecond: deathsTodayBase / 86_400,
    annualGrowthPct: 1.56,
    malePopulation,
    femalePopulation,
    malePct: 50.2,
    femalePct: 49.8,
    birthsTodayBase,
    deathsTodayBase,
    dailyNetIncrease,
    birthsYearToDate: 2_973_500,
    deathsYearToDate: 648_900,
    birthIntervalSec: 15,
    urbanPct: 43.1,
    source: makeMeta('Josour Live Population Clock', 'الساعة السكانية المحلية', 'local://josour'),
  };

  const prayers: HaramPrayerItem[] = [
    {id: 'fajr', nameAr: 'الفجر', time24: '05:14'},
    {id: 'sunrise', nameAr: 'الشروق', time24: '06:38'},
    {id: 'dhuhr', nameAr: 'الظهر', time24: '12:12'},
    {id: 'asr', nameAr: 'العصر', time24: '15:25'},
    {id: 'maghrib', nameAr: 'المغرب', time24: '17:46'},
    {id: 'isha', nameAr: 'العشاء', time24: '19:16'},
  ];

  const next = getMakkahNextPrayer(prayers);

  const haram: HaramMakkahData = {
    makkahDateAr,
    makkahTimeAr,
    hijriDateAr,
    tempC: 31,
    humidityPct: 38,
    windKmh: 14,
    weatherConditionAr: 'سماء صافية وأجواء روحانية مستقرة',
    prayers,
    nextPrayerNameAr: next.nextPrayerNameAr,
    nextPrayerTime24: next.nextPrayerTime24,
    nextPrayerIso: next.nextPrayerIso,
    nextPrayerCountdownAr: next.nextPrayerCountdownAr,
    totalCapacityLabel: '2+ مليون مصلٍّ',
    matafCapacityPerHour: '107,000 طائف/ساعة',
    areaSqmLabel: '1,500,000 م²',
    minaretsCount: 13,
    streamMeta: {
      availableQualities: [
        {id: 'auto', labelAr: 'تلقائي (Auto)', resolution: 'تكيفي ذكي', bitrateLabel: 'Adaptive HLS'},
        {id: '720p', labelAr: 'عالية (720p HD)', resolution: '1280×720', bitrateLabel: '1.2 Mbps'},
        {id: '480p', labelAr: 'متوسطة (480p SD)', resolution: '480×384', bitrateLabel: '860 Kbps'},
        {id: '360p', labelAr: 'توفير البيانات (360p)', resolution: '320×256', bitrateLabel: '450 Kbps'},
      ],
      masterPlaylistUrl: 'https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8',
      statusAr: 'بث مباشر متواصل على مدار 24 ساعة',
    },
    source: makeMeta('Josour Embedded Haram Feed', 'بيانات الحرم المكي المباشرة', 'local://josour'),
  };

  return {
    dollar,
    weather,
    currencies,
    gold,
    population,
    haram,
    serverTimeIso: new Date().toISOString(),
  };
}

export function getInitialStaticBundle(): JosourLiveBundle {
  const defaults = createDefaultJosourBundle();
  try {
    if (typeof window === 'undefined' || !window.localStorage) return defaults;
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return defaults;
    const cached = JSON.parse(raw) as Partial<JosourLiveBundle>;
    if (!cached?.dollar || !cached?.weather || !cached?.currencies || !cached?.gold || !cached?.population || !cached?.haram) {
      return defaults;
    }
    return {
      ...defaults,
      ...cached,
      haram: {
        ...defaults.haram,
        ...cached.haram,
        streamMeta: defaults.haram.streamMeta,
      },
    };
  } catch {
    return defaults;
  }
}

async function fetchJsonSafe(url: string) {
  const res = await fetch(url, {signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)});
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function wmoToArabic(code: number): {text: string; icon: EgyptRegionForecast['icon']} {
  if ([61, 63, 65, 80, 81, 82].includes(code)) return {text: 'فرص أمطار خفيفة', icon: 'rain'};
  if ([1, 2].includes(code)) return {text: 'غائم جزئياً لطيف', icon: 'partly_cloudy'};
  if (code === 3 || code === 45 || code === 48) return {text: 'أجواء غائمة معتدلة', icon: 'cloudy'};
  return {text: 'أجواء مشمسة ومعتدلة', icon: 'sun'};
}

export async function refreshStaticLiveBundle(current: JosourLiveBundle): Promise<JosourLiveBundle> {
  const {dateAr, timeAr} = getCairoDateTimeParts();
  const {makkahDateAr, makkahTimeAr, hijriDateAr: fallbackHijri} = getMakkahDateTimeParts();
  let next: JosourLiveBundle = {
    ...current,
    serverTimeIso: new Date().toISOString(),
  };

  const [fxRes, goldRes, weatherRes, popRes, prayerRes, makkahWeatherRes] = await Promise.allSettled([
    fetchJsonSafe('https://open.er-api.com/v6/latest/USD'),
    fetchJsonSafe('https://api.coinbase.com/v2/prices/PAXG-USD/spot'),
    fetchJsonSafe(
      'https://api.open-meteo.com/v1/forecast?latitude=30.0444,31.2001,28.1099,24.0889&longitude=31.2357,29.9187,30.7503,32.8998&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max,shortwave_radiation_sum&timezone=Africa%2FCairo&forecast_days=2',
    ),
    fetchJsonSafe('https://api.worldbank.org/v2/country/EGY/indicator/SP.POP.TOTL?format=json&mrv=3'),
    fetchJsonSafe('https://api.aladhan.com/v1/timingsByCity?city=Makkah&country=Saudi%20Arabia&method=4'),
    fetchJsonSafe(
      'https://api.open-meteo.com/v1/forecast?latitude=21.4225&longitude=39.8262&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia%2FRiyadh',
    ),
  ]);

  let liveUsdEgp = next.dollar.baseRateEgp;
  if (fxRes.status === 'fulfilled' && fxRes.value?.rates?.EGP) {
    const rates = fxRes.value.rates as Record<string, number>;
    liveUsdEgp = round2(Number(rates.EGP));
    next.dollar = {
      baseRateEgp: liveUsdEgp,
      cairoDateAr: dateAr,
      cairoTimeAr: timeAr,
      banks: buildBanksFromRate(liveUsdEgp),
      source: makeMeta('ExchangeRate-API Live', 'بوابة أسعار الصرف العالمية', 'https://open.er-api.com'),
    };
    next.currencies = buildCurrenciesFromRates(rates);
  }

  if (goldRes.status === 'fulfilled' && Number(goldRes.value?.data?.amount) > 500) {
    next.gold = buildGoldFromSpot(Number(goldRes.value.data.amount), liveUsdEgp);
  } else {
    next.gold = buildGoldFromSpot(next.gold.spotOunceUsd, liveUsdEgp);
  }

  if (weatherRes.status === 'fulfilled' && Array.isArray(weatherRes.value) && weatherRes.value.length === 4) {
    const regionIds: Array<{id: EgyptRegionForecast['id']; nameAr: string}> = [
      {id: 'cairo_delta', nameAr: 'القاهرة والدلتا'},
      {id: 'north_coast', nameAr: 'السواحل الشمالية'},
      {id: 'north_upper', nameAr: 'شمال الصعيد'},
      {id: 'south_upper', nameAr: 'جنوب الصعيد'},
    ];
    const regions: EgyptRegionForecast[] = weatherRes.value.map((loc, idx) => {
      const d = loc?.daily;
      const cond = wmoToArabic(Number(d?.weather_code?.[0] ?? 0));
      return {
        id: regionIds[idx].id,
        nameAr: regionIds[idx].nameAr,
        minTemp: Math.round(Number(d?.temperature_2m_min?.[0] ?? 17)),
        maxTemp: Math.round(Number(d?.temperature_2m_max?.[0] ?? 26)),
        conditionAr: cond.text,
        icon: cond.icon,
      };
    });
    const windMax = Math.round(Number(weatherRes.value[1]?.daily?.wind_speed_10m_max?.[0] ?? 26));
    const rainChancePct = Math.round(Number(weatherRes.value[1]?.daily?.precipitation_probability_max?.[0] ?? 10));
    const solarSumMj = Number(weatherRes.value[3]?.daily?.shortwave_radiation_sum?.[0] ?? 18);
    const solarWm2 = Math.round((solarSumMj * 1_000_000) / (10 * 3600));
    const cleanEnergyScorePct = Math.min(97, Math.max(72, Math.round(70 + (solarWm2 / 800) * 18 + (windMax / 45) * 10)));

    next.weather = {
      ...next.weather,
      cairoDateAr: dateAr,
      cairoTimeAr: timeAr,
      regions,
      windSpeedMinKmh: Math.max(12, Math.round(windMax * 0.68)),
      windSpeedMaxKmh: Math.max(18, windMax),
      windStatusAr: windMax >= 28 ? 'نشاط رياح مثالي لطاقة الرياح' : 'رياح معتدلة ومنتظمة',
      rainChancePct,
      rainSummaryAr:
        rainChancePct >= 20
          ? `فرص أمطار خفيفة بنسبة ${rainChancePct}% على السواحل الشمالية وشمال الوجه البحري`
          : `استقرار جوي عام مع فرص أمطار محدودة لا تتجاوز ${rainChancePct}% شمالاً`,
      solarRadiationWm2: solarWm2 || 580,
      cleanEnergyScorePct,
      cleanEnergySummaryAr:
        cleanEnergyScorePct >= 82
          ? 'كفاءة مرتفعة لتوليد الطاقة الشمسية والرياح اليوم'
          : 'ظروف متوازنة لإنتاج الطاقة المتجددة في مصر',
      source: makeMeta('Open-Meteo Live Weather', 'مرصد الأرصاد الجوية المفتوح', 'https://api.open-meteo.com'),
    };
  }

  if (popRes.status === 'fulfilled' && Array.isArray(popRes.value?.[1])) {
    const series = popRes.value[1] as Array<{value?: number; date?: string}>;
    const latest = series.find((x) => typeof x?.value === 'number');
    const prev = series.find((x) => typeof x?.value === 'number' && x?.date !== latest?.date);
    if (latest?.value) {
      const latestVal = Number(latest.value);
      const latestYear = Number(latest.date) || new Date().getUTCFullYear() - 1;
      const annualRate =
        prev?.value && prev.value > 0 ? (latestVal - Number(prev.value)) / Number(prev.value) : 0.0156;
      const yearStartMs = Date.UTC(latestYear, 6, 1);
      const elapsedYears = Math.max(0, (Date.now() - yearStartMs) / (365.25 * 86_400_000));
      const basePopulation = Math.round(latestVal * Math.pow(1 + annualRate, elapsedYears));
      const annualAdd = Math.round(basePopulation * annualRate);
      const dailyNetIncrease = Math.max(2500, Math.round(annualAdd / 365.25));
      const birthsTodayBase = Math.round(dailyNetIncrease * 1.38);
      const deathsTodayBase = birthsTodayBase - dailyNetIncrease;
      const malePopulation = Math.round(basePopulation * 0.502);
      const birthsPerSecond = birthsTodayBase / 86_400;

      next.population = {
        ...next.population,
        cairoDateAr: dateAr,
        cairoTimeAr: timeAr,
        basePopulation,
        fetchedAtIso: new Date().toISOString(),
        growthPerSecond: dailyNetIncrease / 86_400,
        birthsPerSecond,
        deathsPerSecond: deathsTodayBase / 86_400,
        annualGrowthPct: round2(annualRate * 100),
        malePopulation,
        femalePopulation: basePopulation - malePopulation,
        birthsTodayBase,
        deathsTodayBase,
        dailyNetIncrease,
        birthIntervalSec: Math.max(8, Math.round(1 / birthsPerSecond)),
        source: makeMeta('World Bank Egypt Population API', 'بيانات البنك الدولي الرسمية', 'https://api.worldbank.org'),
      };
    }
  }

  let prayers = next.haram.prayers;
  let hijriDateAr = fallbackHijri;
  if (prayerRes.status === 'fulfilled' && prayerRes.value?.data?.timings) {
    const t = prayerRes.value.data.timings;
    const cleanTime = (s: string) => String(s || '00:00').replace(/\s*\(.*\)$/, '').trim();
    prayers = [
      {id: 'fajr', nameAr: 'الفجر', time24: cleanTime(t.Fajr)},
      {id: 'sunrise', nameAr: 'الشروق', time24: cleanTime(t.Sunrise)},
      {id: 'dhuhr', nameAr: 'الظهر', time24: cleanTime(t.Dhuhr)},
      {id: 'asr', nameAr: 'العصر', time24: cleanTime(t.Asr)},
      {id: 'maghrib', nameAr: 'المغرب', time24: cleanTime(t.Maghrib)},
      {id: 'isha', nameAr: 'العشاء', time24: cleanTime(t.Isha)},
    ];
    const h = prayerRes.value.data.date?.hijri;
    if (h?.day && h?.month?.ar && h?.year) {
      hijriDateAr = `${h.day} ${h.month.ar} ${h.year} هـ`;
    }
  }

  const nextPrayer = getMakkahNextPrayer(prayers);
  const mw = makkahWeatherRes.status === 'fulfilled' ? makkahWeatherRes.value?.current : null;
  next.haram = {
    ...next.haram,
    makkahDateAr,
    makkahTimeAr,
    hijriDateAr,
    tempC: mw?.temperature_2m != null ? Math.round(Number(mw.temperature_2m)) : next.haram.tempC,
    humidityPct: mw?.relative_humidity_2m != null ? Math.round(Number(mw.relative_humidity_2m)) : next.haram.humidityPct,
    windKmh: mw?.wind_speed_10m != null ? Math.round(Number(mw.wind_speed_10m)) : next.haram.windKmh,
    prayers,
    nextPrayerNameAr: nextPrayer.nextPrayerNameAr,
    nextPrayerTime24: nextPrayer.nextPrayerTime24,
    nextPrayerIso: nextPrayer.nextPrayerIso,
    nextPrayerCountdownAr: nextPrayer.nextPrayerCountdownAr,
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore storage limits
  }

  return next;
}
