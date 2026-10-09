import React from 'react';
import { SponsorBannerState } from 'shared';

interface Props {
  sponsor: SponsorBannerState;
}

export const SponsorTakeoverOverlay: React.FC<Props> = ({ sponsor }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 z-35 animate-goal-pop">
      <div className="flex flex-col items-center bg-slate-900 border border-slate-700 p-10 rounded-3xl shadow-2xl max-w-xl text-center">
        <span className="text-xs font-bold text-sky-400 tracking-widest uppercase mb-4">
          OFFICIAL BROADCAST SPONSOR • អ្នកឧបត្ថម្ភការផ្សាយផ្ទាល់
        </span>
        {sponsor.logoUrl ? (
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            className="w-48 h-28 object-contain mb-4 rounded-xl bg-slate-800 p-2"
          />
        ) : (
          <div className="text-4xl font-black text-amber-400 mb-4">{sponsor.name}</div>
        )}
        <h2 className="text-2xl font-black text-white mb-2 font-['Kantumruy_Pro']">
          {sponsor.name}
        </h2>
        {sponsor.text && (
          <p className="text-slate-300 text-base max-w-md font-['Kantumruy_Pro']">{sponsor.text}</p>
        )}
      </div>
    </div>
  );
};
