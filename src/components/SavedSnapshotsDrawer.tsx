import React, {useState} from 'react';
import {BookmarkPlus, Check, Trash2, X} from 'lucide-react';
import type {JosourLiveBundle, ToolId} from '../types/liveData';
import {useLocalStorageData} from './LocalStorageProvider';

interface SavedSnapshotsDrawerProps {
  open: boolean;
  onClose: () => void;
  bundle: JosourLiveBundle | null;
}

const TOOL_LABELS: Record<ToolId, string> = {
  dollar: 'الدولار في البنوك',
  weather: 'الأرصاد والطاقة',
  currencies: 'أسعار العملات',
  gold: 'أسعار الذهب',
  population: 'التعداد السكاني',
  haram: 'الحرم المكي',
};

export const SavedSnapshotsDrawer: React.FC<SavedSnapshotsDrawerProps> = ({
  open,
  onClose,
  bundle,
}) => {
  const {snapshots, saveSnapshot, deleteSnapshot} = useLocalStorageData();
  const [selectedTool, setSelectedTool] = useState<ToolId>('dollar');
  const [note, setNote] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!open) return null;

  const getToolSummary = (tool: ToolId) => {
    if (!bundle) {
      return {
        dateLabelAr: 'اليوم',
        headlineAr: TOOL_LABELS[tool],
        primaryMetric: '-',
      };
    }
    switch (tool) {
      case 'dollar': {
        const cbe = bundle.dollar.banks[0];
        return {
          dateLabelAr: bundle.dollar.cairoDateAr,
          headlineAr: 'أسعار الدولار في البنوك المصرية',
          primaryMetric: `شراء ${cbe?.buy.toFixed(2)} · بيع ${cbe?.sell.toFixed(2)} جنيه`,
        };
      }
      case 'weather':
        return {
          dateLabelAr: bundle.weather.cairoDateAr,
          headlineAr: 'توقعات الأرصاد ومؤشر الطاقة النظيفة',
          primaryMetric: `الطاقة النظيفة ${bundle.weather.cleanEnergyScorePct}% · الرياح ${bundle.weather.windSpeedMaxKmh} كم/س`,
        };
      case 'currencies': {
        const eur = bundle.currencies.currencies.find((c) => c.code === 'EUR');
        const sar = bundle.currencies.currencies.find((c) => c.code === 'SAR');
        return {
          dateLabelAr: bundle.currencies.cairoDateAr,
          headlineAr: 'أسعار العملات مقابل الجنيه',
          primaryMetric: `EUR ${eur?.sellEgp.toFixed(2) ?? '-'} · SAR ${sar?.sellEgp.toFixed(2) ?? '-'} جنيه`,
        };
      }
      case 'gold': {
        const k21 = bundle.gold.karats.find((k) => k.karat === '21');
        return {
          dateLabelAr: bundle.gold.cairoDateAr,
          headlineAr: 'أسعار الذهب في مصر',
          primaryMetric: `عيار 21: ${k21?.sellEgpPerGram.toLocaleString('en-US') ?? '-'} جنيه · الجنيه ${bundle.gold.goldPoundEgp.toLocaleString('en-US')}`,
        };
      }
      case 'population':
        return {
          dateLabelAr: bundle.population.cairoDateAr,
          headlineAr: 'التعداد السكاني في مصر لايف',
          primaryMetric: `${bundle.population.basePopulation.toLocaleString('en-US')} نسمة · +${bundle.population.dailyNetIncrease.toLocaleString('en-US')} اليوم`,
        };
      case 'haram':
        return {
          dateLabelAr: bundle.haram.hijriDateAr,
          headlineAr: 'إحصائيات الحرم المكي المباشرة',
          primaryMetric: `${bundle.haram.tempC}°C · القادمة ${bundle.haram.nextPrayerNameAr} (${bundle.haram.nextPrayerTime24})`,
        };
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bundle) return;
    const summary = getToolSummary(selectedTool);
    saveSnapshot({
      toolId: selectedTool,
      ...summary,
      note: note.trim(),
    });
    setNote('');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2D22]/75 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="الأرشيف المحلي للأسعار"
    >
      <div className="bg-[#FAFBF7] border border-[#C6D1C3] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="bg-[#134435] text-white px-5 py-3.5 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-base">سجل اللقطات المحفوظة</h3>
            <p className="font-body text-xs text-[#F2CE74]">محفوظ محلياً في متصفحك (LocalStorage)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {bundle && (
            <form
              onSubmit={handleSave}
              className="rounded-xl bg-white border border-[#D4DDD2] p-4 space-y-3"
            >
              <div className="font-display font-extrabold text-sm text-[#134435]">
                حفظ أسعار اللحظة الحالية في متصفحك
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(['dollar', 'weather', 'currencies', 'gold', 'population', 'haram'] as ToolId[]).map((tid) => (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => setSelectedTool(tid)}
                    className={`py-2 px-2 rounded-lg text-xs font-display font-bold border transition-colors cursor-pointer ${
                      selectedTool === tid
                        ? 'bg-[#134435] text-white border-[#134435]'
                        : 'bg-[#FAFBF7] text-[#354E44] border-[#D4DDD2] hover:bg-[#EAF1EA]'
                    }`}
                  >
                    {TOOL_LABELS[tid]}
                  </button>
                ))}
              </div>
              <input
                type="text"
                maxLength={240}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ملاحظة اختيارية (مثلاً: سعر قبل الشراء)"
                className="w-full h-10 px-3 rounded-lg border border-[#C6D1C3] text-xs font-body bg-[#FAFBF7] text-[#11261E]"
              />
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-[#134435] text-[#FAFBF7] hover:bg-[#0B2D22] font-display font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {savedNotice ? (
                  <>
                    <Check className="w-4 h-4 text-[#F2CE74]" />
                    <span>تم الحفظ محلياً في المتصفح</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4 text-[#F2CE74]" />
                    <span>حفظ لقطة اليوم الآن</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="space-y-2.5">
            <h4 className="font-display font-bold text-xs text-[#4B6359]">
              اللقطات المحفوظة ({snapshots.length})
            </h4>

            {snapshots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#C6D1C3] p-6 text-center text-xs font-body text-[#4B6359]">
                لا توجد لقطات محفوظة بعد. احفظ أسعار اليوم أعلاه للرجوع إليها في أي وقت من متصفحك.
              </div>
            ) : (
              snapshots.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-white border border-[#D4DDD2] p-3.5 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-[#6F7C3C] font-display font-bold">
                      <span>{TOOL_LABELS[item.toolId]}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.dateLabelAr}</span>
                    </div>
                    <div className="font-num font-extrabold text-sm text-[#134435]">
                      {item.primaryMetric}
                    </div>
                    {item.note && (
                      <p className="font-body text-xs text-[#354E44] break-words">{item.note}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSnapshot(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6E1839] hover:bg-red-50 shrink-0 cursor-pointer"
                    aria-label="حذف اللقطة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
