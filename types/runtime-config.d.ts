declare module '#app' {
  interface RuntimeConfig {
    livekit: {
      apiKey: string;
      apiSecret: string;
      wsUrl: string;
    };
    public: {
      livekit: {
        wsUrl: string;
      };
    };
  }
}

export {};
