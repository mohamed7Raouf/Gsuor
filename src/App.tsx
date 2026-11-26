import React, {useCallback, useEffect, useState} from 'react';
import {Bookmark, Download, FolderUp, RefreshCw} from 'lucide-react';
import {DriveUploadModal} from './components/DriveUploadModal';
import {HaramLivePage} from './components/HaramLivePage';
import {JosourLogo} from './components/JosourLogo';
import {useLocalStorageData} from './components/LocalStorageProvider';
import {ReelsPreviewModal} from './components/ReelsPreviewModal';
import {SavedSnapshotsDrawer} from './components/SavedSnapshotsDrawer';
import {
  CurrenciesCard,
  DollarBanksCard,
  GoldPricesCard,
  HaramStatsCard,
  PopulationCard,
  WeatherEnergyCard,
} from './components/ToolCards';
import {getInitialStaticBundle, refreshStaticLiveBundle} from './services/staticLiveData';
import type {JosourLiveBundle, ToolId} from './types/liveData';

type FilterMode = 'all' | ToolId;

const FILTER_TABS: Array<{id: FilterMode; label: string}> = [
  {id: 'all', label: 'جميع الأدوات (6)'},
  {id: 'dollar', label: 'الدولار في البنوك'},
  {id: 'weather', label: 'الأرصاد والطاقة'},
  {id: 'currencies', label: 'أسعار العملات'},
  {id: 'gold', label: 'أسعار الذهب'},
  {id: 'population', label: 'التعداد السكاني'},
  {id: 'haram', label: 'الحرم المكي'},
];

export default function App() {
  const {preferences, updatePreferences, snapshots} = useLocalStorageData();
  const [bundle, setBundle] = useState<JosourLiveBundle>(() => getInitialStaticBundle());
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterMode>(preferences.preferredTool);
  const [previewTool, setPreviewTool] = useState<ToolId | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [isHaramLiveView, setIsHaramLiveView] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.location.hash === '#/haram-live' : false,
  );

  useEffect(() => {
    const onHashChange = () => {
      setIsHaramLiveView(window.location.hash === '#/haram-live');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openHaramLivePage = useCallback(() => {
    window.location.hash = '#/haram-live';
    setIsHaramLiveView(true);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  const closeHaramLivePage = useCallback(() => {
    window.location.hash = '';
    setIsHaramLiveView(false);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  useEffect(() => {
    setActiveFilter(preferences.preferredTool);
  }, [preferences.preferredTool]);

  const loadLiveData = useCallback(async () => {
    try {
      setRefreshing(true);
      const next = await refreshStaticLiveBundle(bundle);
      setBundle(next);
    } catch {
      // Keep embedded/localStorage defaults cleanly without throwing
    } finally {
      setRefreshing(false);
    }
  }, [bundle]);

  useEffect(() => {
    loadLiveData();
    const interval = setInterval(() => {
      loadLiveData();
    }, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (nextFilter: FilterMode) => {
    setActiveFilter(nextFilter);
    updatePreferences({preferredTool: nextFilter});
  };

  const handleNavClick = (tool: ToolId) => {
    setActiveFilter('all');
    setTimeout(() => {
      document.getElementById(`tool-${tool}`)?.scrollIntoView({behavior: 'smooth', block: 'start'});
    }, 40);
  };

  if (isHaramLiveView) {
    return <HaramLivePage data={bundle.haram} onBack={closeHaramLivePage} />;
  }

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F2F6F1] text-[#11261E]">
      {/* Strict 3-Zone Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#FAFBF7]/95 backdrop-blur-md border-b border-[#D4DDD2]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
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

          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-display font-bold text-[#354E44]">
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
            <button
              type="button"
              onClick={() => handleNavClick('population')}
              className="hover:text-[#134435] hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              التعداد السكاني
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('haram')}
              className="hover:text-[#134435] hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              الحرم المكي
            </button>
          </nav>

          <button
            type="button"
            onClick={loadLiveData}
            disabled={refreshing}
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

            <div className="flex flex-col items-start lg:items-end gap-1 shrink-0 text-xs font-body text-[#354E44]">
              <div className="font-display font-extrabold text-sm text-[#134435]">
                {bundle.dollar.cairoDateAr}
              </div>
              <div className="text-[#4B6359]">
                تحديث {bundle.dollar.cairoTimeAr} بتوقيت القاهرة
              </div>
            </div>
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
                    onClick={() => handleFilterChange(tab.id)}
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDriveModalOpen(true)}
                className="h-9 px-3.5 rounded-xl bg-[#134435] hover:bg-[#0B2D22] text-[#FAFBF7] font-display font-bold text-xs inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                <FolderUp className="w-3.5 h-3.5 text-[#F2CE74]" />
                <span>رفع المشروع إلى Drive</span>
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="h-9 px-3.5 rounded-xl bg-white border border-[#134435]/25 text-[#134435] hover:bg-[#EAF1EA] font-display font-bold text-xs inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#D7A134]" />
                <span>سجل اللقطات ({snapshots.length})</span>
              </button>
            </div>
          </div>
        </section>

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

          {(activeFilter === 'all' || activeFilter === 'population') && (
            <PopulationCard
              data={bundle.population}
              bundle={bundle}
              onPreview={setPreviewTool}
            />
          )}

          {(activeFilter === 'all' || activeFilter === 'haram') && (
            <HaramStatsCard
              data={bundle.haram}
              bundle={bundle}
              onPreview={setPreviewTool}
              onOpenHaramLive={openHaramLivePage}
            />
          )}
        </section>
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

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="text-xs font-body text-white/80 text-center sm:text-left">
              جميع البطاقات قابلة للتحميل يومياً كصورة ثابتة أو فيديو ريلز متحرك (10 ثوانٍ) بمقاس 9:16
            </div>
            <button
              type="button"
              onClick={() => setDriveModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-display font-extrabold text-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <FolderUp className="w-4 h-4 text-[#F2CE74]" />
              <span>رفع المشروع إلى Drive</span>
            </button>
            {typeof window !== 'undefined' && !window.location.hostname.endsWith('github.io') && (
              <a
                href="./gesour-github-pages.zip"
                download="gesour-github-pages.zip"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E0B347] hover:bg-[#f2ce74] text-[#0E2E24] font-display font-extrabold text-xs transition-colors whitespace-nowrap shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>تحميل المشروع مضغوط (ZIP)</span>
              </a>
            )}
          </div>
        </div>
      </footer>

      <ReelsPreviewModal
        toolId={previewTool}
        bundle={bundle}
        onClose={() => setPreviewTool(null)}
      />

      <SavedSnapshotsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        bundle={bundle}
      />

      <DriveUploadModal
        open={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
      />
    </div>
  );
}
