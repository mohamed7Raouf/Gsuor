export type ToolId = 'dollar' | 'weather' | 'currencies' | 'gold' | 'population' | 'haram';

export interface SourceAttemptLog {
  sourceName: string;
  providerUrl: string;
  status: 'active' | 'failed' | 'simulated_outage';
  reason?: string;
}

export interface SourceFailoverMeta {
  activeSourceName: string;
  activeSourceLabelAr: string;
  activeSourceUrl: string;
  failoverTriggered: boolean;
  totalConfiguredSources: number;
  activeSourceIndex: number;
  attemptedSources: SourceAttemptLog[];
  fetchedAtIso: string;
}

export interface EgyptianBankRate {
  id: string;
  nameAr: string;
  shortCode: string;
  buy: number;
  sell: number;
  accentColor: string;
}

export interface DollarBanksData {
  baseRateEgp: number;
  cairoDateAr: string;
  cairoTimeAr: string;
  banks: EgyptianBankRate[];
  source: SourceFailoverMeta;
}

export interface EgyptRegionForecast {
  id: 'cairo_delta' | 'north_coast' | 'north_upper' | 'south_upper';
  nameAr: string;
  minTemp: number;
  maxTemp: number;
  conditionAr: string;
  icon: 'sun' | 'partly_cloudy' | 'cloudy' | 'rain';
}

export interface WeatherEnergyData {
  cairoDateAr: string;
  cairoTimeAr: string;
  regions: EgyptRegionForecast[];
  windSpeedMinKmh: number;
  windSpeedMaxKmh: number;
  windStatusAr: string;
  rainChancePct: number;
  rainSummaryAr: string;
  mediterraneanWaveM: string;
  mediterraneanStateAr: string;
  redSeaWaveM: string;
  redSeaStateAr: string;
  solarRadiationWm2: number;
  cleanEnergyScorePct: number;
  cleanEnergySummaryAr: string;
  source: SourceFailoverMeta;
}

export interface CurrencyRateItem {
  code: string;
  nameAr: string;
  buyEgp: number;
  sellEgp: number;
  flagCode: string;
}

export interface CurrenciesData {
  cairoDateAr: string;
  cairoTimeAr: string;
  currencies: CurrencyRateItem[];
  source: SourceFailoverMeta;
}

export interface GoldKaratItem {
  karat: string;
  labelAr: string;
  buyEgpPerGram: number;
  sellEgpPerGram: number;
  featured?: boolean;
}

export interface GoldPricesData {
  cairoDateAr: string;
  cairoTimeAr: string;
  spotOunceUsd: number;
  spotOunceEgp: number;
  goldPoundEgp: number;
  karats: GoldKaratItem[];
  source: SourceFailoverMeta;
}

export interface EgyptPopulationData {
  cairoDateAr: string;
  cairoTimeAr: string;
  basePopulation: number;
  fetchedAtIso: string;
  growthPerSecond: number;
  birthsPerSecond: number;
  deathsPerSecond: number;
  annualGrowthPct: number;
  malePopulation: number;
  femalePopulation: number;
  malePct: number;
  femalePct: number;
  birthsTodayBase: number;
  deathsTodayBase: number;
  dailyNetIncrease: number;
  birthsYearToDate: number;
  deathsYearToDate: number;
  birthIntervalSec: number;
  urbanPct: number;
  source: SourceFailoverMeta;
}

export interface HaramPrayerItem {
  id: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameAr: string;
  time24: string;
}

export interface HaramStreamQualityOption {
  id: 'auto' | '720p' | '480p' | '360p';
  labelAr: string;
  resolution: string;
  bitrateLabel: string;
}

export interface HaramMakkahData {
  makkahDateAr: string;
  makkahTimeAr: string;
  hijriDateAr: string;
  tempC: number;
  humidityPct: number;
  windKmh: number;
  weatherConditionAr: string;
  prayers: HaramPrayerItem[];
  nextPrayerNameAr: string;
  nextPrayerTime24: string;
  nextPrayerIso: string;
  nextPrayerCountdownAr: string;
  totalCapacityLabel: string;
  matafCapacityPerHour: string;
  areaSqmLabel: string;
  minaretsCount: number;
  streamMeta: {
    availableQualities: HaramStreamQualityOption[];
    masterPlaylistUrl: string;
    statusAr: string;
  };
  source: SourceFailoverMeta;
}

export interface JosourLiveBundle {
  dollar: DollarBanksData;
  weather: WeatherEnergyData;
  currencies: CurrenciesData;
  gold: GoldPricesData;
  population: EgyptPopulationData;
  haram: HaramMakkahData;
  serverTimeIso: string;
}
