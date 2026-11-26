import React from 'react';

export const BankEmblem: React.FC<{bankId: string; shortCode: string; accentColor: string}> = ({
  bankId,
  shortCode,
  accentColor,
}) => {
  if (bankId === 'cbe') {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-[#D6A13C]/40 bg-[#FAF6E8]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <path d="M12 3L4 7V9H20V7L12 3Z" fill="#C6922C" />
          <path d="M6 10V17M10 10V17M14 10V17M18 10V17" stroke="#134435" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 19H20" stroke="#C6922C" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (bankId === 'cib') {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#0B4B88] text-white font-num text-[10px] font-extrabold tracking-tight"
        aria-hidden="true"
      >
        CIB
      </div>
    );
  }

  if (bankId === 'scb') {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#EEF4FB] border border-[#15549A]/20"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <path
            d="M3 14C5.5 11 8 11 10.5 14C13 17 15.5 17 18 14L21 11"
            stroke="#15549A"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M3 10C5.5 7 8 7 10.5 10C13 13 15.5 13 18 10"
            stroke="#2B7CD3"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-num text-[10px] font-extrabold tracking-tight shadow-xs"
      style={{backgroundColor: accentColor}}
      aria-hidden="true"
    >
      {shortCode.slice(0, 4)}
    </div>
  );
};

export const CurrencyBadge: React.FC<{code: string}> = ({code}) => {
  const palette: Record<string, {bg: string; text: string; symbol: string}> = {
    USD: {bg: '#134435', text: '#F2CE74', symbol: '$'},
    EUR: {bg: '#1B3F8B', text: '#FFD447', symbol: '€'},
    GBP: {bg: '#6C1D45', text: '#FFFFFF', symbol: '£'},
    SAR: {bg: '#0E6B3E', text: '#FFFFFF', symbol: 'ر.س'},
    AED: {bg: '#B8292F', text: '#FFFFFF', symbol: 'د.إ'},
    KWD: {bg: '#145A4A', text: '#FFFFFF', symbol: 'د.ك'},
    QAR: {bg: '#6E1839', text: '#FFFFFF', symbol: 'ر.ق'},
    JOD: {bg: '#1F3A32', text: '#F2CE74', symbol: 'د.أ'},
    CHF: {bg: '#C81E2B', text: '#FFFFFF', symbol: 'Fr'},
    CNY: {bg: '#B81D24', text: '#F7D252', symbol: '¥'},
  };

  const style = palette[code] || {bg: '#134435', text: '#FFFFFF', symbol: code};

  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-num text-xs font-extrabold shadow-xs"
      style={{backgroundColor: style.bg, color: style.text}}
      aria-hidden="true"
    >
      {style.symbol}
    </div>
  );
};

export const EgyptWeatherMapSvg: React.FC<{
  regions: Array<{id: string; maxTemp: number; minTemp: number; icon: string}>;
}> = ({regions}) => {
  const findTemp = (id: string) => regions.find((r) => r.id === id);
  const north = findTemp('north_coast');
  const cairo = findTemp('cairo_delta');
  const northUpper = findTemp('north_upper');
  const southUpper = findTemp('south_upper');

  return (
    <svg viewBox="0 0 220 200" className="w-full h-full max-h-[175px]" fill="none">
      {/* Egypt stylized territory silhouette matching Image 1 */}
      <path
        d="M28 24L95 26L112 18L138 24L154 22L168 38L165 56L179 74L162 84L174 114L198 158L192 172L34 172L32 72L22 46L28 24Z"
        fill="#B6CEC4"
        stroke="#2F594B"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Nile River & Delta lines */}
      <path
        d="M114 24C116 38 119 46 118 58C117 75 113 92 119 112C125 130 133 148 131 172"
        stroke="#4B7B6B"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M115 44L98 28M117 44L133 27" stroke="#4B7B6B" strokeWidth="1.6" strokeLinecap="round" />

      {/* Animated Sun & Cloud Icons on Map */}
      {/* North Coast */}
      <g className="animate-josour-float">
        <circle cx="82" cy="36" r="8" fill="#F2BE49" />
        <path
          d="M72 44H90C93 44 95 42 95 39C95 36.5 93 34.5 90.5 34.5C89.5 31.5 86.5 30 83 30C79.5 30 77 32.5 76.5 35.5C73.5 35.5 71 37.5 71 40.5C71 42.5 72 44 72 44Z"
          fill="#FFFFFF"
          stroke="#4A685D"
          strokeWidth="1.4"
        />
        {north && (
          <text x="58" y="42" fill="#134435" fontSize="11" fontWeight="800" className="font-num">
            {north.maxTemp}°
          </text>
        )}
      </g>

      {/* Cairo & Delta */}
      <g>
        <circle cx="122" cy="54" r="9" fill="#F2BE49" />
        {cairo && (
          <text x="134" y="59" fill="#134435" fontSize="12" fontWeight="800" className="font-num">
            {cairo.maxTemp}°
          </text>
        )}
      </g>

      {/* North Upper Egypt */}
      <g className="animate-josour-float" style={{animationDelay: '-3s'}}>
        <circle cx="94" cy="94" r="8" fill="#F2BE49" />
        <path
          d="M84 102H102C105 102 107 100 107 97.5C107 95 105 93 102.5 93C101.5 90 98.5 88.5 95 88.5C91.5 88.5 89 91 88.5 94C85.5 94 83 96 83 99C83 101 84 102 84 102Z"
          fill="#FFFFFF"
          stroke="#4A685D"
          strokeWidth="1.4"
        />
        {northUpper && (
          <text x="61" y="99" fill="#134435" fontSize="11" fontWeight="800" className="font-num">
            {northUpper.maxTemp}°
          </text>
        )}
      </g>

      {/* South Upper Egypt */}
      <g>
        <circle cx="122" cy="138" r="10" fill="#E69E28" />
        {southUpper && (
          <text x="137" y="143" fill="#134435" fontSize="12" fontWeight="800" className="font-num">
            {southUpper.maxTemp}°
          </text>
        )}
      </g>

      {/* Wind Swirl Lines */}
      <g className="animate-josour-wind" stroke="#4D7E6E" strokeWidth="1.6" strokeLinecap="round">
        <path d="M138 78H156C159 78 160 75 157 73" />
        <path d="M142 84H161" />
        <path d="M144 156H165C168 156 169 153 166 151" />
      </g>
    </svg>
  );
};
