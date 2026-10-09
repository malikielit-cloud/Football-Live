import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tournament, MatchState } from 'shared';
import { api } from '../lib/api';
import { ArrowLeft, Plus, Trophy, Calendar } from 'lucide-react';

export const TournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<MatchState[]>([]);
  const [loading, setLoading] = useState(true);

  // New Tournament form
  const [name, setName] = useState('');
  const [nameKhmer, setNameKhmer] = useState('');
  const [season, setSeason] = useState('2026');

  useEffect(() => {
    Promise.all([api.getTournaments(), api.getMatches()])
      .then(([tRes, mRes]) => {
        setTournaments(tRes.tournaments);
        setMatches(mRes.matches);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await api.createMatch({
        tournamentId: `tour-${Date.now()}`,
        tournamentName: name,
        homeTeam: {
          id: `team-${Date.now()}-h`,
          name: 'Phnom Penh FC',
          shortName: 'PPFC',
          logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&auto=format&fit=crop&q=80',
          primaryColor: '#c53030',
        },
        awayTeam: {
          id: `team-${Date.now()}-a`,
          name: 'Siem Reap FC',
          shortName: 'SRFC',
          logo: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=128&auto=format&fit=crop&q=80',
          primaryColor: '#2b6cb0',
        },
      });

      setMatches((prev) => [res.match, ...prev]);
      setName('');
      setNameKhmer('');
      alert('New Tournament & Match Created!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 max-w-5xl mx-auto flex flex-col space-y-6">
      <div className="flex items-center space-x-3">
        <Link to="/" className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-black">Tournament & Match Management</h1>
          <p className="text-xs text-slate-400 font-['Kantumruy_Pro']">
            គ្រប់គ្រងពានរង្វាន់ ការប្រកួត និងព័ត៌មានក្រុមបាល់ទាត់
          </p>
        </div>
      </div>

      {/* Quick Create Match Form */}
      <form onSubmit={handleCreateTournament} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Create New Tournament Fixture</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tournament Name (English)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cambodia Cup 2026"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tournament Name (Khmer)</label>
            <input
              type="text"
              value={nameKhmer}
              onChange={(e) => setNameKhmer(e.target.value)}
              placeholder="e.g. ពានរង្វាន់សម្តេចតេជោ ២០២៦"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-['Kantumruy_Pro']"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Season</label>
            <input
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
        >
          Create Tournament Match
        </button>
      </form>

      {/* Existing Matches */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Active Match Fixtures ({matches.length})</span>
        </h2>

        <div className="space-y-3">
          {matches.map((m) => (
            <div
              key={m.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <span className="text-xs text-sky-400 font-bold block">{m.tournamentName}</span>
                <span className="text-base font-extrabold font-['Kantumruy_Pro']">
                  {m.homeTeam.name} ({m.homeTeam.shortName}) vs {m.awayTeam.name} ({m.awayTeam.shortName})
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Pairing Code: <strong className="text-amber-400 font-mono">{m.pairingCode}</strong>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  to={`/studio?matchId=${m.id}`}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg font-bold"
                >
                  Phone A Studio
                </Link>
                <Link
                  to={`/remote?matchId=${m.id}&code=${m.pairingCode}`}
                  className="text-xs bg-sky-600 hover:bg-sky-500 px-3 py-1.5 rounded-lg font-bold"
                >
                  Phone B Remote
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
