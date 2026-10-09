import React, { useEffect, useState } from 'react';
import { MatchState } from 'shared';

interface ScoreboardProps {
  state: MatchState;
}

export const ScoreboardOverlay: React.FC<ScoreboardProps> = ({ state }) => {
  const { homeTeam, awayTeam, homeScore, awayScore, clock, tournamentName, period } = state;
  const [displaySeconds, setDisplaySeconds] = useState(clock.seconds);

  // Smooth client second calculation
  useEffect(() => {
    let interval: any;
    if (clock.running && clock.lastStartedTimestamp) {
      const calc = () => {
        const elapsed = Math.floor((Date.now() - clock.lastStartedTimestamp!) / 1000);
        setDisplaySeconds(clock.seconds + elapsed);
      };
      calc();
      interval = setInterval(calc, 1000);
    } else {
      setDisplaySeconds(clock.seconds);
    }
    return () => clearInterval(interval);
  }, [clock.running, clock.seconds, clock.lastStartedTimestamp]);

  const mins = Math.floor(displaySeconds / 60).toString().padStart(2, '0');
  const secs = (displaySeconds % 60).toString().padStart(2, '0');

  const periodLabel =
    period === 'FIRST_HALF'
      ? '1ST'
      : period === 'SECOND_HALF'
      ? '2ND'
      : period === 'HALF_TIME'
      ? 'HT'
      : period === 'FULL_TIME'
      ? 'FT'
      : 'LIVE';

  return (
    <div className="flex flex-col select-none drop-shadow-2xl">
      {/* Tournament Pill & Live Badge */}
      <div className="flex items-center space-x-2 mb-1 pl-1">
        <div className="bg-slate-900/95 border-b-2 border-sky-400 text-sky-400 font-bold px-3 py-0.5 text-xs rounded-t tracking-wider font-['Kantumruy_Pro']">
          {tournamentName}
        </div>
        <div className="bg-red-600 text-white font-black px-2 py-0.5 text-[10px] rounded tracking-widest animate-pulse flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
          <span>LIVE</span>
        </div>
      </div>

      {/* Main Score Bar */}
      <div className="flex items-stretch h-12 bg-slate-950/95 border border-slate-800 rounded-md overflow-hidden text-white shadow-2xl">
        {/* Home Team Color Accent */}
        <div
          className="w-2 self-stretch"
          style={{ backgroundColor: homeTeam.primaryColor || '#dc2626' }}
        />

        {/* Home Team */}
        <div className="flex items-center px-4 space-x-2">
          {homeTeam.logo && (
            <img
              src={homeTeam.logo}
              alt={homeTeam.name}
              className="w-7 h-7 object-contain rounded-full bg-slate-800 p-0.5"
            />
          )}
          <span className="font-extrabold text-lg tracking-wider font-['Kantumruy_Pro']">
            {homeTeam.shortName || homeTeam.name.slice(0, 3).toUpperCase()}
          </span>
        </div>

        {/* Home Score */}
        <div className="flex items-center justify-center w-12 bg-slate-900 font-black text-2xl text-amber-400 border-x border-slate-800">
          {homeScore}
        </div>

        {/* Away Score */}
        <div className="flex items-center justify-center w-12 bg-slate-900 font-black text-2xl text-amber-400 border-r border-slate-800">
          {awayScore}
        </div>

        {/* Away Team */}
        <div className="flex items-center px-4 space-x-2">
          <span className="font-extrabold text-lg tracking-wider font-['Kantumruy_Pro']">
            {awayTeam.shortName || awayTeam.name.slice(0, 3).toUpperCase()}
          </span>
          {awayTeam.logo && (
            <img
              src={awayTeam.logo}
              alt={awayTeam.name}
              className="w-7 h-7 object-contain rounded-full bg-slate-800 p-0.5"
            />
          )}
        </div>

        {/* Away Team Color Accent */}
        <div
          className="w-2 self-stretch"
          style={{ backgroundColor: awayTeam.primaryColor || '#2563eb' }}
        />

        {/* Match Clock & Period */}
        <div className="flex items-center bg-slate-900/90 px-3 border-l border-slate-800 space-x-2">
          <span className="text-[11px] font-bold text-slate-400">{periodLabel}</span>
          <span className="font-mono font-black text-lg text-emerald-400 tracking-tight">
            {mins}:{secs}
          </span>
          {clock.addedSeconds > 0 && (
            <span className="text-xs font-bold text-red-500">
              +{Math.floor(clock.addedSeconds / 60)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
