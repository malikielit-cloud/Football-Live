import React, { useState } from 'react';
import { MatchState } from 'shared';
import { socketClient } from '../../lib/socket';
import { Send, Eye, EyeOff } from 'lucide-react';

interface Props {
  state: MatchState;
}

export const TickerControl: React.FC<Props> = ({ state }) => {
  const [text, setText] = useState(state.ticker.text);
  const [loading, setLoading] = useState(false);

  const presets = [
    { label: 'Khmer Welcome', text: 'សូមស្វាគមន៍មកកាន់ការផ្សាយផ្ទាល់ការប្រកួតបាល់ទាត់ជាតិ • PRO FOOTBALL LIVE STUDIO' },
    { label: 'Half-time Message', text: 'សម្រាកតង់ទី១ • HALF TIME BREAK • សូមទស្សនាឡើងវិញនូវទិដ្ឋភាពសំខាន់ៗ' },
    { label: 'Arabic Broadcast', text: 'مرحباً بكم في البث المباشر لمباراة كرة القدم • PRO FOOTBALL LIVE' },
    { label: 'Sponsor Callout', text: 'ឧបត្ថម្ភផ្ដាច់មុខដោយ ធនាគារ ABA និង Cambodia Telecom • Official Broadcast Partners' },
  ];

  const handleUpdate = async (newText: string) => {
    try {
      setLoading(true);
      await socketClient.sendCommand('UPDATE_TICKER', {
        text: newText,
        visible: true,
      });
    } catch (err: any) {
      alert(`Ticker error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setLoading(true);
      await socketClient.sendCommand('UPDATE_TICKER', {
        visible: !state.ticker.visible,
      });
    } catch (err: any) {
      alert(`Ticker error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Scrolling Ticker (អក្សររត់ខាងក្រោម)
        </h2>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`flex items-center space-x-1 text-xs px-3 py-1 rounded-lg border transition ${
            state.ticker.visible
              ? 'bg-sky-600 border-sky-400 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {state.ticker.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{state.ticker.visible ? 'Visible' : 'Hidden'}</span>
        </button>
      </div>

      <div className="flex space-x-2 mb-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="បញ្ចូលអត្ថបទអក្សររត់ (Enter ticker text)..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-['Kantumruy_Pro']"
        />
        <button
          onClick={() => handleUpdate(text)}
          disabled={loading}
          className="bg-sky-600 hover:bg-sky-500 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-1 shadow transition"
        >
          <Send className="w-4 h-4" />
          <span>Apply</span>
        </button>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setText(p.text);
              handleUpdate(p.text);
            }}
            disabled={loading}
            className="text-[11px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg transition font-['Kantumruy_Pro']"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
