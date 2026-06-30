export const CONFIG = {
  mode: 'auto',
  security: {
    blockEval: true,
    blockFunctionConstructor: true,
    blockInternalFetch: true,
    blockSuspiciousStorage: true,
    blockDOMInjection: true,
    scanInterval: 30000,
    allowedDomains: [
      'supabase.co',
      'github.com',
      'localhost',
      '127.0.0.1'
    ]
  },
  voice: {
    enabled: true,
    language: 'id-ID',
    rate: 0.9,
    pitch: 1,
    fallbackToText: true,
    maxSilenceMs: 3000
  },
  sync: {
    defaultMode: 'every-1-hour',
    retryCount: 3,
    retryDelay: 5000
  },
  storage: {
    maxReports: 1000,
    maxLogs: 500,
    maxErrors: 100
  },
  mesh: {
    heartbeatInterval: 30000,
    gossipInterval: 60000,
    maxHops: 5,
    radius: 20
  },
  ui: {
    animationDuration: 300,
    toastDuration: 3000
  }
};
