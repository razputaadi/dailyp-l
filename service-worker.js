/* GYV / Ambria Cockpit — service worker
   ==========================================================================
   THE POINT OF THIS FILE IS INSTALLABILITY, NOT AGGRESSIVE CACHING.

   Read this before changing anything. The whole reason the app moved off
   HtmlService was that phones kept running yesterday's code. A naively written
   service worker recreates that exact problem, permanently and worse, because it
   sits in front of the network and answers from disk. So the rules here are
   deliberately conservative:

     1. The DOCUMENT is always fetched network-first. The cached copy is a fallback
        for being offline, never a first choice. New code therefore lands as soon
        as the phone has signal.
     2. Only same-origin GET requests are touched at all. Every API call is a POST
        to Apps Script, so it can never be cached, intercepted or replayed by this
        file. Fonts and CDN scripts are cross-origin and pass straight through.
     3. VERSION must match APP_BUILD in index.html. Bumping it renames the cache,
        which drops every old entry on activate. If you forget to bump it, an
        installed app can keep serving the previous shell.

   BUMP THIS ON EVERY DEPLOY.
   ========================================================================== */
/* The build stamp is imported, not repeated. Two copies of a version number are
   two chances for them to disagree, and when they disagree the phone keeps the old
   code. config.js is served no-cache (see _headers), so this is always fresh. */
try { importScripts('config.js'); } catch (e) { /* fall through to 'dev' */ }
var VERSION = (self.GYV_BUILD || 'dev');
var CACHE   = 'gyv-shell-' + VERSION;

/* Enough to open and render offline. Deliberately small: the fewer things are
   precached, the fewer things can go stale. */
var SHELL = [
  './',
  'index.html',
  'config.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'icons/icon-180.png'
];

self.addEventListener('install', function (e) {
  /* No skipWaiting() here on purpose. A new worker waits until the user taps
     Update, so a deploy can never swap code out from under someone who is
     halfway through entering a purchase. */
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        /* Individually, so one 404 cannot fail the whole install. */
        return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
      }));
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* index.html calls this when the user taps Update on the bar. */
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;

  /* Never touch anything but same-origin GET. That excludes every API POST to
     Apps Script, and excludes Google Fonts and cdnjs. */
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  var isDoc = req.mode === 'navigate' ||
              (req.headers.get('accept') || '').indexOf('text/html') >= 0;

  /* config.js is treated exactly like the document: NETWORK FIRST. It carries the
     API URL and the build stamp, so a stale copy would be the one thing capable of
     pinning a phone to an old build permanently. */
  var isConfig = url.pathname.slice(-10) === '/config.js';

  if (isDoc || isConfig) {
    if (isConfig) {
      e.respondWith(
        fetch(req).then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
          return res;
        }).catch(function () { return caches.match(req); })
      );
      return;
    }
    /* NETWORK FIRST. This is the rule that keeps code fresh. */
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('index.html').then(function (hit) {
          return hit || new Response(
            '<!DOCTYPE html><meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<body style="font-family:system-ui;padding:24px;color:#14201C">' +
            '<h3>Offline</h3><p>The cockpit could not be loaded and no cached copy is ' +
            'available. Reconnect and try again.</p></body>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
    );
    return;
  }

  /* Static assets: serve from cache for speed, then refresh in the background so
     the next load is current. Safe here because these are icons and the manifest,
     never application code. */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
