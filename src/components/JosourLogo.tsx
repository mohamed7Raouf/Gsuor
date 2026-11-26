import React from 'react';

interface JosourLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const JosourLogo: React.FC<JosourLogoProps> = ({size = 'md', className = ''}) => {
  const sizeClasses = {
    sm: 'h-8 px-2.5 py-1 rounded-xl',
    md: 'h-11 px-3.5 py-1.5 rounded-2xl',
    lg: 'h-14 px-4 py-2 rounded-2xl',
  }[size];

  const imgHeight = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center bg-white border border-[#D4DDD2] shadow-xs select-none shrink-0 ${sizeClasses} ${className}`}
    >
      <img
        src="/assets/aistudio/logo_a3720299.webp"
        alt="شعار جسور"
        referrerPolicy="no-referrer"
        className={`${imgHeight} w-auto object-contain block`}
      />
    </div>
  );
};
