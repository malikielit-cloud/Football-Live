import React from 'react';
import { MatchState } from 'shared';

interface Props {
  state: MatchState;
  title: string;
}

export const PeriodBannerOverlay: React.FC<Props> = ({ state, title }) => {
  const { homeTeam, awayTeam, homeScore, awayScore, tournamentName } = state;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm z-30">
      <div className="bg-slate-900 border-2 border-sky-500/50 rounded-2xl p-8 shadow-2xl max-w-2xl w-full mx-4 flex flex-col items-center">
        <div className="text-sky-400 font-extrabold text-sm tracking-widest uppercase mb-1 font-['Kantumruy_Pro']">
          {tournamentName}
        </div>
        <div className="text-2xl font-black text-white tracking-wider mb-6 border-b border-slate-700 pb-2">
          {title}
        </div>

        <div className="flex items-center justify-between w-full px-8">
          {/* Home */}
          <div className="flex flex-col items-center space-y-2 flex-1">
            {homeTeam.logo && (
              <img src={homeTeam.logo} alt={homeTeam.name} className="w-16 h-16 object-contain" />
            )}
            <span className="font-bold text-xl text-white text-center font-['Kantumruy_Pro']">
              {homeTeam.name}
            </span>
          </div>

          {/* Big Score */}
          <div className="flex items-center space-x-4 mx-6">
            <span className="text-6xl font-black text-amber-400">{homeScore}</span>
            <span className="text-3xl font-light text-slate-500">-</span>
            <span className="text-6xl font-black text-amber-400">{awayScore}</span>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center space-y-2 flex-1">
            {awayTeam.logo && (
              <img src={awayTeam.logo} alt={awayTeam.name} className="w-16 h-16 object-contain" />
            )}
            <span className="font-bold text-xl text-white text-center font-['Kantumruy_Pro']">
              {awayTeam.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
