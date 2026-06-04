// Live GoatCounter visitor counter.
//
// MyST renders page content client-side and also embeds it as JSON for
// hydration, so we must NOT bake the counter into the HTML/JSON at build time
// (that both froze the old badge and, when it contained quotes, broke the JSON
// and blanked the page). Instead we leave a plain-text token in the content and
// replace it in the live DOM here, after MyST has rendered. The <img> points at
// GoatCounter's live SVG, so the browser re-fetches the current total each load.
(function () {
  var TOKEN = "GOATCOUNTER_VISITOR_COUNTER";
  var SRC = "https://karanalytics.goatcounter.com/counter/TOTAL.svg";

  function swap() {
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf(TOKEN) !== -1) {
        var parts = node.nodeValue.split(TOKEN);
        var parent = node.parentNode;
        var img = document.createElement("img");
        img.src = SRC;
        img.alt = "Total visitors";
        img.style.verticalAlign = "middle";
        parent.insertBefore(document.createTextNode(parts[0]), node);
        parent.insertBefore(img, node);
        parent.insertBefore(document.createTextNode(parts.slice(1).join(TOKEN)), node);
        parent.removeChild(node);
        return true;
      }
    }
    return false;
  }

  // MyST hydrates after load, so the token may not exist yet. Poll briefly,
  // then give up (other pages don't contain the token at all).
  var tries = 0;
  var timer = setInterval(function () {
    if (swap() || ++tries > 50) clearInterval(timer);
  }, 100);
})();
