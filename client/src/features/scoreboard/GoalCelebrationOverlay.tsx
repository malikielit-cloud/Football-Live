import React from 'react';
import { GoalEvent } from 'shared';

interface Props {
  goal: GoalEvent | null;
}

export const GoalCelebrationOverlay: React.FC<Props> = ({ goal }) => {
  if (!goal) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-10 py-6 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.8)] border-4 border-yellow-200 animate-goal-pop flex flex-col items-center">
        <div className="text-5xl font-black tracking-tight mb-2 flex items-center space-x-3">
          <span>⚽</span>
          <span>GOAL! គ្រាប់បាល់!</span>
          <span>⚽</span>
        </div>
        <div className="text-2xl font-bold tracking-wide uppercase font-['Kantumruy_Pro']">
          {goal.teamName}
        </div>
        {(goal.playerName || goal.playerNumber) && (
          <div className="text-lg font-semibold text-slate-900 mt-1">
            {goal.playerNumber ? `#${goal.playerNumber} ` : ''}
            {goal.playerName}
          </div>
        )}
        <div className="text-sm font-black bg-slate-950 text-amber-400 px-3 py-0.5 rounded-full mt-2">
          {goal.minute}' MINUTE
        </div>
      </div>
    </div>
  );
};
