import React, { useState } from 'react';
import { MatchState } from 'shared';
import { socketClient } from '../../lib/socket';

interface Props {
  state: MatchState;
}

export const CardControl: React.FC<Props> = ({ state }) => {
  const [loading, setLoading] = useState(false);

  const handleCard = async (team: 'home' | 'away', type: 'YELLOW' | 'RED') => {
    try {
      setLoading(true);
      await socketClient.sendCommand('ADD_CARD', { team, type });
    } catch (err: any) {
      alert(`Card error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
        Fouls & Cards (កាតលឿង / ក្រហម)
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Home Team Cards */}
        <div className="flex flex-col space-y-2">
          <span className="text-xs font-bold text-slate-300 truncate font-['Kantumruy_Pro']">
            {state.homeTeam.shortName || state.homeTeam.name}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCard('home', 'YELLOW')}
              disabled={loading}
              className="py-3 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow transition"
            >
              YELLOW
            </button>
            <button
              onClick={() => handleCard('home', 'RED')}
              disabled={loading}
              className="py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs rounded-xl shadow transition"
            >
              RED
            </button>
          </div>
        </div>

        {/* Away Team Cards */}
        <div className="flex flex-col space-y-2">
          <span className="text-xs font-bold text-slate-300 truncate font-['Kantumruy_Pro']">
            {state.awayTeam.shortName || state.awayTeam.name}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCard('away', 'YELLOW')}
              disabled={loading}
              className="py-3 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow transition"
            >
              YELLOW
            </button>
            <button
              onClick={() => handleCard('away', 'RED')}
              disabled={loading}
              className="py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs rounded-xl shadow transition"
            >
              RED
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
