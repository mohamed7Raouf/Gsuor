import React, {useEffect, useRef, useState} from 'react';
import {
  Calculator,
  Calendar,
  CloudRain,
  Download,
  Eye,
  Film,
  Image as ImageIcon,
  Sun,
  TrendingUp,
  Waves,
  Wind,
} from 'lucide-react';
import type {
  CurrenciesData,
  DollarBanksData,
  GoldPricesData,
  JosourLiveBundle,
  ToolId,
  WeatherEnergyData,
} from '../types/liveData';
import {exportToolAsPng, exportToolAsReelsVideo} from '../utils/reelsCanvasEngine';
import {EgyptWeatherMapSvg} from './BankIcons';
import {JosourLogo} from './JosourLogo';

/* Rich 10s Motion-Graphic Background Shapes present in every tool card */
const MotionGraphicBackdrop: React.FC<{variant?: 'finance' | 'energy' | 'gold'}> = ({
  variant = 'finance',
}) => {
  const accentStroke = variant === 'gold' ? 'rgba(215, 161, 52, 0.34)' : 'rgba(19, 68, 53, 0.2)';
  const goldStroke = 'rgba(224, 179, 71, 0.38)';

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {/* Rotating geometric ring top-left */}
      <svg
        viewBox="0 0 120 120"
        className="absolute -top-6 -left-6 w-40 h-40 opacity-75 animate-josour-spin"
        fill="none"
      >
        <circle
          cx="60"
          cy="60"
          r="48"
          stroke={accentStroke}
          strokeWidth="2.5"
          strokeDasharray="12 8"
        />
        <circle cx="60" cy="60" r="32" stroke={goldStroke} strokeWidth="2" />
        <circle cx="60" cy="12" r="4" fill={goldStroke} />
      </svg>

      {/* Drifting polygon top-right */}
      <svg
        viewBox="0 0 100 100"
        className="absolute top-16 -right-3 w-32 h-32 opacity-70 animate-josour-mg-a"
        fill="none"
      >
        <rect
          x="22"
          y="22"
          width="44"
          height="44"
          rx="10"
          transform="rotate(20 44 44)"
          stroke={goldStroke}
          strokeWidth="2.5"
        />
        <circle cx="68" cy="30" r="7" fill={goldStroke} />
      </svg>

      {/* Mid-canvas flowing motion waves */}
      <svg
        viewBox="0 0 360 120"
        className="absolute top-1/2 -translate-y-1/2 inset-x-0 w-full h-32 opacity-60 animate-josour-mg-b"
        fill="none"
      >
        <path
          d="M-10 55 Q 90 12, 180 55 T 370 55"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="3"
        />
        <path
          d="M-10 82 Q 90 38, 180 82 T 370 82"
          stroke={accentStroke}
          strokeWidth="2"
          strokeDasharray="8 6"
        />
      </svg>

      {/* Rising geometric bars bottom-left */}
      <div className="absolute bottom-8 left-5 flex items-end gap-2 opacity-65 animate-josour-mg-rise">
        <span className="w-2.5 h-7 rounded-full bg-[#134435]/20" />
        <span className="w-2.5 h-12 rounded-full bg-[#E0B347]/40" />
        <span className="w-2.5 h-16 rounded-full bg-[#134435]/20" />
        <span className="w-2.5 h-10 rounded-full bg-[#E0B347]/40" />
      </div>

      {/* Counter-rotating orbit bottom-right */}
      <svg
        viewBox="0 0 100 100"
        className="absolute bottom-6 -right-6 w-36 h-36 opacity-65 animate-josour-spin-reverse"
        fill="none"
      >
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke={accentStroke}
          strokeWidth="2.2"
          strokeDasharray="8 10"
        />
        <circle cx="50" cy="12" r="5" fill={goldStroke} />
      </svg>

      {/* 10s continuous light shimmer sweep */}
      <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-josour-shimmer" />
    </div>
  );
};

