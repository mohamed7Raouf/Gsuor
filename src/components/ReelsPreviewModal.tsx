import React, {useEffect, useRef, useState} from 'react';
import {Download, Film, Image as ImageIcon, X} from 'lucide-react';
import type {JosourLiveBundle, ToolId} from '../types/liveData';
import {
  ensureLogoLoaded,
  exportToolAsPng,
  exportToolAsReelsVideo,
  LOOP_DURATION_MS,
  REELS_HEIGHT,
  REELS_WIDTH,
  renderReelsFrame,
} from '../utils/reelsCanvasEngine';

interface ReelsPreviewModalProps {
  toolId: ToolId | null;
  bundle: JosourLiveBundle | null;
  onClose: () => void;
}

const TOOL_TITLES: Record<ToolId, string> = {
  dollar: 'معاينة ريلز: أسعار الدولار في البنوك المصرية',
  weather: 'معاينة ريلز: الأرصاد ومستقبل الطاقة النظيفة',
  currencies: 'معاينة ريلز: أسعار العملات مقابل الجنيه',
  gold: 'معاينة ريلز: أسعار الذهب كل العيارات',
};

export const ReelsPreviewModal: React.FC<ReelsPreviewModalProps> = ({
  toolId,
  bundle,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [exportingPng, setExportingPng] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!toolId || !bundle) return;
    let rafId = 0;
    let start = 0;
    let cancelled = false;

    const startLoop = async () => {
      await Promise.all([document.fonts.ready, ensureLogoLoaded()]);
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = (now: number) => {
        if (cancelled) return;
        if (!start) start = now;
        const elapsed = (now - start) % LOOP_DURATION_MS;
        renderReelsFrame(ctx, toolId, bundle, elapsed / LOOP_DURATION_MS);
        rafId = requestAnimationFrame(draw);
      };
      rafId = requestAnimationFrame(draw);
    };

    startLoop();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      abortRef.current?.abort();
    };
  }, [toolId, bundle]);

  if (!toolId || !bundle) return null;

  const handlePng = async () => {
    try {
      setExportingPng(true);
      await exportToolAsPng(toolId, bundle);
    } finally {
      setExportingPng(false);
    }
  };

  const handleVideo = async () => {
    if (videoProgress !== null) {
      abortRef.current?.abort();
      setVideoProgress(null);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setVideoProgress(0);
    try {
      await exportToolAsReelsVideo(toolId, bundle, (p) => setVideoProgress(p), ctrl.signal);
    } catch {
      // Cancelled or unsupported
    } finally {
      setVideoProgress(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B2D22]/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={TOOL_TITLES[toolId]}
    >
      <div className="bg-[#FAFBF7] border border-[#C6D1C3] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        <div className="flex items-center justify-between px-4 py-3 bg-[#134435] text-white">
          <h3 className="font-display font-bold text-sm truncate">{TOOL_TITLES[toolId]}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
            aria-label="إغلاق المعاينة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center overflow-y-auto gap-4 bg-[#EAF1EA]">
          <div className="relative w-full max-w-[300px] aspect-[9/16] rounded-xl overflow-hidden shadow-lg border border-[#134435]/20 bg-[#F6F8F2]">
            <canvas
              ref={canvasRef}
              width={REELS_WIDTH}
              height={REELS_HEIGHT}
              className="w-full h-full object-contain block"
            />
          </div>
          <p className="text-xs font-body text-[#375147] text-center">
            مقاس قياسي 1080×1920 (9:16) جاهز للريلز والستوري · حركة متصلة كل 10 ثوانٍ
          </p>
        </div>

        <div className="p-3 bg-white border-t border-[#D4DDD2] flex items-center gap-2">
          <button
            type="button"
            onClick={handlePng}
            disabled={exportingPng}
            className="flex-1 h-11 px-3 rounded-xl bg-[#FAFBF7] border border-[#134435]/25 text-[#134435] hover:bg-[#EAF1EA] font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>{exportingPng ? 'جاري التجهيز...' : 'تحميل صورة PNG'}</span>
          </button>
          <button
            type="button"
            onClick={handleVideo}
            className="flex-1 h-11 px-3 rounded-xl bg-[#134435] text-[#FAFBF7] hover:bg-[#0B2D22] font-display font-bold text-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            {videoProgress !== null ? (
              <>
                <Download className="w-4 h-4 shrink-0 animate-bounce" />
                <span>تسجيل 10ث ({videoProgress}%)</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4 shrink-0 text-[#F2CE74]" />
                <span>تحميل فيديو 10 ثواني</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
