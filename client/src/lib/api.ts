const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('pfls_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('pfls_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('pfls_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  pair: (pairingCode: string) =>
    request<{ matchId: string; matchName: string; token: string; role: string }>('/auth/pair', {
      method: 'POST',
      body: JSON.stringify({ pairingCode }),
    }),

  me: () => request<{ user: any }>('/auth/me'),

  // Matches
  getMatches: () => request<{ matches: any[] }>('/matches'),
  getMatch: (id: string) => request<{ match: any }>(`/matches/${id}`),
  createMatch: (data: any) =>
    request<{ match: any }>('/matches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPairCode: (id: string) =>
    request<{ matchId: string; pairingCode: string; expiresAt: number }>(`/matches/${id}/pair-code`),
  getMatchEvents: (id: string) => request<{ events: any[] }>(`/matches/${id}/events`),

  // Tournaments
  getTournaments: () => request<{ tournaments: any[] }>('/tournaments'),

  // Sponsors
  getSponsors: () => request<{ sponsors: any[] }>('/sponsors'),
  saveSponsor: (data: any) =>
    request<{ sponsor: any }>('/sponsors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteSponsor: (id: string) =>
    request<{ success: boolean }>(`/sponsors/${id}`, {
      method: 'DELETE',
    }),
  getTickerMessages: () => request<{ tickerMessages: any[] }>('/sponsors/ticker'),
  saveTickerMessage: (data: any) =>
    request<{ message: any }>('/sponsors/ticker', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Stream
  getStreamStatus: () => request<{ health: any }>('/stream/status'),
  startStream: (testMode = false) =>
    request<{ health: any }>('/stream/start', {
      method: 'POST',
      body: JSON.stringify({ testMode }),
    }),
  stopStream: () =>
    request<{ health: any }>('/stream/stop', {
      method: 'POST',
    }),
};
