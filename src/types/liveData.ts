export type ToolId = 'dollar' | 'weather' | 'currencies' | 'gold';

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

export interface JosourLiveBundle {
  dollar: DollarBanksData;
  weather: WeatherEnergyData;
  currencies: CurrenciesData;
  gold: GoldPricesData;
  serverTimeIso: string;
}
