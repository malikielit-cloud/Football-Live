import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MatchState } from 'shared';
import { api, setStoredToken } from '../lib/api';
import { socketClient, ConnectionInfo } from '../lib/socket';
import { ScoreControl } from '../features/remote-control/ScoreControl';
import { ClockControl } from '../features/remote-control/ClockControl';
import { CardControl } from '../features/remote-control/CardControl';
import { SceneControl } from '../features/remote-control/SceneControl';
import { QuickSponsorControl } from '../features/remote-control/QuickSponsorControl';
import { TickerControl } from '../features/remote-control/TickerControl';
import { Smartphone, Wifi, WifiOff, LogOut, CheckCircle, ShieldAlert } from 'lucide-react';

export const RemotePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlMatchId = searchParams.get('matchId') || '';
  const urlCode = searchParams.get('code') || '';

  const [pairingCodeInput, setPairingCodeInput] = useState(urlCode);
  const [isPaired, setIsPaired] = useState(false);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [connInfo, setConnInfo] = useState<ConnectionInfo>({
    connected: false,
    latencyMs: 0,
    reconnectAttempts: 0,
    status: 'disconnected',
  });
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);

  // Auto-pair if code is in URL
  useEffect(() => {
    if (urlCode && !isPaired) {
      handlePair(urlCode);
    }
  }, [urlCode]);

  useEffect(() => {
    const unsubConn = socketClient.onConnectionChange(setConnInfo);
    const unsubState = socketClient.subscribe((state) => {
      setMatchState(state);
    });

    return () => {
      unsubConn();
      unsubState();
    };
  }, []);

  const handlePair = async (codeToPair: string) => {
    if (!codeToPair || codeToPair.length < 4) {
      setPairingError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setPairingLoading(true);
      setPairingError(null);
      const res = await api.pair(codeToPair.trim());

      setStoredToken(res.token);
      socketClient.init(codeToPair.trim());
      socketClient.joinMatch(res.matchId);
      setIsPaired(true);
    } catch (err: any) {
      setPairingError(err.message || 'Failed to connect with pairing code');
    } finally {
      setPairingLoading(false);
    }
  };

  const handleEndMatch = async () => {
    if (!window.confirm('Are you sure you want to officially END this match session?')) return;
    try {
      await socketClient.sendCommand('END_MATCH', {});
    } catch (err: any) {
      alert(`Error ending match: ${err.message}`);
    }
  };

  // If not paired yet, show clean pairing keypad
  if (!isPaired) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-sky-600/20 text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-500/30">
            <Smartphone className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black mb-1">PHONE B: REMOTE</h1>
          <p className="text-xs text-slate-400 mb-6 font-['Kantumruy_Pro']">
            ឧបករណ៍បញ្ជាពិន្ទុ និងនាឡិកាប្រកួតតាមទូរស័ព្ទដៃ
          </p>

          {pairingError && (
            <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-xl mb-4 text-left flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{pairingError}</span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Enter 6-Digit Pairing Code (លេខកូដភ្ជាប់)
            </label>
            <input
              type="text"
              pattern="[0-9]*"
              maxLength={6}
              value={pairingCodeInput}
              onChange={(e) => setPairingCodeInput(e.target.value)}
              placeholder="e.g. 889922"
              className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl py-4 text-center text-3xl font-mono font-black text-amber-400 tracking-widest focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={() => handlePair(pairingCodeInput)}
            disabled={pairingLoading || !pairingCodeInput}
            className="w-full py-4 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-black text-lg rounded-2xl shadow-xl transition disabled:opacity-50"
          >
            {pairingLoading ? 'Connecting...' : 'CONNECT REMOTE'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-12 selection:bg-none">
      {/* Top Remote Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h1 className="font-extrabold text-sm tracking-wide">PHONE B: CONTROLLER</h1>
            <span className="text-[10px] text-slate-400 font-mono">
              {matchState ? `${matchState.homeTeam.shortName} vs ${matchState.awayTeam.shortName}` : 'Syncing...'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Connection Status Pill */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full text-xs font-mono">
            {connInfo.connected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            )}
            <span className={connInfo.connected ? 'text-slate-300' : 'text-red-400'}>
              {connInfo.connected ? `${connInfo.latencyMs}ms` : 'Reconnecting...'}
            </span>
          </div>

          <button
            onClick={() => setIsPaired(false)}
            title="Disconnect"
            className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Offline Alert Banner */}
      {!connInfo.connected && (
        <div className="bg-red-900 text-white px-4 py-2 text-center text-xs font-bold animate-pulse">
          ⚠️ Connection lost. Retrying... Commands will resynchronize when restored.
        </div>
      )}

      {/* Main Remote Control Body */}
      <main className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col">
        {matchState ? (
          <>
            {/* 1. Score Control */}
            <ScoreControl state={matchState} />

            {/* 2. Clock & Period Control */}
            <ClockControl state={matchState} />

            {/* 3. Foul & Cards Control */}
            <CardControl state={matchState} />

            {/* 4. Scene Switcher */}
            <SceneControl state={matchState} />

            {/* 5. Sponsor & Lower Third */}
            <QuickSponsorControl state={matchState} />

            {/* 6. Scrolling Ticker Text */}
            <TickerControl state={matchState} />

            {/* End Match Danger Button */}
            <button
              onClick={handleEndMatch}
              className="w-full py-3.5 bg-red-950 hover:bg-red-900 active:scale-95 text-red-300 border border-red-800 rounded-2xl font-bold text-sm transition mt-2"
            >
              FINISH & CLOSE MATCH SESSION (បញ្ចប់ការប្រកួត)
            </button>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-['Kantumruy_Pro']">កំពុងទាញយកទិន្នន័យការប្រកួតពី Server...</p>
          </div>
        )}
      </main>
    </div>
  );
};
