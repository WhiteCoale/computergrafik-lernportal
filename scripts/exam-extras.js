/* Zusatzaufgaben aus den Altklausuren Oktober 2023 bis April 2026.
   Jede Laborseite holt sich hier ihre neuen Aufgabentypen (CGX.tasks),
   die passenden Etiketten (CGX.labels) und rendert sie über CGX.render.
   Die Erklärungen zu den neuen Formaten hängt CGX.mountExplain an. */
(function () {
  "use strict";

  /* ================= Hilfen ================= */
  function fmt(v) {
    var r = Math.round(v * 1000) / 1000;
    if (Object.is(r, -0)) { r = 0; }
    return String(r).replace(".", ",");
  }
  function parseNum(s) {
    s = String(s == null ? "" : s).trim().replace(/\s+/g, "").replace(/,/g, ".").replace(/−/g, "-");
    if (s === "") { return NaN; }
    var frac = s.match(/^([+-]?[0-9.]+)\/([+-]?[0-9.]+)$/);
    if (frac) {
      var a = parseFloat(frac[1]), b = parseFloat(frac[2]);
      return b ? a / b : NaN;
    }
    if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) { return NaN; }
    var n = parseFloat(s);
    return isFinite(n) ? n : NaN;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) {
    var r = a.slice(), i, j, t;
    for (i = r.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = r[i]; r[i] = r[j]; r[j] = t; }
    return r;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function vec(v) { return "(" + v.map(fmt).join(" | ") + ")"; }
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) { s += a[i] * b[i]; } return s; }
  function norm(a) { var l = Math.sqrt(dot(a, a)); return a.map(function (x) { return x / l; }); }
  function sub(a, b) { return a.map(function (x, i) { return x - b[i]; }); }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function nice(v, q) { q = q || 8; return Math.abs(v * q - Math.round(v * q)) < 1e-9; }
  function mulMV(m, v) {
    var n = v.length, out = [];
    for (var r = 0; r < n; r++) { var s = 0; for (var c = 0; c < n; c++) { s += m[r * n + c] * v[c]; } out.push(s); }
    return out;
  }
  function mulMM(a, b, n) {
    var out = [];
    for (var r = 0; r < n; r++) { for (var c = 0; c < n; c++) {
      var s = 0; for (var k = 0; k < n; k++) { s += a[r * n + k] * b[k * n + c]; } out.push(s);
    } }
    return out;
  }
  function det(m, n) {
    if (n === 1) { return m[0]; }
    var d = 0;
    for (var c = 0; c < n; c++) {
      var minor = [];
      for (var r = 1; r < n; r++) { for (var k = 0; k < n; k++) { if (k !== c) { minor.push(m[r * n + k]); } } }
      d += (c % 2 ? -1 : 1) * m[c] * det(minor, n - 1);
    }
    return d;
  }

  /* Teile einer Aufgabe */
  function mc(label, opts, a) {
    var idx = shuffle(opts.map(function (_, i) { return i; }));
    return { k: "choice", label: label, opts: idx.map(function (i) { return opts[i]; }), a: idx.indexOf(a) };
  }
  function num(label, sol, tol) { return { k: "num", label: label, sol: sol, tol: tol == null ? 0.011 : tol }; }
  function sel(opts, a, label) { return { k: "sel", opts: opts, a: a, label: label || "" }; }
  function row() { return { k: "row", parts: Array.prototype.slice.call(arguments) }; }
  function html(h) { return { k: "html", html: h }; }
  function mat(n, sol, opt) {
    opt = opt || {};
    return { k: "mat", n: n, cols: opt.cols || n, sol: sol, fixed: opt.fixed || {}, prop: !!opt.prop, label: opt.label || "" };
  }
  function staticMat(m, n, cols, hl) {
    cols = cols || n;
    var h = '<div class="cgx-m" style="grid-template-columns:repeat(' + cols + ',auto)">';
    for (var i = 0; i < m.length; i++) {
      h += '<span' + (hl && hl(i) ? ' class="hl"' : '') + '>' + (typeof m[i] === "number" ? fmt(m[i]) : m[i]) + '</span>';
    }
    return h + '</div>';
  }
  function T(type, label, prompt, parts, why, extra) {
    var t = { type: type, cgx: true, prompt: prompt, parts: parts, why: why || "" };
    if (extra) { for (var k in extra) { t[k] = extra[k]; } }
    return t;
  }
  /* reine Wissensfrage mit genau einer richtigen Antwort, die immer an Index 0 steht */
  function Q(type, q, opts, why) { return T(type, null, q, [mc("", opts, 0)], why); }

  /* ================= Rendern und Prüfen ================= */
  var uid = 0;
  function render(task) {
    var leaves = [];
    function leafId() { uid++; return "cgx_" + uid; }
    function part(p) {
      var id, h;
      if (p.k === "html") { return p.html; }
      if (p.k === "row") { return '<div class="cgx-row">' + p.parts.map(part).join("") + '</div>'; }
      if (p.k === "num") {
        id = leafId(); leaves.push({ p: p, id: id });
        return '<label class="cgx-f"><span>' + p.label + '</span><input type="text" inputmode="decimal" autocomplete="off" id="' + id + '"></label>';
      }
      if (p.k === "sel") {
        id = leafId(); leaves.push({ p: p, id: id });
        h = (p.label ? '<label class="cgx-f"><span>' + p.label + '</span>' : '') +
          '<select class="cgx-sel" id="' + id + '"><option value="">–</option>' +
          p.opts.map(function (o, i) { return '<option value="' + i + '">' + esc(o) + '</option>'; }).join("") + '</select>';
        return h + (p.label ? '</label>' : '');
      }
      if (p.k === "choice") {
        id = leafId(); leaves.push({ p: p, id: id });
        return '<div class="cgx-choice" id="' + id + '">' + (p.label ? '<span class="cgx-cap">' + p.label + '</span>' : '') +
          p.opts.map(function (o, i) {
            return '<label><input type="radio" name="' + id + '" value="' + i + '"><span>' + o + '</span></label>';
          }).join("") + '</div>';
      }
      if (p.k === "multi") {
        id = leafId(); leaves.push({ p: p, id: id });
        return '<div class="cgx-choice" id="' + id + '">' + (p.label ? '<span class="cgx-cap">' + p.label + '</span>' : '') +
          p.opts.map(function (o, i) {
            return '<label><input type="checkbox" name="' + id + '" value="' + i + '"><span>' + o + '</span></label>';
          }).join("") + '</div>';
      }
      if (p.k === "mat") {
        id = leafId(); leaves.push({ p: p, id: id });
        h = '<div class="cgx-matwrap">' + (p.label ? '<span class="cgx-cap">' + p.label + '</span>' : '') +
          '<div class="cgx-m cgx-min" id="' + id + '" style="grid-template-columns:repeat(' + p.cols + ',auto)">';
        for (var i = 0; i < p.sol.length; i++) {
          if (Object.prototype.hasOwnProperty.call(p.fixed, i)) { h += '<span class="fix">' + fmt(p.fixed[i]) + '</span>'; }
          else { h += '<input type="text" inputmode="decimal" autocomplete="off" data-i="' + i + '" aria-label="Eintrag ' + (i + 1) + '">'; }
        }
        return h + '</div></div>';
      }
      if (p.k === "table") {
        return '<div class="cgx-scroll"><table class="cgx-t"><thead><tr>' + p.head.map(function (x) { return '<th>' + x + '</th>'; }).join("") +
          '</tr></thead><tbody>' + p.rows.map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + (typeof c === "string" || typeof c === "number" ? c : part(c)) + '</td>'; }).join("") + '</tr>';
          }).join("") + '</tbody></table></div>';
      }
      if (p.k === "mset") {
        id = leafId(); leaves.push({ p: p, id: id });
        h = '<div class="cgx-scroll"><table class="cgx-t" id="' + id + '"><thead><tr><th>#</th>' +
          p.cols.map(function (c) { return '<th>' + c.label + '</th>'; }).join("") + '</tr></thead><tbody>';
        for (var r = 0; r < p.sol.length; r++) {
          h += '<tr><td class="cgx-n">' + (r + 1) + '</td>' + p.cols.map(function (c, ci) {
            if (c.k === "sel") {
              return '<td><select class="cgx-sel" data-r="' + r + '" data-c="' + ci + '"><option value="">–</option>' +
                c.opts.map(function (o, i) { return '<option value="' + i + '">' + esc(o) + '</option>'; }).join("") + '</select></td>';
            }
            return '<td><input type="text" inputmode="decimal" autocomplete="off" class="cgx-small" data-r="' + r + '" data-c="' + ci + '"></td>';
          }).join("") + '</tr>';
        }
        return h + '</tbody></table></div>';
      }
      return "";
    }
    var body = (task.prompt ? '<div class="tprompt cgx-prompt">' + task.prompt + '</div>' : '') +
      '<div class="cgx">' + task.parts.map(part).join("") + '</div>' +
      (task.hint ? '<p class="thint">' + task.hint + '</p>' : '');

    function numOk(p, v) {
      if (p.any) { return true; }
      return Math.abs(v - p.sol) <= p.tol + 1e-9;
    }
    function solTextOf(p) {
      if (p.k === "num") { return (p.label ? p.label.replace(/<[^>]+>/g, "") + " = " : "") + (p.any ? "beliebig" : fmt(p.sol)); }
      if (p.k === "sel") { return (p.label ? p.label + ": " : "") + p.opts[p.a]; }
      if (p.k === "choice") { return (p.label ? p.label.replace(/<[^>]+>/g, "") + ": " : "") + p.opts[p.a]; }
      if (p.k === "multi") { return p.a.length ? p.a.map(function (i) { return p.opts[i]; }).join(", ") : "keine der Optionen"; }
      if (p.k === "mat") {
        var rows = [];
        for (var r = 0; r < p.sol.length; r += p.cols) { rows.push(p.sol.slice(r, r + p.cols).map(fmt).join("  ")); }
        return (p.label ? p.label + " " : "") + "Matrix ( " + rows.join(" | ") + " )" + (p.prop ? " oder ein Vielfaches" : "");
      }
      return "";
    }

    function check() {
      var results = [], incomplete = false;
      leaves.forEach(function (L) {
        var p = L.p, node = document.getElementById(L.id);
        if (!node) { incomplete = true; return; }
        if (p.k === "num") {
          var raw = node.value.trim(), v = parseNum(raw);
          if (p.any) { results.push({ L: L, ok: true }); return; }
          if (isNaN(v)) { incomplete = true; return; }
          results.push({ L: L, ok: numOk(p, v) });
        } else if (p.k === "sel") {
          if (node.value === "") { incomplete = true; return; }
          results.push({ L: L, ok: parseInt(node.value, 10) === p.a });
        } else if (p.k === "choice") {
          var c = node.querySelector("input:checked");
          if (!c) { incomplete = true; return; }
          results.push({ L: L, ok: parseInt(c.value, 10) === p.a, chosen: parseInt(c.value, 10) });
        } else if (p.k === "multi") {
          var got = Array.prototype.map.call(node.querySelectorAll("input:checked"), function (x) { return parseInt(x.value, 10); });
          var ok = got.length === p.a.length && got.every(function (g) { return p.a.indexOf(g) >= 0; });
          results.push({ L: L, ok: ok, chosen: got });
        } else if (p.k === "mat") {
          var vals = p.sol.slice(), miss = false;
          Array.prototype.forEach.call(node.querySelectorAll("input"), function (inp) {
            var v2 = parseNum(inp.value);
            if (isNaN(v2)) { miss = true; }
            vals[parseInt(inp.getAttribute("data-i"), 10)] = v2;
          });
          Object.keys(p.fixed).forEach(function (k) { vals[k] = p.fixed[k]; });
          if (miss) { incomplete = true; return; }
          var scale = 1;
          if (p.prop) {
            // nur bis auf einen Faktor bestimmt: größten Lösungseintrag als Anker nehmen
            var ai = 0;
            p.sol.forEach(function (s, i) { if (Math.abs(s) > Math.abs(p.sol[ai])) { ai = i; } });
            scale = Math.abs(vals[ai]) > 1e-12 ? p.sol[ai] / vals[ai] : NaN;
          }
          var cellOk = vals.map(function (v3, i) { return Math.abs(v3 * scale - p.sol[i]) <= 0.011; });
          results.push({ L: L, ok: cellOk.every(Boolean), cells: cellOk });
        } else if (p.k === "mset") {
          var rows = [], missing = false;
          for (var r = 0; r < p.sol.length; r++) {
            var rv = [];
            for (var ci = 0; ci < p.cols.length; ci++) {
              var cell = node.querySelector('[data-r="' + r + '"][data-c="' + ci + '"]');
              var val = p.cols[ci].k === "sel" ? (cell.value === "" ? NaN : parseInt(cell.value, 10)) : parseNum(cell.value);
              if (isNaN(val)) { missing = true; }
              rv.push(val);
            }
            rows.push(rv);
          }
          if (missing) { incomplete = true; return; }
          // Reihenfolge egal: jede Zeile muss eine eigene Lösungszeile treffen
          var used = p.sol.map(function () { return false; });
          var rowOk = rows.map(function (rv2) {
            for (var s = 0; s < p.sol.length; s++) {
              if (used[s]) { continue; }
              if (p.sol[s].every(function (x, i) { return Math.abs(x - rv2[i]) < 1e-6; })) { used[s] = true; return true; }
            }
            return false;
          });
          results.push({ L: L, ok: rowOk.every(Boolean), rows: rowOk });
        }
      });
      if (incomplete) { return { incomplete: true }; }

      // Markieren
      results.forEach(function (res) {
        var p = res.L.p, node = document.getElementById(res.L.id);
        if (p.k === "num") { node.classList.add(res.ok ? "cgx-ok" : "cgx-bad"); }
        else if (p.k === "sel") { node.classList.add(res.ok ? "cgx-ok" : "cgx-bad"); node.disabled = true; }
        else if (p.k === "choice") {
          var labs = node.querySelectorAll("label");
          if (labs[p.a]) { labs[p.a].classList.add("cgx-right"); }
          if (!res.ok && labs[res.chosen]) { labs[res.chosen].classList.add("cgx-wrong"); }
        } else if (p.k === "multi") {
          Array.prototype.forEach.call(node.querySelectorAll("label"), function (lab, i) {
            var should = p.a.indexOf(i) >= 0, did = res.chosen.indexOf(i) >= 0;
            if (should) { lab.classList.add("cgx-right"); }
            if (did && !should) { lab.classList.add("cgx-wrong"); }
          });
        } else if (p.k === "mat") {
          Array.prototype.forEach.call(node.querySelectorAll("input"), function (inp) {
            var i = parseInt(inp.getAttribute("data-i"), 10);
            inp.classList.add(res.cells[i] ? "cgx-ok" : "cgx-bad");
          });
        } else if (p.k === "mset") {
          res.rows.forEach(function (ok, r) {
            Array.prototype.forEach.call(node.querySelectorAll('[data-r="' + r + '"]'), function (n) {
              n.classList.add(ok ? "cgx-ok" : "cgx-bad"); n.disabled = true;
            });
          });
        }
      });
      Array.prototype.forEach.call(document.querySelectorAll(".cgx select"), function (s) { s.disabled = true; });

      var allOk = results.every(function (r) { return r.ok; });
      var solText = task.solText;
      if (!solText) {
        var bits = results.filter(function (r) { return !r.ok; }).map(function (r) {
          if (r.L.p.k === "mset") {
            return "Instanzen: " + r.L.p.sol.map(function (s) {
              return s.map(function (v, i) { var c = r.L.p.cols[i]; return c.k === "sel" ? c.opts[v] : fmt(v); }).join(" · ");
            }).join(" | ");
          }
          return solTextOf(r.L.p);
        }).filter(Boolean);
        solText = bits.length ? "Richtig: " + bits.join("; ") + "." : "";
      }
      return { ok: allOk, solText: solText, why: task.why || "" };
    }
    return { html: body, check: check };
  }

  /* ================= Stil ================= */
  function injectStyle() {
    if (document.getElementById("cgx-style")) { return; }
    var st = document.createElement("style");
    st.id = "cgx-style";
    st.textContent = [
      ".cgx{display:flex;flex-direction:column;gap:0.9rem}",
      ".cgx-prompt{display:flex;flex-direction:column;gap:0.6rem}",
      ".cgx-prompt pre,.cgx-pre{font-family:'IBM Plex Mono',monospace;font-size:0.8rem;line-height:1.5;background:var(--blue-soft,#E8ECFA);border-left:2px solid var(--blue,#1E3FAE);padding:0.6rem 0.8rem;margin:0;overflow-x:auto;white-space:pre}",
      ".cgx-row{display:flex;flex-wrap:wrap;gap:0.7rem 1rem;align-items:flex-end}",
      ".cgx-f{display:flex;flex-direction:column;gap:0.2rem;align-items:flex-start}",
      ".cgx-f>span,.cgx-cap{font-family:'Libre Franklin',sans-serif;font-size:0.66rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-3,#8590A8);font-weight:600}",
      ".cgx-f input,.cgx-small,.cgx-min input{width:5.2rem;font-family:'IBM Plex Mono',monospace;font-size:0.95rem;padding:0.32rem 0.4rem;border:1px solid var(--rule,#E4E6EC);border-radius:3px;background:var(--surface,#fff);color:var(--ink,#16203A)}",
      ".cgx-small{width:3.6rem}",
      ".cgx-min input{width:3.7rem;text-align:center}",
      ".cgx-f input:focus,.cgx-small:focus,.cgx-min input:focus,.cgx-sel:focus{outline:none;border-color:var(--blue,#1E3FAE);background:var(--blue-soft,#E8ECFA)}",
      ".cgx-sel{font-family:'IBM Plex Mono',monospace;font-size:0.88rem;padding:0.3rem 0.35rem;border:1px solid var(--rule,#E4E6EC);border-radius:3px;background:var(--surface,#fff);color:var(--ink,#16203A);max-width:100%}",
      ".cgx .cgx-ok{color:var(--good,#158A4A)!important;border-color:var(--good,#158A4A)!important}",
      ".cgx .cgx-bad{color:var(--red,#C7362B)!important;border-color:var(--red,#C7362B)!important}",
      ".cgx-choice{display:flex;flex-direction:column;gap:0.35rem}",
      ".cgx-choice label{display:flex;align-items:flex-start;gap:0.55rem;font-size:0.95rem;cursor:pointer;padding:0.1rem 0.25rem;border-radius:3px}",
      ".cgx-choice input{margin-top:0.35rem;accent-color:var(--blue,#1E3FAE)}",
      ".cgx-choice label.cgx-right{background:color-mix(in srgb,var(--good,#158A4A) 14%,transparent)}",
      ".cgx-choice label.cgx-wrong{background:color-mix(in srgb,var(--red,#C7362B) 14%,transparent)}",
      ".cgx-m{display:inline-grid;gap:0.25rem 0.6rem;padding:0.35rem 0.7rem;border-left:2px solid var(--ink,#16203A);border-right:2px solid var(--ink,#16203A);border-radius:6px;font-family:'IBM Plex Mono',monospace;font-size:0.92rem;align-items:center;justify-items:center}",
      ".cgx-prompt .cgx-m,.cgx-matwrap .cgx-m{align-self:flex-start}",
      ".cgx-m .hl{color:var(--amber,#B8791C);font-weight:600}",
      ".cgx-m .fix{color:var(--ink-3,#8590A8)}",
      ".cgx-matwrap{display:flex;flex-direction:column;gap:0.3rem;align-items:flex-start}",
      ".cgx-scroll{overflow-x:auto;max-width:100%}",
      ".cgx-t{border-collapse:collapse;font-size:0.88rem;width:auto}",
      ".cgx-t th{text-align:left;font-family:'Libre Franklin',sans-serif;font-size:0.62rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-3,#8590A8);padding:0.25rem 0.6rem 0.35rem 0;border-bottom:1px solid var(--ink-3,#8590A8);white-space:nowrap}",
      ".cgx-t td{padding:0.35rem 0.6rem 0.35rem 0;border-bottom:1px solid var(--rule,#E4E6EC);vertical-align:middle}",
      ".cgx-n{color:var(--ink-3,#8590A8);font-family:'IBM Plex Mono',monospace}",
      ".cgx-fig{display:flex;flex-wrap:wrap;gap:1rem;align-items:center}",
      ".cgx-fig svg{max-width:100%;height:auto}",
      ".cgx-sp{width:230px}",
      ".cgx-choice .cgx-sp{width:190px}",
      ".cgx-sec{display:flex;flex-direction:column;gap:1.1rem}",
      ".cgx-badge{font-family:'IBM Plex Mono',monospace;font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--blue,#1E3FAE)}",
      ".cgx-formula{font-family:'IBM Plex Mono',monospace;font-size:0.86rem;line-height:1.85;background:var(--blue-soft,#E8ECFA);color:var(--ink,#16203A);border-left:2px solid var(--blue,#1E3FAE);padding:0.7rem 0.9rem;border-radius:0 2px 2px 0;overflow-x:auto}",
      ".cgx-formula em{font-style:normal;color:var(--ink-2,#55607A)}",
      ".cgx-traps{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:0.45rem}",
      ".cgx-traps li{font-size:0.94rem;padding-left:1.15rem;position:relative}",
      ".cgx-traps li::before{content:'✗';position:absolute;left:0;top:0.05em;color:var(--red,#C7362B);font-family:'IBM Plex Mono',monospace;font-size:0.85rem}",
      ".cgx-duo{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));border:1px solid var(--rule,#E4E6EC);border-radius:3px;background:var(--surface,#fff);overflow:hidden}",
      ".cgx-duo>article{padding:1rem 1.1rem 1.15rem;border-right:1px solid var(--rule,#E4E6EC);border-bottom:1px solid var(--rule,#E4E6EC);display:flex;flex-direction:column;gap:0.45rem}",
      ".cgx-duo h3{margin:0;font-size:0.98rem;font-weight:600;color:var(--blue,#1E3FAE);font-family:'IBM Plex Mono',monospace}",
      ".cgx-duo p{font-size:0.92rem;margin:0}",
      ".cgx-note{color:var(--ink-2,#55607A);font-size:0.97rem;margin:0}",
      "body.cg-embedded .cgx-duo{border-radius:14px}",
      "@media (max-width:48rem){.cgx-min input{width:3rem}.cgx-f input{width:4.4rem}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* ================= Zeichnungen ================= */
  // Spektrum aus drei Bandhöhen (blau, grün, rot), weich verbunden
  function spectrumSVG(levels, cls) {
    var W = 220, H = 96, x0 = 22, x1 = 210, yb = 76, yt = 16;
    var nodes = [[x0 + 20, levels[0]], [x0 + 94, levels[1]], [x1 - 20, levels[2]]];
    function val(x) {
      if (x <= nodes[0][0]) { return nodes[0][1]; }
      if (x >= nodes[2][0]) { return nodes[2][1]; }
      var i = x < nodes[1][0] ? 0 : 1;
      var t = (x - nodes[i][0]) / (nodes[i + 1][0] - nodes[i][0]);
      t = t * t * (3 - 2 * t);
      return nodes[i][1] + (nodes[i + 1][1] - nodes[i][1]) * t;
    }
    var pts = [], x;
    for (x = x0 + 2; x <= x1 - 2; x += 3) { pts.push(x + "," + (yb - (yb - yt) * val(x)).toFixed(1)); }
    return '<svg class="cgx-sp ' + (cls || "") + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Spektrum">' +
      '<line x1="' + x0 + '" y1="' + yb + '" x2="' + x1 + '" y2="' + yb + '" stroke="var(--ink-3,#8590A8)" stroke-width="1.2"/>' +
      '<line x1="' + x0 + '" y1="' + (yb + 2) + '" x2="' + x0 + '" y2="8" stroke="var(--ink-3,#8590A8)" stroke-width="1.2"/>' +
      '<line x1="' + (x0 - 4) + '" y1="' + yt + '" x2="' + (x0 + 4) + '" y2="' + yt + '" stroke="var(--ink-3,#8590A8)"/>' +
      '<text x="' + (x0 - 8) + '" y="' + (yt + 4) + '" font-size="10" text-anchor="end" fill="var(--ink-2,#55607A)" font-family="IBM Plex Mono,monospace">1</text>' +
      '<polyline points="' + pts.join(" ") + '" fill="none" stroke="var(--blue,#1E3FAE)" stroke-width="2.2" stroke-linejoin="round"/>' +
      ['blau', 'grün', 'rot'].map(function (n, i) {
        return '<text x="' + nodes[i][0] + '" y="' + (yb + 15) + '" font-size="10" text-anchor="middle" fill="var(--ink-3,#8590A8)" font-family="IBM Plex Mono,monospace">' + n + '</text>';
      }).join("") + '</svg>';
  }

  // Szenengraph als Schichtenbild
  function sceneSVG(g) {
    var layer = {}, order = [];
    function visit(id, d) {
      if (layer[id] === undefined || layer[id] < d) { layer[id] = d; }
      g.nodes[id].kids.forEach(function (k) { visit(k, d + 1); });
    }
    visit(0, 0);
    Object.keys(layer).forEach(function (id) { order.push(+id); });
    var byLayer = [];
    order.sort(function (a, b) { return a - b; }).forEach(function (id) {
      (byLayer[layer[id]] = byLayer[layer[id]] || []).push(id);
    });
    var BW = 112, BH = 36, GX = 22, GY = 34;
    var maxN = Math.max.apply(null, byLayer.map(function (l) { return l.length; }));
    var W = maxN * (BW + GX) + GX, H = byLayer.length * (BH + GY) + 10;
    var pos = {};
    byLayer.forEach(function (ids, li) {
      var span = ids.length * (BW + GX) - GX, start = (W - span) / 2;
      ids.forEach(function (id, i) { pos[id] = [start + i * (BW + GX), 8 + li * (BH + GY)]; });
    });
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:' + Math.min(W, 620) + 'px" role="img" aria-label="Szenengraph">' +
      '<defs><marker id="cgxar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--ink-3,#8590A8)"/></marker></defs>';
    g.nodes.forEach(function (n, id) {
      if (!pos[id]) { return; }
      n.kids.forEach(function (k) {
        s += '<line x1="' + (pos[id][0] + BW / 2) + '" y1="' + (pos[id][1] + BH) + '" x2="' + (pos[k][0] + BW / 2) + '" y2="' + (pos[k][1] - 1) +
          '" stroke="var(--ink-3,#8590A8)" stroke-width="1.2" marker-end="url(#cgxar)"/>';
      });
    });
    g.nodes.forEach(function (n, id) {
      if (!pos[id]) { return; }
      var x = pos[id][0], y = pos[id][1];
      var title = { group: "group", trans: "transformation", mat: "material", geom: "geometry" }[n.t];
      var sub = n.t === "trans" ? "translate(" + n.v[0] + "," + n.v[1] + ",0)" : (n.name || "");
      s += '<rect x="' + x + '" y="' + y + '" width="' + BW + '" height="' + BH + '" rx="3" fill="var(--surface,#fff)" stroke="var(--ink,#16203A)" stroke-width="1.3"/>' +
        '<text x="' + (x + BW / 2) + '" y="' + (y + (sub ? 15 : 22)) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--ink,#16203A)" font-family="Libre Franklin,Arial,sans-serif">' + title + '</text>' +
        (sub ? '<text x="' + (x + BW / 2) + '" y="' + (y + 28) + '" text-anchor="middle" font-size="10" fill="var(--ink-2,#55607A)" font-family="IBM Plex Mono,monospace">' + sub + '</text>' : '');
    });
    return s + '</svg>';
  }

  /* =========================================================
     1 · AFFINE ABBILDUNGEN
     ========================================================= */
  var CLASSES = ["affin", "rigid", "linear", "Rotation", "Translation"];
  function inClass(x, c) {
    var sup = { affin: ["affin"], rigid: ["rigid", "affin"], linear: ["linear", "affin"],
      Rotation: ["Rotation", "rigid", "linear", "affin"], Translation: ["Translation", "rigid", "affin"] };
    return sup[x].indexOf(c) >= 0;
  }
  function productClass(a, b) {
    if (a === b) { return a; }
    var cands = ["rigid", "linear", "affin"];
    for (var i = 0; i < cands.length; i++) { if (inClass(a, cands[i]) && inClass(b, cands[i])) { return cands[i]; } }
    return "affin";
  }

  function props(m, n) {
    var last = m.slice((n - 1) * n), affine = true, i, j;
    for (i = 0; i < n - 1; i++) { if (Math.abs(last[i]) > 1e-9) { affine = false; } }
    if (Math.abs(last[n - 1]) < 1e-9) { affine = false; }
    var tzero = true;
    for (i = 0; i < n - 1; i++) { if (Math.abs(m[i * n + n - 1]) > 1e-9) { tzero = false; } }
    var linear = affine && tzero;
    var L = [];
    for (i = 0; i < n - 1; i++) { for (j = 0; j < n - 1; j++) { L.push(m[i * n + j]); } }
    var k = n - 1, orth = true, sim = true, c0 = null;
    for (i = 0; i < k; i++) { for (j = 0; j < k; j++) {
      var s = 0; for (var r = 0; r < k; r++) { s += L[r * k + i] * L[r * k + j]; }
      if (Math.abs(s - (i === j ? 1 : 0)) > 1e-9) { orth = false; }
      if (i === j) { if (c0 === null) { c0 = s; } else if (Math.abs(s - c0) > 1e-9) { sim = false; } }
      else if (Math.abs(s) > 1e-9) { sim = false; }
    } }
    var projective = Math.abs(det(m, n)) > 1e-9;
    return { linear: linear, affine: affine && projective, rigid: affine && orth, projective: projective,
      angles: affine && sim && projective, translation: affine && !tzero };
  }

  var PROP_MATS = [
    { n: 3, m: [0, -1, 0, 1, 0, 0, 0, 0, 1], src: "Okt 2023" },
    { n: 3, m: [1, 0, 0, 1, 1, 0, 1, 1, 1], src: "Okt 2023" },
    { n: 3, m: [1, 0, 1, 0, 1, 1, 0, 0, 1], src: "Okt 2023" },
    { n: 3, m: [1, 0, 1, 0, 1, 2, 0, 0, 1], src: "Okt 2023" },
    { n: 3, m: [1, 0.5, 0, 0, 1, 0.5, 0, 0, 1], src: "Apr 2026" },
    { n: 3, m: [2, 0, 0, 0, 2, 0, 0, 0, 1] },
    { n: 3, m: [2, 0, 1, 0, 1, 0, 0, 0, 1] },
    { n: 3, m: [-1, 0, 2, 0, 1, 0, 0, 0, 1] },
    { n: 3, m: [0, 1, 0, 1, 0, 0, 0, 0, 1] },
    { n: 3, m: [1, 1, 0, 0, 1, 0, 0, 0, 1] },
    { n: 3, m: [1, 0, 0, 0, 1, 0, 1, 0, 1] },
    { n: 3, m: [0, -2, 0, 2, 0, 0, 0, 0, 1] },
    { n: 4, m: [1, 0, 0, -1, 0, 1, 0, -1, 0, 0, 2, -1, 0, 0, 0, 1], src: "Okt 2025" },
    { n: 4, m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], src: "Okt 2025" },
    { n: 4, m: [1, 2, 3, 0, 2, 3, 1, 0, 3, 2, 1, -1, 0, 0, -1, 0], src: "Okt 2025" },
    { n: 4, m: [1, 1, 1, 0, -1, 1, 1, 0, -1, -1, 1, 0, 0, 0, 0, 1], src: "Okt 2025" },
    { n: 4, m: [0, -1, 0, 3, 1, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 1] },
    { n: 4, m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -3, -4, 0, 0, -1, 0] }
  ];

  var AFFPROJ_ROWS = [
    ["Parallele Geraden bleiben parallel", 1, 0],
    ["Geraden werden auf Geraden abgebildet", 1, 1],
    ["Kreise werden auf Kreise abgebildet", 0, 0],
    ["Endliche Punkte bleiben endlich", 1, 0],
    ["Längen bleiben erhalten", 0, 0],
    ["Winkel bleiben erhalten", 0, 0],
    ["Teilverhältnisse (z. B. Mittelpunkte) bleiben erhalten", 1, 0],
    ["Das Doppelverhältnis bleibt erhalten", 1, 1]
  ];

  function affinTasks() {
    var out = [];

    // Produktklassen (Apr 2024 1f, Okt 2024 1e)
    var pairs = [];
    CLASSES.forEach(function (a, i) { CLASSES.forEach(function (b, j) { if (j >= i) { pairs.push([a, b]); } }); });
    pairs.forEach(function (p) {
      var ab = Math.random() < 0.5 ? p : [p[1], p[0]];
      var res = productClass(ab[0], ab[1]);
      out.push(T("prod", null, "<p><strong>A</strong> ist " + ab[0] + ", <strong>B</strong> ist " + ab[1] +
        ". Zu welcher <em>kleinsten</em> Unterklasse gehört das Produkt A · B im Allgemeinen?</p>",
        [mc("", CLASSES, CLASSES.indexOf(res))],
        ab[0] === ab[1] && res !== "affin" ? "Die Klasse " + res + " ist abgeschlossen: das Produkt zweier solcher Abbildungen bleibt darin." :
        res === "rigid" ? "Beide sind rigid (Längen bleiben), aber Drehung und Verschiebung zusammen sind weder reine Drehung noch reine Verschiebung." :
        res === "linear" ? "Beide lassen den Ursprung fest, also auch das Produkt — mehr lässt sich nicht sagen." :
        "Eine Verschiebung zerstört die Linearität, eine Skalierung oder Scherung die Rigidität. Übrig bleibt nur affin."));
    });

    // Eigenschaften ankreuzen (Okt 2023 1g, Okt 2025 1e, Apr 2026 1f)
    PROP_MATS.forEach(function (e) {
      var p = props(e.m, e.n);
      var names = ["linear", "rigid", "affin", "projektiv (invertierbar)", "winkeltreu", "enthält eine Translation"];
      var keys = ["linear", "rigid", "affine", "projective", "angles", "translation"];
      var a = []; keys.forEach(function (k, i) { if (p[k]) { a.push(i); } });
      out.push(T("props", null, "<p>Welche Eigenschaften hat die durch diese homogene Matrix beschriebene Abbildung? Mehrfachauswahl.</p>" +
        staticMat(e.m, e.n, e.n, function (i) { return i >= (e.n - 1) * e.n; }),
        [{ k: "multi", opts: names, a: a }],
        "Letzte Zeile (0 … 0 1) heißt affin, sonst projektiv. Linear: zusätzlich keine Translation. Rigid: Spalten des linearen Teils orthonormal. " +
        "Winkeltreu: Spalten orthogonal und gleich lang. Projektiv ist jede invertierbare Matrix — det = " + fmt(det(e.m, e.n)) + "."));
    });

    // Affin vs. projektiv (Apr 2025 1g)
    for (var r = 0; r < 4; r++) {
      var rows = shuffle(AFFPROJ_ROWS).slice(0, 4);
      out.push(T("affproj", null, "<p>Welche Eigenschaften haben affine und projektive Abbildungen?</p>",
        [{ k: "table", head: ["Eigenschaft", "affin", "projektiv"], rows: rows.map(function (x) {
          return [x[0], sel(["ja", "nein"], x[1] ? 0 : 1), sel(["ja", "nein"], x[2] ? 0 : 1)];
        }) }],
        "Projektiv bleiben nur Geraden und das Doppelverhältnis erhalten. Affin zusätzlich Parallelität, Teilverhältnisse und Endlichkeit. Längen, Winkel und Kreise erhält keine von beiden im Allgemeinen."));
    }

    // Abbildung um einen Punkt (Apr 2024 1d, Apr 2026 1g)
    var centers = [[1, 0], [0, 1], [1, 1], [2, 1], [-1, 2], [1, -1]];
    var ops = [
      { n: "gleichmäßige Skalierung mit Faktor 2", L: [2, 0, 0, 2] },
      { n: "gleichmäßige Skalierung mit Faktor ½", L: [0.5, 0, 0, 0.5] },
      { n: "Drehung um 90° gegen den Uhrzeigersinn", L: [0, -1, 1, 0] },
      { n: "Drehung um 180°", L: [-1, 0, 0, -1] },
      { n: "Skalierung nur in x mit Faktor 3", L: [3, 0, 0, 1] }
    ];
    centers.forEach(function (c) {
      var o = pick(ops), L = o.L;
      var t = [c[0] - (L[0] * c[0] + L[1] * c[1]), c[1] - (L[2] * c[0] + L[3] * c[1])];
      var sol = [L[0], L[1], t[0], L[2], L[3], t[1], 0, 0, 1];
      out.push(T("pivot", null, "<p>Gesucht ist die homogene Matrix der <strong>" + o.n + "</strong> mit Zentrum (" + c.map(fmt).join(", ") +
        "). Trage das ausmultiplizierte Produkt ein.</p>",
        [mat(3, sol, { fixed: { 6: 0, 7: 0, 8: 1 } })],
        "Richtige Reihenfolge: T(c) · S · T(−c). Rechts steht, was zuerst passiert — Zentrum in den Ursprung schieben, abbilden, zurückschieben. " +
        "Ergebnis: linearer Teil bleibt, Translation t = c − L·c = (" + t.map(fmt).join(", ") + ")."));
      out.push(T("pivot", null, "<p>Welches Produkt beschreibt die " + o.n + " um das Zentrum c = (" + c.map(fmt).join(", ") + ")?</p>",
        [mc("", ["T(c) · S · T(−c)", "T(−c) · S · T(c)", "S · T(c) · T(−c)", "T(c) · T(−c) · S"], 0)],
        "Matrixprodukte wirken von rechts nach links: zuerst T(−c) holt das Zentrum in den Ursprung, dann S, dann T(c) zurück."));
    });
    [[1, 1, 2], [2, 0, 2], [0, 1, 3], [-1, 1, 0.5]].forEach(function (e) {
      var c = [e[0], e[1]], s = e[2];
      out.push(T("pivot", null, "<p>Erkläre, was dieses Produkt homogener 2D-Matrizen tut:</p><div class='cgx-fig'>" +
        staticMat([1, 0, c[0], 0, 1, c[1], 0, 0, 1], 3) + staticMat([s, 0, 0, 0, s, 0, 0, 0, 1], 3) +
        staticMat([1, 0, -c[0], 0, 1, -c[1], 0, 0, 1], 3) + "</div>",
        [mc("", ["Gleichmäßige Skalierung mit Faktor " + fmt(s) + " um das Zentrum (" + c.map(fmt).join(", ") + ")",
          "Skalierung um den Ursprung, danach Verschiebung um (" + c.map(fmt).join(", ") + ")",
          "Gleichmäßige Skalierung mit Faktor " + fmt(s) + " um das Zentrum (" + c.map(function (v) { return fmt(-v); }).join(", ") + ")",
          "Verschiebung um (" + fmt(2 * c[0]) + ", " + fmt(2 * c[1]) + "), die Skalierung hebt sich auf"], 0)],
        "Rechts zuerst: T(−c) schiebt den Punkt c in den Ursprung, dort wird skaliert, T(c) schiebt zurück. Der Punkt c bleibt also fest (Wie Apr 2026 1g)."));
    });

    // Projektive Abbildung als Matrix (Okt 2023 1h, Apr 2024 1e)
    var coefs = [
      [[1, 0, 1], [0, 1, 0], [0, 1, 1]], [[1, 0, 0], [0, 1, 3], [1, 0, 1]], [[2, 0, 0], [0, 1, 1], [1, 1, 0]],
      [[1, 1, 0], [0, 1, 0], [0, 0, 1]], [[0, 1, 2], [1, 0, 0], [1, 0, 1]], [[1, 0, 0], [1, 1, 0], [0, 1, 1]]
    ];
    function lin(c, vars) {
      var terms = [];
      c.forEach(function (k, i) {
        if (!k) { return; }
        var v = vars[i];
        terms.push((k === 1 && v ? "" : fmt(k)) + v);
      });
      return terms.length ? terms.join(" + ").replace(/\+ -/g, "− ") : "0";
    }
    coefs.forEach(function (c) {
      var den = lin(c[2], ["x", "y", ""]);
      out.push(T("projmap", null, "<p>Beschreibe diese projektive 2D-Abbildung durch eine homogene 3×3-Matrix:</p>" +
        '<div class="cgx-formula">(x, y) ↦ ( (' + lin(c[0], ["x", "y", ""]) + ') / (' + den + ') ,  (' + lin(c[1], ["x", "y", ""]) + ') / (' + den + ') )</div>',
        [mat(3, [].concat(c[0], c[1], c[2]), { prop: true })],
        "Homogen schreiben: Zähler werden die ersten beiden Zeilen, der gemeinsame Nenner die letzte Zeile. Nach der Division durch w entsteht genau die Abbildung. Jedes Vielfache der Matrix ist ebenfalls richtig."));
    });
    [[[1, 0, 0, 0], [0, 1, 0, 3], [0, 0, 1, 0], [1, 1, 1, 1]], [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 1], [0, 0, 1, 0]]].forEach(function (c) {
      var den = lin(c[3], ["x", "y", "z", ""]);
      out.push(T("projmap", null, "<p>Beschreibe diese projektive 3D-Abbildung durch eine homogene 4×4-Matrix (wie Okt 2023 1h):</p>" +
        '<div class="cgx-formula">(x, y, z) ↦ ( (' + lin(c[0], ["x", "y", "z", ""]) + ')/(' + den + '), (' + lin(c[1], ["x", "y", "z", ""]) + ')/(' + den + '), (' +
        lin(c[2], ["x", "y", "z", ""]) + ')/(' + den + ') )</div>',
        [mat(4, [].concat(c[0], c[1], c[2], c[3]), { prop: true })],
        "Die drei Zähler sind die ersten drei Zeilen, der Nenner die letzte Zeile. Jedes Vielfache ist dieselbe projektive Abbildung."));
    });

    // Punkte, die ins Unendliche gehen (Apr 2025 1f)
    [[1, 0, 1], [0, 1, -1], [1, 1, 0], [1, -1, 2], [0, 2, 1]].forEach(function (rw) {
      var m = [1, 0, 0, 0, 1, 0].concat(rw);
      function line(a, b, c) { return lin([a, b, c], ["x", "y", ""]) + " = 0"; }
      out.push(T("infset", null, "<p>Die folgende Matrix ist nicht affin. Welche Punkte (x, y) werden ins Unendliche abgebildet?</p>" +
        staticMat(m, 3, 3, function (i) { return i >= 6; }),
        [mc("", ["Die Gerade " + line(rw[0], rw[1], rw[2]), "Die Gerade " + line(rw[1], rw[0], rw[2]),
          "Nur der Ursprung", "Kein Punkt, eine Matrix bildet immer endlich ab"], 0)],
        "w = " + lin(rw, ["x", "y", ""]) + ". Wird w = 0, kann nicht mehr geteilt werden — das Bild ist ein Fernpunkt. Die Menge w = 0 ist eine Gerade."));
    });

    // Keine Lösung (Apr 2025 1d, Okt 2025 1d)
    [[1, 1, 1, 1], [1, 0, 0, 0], [0, 0, 1, 1], [2, 1, 2, 1]].forEach(function (e) {
      var m = [e[0], e[1], 0, e[2], e[3], 0, 0, 0, 1];
      out.push(T("nosol", null, "<p>Rechts soll ein achsenparalleles Rechteck entstehen. Warum gibt es <em>kein</em> Urbild, das diese Matrix auf ein Rechteck abbildet?</p>" +
        staticMat(m, 3),
        [mc("", ["Die Matrix ist singulär (det = 0): Alle Punkte landen auf einer Geraden, eine Fläche ist als Bild unmöglich.",
          "Die Matrix ist nicht rigid, deshalb verändert sie die Form.",
          "Es fehlt eine Translation, das Rechteck liegt nicht im Ursprung.",
          "Die Matrix ist projektiv und bildet Rechtecke immer auf Trapeze ab."], 0)],
        "Die beiden Spalten des linearen Teils sind linear abhängig. Das Bild der ganzen Ebene ist nur eine Gerade durch den Ursprung."));
    });

    // Benannte Abbildungen (Okt 2023 1a–f)
    [
      ["Gleichmäßige Skalierung mit Faktor 2", [2, 0, 0, 0, 2, 0]],
      ["Umrechnung von Metern in Millimeter", [1000, 0, 0, 0, 1000, 0]],
      ["Umrechnung von Zentimetern in Meter", [0.01, 0, 0, 0, 0.01, 0]],
      ["Drehung um 90° gegen den Uhrzeigersinn", [0, -1, 0, 1, 0, 0]],
      ["Drehung um 90° im Uhrzeigersinn", [0, 1, 0, -1, 0, 0]],
      ["Spiegelung an der y-Achse", [-1, 0, 0, 0, 1, 0]],
      ["Spiegelung an der x-Achse", [1, 0, 0, 0, -1, 0]],
      ["Spiegelung an der Geraden x = 1", [-1, 0, 2, 0, 1, 0]],
      ["Spiegelung an der Geraden y = 1", [1, 0, 0, 0, -1, 2]],
      ["Spiegelung an der Geraden y = x", [0, 1, 0, 1, 0, 0]],
      ["Spiegelung am Ursprung (Punktspiegelung)", [-1, 0, 0, 0, -1, 0]],
      ["Drehung um 90° gegen den Uhrzeigersinn, danach Verschiebung um (2, 1)", [0, -1, 2, 1, 0, 1]],
      ["Scherung in x-Richtung: e₂ wird auf (1, 1) abgebildet", [1, 1, 0, 0, 1, 0]]
    ].forEach(function (e) {
      out.push(T("named", null, "<p>Gib die homogene 3×3-Matrix an: <strong>" + e[0] + "</strong>.</p>",
        [mat(3, e[1].concat([0, 0, 1]), { fixed: { 6: 0, 7: 0, 8: 1 } })],
        "Spalte 1 und 2 sind die Bilder von e₁ und e₂, Spalte 3 das Bild des Ursprungs. Spiegelung an x = 1: erst nach x = 0 schieben, spiegeln, zurück — der Ursprung landet bei (2, 0)."));
    });
    return out;
  }

  /* =========================================================
     2 · PERSPEKTIVE UND TEXTUREN
     ========================================================= */
  function projektionTasks() {
    var out = [];

    // Kamerakoordinatensystem (Okt 2023 2a)
    [
      [[1, 2, 6], [1, 2, 3]], [[5, 1, 0], [1, 1, 0]], [[3, 0, 4], [0, 0, 0]], [[0, 3, 0], [0, 0, 0], [0, 0, -1]],
      [[2, 1, -3], [2, 1, 1]], [[4, 5, 3], [0, 5, 0]], [[0, 0, 0], [-6, 0, 8]]
    ].forEach(function (e) {
      var eye = e[0], at = e[1], up = e[2] || [0, 1, 0];
      var z = norm(sub(eye, at)), x = norm(cross(up, z)), y = cross(z, x);
      if (![].concat(x, y, z).every(function (v) { return nice(v, 10); })) { return; }
      out.push(T("cam", null, "<p>Eine Kamera steht in <strong>e = " + vec(eye) + "</strong>, blickt auf <strong>" + vec(at) + "</strong>, Up-Vektor " + vec(up) +
        ". Bestimme das Kamerakoordinatensystem (OpenGL-Konvention: die Kamera blickt entlang −z).</p>" +
        '<div class="cgx-formula">z<sub>c</sub> = (e − Ziel) / |e − Ziel| &nbsp; x<sub>c</sub> = up × z<sub>c</sub> normiert &nbsp; y<sub>c</sub> = z<sub>c</sub> × x<sub>c</sub></div>',
        [row(num("x<sub>c</sub>.x", x[0]), num("x<sub>c</sub>.y", x[1]), num("x<sub>c</sub>.z", x[2])),
         row(num("y<sub>c</sub>.x", y[0]), num("y<sub>c</sub>.y", y[1]), num("y<sub>c</sub>.z", y[2])),
         row(num("z<sub>c</sub>.x", z[0]), num("z<sub>c</sub>.y", z[1]), num("z<sub>c</sub>.z", z[2]))],
        "Ursprung ist das Auge " + vec(eye) + ". z zeigt vom Ziel weg, also entgegen der Blickrichtung " + vec(norm(sub(at, eye))) +
        ". Falls in der Klausur z in Blickrichtung zeigen soll, dreht sich nur das Vorzeichen von z (und damit von x)."));
    });

    // FOV und Seitenverhältnis (Okt 2023 2c)
    [[-1, 1, -1, 1, 1], [-2, 2, -1, 1, 1], [-1, 1, -1, 1, 2], [-2, 2, -2, 2, 1], [-4, 4, -2, 2, 2], [-1.5, 1.5, -1, 1, 2], [-3, 3, -1, 1, 1]].forEach(function (f) {
      var fov = 2 * Math.atan(f[3] / f[4]) * 180 / Math.PI, asp = (f[1] - f[0]) / (f[3] - f[2]);
      out.push(T("fov", null, "<p>Das Fenster auf der Near-Plane ist durch l = " + fmt(f[0]) + ", r = " + fmt(f[1]) + ", b = " + fmt(f[2]) + ", t = " + fmt(f[3]) +
        " gegeben, die Near-Plane liegt bei n = " + fmt(f[4]) + ". Wie groß sind vertikaler Öffnungswinkel und Seitenverhältnis?</p>",
        [row(num("fovy in Grad", fov, 0.6), num("aspect", asp))],
        "fovy = 2 · atan(t / n) = 2 · atan(" + fmt(f[3] / f[4]) + ") ≈ " + fmt(Math.round(fov * 10) / 10) + "°. aspect = (r − l)/(t − b) = " + fmt(asp) + "."));
    });

    // Projektionsmatrix aufstellen (Okt 2023 2d, Apr 2024 2a, Okt 2024 2a)
    [[90, 1, 1, 3], [90, 1, 1, 2], [90, 2, 1, 3], [90, 1, 2, 6], [53.13, 1, 1, 3], [90, 1, 1, 1001], [90, 0.5, 1, 2]].forEach(function (p) {
      var c = 1 / Math.tan(p[0] / 2 * Math.PI / 180), a = p[1], n = p[2], f = p[3];
      c = Math.round(c * 1000) / 1000;
      var sol = [c / a, 0, 0, 0, 0, c, 0, 0, 0, 0, -(f + n) / (f - n), -2 * f * n / (f - n), 0, 0, -1, 0];
      out.push(T("persmat", null, "<p>Stelle die Perspektivmatrix (gluPerspective) auf: fovy = " + fmt(p[0]) + "°, aspect = " + fmt(a) +
        ", near = " + fmt(n) + ", far = " + fmt(f) + ". Brüche wie 4/3 sind erlaubt.</p>" +
        '<div class="cgx-formula">f = cot(fovy/2) &nbsp; M = [ f/aspect 0 0 0 | 0 f 0 0 | 0 0 −(far+near)/(far−near) −2·far·near/(far−near) | 0 0 −1 0 ]</div>',
        [mat(4, sol)],
        "cot(" + fmt(p[0] / 2) + "°) = " + fmt(c) + ". Dritte Zeile: −(" + fmt(f) + "+" + fmt(n) + ")/(" + fmt(f) + "−" + fmt(n) + ") = " + fmt(sol[10]) +
        " und −2·" + fmt(f) + "·" + fmt(n) + "/(" + fmt(f - n) + ") = " + fmt(sol[11]) + "."));
    });
    [[-1, 1, -1, 1, 1, 1001], [-1, 1, -1, 1, 1, 3], [0, 2, -1, 1, 1, 3], [-2, 2, -1, 1, 2, 4]].forEach(function (p) {
      var l = p[0], r = p[1], b = p[2], t = p[3], n = p[4], f = p[5];
      var sol = [2 * n / (r - l), 0, (r + l) / (r - l), 0, 0, 2 * n / (t - b), (t + b) / (t - b), 0, 0, 0, -(f + n) / (f - n), -2 * f * n / (f - n), 0, 0, -1, 0];
      out.push(T("persmat", null, "<p>Stelle die Frustum-Matrix (glFrustum) für l = " + fmt(l) + ", r = " + fmt(r) + ", b = " + fmt(b) + ", t = " + fmt(t) +
        ", n = " + fmt(n) + ", f = " + fmt(f) + " auf (wie Okt 2023 2d).</p>" +
        '<div class="cgx-formula">[ 2n/(r−l) 0 (r+l)/(r−l) 0 | 0 2n/(t−b) (t+b)/(t−b) 0 | 0 0 −(f+n)/(f−n) −2fn/(f−n) | 0 0 −1 0 ]</div>',
        [mat(4, sol)],
        "Bei symmetrischem Frustum verschwinden die Einträge (r+l)/(r−l) und (t+b)/(t−b). n = 1, f = 1001 gibt −1,002 und −2,002."));
    });

    // Tiefe nach Perspektive (Okt 2024 2b, Okt 2025 2b)
    [[1, 3], [1, 2], [2, 6], [1, 5], [1, 9]].forEach(function (nf) {
      var n = nf[0], f = nf[1];
      var zs = [-n, -f, -2 * n, -(n + f) / 2];
      var z = pick(zs);
      var d = (f + n) / (f - n) + 2 * f * n / ((f - n) * z);
      out.push(T("depth", null, "<p>Perspektivmatrix mit near = " + fmt(n) + " und far = " + fmt(f) + ". Auf welchen Tiefenwert nach der perspektivischen Division wird der Punkt mit z = " + fmt(z) + " (Kamerakoordinaten) abgebildet?</p>" +
        '<div class="cgx-formula">z\' = (f + n)/(f − n) + 2fn / ((f − n) · z)</div>',
        [num("z' nach Division", d, 0.01)],
        "z = −n ergibt −1, z = −f ergibt +1. Dazwischen ist die Abbildung hyperbolisch: die Hälfte des Wertebereichs liegt sehr nah an der Near-Plane."));
    });
    [[2, -3], [3, -4], [1.5, -2.5], [5, -6]].forEach(function (ab) {
      var a = ab[0], b = ab[1], near = -b / (a + 1), far = -b / (a - 1);
      out.push(T("depth", null, "<p>Die Matrix blickt in +z-Richtung (letzte Zeile 0 0 1 0). Ihre dritte Zeile ist (0 0 " + fmt(a) + " " + fmt(b) +
        "). Wo liegen Near-Plane (Tiefe −1) und Far-Plane (Tiefe +1)?</p>" + staticMat([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, a, b, 0, 0, 1, 0], 4, 4, function (i) { return i >= 12; }),
        [row(num("z<sub>near</sub>", near), num("z<sub>far</sub>", far))],
        "Tiefe = (" + fmt(a) + "·z " + (b < 0 ? "− " + fmt(-b) : "+ " + fmt(b)) + ")/z = " + fmt(a) + " + " + fmt(b) + "/z. Gleich −1 setzen: z = " + fmt(near) + ", gleich +1: z = " + fmt(far) + "."));
    });

    // Punkt- oder Parallelperspektive (Apr 2025 2b, Apr 2026 2a)
    [
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -2, -3, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, -0.1, 1, 0, 0, 0, 1],
      [0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, -3, -4, 0, 0, -1, 0],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, -3, 0, 0, 1, 0],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 3]
    ].forEach(function (m) {
      var par = Math.abs(m[12]) < 1e-9 && Math.abs(m[13]) < 1e-9 && Math.abs(m[14]) < 1e-9;
      var vps = [12, 13, 14].filter(function (i) { return Math.abs(m[i]) > 1e-9; }).length;
      out.push(T("ptype", null, "<p>Beschreibt diese Matrix eine Punkt- oder eine Parallelperspektive? Wie viele Fluchtpunkte (für die drei Achsenrichtungen) hat das Bild?</p>" +
        staticMat(m, 4, 4, function (i) { return i >= 12; }),
        [mc("Art", ["Punktperspektive", "Parallelperspektive"], par ? 1 : 0), num("Anzahl Fluchtpunkte", vps)],
        par ? "Letzte Zeile (0 0 0 1): w bleibt 1, es wird nie durch die Tiefe geteilt — Parallelen bleiben parallel, kein Fluchtpunkt."
          : "Die letzte Zeile hängt von x, y oder z ab, also wird geteilt. Ein Fluchtpunkt existiert für jede Achse, deren Eintrag in der letzten Zeile ≠ 0 ist: Spalte i durch M[3][i] teilen."));
    });

    // Homogener Fernpunkt (Okt 2024 2c/d, Okt 2024 2d)
    out.push(Q("hom", "Wo liegt der homogene Punkt P = (0, 0, 1, 0) in der Welt?",
      ["Unendlich weit entfernt in z-Richtung — es ist ein Richtungsvektor (Fernpunkt)", "Im Punkt (0, 0, 1)", "Im Ursprung", "Er existiert nicht, w = 0 ist verboten"],
      "Homogene Punkte mit w = 0 sind Richtungen. Unter einer Perspektive werden sie auf den Fluchtpunkt der Richtung abgebildet."));
    out.push(T("hom", null, "<p>Wohin bildet die Matrix den Fernpunkt (0, 0, 1, 0) ab? Gib die Bildkoordinaten nach der Division an.</p>" +
      staticMat([0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, -3, -4, 0, 0, -1, 0], 4, 4, function (i) { return i >= 12; }),
      [row(num("x", 0), num("y", 0), num("Tiefe", 3))],
      "M · (0,0,1,0) ist einfach die dritte Spalte (0, 0, −3, −1). Division durch −1 gibt (0, 0 | 3) — der Fluchtpunkt der z-Achse liegt in der Bildmitte."));
    out.push(Q("hom", "Die Projektion hat einen Fluchtpunkt bei (0, 0), die letzte Zeile ist (0 0 −1 0). Zu welcher Achse gehört er und warum?",
      ["Zur z-Achse: Spalte 3 durch ihren w-Eintrag geteilt ergibt (0, 0)", "Zur x-Achse: Spalte 1 hat w = 0", "Zur y-Achse, weil y nach oben zeigt", "Zu keiner, Fluchtpunkte gibt es nur bei Parallelprojektion"],
      "Nur Achsen mit w-Eintrag ≠ 0 haben einen endlichen Fluchtpunkt. Bei (0 0 −1 0) ist das ausschließlich z."));

    // Linie und Mittelpunkt (Apr 2026 2b–d)
    var P = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0];
    var Qm = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -2, -3, 0, 0, 0, 1];
    [[[-1, -1, -1], [1, 1, -2]], [[-1, 1, -1], [1, -1, -3]], [[0, -1, -1], [2, 1, -2]], [[-2, -2, -2], [2, 2, -4]], [[1, 1, -1], [-1, -1, -3]]].forEach(function (ab) {
      var A = ab[0], B = ab[1], Mi = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
      function pr(m, p) { var h = mulMV(m, [p[0], p[1], p[2], 1]); return [h[0] / h[3], h[1] / h[3]]; }
      var a = pr(P, A), b = pr(P, B), mm = pr(P, Mi), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      var isMid = Math.abs(mid[0] - mm[0]) < 1e-9 && Math.abs(mid[1] - mm[1]) < 1e-9;
      out.push(T("line", null, "<p>Strecke AB in Kamerakoordinaten: A = " + vec(A) + ", B = " + vec(B) + ", Mittelpunkt M = " + vec(Mi) +
        ". Projiziere alle drei mit P (Bildkoordinaten nach Division).</p>" + staticMat(P, 4, 4, function (i) { return i >= 12; }),
        [row(num("A′ x", a[0]), num("A′ y", a[1])), row(num("B′ x", b[0]), num("B′ y", b[1])), row(num("M′ x", mm[0]), num("M′ y", mm[1])),
         mc("Ist M′ der Mittelpunkt von A′B′?", ["ja", "nein"], isMid ? 0 : 1)],
        "w = −z: A wird durch " + fmt(-A[2]) + ", B durch " + fmt(-B[2]) + " und M durch " + fmt(-Mi[2]) + " geteilt. " +
        (isMid ? "Hier liegen A und B gleich tief, deshalb bleibt die Mitte zufällig erhalten." :
          "Mitte von A′B′ wäre " + vec(mid) + " — projektive Abbildungen erhalten keine Teilverhältnisse, affine schon. Mit der Parallelprojektion Q bleibt M′ die Mitte.")));
    });
    out.push(T("line", null, "<p>Projiziere A = (−1, −1, −1) und B = (1, 1, −2) mit der Parallelprojektion Q. Wie lauten die Bildpunkte?</p>" +
      staticMat(Qm, 4, 4, function (i) { return i >= 12; }),
      [row(num("A′ x", -1), num("A′ y", -1), num("A′ Tiefe", -1)), row(num("B′ x", 1), num("B′ y", 1), num("B′ Tiefe", 1))],
      "w bleibt 1, x und y werden direkt übernommen. Tiefe = −2z − 3: z = −1 ergibt −1, z = −2 ergibt 1. Der Mittelpunkt (0, 0, −1,5) landet genau in der Mitte bei (0, 0 | 0)."));

    // Texturen: Distanzen bei MIP-Mapping (Apr 2025 5c/d, Okt 2025 5c/d)
    [[256, 64, 60], [256, 64, 40], [512, 128, 30], [256, 32, 80], [128, 32, 50], [512, 64, 100]].forEach(function (c) {
      var N = c[0], r0 = c[1], d0 = c[2];
      var targets = [r0 / 2, r0 / 4, r0 * 2].filter(function (r) { return r >= 1 && r <= N; });
      out.push(T("mipdist", null, "<p>Ein Logo ist eine quadratische Textur mit " + N + "×" + N + " Texeln. Bei " + d0 + " m Abstand wählt MIP-Mapping genau die Stufe " + r0 + "×" + r0 +
        ". Bei welchem Abstand wird welche Auflösung gewählt, und ab wann (darunter) ist Vergrößerungs-Aliasing zu erwarten?</p>",
        targets.map(function (r) { return num(r + "×" + r + " bei … m", r0 * d0 / r); }).concat([num("Magnification unter … m", r0 * d0 / N)]),
        "Die benötigte Auflösung ist umgekehrt proportional zum Abstand: halber Abstand, doppelte Auflösung. Die volle Auflösung " + N + "×" + N +
        " reicht bis " + fmt(r0 * d0 / N) + " m — näher dran müsste man feiner als das Original sein, also wird vergrößert."));
    });
    // Stufe 0 = 1 Pixel (Apr 2024 2e/f)
    [[10, 3, 5], [20, 4, 5], [8, 2, 2], [40, 5, 10], [12, 3, 3]].forEach(function (c) {
      var d = c[0], L = c[1], d2 = c[2], L2 = L + Math.log(d / d2) / Math.log(2);
      out.push(T("mipdist", null, "<p>MIP-Map-Stufe 0 ist die gröbste Stufe mit nur einem Pixel. Ein Punkt in " + d + " m Abstand wird mit Stufe " + L +
        " gerendert. Welche Stufe gilt bei " + d2 + " m, und ab welcher Entfernung wird nur noch Stufe 0 verwendet?</p>",
        [row(num("Stufe bei " + d2 + " m", L2), num("Stufe 0 ab … m", d * Math.pow(2, L)))],
        "Jede Halbierung des Abstands braucht eine feinere Stufe (+1). Stufe 0 erreicht man nach " + L + " Verdopplungen: " + d + " · 2^" + L + " = " + (d * Math.pow(2, L)) + " m."));
    });
    // Trilineare Stufen (Okt 2023 3g)
    [[10, 8, 30], [10, 8, 20], [10, 8, 40], [10, 6, 15], [5, 7, 12], [20, 9, 50]].forEach(function (c) {
      var lv = c[1] - Math.log(c[2] / c[0]) / Math.log(2), lo = Math.floor(lv + 1e-9), hi = Math.ceil(lv - 1e-9);
      out.push(T("trilin", null, "<p>Bei " + c[0] + " m ist MIP-Stufe " + c[1] + " exakt optimal (kleinere Stufe = gröber). Welche Stufe(n) mischt trilineare Interpolation bei " + c[2] + " m?</p>",
        [row(num("untere Stufe", lo), num("obere Stufe", hi))],
        "log₂(" + c[2] + "/" + c[0] + ") = " + fmt(Math.log(c[2] / c[0]) / Math.log(2)) + ", optimale Stufe also " + fmt(lv) + ". " +
        (lo === hi ? "Ganzzahlig — es wird genau Stufe " + lo + " benutzt (beide Felder gleich)." : "Trilinear mischt die beiden Nachbarstufen " + lo + " und " + hi + ".")));
    });

    // Perspektivisch korrekte Interpolation (Apr 2025 5a/b, Okt 2025 5a/b)
    var uvs = [[[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 1], [0, 1]], [[1, 0], [0, 1], [0, 0]], [[0, 0], [1, 0], [1, 1]]];
    [[1, 1, 3], [2, 1, 3], [1, 2, 2], [1, 1, 4], [2, 4, 1], [3, 1, 2]].forEach(function (zs, i) {
      var uv = uvs[i % uvs.length], z = zs;
      var e = pick([[1, 2], [0, 1], [0, 2]]);
      var lam = [0, 0, 0]; lam[e[0]] = 0.5; lam[e[1]] = 0.5;
      var den = 0, nu = 0, nv = 0;
      for (var k = 0; k < 3; k++) { den += lam[k] / z[k]; nu += lam[k] * uv[k][0] / z[k]; nv += lam[k] * uv[k][1] / z[k]; }
      var names = ["A", "B", "C"];
      out.push(T("pcorr", null, "<p>Dreieck ABC im Bildraum. P ist der Mittelpunkt von " + names[e[0]] + names[e[1]] + " <em>nach</em> der Projektion.</p>" +
        '<div class="cgx-scroll"><table class="cgx-t"><thead><tr><th>Ecke</th><th>(u, v)</th><th>z</th></tr></thead><tbody>' +
        names.map(function (n, j) { return '<tr><td>' + n + '</td><td>(' + uv[j].join(", ") + ')</td><td>' + z[j] + '</td></tr>'; }).join("") + '</tbody></table></div>',
        [row(num("λ<sub>A</sub>", lam[0]), num("λ<sub>B</sub>", lam[1]), num("λ<sub>C</sub>", lam[2])), row(num("u(P)", nu / den), num("v(P)", nv / den))],
        "Im Bildraum ist P = ½·" + names[e[0]] + " + ½·" + names[e[1]] + ". Perspektivisch korrekt: u = Σ λᵢ·uᵢ/zᵢ geteilt durch Σ λᵢ/zᵢ. Nenner hier " + fmt(den) +
        ", also u = " + fmt(nu) + "/" + fmt(den) + " und v = " + fmt(nv) + "/" + fmt(den) + ". Die nähere Ecke (kleineres z) zieht P stärker zu sich."));
    });

    // Wissensfragen Texturen und Kamera
    out.push(Q("texmc", "Ein schachbrettartig texturiertes kleines Quadrat bewegt sich langsam durch das Pixelraster, ohne Antialiasing. Was zeigt ein einzelnes Pixel?",
      ["Es springt zwischen Schwarz und Weiß hin und her (Flackern)", "Konstant mittleres Grau", "Konstant Schwarz", "Einen weichen Verlauf"],
      "Ohne Filterung wird nur ein Texel pro Pixel abgetastet — je nach Position mal schwarz, mal weiß (Okt 2023 3b)."));
    out.push(Q("texmc", "Dasselbe bewegte Quadrat, jetzt mit MIP-Mapping. Was zeigt das Pixel?",
      ["Ein ruhiges Grau — der Mittelwert der Texel im Footprint", "Weiterhin Flackern", "Schwarz, weil die gröbste Stufe dunkel ist", "Ein Moiré-Muster"],
      "Die passende MIP-Stufe hat die Texel schon gemittelt (Okt 2023 3c)."));
    out.push(Q("texmc", "Warum hilft anisotropes MIP-Mapping bei einer stark schräg gesehenen Fläche?",
      ["Der Pixel-Footprint ist dort lang und schmal; isotropes MIP-Mapping müsste nach der langen Seite filtern und verwischt quer dazu", "Weil der Footprint dort kreisförmig ist", "Weil dort Magnification auftritt", "Weil anisotrope Filter weniger Speicher brauchen"],
      "Anisotrop mittelt entlang der langen Achse mehrere Proben einer feineren Stufe (Okt 2023 3d, Apr 2025 5e)."));
    out.push(Q("texmc", "Bei welcher Projektion einer Textur hilft anisotropes MIP-Mapping am meisten?",
      ["Boden, der flach zum Horizont läuft", "Frontal betrachtete, gleichmäßig verkleinerte Fläche", "Frontal betrachtete, vergrößerte Fläche", "Um 45° in der Bildebene gedrehte Fläche"],
      "Nur wenn die Verzerrung in zwei Richtungen verschieden stark ist, ist der Footprint anisotrop."));
    out.push(Q("texmc", "Ein texturiertes Quadrat wird perspektivisch abgebildet und in zwei Dreiecke zerlegt, die Textur aber linear (nicht perspektivisch korrekt) interpoliert. Was sieht man?",
      ["Einen Knick der Texturlinien entlang der Diagonale", "Ein korrektes, zur Ferne hin dichteres Schachbrett", "Gar keinen Unterschied", "Löcher zwischen den Dreiecken"],
      "Jedes Dreieck wird für sich affin verzerrt, an der gemeinsamen Diagonale passen die Richtungen nicht zusammen (Apr 2024 2d)."));
    out.push(Q("texmc", "Texturkoordinaten laufen von 0 bis 2. Was bewirkt der Wrap-Modus REPEAT?",
      ["Die Textur wird 2×2-mal gekachelt wiederholt", "Die Randtexel werden gestreckt", "Außerhalb von [0, 1] bleibt die Fläche schwarz", "Die Textur wird gespiegelt"],
      "REPEAT nimmt nur den Nachkommaanteil der Koordinate (Okt 2025 5c)."));
    out.push(Q("texmc", "Was zeigt eine Fläche, wenn nur die gröbste MIP-Stufe benutzt wird?",
      ["Eine einzige Farbe: den Mittelwert der ganzen Textur", "Die Textur in voller Auflösung", "Nur das Texel links oben", "Ein Schachbrett aus 2×2 Feldern"],
      "Die gröbste Stufe hat genau ein Texel."));
    out.push(Q("texmc", "Ein Texel ist im Bild größer als ein Pixel. Wie heißt das?",
      ["Magnification (Vergrößerung)", "Minification (Verkleinerung)", "Anisotropie", "Mipmapping"],
      "Mehrere Pixel teilen sich ein Texel → vergrößert (Okt 2024 2f)."));
    out.push(Q("texmc", "In welchem WebGL-Shader wird die Projektionsmatrix immer benötigt?",
      ["Im Vertex-Shader", "Im Fragment-Shader", "In beiden gleichermaßen", "In keinem, das macht die Hardware"],
      "Der Vertex-Shader muss die Clip-Koordinaten gl_Position liefern (Okt 2023 2e)."));
    out.push(Q("texmc", "Die Kamera soll animiert werden. Welche Rotationsdarstellung eignet sich zum Interpolieren?",
      ["Quaternionen (slerp)", "Rotationsmatrizen, eintragsweise interpoliert", "Euler-Winkel", "Die Kameramatrix selbst"],
      "Interpolierte Matrizen sind nicht mehr orthonormal, Euler-Winkel haben Gimbal Lock (Okt 2023 2b)."));
    out.push(Q("texmc", "Zwei Bilder desselben Würfels: einmal fovy = 30°, einmal fovy = 90°, gleiche Kameraposition. Wo erscheint der Würfel größer?",
      ["Bei fovy = 30°", "Bei fovy = 90°", "Gleich groß", "Hängt nur von aspect ab"],
      "Kleinerer Öffnungswinkel wirkt wie ein Teleobjektiv: weniger Szene, also größer (Apr 2025 2a)."));
    out.push(Q("texmc", "Der Würfel erscheint in die Breite gezogen. Welcher Parameter passt nicht zum Fenster?",
      ["aspect — er ist kleiner als das tatsächliche Seitenverhältnis des Bildes", "fovy ist zu groß", "near ist zu klein", "far ist zu klein"],
      "aspect muss Breite/Höhe des Bildes sein. Ist er zu klein, wird horizontal gestreckt (Apr 2025 2a, Okt 2025 2c)."));
    out.push(Q("texmc", "Im Bild ist der Würfel vorne abgeschnitten, man sieht in ihn hinein. Welcher Parameter erklärt das?",
      ["near liegt hinter der Würfelvorderseite", "far ist zu groß", "aspect ist 2", "fovy ist zu klein"],
      "Alles vor der Near-Plane wird weggeclippt (Okt 2025 2c)."));
    return out;
  }

  /* =========================================================
     3 · RASTERISIERUNG
     ========================================================= */
  function rasterTasks() {
    var out = [];

    // Direkter Linienalgorithmus (Okt 2025 3a)
    [[9, 6], [7, 3], [5, 2], [9, 4], [7, 5], [5, 4], [9, 2]].forEach(function (d) {
      var dx = d[0], dy = d[1], m = dy / dx, parts = [num("m", m, 0.006)], rows = [];
      for (var x = 0; x <= dx; x++) { rows.push(["x = " + x, num("", Math.round(m * x))]); }
      out.push(T("dda", null, "<p>Rasterisiere die Strecke (0, 0) → (" + dx + ", " + dy + ") mit dem direkten Algorithmus. Gib m und für jedes x die gesetzte Pixelzeile round(y) an.</p>" +
        '<pre class="cgx-pre">float m = (y1 - y0) / (x1 - x0);\nfloat y = y0;\nfor (x = x0; x &lt;= x1; x++) {\n  setPixel(x, round(y));\n  y += m;\n}</pre>',
        parts.concat([{ k: "table", head: ["x", "round(y)"], rows: rows }]),
        "m = " + dy + "/" + dx + ". y wächst pro Schritt um m und wird zur nächsten ganzen Zahl gerundet: " +
        rows.map(function (_, x) { return Math.round(m * x); }).join(", ") + ". Nachteil: Gleitkomma-Addition und Runden in jedem Schritt."));
    });

    // Bresenham-Variante mit D = Δx − 2Δy (Okt 2025 3b)
    [[9, 6], [7, 3], [8, 5], [6, 4], [9, 4], [5, 2]].forEach(function (d) {
      var dx = d[0], dy = d[1], D = dx - 2 * dy, DE = -2 * dy, DNE = 2 * (dx - dy), y = 0, rows = [], Ds = [], ys = [];
      for (var x = 0; x <= dx; x++) {
        Ds.push(D); ys.push(y);
        rows.push(["x = " + x, num("", D), num("", y)]);
        if (D < 0) { y++; D += DNE; } else { D += DE; }
      }
      out.push(T("bres2", null, "<p>Rasterisiere (0, 0) → (" + dx + ", " + dy + ") mit dieser Bresenham-Variante. Trage D (beim Setzen des Pixels) und y je Spalte ein.</p>" +
        '<pre class="cgx-pre">D = Δx − 2Δy;  DE = −2Δy;  DNE = 2(Δx − Δy)\nwhile (x &lt;= x1) {\n  setPixel(x, y); x++;\n  if (D &lt; 0) { y++; D += DNE; }   // nordost\n  else       {      D += DE;  }   // ost\n}</pre>',
        [row(num("DE", DE), num("DNE", DNE)), { k: "table", head: ["x", "D", "y"], rows: rows }],
        "Start D = " + dx + " − " + (2 * dy) + " = " + Ds[0] + ". Achtung, hier ist das Vorzeichen umgekehrt: D < 0 heißt nordost. Werte: D = " + Ds.join(", ") + "; y = " + ys.join(", ") + "."));
    });
    out.push(Q("bres2mc", "Warum hat D am Ende der Linie wieder den Startwert? (Hinweis: Δy-mal nordost, (Δx − Δy)-mal ost)",
      ["D_end = D₀ + Δy·2(Δx − Δy) + (Δx − Δy)·(−2Δy) = D₀", "Weil D in jedem Schritt auf 0 zurückgesetzt wird", "Weil DE = −DNE gilt", "Weil Δx und Δy gleich groß sind"],
      "Die beiden Summanden heben sich exakt auf — der Endpunkt liegt wieder genau auf der Geraden (Okt 2025 3c)."));
    out.push(Q("bres2mc", "Beide Algorithmen setzen Steigung < 1 voraus. Was passiert beim direkten Algorithmus mit der Strecke (0, 0) → (6, 9)?",
      ["Pro x wird nur ein Pixel gesetzt — die Linie bekommt Lücken", "Die Linie wird doppelt so dick", "Die Linie wird korrekt gezeichnet", "Das Programm bricht ab"],
      "Bei m = 1,5 springt y pro Spalte um mehr als ein Pixel. Richtig wäre, über y statt über x zu laufen (Okt 2025 3d)."));
    out.push(Q("bres2mc", "Und was macht Bresenham (D = Δx − 2Δy) bei (0, 0) → (6, 9)?",
      ["D bleibt negativ, er geht in jedem Schritt nordost und endet bei (6, 6) statt (6, 9)", "Er zeichnet die richtige Linie mit Lücken", "Er geht nur nach Osten und endet bei (6, 0)", "Er zeichnet gar nichts"],
      "D₀ = 6 − 18 = −12, DNE = 2·(6 − 9) = −6: D wird nie ≥ 0. Mehr als ein Schritt pro Spalte ist nicht vorgesehen."));

    // Kantenfunktion (Apr 2024 3c)
    [[[1, 1], [6, 3], [3, 6]], [[0, 0], [6, 2], [2, 6]], [[1, 3], [6, 1], [4, 6]], [[2, 0], [6, 4], [0, 4]]].forEach(function (tri) {
      var i = Math.floor(Math.random() * 3), p = tri[i], q = tri[(i + 1) % 3], names = ["A", "B", "C"];
      var e = [p[1] - q[1], q[0] - p[0], p[0] * q[1] - p[1] * q[0]];
      out.push(T("edgevec", null, "<p>Dreieck A = (" + tri[0] + "), B = (" + tri[1] + "), C = (" + tri[2] + "), gegen den Uhrzeigersinn. Bestimme den Kantenvektor e der Kante " +
        names[i] + " → " + names[(i + 1) % 3] + ", sodass e · (x, y, 1) > 0 für Punkte links der Kante (also innen) gilt.</p>" +
        '<div class="cgx-formula">e = ( p<sub>y</sub> − q<sub>y</sub> , q<sub>x</sub> − p<sub>x</sub> , p<sub>x</sub>q<sub>y</sub> − p<sub>y</sub>q<sub>x</sub> ) &nbsp;<em>= p̃ × q̃</em></div>',
        [row(num("e₁", e[0]), num("e₂", e[1]), num("e₃", e[2]))],
        "Die ersten beiden Komponenten sind die Kantenrichtung (" + (q[0] - p[0]) + ", " + (q[1] - p[1]) + ") um 90° nach links gedreht. e₃ sorgt dafür, dass p und q selbst den Wert 0 bekommen."));
    });

    // Punkt-in-Polygon (Okt 2024 3d)
    [[[[1, 1], [6, 2], [5, 6], [3, 3], [1, 6]], [2, 4.5]], [[[1, 1], [6, 2], [5, 6], [3, 3], [1, 6]], [4, 3.5]], [[[0, 0], [6, 0], [6, 6], [3, 2], [0, 6]], [3, 4.5]],
     [[[0, 0], [6, 0], [6, 6], [3, 2], [0, 6]], [1, 3.5]], [[[1, 3], [6, 1], [4, 6], [4, 3]], [3, 2.5]], [[[1, 3], [6, 1], [4, 6], [4, 3]], [2, 4.5]]].forEach(function (c) {
      var poly = c[0], x = c[1], cnt = 0;
      poly.forEach(function (p, i) {
        var q = poly[(i + 1) % poly.length];
        if ((p[1] > x[1]) !== (q[1] > x[1])) {
          var xi = p[0] + (x[1] - p[1]) * (q[0] - p[0]) / (q[1] - p[1]);
          if (xi > x[0]) { cnt++; }
        }
      });
      out.push(T("pip", null, "<p>Polygon " + poly.map(function (p) { return "(" + p.join(", ") + ")"; }).join(" → ") + ". Ein Strahl startet in X = (" + x.map(fmt).join(", ") +
        ") in Richtung (1, 0). Wie viele Kanten schneidet er, und liegt X innen?</p>",
        [num("Schnitte", cnt), mc("X liegt", ["innen", "außen"], cnt % 2 ? 0 : 1)],
        "Pseudocode: c = Σ intersectRay(x, pᵢ, pᵢ₊₁) über alle Kanten; innen genau dann, wenn c ungerade ist. Hier c = " + cnt + "."));
    });

    // Kreis rasterisieren (Okt 2024 3d, Apr 2025 3d/e)
    [1, 2, 3].forEach(function (r) {
      var c = 0;
      for (var x = -r; x <= r; x++) { for (var y = -r; y <= r; y++) { if (x * x + y * y <= r * r) { c++; } } }
      out.push(T("circle", null, "<p>Mit testInCircle: (x − mx)² + (y − my)² ≤ r² und Schleifen von mx − r bis mx + r (ebenso für y): Wie viele Pixel werden für r = " + r + " gesetzt?</p>",
        [num("Pixel", c)],
        "Man zählt alle ganzzahligen (x, y) in der Bounding Box mit x² + y² ≤ " + (r * r) + ". Die Box hat " + ((2 * r + 1) * (2 * r + 1)) + " Pixel, " + c + " davon liegen im Kreis."));
    });
    out.push(Q("circle", "Welche Bedingung prüft testInCircle(x, y, mx, my, r)?",
      ["(x − mx)·(x − mx) + (y − my)·(y − my) ≤ r·r", "|x − mx| + |y − my| ≤ r", "(x − mx) ≤ r && (y − my) ≤ r", "x·x + y·y ≤ r"],
      "Abstand zum Mittelpunkt quadriert mit r² vergleichen — keine Wurzel nötig."));
    out.push(Q("circle", "Welche Schleifengrenzen braucht rasterizeCircle(mx, my, r)?",
      ["for (x = mx − r; x ≤ mx + r; x++) und for (y = my − r; y ≤ my + r; y++)", "for (x = 0; x ≤ r; x++) und for (y = 0; y ≤ r; y++)", "for (x = mx; x ≤ mx + 2r; x++) und ebenso für y", "über das ganze Bild"],
      "Die Bounding Box des Kreises reicht genügt; jeder Punkt darin wird getestet."));
    out.push(Q("circle", "testInRing(x, y, mx, my, r, d): innerer Radius r, Dicke d. Welche Bedingung?",
      ["r² ≤ (x − mx)² + (y − my)² ≤ (r + d)²", "(x − mx)² + (y − my)² ≤ d²", "r ≤ (x − mx)² + (y − my)² ≤ r + d", "(x − mx)² + (y − my)² ≥ (r − d)²"],
      "Innerhalb des äußeren, aber nicht innerhalb des inneren Kreises — beide Grenzen quadriert (Apr 2025 3e)."));

    // Scanline: weitere Theorie
    out.push(Q("scanx", "Für den Tiefentest bekommt jede Ecke zusätzlich einen z-Wert. Um was erweitert man Edge Table und Active Edge Table?",
      ["ET: z am unteren Endpunkt und dz/dy; AET: aktuelles z und dz/dy, das pro Scanline addiert wird", "Nur die AET um z, die ET bleibt gleich", "Um die Normale jeder Kante", "Um einen z-Buffer pro Kante"],
      "z wird genau wie x inkrementell entlang der Kante mitgeführt; zwischen zwei Schnittpunkten dann entlang der Scanline (Okt 2023 4c)."));
    out.push(Q("scanx", "Ein Eckpunkt wird so verschoben, dass sich das Polygon selbst überschneidet. Was füllt der Scanline-Algorithmus?",
      ["Nach der Even-Odd-Regel: zwischen 1. und 2., 3. und 4. Schnittpunkt — doppelt überdeckte Bereiche bleiben frei", "Die konvexe Hülle", "Gar nichts, er bricht ab", "Alles zwischen dem linkesten und rechtesten Schnittpunkt"],
      "Die Paare der sortierten AET-Schnittpunkte bestimmen die Spans (Apr 2025 3c)."));
    out.push(Q("scanx", "Wie viele Kanten stehen in der AET einer Scanline, die ein konvexes Polygon schneidet (nicht durch einen Eckpunkt)?",
      ["Genau zwei", "So viele, wie das Polygon Ecken hat", "Eine", "Vier"],
      "Eine Gerade schneidet den Rand eines konvexen Polygons genau zweimal (Okt 2024 3c)."));
    out.push(Q("scanx", "Warum wird eine Kante nur bis y < y_upper (nicht ≤) in die AET aufgenommen?",
      ["Damit ein gemeinsamer Eckpunkt zweier Kanten nicht doppelt gezählt wird", "Weil y_upper immer außerhalb des Bildes liegt", "Damit waagrechte Kanten mitgezählt werden", "Aus Speichergründen"],
      "Sonst gäbe es an Spitzen drei Schnittpunkte und die Paarbildung kippt."));
    return out;
  }

  /* =========================================================
     4 · PHONG
     ========================================================= */
  function lightAt(P, n, Lp, Cp, mat, I0, att) {
    var l = norm(sub(Lp, P)), v = norm(sub(Cp, P));
    var nl = dot(n, l), r = n.map(function (x, i) { return 2 * nl * x - l[i]; });
    var rv = Math.max(0, dot(r, v)), dist2 = dot(sub(Lp, P), sub(Lp, P));
    var I = att ? I0 / dist2 : I0;
    return { l: l, v: v, r: r, nl: nl, rv: rv, I: I,
      diff: mat.kd.map(function (k) { return k * I * Math.max(0, nl); }),
      spec: mat.ks.map(function (k) { return nl > 0 ? k * I * Math.pow(rv, mat.n) : 0; }) };
  }

  function phongTasks() {
    var out = [];
    var MATS = [
      { ka: [0, 0, 0], kd: [0, 0, 1], ks: [1, 0, 0], n: 2 },
      { ka: [0.1, 0.1, 0.1], kd: [0.5, 0.5, 0], ks: [0.5, 0.5, 0.5], n: 2 },
      { ka: [0, 0, 0], kd: [1, 0, 0], ks: [0, 1, 0], n: 1 },
      { ka: [0.2, 0, 0], kd: [0.5, 0.5, 0.5], ks: [1, 1, 1], n: 4 }
    ];
    var SC = [
      { L: [-4, 3], C: [4, 3], I0: 25 }, { L: [-4, 3], C: [4, 3], I0: 100 }, { L: [3, 4], C: [-3, 4], I0: 25 },
      { L: [-6, 8], C: [6, 8], I0: 100 }, { L: [-4, 3], C: [0, 5], I0: 25 }, { L: [0, 5], C: [3, 4], I0: 25 }, { L: [4, 3], C: [-4, 3], I0: 50 }
    ];
    SC.forEach(function (s, i) {
      var m = MATS[i % MATS.length], res = lightAt([0, 0], [0, 1], s.L, s.C, m, s.I0, true);
      var col = [0, 1, 2].map(function (c) { return m.ka[c] + res.diff[c] + res.spec[c]; });
      out.push(T("att", null, "<p>Punkt P = (0, 0) mit Normale (0, 1). Punktlicht in " + vec(s.L) + " mit Intensität I = (" + s.I0 + ", " + s.I0 + ", " + s.I0 +
        ") und <strong>quadratischer Abschwächung</strong> I(d) = I / d². Kamera in " + vec(s.C) + ".</p>" +
        '<div class="cgx-formula">k<sub>a</sub> = ' + vec(m.ka) + ' &nbsp; k<sub>d</sub> = ' + vec(m.kd) + ' &nbsp; k<sub>s</sub> = ' + vec(m.ks) + ' &nbsp; n = ' + m.n + '</div>' +
        "<p>Berechne die Farbe von P (ohne ambientes Licht I<sub>a</sub>, k<sub>a</sub> wird direkt addiert).</p>",
        [row(num("R", col[0], 0.02), num("G", col[1], 0.02), num("B", col[2], 0.02))],
        "d² = " + fmt(dot(s.L, s.L)) + ", also einfallend I/d² = " + fmt(res.I) + ". l = " + vec(res.l) + ", v = " + vec(res.v) + ", r = 2(n·l)n − l = " + vec(res.r) +
        ". n·l = " + fmt(res.nl) + ", r·v = " + fmt(res.rv) + ". Farbe = k_a + k_d·I'·(n·l) + k_s·I'·(r·v)^n."));
    });

    // Bewegung von Licht und Kamera (Apr 2024 4c, Apr 2026 4c)
    [{ L: [-4, 3], C: [4, 3], att: false }, { L: [-4, 3], C: [4, 3], att: true }, { L: [-4, 3], C: [8, 3], att: false }, { L: [-2, 3], C: [4, 3], att: false }].forEach(function (s) {
      var m = { kd: [1, 1, 1], ks: [1, 1, 1], n: 2 }, base = lightAt([0, 0], [0, 1], s.L, s.C, m, 25, s.att);
      function cmp(a, b) { return Math.abs(a - b) < 1e-9 ? 0 : (a < b ? 1 : 2); }
      var opts = ["bleibt gleich", "wird dunkler", "wird heller"], rows = [];
      [["Licht", "links", [-1, 0], 0], ["Licht", "rechts", [1, 0], 0], ["Kamera", "links", [-1, 0], 1], ["Kamera", "rechts", [1, 0], 1]].forEach(function (mv) {
        var L2 = mv[3] === 0 ? [s.L[0] + mv[2][0], s.L[1]] : s.L, C2 = mv[3] === 1 ? [s.C[0] + mv[2][0], s.C[1]] : s.C;
        var r2 = lightAt([0, 0], [0, 1], L2, C2, m, 25, s.att);
        rows.push([mv[0] + " nach " + mv[1], sel(opts, cmp(r2.diff[0], base.diff[0])), sel(opts, cmp(r2.spec[0], base.spec[0]))]);
      });
      out.push(T("move", null, "<p>P = (0, 0), Normale (0, 1), Punktlicht in " + vec(s.L) + ", Kamera in " + vec(s.C) + (s.att ? ", quadratische Abschwächung" : ", keine Abschwächung") +
        ". Licht oder Kamera wird ein Stück waagrecht verschoben (das andere bleibt stehen). Wie ändern sich die Anteile?</p>",
        [{ k: "table", head: ["Bewegung", "diffus", "spekular"], rows: rows }],
        "Diffus hängt nur von n·l ab (und vom Abstand zum Licht), nie von der Kamera. Spekular hängt von r·v ab: " +
        (Math.abs(base.rv - 1) < 1e-9 ? "am Start ist r = v genau, jede Bewegung macht es dunkler." : "r·v = " + fmt(base.rv) + " am Start; wer r und v näher zusammenbringt, macht es heller.")));
    });

    // Formeln (Okt 2024 4a/b/d, Apr 2025 4a–d, Okt 2025 4b)
    out.push(Q("formula", "Diffuser Anteil mit normierten Vektoren?", ["k_d · I_in · (n · l)", "k_d · I_in · (r · v)", "k_d · I_in · (n · v)", "k_d · (n · l)^n"], "Lambert: Kosinus zwischen Normale und Lichtrichtung."));
    out.push(Q("formula", "Spekularer Anteil nach Phong?", ["k_s · I_in · (r · v)^n", "k_s · I_in · (n · l)^n", "k_s · I_in · (r · l)^n", "k_s · I_in · (n · v)"], "r ist l an n gespiegelt, v zeigt zur Kamera."));
    out.push(Q("formula", "Wie berechnet man den Reflexionsvektor r?", ["r = 2(n · l)n − l", "r = l − 2(n · l)n", "r = (l + v)/|l + v|", "r = n × l"], "Projektion von l auf n verdoppeln und l abziehen."));
    out.push(Q("formula", "Normierter Halbvektor im Blinn-Phong-Modell?", ["h = (l + v) / |l + v|", "h = (l − v) / |l − v|", "h = (n + l) / 2", "h = 2(n · v)n − v"], "Der Halbvektor liegt genau zwischen Licht- und Blickrichtung (Apr 2025 4c)."));
    out.push(Q("formula", "Blinn-Phong: welcher Winkel steht im spekularen Term?", ["Zwischen h und n: (n · h)^n", "Zwischen r und v: (r · v)^n", "Zwischen l und v", "Zwischen n und v"], "Statt r·v wird n·h benutzt."));
    out.push(Q("formula", "Kamera und Licht sitzen am selben Ort (l = v). Diffus und Blinn-Phong-Spekular?", ["k_d·I·(n·v) und k_s·I·(n·v)^n", "k_d·I·(n·v) und k_s·I", "k_d·I und k_s·I·(n·v)^n", "0 und k_s·I"], "Mit l = v ist h = v, also n·h = n·v (Apr 2025 4d)."));
    out.push(Q("formula", "Physikalisch korrekte Abschwächung des einfallenden Lichts einer Punktquelle mit Intensität I im Abstand d?", ["I_in = I / d²", "I_in = I / d", "I_in = I · d²", "I_in = I · e^(−d)"], "Die Energie verteilt sich auf eine Kugeloberfläche ∝ d² (Okt 2024 4d)."));
    out.push(Q("formula", "Grubenlampe: Licht an der Kamera, Einfallswinkel α zur Normalen, Abstand d. Phong-Spekularterm mit quadratischer Abschwächung?", ["k_s · I · cos(2α)^n / d²", "k_s · I · cos(α)^n / d²", "k_s · I / d²", "k_s · I · cos(α) / d"], "Mit l = v liegt r um 2α von v entfernt; diffus ist es k_d·I·cos α / d² (Okt 2025 4b)."));
    out.push(Q("formula", "Wo auf einer beleuchteten Kugel ist der diffuse Anteil maximal?", ["Wo die Normale direkt zum Licht zeigt", "Wo die Normale zur Kamera zeigt", "Wo die Normale genau zwischen Licht und Kamera liegt", "Am Rand der Silhouette"], "n·l = 1 genau in Lichtrichtung (Okt 2024 4c)."));
    out.push(Q("formula", "Und wo ist der spekulare Anteil maximal?", ["Wo die Normale genau in Richtung des Halbvektors zwischen Licht und Kamera zeigt", "Wo die Normale zum Licht zeigt", "Wo die Normale zur Kamera zeigt", "Überall gleich"], "Dort ist r = v (Okt 2024 4c)."));

    // Anzahl der Beleuchtungsrechnungen (Apr 2025 4e)
    out.push(T("lcount", null, "<p>Geschlossenes Dreiecksnetz mit T = 2V Dreiecken, jedes Dreieck bedeckt P Pixel. Wie oft wird das Beleuchtungsmodell ausgewertet?</p>",
      [{ k: "table", head: ["Verfahren", "Auswertungen"], rows: [
        ["Flat Shading", sel(["V", "2V", "3·2V", "2V·P", "1"], 1)],
        ["Gouraud Shading", sel(["V", "2V", "3·2V", "2V·P", "1"], 0)],
        ["Phong Shading", sel(["V", "2V", "3·2V", "2V·P", "1"], 3)]] }],
      "Flat: einmal pro Dreieck. Gouraud: einmal pro Vertex — jeder Vertex wird von mehreren Dreiecken geteilt, also V. Phong: einmal pro Pixel jedes Dreiecks."));

    // Shading erkennen (Okt 2024 4e/f)
    out.push(Q("shadid", "Ein glänzendes Dreieck, von einer Punktlichtquelle beleuchtet, zeigt einen runden Glanzpunkt <em>mitten</em> im Dreieck. Welches Shading?",
      ["Phong Shading — nur bei Beleuchtung pro Pixel kann ein Glanzlicht im Inneren entstehen", "Gouraud Shading", "Flat Shading", "Das lässt sich nicht erkennen"],
      "Gouraud interpoliert nur die drei Eckfarben, ein Maximum im Inneren ist so unmöglich."));
    out.push(Q("shadid", "Ein Dreieck ist gleichmäßig in einer einzigen Farbe schattiert. Welches Shading?", ["Flat Shading", "Gouraud Shading", "Phong Shading", "Ray Tracing"], "Eine Beleuchtungsrechnung pro Dreieck."));
    out.push(T("shadid", null, "<p>Welches Shading realisiert dieses Shader-Paar?</p><pre class='cgx-pre'>// Vertex-Shader\nvarying vec3 vColor;\nvoid main() {\n  vec3 n = normalize(normalMatrix * normal);\n  vColor = kd * max(dot(n, l), 0.0);\n  gl_Position = P * MV * vec4(position, 1.0);\n}\n// Fragment-Shader\nvarying vec3 vColor;\nvoid main() { gl_FragColor = vec4(vColor, 1.0); }</pre>",
      [mc("", ["Gouraud Shading — beleuchtet wird im Vertex-Shader, die Farbe interpoliert", "Phong Shading", "Flat Shading"], 0)],
      "Wo die Beleuchtungsformel steht, entscheidet: hier im Vertex-Shader."));
    out.push(T("shadid", null, "<p>Welches Shading realisiert dieses Shader-Paar?</p><pre class='cgx-pre'>// Vertex-Shader\nvarying vec3 vNormal;\nvoid main() {\n  vNormal = normalMatrix * normal;\n  gl_Position = P * MV * vec4(position, 1.0);\n}\n// Fragment-Shader\nvarying vec3 vNormal;\nvoid main() {\n  vec3 n = normalize(vNormal);\n  gl_FragColor = vec4(kd * max(dot(n, l), 0.0), 1.0);\n}</pre>",
      [mc("", ["Phong Shading — die Normale wird interpoliert, beleuchtet wird pro Fragment", "Gouraud Shading", "Flat Shading"], 0)],
      "Interpolierte Normale + Beleuchtung im Fragment-Shader = Phong Shading. Normalisieren nach der Interpolation nicht vergessen."));

    // Parameter zu Bildern (Okt 2023 6a, Okt 2025 4c)
    [
      ["Der Hase ist eine flache, gleichmäßig hellgraue Silhouette ohne jede Schattierung.", 0],
      ["Der Hase ist matt schattiert, ohne Glanzlichter, die abgewandte Seite ist schwarz.", 1],
      ["Der Hase ist fast schwarz, nur an wenigen Stellen leuchten scharfe weiße Glanzpunkte.", 2],
      ["Der Hase ist matt grau schattiert und hat zusätzlich weiße Glanzlichter.", 3]
    ].forEach(function (c) {
      out.push(T("params", null, "<p>" + c[0] + " Welcher Parametersatz (ambient | diffus | spekular | Glanzexponent) passt?</p>",
        [mc("", ["0,7 | 0 | 0 | 12", "0 | 0,5 | 0 | 24", "0 | 0 | 1 | 10", "0 | 0,5 | 1 | 10"], c[1])],
        "Nur ambient: konstant, keine Form erkennbar. Nur diffus: matt. Nur spekular: schwarz mit Glanzpunkten. Beides: matt plus Glanz."));
    });
    out.push(Q("params", "Zwei Renderings unterscheiden sich nur im Glanzexponenten n. Woran erkennt man das größere n?",
      ["Kleinere, schärfere Glanzlichter", "Größere, weichere Glanzlichter", "Hellere diffuse Schattierung", "Dunklere Silhouette"],
      "(r·v)^n fällt für großes n schneller ab."));
    out.push(Q("params", "Eine ebene Fläche wird von einer Punktlichtquelle schräg über ihr beleuchtet (ohne Abschwächung). Wie verläuft der diffuse Anteil entlang der Fläche?",
      ["Maximal direkt unter dem Licht, zu beiden Seiten weich abfallend", "Konstant", "Maximal unter der Kamera", "Linear von links nach rechts steigend"],
      "n·l ist dort 1, wo das Licht senkrecht einfällt (Okt 2023 6d, Okt 2025 4a)."));
    out.push(Q("params", "Und der spekulare Anteil entlang derselben Fläche?",
      ["Ein Peak am Spiegelpunkt zwischen Licht und Kamera, umso schmaler, je größer n", "Konstant", "Maximal direkt unter dem Licht", "Maximal direkt unter der Kamera"],
      "Am Spiegelpunkt gilt r = v (Okt 2025 4a)."));

    // Beleuchtung im Raytracer (Okt 2023 6b/c)
    [[0.5, 1, 20], [0.8, 0.5, 10], [1, 1, 5]].forEach(function (c) {
      var nl = Math.SQRT1_2;
      out.push(T("rt3d", null, "<p>Ein Augstrahl trifft ein Dreieck mit Normale n = √2/2·(1, 0, −1). Das Licht kommt aus Richtung l = (1, 0, 0) mit I = (1, 1, 1), keine Abschwächung; die Kamera blickt aus v = (0, 0, −1) (zum Betrachter). Nähere ½√2 ≈ 0,7.</p>",
        [row(num("diffus (k_d = " + fmt(c[0]) + ")", c[0] * 0.7, 0.02), num("spekular (k_s = " + fmt(c[1]) + ", n = " + c[2] + ")", c[1], 0.02))],
        "n·l = ½√2 ≈ 0,7, also diffus ≈ " + fmt(c[0] * 0.7) + " je Kanal. r = 2(n·l)n − l = (1, 0, −1) − (1, 0, 0) = (0, 0, −1) = v, also (r·v)^n = 1 und spekular = k_s."));
    });
    return out;
  }

  /* =========================================================
     5 · FARBEN
     ========================================================= */
  var CNAMES = [
    ["weiß", [1, 1, 1]], ["grau", [0.5, 0.5, 0.5]], ["schwarz", [0, 0, 0]], ["hellblau", [0.5, 0.5, 1]], ["hellcyan", [0.5, 1, 1]],
    ["dunkelmagenta", [0.5, 0, 0.5]], ["dunkelgrün", [0, 0.5, 0]], ["gelb", [1, 1, 0]], ["senf (mustard)", [0.5, 0.5, 0]], ["magenta", [1, 0, 1]],
    ["rot", [1, 0, 0]], ["cyan", [0, 1, 1]], ["rosa", [1, 0.5, 0.5]], ["hellgrün", [0.5, 1, 0.5]]
  ];
  function rgb2hsv(c) {
    var mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]), d = mx - mn, h = 0;
    if (d > 0) {
      if (mx === c[0]) { h = 60 * ((c[1] - c[2]) / d); }
      else if (mx === c[1]) { h = 60 * ((c[2] - c[0]) / d) + 120; }
      else { h = 60 * ((c[0] - c[1]) / d) + 240; }
      if (h < 0) { h += 360; }
    }
    return [h, mx ? d / mx : 0, mx];
  }
  function farbeTasks() {
    var out = [];
    CNAMES.forEach(function (cn, idx) {
      var c = cn[1], hsv = rgb2hsv(c), names = CNAMES.slice(0, 10).map(function (x) { return x[0]; });
      if (idx >= 10) { names = names.slice(0, 9).concat([cn[0]]); }
      var hp = num("H in °", hsv[0], 0.5);
      if (hsv[1] === 0) { hp.any = true; hp.label = "H in ° (beliebig)"; }
      out.push(T("spec", null, "<p>Welche Farbe erzeugt dieses Spektrum? Gib Name, RGB (0, 0,5 oder 1) und HSV an (H in Vielfachen von 60°, S und V in %).</p>" +
        '<div class="cgx-fig">' + spectrumSVG([c[2], c[1], c[0]]) + '</div>',
        [sel(names, names.indexOf(cn[0]), "Farbname"), row(num("R", c[0]), num("G", c[1]), num("B", c[2])),
         row(hp, num("S in %", hsv[1] * 100, 0.6), num("V in %", hsv[2] * 100, 0.6))],
        "Links kurzwellig (blau), Mitte grün, rechts langwellig (rot): die Höhen der drei Bereiche sind B, G, R. HSV: V = max = " + fmt(hsv[2]) +
        ", S = (max − min)/max = " + fmt(hsv[1]) + (hsv[1] ? ", H = " + fmt(hsv[0]) + "°." : ", H ist bei Grautönen beliebig.")));
    });
    // Umgekehrt: passendes Spektrum wählen (Apr 2024 6b, Okt 2025 6)
    var given = [
      ["RGB (1, 1, 0)", [1, 1, 0]], ["CMYK (0, 0, 0, 0,5)", [0.5, 0.5, 0.5]], ["HSV (240°, 50 %, 100 %)", [0.5, 0.5, 1]], ["CMY (0, 1, 0)", [1, 0, 1]],
      ["HSV (120°, 100 %, 50 %)", [0, 0.5, 0]], ["RGB (0,5, 1, 1)", [0.5, 1, 1]], ["„dunkles Magenta“", [0.5, 0, 0.5]], ["HSV (0°, 0 %, 100 %)", [1, 1, 1]],
      ["CMYK (0, 0,5, 1, 0)", [1, 0.5, 0]], ["HSV (60°, 100 %, 50 %)", [0.5, 0.5, 0]]
    ];
    given.forEach(function (g) {
      var c = g[1], pool = shuffle(CNAMES.map(function (x) { return x[1]; }).filter(function (o) { return o.join() !== c.join(); })).slice(0, 3);
      var opts = [c].concat(pool).map(function (o) { return spectrumSVG([o[2], o[1], o[0]]); });
      out.push(T("specpick", null, "<p>Welches Spektrum passt zur Farbe <strong>" + g[0] + "</strong>?</p>", [mc("", opts, 0)],
        "Erst nach RGB umrechnen: (" + c.map(fmt).join(", ") + "). Dann ist die Höhe im blauen Bereich B, im grünen G, im roten R."));
    });

    // Alpha-Blending (Apr 2026 5b)
    var cases = [
      [[0, 0, 0], [1, 0, 0, 1], [0, 1, 0, 0.5]], [[1, 1, 1], [0, 0, 1, 0.5], [1, 0, 0, 0.5]], [[0, 0, 0], [0, 1, 1, 0.5], [1, 1, 0, 1]],
      [[1, 0, 0], [0, 0, 1, 0.25], [0, 1, 0, 0.5]], [[0.5, 0.5, 0.5], [1, 1, 1, 0.5], [0, 0, 0, 0.5]], [[0, 0, 1], [1, 1, 0, 0.75], [1, 0, 1, 0]]
    ];
    cases.forEach(function (cs) {
      var c0 = cs[0], a = cs[1], b = cs[2];
      function blend(old, c) { return [0, 1, 2].map(function (i) { return c[3] * c[i] + (1 - c[3]) * old[i]; }); }
      var r1 = blend(c0, a), r2 = blend(r1, b);
      out.push(T("alpha", null, "<p>Alpha-Blending: C<sub>neu</sub> = α·(R, G, B) + (1 − α)·C<sub>alt</sub>. Der Framebuffer-Pixel ist " + vec(c0) +
        ". Erst wird RGBA " + vec(a) + ", dann " + vec(b) + " aufgetragen. Gib beide Zwischenergebnisse an.</p>",
        [row(num("nach 1 · R", r1[0]), num("G", r1[1]), num("B", r1[2])), row(num("nach 2 · R", r2[0]), num("G", r2[1]), num("B", r2[2]))],
        "Schritt 1: " + vec(r1) + ". Schritt 2 rechnet mit dem neuen Pixelwert weiter: " + vec(r2) + ". Bei α = 1 überdeckt die Farbe komplett, bei α = 0 ändert sich nichts."));
    });

    // H, S, V am Kegel (Apr 2024 6a)
    out.push(T("hsvparam", null, "<p>Ordne die drei HSV-Parameter ihrer Bedeutung im HSV-Kegel zu.</p>",
      [{ k: "table", head: ["Parameter", "Bedeutung"], rows: [
        ["Hue", sel(["Winkel um die Achse", "Abstand von der Achse", "Höhe entlang der Achse"], 0)],
        ["Saturation", sel(["Winkel um die Achse", "Abstand von der Achse", "Höhe entlang der Achse"], 1)],
        ["Value", sel(["Winkel um die Achse", "Abstand von der Achse", "Höhe entlang der Achse"], 2)]] }],
      "Hue ist der Farbton (0° rot, 120° grün, 240° blau), Saturation die Sättigung (0 = Grau auf der Achse), Value die Helligkeit."));
    out.push(Q("hsvparam", "Welche Hue-Werte gehören zu Gelb, Cyan und Magenta?", ["60°, 180°, 300°", "120°, 240°, 0°", "30°, 150°, 270°", "90°, 180°, 270°"], "Die Mischfarben liegen genau zwischen den Grundfarben."));
    out.push(Q("hsvparam", "Wie sieht das Spektrum einer weißen Lichtquelle aus?", ["Flach über alle sichtbaren Wellenlängen", "Ein schmaler Peak in der Mitte", "Drei schmale Peaks bei Rot, Grün und Blau, sonst null", "Null"], "Weiß enthält alle Wellenlängen gleichmäßig."));
    out.push(Q("hsvparam", "Ein Spektrum ist überall gleich hoch, aber nur halb so hoch wie bei Weiß. Welche Farbe?", ["Grau", "Weiß", "Schwarz", "Hellblau"], "Gleiche Anteile aller Wellenlängen, geringere Intensität."));
    return out;
  }

  /* =========================================================
     6 · RAYTRACING UND LAUFZEIT
     ========================================================= */
  function strahlenTasks() {
    var out = [];
    var OPTS = ["V", "T", "P", "T·p", "4", "4·T·p", "4·V", "0"];
    var TABLE = [
      ["Gouraud Shading", [0, 3, 0, 3]],
      ["Pixel Shading", [0, 3, 3, 3]],
      ["Deferred Shading, Lichtpass", [4, 2, 2, 7]],
      ["4× SSAA", [0, 5, 5, 5]]
    ];
    for (var k = 0; k < 4; k++) {
      var hide = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).slice(0, 7);
      out.push(T("cxtab", null, "<p>Szene mit T Dreiecken und V Vertices, Bild mit P Pixeln. Jedes Dreieck bedeckt etwa p Pixel, die Szene ist geschlossen (kein Hintergrund). Fülle die fehlenden Felder.</p>",
        [{ k: "table", head: ["Verfahren", "Vertex-Shader", "Pixel-Shader", "Beleuchtung", "Tiefentests"], rows: TABLE.map(function (r, ri) {
          return [r[0]].concat(r[1].map(function (v, ci) { return hide.indexOf(ri * 4 + ci) >= 0 ? sel(OPTS, v) : OPTS[v]; }));
        }) }],
        "Gouraud beleuchtet pro Vertex (V), Pixel Shading pro Fragment (T·p, mit Überdeckung mehr als P). Der Lichtpass beim Deferred Shading zeichnet nur ein bildschirmfüllendes Rechteck (4 Vertices) und beleuchtet jedes Pixel genau einmal (P), ohne Tiefentest. 4× SSAA vervierfacht alle Fragmente (Apr 2024 5a, Okt 2024 5a)."));
    }
    out.push(T("cxtab", null, "<p>Dieselbe Szene mit Ray Casting (nur Augstrahlen, ein Strahl pro Pixel). Wie viele Strahl-Szene-Schnitte und Beleuchtungsrechnungen?</p>",
      [row(sel(OPTS, 2, "Schnitte"), sel(OPTS, 2, "Beleuchtung"))],
      "Ein Augstrahl pro Pixel, ein Treffer pro Strahl, eine Beleuchtung pro Treffer (Apr 2024 5b)."));

    // Strahlbaum zählen (Apr 2024 5c, Okt 2024 5b–d)
    [[1, 1, true, 1], [2, 1, true, 1], [3, 1, true, 1], [3, 2, true, 1], [2, 1, true, 4], [2, 1, false, 1], [3, 1, false, 4], [2, 2, true, 4], [1, 2, false, 1]].forEach(function (c) {
      var N = c[0], L = c[1], glass = c[2], s = c[3];
      var nodes = glass ? Math.pow(2, N + 1) - 1 : N + 1, per = nodes * (1 + L) * s;
      out.push(T("rtcount", null, "<p>Ray Tracing mit maxdepth = " + N + ", " + (glass ? "Glas (Reflexion <em>und</em> Brechung an jedem Treffer)" : "nur Spiegelung (Reflexion, keine Brechung)") +
        ", Schattenstrahlen zu " + L + " Lichtquelle" + (L > 1 ? "n" : "") + (s > 1 ? ", " + s + "× Supersampling" : ", ein Augstrahl pro Pixel") +
        ". Wie viele Strahl-Szene-Schnitttests fallen maximal pro Pixel an?</p>",
        [num("Schnitttests pro Pixel", per)],
        "Treffer im Strahlbaum: " + (glass ? "1 + 2 + … + 2^" + N + " = " + nodes : N + 1) + ". Jeder Treffer kostet einen Schnitttest für den Strahl selbst plus " + L +
        " Schattenstrahl" + (L > 1 ? "en" : "") + ": " + nodes + " · " + (1 + L) + (s > 1 ? " · " + s : "") + " = " + per + ". Allgemein für Glas mit einem Licht: 2^(N+2) − 2."));
    });
    out.push(Q("rtcount", "Ray Tracing durch Glas, ein Licht, maxdepth = N. Wie viele Schnitttests verursacht ein Aufruf raytrace(ray, 0)?",
      ["2^(N+2) − 2", "2^N", "3·N", "2^(N+1) − 1"],
      "2^(N+1) − 1 Treffer, jeweils plus ein Schattenstrahl. Für N = 1 ergibt das 6 — genau der Hinweis aus Okt 2024 5d."));
    out.push(Q("rtcount", "Ein Kamerastrahl C0 und zwei Reflexionsstrahlen R1, R2 haben die Szene getroffen. Wie viele Schattenstrahlen werden zu einer Punktlichtquelle verschossen?",
      ["Drei — einer pro Trefferpunkt", "Einer — nur vom ersten Treffer", "Zwei — nur von den Reflexionen", "Sechs"],
      "An jedem Treffer wird die lokale Beleuchtung berechnet, dafür braucht es einen Schattenstrahl (Okt 2024 5b)."));
    return out;
  }

  /* =========================================================
     7 · SZENENGRAPHEN UND ROTATIONEN
     ========================================================= */
  function sgRandom() {
    var nodes = [];
    function node(t, extra) { var n = { t: t, kids: [] }; for (var k in extra) { n[k] = extra[k]; } nodes.push(n); return nodes.length - 1; }
    function edge(a, b) { nodes[a].kids.push(b); }
    var tv = [[-1, 0], [1, 0], [0, -1], [0, 1], [2, 0], [0, 2], [-2, 0], [1, 1]];
    function tr() { return pick(tv); }
    var mats = pick([["rock", "metal"], ["metal", "wood"], ["glass", "plastic"], ["steel", "aluminum"]]);
    var geos = pick([["sphere", "cube"], ["cone", "cylinder"], ["chair", "table"]]);
    var variant = Math.floor(Math.random() * 3), root = node("group", { name: "" });
    if (variant === 0) {
      var a = node("trans", { v: [-1, 0] }), b = node("trans", { v: [1, 0] });
      edge(root, a); edge(root, b);
      var m1 = node("mat", { name: mats[0] }), m2 = node("mat", { name: mats[1] });
      edge(a, m1); edge(b, m2);
      var cross = pick([[1, 1], [1, 0], [0, 1]]);
      if (cross[0]) { edge(a, m2); }
      if (cross[1]) { edge(b, m1); }
      var t1 = node("trans", { v: tr() }), t2 = node("trans", { v: tr() });
      edge(m1, t1); edge(m2, t2);
      var g1 = node("geom", { name: geos[0] }), g2 = node("geom", { name: geos[1] });
      edge(t1, g1); edge(t2, g2);
    } else if (variant === 1) {
      var a2 = node("trans", { v: [-1, 0] }), b2 = node("trans", { v: [1, 0] });
      edge(root, a2); edge(root, b2);
      var gp = node("group", { name: "" }); edge(a2, gp); edge(b2, gp);
      var n1 = node("mat", { name: mats[0] }), n2 = node("mat", { name: mats[1] });
      edge(gp, n1); edge(gp, n2);
      var u1 = node("trans", { v: [0, -1] }), u2 = node("trans", { v: [0, 1] });
      edge(n1, u1); edge(n2, u2);
      var g = node("geom", { name: geos[0] }); edge(u1, g); edge(u2, g);
    } else {
      var p1 = node("mat", { name: mats[0] }), p2 = node("trans", { v: tr() });
      edge(root, p1); edge(root, p2);
      var q1 = node("trans", { v: tr() }); edge(p1, q1);
      var q2 = node("mat", { name: mats[1] }); edge(p2, q2);
      var x = node("group", { name: "" }); edge(q1, x); edge(q2, x);
      var w1 = node("trans", { v: tr() }), w2 = node("trans", { v: tr() });
      edge(x, w1); edge(x, w2);
      var h1 = node("geom", { name: geos[0] }), h2 = node("geom", { name: geos[1] });
      edge(w1, h1); edge(w2, h2);
    }
    // alle Wege von der Wurzel zu Geometrie-Blättern
    var inst = [];
    (function walk(id, mat, t) {
      var n = nodes[id];
      if (n.t === "mat") { mat = n.name; }
      if (n.t === "trans") { t = [t[0] + n.v[0], t[1] + n.v[1]]; }
      if (n.t === "geom") { inst.push({ geom: n.name, mat: mat, t: t }); return; }
      n.kids.forEach(function (k) { walk(k, mat, t); });
    }(0, null, [0, 0]));
    return { nodes: nodes, inst: inst, mats: mats, geos: geos };
  }

  function szeneTasks() {
    var out = [], i;
    for (i = 0; i < 8; i++) {
      var g = sgRandom();
      var geosUsed = g.geos.filter(function (n) { return g.inst.some(function (x) { return x.geom === n; }); });
      out.push(T("sgcount", null, "<p>Wie viele Instanzen jeder Geometrie erzeugt dieser Szenengraph beim Traversieren?</p><div class='cgx-fig'>" + sceneSVG(g) + "</div>",
        [row.apply(null, geosUsed.map(function (n) { return num(n, g.inst.filter(function (x) { return x.geom === n; }).length); }))],
        "Jeder Weg von der Wurzel zu einem Geometrieknoten ist eine Instanz. Hat ein Knoten zwei Eltern, wird alles darunter doppelt erzeugt — insgesamt " + g.inst.length + " Instanzen."));
      out.push(T("sginst", null, "<p>Trage alle erzeugten Instanzen mit Geometrie, Material und akkumulierter Translation ein (z bleibt 0, Reihenfolge egal).</p><div class='cgx-fig'>" + sceneSVG(g) + "</div>",
        [{ k: "mset", cols: [{ k: "sel", label: "Geometrie", opts: g.geos }, { k: "sel", label: "Material", opts: g.mats }, { k: "num", label: "t<sub>x</sub>" }, { k: "num", label: "t<sub>y</sub>" }],
          sol: g.inst.map(function (x) { return [g.geos.indexOf(x.geom), g.mats.indexOf(x.mat), x.t[0], x.t[1]]; }) }],
        "Auf jedem Weg die Translationen aufsummieren; es gilt das Material, das auf dem Weg zuletzt (am nächsten zur Geometrie) gesetzt wurde. Lösung: " +
        g.inst.map(function (x) { return x.geom + "/" + x.mat + " (" + x.t.map(fmt).join(", ") + ")"; }).join("; ") + "."));
    }

    // Szenengraph aufbauen (Okt 2023 5b/c, Apr 2026 6b)
    [[4, 4], [4, 6], [3, 4], [6, 2], [5, 3]].forEach(function (c) {
      var groups = c[0], chairs = c[1];
      out.push(T("sgbuild", null, "<p>Ein Restaurant besteht aus " + groups + " Tischgruppen. Der Teilbaum „tablegroup“ enthält einen Tisch und " + chairs +
        " Stühle (je eine Transformation pro Möbelstück, Geometrie „chair“ und „table“ nur einmal). Der Teilbaum soll für alle Gruppen wiederverwendet werden.</p>",
        [row(num("Stuhl-Instanzen", groups * chairs), num("Tisch-Instanzen", groups), num("neue Knoten über tablegroup", groups + 1))],
        "Über tablegroup kommen eine Wurzel-group und " + groups + " Transformationen, die alle auf denselben Teilbaum zeigen. Jede Transformation erzeugt einmal " +
        chairs + " Stühle und einen Tisch."));
    });
    out.push(Q("sgbuild", "Szenengraph für ein Auto: Karosserie „body“ (Material steel) und vier Räder „wheel“ (Material aluminum), möglichst wenige Knoten. Wie oft kommt der Geometrieknoten wheel vor?",
      ["Einmal — vier Transformationen unter dem Material aluminum zeigen alle auf denselben Knoten", "Viermal, einmal pro Rad", "Zweimal, vorne und hinten", "Achtmal, je Seite und Achse"],
      "Szenengraphen sind gerichtete azyklische Graphen: gemeinsame Teile werden referenziert, nicht kopiert (Okt 2023 5b)."));
    out.push(Q("sgbuild", "Die Vorderräder sollen nun Material wood bekommen; steel, aluminum, wood, wheel und body dürfen nur einmal vorkommen. Wie geht das?",
      ["Zwei Materialknoten aluminum und wood, darunter je die beiden passenden Rad-Transformationen, die alle auf denselben wheel-Knoten zeigen", "wheel zweimal anlegen", "Material in den wheel-Knoten schreiben", "Unmöglich ohne Kopien"],
      "Das Material wird auf dem Weg von oben vererbt, also entscheidet der Weg, nicht der Geometrieknoten (Okt 2023 5c)."));
    out.push(Q("sgbuild", "Unter einem Materialknoten metal liegt weiter unten ein Materialknoten wood vor einer Geometrie. Welches Material hat die Instanz?",
      ["wood — das näher an der Geometrie gesetzte Material überschreibt", "metal — das zuerst gesetzte gilt", "Eine Mischung", "Keines"],
      "Zustand wird beim Abstieg überschrieben und beim Aufstieg wiederhergestellt."));

    // Matrixstapel (Apr 2026 6c)
    out.push(Q("stack", "Wie sieht push(Matrix M) eines Matrixstapels aus, der beim Abstieg Transformationen akkumuliert?",
      ["this.stack.push(mul(this.stack.top(), M))", "this.stack.push(M)", "this.stack.push(mul(M, this.stack.top()))", "this.stack.top() = M"],
      "Die neue lokale Transformation wird rechts an die akkumulierte angehängt — sie wirkt zuerst auf die Geometrie. pop() stellt den Zustand des Elternknotens wieder her."));
    out.push(Q("stack", "Wozu dient pop() beim Traversieren des Szenengraphen?",
      ["Nach dem Teilbaum die Transformation des Elternknotens wiederherstellen", "Die Szene löschen", "Die Geometrie zeichnen", "Das Material setzen"],
      "Geschwister sollen nicht die Transformation ihres Nachbarn erben."));
    out.push(Q("stack", "In welcher Reihenfolge besucht die übliche Traversierung den Szenengraphen?",
      ["Tiefensuche von der Wurzel aus", "Breitensuche", "Nach Materialien sortiert", "Rückwärts von den Blättern"],
      "Tiefensuche passt zum Stapel: push beim Abstieg, pop beim Aufstieg."));

    // Rotationen (Apr 2026 6d/e)
    out.push(T("rot", null, "<p>Welche dieser Angaben beschreiben eine 3D-Rotation? Mehrfachauswahl.</p>",
      [{ k: "multi", opts: ["3×3-Rotationsmatrix (orthonormal, det = 1)", "Euler-Winkel (drei Winkel um feste Achsen)", "Achse und Winkel", "Einheitsquaternion", "Translationsvektor", "Skalierungsfaktor"], a: [0, 1, 2, 3] }],
      "Vier gängige Darstellungen: Matrix, Euler-Winkel, Achse-Winkel, Quaternion."));
    out.push(Q("rot", "Welche Darstellung eignet sich am besten zum Interpolieren von Rotationen?",
      ["Einheitsquaternionen mit slerp", "Rotationsmatrizen eintragsweise", "Euler-Winkel", "Achse-Winkel mit getrennt interpolierter Achse"],
      "Slerp läuft mit konstanter Winkelgeschwindigkeit auf dem kürzesten Weg."));
    out.push(Q("rot", "Warum darf man zwei Rotationsmatrizen nicht einfach eintragsweise linear interpolieren?",
      ["Das Zwischenergebnis ist im Allgemeinen keine Rotation mehr (nicht orthonormal, verzerrt)", "Weil Matrizen nicht addiert werden dürfen", "Weil das zu langsam ist", "Weil die Determinante dann 2 wird"],
      "Beispiel: Mitte zwischen +90° und −90° um z ist die Nullmatrix im xy-Teil."));
    out.push(Q("rot", "Welches Problem haben Euler-Winkel?",
      ["Gimbal Lock: zwei Achsen fallen zusammen, ein Freiheitsgrad geht verloren", "Sie brauchen neun Zahlen", "Sie können keine Drehung um z darstellen", "Sie sind nicht eindeutig umkehrbar zur Matrix"],
      "Außerdem hängt das Ergebnis von der Achsreihenfolge ab."));
    [[90, [0, 0, 1], "z"], [180, [1, 0, 0], "x"], [60, [0, 1, 0], "y"], [120, [0, 0, 1], "z"]].forEach(function (c) {
      var h = c[0] / 2 * Math.PI / 180, w = Math.cos(h), s = Math.sin(h);
      out.push(T("rot", null, "<p>Gib das Einheitsquaternion q = (w, x, y, z) für eine Drehung um " + c[0] + "° um die " + c[2] + "-Achse an (auf zwei Nachkommastellen).</p>",
        [row(num("w", w, 0.011), num("x", s * c[1][0], 0.011), num("y", s * c[1][1], 0.011), num("z", s * c[1][2], 0.011))],
        "q = (cos(θ/2), sin(θ/2)·a) mit θ = " + c[0] + "°: cos " + (c[0] / 2) + "° = " + fmt(w) + ", sin " + (c[0] / 2) + "° = " + fmt(s) + "."));
    });
    return out;
  }

  /* =========================================================
     Erklärungen
     ========================================================= */
  var EXPLAIN = {
    affin:
      '<h2>Neu seit 2023: Produkte, Eigenschaften, projektiv</h2>' +
      '<p class="cgx-note">Die Klausuren von Oktober 2023 bis April 2026 behalten Matrix/Bild/Urbild bei, fragen aber zusätzlich nach Klassen von Produkten, nach Eigenschaften von 3×3- und 4×4-Matrizen und nach projektiven Abbildungen.</p>' +
      '<div class="cgx-duo">' +
      '<article><h3>Produkt A·B</h3><p>Kleinste Klasse, die <em>beide</em> enthält: Rotation·Rotation = Rotation, Translation·Translation = Translation, Translation·Rotation = rigid, linear·Rotation = linear, linear·Translation = affin, rigid·linear = affin.</p></article>' +
      '<article><h3>Um einen Punkt c</h3><p>T(c) · S · T(−c). Rechts steht, was zuerst passiert. Ausmultipliziert: linearer Teil L, Translation c − L·c.</p></article>' +
      '<article><h3>Projektiv als Matrix</h3><p>(x, y) ↦ (Zähler₁/Nenner, Zähler₂/Nenner): Zähler sind Zeile 1 und 2, der Nenner Zeile 3. Ins Unendliche gehen alle Punkte mit Nenner 0 — eine Gerade.</p></article>' +
      '<article><h3>Keine Lösung</h3><p>Ist det = 0, landet die ganze Ebene auf einer Geraden. Eine Fläche kann dann kein Bild sein.</p></article>' +
      '</div>' +
      '<div class="cgx-scroll"><table class="cgx-t"><thead><tr><th>Eigenschaft</th><th>affin</th><th>projektiv</th></tr></thead><tbody>' +
      AFFPROJ_ROWS.map(function (r) { return '<tr><td style="font-family:inherit">' + r[0] + '</td><td>' + (r[1] ? "ja" : "nein") + '</td><td>' + (r[2] ? "ja" : "nein") + '</td></tr>'; }).join("") +
      '</tbody></table></div>' +
      '<ul class="cgx-traps"><li>4×4-Matrizen mit letzter Zeile (0 0 0 1) sind affin — auch wenn sie in Aufgabe 1 auftauchen.</li><li>Projektiv ist jede invertierbare Matrix, also auch jede invertierbare affine.</li><li>Spiegelung an x = 1 hat Translation (2, 0), nicht (1, 0).</li></ul>',
    projektion:
      '<h2>Neu seit 2023: Kamera, Matrix aufstellen, Texturen</h2>' +
      '<div class="cgx-formula"><div>z<sub>c</sub> = (Auge − Ziel)/|…| &nbsp; x<sub>c</sub> = up × z<sub>c</sub> &nbsp; y<sub>c</sub> = z<sub>c</sub> × x<sub>c</sub> &nbsp;<em>Kamera blickt entlang −z</em></div>' +
      '<div>fovy = 2·atan(t/n) &nbsp; aspect = (r − l)/(t − b)</div>' +
      '<div>gluPerspective: [ f/aspect 0 0 0 | 0 f 0 0 | 0 0 −(F+N)/(F−N) −2FN/(F−N) | 0 0 −1 0 ], f = cot(fovy/2)</div>' +
      '<div>Tiefe z\' = (F+N)/(F−N) + 2FN/((F−N)·z) &nbsp;<em>z = −N → −1, z = −F → +1</em></div></div>' +
      '<div class="cgx-duo">' +
      '<article><h3>Punkt oder parallel</h3><p>Letzte Zeile (0 0 0 1): parallel, keine Fluchtpunkte. Sonst Punktperspektive; ein Fluchtpunkt je Achse, deren Eintrag in der letzten Zeile ≠ 0 ist.</p></article>' +
      '<article><h3>Mittelpunkt</h3><p>Projektiv: die Bildmitte ist nicht die Mitte des Bildes (w unterschiedlich). Affin/parallel: bleibt die Mitte.</p></article>' +
      '<article><h3>MIP über Distanz</h3><p>Auflösung ∝ 1/Abstand. 64² bei 60 m → 32² bei 120 m, 128² bei 30 m, 256² bei 15 m; näher als 15 m: Magnification.</p></article>' +
      '<article><h3>Perspektivisch korrekt</h3><p>u = Σ λᵢ·uᵢ/zᵢ ÷ Σ λᵢ/zᵢ mit Bildraum-Baryzentrik λ. Die nähere Ecke zieht stärker.</p></article>' +
      '</div>' +
      '<ul class="cgx-traps"><li>Stufe 0 ist je nach Aufgabe die feinste oder die gröbste — immer nachlesen (Apr 2024: Stufe 0 = 1 Pixel).</li><li>Trilinear nimmt die beiden Nachbarstufen der berechneten Stufe.</li><li>Linear interpolierte Textur auf zwei Dreiecken knickt an der Diagonale.</li></ul>',
    raster:
      '<h2>Neu seit 2023: DDA, Bresenham-Variante, Kantentest, Kreise</h2>' +
      '<div class="cgx-formula"><div>direkt: y += m, setPixel(x, round(y)) &nbsp;<em>Gleitkomma, Runden in jedem Schritt</em></div>' +
      '<div>Okt 2025: D = Δx − 2Δy, DE = −2Δy, DNE = 2(Δx − Δy); D &lt; 0 → nordost</div>' +
      '<div>Kantenvektor p→q: e = (p<sub>y</sub> − q<sub>y</sub>, q<sub>x</sub> − p<sub>x</sub>, p<sub>x</sub>q<sub>y</sub> − p<sub>y</sub>q<sub>x</sub>), innen ⇔ e·(x, y, 1) > 0 für alle Kanten</div>' +
      '<div>Kreis: (x − mx)² + (y − my)² ≤ r² über die Bounding Box; Ring: r² ≤ … ≤ (r + d)²</div></div>' +
      '<div class="cgx-duo">' +
      '<article><h3>Punkt in Polygon</h3><p>Strahl nach rechts, Kantenschnitte zählen. Ungerade → innen.</p></article>' +
      '<article><h3>Steigung > 1</h3><p>Direkt: Lücken. Bresenham: läuft diagonal und verfehlt den Endpunkt. Lösung: x und y vertauschen.</p></article>' +
      '<article><h3>z mitführen</h3><p>ET: z unten und dz/dy. AET: aktuelles z, pro Scanline + dz/dy.</p></article>' +
      '<article><h3>Selbstüberschneidung</h3><p>Even-Odd: doppelt überdeckte Bereiche bleiben leer.</p></article>' +
      '</div>',
    phong:
      '<h2>Neu seit 2023: Abschwächung, Bewegung, Blinn-Phong, Shader</h2>' +
      '<div class="cgx-formula"><div>I<sub>in</sub> = I / d² &nbsp;<em>quadratische Abschwächung (Apr 2026)</em></div>' +
      '<div>Blinn-Phong: h = (l + v)/|l + v|, spekular k<sub>s</sub>·I·(n·h)<sup>n</sup></div>' +
      '<div>Licht = Kamera: diffus k<sub>d</sub>·I·cos α / d², Phong-spekular k<sub>s</sub>·I·cos(2α)<sup>n</sup> / d², Blinn-spekular k<sub>s</sub>·I·cos(α)<sup>n</sup></div>' +
      '<div>Auswertungen bei T = 2V: Flat 2V, Gouraud V, Phong 2V·P</div></div>' +
      '<div class="cgx-duo">' +
      '<article><h3>Licht bewegen</h3><p>Ändert diffus (n·l, Abstand) und spekular. Richtung senkrecht über P → heller.</p></article>' +
      '<article><h3>Kamera bewegen</h3><p>Diffus bleibt gleich. Spekular: liegt v am Start genau auf r, wird jede Bewegung dunkler.</p></article>' +
      '<article><h3>Shader lesen</h3><p>Beleuchtung im Vertex-Shader → Gouraud. Normale als varying und Beleuchtung im Fragment-Shader → Phong.</p></article>' +
      '<article><h3>Bilder zuordnen</h3><p>Nur ambient: flache Silhouette. Nur diffus: matt. Nur spekular: schwarz mit Glanz. Großes n: kleiner Glanzpunkt.</p></article>' +
      '</div>',
    farbe:
      '<h2>Neu seit 2023: Spektren und Alpha-Blending</h2>' +
      '<p class="cgx-note">Ein Spektrum zeigt die Intensität über der Wellenlänge, links kurzwellig (blau), rechts langwellig (rot). Die Höhe im blauen, grünen und roten Bereich liest man als B, G, R ab.</p>' +
      '<div class="cgx-fig">' + spectrumSVG([1, 1, 1]) + spectrumSVG([1, 0.5, 0.5]) + spectrumSVG([0, 1, 1]) + spectrumSVG([0, 0.5, 0]) + '</div>' +
      '<p class="cgx-note">Von links: weiß (1,1,1), hellblau (0,5 | 0,5 | 1), gelb (1,1,0), dunkelgrün (0 | 0,5 | 0).</p>' +
      '<div class="cgx-formula"><div>C<sub>neu</sub> = α·C + (1 − α)·C<sub>alt</sub> &nbsp;<em>mehrere Farben nacheinander, immer mit dem aktuellen Pixel weiterrechnen</em></div>' +
      '<div>HSV-Kegel: Hue = Winkel um die Achse, Saturation = Abstand von der Achse, Value = Höhe</div></div>',
    strahlen:
      '<h2>Neu seit 2023: Laufzeittabelle und Strahlbäume</h2>' +
      '<div class="cgx-scroll"><table class="cgx-t"><thead><tr><th>Verfahren</th><th>Vertex-Shader</th><th>Pixel-Shader</th><th>Beleuchtung</th><th>Tiefentests</th></tr></thead><tbody>' +
      '<tr><td>Gouraud</td><td>V</td><td>T·p</td><td>V</td><td>T·p</td></tr><tr><td>Pixel Shading</td><td>V</td><td>T·p</td><td>T·p</td><td>T·p</td></tr>' +
      '<tr><td>Deferred, Lichtpass</td><td>4</td><td>P</td><td>P</td><td>0</td></tr><tr><td>4× SSAA</td><td>V</td><td>4·T·p</td><td>4·T·p</td><td>4·T·p</td></tr>' +
      '<tr><td>Ray Casting</td><td colspan="4">P Schnitte, P Beleuchtungen</td></tr></tbody></table></div>' +
      '<div class="cgx-formula"><div>Treffer im Strahlbaum (Glas, maxdepth N): 1 + 2 + … + 2<sup>N</sup> = 2<sup>N+1</sup> − 1</div>' +
      '<div>Schnitttests = Treffer · (1 + Anzahl Lichter) · Samples &nbsp;<em>N = 1, ein Licht: 3 · 2 = 6</em></div></div>',
    szene: ""
  };

  /* ================= Öffentliche Schnittstelle ================= */
  var LABELS = {
    affin: { prod: "Produktklasse · wie Apr 2024 1f", props: "Eigenschaften · wie Okt 2025 1e", affproj: "Affin vs. projektiv · wie Apr 2025 1g",
      pivot: "Abbildung um Punkt · wie Apr 2026 1g", projmap: "Projektive Abbildung · wie Okt 2023 1h", infset: "Punkte nach unendlich · wie Apr 2025 1f",
      nosol: "Keine Lösung · wie Okt 2025 1d", named: "Matrix angeben · wie Okt 2023 1a–f" },
    projektion: { cam: "Kamerasystem · wie Okt 2023 2a", fov: "FOV und aspect · wie Okt 2023 2c", persmat: "Matrix aufstellen · wie Okt 2024 2a",
      depth: "Tiefe nach Perspektive · wie Okt 2024 2b", ptype: "Punkt oder parallel · wie Apr 2026 2a", hom: "Fernpunkte · wie Okt 2024 2c/d",
      line: "Linie und Mittelpunkt · wie Apr 2026 2b–d", mipdist: "MIP über Distanz · wie Apr 2025 5c", trilin: "Trilineare Stufen · wie Okt 2023 3g",
      pcorr: "Perspektivisch korrekt · wie Okt 2025 5b", texmc: "Texturen und Kamera · wie Okt 2023 3" },
    raster: { dda: "Direkter Algorithmus · wie Okt 2025 3a", bres2: "Bresenham-Variante · wie Okt 2025 3b", bres2mc: "Linienalgorithmen · wie Okt 2025 3c/d",
      edgevec: "Kantentest · wie Apr 2024 3c", pip: "Punkt in Polygon · wie Okt 2024 3d", circle: "Kreis rasterisieren · wie Apr 2025 3d/e",
      scanx: "Scanline-Erweiterungen · wie Okt 2023 4c" },
    phong: { att: "Farbe mit Abschwächung · wie Apr 2026 4b", move: "Licht und Kamera bewegen · wie Apr 2024 4c", formula: "Formeln · wie Apr 2025 4a–d",
      lcount: "Auswertungen zählen · wie Apr 2025 4e", shadid: "Shading erkennen · wie Okt 2024 4e/f", params: "Parameter zuordnen · wie Okt 2023 6a",
      rt3d: "Beleuchtung im Raytracer · wie Okt 2023 6b/c" },
    farbe: { spec: "Spektrum lesen · wie Apr 2026 5a", specpick: "Spektrum wählen · wie Okt 2025 6", alpha: "Alpha-Blending · wie Apr 2026 5b",
      hsvparam: "HSV-Kegel · wie Apr 2024 6a" },
    strahlen: { cxtab: "Laufzeittabelle · wie Apr 2024 5a", rtcount: "Strahlbaum zählen · wie Okt 2024 5b–d" },
    szene: { sgcount: "Instanzen zählen · wie Okt 2023 5a", sginst: "Instanzen eintragen · wie Apr 2026 6a", sgbuild: "Szenengraph bauen · wie Apr 2026 6b",
      stack: "Matrixstapel · wie Apr 2026 6c", rot: "Rotationen · wie Apr 2026 6d/e" }
  };
  var GEN = { affin: affinTasks, projektion: projektionTasks, raster: rasterTasks, phong: phongTasks, farbe: farbeTasks, strahlen: strahlenTasks, szene: szeneTasks };

  window.CGX = {
    tasks: function (topic) { return GEN[topic] ? GEN[topic]() : []; },
    labels: function (topic) { return LABELS[topic] || {}; },
    render: function (task) { injectStyle(); return render(task); },
    mountExplain: function (topic) {
      injectStyle();
      var host = document.getElementById("view-erklaerung");
      if (!host || !EXPLAIN[topic] || document.getElementById("cgx-explain")) { return; }
      var sec = document.createElement("section");
      sec.id = "cgx-explain";
      sec.className = "cgx-sec";
      sec.innerHTML = EXPLAIN[topic];
      host.appendChild(sec);
    },
    sceneSVG: sceneSVG,
    sgRandom: sgRandom,
    spectrumSVG: spectrumSVG,
    pick: pick
  };
}());
