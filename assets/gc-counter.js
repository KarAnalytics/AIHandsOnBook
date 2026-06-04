// Discreet GoatCounter visitor counter, shown as a small fixed footer line.
//
// The book is a Remix app that hydrates the whole document, so anything we put
// INSIDE the rendered content gets reverted by React on hydration (that's why
// the in-content counter kept losing to the token). The robust fix is to append
// a brand-new element React never rendered: it isn't part of React's virtual
// tree, so reconciliation leaves it alone. We add it after hydration and, as a
// safety net, re-append it if it's ever removed.
//
// Tracking itself does not depend on this script at all -- the GoatCounter
// dashboard (https://karanalytics.goatcounter.com) records every visit
// regardless. This is just a low-key on-page glance at the number.
(function () {
  var URL = "https://karanalytics.goatcounter.com/counter/TOTAL.json";
  var ID = "gc-visitor-footer";
  var count = null; // formatted unique-visitor string, e.g. "1,234"

  function node() {
    return document.getElementById(ID);
  }

  function label() {
    if (count === null) return "";
    return "👥 " + count + (count === "1" ? " visitor" : " visitors");
  }

  function render() {
    var el = node();
    if (!el) {
      el = document.createElement("div");
      el.id = ID;
      el.setAttribute(
        "style",
        [
          "position:fixed",
          "bottom:6px",
          "left:10px",
          "z-index:40",
          "font:12px/1.4 system-ui,-apple-system,sans-serif",
          "color:#9ca3af",
          "opacity:0.75",
          "pointer-events:none",
          "user-select:none",
        ].join(";")
      );
      document.body.appendChild(el);
    }
    el.textContent = label();
  }

  function load() {
    fetch(URL)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        count = j && j.count_unique != null ? String(j.count_unique) : "";
        render();
      })
      .catch(function () { /* leave it blank on failure */ });
  }

  // Mount after hydration so React doesn't flag our node as a mismatch.
  function start() {
    render();
    load();
  }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);

  // Safety net: if our (unmanaged) node is ever removed, put it back. Because
  // React doesn't track it, re-adding doesn't retrigger React, so this settles.
  var obs = new MutationObserver(function () {
    if (!node()) render();
  });
  obs.observe(document.body, { childList: true });
})();
