// ============================================
// SERVICE WORKER — SembakoKita.Pro v2026.07.01
// ============================================

const CACHE_NAME = 'sembakokita-v2026.07.01';
const OFFLINE_URL = '/offline.html';

// ============================================
// PRECACHE URLS — SEMUA FILE YANG DI-CACHE
// ============================================
const PRECACHE_URLS = [
  // === ROOT & HTML ===
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',

  // === CSS ===
  '/css/style.css',
  '/css/style-normal.css',
  '/css/style-krisis.css',
  '/css/style-survival.css',

  // === ICON ===
  '/assets/icons/icon-72.png',
  '/assets/icons/icon-96.png',
  '/assets/icons/icon-128.png',
  '/assets/icons/icon-144.png',
  '/assets/icons/icon-152.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-384.png',
  '/assets/icons/icon-512.png',

  // === CORE ===
  '/js/core/app.js',
  '/js/core/supabase.js',
  '/js/core/state-manager.js',
  '/js/core/components-ui.js',

  // === AGENT (9 FILE) ===
  '/js/agent/config.js',
  '/js/agent/error-handler.js',
  '/js/agent/health-check.js',
  '/js/agent/security-guard.js',
  '/js/agent/voice-engine.js',
  '/js/agent/chat-responder.js',
  '/js/agent/action-executor.js',
  '/js/agent/self-optimizer.js',
  '/js/agent/local-brain.js',

  // === ADAPTERS (4 FILE) ===
  '/js/adapters/device-health.js',
  '/js/adapters/module-manager.js',
  '/js/adapters/power-saver.js',
  '/js/adapters/mode-controller.js',

  // === SYNCHRONIZATION (3 FILE) ===
  '/js/synchronization/sync-engine.js',
  '/js/synchronization/background-sync.js',
  '/js/synchronization/conflict-resolver.js',

  // === UTILS (4 FILE) ===
  '/js/utils/encryption.js',
  '/js/utils/compression.js',
  '/js/utils/validator.js',
  '/js/utils/logger.js',

  // === MODULES (6 FILE) ===
  '/js/modules/inventory/inventory-controller.js',
  '/js/modules/barter/barter-controller.js',
  '/js/modules/mesh/mesh-controller.js',
  '/js/modules/ai/ai-assistant.js',
  '/js/modules/ledger/ledger-controller.js',
  '/js/modules/defense/security-controller.js',

  // === OPERATIONAL (12 FILE) ===
  '/js/operational/checklist/checklist-controller.js',
  '/js/operational/checklist/daily-lesson.js',
  '/js/operational/checklist/self-practice.js',
  '/js/operational/checklist/community-tips.js',
  '/js/operational/reports/report-controller.js',
  '/js/operational/reports/public-report.js',
  '/js/operational/reports/neighbor-solution.js',
  '/js/operational/reports/sos-emergency.js',
  '/js/operational/funding/funding-controller.js',
  '/js/operational/funding/report-generator.js',
  '/js/operational/logistics/logistics-controller.js',
  '/js/operational/logistics/warung-darurat.js'
];

// ============================================
// INSTALL
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching', PRECACHE_URLS.length, 'assets...');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// ============================================
// ACTIVATE
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// ============================================
// FETCH — Network First with Cache Fallback
// ============================================
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Supabase API calls
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, clone);
            });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page for HTML requests
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL) || new Response(
                `<html>
                  <head>
                    <title>Offline — SembakoKita.Pro</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body {
                        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                        text-align: center;
                        padding: 40px 20px;
                        background: #f0fdf4;
                        margin: 0;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                      }
                      .container {
                        max-width: 400px;
                        background: white;
                        padding: 40px 32px;
                        border-radius: 24px;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                      }
                      h1 { color: #065f46; font-size: 28px; margin: 16px 0 8px; }
                      p { color: #64748b; line-height: 1.6; margin: 8px 0; }
                      .emoji { font-size: 48px; }
                      .btn {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 32px;
                        background: #065f46;
                        color: white;
                        border: none;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        text-decoration: none;
                      }
                      .btn:hover { background: #047857; }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="emoji">📡</div>
                      <h1>Sedang Offline</h1>
                      <p>SembakoKita.Pro sedang offline.</p>
                      <p>Data tetap tersedia di perangkat Anda.</p>
                      <p style="color:#94a3b8;font-size:14px;">Koneksi internet diperlukan untuk sinkronisasi.</p>
                      <button class="btn" onclick="location.reload()">
                        🔄 Coba Lagi
                      </button>
                    </div>
                  </body>
                </html>`,
                { headers: { 'Content-Type': 'text/html' } }
              );
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// ============================================
// BACKGROUND SYNC
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Syncing data...');
  try {
    // Kirim ke Supabase via message ke client
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_TRIGGER',
        timestamp: new Date().toISOString()
      });
    });

    // Simpan status sync
    await caches.open(CACHE_NAME + '-meta')
      .then(cache => {
        cache.put('/sync-status', new Response(JSON.stringify({
          lastSync: new Date().toISOString(),
          status: 'success'
        })));
      });

    console.log('[SW] Sync complete');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'SembakoKita.Pro', body: 'Ada notifikasi baru' };
  }

  const title = data.title || 'SembakoKita.Pro';
  const options = {
    body: data.body || 'Ada notifikasi baru dari posko',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      type: data.type || 'info'
    },
    actions: [
      {
        action: 'open',
        title: '📱 Buka'
      },
      {
        action: 'dismiss',
        title: '✖ Tutup'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ============================================
// NOTIFICATION CLICK
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// ============================================
// MESSAGE HANDLING
// ============================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_CLEAR':
      caches.delete(CACHE_NAME)
        .then(() => {
          console.log('[SW] Cache cleared');
          if (event.ports && event.ports.length) {
            event.ports[0].postMessage({ success: true });
          }
        });
      break;

    case 'GET_SYNC_STATUS':
      caches.open(CACHE_NAME + '-meta')
        .then(cache => cache.match('/sync-status'))
        .then(response => response ? response.json() : null)
        .then(data => {
          if (event.ports && event.ports.length) {
            event.ports[0].postMessage({ status: data || { lastSync: null, status: 'unknown' } });
          }
        });
      break;

    case 'TRIGGER_SYNC':
      event.waitUntil(syncData());
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// ============================================
// UNHANDLED REJECTION HANDLER
// ============================================
self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event.reason);
});

console.log('🚀 SembakoKita.Pro Service Worker v2026.07.01 loaded');
