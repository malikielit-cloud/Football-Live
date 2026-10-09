import React, { useState, useEffect } from 'react';
import { MatchState, MatchPeriod } from 'shared';
import { socketClient } from '../../lib/socket';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface Props {
  state: MatchState;
}

export const ClockControl: React.FC<Props> = ({ state }) => {
  const { clock, period } = state;
  const [displaySeconds, setDisplaySeconds] = useState(clock.seconds);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: any;
    if (clock.running && clock.lastStartedTimestamp) {
      const update = () => {
        const elapsed = Math.floor((Date.now() - clock.lastStartedTimestamp!) / 1000);
        setDisplaySeconds(clock.seconds + elapsed);
      };
      update();
      interval = setInterval(update, 1000);
    } else {
      setDisplaySeconds(clock.seconds);
    }
    return () => clearInterval(interval);
  }, [clock.running, clock.seconds, clock.lastStartedTimestamp]);

  const handleTogglePlay = async () => {
    try {
      setLoading(true);
      if (clock.running) {
        await socketClient.sendCommand('PAUSE_CLOCK', {});
      } else {
        await socketClient.sendCommand('START_CLOCK', {});
      }
    } catch (err: any) {
      alert(`Clock error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset match clock to 00:00?')) return;
    try {
      setLoading(true);
      await socketClient.sendCommand('RESET_CLOCK', {});
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = async (newPeriod: MatchPeriod) => {
    try {
      setLoading(true);
      await socketClient.sendCommand('SET_PERIOD', { period: newPeriod });
    } catch (err: any) {
      alert(`Period error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const mins = Math.floor(displaySeconds / 60).toString().padStart(2, '0');
  const secs = (displaySeconds % 60).toString().padStart(2, '0');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Match Clock & Period (ម៉ោងប្រកួត)
        </h2>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
            clock.running
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {clock.running ? 'RUNNING' : 'PAUSED'}
        </span>
      </div>

      {/* Clock Display */}
      <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
        <div className="font-mono text-5xl font-black text-amber-400 tracking-tight">
          {mins}:{secs}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTogglePlay}
            disabled={loading}
            className={`px-6 py-4 rounded-xl font-bold flex items-center space-x-2 active:scale-95 shadow-lg transition ${
              clock.running
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {clock.running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            <span className="text-lg">{clock.running ? 'PAUSE' : 'START'}</span>
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            title="Reset Clock"
            className="p-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl border border-slate-700 transition"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Quick Period Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => handlePeriodChange('FIRST_HALF')}
          className={`py-2 text-xs font-bold rounded-lg border transition ${
            period === 'FIRST_HALF'
              ? 'bg-sky-600 border-sky-400 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          1st Half
        </button>
        <button
          onClick={() => handlePeriodChange('HALF_TIME')}
          className={`py-2 text-xs font-bold rounded-lg border transition ${
            period === 'HALF_TIME'
              ? 'bg-sky-600 border-sky-400 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          Half Time
        </button>
        <button
          onClick={() => handlePeriodChange('SECOND_HALF')}
          className={`py-2 text-xs font-bold rounded-lg border transition ${
            period === 'SECOND_HALF'
              ? 'bg-sky-600 border-sky-400 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          2nd Half
        </button>
        <button
          onClick={() => handlePeriodChange('FULL_TIME')}
          className={`py-2 text-xs font-bold rounded-lg border transition ${
            period === 'FULL_TIME'
              ? 'bg-sky-600 border-sky-400 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          Full Time
        </button>
      </div>
    </div>
  );
};
