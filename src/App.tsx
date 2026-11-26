import React, {useCallback, useEffect, useState} from 'react';
import {AlertCircle, RefreshCw} from 'lucide-react';
import {JosourLogo} from './components/JosourLogo';
import {ReelsPreviewModal} from './components/ReelsPreviewModal';
import {
  CurrenciesCard,
  DollarBanksCard,
  GoldPricesCard,
  WeatherEnergyCard,
} from './components/ToolCards';
import type {JosourLiveBundle, ToolId} from './types/liveData';

type FilterMode = 'all' | ToolId;

const FILTER_TABS: Array<{id: FilterMode; label: string}> = [
  {id: 'all', label: 'جميع الأدوات (4)'},
  {id: 'dollar', label: 'الدولار في البنوك'},
  {id: 'weather', label: 'الأرصاد والطاقة'},
  {id: 'currencies', label: 'أسعار العملات'},
  {id: 'gold', label: 'أسعار الذهب'},
];

export default function App() {
  const [bundle, setBundle] = useState<JosourLiveBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterMode>('all');
  const [previewTool, setPreviewTool] = useState<ToolId | null>(null);

  const loadLiveData = useCallback(
    async (opts?: {refresh?: boolean}) => {
      try {
        if (bundle) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const qs = opts?.refresh ? '?refresh=1' : '';
        const res = await fetch(`/api/live${qs}`);
        if (!res.ok) {
          throw new Error('تعذر جلب البيانات الحية في الوقت الحالي');
        }
        const data = (await res.json()) as JosourLiveBundle;
        setBundle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الاتصال بالخادم');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [bundle],
  );

  useEffect(() => {
    loadLiveData();
    const interval = setInterval(() => {
      loadLiveData({refresh: true});
    }, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavClick = (tool: ToolId) => {
    setActiveFilter('all');
    setTimeout(() => {
      document.getElementById(`tool-${tool}`)?.scrollIntoView({behavior: 'smooth', block: 'start'});
    }, 40);
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F2F6F1] text-[#11261E]">
      {/* Strict 3-Zone Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#FAFBF7]/95 backdrop-blur-md border-b border-[#D4DDD2]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveFilter('all');
              window.scrollTo({top: 0, behavior: 'smooth'});
            }}
            className="whitespace-nowrap shrink-0 flex items-center"
            aria-label="جسور الرئيسية"
          >
            <JosourLogo size="sm" />
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-display font-bold text-[#354E44]">
            <button
              type="button"
              onClick={() => handleNavClick('dollar')}
              className="hover:text-[#134435] hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              أسعار الدولار
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('weather')}
              className="hover:text-[#134435] hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              الأرصاد والطاقة
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('currencies')}
              className="hover:text-[#134435] hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              أسعار العملات
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('gold')}
              className="hover:text-[#134435] hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              أسعار الذهب
            </button>
          </nav>

          <button
            type="button"
            onClick={() => loadLiveData({refresh: true})}
            disabled={refreshing || loading}
            className="h-10 px-4 rounded-xl bg-[#134435] text-[#FAFBF7] hover:bg-[#0B2D22] font-display font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 text-[#F2CE74] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'جاري التحديث...' : 'تحديث البيانات'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Brand Studio Header */}
        <section className="rounded-2xl bg-[#FAFBF7] border border-[#D4DDD2] p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-xs font-display font-bold text-[#6F7C3C]">
                منصة جسور المباشرة · مستقبل الطاقة النظيفة والاقتصاد في مصر
              </p>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-[#11261E] text-balance leading-snug">
                البيانات الحية اليومية بتصميم الريلز والستوري
              </h1>
              <p className="font-body text-sm text-[#354E44] leading-relaxed">
                أسعار الدولار والعملات والذهب والأرصاد ومؤشر الطاقة المتجددة محدثة لحظياً، مع حركة
                موشن جرافيك متصلة لمدة 10 ثوانٍ وتصدير يومي مباشر بمقاس 9:16.
              </p>
            </div>

            {bundle && (
              <div className="flex flex-col items-start lg:items-end gap-1 shrink-0 text-xs font-body text-[#354E44]">
                <div className="font-display font-extrabold text-sm text-[#134435]">
                  {bundle.dollar.cairoDateAr}
                </div>
                <div className="text-[#4B6359]">
                  تحديث {bundle.dollar.cairoTimeAr} بتوقيت القاهرة
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E4EBE2]">
            <div
              className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EAF1EA] rounded-xl"
              role="tablist"
              aria-label="تصفية أدوات جسور"
            >
              {FILTER_TABS.map((tab) => {
                const active = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-display font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#134435] text-[#FAFBF7] shadow-xs'
                        : 'text-[#354E44] hover:text-[#11261E] hover:bg-white/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-body text-[#4B6359]">
              حركة متصلة كل <span className="font-num font-bold text-[#134435]">10</span> ثوانٍ ·
              تصدير <span className="font-num font-bold text-[#134435]">1080×1920</span> (9:16)
            </div>
          </div>
        </section>

        {error && !bundle && (
          <div className="rounded-2xl bg-white border border-red-200 p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
            <h2 className="font-display font-bold text-lg text-[#11261E]">{error}</h2>
            <button
              type="button"
              onClick={() => loadLiveData({refresh: true})}
              className="px-5 py-2.5 rounded-xl bg-[#134435] text-white font-display font-bold text-sm hover:bg-[#0B2D22] transition-colors cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {loading && !bundle && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-[#D4DDD2] bg-[#FAFBF7] min-h-[680px] p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="h-10 w-32 mx-auto rounded-xl bg-[#DCE8DC]" />
                  <div className="h-24 w-full max-w-[340px] mx-auto rounded-3xl bg-[#DCE8DC]" />
                  <div className="h-8 w-56 mx-auto rounded-full bg-[#EFE4C2]" />
                  <div className="space-y-2.5 pt-2">
                    {[0, 1, 2, 3, 4, 5].map((r) => (
                      <div key={r} className="h-12 rounded-xl bg-[#EAF1EA]" />
                    ))}
                  </div>
                </div>
                <div className="h-14 rounded-2xl bg-[#DCE8DC]" />
              </div>
            ))}
          </div>
        )}

        {bundle && (
          <section
            aria-label="أدوات جسور المباشرة"
            className={
              activeFilter === 'all'
                ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start'
                : 'max-w-[540px] mx-auto'
            }
          >
            {(activeFilter === 'all' || activeFilter === 'dollar') && (
              <DollarBanksCard
                data={bundle.dollar}
                bundle={bundle}
                onPreview={setPreviewTool}
              />
            )}

            {(activeFilter === 'all' || activeFilter === 'weather') && (
              <WeatherEnergyCard
                data={bundle.weather}
                bundle={bundle}
                onPreview={setPreviewTool}
              />
            )}

            {(activeFilter === 'all' || activeFilter === 'currencies') && (
              <CurrenciesCard
                data={bundle.currencies}
                bundle={bundle}
                onPreview={setPreviewTool}
              />
            )}

            {(activeFilter === 'all' || activeFilter === 'gold') && (
              <GoldPricesCard
                data={bundle.gold}
                bundle={bundle}
                onPreview={setPreviewTool}
              />
            )}
          </section>
        )}
      </main>

      <footer className="mt-10 bg-[#134435] text-[#FAFBF7] border-t-4 border-[#E0B347]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#FAFBF7] rounded-xl px-3 py-1.5">
              <JosourLogo size="sm" />
            </div>
            <div>
              <div className="font-display font-extrabold text-sm text-[#F2CE74]">
                جسور — مستقبل الطاقة النظيفة في مصر
              </div>
              <p className="font-body text-xs text-white/80">
                منصة البيانات الاقتصادية والمناخية الحية
              </p>
            </div>
          </div>

          <div className="text-xs font-body text-white/80 text-center sm:text-left">
            جميع البطاقات قابلة للتحميل يومياً كصورة ثابتة أو فيديو ريلز متحرك (10 ثوانٍ) بمقاس 9:16
          </div>
        </div>
      </footer>

      <ReelsPreviewModal
        toolId={previewTool}
        bundle={bundle}
        onClose={() => setPreviewTool(null)}
      />
    </div>
  );
}