interface ToolExportFooterProps {
  toolId: ToolId;
  bundle: JosourLiveBundle;
}

const ToolActionFooter: React.FC<ToolExportFooterProps> = ({toolId, bundle}) => {
  const [pngBusy, setPngBusy] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleDownloadPng = async () => {
    try {
      setPngBusy(true);
      setStatusMessage(null);
      await exportToolAsPng(toolId, bundle);
      setStatusMessage('تم تحميل الصورة اليومية بمقاس 1080×1920 بنجاح');
    } catch {
      setStatusMessage('تعذر تصدير الصورة، حاول مرة أخرى');
    } finally {
      setPngBusy(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (videoProgress !== null) {
      abortRef.current?.abort();
      setVideoProgress(null);
      setStatusMessage('تم إيقاف تسجيل الفيديو');
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setVideoProgress(0);
    setStatusMessage('جاري تسجيل حلقة الريلز (10 ثوانٍ) بمقاس 1080×1920...');
    try {
      const {ext} = await exportToolAsReelsVideo(
        toolId,
        bundle,
        (pct) => setVideoProgress(pct),
        ctrl.signal,
      );
      setStatusMessage(`تم تحميل فيديو الريلز (${ext.toUpperCase()}) لمدة 10 ثوانٍ بنجاح`);
    } catch (err) {
      if (!ctrl.signal.aborted) {
        setStatusMessage(err instanceof Error ? err.message : 'تعذر تسجيل الفيديو');
      }
    } finally {
      setVideoProgress(null);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={pngBusy}
          className="h-11 px-3 rounded-xl bg-white border border-[#134435]/25 text-[#134435] hover:bg-[#EAF1EA] hover:border-[#134435] font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
        >
          <ImageIcon className="w-4 h-4 shrink-0 text-[#134435]" />
          <span>{pngBusy ? 'جاري التحميل...' : 'تحميل صورة (ستوري)'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadVideo}
          className="relative overflow-hidden h-11 px-3 rounded-xl bg-[#134435] text-[#FAFBF7] hover:bg-[#0B2D22] font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {videoProgress !== null && (
            <span
              className="absolute inset-y-0 right-0 bg-[#E0B347]/30 transition-all duration-150"
              style={{width: `${videoProgress}%`}}
            />
          )}
          <span className="relative flex items-center gap-2">
            {videoProgress !== null ? (
              <>
                <Download className="w-4 h-4 shrink-0 text-[#F2CE74] animate-bounce" />
                <span className="font-num">جاري التسجيل {videoProgress}%</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4 shrink-0 text-[#F2CE74]" />
                <span>تحميل فيديو (ريلز 10ث)</span>
              </>
            )}
          </span>
        </button>
      </div>

      {statusMessage && (
        <p className="text-xs font-display font-bold text-[#134435] bg-[#EAF1EA] border border-[#C6D1C3] rounded-lg px-3 py-1.5 text-center">
          {statusMessage}
        </p>
      )}
    </div>
  );
};

function useTenSecondRowIndex(count: number): number {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (count <= 0) return;
    const stepMs = Math.max(850, Math.floor(10_000 / count));
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % count);
    }, stepMs);
    return () => clearInterval(timer);
  }, [count]);
  return idx;
}

/* ============================================================================
 * 1. DOLLAR IN EGYPTIAN BANKS CARD
 * ========================================================================== */
