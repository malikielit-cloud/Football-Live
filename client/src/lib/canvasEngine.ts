import { MatchState } from 'shared';

export interface CanvasDimensions {
  width: number;
  height: number;
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoElement: HTMLVideoElement | null = null;
  private animFrameId: number | null = null;
  private matchState: MatchState | null = null;
  private dimensions: CanvasDimensions = { width: 1280, height: 720 };
  private tickerOffset = 0;
  private logoImages: Map<string, HTMLImageElement> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context from canvas');
    this.ctx = context;
    this.setResolution(1280, 720);
  }

  setResolution(width: number, height: number) {
    this.dimensions = { width, height };
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setVideoSource(video: HTMLVideoElement | null) {
    this.videoElement = video;
  }

  updateState(state: MatchState) {
    this.matchState = state;
    // Preload logos
    if (state.homeTeam.logo) this.preloadImage(state.homeTeam.logo);
    if (state.awayTeam.logo) this.preloadImage(state.awayTeam.logo);
    if (state.sponsorBanner.logoUrl) this.preloadImage(state.sponsorBanner.logoUrl);
  }

  private preloadImage(url: string) {
    if (!this.logoImages.has(url)) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        this.logoImages.set(url, img);
      };
    }
  }

  start() {
    if (this.animFrameId) return;
    const render = () => {
      this.drawFrame();
      this.animFrameId = requestAnimationFrame(render);
    };
    this.animFrameId = requestAnimationFrame(render);
  }

  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private drawFrame() {
    const { width, height } = this.dimensions;
    const ctx = this.ctx;

    // 1. Draw Camera Feed
    if (this.videoElement && this.videoElement.readyState >= 2) {
      ctx.drawImage(this.videoElement, 0, 0, width, height);
    } else {
      // Dark placeholder gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0a0f1d');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CAMERA PREVIEW OFFLINE / INITIALIZING...', width / 2, height / 2);
    }

    if (!this.matchState) return;

    // 2. Render Scoreboard if in active play or scene allows
    if (
      this.matchState.activeScene === 'MATCH_LIVE' ||
      this.matchState.activeScene === 'GOAL_CELEBRATION'
    ) {
      this.drawScoreboard(ctx, width);
    }

    // 3. Render Goal Celebration overlay if scene active
    if (this.matchState.activeScene === 'GOAL_CELEBRATION') {
      this.drawGoalCelebration(ctx, width, height);
    }

    // 4. Render Half-Time / Full-Time Takeovers
    if (this.matchState.activeScene === 'HALF_TIME') {
      this.drawHalfTimeBanner(ctx, width, height, 'HALF TIME • តង់ទី១ បញ្ចប់');
    } else if (this.matchState.activeScene === 'FULL_TIME' || this.matchState.activeScene === 'MATCH_RESULT') {
      this.drawHalfTimeBanner(ctx, width, height, 'FULL TIME • ចប់ការប្រកួត');
    }

    // 5. Render Sponsor Banner
    if (this.matchState.sponsorBanner.visible) {
      this.drawSponsorBanner(ctx, width, height);
    }

    // 6. Render Lower Third
    if (this.matchState.lowerThird.visible) {
      this.drawLowerThird(ctx, width, height);
    }

    // 7. Render Scrolling Ticker
    if (this.matchState.ticker.visible && this.matchState.ticker.text) {
      this.drawTicker(ctx, width, height);
    }
  }

  private drawScoreboard(ctx: CanvasRenderingContext2D, width: number) {
    if (!this.matchState) return;
    const { homeTeam, awayTeam, homeScore, awayScore, clock, tournamentName } = this.matchState;

    const barX = 40;
    const barY = 35;
    const barHeight = 44;

    // Background Container
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // Tournament Label Pill above
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(barX, barY - 22, 220, 20, [4, 4, 0, 0]);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Inter, Kantumruy Pro, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(tournamentName.toUpperCase().slice(0, 28), barX + 8, barY - 8);

    // Live red badge
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(barX + 225, barY - 22, 45, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LIVE', barX + 247, barY - 8);

    // Main Scoreboard Bar
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(barX, barY, 440, barHeight, 6);
    ctx.fill();

    // Home Team Color Bar
    ctx.fillStyle = homeTeam.primaryColor || '#c53030';
    ctx.beginPath();
    ctx.roundRect(barX, barY, 8, barHeight, [6, 0, 0, 6]);
    ctx.fill();

    // Home Short Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Inter, Kantumruy Pro, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(homeTeam.shortName || homeTeam.name.slice(0, 3).toUpperCase(), barX + 18, barY + 28);

    // Score Home
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX + 110, barY, 40, barHeight);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(homeScore.toString(), barX + 130, barY + 31);

    // Score Away
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX + 152, barY, 40, barHeight);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(awayScore.toString(), barX + 172, barY + 31);

    // Away Short Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Inter, Kantumruy Pro, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(awayTeam.shortName || awayTeam.name.slice(0, 3).toUpperCase(), barX + 275, barY + 28);

    // Away Team Color Bar
    ctx.fillStyle = awayTeam.primaryColor || '#2563eb';
    ctx.fillRect(barX + 285, barY, 8, barHeight);

    // Clock Section
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.roundRect(barX + 293, barY, 147, barHeight, [0, 6, 6, 0]);
    ctx.fill();

    // Compute active clock
    let currentSeconds = clock.seconds;
    if (clock.running && clock.lastStartedTimestamp) {
      currentSeconds += Math.floor((Date.now() - clock.lastStartedTimestamp) / 1000);
    }
    const mins = Math.floor(currentSeconds / 60).toString().padStart(2, '0');
    const secs = (currentSeconds % 60).toString().padStart(2, '0');
    const clockText = `${mins}:${secs}`;

    ctx.fillStyle = '#f59e0b'; // Gold sports clock
    ctx.font = '900 20px Inter, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(clockText, barX + 355, barY + 30);

    if (clock.addedSeconds > 0) {
      const addedMins = Math.floor(clock.addedSeconds / 60);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`+${addedMins}`, barX + 415, barY + 28);
    }
  }

  private drawGoalCelebration(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.matchState?.lastGoalEvent) return;
    const { teamName, minute } = this.matchState.lastGoalEvent;

    ctx.save();
    // Backdrop flash
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, width, height);

    // Goal Banner Container
    const bannerW = 600;
    const bannerH = 140;
    const bannerX = (width - bannerW) / 2;
    const bannerY = height * 0.28;

    ctx.shadowColor = 'rgba(234, 179, 8, 0.6)';
    ctx.shadowBlur = 30;

    const grad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY + bannerH);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(1, '#d97706');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 16);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚽ GOAL! គ្រាប់បាល់!', width / 2, bannerY + 65);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px Inter, Kantumruy Pro, sans-serif';
    ctx.fillText(`${teamName.toUpperCase()} • ${minute}'`, width / 2, bannerY + 110);
  }

  private drawHalfTimeBanner(ctx: CanvasRenderingContext2D, width: number, height: number, label: string) {
    if (!this.matchState) return;
    const { homeTeam, awayTeam, homeScore, awayScore } = this.matchState;

    const w = 700;
    const h = 200;
    const x = (width - w) / 2;
    const y = (height - h) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 20);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 24px Inter, Kantumruy Pro, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, width / 2, y + 45);

    // Big Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, Kantumruy Pro, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(homeTeam.name, width / 2 - 80, y + 120);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${homeScore} - ${awayScore}`, width / 2, y + 125);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, Kantumruy Pro, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(awayTeam.name, width / 2 + 80, y + 120);
  }

  private drawSponsorBanner(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.matchState) return;
    const { sponsorBanner } = this.matchState;

    const boxW = 280;
    const boxH = 50;
    const boxX = width - boxW - 40;
    const boxY = 35;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('OFFICIAL PARTNER', boxX + 16, boxY + 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(sponsorBanner.name || 'SPONSOR', boxX + 16, boxY + 40);
  }

  private drawLowerThird(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.matchState) return;
    const { lowerThird } = this.matchState;

    const w = 550;
    const h = 75;
    const x = 50;
    const y = height - 120;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, [0, 10, 10, 0]);
    ctx.fill();

    // Accent line
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x, y, 6, h);
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 20px Inter, Kantumruy Pro, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(lowerThird.title, x + 20, y + 32);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 14px Inter, Kantumruy Pro, sans-serif';
    ctx.fillText(lowerThird.subtitle, x + 20, y + 58);
  }

  private drawTicker(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.matchState?.ticker) return;
    const { text, backgroundColor, textColor, opacity, fontSize } = this.matchState.ticker;

    const barH = 36;
    const barY = height - barH;

    ctx.save();
    ctx.fillStyle = backgroundColor || '#0f172a';
    ctx.globalAlpha = opacity ?? 0.9;
    ctx.fillRect(0, barY, width, barH);
    ctx.restore();

    // Speed calculation
    const speed = this.matchState.ticker.speed === 'fast' ? 3 : this.matchState.ticker.speed === 'slow' ? 1 : 2;
    this.tickerOffset -= speed;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, barY, width, barH);
    ctx.clip();

    ctx.fillStyle = textColor || '#ffffff';
    ctx.font = `bold ${fontSize || 15}px Inter, Kantumruy Pro, sans-serif`;
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(text).width;
    if (this.tickerOffset < -textWidth) {
      this.tickerOffset = width;
    }

    ctx.fillText(text, this.tickerOffset, barY + barH / 2);
    ctx.restore();
  }

  getMediaStream(): MediaStream {
    return this.canvas.captureStream(30);
  }
}
