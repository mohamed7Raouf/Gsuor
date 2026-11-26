import type {JosourLiveBundle, ToolId} from '../types/liveData';

export const REELS_WIDTH = 1080;
export const REELS_HEIGHT = 1920;
export const LOOP_DURATION_MS = 10_000;

let cachedLogoImg: HTMLImageElement | null = null;
let logoLoadPromise: Promise<HTMLImageElement | null> | null = null;

export function ensureLogoLoaded(): Promise<HTMLImageElement | null> {
  if (cachedLogoImg && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
    return Promise.resolve(cachedLogoImg);
  }
  if (logoLoadPromise) return logoLoadPromise;

  logoLoadPromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedLogoImg = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = '/assets/aistudio/logo_a3720299.webp';
  });
  return logoLoadPromise;
}

// Kick off eager preload in browser
if (typeof window !== 'undefined') {
  ensureLogoLoaded();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawJosourLogoWithWhiteBg(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  scale: number,
) {
  const boxW = Math.round(310 * scale);
  const boxH = Math.round(108 * scale);
  const boxX = centerX - boxW / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(19, 68, 53, 0.14)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#FFFFFF';
  roundRectPath(ctx, boxX, topY, boxW, boxH, 24 * scale);
  ctx.fill();
  ctx.strokeStyle = 'rgba(19, 68, 53, 0.14)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  if (cachedLogoImg && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
    const padX = 24 * scale;
    const padY = 14 * scale;
    const drawW = boxW - padX * 2;
    const drawH = boxH - padY * 2;
    ctx.drawImage(cachedLogoImg, boxX + padX, topY + padY, drawW, drawH);
    return;
  }

  // Fallback geometric draw matching exact logo_a3720299.webp proportions
  ctx.save();
  ctx.translate(centerX - 139 * scale, topY + 14 * scale);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#2F4D40';
  roundRectPath(ctx, 10, 8, 258, 64, 10);
  ctx.fill();
  ctx.restore();
}

