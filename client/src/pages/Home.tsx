import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MatchState } from 'shared';
import { api } from '../lib/api';
import {
  Camera,
  Smartphone,
  Layers,
  Trophy,
  Megaphone,
  Radio,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const Home: React.FC = () => {
  const [matches, setMatches] = useState<MatchState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMatches()
      .then((res) => setMatches(res.matches))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Hero Banner */}
      <header className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Pro Sports Broadcast Suite • Version 2</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
              PRO FOOTBALL LIVE STUDIO
            </h1>
            <p className="text-sm md:text-base text-slate-400 max-w-xl font-['Kantumruy_Pro']">
              ប្រព័ន្ធផ្សាយផ្ទាល់បាល់ទាត់អាជីព ប្រើប្រាស់ទូរស័ព្ទពីរគ្រឿង (Phone A: Camera + Phone B: Remote Control) ផ្សាយផ្ទាល់ទៅកាន់ Facebook Live ចំណាយទាប និងគុណភាពកម្រិតខ្ពស់។
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/studio"
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-5 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition"
            >
              <Camera className="w-5 h-5" />
              <span>Open Phone A Studio</span>
            </Link>
            <Link
              to="/remote"
              className="bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold px-5 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition"
            >
              <Smartphone className="w-5 h-5" />
              <span>Open Phone B Remote</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hub Navigation */}
      <main className="max-w-6xl mx-auto p-6 flex-1 w-full flex flex-col space-y-8">
        {/* Core Architecture Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Phone A */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/50 transition">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Camera className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black mb-1">Phone A: Camera & Studio</h2>
              <p className="text-xs text-slate-400 mb-4 font-['Kantumruy_Pro']">
                ទូរស័ព្ទទីមួយសម្រាប់ថតវីដេអូការប្រកួត បញ្ចូល Overlay Scoreboard និងបញ្ជូន Stream។
              </p>
            </div>
            <Link
              to="/studio"
              className="text-emerald-400 text-xs font-bold flex items-center space-x-1 hover:underline mt-4"
            >
              <span>Launch Camera Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Phone B */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/50 transition">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black mb-1">Phone B: Touch Remote</h2>
              <p className="text-xs text-slate-400 mb-4 font-['Kantumruy_Pro']">
                ទូរស័ព្ទទីពីរសម្រាប់ចុចបូកពិន្ទុ បើកបិទនាឡិកា ដាក់កាតលឿងក្រហម និងផ្លាស់ប្តូរ Sponsor។
              </p>
            </div>
            <Link
              to="/remote"
              className="text-sky-400 text-xs font-bold flex items-center space-x-1 hover:underline mt-4"
            >
              <span>Launch Remote Control</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: OBS / Larix Overlay */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/50 transition">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black mb-1">Transparent Overlay</h2>
              <p className="text-xs text-slate-400 mb-4 font-['Kantumruy_Pro']">
                Browser Source Overlay URL សម្រាប់ដាក់ក្នុង Larix Broadcaster ឬ OBS Studio នៅលើ PC។
              </p>
            </div>
            <Link
              to="/overlay"
              target="_blank"
              className="text-purple-400 text-xs font-bold flex items-center space-x-1 hover:underline mt-4"
            >
              <span>Open Transparent Overlay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* Live Matches List */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black">Active Match Broadcasts (ការប្រកួតបច្ចុប្បន្ន)</h2>
              <p className="text-xs text-slate-400">ជ្រើសរើសការប្រកួតដើម្បីចាប់ផ្តើមផ្សាយផ្ទាល់ ឬគ្រប់គ្រង</p>
            </div>
            <Link
              to="/tournaments"
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 font-bold transition"
            >
              Manage Tournaments
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading matches...</div>
          ) : matches.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No matches found.</div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-xs font-black bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-amber-400">
                      {m.pairingCode}
                    </div>
                    <div>
                      <div className="text-xs text-sky-400 font-bold">{m.tournamentName}</div>
                      <div className="text-base font-extrabold text-white font-['Kantumruy_Pro']">
                        {m.homeTeam.name} <span className="text-amber-400">{m.homeScore} - {m.awayScore}</span> {m.awayTeam.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full md:w-auto">
                    <Link
                      to={`/studio?matchId=${m.id}`}
                      className="flex-1 md:flex-none text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-lg font-bold text-center transition"
                    >
                      Camera Studio
                    </Link>
                    <Link
                      to={`/remote?matchId=${m.id}&code=${m.pairingCode}`}
                      className="flex-1 md:flex-none text-xs bg-sky-600 hover:bg-sky-500 px-3 py-2 rounded-lg font-bold text-center transition"
                    >
                      Remote Control
                    </Link>
                    <Link
                      to={`/overlay?matchId=${m.id}`}
                      target="_blank"
                      className="flex-1 md:flex-none text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg font-bold text-center transition"
                    >
                      Overlay URL
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom Utility Bar */}
        <section className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400">
          <div className="flex items-center space-x-4">
            <Link to="/tournaments" className="hover:text-white flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Tournaments & Teams</span>
            </Link>
            <Link to="/sponsors" className="hover:text-white flex items-center space-x-1">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Sponsors & Tickers</span>
            </Link>
          </div>
          <div>Pro Football Live Studio — Antigravity Engineering</div>
        </section>
      </main>
    </div>
  );
};