export const DollarBanksCard: React.FC<{
  data: DollarBanksData;
  bundle: JosourLiveBundle;
  onPreview: (id: ToolId) => void;
}> = ({data, bundle, onPreview}) => {
  const activeRow = useTenSecondRowIndex(data.banks.length);
  const [usdInput, setUsdInput] = useState('100');
  const [showCalc, setShowCalc] = useState(false);
  const parsedUsd = Math.max(0, Number(usdInput) || 0);

  return (
    <article id="tool-dollar" className="flex flex-col">
      <div className="relative overflow-hidden rounded-3xl border border-[#C6D1C3] bg-gradient-to-b from-[#E5EFE4] via-[#F7F9F4] to-[#DCE8DC] shadow-sm flex flex-col justify-between min-h-[680px] pb-6">
        <MotionGraphicBackdrop variant="finance" />

        <div className="relative z-10 p-4 sm:p-5 flex flex-col gap-3">
          {/* Top Toolbar + Logo on White Background (Top Only) */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowCalc((v) => !v)}
              className="h-9 px-2.5 rounded-lg bg-white/90 border border-[#134435]/15 text-[#134435] hover:bg-white text-xs font-display font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 animate-josour-icon-swing" />
              <span>حاسبة</span>
            </button>

            <div className="animate-josour-breathe">
              <JosourLogo size="md" />
            </div>

            <button
              type="button"
              onClick={() => onPreview('dollar')}
              className="h-9 px-2.5 rounded-lg bg-white/90 border border-[#134435]/15 text-[#134435] hover:bg-white text-xs font-display font-bold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 animate-josour-icon-swing" />
              <span>9:16</span>
            </button>
          </div>

          {showCalc && (
            <div className="bg-white/95 border border-[#D6A13C]/50 rounded-xl p-3 flex items-center justify-between gap-3">
              <label className="text-xs font-display font-bold text-[#134435] whitespace-nowrap">
                المبلغ ($):
              </label>
              <input
                type="number"
                min="0"
                value={usdInput}
                onChange={(e) => setUsdInput(e.target.value)}
                className="w-24 h-8 px-2 rounded-lg border border-[#C6D1C3] text-center font-num font-bold text-sm text-[#11261E] bg-[#FAFBF7]"
              />
              <span className="text-sm font-num font-extrabold text-[#134435] whitespace-nowrap">
                = {(parsedUsd * data.baseRateEgp).toLocaleString('en-US', {maximumFractionDigits: 2})}{' '}
                جنيه
              </span>
            </div>
          )}

          {/* Emerald Cloud Header Banner */}
          <div className="mx-auto w-full max-w-[360px] rounded-[28px] bg-gradient-to-br from-[#0D3B2C] via-[#17523F] to-[#0D3B2C] px-5 py-4 text-center shadow-md animate-josour-breathe">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight flex items-center justify-center gap-2">
              <span>أسعار الدولار</span>
              <TrendingUp className="w-6 h-6 text-[#F2CE74] animate-josour-float" />
            </h2>
            <p className="font-display font-extrabold text-base sm:text-lg text-[#F2CE74] mt-0.5">
              في البنوك المصرية اليوم
            </p>
          </div>

          {/* Golden Date Pill */}
          <div className="mx-auto inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-[#DFAA3E] via-[#F5D57E] to-[#DDA63A] text-[#11261E] font-display font-extrabold text-xs sm:text-sm shadow-xs animate-josour-float">
            <Calendar className="w-3.5 h-3.5 shrink-0 animate-josour-icon-swing" />
            <span>{data.cairoDateAr}</span>
          </div>

          {/* Bank Table Header */}
          <div className="grid grid-cols-[1.65fr_0.75fr_0.75fr] items-center bg-[#134435] text-white rounded-xl px-3.5 py-2.5 text-xs font-display font-extrabold">
            <div className="text-right">البنك</div>
            <div className="text-center">سعر الشراء</div>
            <div className="text-center">سعر البيع</div>
          </div>

          {/* 9 Bank Rows */}
          <div className="space-y-1.5">
            {data.banks.map((bank, idx) => {
              const highlighted = idx === activeRow;
              return (
                <div
                  key={bank.id}
                  style={{animationDelay: `${idx * -0.9}s`}}
                  className={`grid grid-cols-[1.65fr_0.75fr_0.75fr] items-center rounded-xl px-3.5 py-2 border transition-all duration-300 animate-josour-row-pulse ${
                    highlighted
                      ? 'bg-[#FFF9E8] border-[#E0B347] shadow-xs'
                      : 'bg-[#FAFBF7]/95 border-[#134435]/12'
                  }`}
                >
                  <div className="text-right pl-2">
                    <span className="font-display font-bold text-[11px] sm:text-xs text-[#11261E] leading-snug block">
                      {bank.nameAr}
                    </span>
                  </div>
                  <div className="text-center font-num font-extrabold text-sm sm:text-[15px] text-[#134435]">
                    {bank.buy.toFixed(2)}
                  </div>
                  <div className="text-center font-num font-extrabold text-sm sm:text-[15px] text-[#11261E]">
                    {bank.sell.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs font-display font-bold text-[#134435] pt-1">
            جميع الأسعار بالجنيه المصري
          </p>
        </div>

        {/* Bottom left empty cleanly as requested */}
      </div>

      <ToolActionFooter toolId="dollar" bundle={bundle} />
    </article>
  );
};

/* ============================================================================
 * 2. WEATHER FORECAST & CLEAN ENERGY FUTURE CARD
 * ========================================================================== */
export const WeatherEnergyCard: React.FC<{
  data: WeatherEnergyData;
  bundle: JosourLiveBundle;
  onPreview: (id: ToolId) => void;
}> = ({data, bundle, onPreview}) => {
  return (
    <article id="tool-weather" className="flex flex-col">
      <div className="relative overflow-hidden rounded-3xl border border-[#C6D1C3] bg-gradient-to-b from-[#DDEAE2] via-[#F2F6EE] to-[#D7E5DC] shadow-sm flex flex-col justify-between min-h-[680px] pb-6">
        <MotionGraphicBackdrop variant="energy" />

        <div className="relative z-10 p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <span className="h-9 px-2.5 rounded-lg bg-white/90 border border-[#134435]/15 text-[#134435] text-xs font-num font-bold inline-flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-[#D99E26] animate-josour-spin" />
              <span>{data.cleanEnergyScorePct}%</span>
            </span>

            <div className="text-center flex flex-col items-center">
              <div className="animate-josour-breathe">
                <JosourLogo size="md" />
              </div>
              <h2 className="font-display font-black text-lg sm:text-xl text-[#11261E] mt-1.5 animate-josour-float">
                مستقبل الطاقة النظيفة في مصر
              </h2>
              <p className="text-xs font-body font-bold text-[#4B6359]">{data.cairoDateAr}</p>
            </div>

            <button
              type="button"
              onClick={() => onPreview('weather')}
              className="h-9 px-2.5 rounded-lg bg-white/90 border border-[#134435]/15 text-[#134435] hover:bg-white text-xs font-display font-bold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 animate-josour-icon-swing" />
              <span>9:16</span>
            </button>
          </div>

          {/* Section 1: Regional Weather + Egypt Map */}
          <div className="relative rounded-2xl bg-[#FAFBF7] border border-[#C6D1C3] p-3.5 pt-5 mt-2 animate-josour-float">
            <div className="absolute -top-3.5 right-4 bg-[#6F7C3C] text-[#FAFBF7] font-display font-bold text-xs px-4 py-1 rounded-full">
              حالة الطقس المتوقعة اليوم وغداً
            </div>
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-7 space-y-2 text-right">
                {data.regions.map((reg, idx) => (
                  <div
                    key={reg.id}
                    style={{animationDelay: `${idx * -2}s`}}
                    className="leading-snug animate-josour-row-pulse"
                  >
                    <div className="font-display font-extrabold text-xs sm:text-sm text-[#11261E]">
                      {reg.nameAr}:{' '}
                      <span className="font-num text-[#134435]">
                        °{reg.minTemp} إلى °{reg.maxTemp}
                      </span>
                    </div>
                    <div className="font-body text-[11px] text-[#4B6359]">{reg.conditionAr}</div>
                  </div>
                ))}
              </div>
              <div className="col-span-5 flex items-center justify-center animate-josour-breathe">
                <EgyptWeatherMapSvg regions={data.regions} />
              </div>
            </div>
          </div>

          {/* Section 2: Wind & Clean Energy Generation */}
          <div
            style={{animationDelay: '-2.5s'}}
            className="relative rounded-2xl bg-[#FAFBF7] border border-[#C6D1C3] p-3.5 pt-5 mt-1 animate-josour-float"
          >
            <div className="absolute -top-3.5 right-4 bg-[#6F7C3C] text-[#FAFBF7] font-display font-bold text-xs px-4 py-1 rounded-full">
              توقعات الأجواء ومستقبل الطاقة
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1 text-right">
                <p className="font-display font-extrabold text-xs sm:text-sm text-[#11261E] flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-[#134435] animate-josour-wind" />
                  <span>{data.windStatusAr}</span>
                </p>
                <p className="font-display font-bold text-xs text-[#134435] font-num">
                  السرعة: {data.windSpeedMinKmh} إلى {data.windSpeedMaxKmh} كم/ساعة
                </p>
                <p className="font-body font-bold text-[11px] text-[#6F7C3C] flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-[#D99E26] animate-josour-spin" />
                  <span>
                    إشعاع شمسي {data.solarRadiationWm2} واط/م² · {data.cleanEnergySummaryAr}
                  </span>
                </p>
              </div>
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 64 64" className="w-14 h-14">
                  <line x1="32" y1="26" x2="32" y2="60" stroke="#134435" strokeWidth="3" />
                  <g className="origin-[32px_26px] animate-josour-spin">
                    <path d="M32 26 L29 6 L34 6 Z" fill="#2F594B" />
                    <path d="M32 26 L49 36 L47 40 Z" fill="#2F594B" />
                    <path d="M32 26 L15 36 L17 40 Z" fill="#2F594B" />
                    <circle cx="32" cy="26" r="3" fill="#E0B347" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Section 3: Rain Probability */}
          <div
            style={{animationDelay: '-5s'}}
            className="relative rounded-2xl bg-[#FAFBF7] border border-[#C6D1C3] p-3.5 pt-5 mt-1 animate-josour-float"
          >
            <div className="absolute -top-3.5 right-4 bg-[#6F7C3C] text-[#FAFBF7] font-display font-bold text-xs px-4 py-1 rounded-full">
              فرص أمطار خفيفة
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="font-display font-bold text-xs sm:text-sm text-[#11261E] leading-relaxed">
                {data.rainSummaryAr}
              </p>
              <div className="flex flex-col items-center shrink-0 text-[#1A6D8A]">
                <CloudRain className="w-7 h-7 animate-josour-icon-swing" />
                <span className="font-num font-extrabold text-xs">{data.rainChancePct}%</span>
              </div>
            </div>
          </div>

          {/* Section 4: Mediterranean & Red Sea Conditions */}
          <div
            style={{animationDelay: '-7.5s'}}
            className="relative rounded-2xl bg-[#FAFBF7] border border-[#C6D1C3] p-3.5 pt-5 mt-1 animate-josour-float"
          >
            <div className="absolute -top-3.5 right-4 bg-[#6F7C3C] text-[#FAFBF7] font-display font-bold text-xs px-4 py-1 rounded-full">
              حالة البحرين
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1 text-xs sm:text-sm font-display font-bold text-[#11261E]">
                <p>
                  البحر المتوسط: {data.mediterraneanStateAr}{' '}
                  <span className="font-num text-[#134435]">({data.mediterraneanWaveM})</span>
                </p>
                <p>
                  البحر الأحمر: {data.redSeaStateAr}{' '}
                  <span className="font-num text-[#134435]">({data.redSeaWaveM})</span>
                </p>
              </div>
              <Waves className="w-8 h-8 text-[#1A6D8A] shrink-0 animate-josour-wave" />
            </div>
          </div>
        </div>

        {/* Bottom left empty cleanly as requested */}
      </div>

      <ToolActionFooter toolId="weather" bundle={bundle} />
    </article>
  );
};

/* ============================================================================
 * 3. CURRENCIES VS EGP CARD (No icons next to currencies)
 * ========================================================================== */
export const CurrenciesCard: React.FC<{
  data: CurrenciesData;
  bundle: JosourLiveBundle;
  onPreview: (id: ToolId) => void;
}> = ({data, bundle, onPreview}) => {
  const activeRow = useTenSecondRowIndex(data.currencies.length);
  const [selectedCode, setSelectedCode] = useState('SAR');
  const [amount, setAmount] = useState('100');
  const chosen = data.currencies.find((c) => c.code === selectedCode) ?? data.currencies[0];
  const converted = (Math.max(0, Number(amount) || 0) * (chosen?.sellEgp ?? 0)).toLocaleString(
    'en-US',
    {maximumFractionDigits: 2},
  );

  return (
    <article id="tool-currencies" className="flex flex-col">
      <div className="relative overflow-hidden rounded-3xl border border-[#C6D1C3] bg-gradient-to-b from-[#E5EFE4] via-[#F7F9F4] to-[#DCE8DC] shadow-sm flex flex-col justify-between min-h-[680px] pb-6">
        <MotionGraphicBackdrop variant="finance" />

        <div className="relative z-10 p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="h-9 px-2.5 rounded-lg bg-white/90 border border-[#134435]/15 text-[#134435] text-xs font-display font-bold inline-flex items-center">
              {data.currencies.length} عملات
            </span>

            <div className="animate-josour-breathe">
              <JosourLogo size="md" />
            </div>

            <button
              type="button"
              onClick={() => onPreview('currencies')}
              className="h-9 px-2.5 rounded-lg bg-white/90 border border-[#134435]/15 text-[#134435] hover:bg-white text-xs font-display font-bold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 animate-josour-icon-swing" />
              <span>9:16</span>
            </button>
          </div>

          <div className="mx-auto w-full max-w-[360px] rounded-[28px] bg-gradient-to-br from-[#0D3B2C] via-[#17523F] to-[#0D3B2C] px-5 py-4 text-center shadow-md animate-josour-breathe">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight">
              أسعار العملات
            </h2>
            <p className="font-display font-extrabold text-base sm:text-lg text-[#F2CE74] mt-0.5">
              مقابل الجنيه المصري اليوم
            </p>
          </div>

          <div className="mx-auto inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-[#DFAA3E] via-[#F5D57E] to-[#DDA63A] text-[#11261E] font-display font-extrabold text-xs sm:text-sm shadow-xs animate-josour-float">
            <Calendar className="w-3.5 h-3.5 shrink-0 animate-josour-icon-swing" />
            <span>{data.cairoDateAr}</span>
          </div>

          <div className="bg-white/90 border border-[#D4DDD2] rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label="المبلغ"
                className="w-16 h-7 px-1.5 rounded-md border border-[#C6D1C3] text-center font-num font-bold text-[#11261E] bg-[#FAFBF7]"
              />
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                aria-label="اختر العملة"
                className="h-7 px-1.5 rounded-md border border-[#C6D1C3] font-display font-bold text-[#134435] bg-[#FAFBF7]"
              >
                {data.currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            <span className="font-num font-extrabold text-[#134435] whitespace-nowrap">
              = {converted} جنيه
            </span>
          </div>

          <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr] items-center bg-[#134435] text-white rounded-xl px-3.5 py-2 text-xs font-display font-extrabold">
            <div className="text-right">العملة</div>
            <div className="text-center">الشراء</div>
            <div className="text-center">البيع</div>
          </div>

          {/* Currency Rows — NO icons next to currencies */}
          <div className="space-y-1.5">
            {data.currencies.map((cur, idx) => {
              const highlighted = idx === activeRow;
              return (
                <div
                  key={cur.code}
                  style={{animationDelay: `${idx * -0.85}s`}}
                  className={`grid grid-cols-[1.6fr_0.8fr_0.8fr] items-center rounded-xl px-3.5 py-2 border transition-all duration-300 animate-josour-row-pulse ${
                    highlighted
                      ? 'bg-[#FFF9E8] border-[#E0B347] shadow-xs'
                      : 'bg-[#FAFBF7]/95 border-[#134435]/12'
                  }`}
                >
                  <div className="text-right min-w-0">
                    <span className="font-display font-bold text-xs sm:text-[13px] text-[#11261E]">
                      {cur.nameAr}
                    </span>{' '}
                    <span className="font-num text-[11px] text-[#4B6359] font-semibold">
                      ({cur.code})
                    </span>
                  </div>
                  <div className="text-center font-num font-extrabold text-sm text-[#134435]">
                    {cur.buyEgp.toFixed(2)}
                  </div>
                  <div className="text-center font-num font-extrabold text-sm text-[#11261E]">
                    {cur.sellEgp.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom left empty cleanly as requested */}
      </div>

      <ToolActionFooter toolId="currencies" bundle={bundle} />
    </article>
  );
};

/* ============================================================================
 * 4. GOLD PRICES IN EGYPT CARD (ALL KARATS)
 * ========================================================================== */
export const GoldPricesCard: React.FC<{
  data: GoldPricesData;
  bundle: JosourLiveBundle;
  onPreview: (id: ToolId) => void;
}> = ({data, bundle, onPreview}) => {
  const activeRow = useTenSecondRowIndex(data.karats.length);
  const [grams, setGrams] = useState('10');
  const [selectedKarat, setSelectedKarat] = useState('21');
  const karatItem = data.karats.find((k) => k.karat === selectedKarat) ?? data.karats[1];
  const estimatedEgp = Math.round(
    Math.max(0, Number(grams) || 0) * (karatItem?.sellEgpPerGram ?? 0),
  );

  return (
    <article id="tool-gold" className="flex flex-col">
      <div className="relative overflow-hidden rounded-3xl border border-[#C6D1C3] bg-gradient-to-b from-[#E5EFE4] via-[#F7F9F4] to-[#DCE8DC] shadow-sm flex flex-col justify-between min-h-[680px] pb-6">
        <MotionGraphicBackdrop variant="gold" />

        <div className="relative z-10 p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="h-9 px-2.5 rounded-lg bg-white/90 border border-[#D6A13C]/40 text-[#134435] text-xs font-display font-bold inline-flex items-center">
              سبائك وعيارات
            </span>

            <div className="animate-josour-breathe">
              <JosourLogo size="md" />
            </div>

            <button
              type="button"
              onClick={() => onPreview('gold')}
              className="h-9 px-2.5 rounded-lg bg-white/90 border border-[#134435]/15 text-[#134435] hover:bg-white text-xs font-display font-bold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 animate-josour-icon-swing" />
              <span>9:16</span>
            </button>
          </div>

          <div className="mx-auto w-full max-w-[360px] rounded-[28px] bg-gradient-to-br from-[#0D3B2C] via-[#17523F] to-[#0D3B2C] px-5 py-4 text-center shadow-md animate-josour-breathe">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight">
              أسعار الذهب في مصر
            </h2>
            <p className="font-display font-extrabold text-base sm:text-lg text-[#F2CE74] mt-0.5">
              جميع الأعيرة والجنيه الذهب اليوم
            </p>
          </div>

          <div className="mx-auto inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-[#DFAA3E] via-[#F5D57E] to-[#DDA63A] text-[#11261E] font-display font-extrabold text-xs sm:text-sm shadow-xs animate-josour-float">
            <Calendar className="w-3.5 h-3.5 shrink-0 animate-josour-icon-swing" />
            <span>{data.cairoDateAr}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-gradient-to-br from-[#D7A134] via-[#F2CF76] to-[#CE962C] p-3 text-center text-[#11261E] shadow-xs animate-josour-float">
              <div className="font-display font-extrabold text-xs">الجنيه الذهب (8 جم)</div>
              <div className="font-num font-black text-xl sm:text-2xl mt-0.5">
                {data.goldPoundEgp.toLocaleString('en-US')}
              </div>
              <div className="font-body font-bold text-[11px]">جنيه مصري (عيار 21)</div>
            </div>

            <div
              style={{animationDelay: '-4s'}}
              className="rounded-2xl bg-gradient-to-br from-[#134435] to-[#0B2D22] p-3 text-center text-white shadow-xs animate-josour-float"
            >
              <div className="font-display font-extrabold text-xs text-[#F2CE74]">
                الأونصة العالمية
              </div>
              <div className="font-num font-black text-xl sm:text-2xl mt-0.5">
                ${data.spotOunceUsd.toLocaleString('en-US')}
              </div>
              <div className="font-num font-bold text-[11px] text-white/85">
                {data.spotOunceEgp.toLocaleString('en-US')} جنيه
              </div>
            </div>
          </div>

          <div className="bg-white/90 border border-[#D4DDD2] rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                aria-label="عدد الجرامات"
                className="w-14 h-7 px-1.5 rounded-md border border-[#C6D1C3] text-center font-num font-bold text-[#11261E] bg-[#FAFBF7]"
              />
              <span className="font-display font-bold text-[#4B6359]">جم</span>
              <select
                value={selectedKarat}
                onChange={(e) => setSelectedKarat(e.target.value)}
                aria-label="اختر العيار"
                className="h-7 px-1.5 rounded-md border border-[#C6D1C3] font-display font-bold text-[#134435] bg-[#FAFBF7]"
              >
                {data.karats.map((k) => (
                  <option key={k.karat} value={k.karat}>
                    عيار {k.karat}
                  </option>
                ))}
              </select>
            </div>
            <span className="font-num font-extrabold text-[#134435] whitespace-nowrap">
              = {estimatedEgp.toLocaleString('en-US')} جنيه
            </span>
          </div>

          <div className="grid grid-cols-12 items-center bg-[#134435] text-white rounded-xl px-3 py-2 text-xs font-display font-extrabold">
            <div className="col-span-6 text-right pr-1">العيار</div>
            <div className="col-span-3 text-center">الشراء</div>
            <div className="col-span-3 text-center">البيع</div>
          </div>

          <div className="space-y-2">
            {data.karats.map((k, idx) => {
              const highlighted = idx === activeRow || k.featured;
              return (
                <div
                  key={k.karat}
                  style={{animationDelay: `${idx * -1.4}s`}}
                  className={`grid grid-cols-12 items-center rounded-xl px-2.5 py-2.5 border transition-all duration-300 animate-josour-row-pulse ${
                    k.featured
                      ? 'bg-[#FFF5D6] border-[#D7A134] shadow-xs'
                      : highlighted
                        ? 'bg-[#FFFDF4] border-[#E0B347]'
                        : 'bg-[#FAFBF7]/95 border-[#134435]/12'
                  }`}
                >
                  <div className="col-span-6 flex items-center gap-2 min-w-0">
                    <div
                      style={{animationDelay: `${idx * -1.5}s`}}
                      className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#E8BA4D] to-[#B9821E] text-[#11261E] font-num font-black text-xs flex items-center justify-center shrink-0 animate-josour-icon-swing"
                    >
                      {k.karat}
                    </div>
                    <span className="font-display font-bold text-xs sm:text-[13px] text-[#11261E] truncate">
                      {k.labelAr}
                    </span>
                  </div>
                  <div className="col-span-3 text-center font-num font-extrabold text-sm sm:text-base text-[#134435]">
                    {k.buyEgpPerGram.toLocaleString('en-US')}
                  </div>
                  <div className="col-span-3 text-center font-num font-extrabold text-sm sm:text-base text-[#11261E]">
                    {k.sellEgpPerGram.toLocaleString('en-US')}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-[11px] font-body font-bold text-[#4B6359]">
            الأسعار للجرام الواحد بدون مصنعية أو دمغة
          </p>
        </div>

        {/* Bottom left empty cleanly as requested */}
      </div>

      <ToolActionFooter toolId="gold" bundle={bundle} />
    </article>
  );
};
