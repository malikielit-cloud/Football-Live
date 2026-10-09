import React, { useState } from 'react';
import { MatchState, BroadcastScene } from 'shared';
import { socketClient } from '../../lib/socket';

interface Props {
  state: MatchState;
}

export const SceneControl: React.FC<Props> = ({ state }) => {
  const [loading, setLoading] = useState(false);

  const scenes: Array<{ id: BroadcastScene; label: string; khmer: string; color: string }> = [
    { id: 'MATCH_LIVE', label: 'Match Live', khmer: 'ការប្រកួតផ្ទាល់', color: 'bg-emerald-600' },
    { id: 'GOAL_CELEBRATION', label: 'Goal Popup', khmer: 'អបអរគ្រាប់បាល់', color: 'bg-amber-600' },
    { id: 'HALF_TIME', label: 'Half-Time', khmer: 'ចប់តង់ទី១', color: 'bg-sky-600' },
    { id: 'FULL_TIME', label: 'Full-Time', khmer: 'ចប់ការប្រកួត', color: 'bg-purple-600' },
    { id: 'SPONSOR_FULLSCREEN', label: 'Sponsor Takeover', khmer: 'អ្នកឧបត្ថម្ភ', color: 'bg-indigo-600' },
    { id: 'MATCH_RESULT', label: 'Final Result', khmer: 'លទ្ធផលចុងក្រោយ', color: 'bg-rose-600' },
  ];

  const handleSetScene = async (scene: BroadcastScene) => {
    try {
      setLoading(true);
      await socketClient.sendCommand('SET_SCENE', { scene });
    } catch (err: any) {
      alert(`Scene error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
        Broadcast Scene Switcher (ផ្លាស់ប្តូរប្លង់ក្រាហ្វិក)
      </h2>

      <div className="grid grid-cols-2 gap-2.5">
        {scenes.map((s) => {
          const isActive = state.activeScene === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleSetScene(s.id)}
              disabled={loading}
              className={`p-3 rounded-xl flex flex-col items-start border text-left transition active:scale-95 ${
                isActive
                  ? `${s.color} border-white shadow-lg text-white font-black`
                  : 'bg-slate-950 border-slate-800 hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-1.5 w-full justify-between">
                <span className="text-sm font-bold">{s.label}</span>
                {isActive && <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>}
              </div>
              <span className="text-[11px] opacity-75 font-['Kantumruy_Pro'] mt-0.5">{s.khmer}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
