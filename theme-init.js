/* ════════════════════════════════════════════════════════════════
   MJÖLK — Date-aware theme detection
   Runs synchronously in <head>. Sets data-theme on <html> before
   first paint so CSS overrides apply without a flash.

   Themes (priority order — first match wins on overlap):
     eid · ramadan · easter · valentine · jul · blackfriday

   Lunar/Easter/Black-Friday dates are hard-coded per year (lookup
   table) so this stays a tiny, fast head script. Update the table
   below every few years; current coverage 2026–2030.
   ════════════════════════════════════════════════════════════════ */
(function(){
  // [themeId, MM-DD start, MM-DD end] — listed in priority order
  var Y = {
    2026: [
      ['eid',         '03-20', '03-22'],
      ['ramadan',     '02-17', '03-19'],
      ['easter',      '03-29', '04-05'],
      ['valentine',   '02-01', '02-14'],
      ['blackfriday', '11-27', '11-30'],
      ['jul',         '12-01', '12-25']
    ],
    2027: [
      ['eid',         '03-10', '03-12'],
      ['ramadan',     '02-07', '03-09'],
      ['easter',      '03-21', '03-28'],
      ['valentine',   '02-01', '02-14'],
      ['blackfriday', '11-26', '11-29'],
      ['jul',         '12-01', '12-25']
    ],
    2028: [
      ['eid',         '02-26', '02-28'],
      ['ramadan',     '01-27', '02-25'],
      ['easter',      '04-09', '04-16'],
      ['valentine',   '02-01', '02-14'],
      ['blackfriday', '11-24', '11-27'],
      ['jul',         '12-01', '12-25']
    ],
    2029: [
      ['eid',         '02-14', '02-16'],
      ['ramadan',     '01-16', '02-13'],
      ['easter',      '03-25', '04-01'],
      ['valentine',   '02-01', '02-14'],
      ['blackfriday', '11-23', '11-26'],
      ['jul',         '12-01', '12-25']
    ],
    2030: [
      ['eid',         '02-04', '02-06'],
      ['ramadan',     '01-05', '02-03'],
      ['easter',      '04-14', '04-21'],
      ['valentine',   '02-01', '02-14'],
      ['blackfriday', '11-29', '12-02'],
      ['jul',         '12-01', '12-25']
    ]
  };

  function pad(n){ return n < 10 ? '0' + n : '' + n; }

  // Allow ?theme=valentine query string to force a theme (preview / QA)
  var forced = null;
  try {
    var q = window.location.search.match(/[?&]theme=([a-z]+)/);
    if (q) forced = q[1];
  } catch(e){}

  if (forced) {
    document.documentElement.setAttribute('data-theme', forced);
    window.MJOLK_THEME = forced;
    return;
  }

  var d = new Date();
  var year = d.getFullYear();
  var today = pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  var entries = Y[year] || [];

  for (var i = 0; i < entries.length; i++) {
    var t = entries[i];
    if (today >= t[1] && today <= t[2]) {
      document.documentElement.setAttribute('data-theme', t[0]);
      window.MJOLK_THEME = t[0];
      return;
    }
  }
})();
