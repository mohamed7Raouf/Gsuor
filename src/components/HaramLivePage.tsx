import React, {useEffect, useRef, useState} from 'react';
import Hls from 'hls.js';
import {
  ArrowRight,
  Clock,
  Droplets,
  Maximize2,
  Radio,
  RefreshCw,
  Settings2,
  Thermometer,
  Users,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import type {HaramMakkahData} from '../types/liveData';
import {formatHaramPrayerCountdown} from '../utils/reelsCanvasEngine';
import {JosourLogo} from './JosourLogo';

type StreamQualityId = 'auto' | '720p' | '480p' | '360p';

interface HaramLivePageProps {
  data: HaramMakkahData;
  onBack: () => void;
}

const STREAM_ENDPOINTS = {
  holol720: 'https://win.holol.com/live/quran/playlist.m3u8',
  globecastMulti: 'https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8',
  youtubeChannelId: 'UCos52azQNBgW63_9uDJoPDA',
};

export const HaramLivePage: React.FC<HaramLivePageProps> = ({data, onBack}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerWrapRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [quality, setQuality] = useState<StreamQualityId>('auto');
  const [activeResolution, setActiveResolution] = useState<string>('تكيفي تلقائي');
  const [muted, setMuted] = useState<boolean>(true);
  const [streamStatus, setStreamStatus] = useState<'loading' | 'playing' | 'fallback' | 'error'>('loading');
  const [reloadNonce, setReloadNonce] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;
    setStreamStatus('loading');

    const streamUrl =
      quality === '720p' ? STREAM_ENDPOINTS.holol720 : STREAM_ENDPOINTS.globecastMulti;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_evt, parsed) => {
        if (destroyed) return;
        const levels = parsed.levels || [];
        if (quality === '480p' && levels.length > 1) {
          hls.currentLevel = levels.length - 1;
        } else if (quality === '360p' && levels.length > 0) {
          hls.currentLevel = 0;
        } else {
          hls.currentLevel = -1;
        }

        const chosenQ = data.streamMeta.availableQualities.find((q) => q.id === quality);
        if (quality !== 'auto' && chosenQ) {
          setActiveResolution(chosenQ.resolution);
        } else if (levels.length > 0) {
          const top = levels[levels.length - 1];
          setActiveResolution(
            top?.height ? `${top.width}×${top.height} (تلقائي)` : 'تكيفي تلقائي',
          );
        }
        video.play().catch(() => {
          // Autoplay might wait for user gesture
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_evt, levelData) => {
        if (destroyed) return;
        const lvl = hls.levels?.[levelData.level];
        if (lvl?.height) {
          setActiveResolution(`${lvl.width}×${lvl.height}`);
        }
      });

      hls.on(Hls.Events.ERROR, (_evt, errData) => {
        if (destroyed) return;
        if (errData.fatal) {
          hls.destroy();
          setStreamStatus('fallback');
        }
      });

      return () => {
        destroyed = true;
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      const onLoaded = () => {
        if (!destroyed) {
          setStreamStatus('playing');
          video.play().catch(() => {});
        }
      };
      const onErr = () => {
        if (!destroyed) setStreamStatus('fallback');
      };
      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onErr);
      return () => {
        destroyed = true;
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onErr);
      };
    }

    setStreamStatus('fallback');
    return () => {
      destroyed = true;
    };
  }, [quality, reloadNonce, data.streamMeta]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const toggleFullscreen = () => {
    const el = playerWrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  const countdown = formatHaramPrayerCountdown(data.nextPrayerIso, nowMs);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A241B] text-[#FAFBF7]">
      {/* Dedicated Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0D3326]/95 backdrop-blur-md border-b border-[#E0B347]/30">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-display font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-[#F2CE74]" />
            <span>العودة للرئيسية</span>
          </button>

          <div className="flex items-center gap-3">
            <JosourLogo size="sm" />
            <div className="hidden sm:block text-right">
              <div className="font-display font-extrabold text-sm text-white">
                البث المباشر للحرم المكي الشريف
              </div>
              <div className="font-body text-[11px] text-[#F2CE74]">
                مكة المكرمة · {data.hijriDateAr}
              </div>
            </div>
          </div>

          <div className="h-9 px-3 rounded-full bg-[#B82828] text-white font-display font-extrabold text-xs inline-flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>بث مباشر</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Video Broadcast Stage (8 cols) */}
        <section className="lg:col-span-8 space-y-4">
          <div
            ref={playerWrapRef}
            className="relative rounded-3xl overflow-hidden border border-[#E0B347]/35 bg-black shadow-2xl"
          >
            <div className="aspect-video w-full relative bg-black flex items-center justify-center">
              {streamStatus === 'fallback' ? (
                <iframe
                  title="البث المباشر للمسجد الحرام"
                  src={`https://www.youtube.com/embed/live_stream?channel=${STREAM_ENDPOINTS.youtubeChannelId}&autoplay=1&mute=${muted ? 1 : 0}&rel=0`}
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted={muted}
                  controls={false}
                  onPlaying={() => setStreamStatus('playing')}
                  onWaiting={() => setStreamStatus((prev) => (prev === 'playing' ? 'playing' : 'loading'))}
                  className="w-full h-full object-contain bg-black"
                />
              )}

              {/* Live Overlay Top Pill inside Player */}
              <div className="pointer-events-none absolute top-3.5 right-3.5 left-3.5 flex items-center justify-between gap-2">
                <div className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-xs font-display font-bold text-white inline-flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-[#F2CE74] animate-pulse" />
                  <span>المسجد الحرام · مكة المكرمة</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-[11px] font-num font-bold text-[#F2CE74]">
                  {activeResolution}
                </div>
              </div>

              {streamStatus === 'loading' && (
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-[#F2CE74] animate-spin" />
                  <p className="font-display font-bold text-sm text-white">
                    جاري الاتصال بالبث المباشر للحرم المكي...
                  </p>
                </div>
              )}

              {streamStatus === 'error' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <p className="font-display font-bold text-base text-white">
                    تعذر تشغيل البث حالياً، يرجى اختيار جودة أخرى أو إعادة المحاولة
                  </p>
                  <button
                    type="button"
                    onClick={() => setReloadNonce((n) => n + 1)}
                    className="px-4 py-2 rounded-xl bg-[#E0B347] text-[#11261E] font-display font-bold text-xs cursor-pointer"
                  >
                    إعادة الاتصال بالبث
                  </button>
                </div>
              )}
            </div>

            {/* Player Controls + Multi-Quality Selector Bar */}
            <div className="bg-[#0F3326] border-t border-white/10 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-[#F2CE74] ml-1">
                  <Settings2 className="w-4 h-4" />
                  <span>جودة البث:</span>
                </span>
                {data.streamMeta.availableQualities.map((q) => {
                  const selected = quality === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuality(q.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#E0B347] text-[#11261E] shadow-xs'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {q.labelAr}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-display font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {muted ? (
                    <>
                      <VolumeX className="w-4 h-4 text-[#F2CE74]" />
                      <span>تشغيل الصوت</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-[#F2CE74]" />
                      <span>كتم الصوت</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setReloadNonce((n) => n + 1)}
                  className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 inline-flex items-center justify-center cursor-pointer"
                  aria-label="تحديث البث"
                >
                  <RefreshCw className="w-4 h-4 text-[#F2CE74]" />
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 inline-flex items-center justify-center cursor-pointer"
                  aria-label="ملء الشاشة"
                >
                  <Maximize2 className="w-4 h-4 text-[#F2CE74]" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Live Haram Makkah Statistics Panel (4 cols) */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl bg-[#0F3326] border border-[#E0B347]/30 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="font-display font-black text-lg text-white">
                  إحصائيات الحرم المكي الآن
                </h2>
                <p className="font-body text-xs text-[#F2CE74]">{data.hijriDateAr}</p>
              </div>
              <div className="text-left">
                <div className="font-num font-black text-sm text-white">{data.makkahTimeAr}</div>
                <div className="text-[11px] text-white/70 font-body">توقيت مكة</div>
              </div>
            </div>

            {/* Weather Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-white/8 p-3">
                <Thermometer className="w-4 h-4 text-[#F2CE74] mx-auto mb-1" />
                <div className="font-num font-black text-lg text-white">{data.tempC}°C</div>
                <div className="text-[11px] text-white/75 font-body">الحرارة</div>
              </div>
              <div className="rounded-2xl bg-white/8 p-3">
                <Droplets className="w-4 h-4 text-[#F2CE74] mx-auto mb-1" />
                <div className="font-num font-black text-lg text-white">{data.humidityPct}%</div>
                <div className="text-[11px] text-white/75 font-body">الرطوبة</div>
              </div>
              <div className="rounded-2xl bg-white/8 p-3">
                <Wind className="w-4 h-4 text-[#F2CE74] mx-auto mb-1" />
                <div className="font-num font-black text-lg text-white">{data.windKmh}</div>
                <div className="text-[11px] text-white/75 font-body">كم/س رياح</div>
              </div>
            </div>

            {/* Next Prayer Highlight */}
            <div className="rounded-2xl bg-gradient-to-r from-[#DFAA3E] via-[#F2CE74] to-[#DDA63A] text-[#11261E] p-3.5 flex items-center justify-between">
              <div>
                <div className="font-display font-extrabold text-xs">
                  الصلاة القادمة: {data.nextPrayerNameAr}
                </div>
                <div className="font-display font-black text-sm mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{countdown}</span>
                </div>
              </div>
              <div className="font-num font-black text-2xl">{data.nextPrayerTime24}</div>
            </div>

            {/* Prayer Times */}
            <div className="grid grid-cols-3 gap-2">
              {data.prayers.map((p) => {
                const isNext = p.nameAr === data.nextPrayerNameAr;
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl p-2 text-center border ${
                      isNext
                        ? 'bg-[#E0B347]/20 border-[#F2CE74] text-white'
                        : 'bg-white/5 border-white/10 text-white/90'
                    }`}
                  >
                    <div className="font-display font-bold text-[11px] text-[#F2CE74]">
                      {p.nameAr}
                    </div>
                    <div className="font-num font-black text-sm mt-0.5">{p.time24}</div>
                  </div>
                );
              })}
            </div>

            {/* Capacity Stats */}
            <div className="space-y-2 pt-1">
              <div className="rounded-xl bg-white/8 px-3.5 py-2.5 flex items-center justify-between text-xs">
                <span className="font-display font-bold text-white/85 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#F2CE74]" />
                  <span>الطاقة الاستيعابية</span>
                </span>
                <span className="font-num font-extrabold text-[#F2CE74]">
                  {data.totalCapacityLabel}
                </span>
              </div>
              <div className="rounded-xl bg-white/8 px-3.5 py-2.5 flex items-center justify-between text-xs">
                <span className="font-display font-bold text-white/85">طاقة صحن المطاف</span>
                <span className="font-num font-extrabold text-white">
                  {data.matafCapacityPerHour}
                </span>
              </div>
              <div className="rounded-xl bg-white/8 px-3.5 py-2.5 flex items-center justify-between text-xs">
                <span className="font-display font-bold text-white/85">
                  المساحة ({data.minaretsCount} مئذنة)
                </span>
                <span className="font-num font-extrabold text-white">{data.areaSqmLabel}</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};
