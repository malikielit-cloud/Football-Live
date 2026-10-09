import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sponsor, TickerMessage } from 'shared';
import { api } from '../lib/api';
import { ArrowLeft, Plus, Megaphone, Trash2 } from 'lucide-react';

export const SponsorsPage: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tagline, setTagline] = useState('');
  const [tickerText, setTickerText] = useState('');

  useEffect(() => {
    Promise.all([api.getSponsors(), api.getTickerMessages()])
      .then(([sRes, tRes]) => {
        setSponsors(sRes.sponsors);
        setTickerMessages(tRes.tickerMessages);
      })
      .catch(console.error);
  }, []);

  const handleCreateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await api.saveSponsor({
        name,
        logoUrl: logoUrl || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
        tagline,
        active: true,
        displayDurationSeconds: 15,
        priorityOrder: sponsors.length + 1,
      });
      setSponsors((prev) => [...prev, res.sponsor]);
      setName('');
      setLogoUrl('');
      setTagline('');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    try {
      await api.deleteSponsor(id);
      setSponsors((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreateTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerText) return;

    try {
      const res = await api.saveTickerMessage({
        text: tickerText,
        active: true,
        priority: tickerMessages.length + 1,
      });
      setTickerMessages((prev) => [...prev, res.message]);
      setTickerText('');
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
          <h1 className="text-2xl font-black">Sponsors & Ticker Messages</h1>
          <p className="text-xs text-slate-400 font-['Kantumruy_Pro']">
            គ្រប់គ្រង Logo អ្នកឧបត្ថម្ភ និងសារអក្សររត់
          </p>
        </div>
      </div>

      {/* Add Sponsor Form */}
      <form onSubmit={handleCreateSponsor} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Add Official Sponsor</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Sponsor Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cambodia Beer"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Logo URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Official Partner"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
        >
          Save Sponsor
        </button>
      </form>

      {/* Sponsors List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
          Configured Sponsors ({sponsors.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                {s.logoUrl && (
                  <img src={s.logoUrl} alt={s.name} className="w-12 h-12 object-contain bg-slate-900 rounded-lg p-1" />
                )}
                <div>
                  <h3 className="font-extrabold text-white text-base">{s.name}</h3>
                  <p className="text-xs text-slate-400">{s.tagline || 'Official Sponsor'}</p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteSponsor(s.id)}
                className="p-2 text-slate-500 hover:text-red-400 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
