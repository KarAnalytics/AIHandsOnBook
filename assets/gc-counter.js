// Live GoatCounter visitor counter, rendered as plain text in the book's font.
//
// MyST renders content client-side (React hydration) and re-renders it from
// embedded JSON, so we must NOT bake the counter into the build (that froze the
// old badge and broke page JSON). Instead we leave a plain-text token in the
// content and replace it in the live DOM here.
//
// We fetch GoatCounter's JSON count endpoint (CORS-enabled) and write the number
// as ordinary text -- e.g. "1,234 visitors" -- so it inherits the surrounding
// typography.
//
// The hard part is that React keeps restoring the token: it hydrates AFTER this
// script runs, and may revert our swap either by re-adding nodes (childList) or
// by rewriting the existing text node (characterData). So we (a) observe BOTH
// kinds of mutation, and (b) re-apply on a short poll for a few seconds so the
// last write after hydration settles is always ours. Once the token is gone
// there is nothing to swap, so it costs nothing.
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

  // Walk a subtree and swap any text node containing the token. Returns true if
  // at least one swap happened.
  function swap(root) {
    if (!root || root.nodeType !== 1) return false;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var hits = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf(TOKEN) !== -1) hits.push(node);
    }
    for (var i = 0; i < hits.length; i++) swapTextNode(hits[i]);
    return hits.length > 0;
  }

  function run() {
    try {
      return swap(document.body);
    } catch (e) {
      return false; // never let this break the page
    }
  }

  // Initial attempt (token may already be present in the server-rendered HTML).
  run();

  // Bounded poll: re-apply for a few seconds so we win the last write once React
  // finishes hydrating. Cheap when there's nothing to do; stops after the window.
  var ticks = 0;
  var poll = setInterval(function () {
    run();
    if (++ticks > 40) clearInterval(poll); // ~10s at 250ms
  }, 250);

  // Keep handling later re-renders (e.g. single-page navigation between
  // chapters) for the life of the page. Observe node additions AND text
  // rewrites, since React can restore the token either way.
  var obs = new MutationObserver(function () { run(); });
  obs.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
})();
