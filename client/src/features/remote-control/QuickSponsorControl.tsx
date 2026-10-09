import React, { useState } from 'react';
import { MatchState } from 'shared';
import { socketClient } from '../../lib/socket';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  state: MatchState;
}

export const QuickSponsorControl: React.FC<Props> = ({ state }) => {
  const [loading, setLoading] = useState(false);

  const handleToggleSponsor = async () => {
    try {
      setLoading(true);
      await socketClient.sendCommand('TOGGLE_SPONSOR', {
        visible: !state.sponsorBanner.visible,
      });
    } catch (err: any) {
      alert(`Sponsor error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLowerThird = async () => {
    try {
      setLoading(true);
      await socketClient.sendCommand('TOGGLE_LOWER_THIRD', {
        visible: !state.lowerThird.visible,
      });
    } catch (err: any) {
      alert(`Lower third error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
        Sponsor & Lower Third (អ្នកឧបត្ថម្ភ & ក្រាហ្វិកខាងក្រោម)
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Sponsor Banner Toggle */}
        <button
          onClick={handleToggleSponsor}
          disabled={loading}
          className={`p-3.5 rounded-xl border flex items-center justify-between transition active:scale-95 ${
            state.sponsorBanner.visible
              ? 'bg-amber-600/90 border-amber-400 text-white'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wider">Sponsor Banner</span>
            <span className="text-[11px] font-['Kantumruy_Pro'] opacity-80">បដាអ្នកឧបត្ថម្ភ</span>
          </div>
          {state.sponsorBanner.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>

        {/* Lower Third Toggle */}
        <button
          onClick={handleToggleLowerThird}
          disabled={loading}
          className={`p-3.5 rounded-xl border flex items-center justify-between transition active:scale-95 ${
            state.lowerThird.visible
              ? 'bg-emerald-600/90 border-emerald-400 text-white'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold uppercase tracking-wider">Lower Third</span>
            <span className="text-[11px] font-['Kantumruy_Pro'] opacity-80">ព័ត៌មានក្រោម</span>
          </div>
          {state.lowerThird.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