function drawBaseCanvasBackground(ctx: CanvasRenderingContext2D, t: number) {
  const grad = ctx.createLinearGradient(0, 0, REELS_WIDTH, REELS_HEIGHT);
  grad.addColorStop(0, '#E3ECE2');
  grad.addColorStop(0.45, '#F6F8F2');
  grad.addColorStop(1, '#DCE8DC');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, REELS_WIDTH, REELS_HEIGHT);

  const phase = t * Math.PI * 2;
  const driftY = Math.sin(phase) * 34;
  const driftX = Math.cos(phase) * 28;

  // Ambient glow circles
  const g1 = ctx.createRadialGradient(860 + driftX, 260 + driftY, 20, 860 + driftX, 260 + driftY, 390);
  g1.addColorStop(0, 'rgba(224, 179, 71, 0.24)');
  g1.addColorStop(1, 'rgba(224, 179, 71, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, REELS_WIDTH, REELS_HEIGHT);

  const g2 = ctx.createRadialGradient(180 - driftX, 1420 - driftY, 20, 180 - driftX, 1420 - driftY, 460);
  g2.addColorStop(0, 'rgba(19, 68, 53, 0.14)');
  g2.addColorStop(1, 'rgba(19, 68, 53, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, REELS_WIDTH, REELS_HEIGHT);

  // Richer animated motion-graphic geometric shapes across background
  ctx.save();
  ctx.strokeStyle = 'rgba(19, 68, 53, 0.14)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(140 + driftX * 0.7, 210 + driftY * 0.6, 98 + Math.sin(phase) * 12, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(224, 179, 71, 0.30)';
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 12]);
  ctx.lineDashOffset = -t * 220;
  ctx.beginPath();
  ctx.arc(140 + driftX * 0.7, 210 + driftY * 0.6, 134, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(19, 68, 53, 0.12)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(950 - driftX * 0.6, 420 - driftY * 0.5, 78 + Math.cos(phase) * 8, 0, Math.PI * 2);
  ctx.stroke();

  const shapes = [
    {x: 90, y: 560, size: 26, speed: 1},
    {x: 990, y: 780, size: 30, speed: -1},
    {x: 80, y: 1120, size: 24, speed: 1},
    {x: 1005, y: 1350, size: 28, speed: -1},
    {x: 160, y: 1650, size: 24, speed: 1},
    {x: 920, y: 1680, size: 26, speed: -1},
  ];
  shapes.forEach((s, i) => {
    const sy = s.y + Math.sin(phase + i * 1.3) * 26;
    const sx = s.x + Math.cos(phase + i * 0.9) * 16;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(phase * s.speed + i);
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(224, 179, 71, 0.36)' : 'rgba(19, 68, 53, 0.18)';
    ctx.lineWidth = 3;
    ctx.strokeRect(-s.size / 2, -s.size / 2, s.size, s.size);
    ctx.restore();
  });

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 3.5;
  for (let w = 0; w < 4; w++) {
    const wy = 400 + w * 400 + Math.sin(phase + w) * 26;
    ctx.beginPath();
    ctx.moveTo(0, wy);
    ctx.bezierCurveTo(360, wy - 55, 720, wy + 55, REELS_WIDTH, wy - 12);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDatePill(ctx: CanvasRenderingContext2D, dateAr: string, y: number, t: number) {
  const pillW = 640;
  const pillH = 68;
  const pillX = (REELS_WIDTH - pillW) / 2;
  const floatY = Math.sin(t * Math.PI * 2) * 6;

  ctx.save();
  ctx.translate(0, floatY);
  ctx.shadowColor = 'rgba(19, 68, 53, 0.16)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;

  const goldGrad = ctx.createLinearGradient(pillX, y, pillX + pillW, y);
  goldGrad.addColorStop(0, '#DFAA3E');
  goldGrad.addColorStop(0.5, '#F5D57E');
  goldGrad.addColorStop(1, '#DDA63A');
  ctx.fillStyle = goldGrad;
  roundRectPath(ctx, pillX, y, pillW, pillH, 34);
  ctx.fill();

  ctx.clip();
  const shimmerX = pillX + ((t * 1.6) % 1.6 - 0.3) * pillW;
  const sh = ctx.createLinearGradient(shimmerX - 90, y, shimmerX + 90, y);
  sh.addColorStop(0, 'rgba(255,255,255,0)');
  sh.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(pillX, y, pillW, pillH);
  ctx.restore();

  ctx.fillStyle = '#11261E';
  ctx.font = '800 32px Cairo, Tajawal, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(dateAr, REELS_WIDTH / 2, y + pillH / 2 + 2 + floatY);
}

function drawTitleBanner(
  ctx: CanvasRenderingContext2D,
  mainTitle: string,
  subTitle: string,
  y: number,
  t: number,
) {
  const breathe = 1 + Math.sin(t * Math.PI * 2) * 0.02;
  ctx.save();
  ctx.translate(REELS_WIDTH / 2, y + 100);
  ctx.scale(breathe, breathe);
  ctx.translate(-REELS_WIDTH / 2, -(y + 100));

  ctx.shadowColor = 'rgba(11, 45, 34, 0.24)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;

  const grad = ctx.createLinearGradient(120, y, 960, y + 205);
  grad.addColorStop(0, '#0D3B2C');
  grad.addColorStop(0.5, '#17523F');
  grad.addColorStop(1, '#0D3B2C');
  ctx.fillStyle = grad;
  roundRectPath(ctx, 115, y, 850, 200, 62);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(REELS_WIDTH / 2, y + 100);
  ctx.scale(breathe, breathe);
  ctx.translate(-REELS_WIDTH / 2, -(y + 100));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 72px Cairo, Tajawal, sans-serif';
  ctx.fillText(mainTitle, REELS_WIDTH / 2, y + 76);

  ctx.fillStyle = '#F2CE74';
  ctx.font = '800 42px Cairo, Tajawal, sans-serif';
  ctx.fillText(subTitle, REELS_WIDTH / 2, y + 148);
  ctx.restore();
}

function drawDollarFrame(ctx: CanvasRenderingContext2D, bundle: JosourLiveBundle, t: number) {
  const {dollar} = bundle;
  drawBaseCanvasBackground(ctx, t);

  const phase = t * Math.PI * 2;
  // Animated rising financial chart bars in background
  ctx.save();
  for (let b = 0; b < 6; b++) {
    const bh = 44 + b * 24 + Math.sin(phase + b * 0.8) * 18;
    ctx.fillStyle = 'rgba(19, 68, 53, 0.11)';
    roundRectPath(ctx, 795 + b * 36, 225 - bh, 22, bh, 6);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(19, 68, 53, 0.22)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(790, 210);
  ctx.lineTo(860, 155 + Math.sin(phase) * 10);
  ctx.lineTo(915, 172 + Math.cos(phase) * 10);
  ctx.lineTo(995, 85 + Math.sin(phase) * 12);
  ctx.stroke();
  ctx.restore();

  // Top Logo ONLY with crisp white background
  drawJosourLogoWithWhiteBg(ctx, REELS_WIDTH / 2, 46 + Math.sin(phase) * 6, 1.0);

  // Title Cloud Banner
  drawTitleBanner(ctx, 'أسعار الدولار', 'في البنوك المصرية اليوم', 184, t);

  // Date Pill
  drawDatePill(ctx, dollar.cairoDateAr, 408, t);

  // Table Header Row
  const tableX = 56;
  const tableW = REELS_WIDTH - 112;
  const headerY = 508;
  const headerH = 92;

  ctx.save();
  ctx.fillStyle = '#134435';
  roundRectPath(ctx, tableX, headerY, tableW, headerH, 24);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 30px Cairo, Tajawal, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  ctx.fillText('البنك', tableX + tableW - 36, headerY + headerH / 2);

  ctx.textAlign = 'center';
  ctx.fillText('سعر الشراء (جنيه)', tableX + 340, headerY + 34);
  ctx.fillStyle = '#F2CE74';
  ctx.font = '600 20px Cairo, Tajawal, sans-serif';
  ctx.fillText('تحديث مباشر', tableX + 340, headerY + 66);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 30px Cairo, Tajawal, sans-serif';
  ctx.fillText('سعر البيع (جنيه)', tableX + 130, headerY + 34);
  ctx.fillStyle = '#F2CE74';
  ctx.font = '600 20px Cairo, Tajawal, sans-serif';
  ctx.fillText('تحديث مباشر', tableX + 130, headerY + 66);
  ctx.restore();

  // 9 Bank Rows — NO bank icons, compact full bank names clearly displayed, stronger animation
  const activeIdx = Math.floor(t * dollar.banks.length) % dollar.banks.length;
  const startY = 616;
  const rowH = 104;
  const gap = 12;

  dollar.banks.forEach((bank, idx) => {
    const ry = startY + idx * (rowH + gap);
    const nudgeX = Math.sin(phase + idx * 0.65) * 9;
    const isHighlighted = idx === activeIdx;

    ctx.save();
    ctx.translate(nudgeX, 0);
    ctx.shadowColor = 'rgba(19, 68, 53, 0.08)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = isHighlighted ? '#FFF9E8' : '#FAFBF7';
    roundRectPath(ctx, tableX, ry, tableW, rowH, 24);
    ctx.fill();

    ctx.strokeStyle = isHighlighted ? '#E0B347' : 'rgba(19, 68, 53, 0.14)';
    ctx.lineWidth = isHighlighted ? 3.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = '#11261E';
    ctx.font = '800 26px Cairo, Tajawal, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(bank.nameAr, tableX + tableW - 30, ry + rowH / 2 + 2);

    ctx.fillStyle = '#134435';
    ctx.font = '900 38px Cairo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(bank.buy.toFixed(2), tableX + 340, ry + rowH / 2 + 3);

    ctx.fillStyle = '#11261E';
    ctx.fillText(bank.sell.toFixed(2), tableX + 130, ry + rowH / 2 + 3);
    ctx.restore();
  });

  ctx.save();
  ctx.strokeStyle = '#C79B3B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(110, 1730);
  ctx.lineTo(320, 1730);
  ctx.moveTo(760, 1730);
  ctx.lineTo(970, 1730);
  ctx.stroke();

  ctx.fillStyle = '#134435';
  ctx.font = '800 30px Cairo, Tajawal, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('جميع الأسعار بالجنيه المصري', REELS_WIDTH / 2, 1732);
  ctx.restore();
  // Bottom left empty cleanly
}

function drawWeatherFrame(ctx: CanvasRenderingContext2D, bundle: JosourLiveBundle, t: number) {
  const {weather} = bundle;
  drawBaseCanvasBackground(ctx, t);
  const phase = t * Math.PI * 2;

  // Top Logo ONLY with white background
  drawJosourLogoWithWhiteBg(ctx, REELS_WIDTH / 2, 42 + Math.sin(phase) * 6, 1.0);
  ctx.fillStyle = '#134435';
  ctx.font = '800 38px Cairo, Tajawal, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('مستقبل الطاقة النظيفة في مصر', REELS_WIDTH / 2, 198 + Math.sin(phase) * 3);

  const drawSectionCard = (
    x: number,
    y: number,
    w: number,
    h: number,
    tabTitle: string,
    cardFloat: number,
  ) => {
    const cy = y + cardFloat;
    ctx.save();
    ctx.shadowColor = 'rgba(19, 68, 53, 0.08)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FAFBF7';
    roundRectPath(ctx, x, cy, w, h, 34);
    ctx.fill();
    ctx.strokeStyle = '#C6D1C3';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    const tabW = Math.min(w - 60, Math.max(300, tabTitle.length * 20 + 70));
    const tabX = x + w - tabW - 26;
    const tabY = cy - 26;
    ctx.fillStyle = '#6F7C3C';
    roundRectPath(ctx, tabX, tabY, tabW, 54, 27);
    ctx.fill();

    ctx.fillStyle = '#FAFBF7';
    ctx.font = '800 28px Cairo, Tajawal, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tabTitle, tabX + tabW / 2, tabY + 28);
    return cy;
  };

  // Card 1: Regional Weather + Egypt Map
  const c1y = drawSectionCard(
    56,
    274,
    968,
    530,
    'حالة الطقس المتوقعة اليوم وغداً',
    Math.sin(phase) * 7,
  );

  ctx.save();
  ctx.translate(92, c1y + 58);
  ctx.scale(1.68, 1.88);
  ctx.fillStyle = '#B6CEC4';
  ctx.strokeStyle = '#2F594B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(28, 24);
  ctx.lineTo(95, 26);
  ctx.lineTo(112, 18);
  ctx.lineTo(138, 24);
  ctx.lineTo(154, 22);
  ctx.lineTo(168, 38);
  ctx.lineTo(165, 56);
  ctx.lineTo(179, 74);
  ctx.lineTo(162, 84);
  ctx.lineTo(174, 114);
  ctx.lineTo(198, 158);
  ctx.lineTo(192, 172);
  ctx.lineTo(34, 172);
  ctx.lineTo(32, 72);
  ctx.lineTo(22, 46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const sunPulse = 1 + 0.22 * Math.sin(phase);
  ctx.fillStyle = '#F2BE49';
  ctx.beginPath();
  ctx.arc(124, 54, 9 * sunPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(124, 138, 10 * sunPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  let ry = c1y + 84;
  weather.regions.forEach((reg, idx) => {
    const rxOffset = Math.sin(phase + idx * 0.8) * 8;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#11261E';
    ctx.font = '800 32px Cairo, Tajawal, sans-serif';
    ctx.fillText(`${reg.nameAr}: °${reg.minTemp} إلى °${reg.maxTemp}`, 980 + rxOffset, ry);
    ctx.fillStyle = '#4B6359';
    ctx.font = '600 24px Cairo, Tajawal, sans-serif';
    ctx.fillText(reg.conditionAr, 980 + rxOffset, ry + 36);
    ry += 105;
  });

  // Card 2: Wind & Clean Energy Future
  const c2y = drawSectionCard(
    56,
    868,
    968,
    275,
    'توقعات الأجواء ومستقبل الطاقة',
    Math.sin(phase + 1) * 7,
  );

  const bladeAngle = t * Math.PI * 6;
  ctx.save();
  const drawTurbine = (tx: number, ty: number, scale: number) => {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#134435';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 88);
    ctx.stroke();

    ctx.rotate(bladeAngle);
    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.fillStyle = '#2F594B';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-6, -42);
      ctx.lineTo(4, -46);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };
  drawTurbine(920, c2y + 105, 1.0);
  drawTurbine(855, c2y + 125, 0.78);
  ctx.restore();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#11261E';
  ctx.font = '800 34px Cairo, Tajawal, sans-serif';
  ctx.fillText(weather.windStatusAr, 790, c2y + 80);
  ctx.font = '800 32px Cairo, Tajawal, sans-serif';
  ctx.fillStyle = '#134435';
  ctx.fillText(
    `سرعة الرياح: ${weather.windSpeedMinKmh} إلى ${weather.windSpeedMaxKmh} كم/ساعة`,
    790,
    c2y + 140,
  );
  ctx.fillStyle = '#6F7C3C';
  ctx.font = '800 27px Cairo, Tajawal, sans-serif';
  ctx.fillText(
    `مؤشر كفاءة الطاقة النظيفة اليوم: ${weather.cleanEnergyScorePct}% (${weather.solarRadiationWm2} واط/م²)`,
    790,
    c2y + 202,
  );

  const arrowOffset = Math.sin(phase) * 38;
  ctx.fillStyle = '#2F594B';
  for (let i = 0; i < 4; i++) {
    const ax = 120 + i * 75 + arrowOffset;
    ctx.fillRect(ax, c2y + 144, 34, 5);
  }

  // Card 3: Rain Probabilities
  const c3y = drawSectionCard(56, 1210, 968, 225, 'فرص أمطار خفيفة', Math.sin(phase + 2) * 7);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#11261E';
  ctx.font = '800 31px Cairo, Tajawal, sans-serif';
  ctx.fillText(weather.rainSummaryAr, 970, c3y + 100);
  ctx.fillStyle = '#4B6359';
  ctx.font = '700 26px Cairo, Tajawal, sans-serif';
  ctx.fillText(`نسبة الهطول القصوى المتوقعة: ${weather.rainChancePct}%`, 970, c3y + 158);

  ctx.save();
  ctx.translate(0, Math.sin(phase) * 7);
  ctx.fillStyle = '#C7D9D1';
  ctx.beginPath();
  ctx.arc(165, c3y + 90, 34, 0, Math.PI * 2);
  ctx.arc(205, c3y + 97, 26, 0, Math.PI * 2);
  ctx.arc(130, c3y + 100, 24, 0, Math.PI * 2);
  ctx.fill();
  const rainFall = (t * 60) % 24;
  ctx.strokeStyle = '#2F6E7A';
  ctx.lineWidth = 4;
  for (let d = 0; d < 4; d++) {
    ctx.beginPath();
    ctx.moveTo(130 + d * 24, c3y + 130 + rainFall);
    ctx.lineTo(122 + d * 24, c3y + 152 + rainFall);
    ctx.stroke();
  }
  ctx.restore();

  // Card 4: Sea Conditions
  const c4y = drawSectionCard(56, 1505, 968, 245, 'حالة البحرين', Math.sin(phase + 3) * 7);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#11261E';
  ctx.font = '800 31px Cairo, Tajawal, sans-serif';
  ctx.fillText(
    `البحر المتوسط: ${weather.mediterraneanStateAr} (${weather.mediterraneanWaveM})`,
    970,
    c4y + 102,
  );
  ctx.fillText(`البحر الأحمر: ${weather.redSeaStateAr} (${weather.redSeaWaveM})`, 970, c4y + 170);

  const waveShift = Math.sin(phase) * 20;
  ctx.save();
  ctx.strokeStyle = '#1A6D8A';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(95 + waveShift, c4y + 128);
  ctx.quadraticCurveTo(135 + waveShift, c4y + 90, 175 + waveShift, c4y + 128);
  ctx.quadraticCurveTo(215 + waveShift, c4y + 166, 255 + waveShift, c4y + 128);
  ctx.stroke();
  ctx.restore();
  // Bottom left empty cleanly
}

function drawCurrenciesFrame(ctx: CanvasRenderingContext2D, bundle: JosourLiveBundle, t: number) {
  const {currencies} = bundle;
  drawBaseCanvasBackground(ctx, t);
  const phase = t * Math.PI * 2;

  // Top Logo ONLY with crisp white background
  drawJosourLogoWithWhiteBg(ctx, REELS_WIDTH / 2, 46 + Math.sin(phase) * 6, 1.0);
  drawTitleBanner(ctx, 'أسعار العملات', 'مقابل الجنيه المصري اليوم', 184, t);
  drawDatePill(ctx, currencies.cairoDateAr, 408, t);

  const tableX = 56;
  const tableW = REELS_WIDTH - 112;
  const headerY = 508;
  const headerH = 90;

  ctx.fillStyle = '#134435';
  roundRectPath(ctx, tableX, headerY, tableW, headerH, 24);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 30px Cairo, Tajawal, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  ctx.fillText('العملة', tableX + tableW - 36, headerY + headerH / 2);
  ctx.textAlign = 'center';
  ctx.fillText('الشراء (جنيه)', tableX + 345, headerY + headerH / 2);
  ctx.fillText('البيع (جنيه)', tableX + 135, headerY + headerH / 2);

  // Currency rows — NO icons next to currencies, stronger motion
  const activeIdx = Math.floor(t * currencies.currencies.length) % currencies.currencies.length;
  const startY = 614;
  const rowH = 98;
  const gap = 12;

  currencies.currencies.slice(0, 10).forEach((cur, idx) => {
    const ry = startY + idx * (rowH + gap);
    const nudgeX = Math.sin(phase + idx * 0.65) * 9;
    const isHighlighted = idx === activeIdx;

    ctx.save();
    ctx.translate(nudgeX, 0);
    ctx.fillStyle = isHighlighted ? '#FFF9E8' : '#FAFBF7';
    roundRectPath(ctx, tableX, ry, tableW, rowH, 22);
    ctx.fill();
    ctx.strokeStyle = isHighlighted ? '#E0B347' : 'rgba(19, 68, 53, 0.14)';
    ctx.lineWidth = isHighlighted ? 3.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = '#11261E';
    ctx.font = '800 30px Cairo, Tajawal, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${cur.nameAr} (${cur.code})`, tableX + tableW - 32, ry + rowH / 2 + 2);

    ctx.fillStyle = '#134435';
    ctx.font = '900 36px Cairo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(cur.buyEgp.toFixed(2), tableX + 345, ry + rowH / 2 + 2);

    ctx.fillStyle = '#11261E';
    ctx.fillText(cur.sellEgp.toFixed(2), tableX + 135, ry + rowH / 2 + 2);
    ctx.restore();
  });
  // Bottom left empty cleanly
}

function drawGoldFrame(ctx: CanvasRenderingContext2D, bundle: JosourLiveBundle, t: number) {
  const {gold} = bundle;
  drawBaseCanvasBackground(ctx, t);
  const phase = t * Math.PI * 2;

  // Top Logo ONLY with crisp white background
  drawJosourLogoWithWhiteBg(ctx, REELS_WIDTH / 2, 46 + Math.sin(phase) * 6, 1.0);
  drawTitleBanner(ctx, 'أسعار الذهب في مصر', 'جميع الأعيرة والجنيه الذهب اليوم', 184, t);
  drawDatePill(ctx, gold.cairoDateAr, 408, t);

  const cardY = 508;
  const cardH = 220;

  ctx.save();
  ctx.translate(0, Math.sin(phase) * 8);
  const ounceGrad = ctx.createLinearGradient(56, cardY, 520, cardY + cardH);
  ounceGrad.addColorStop(0, '#134435');
  ounceGrad.addColorStop(1, '#0C2D22');
  ctx.fillStyle = ounceGrad;
  roundRectPath(ctx, 56, cardY, 468, cardH, 28);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#F2CE74';
  ctx.font = '800 28px Cairo, Tajawal, sans-serif';
  ctx.fillText('سعر الأونصة العالمية', 290, cardY + 56);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 50px Cairo, monospace';
  ctx.fillText(`$${gold.spotOunceUsd.toLocaleString('en-US')}`, 290, cardY + 126);
  ctx.fillStyle = '#D2E2D8';
  ctx.font = '700 24px Cairo, monospace';
  ctx.fillText(`${gold.spotOunceEgp.toLocaleString('en-US')} جنيه`, 290, cardY + 180);
  ctx.restore();

  ctx.save();
  ctx.translate(0, Math.sin(phase + 1.4) * 8);
  const poundGrad = ctx.createLinearGradient(556, cardY, 1024, cardY + cardH);
  poundGrad.addColorStop(0, '#D7A134');
  poundGrad.addColorStop(0.5, '#F2CF76');
  poundGrad.addColorStop(1, '#CE962C');
  ctx.fillStyle = poundGrad;
  roundRectPath(ctx, 556, cardY, 468, cardH, 28);
  ctx.fill();

  ctx.fillStyle = '#11261E';
  ctx.font = '800 28px Cairo, Tajawal, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('سعر الجنيه الذهب (8 جرام)', 790, cardY + 56);
  ctx.font = '900 54px Cairo, monospace';
  ctx.fillText(`${gold.goldPoundEgp.toLocaleString('en-US')}`, 790, cardY + 126);
  ctx.font = '800 26px Cairo, Tajawal, sans-serif';
  ctx.fillText('جنيه مصري (عيار 21)', 790, cardY + 180);
  ctx.restore();

  const tableX = 56;
  const tableW = REELS_WIDTH - 112;
  const headerY = 762;
  const headerH = 90;
  ctx.fillStyle = '#134435';
  roundRectPath(ctx, tableX, headerY, tableW, headerH, 24);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 30px Cairo, Tajawal, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  ctx.fillText('العيار', tableX + tableW - 44, headerY + headerH / 2);
  ctx.textAlign = 'center';
  ctx.fillText('سعر الشراء (جنيه)', tableX + 355, headerY + headerH / 2);
  ctx.fillText('سعر البيع (جنيه)', tableX + 140, headerY + headerH / 2);

  const activeIdx = Math.floor(t * gold.karats.length) % gold.karats.length;
  const startY = 870;
  const rowH = 148;
  const gap = 16;

  gold.karats.forEach((k, idx) => {
    const ry = startY + idx * (rowH + gap);
    const nudgeX = Math.sin(phase + idx * 0.7) * 9;
    const isHighlighted = idx === activeIdx || k.featured;

    ctx.save();
    ctx.translate(nudgeX, 0);
    ctx.fillStyle = k.featured ? '#FFF6DB' : isHighlighted ? '#FFFDF5' : '#FAFBF7';
    roundRectPath(ctx, tableX, ry, tableW, rowH, 26);
    ctx.fill();
    ctx.strokeStyle = k.featured ? '#D7A134' : 'rgba(19, 68, 53, 0.16)';
    ctx.lineWidth = k.featured ? 3.5 : 1.5;
    ctx.stroke();

    const badgeX = tableX + tableW - 108;
    const badgeScale = isHighlighted ? 1.12 : 1 + Math.sin(phase + idx) * 0.06;
    ctx.save();
    ctx.translate(badgeX + 38, ry + rowH / 2);
    ctx.scale(badgeScale, badgeScale);
    ctx.translate(-(badgeX + 38), -(ry + rowH / 2));
    const gGrad = ctx.createLinearGradient(badgeX, ry + 34, badgeX + 76, ry + 114);
    gGrad.addColorStop(0, '#E8BA4D');
    gGrad.addColorStop(1, '#B9821E');
    ctx.fillStyle = gGrad;
    roundRectPath(ctx, badgeX, ry + 34, 76, 80, 16);
    ctx.fill();

    ctx.fillStyle = '#11261E';
    ctx.font = '900 30px Cairo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(k.karat, badgeX + 38, ry + rowH / 2 + 2);
    ctx.restore();

    ctx.textAlign = 'right';
    ctx.fillStyle = '#11261E';
    ctx.font = '800 32px Cairo, Tajawal, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(k.labelAr, badgeX - 20, ry + rowH / 2 + 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#134435';
    ctx.font = '900 44px Cairo, monospace';
    ctx.fillText(k.buyEgpPerGram.toLocaleString('en-US'), tableX + 355, ry + rowH / 2 + 2);

    ctx.fillStyle = '#11261E';
    ctx.fillText(k.sellEgpPerGram.toLocaleString('en-US'), tableX + 140, ry + rowH / 2 + 2);
    ctx.restore();
  });

  ctx.fillStyle = '#134435';
  ctx.font = '700 24px Cairo, Tajawal, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('الأسعار بدون مصنعية أو دمغة', REELS_WIDTH / 2, 1730);
  // Bottom left empty cleanly
}

export function renderReelsFrame(
  ctx: CanvasRenderingContext2D,
  toolId: ToolId,
  bundle: JosourLiveBundle,
  t: number,
) {
  switch (toolId) {
    case 'dollar':
      drawDollarFrame(ctx, bundle, t);
      break;
    case 'weather':
      drawWeatherFrame(ctx, bundle, t);
      break;
    case 'currencies':
      drawCurrenciesFrame(ctx, bundle, t);
      break;
    case 'gold':
      drawGoldFrame(ctx, bundle, t);
      break;
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export async function exportToolAsPng(toolId: ToolId, bundle: JosourLiveBundle): Promise<void> {
  await Promise.all([document.fonts.ready, ensureLogoLoaded()]);
  const canvas = document.createElement('canvas');
  canvas.width = REELS_WIDTH;
  canvas.height = REELS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  renderReelsFrame(ctx, toolId, bundle, 0.25);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png', 1.0);
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(blob, `josour-${toolId}-story-${dateStamp}.png`);
}

function pickBestVideoMimeType(): {mimeType: string; ext: string} {
  const candidates = [
    {mimeType: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4'},
    {mimeType: 'video/mp4', ext: 'mp4'},
    {mimeType: 'video/webm;codecs=vp9', ext: 'webm'},
    {mimeType: 'video/webm;codecs=vp8', ext: 'webm'},
    {mimeType: 'video/webm', ext: 'webm'},
  ];

  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return {mimeType: 'video/webm', ext: 'webm'};
}

export async function exportToolAsReelsVideo(
  toolId: ToolId,
  bundle: JosourLiveBundle,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<{ext: string}> {
  await Promise.all([document.fonts.ready, ensureLogoLoaded()]);
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('متصفحك لا يدعم تسجيل الفيديو المباشر');
  }

  const canvas = document.createElement('canvas');
  canvas.width = REELS_WIDTH;
  canvas.height = REELS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const {mimeType, ext} = pickBestVideoMimeType();
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<{ext: string}>((resolve, reject) => {
    let rafId = 0;
    let startTime = 0;
    let aborted = false;

    const cleanup = () => {
      cancelAnimationFrame(rafId);
      stream.getTracks().forEach((tr) => tr.stop());
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        aborted = true;
        cleanup();
        if (recorder.state !== 'inactive') recorder.stop();
        reject(new Error('تم إلغاء تصدير الفيديو'));
      });
    }

    recorder.onstop = () => {
      cleanup();
      if (aborted) return;
      const blob = new Blob(chunks, {type: mimeType});
      const dateStamp = new Date().toISOString().slice(0, 10);
      triggerBlobDownload(blob, `josour-${toolId}-reels-10s-${dateStamp}.${ext}`);
      onProgress(100);
      resolve({ext});
    };

    recorder.onerror = () => {
      cleanup();
      reject(new Error('حدث خطأ أثناء تسجيل فيديو الريلز'));
    };

    renderReelsFrame(ctx, toolId, bundle, 0);
    recorder.start(250);

    const step = (now: number) => {
      if (aborted) return;
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / LOOP_DURATION_MS);

      renderReelsFrame(ctx, toolId, bundle, progress);
      onProgress(Math.min(99, Math.round(progress * 100)));

      if (elapsed < LOOP_DURATION_MS) {
        rafId = requestAnimationFrame(step);
      } else {
        if (recorder.state !== 'inactive') recorder.stop();
      }
    };

    rafId = requestAnimationFrame(step);
  });
}
