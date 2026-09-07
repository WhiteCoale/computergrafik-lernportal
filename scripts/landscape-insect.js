(function () {
  "use strict";

  var insect = document.querySelector(".landscape-insect");
  var landscape = document.querySelector(".landscape");
  var scene = document.querySelector(".landscape-scene");
  if (!insect || !landscape || !scene) return;

  // Coordinates run across the visible viewport and up from the grass foreground.
  var places = [
    [.12, .34], [.24, .61], [.36, .39], [.48, .76], [.61, .48],
    [.74, .68], [.88, .32], [.79, .83], [.66, .26], [.53, .57],
    [.41, .24], [.29, .81], [.16, .66], [.07, .43], [.20, .22]
  ];
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var index = 0;
  var flying = false;
  var elapsed = 0;
  var previousTime = null;
  var frame = null;
  var width = 0;
  var height = 0;
  var grassHeight = 0;

  function point(place) {
    return { x: 24 + place[0] * Math.max(0, width - 48),
      y: height - 16 - place[1] * grassHeight };
  }

  function duration() {
    if (!flying) return 9 + (index * 7 % 9);
    var start = point(places[index]);
    var end = point(places[(index + 1) % places.length]);
    return 12 + Math.abs(end.x - start.x) / 35;
  }

  function paint() {
    var start = point(places[index]);
    var end = point(places[(index + 1) % places.length]);
    var progress = flying ? Math.min(1, elapsed / duration()) : 0;
    var eased = (1 - Math.cos(Math.PI * progress)) / 2;
    var arc = Math.sin(Math.PI * eased);
    var x = start.x + (end.x - start.x) * eased;
    var y = start.y + (end.y - start.y) * eased;
    y -= arc * (Math.min(42, height * .05) + 3 * Math.sin(eased * Math.PI * 4));
    insect.style.transform = "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px)";
  }

  function tick(time) {
    frame = null;
    if (previousTime !== null) elapsed += Math.min((time - previousTime) / 1000, .1);
    previousTime = time;
    if (elapsed >= duration()) {
      elapsed = 0;
      if (flying) index = (index + 1) % places.length;
      flying = !flying;
      insect.dataset.flying = String(flying);
      if (flying) {
        var next = places[(index + 1) % places.length];
        insect.style.setProperty("--insect-direction", next[0] > places[index][0] ? "1" : "-1");
      }
    }
    paint();
    frame = window.requestAnimationFrame(tick);
  }

  function syncMotion() {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    previousTime = null;
    if (reducedMotion.matches) {
      flying = false;
      elapsed = 0;
      insect.dataset.flying = "false";
      paint();
    } else if (!document.hidden) {
      frame = window.requestAnimationFrame(tick);
    }
  }

  function resize() {
    width = landscape.clientWidth;
    height = landscape.clientHeight;
    grassHeight = Math.min(scene.clientHeight * .14, height * .24);
    paint();
    insect.style.visibility = "visible";
  }

  new ResizeObserver(resize).observe(landscape);
  reducedMotion.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", syncMotion);
  resize();
  syncMotion();
}());
