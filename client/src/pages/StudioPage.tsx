import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MatchState } from 'shared';
import { api } from '../lib/api';
import { socketClient, ConnectionInfo } from '../lib/socket';
import { CanvasEngine } from '../lib/canvasEngine';
import {
  Camera,
  Mic,
  RefreshCw,
  Radio,
  Settings,
  QrCode,
  ExternalLink,
  ShieldAlert,
  Play,
  Square,
  Activity,
  Layers,
} from 'lucide-react';

export const StudioPage: React.FC = () => {
  const [matches, setMatches] = useState<MatchState[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [connInfo, setConnInfo] = useState<ConnectionInfo>({
    connected: false,
    latencyMs: 0,
    reconnectAttempts: 0,
    status: 'disconnected',
  });

  // Media state
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [resolution, setResolution] = useState<{ width: number; height: number; label: string }>({
    width: 1280,
    height: 720,
    label: '720p HD (Broadcast standard)',
  });

  // Stream state
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [streamHealth, setStreamHealth] = useState<any>(null);
  const [showPairModal, setShowPairModal] = useState(false);

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // 1. Load matches and init socket
  useEffect(() => {
    socketClient.init();
    const unsubConn = socketClient.onConnectionChange(setConnInfo);
    const unsubState = socketClient.subscribe((s) => {
      setMatchState(s);
    });

    api
      .getMatches()
      .then((res) => {
        setMatches(res.matches);
        if (res.matches.length > 0) {
          const first = res.matches[0].id;
          setSelectedMatchId(first);
          socketClient.joinMatch(first);
        }
      })
      .catch(console.error);

    return () => {
      unsubConn();
      unsubState();
      stopCamera();
      if (engineRef.current) engineRef.current.stop();
    };
  }, []);

  // 2. Enumerate audio/video devices
  useEffect(() => {
    const listDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices.filter((d) => d.kind === 'videoinput');
        const audioDevs = devices.filter((d) => d.kind === 'audioinput');
        setCameras(videoDevs);
        setMicrophones(audioDevs);
        if (videoDevs.length > 0 && !selectedCameraId) setSelectedCameraId(videoDevs[0].deviceId);
        if (audioDevs.length > 0 && !selectedMicId) setSelectedMicId(audioDevs[0].deviceId);
      } catch (err) {
        console.warn('Could not enumerate devices:', err);
      }
    };
    listDevices();
  }, []);

  // 3. Initialize Camera & Canvas Engine
  useEffect(() => {
    startCamera();
  }, [selectedCameraId, selectedMicId, facingMode, resolution]);

  const startCamera = async () => {
    stopCamera();
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
          facingMode: selectedCameraId ? undefined : facingMode,
          width: { ideal: resolution.width },
          height: { ideal: resolution.height },
          frameRate: { ideal: 30 },
        },
        audio: {
          deviceId: selectedMicId ? { exact: selectedMicId } : undefined,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }

      if (canvasRef.current) {
        if (!engineRef.current) {
          engineRef.current = new CanvasEngine(canvasRef.current);
          engineRef.current.start();
        }
        engineRef.current.setResolution(resolution.width, resolution.height);
        engineRef.current.setVideoSource(videoRef.current);
        if (matchState) engineRef.current.updateState(matchState);
      }
    } catch (err: any) {
      console.error('Camera initialization error:', err);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  // Sync canvas engine with latest match state
  useEffect(() => {
    if (engineRef.current && matchState) {
      engineRef.current.updateState(matchState);
    }
  }, [matchState]);

  // Handle Match Selection
  const handleSelectMatch = (id: string) => {
    setSelectedMatchId(id);
    socketClient.joinMatch(id);
  };

  // Broadcast toggle
  const handleToggleBroadcast = async () => {
    if (isBroadcasting) {
      if (!window.confirm('Are you sure you want to STOP the live broadcast?')) return;
      try {
        const res = await api.stopStream();
        setIsBroadcasting(false);
        setStreamHealth(res.health);
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      try {
        const res = await api.startStream(testMode);
        setIsBroadcasting(true);
        setStreamHealth(res.health);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const remotePairingUrl = `${window.location.origin}/remote?matchId=${selectedMatchId}&code=${matchState?.pairingCode || ''}`;
  const overlayUrl = `${window.location.origin}/overlay?matchId=${selectedMatchId}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-600 rounded-xl shadow">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wide flex items-center space-x-2">
              <span>PHONE A: LIVE CAMERA & STUDIO</span>
              <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded font-mono">
                v2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-['Kantumruy_Pro']">
              ឧបករណ៍ថតវីដេអូ និងបញ្ចូលក្រាហ្វិកពិន្ទុផ្ទាល់
            </p>
          </div>
        </div>

        {/* Connection & Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                connInfo.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="font-mono text-slate-300">{connInfo.latencyMs}ms</span>
          </div>

          <button
            onClick={() => setShowPairModal(true)}
            className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Pair Phone B</span>
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Left 3 Columns: Video Canvas Preview */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl aspect-video flex items-center justify-center">
            {/* Hidden raw video element used as canvas source */}
            <video ref={videoRef} playsInline muted autoPlay className="hidden" />

            {/* Composite Canvas Output */}
            <canvas ref={canvasRef} className="w-full h-full object-contain" />

            {/* Live Indicator on Preview */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <span
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black tracking-widest ${
                  isBroadcasting
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-slate-900/90 text-slate-400 border border-slate-700'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isBroadcasting ? (testMode ? 'TEST BROADCAST' : 'ON AIR LIVE') : 'PREVIEW'}</span>
              </span>
            </div>

            {/* Canvas Resolution Pill */}
            <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded text-[11px] font-mono text-slate-400 border border-slate-800">
              {resolution.width}x{resolution.height} @ 30fps
            </div>
          </div>

          {/* Quick Studio Broadcast Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleToggleBroadcast}
                className={`px-6 py-3 rounded-xl font-black text-sm flex items-center space-x-2 active:scale-95 shadow-xl transition ${
                  isBroadcasting
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isBroadcasting ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isBroadcasting ? 'STOP BROADCAST' : 'START BROADCAST'}</span>
              </button>

              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={(e) => setTestMode(e.target.checked)}
                  disabled={isBroadcasting}
                  className="rounded border-slate-700 text-sky-500 focus:ring-0"
                />
                <span>Test Mode (Local Safe Test without pushing to Facebook)</span>
              </label>
            </div>

            {/* Direct Web Overlay Link for Larix / OBS */}
            <a
              href={overlayUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 text-xs text-sky-400 hover:text-sky-300 underline font-mono"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Copy OBS / Larix Overlay URL</span>
            </a>
          </div>
        </div>

        {/* Right 1 Column: Device Controls & Settings */}
        <div className="flex flex-col space-y-4">
          {/* Match Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Current Match (ការប្រកួតដែលបានជ្រើសរើស)
            </label>
            <select
              value={selectedMatchId}
              onChange={(e) => handleSelectMatch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-['Kantumruy_Pro']"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.homeTeam.shortName} vs {m.awayTeam.shortName} ({m.tournamentName})
                </option>
              ))}
            </select>
          </div>

          {/* Camera Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Settings className="w-4 h-4" />
              <span>Camera & Audio Hardware</span>
            </h3>

            {/* Front / Back Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFacingMode('environment')}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  facingMode === 'environment'
                    ? 'bg-sky-600 border-sky-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Back Camera (ក្រោយ)
              </button>
              <button
                onClick={() => setFacingMode('user')}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  facingMode === 'user'
                    ? 'bg-sky-600 border-sky-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Front Camera (មុខ)
              </button>
            </div>

            {/* Resolution Selector */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Resolution Preset</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResolution({ width: 1280, height: 720, label: '720p HD' })}
                  className={`py-2 text-xs font-bold rounded-lg border transition ${
                    resolution.height === 720
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  720p HD (30fps)
                </button>
                <button
                  onClick={() => setResolution({ width: 854, height: 480, label: '480p SD' })}
                  className={`py-2 text-xs font-bold rounded-lg border transition ${
                    resolution.height === 480
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  480p SD (Low Data)
                </button>
              </div>
            </div>

            {/* Refresh Camera Stream */}
            <button
              onClick={startCamera}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Camera Feed</span>
            </button>
          </div>

          {/* Quick Pairing Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Phone B Pairing Code
            </span>
            <div className="font-mono text-3xl font-black text-amber-400 tracking-widest my-2 bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-800">
              {matchState?.pairingCode || '------'}
            </div>
            <p className="text-[11px] text-slate-400 font-['Kantumruy_Pro']">
              បើក Safari ឬ Chrome នៅលើ Phone B ហើយវាយបញ្ចូលលេខកូដនេះដើម្បីគ្រប់គ្រង
            </p>
          </div>
        </div>
      </div>

      {/* Pairing Modal with QR Code */}
      {showPairModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-2">Connect Phone B (Remote)</h3>
            <p className="text-xs text-slate-400 mb-4 font-['Kantumruy_Pro']">
              ស្កេន QR Code នេះដោយប្រើទូរស័ព្ទទីពីរ (Phone B) ដើម្បីភ្ជាប់ការគ្រប់គ្រងពិន្ទុភ្លាមៗ
            </p>

            <div className="bg-white p-4 rounded-xl inline-block mx-auto mb-4 shadow-lg">
              <QRCodeSVG value={remotePairingUrl} size={180} />
            </div>

            <div className="mb-4">
              <span className="text-xs text-slate-400 block mb-1">OR ENTER PAIRING CODE</span>
              <span className="font-mono text-3xl font-black text-amber-400 tracking-widest">
                {matchState?.pairingCode}
              </span>
            </div>

            <button
              onClick={() => setShowPairModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
