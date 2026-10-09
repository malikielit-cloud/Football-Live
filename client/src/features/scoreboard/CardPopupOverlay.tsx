import React from 'react';
import { CardEvent } from 'shared';

interface Props {
  card: CardEvent | null;
}

export const CardPopupOverlay: React.FC<Props> = ({ card }) => {
  if (!card) return null;

  const isYellow = card.type === 'YELLOW';

  return (
    <div className="absolute bottom-20 left-10 pointer-events-none z-40 animate-goal-pop">
      <div className="flex items-center bg-slate-950/95 border border-slate-700 rounded-lg p-3 shadow-2xl space-x-4">
        <div
          className={`w-8 h-12 rounded shadow-md border ${
            isYellow ? 'bg-yellow-400 border-yellow-300' : 'bg-red-600 border-red-500'
          }`}
        />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 tracking-wider">
            {isYellow ? 'YELLOW CARD' : 'RED CARD'} • {card.minute}'
          </span>
          <span className="text-base font-extrabold text-white font-['Kantumruy_Pro']">
            {card.playerName || (card.playerNumber ? `Player #${card.playerNumber}` : `${card.team.toUpperCase()} TEAM`)}
          </span>
        </div>
      </div>
    </div>
  );
};
