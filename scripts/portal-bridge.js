(function () {
  "use strict";

  var file = decodeURIComponent(window.location.pathname.split("/").pop() || "").toLowerCase();
  var topics = {
    "affines-matrixlabor.html": { id: "affin", scoreKey: "cg-affin-score", total: 128 },
    "projektionslabor.html": { id: "projektion", scoreKey: "cg-proj-score", total: 98 },
    "rasterlabor.html": { id: "raster", scoreKey: "cg-raster-score", total: 97 },
    "phonglabor.html": { id: "phong", scoreKey: "cg-phong-score", total: 63 },
    "farblabor.html": { id: "farbe", scoreKey: "cg-farb-score", total: 68 },
    "strahlenlabor.html": { id: "strahlen", scoreKey: "cg-ray-score", total: 21 }
  };
  var topic = topics[file];
  if (!topic) { return; }

  var params = new URLSearchParams(window.location.search);
  var embedded = params.get("embed") === "1";
  var exam = params.get("exam") === "1";

  function applyTheme(theme) {
    var dark = theme === "dark";
    document.documentElement.setAttribute("data-theme",dark ? "dark" : "light");
    document.body.classList.toggle("cg-dark",dark);
  }

  function readScore() {
    var score = { ok: 0, bad: 0 };
    try {
      var raw = window.localStorage.getItem(topic.scoreKey);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Number.isFinite(parsed.ok) && Number.isFinite(parsed.bad)) {
        score.ok = parsed.ok;
        score.bad = parsed.bad;
      }
    } catch (error) { /* Lokale Dateien dürfen Storage je nach Browser einschränken. */ }
    return score;
  }

  function send(kind, extra) {
    if (window.parent === window) { return; }
    var payload = Object.assign({
      source: "cg-lernportal",
      kind: kind,
      topic: topic.id,
      total: topic.total,
      score: readScore()
    }, extra || {});
    window.parent.postMessage(payload, "*");
  }

  function selectView(view) {
    var button = document.querySelector('#tabs button[data-view="' + view + '"]');
    if (button) { button.click(); window.requestAnimationFrame(reportHeight); }
  }

  var heightFrame = 0;
  function reportHeight() {
    if (!embedded || window.parent === window) { return; }
    if (heightFrame) { window.cancelAnimationFrame(heightFrame); }
    heightFrame = window.requestAnimationFrame(function () {
      heightFrame = 0;
      var wrap = document.querySelector("body > .wrap");
      var height = wrap ? Math.max(wrap.offsetTop + wrap.offsetHeight, wrap.scrollHeight) : Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      send("content-height",{height:Math.ceil(height)});
    });
  }

  function installEmbedding() {
    if (!embedded) { return; }
    document.body.classList.add("cg-embedded");
    if (exam) { document.body.classList.add("cg-exam"); }
    var style = document.createElement("style");
    style.textContent = [
      "body.cg-embedded { --paper:#f5fbfe; --surface:#fff; --blue:#167eb8; --blue-soft:#e4f4fc; --rule:#dceaf1; }",
      "body.cg-embedded.cg-dark { --paper:#081321; --surface:#101d2d; --ink:#edf5fc; --ink-2:#b3c2d2; --ink-3:#8395a8; --blue:#70c3ec; --blue-soft:#162d43; --rule:#26384a; --red:#ff958b; --grid:#203247; --grid-axis:#526b82; --e1:#65d49a; --e2:#65cbe8; --origin:#ff83c8; --ghost:#53667b; background:#081321; color:#edf5fc; }",
      "body.cg-embedded > .wrap { max-width: 68rem; padding-top: 1rem; }",
      "body.cg-embedded > .wrap > header, body.cg-embedded > .wrap > footer { display:none; }",
      "body.cg-embedded .panel, body.cg-embedded .stage, body.cg-embedded .taskcard, body.cg-embedded .score, body.cg-embedded .duo, body.cg-embedded .classgrid { border-radius:14px; box-shadow:0 12px 32px rgba(24,87,119,.08); }",
      "body.cg-embedded button, body.cg-embedded .btn { border-radius:999px; touch-action:manipulation; }",
      "body.cg-embedded > .wrap > .tabs { display:none; }",
      "body.cg-exam #view-training > section > h2, body.cg-exam #view-training > section > .note, body.cg-exam #view-training .score { display:none; }",
      "body.cg-exam #view-training { gap:0; }",
      "body.cg-exam .verdict + .tactions { display:none; }",
      "@media (max-width: 48rem) {",
      "  body.cg-embedded { font-size: 15px; }",
      "  body.cg-embedded > .wrap { padding: 0.5rem 0.5rem 1.5rem !important; gap: 1rem !important; max-width: 100% !important; }",
      "  body.cg-embedded .panel, body.cg-embedded .stage, body.cg-embedded .taskcard, body.cg-embedded .score, body.cg-embedded .duo, body.cg-embedded .classgrid { padding: 0.8rem !important; border-radius: 12px !important; }",
      "  body.cg-embedded input, body.cg-embedded select, body.cg-embedded textarea { font-size: 16px !important; min-height: 40px; }",
      "  body.cg-embedded button, body.cg-embedded .btn { min-height: 44px; padding: 0.55rem 0.9rem !important; font-size: 0.88rem !important; }",
      "  body.cg-embedded .handle, body.cg-embedded [data-h], body.cg-embedded .grab, body.cg-embedded svg { touch-action: none !important; -webkit-tap-highlight-color: transparent; }",
      "  body.cg-embedded .tactions { flex-wrap: wrap !important; gap: 0.5rem !important; }",
      "  body.cg-embedded .tmatrix, body.cg-embedded .tgrid { flex-wrap: wrap !important; max-width: 100% !important; overflow-x: auto; }",
      "  body.cg-embedded table { display: block; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }",
      "  body.cg-embedded svg { max-width: 100%; height: auto; }",
      "}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function observeTraining() {
    var card = document.getElementById("taskcard");
    if (!card) { return; }
    var reportedVerdict = null;
    var observer = new MutationObserver(function () {
      var verdict = card.querySelector(".verdict");
      if (verdict && verdict !== reportedVerdict) {
        reportedVerdict = verdict;
        send("task-result", {
          correct: verdict.classList.contains("right"),
          exam: exam,
          taskLabel: (card.querySelector(".ttype") || {}).textContent || ""
        });
      }
      if (!verdict) { reportedVerdict = null; }
    });
    observer.observe(card, { childList: true, subtree: true });

    var scorePanel = document.querySelector(".score");
    if (scorePanel) {
      var scoreObserver = new MutationObserver(function () { send("score"); });
      scoreObserver.observe(scorePanel, { childList: true, subtree: true, characterData: true });
    }
  }

  installEmbedding();
  applyTheme(params.get("theme") === "dark" ? "dark" : "light");
  if (params.get("view") === "training" || exam) { selectView("training"); }
  observeTraining();
  send("ready", { exam: exam });
  reportHeight();
  window.addEventListener("load",reportHeight);
  window.addEventListener("resize", reportHeight);
  window.addEventListener("orientationchange", reportHeight);
  if (window.ResizeObserver) {
    var resizeObserver = new ResizeObserver(reportHeight);
    resizeObserver.observe(document.body);
  } else {
    var sizeObserver = new MutationObserver(reportHeight);
    sizeObserver.observe(document.body,{childList:true,subtree:true,attributes:true});
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.source !== "cg-lernportal-parent") { return; }
    if (data.kind === "set-theme") { applyTheme(data.theme); }
    if (data.kind === "select-view") { selectView(data.view); }
    if (data.kind === "request-score") { send("score"); }
    if (data.kind === "next-task") {
      var next = document.getElementById("btn_next");
      if (next) { next.click(); }
    }
    if (data.kind === "reset-score") {
      var reset = document.getElementById("sc_reset");
      if (reset) { reset.click(); }
      else {
        try { window.localStorage.setItem(topic.scoreKey,JSON.stringify({ok:0,bad:0})); } catch (error) { /* egal */ }
        send("score");
      }
    }
  });
}());
