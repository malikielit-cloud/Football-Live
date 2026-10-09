import React from 'react';
import { TickerState } from 'shared';

interface Props {
  ticker: TickerState;
}

export const TickerBannerOverlay: React.FC<Props> = ({ ticker }) => {
  if (!ticker.visible || !ticker.text) return null;

  const isRTL = ticker.direction === 'rtl';

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-9 overflow-hidden flex items-center z-20 border-t border-slate-800"
      style={{
        backgroundColor: ticker.backgroundColor || '#0f172a',
        opacity: ticker.opacity ?? 0.95,
      }}
    >
      <div className="bg-sky-500 text-slate-950 font-black text-xs px-3 h-full flex items-center shrink-0 tracking-wider">
        INFO ព័ត៌មាន
      </div>
      <div className="overflow-hidden whitespace-nowrap w-full">
        <div
          className={isRTL ? 'animate-ticker-rtl' : 'animate-ticker-ltr'}
          style={{
            color: ticker.textColor || '#ffffff',
            fontSize: `${ticker.fontSize || 15}px`,
            fontFamily: "'Inter', 'Kantumruy Pro', sans-serif",
          }}
        >
          {ticker.text}
        </div>
      </div>
    </div>
  );
};
