export type StreamStatus = 'IDLE' | 'CONNECTING' | 'LIVE' | 'RECONNECTING' | 'ENDED' | 'ERROR';

export interface StreamHealth {
  status: StreamStatus;
  fps: number;
  bitrateKbps: number;
  uptimeSeconds: number;
  droppedFrames: number;
  destination: string;
  isTestMode: boolean;
  lastHeartbeat: number;
  errorMessage?: string;
}

export class StreamGatewayService {
  private static instance: StreamGatewayService;
  private health: StreamHealth;
  private streamStartTime: number | null = null;
  private monitorTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.health = {
      status: 'IDLE',
      fps: 30,
      bitrateKbps: 2500, // standard 720p 30fps bitrate for Facebook Live
      uptimeSeconds: 0,
      droppedFrames: 0,
      destination: 'Facebook Live (RTMPS)',
      isTestMode: true,
      lastHeartbeat: Date.now(),
    };
  }

  static getInstance(): StreamGatewayService {
    if (!StreamGatewayService.instance) {
      StreamGatewayService.instance = new StreamGatewayService();
    }
    return StreamGatewayService.instance;
  }

  getHealth(): StreamHealth {
    if (this.health.status === 'LIVE' && this.streamStartTime) {
      this.health.uptimeSeconds = Math.floor((Date.now() - this.streamStartTime) / 1000);
    }
    return { ...this.health };
  }

  startBroadcast(testMode = false): StreamHealth {
    const streamKey = process.env.FACEBOOK_STREAM_KEY;
    if (!testMode && (!streamKey || streamKey === 'FB-Your-Live-Stream-Key-Here')) {
      this.health.status = 'ERROR';
      this.health.errorMessage = 'Facebook Stream Key is not configured in server environment (.env)';
      return this.health;
    }

    this.health.status = 'LIVE';
    this.health.isTestMode = testMode;
    this.health.errorMessage = undefined;
    this.streamStartTime = Date.now();
    this.health.lastHeartbeat = Date.now();

    console.log(`[StreamGateway] Broadcast started. Mode: ${testMode ? 'TEST MODE' : 'PRODUCTION FACEBOOK LIVE'}`);
    return this.getHealth();
  }

  stopBroadcast(): StreamHealth {
    this.health.status = 'ENDED';
    this.health.uptimeSeconds = 0;
    this.streamStartTime = null;
    console.log('[StreamGateway] Broadcast ended.');
    return this.getHealth();
  }

  updateMetrics(fps: number, bitrateKbps: number, droppedFrames: number): void {
    this.health.fps = fps;
    this.health.bitrateKbps = bitrateKbps;
    this.health.droppedFrames = droppedFrames;
    this.health.lastHeartbeat = Date.now();
  }
}
