export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  bannerUrl?: string;
  websiteUrl?: string;
  tagline?: string;
  taglineKhmer?: string;
  active: boolean;
  displayDurationSeconds: number;
  priorityOrder: number;
}

export interface TickerMessage {
  id: string;
  text: string;
  textKhmer?: string;
  textArabic?: string;
  active: boolean;
  priority: number;
}
