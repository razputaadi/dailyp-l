/* ==========================================================================
   GYV / Ambria Cockpit — CONFIGURATION
   ==========================================================================
   THIS IS THE ONLY FILE YOU NEED TO EDIT. There are exactly two settings.

   Written to work in both the page and the service worker, which is why it uses
   `self` rather than `window` — a service worker has no `window`, and putting the
   build number here means it can never disagree with itself.
   ========================================================================== */
(function (g) {

  /* ------------------------------------------------------------------ 1 of 2
     Your Apps Script Web App URL. Apps Script editor:
        Deploy  ->  Manage deployments  ->  copy the Web app URL
     It must END IN /exec. A URL ending in /dev will not work from a browser.

     >>> THIS IS A PLACEHOLDER. Paste your own /exec URL back in before pushing,
     >>> or the app will refuse every request with "Not configured yet".
     >>> It is not in this file because it has never been shared with me. */
  g.GYV_API_URL = 'https://script.google.com/macros/s/AKfycbwo-S7FQ33c9N88vatysgD40fux3_vg9R-w39PLOg4NfVVaKoDBAv2lGCy8P4nnYXY3/exec';

  /* ------------------------------------------------------------------ 2 of 2
     Build stamp. CHANGE THIS EVERY TIME YOU CHANGE ANY FILE.

     This is not decoration. It names the service worker's cache, so changing it
     is what tells every installed phone to throw away the old copy and take the
     new one. Leave it the same and a phone can keep running yesterday's code —
     which is the exact problem we left Google's hosting to escape.

     Any text works. A date plus a counter is easiest to read:
        2026-07-29-01   ->   2026-07-29-02   ->   2026-07-30-01

     Bumped from 2026-07-29-01 for the 11-12 Aug 2026 session. index.html changed
     substantially across it — the P&L rebuild, the Aggregator P&L, per-page PDF
     orientation, the export unclipping fix, the UOM line on the entry forms — so
     without this bump an installed phone would keep serving the July front end
     against an August backend, which is the worst of both. */
  g.GYV_BUILD = '2026-08-14-02';

})(typeof self !== 'undefined' ? self : this);
