import React, { useState } from 'react';
import { MatchState } from 'shared';
import { socketClient } from '../../lib/socket';
import { Plus, RotateCcw } from 'lucide-react';

interface Props {
  state: MatchState;
}

export const ScoreControl: React.FC<Props> = ({ state }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAddGoal = async (team: 'home' | 'away') => {
    try {
      setLoadingAction(`goal-${team}`);
      await socketClient.sendCommand('ADD_GOAL', { team });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUndoGoal = async () => {
    if (!window.confirm('Are you sure you want to undo the last goal?')) return;
    try {
      setLoadingAction('undo');
      await socketClient.sendCommand('UNDO_GOAL', {});
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Match Score Control (គ្រប់គ្រងពិន្ទុ)
        </h2>
        <button
          onClick={handleUndoGoal}
          disabled={loadingAction === 'undo' || (state.homeScore === 0 && state.awayScore === 0)}
          className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Undo Goal</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Home Team Card */}
        <div className="flex flex-col bg-slate-950/80 border border-slate-800 p-4 rounded-xl items-center text-center">
          <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: state.homeTeam.primaryColor }} />
          <span className="font-extrabold text-base text-white truncate max-w-full font-['Kantumruy_Pro']">
            {state.homeTeam.name}
          </span>
          <span className="text-4xl font-black text-amber-400 my-2">{state.homeScore}</span>
          <button
            onClick={() => handleAddGoal('home')}
            disabled={loadingAction === 'goal-home'}
            className="w-full mt-2 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-lg rounded-xl shadow-lg flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <Plus className="w-6 h-6" />
            <span>+ GOAL</span>
          </button>
        </div>

        {/* Away Team Card */}
        <div className="flex flex-col bg-slate-950/80 border border-slate-800 p-4 rounded-xl items-center text-center">
          <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: state.awayTeam.primaryColor }} />
          <span className="font-extrabold text-base text-white truncate max-w-full font-['Kantumruy_Pro']">
            {state.awayTeam.name}
          </span>
          <span className="text-4xl font-black text-amber-400 my-2">{state.awayScore}</span>
          <button
            onClick={() => handleAddGoal('away')}
            disabled={loadingAction === 'goal-away'}
            className="w-full mt-2 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-lg rounded-xl shadow-lg flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <Plus className="w-6 h-6" />
            <span>+ GOAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
