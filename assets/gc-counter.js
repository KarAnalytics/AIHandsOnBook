// Live GoatCounter visitor counter, rendered as plain text in the book's font.
//
// MyST renders content client-side (React hydration) and re-renders it from
// embedded JSON, so we must NOT bake the counter into the build (that froze the
// old badge and broke page JSON). Instead we leave a plain-text token in the
// content and replace it in the live DOM here.
//
// We fetch GoatCounter's JSON count endpoint (CORS-enabled) and write the number
// as ordinary text -- e.g. "1,234 visitors" -- so it inherits the surrounding
// typography. A one-shot replace gets clobbered when React hydrates and restores
// the token, so a MutationObserver re-applies it whenever the token (re)appears
// (initial hydration and SPA navigation). Once the token is gone there is
// nothing to do, so it settles instead of looping.
(function () {
  var TOKEN = "GOATCOUNTER_VISITOR_COUNTER";
  var URL = "https://karanalytics.goatcounter.com/counter/TOTAL.json";
  var cached = null; // formatted count string, e.g. "1,234", once fetched
  var fetching = false;

  function label() {
    if (cached === null) return "…";
    return cached + (cached === "1" ? " visitor" : " visitors");
  }

  function makeSpan() {
    var span = document.createElement("span");
    span.className = "gc-visitor-counter";
    span.textContent = label();
    return span;
  }

  // Fill every counter span once the count is known.
  function fill() {
    var spans = document.querySelectorAll(".gc-visitor-counter");
    for (var i = 0; i < spans.length; i++) spans[i].textContent = label();
  }

  // Fetch the count once; reuse the cached value for all later swaps.
  function ensureCount() {
    if (cached !== null || fetching) return;
    fetching = true;
    fetch(URL)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        cached = d && d.count_unique != null ? String(d.count_unique) : "";
        fill();
      })
      .catch(function () { fetching = false; });
  }

  // Replace every occurrence of TOKEN inside a single text node with a span.
  function swapTextNode(node) {
    var parent = node.parentNode;
    if (!parent) return;
    var parts = node.nodeValue.split(TOKEN);
    for (var i = 0; i < parts.length; i++) {
      if (i > 0) parent.insertBefore(makeSpan(), node);
      parent.insertBefore(document.createTextNode(parts[i]), node);
    }
    parent.removeChild(node);
    ensureCount();
  }

  // Walk a subtree and swap any text node containing the token.
  function swap(root) {
    if (!root || root.nodeType !== 1) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var hits = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf(TOKEN) !== -1) hits.push(node);
    }
    for (var i = 0; i < hits.length; i++) swapTextNode(hits[i]);
  }

  function run() {
    try {
      swap(document.body);
    } catch (e) {
      /* never let this break the page */
    }
  }

  // Initial attempts (token may already be present, or arrive on load).
  run();
  if (document.readyState !== "complete") window.addEventListener("load", run);

  // Re-apply on any content (re)render. We only inspect newly-added nodes, so
  // this stays cheap and our own span insertions don't retrigger work.
  var obs = new MutationObserver(function (records) {
    for (var r = 0; r < records.length; r++) {
      var added = records[r].addedNodes;
      for (var i = 0; i < added.length; i++) {
        var n = added[i];
        if (n.nodeType === 3) {
          if (n.nodeValue && n.nodeValue.indexOf(TOKEN) !== -1) swapTextNode(n);
        } else if (n.nodeType === 1) {
          swap(n);
        }
      }
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
})();
