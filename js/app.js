// 《性学三论》 — Stitch "Atelier Monolith" Interactive Web Book Engine (paginated edition)
// Pure White (#FFFFFF) · Ink (#09090B) · 1px Hairlines
//
// Reading model
//   - Every function is its own screen: 读书 (home) · 阅读 (reader) · 图谱 (atlas tabs) · 进度 (progress + TOC).
//   - The reader never scrolls vertically. One section's text flows into CSS columns that are exactly one
//     screen tall; one screen = one page, flipped left/right (swipe, ← →, click the page edges, bar buttons).
//   - Secondary layers (original excerpts, science/history notes, chapter thesis, interactive figures,
//     glossary terms) open in their own sheet, which is paginated the same way.
//   - Plain scripts only (no ES modules, no CDN) so index.html works from file:// double-click.

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Storage helpers (localStorage may be unavailable on some file:// setups)
  // ---------------------------------------------------------------------------
  function safeGet(key, fallback) {
    try {
      const v = window.localStorage.getItem(key);
      return v !== null ? v : fallback;
    } catch (_) {
      return fallback;
    }
  }
  function safeSet(key, val) {
    try {
      window.localStorage.setItem(key, String(val));
    } catch (_) {}
  }
  function safeGetJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  const ACT_CODES = [
    { id: "intro-li", act: "ACT 00", short: "导读 · 李银河", figure: "FIG. 00" },
    { id: "preface-1920", act: "ACT 01", short: "1920 第四版原序", figure: "FIG. 01" },
    { id: "essay-1", act: "ACT I", short: "I. 性变态", figure: "FIG. 02" },
    { id: "essay-2", act: "ACT II", short: "II. 幼儿期性欲", figure: "FIG. 03" },
    { id: "essay-3", act: "ACT III", short: "III. 青春期的改变", figure: "FIG. 04" },
    { id: "love-psychology", act: "ACT IV", short: "IV. 爱情心理学", figure: "FIG. 05" },
    { id: "cultural-morality", act: "ACT V", short: "V. 文化的性道德", figure: "FIG. 06" }
  ];

  const ATLAS_TABS = [
    { id: "lexicon", label: "词典", full: "核心概念词典" },
    { id: "scorecard", label: "裁决", full: "现代科学裁决" },
    { id: "thinkers", label: "人物", full: "思想交锋人物" },
    { id: "timeline", label: "年表", full: "百年演进年表" }
  ];

  const MARGIN_TYPES = {
    science: "科学实证",
    debate: "学术争鸣",
    culture: "思想与译文",
    history: "维也纳史料",
    case: "临床档案"
  };

  const ICON = {
    left: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><polyline points="10,3 5,8 10,13"/></svg>',
    right: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><polyline points="6,3 11,8 6,13"/></svg>',
    arrow: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.35" aria-hidden="true"><line x1="2.5" y1="8" x2="13" y2="8"/><polyline points="9,4 13.2,8 9,12"/></svg>',
    close: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><line x1="3.5" y1="3.5" x2="12.5" y2="12.5"/><line x1="12.5" y1="3.5" x2="3.5" y2="12.5"/></svg>',
    toc: '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><line x1="5" y1="4" x2="14" y2="4"/><line x1="5" y1="8" x2="14" y2="8"/><line x1="5" y1="12" x2="14" y2="12"/><rect x="1.6" y="3.4" width="1.3" height="1.3"/><rect x="1.6" y="7.4" width="1.3" height="1.3"/><rect x="1.6" y="11.4" width="1.3" height="1.3"/></svg>',
    book: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M2.5 4.5h5.5a2 2 0 0 1 2 2v10a1.6 1.6 0 0 0-1.6-1.6H2.5z"/><path d="M17.5 4.5H12a2 2 0 0 0-2 2v10a1.6 1.6 0 0 1 1.6-1.6h5.9z"/></svg>',
    atlas: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="3" y="3" width="5.5" height="5.5"/><rect x="11.5" y="3" width="5.5" height="5.5"/><rect x="3" y="11.5" width="5.5" height="5.5"/><rect x="11.5" y="11.5" width="5.5" height="5.5"/></svg>',
    progress: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 3a7 7 0 0 1 7 7h-7z" fill="currentColor" stroke="none"/></svg>'
  };

  const FONT_STEPS = [-2, -1, 0, 1, 2]; // px offsets applied to the reading size

  // ---------------------------------------------------------------------------
  // State & progress model
  //   PROG[chId] = { done: { "0": true, ... } }  sections finished (reached their last page)
  //   LAST = { ch, sec, frac }                     resume point (frac = page position 0..1)
  // ---------------------------------------------------------------------------
  const STATE = {
    view: "home",
    chId: null,
    sec: 0,
    atlasTab: "lexicon",
    atlasQuery: "",
    intuitionPicked: safeGetJson("am_intuition_picked", {}),
    fontStep: Math.min(4, Math.max(0, Number(safeGet("am_font_step", "2")) || 2))
  };
  let PROG = safeGetJson("am_progress_v2", {});
  let LAST = safeGetJson("am_last_v2", null);

  function saveProg() {
    safeSet("am_progress_v2", JSON.stringify(PROG));
  }
  function saveLast() {
    safeSet("am_last_v2", JSON.stringify(LAST));
  }

  function book() {
    return window.BOOK_DATA || { chapters: [], glossary: [], thinkers: [], scienceScorecard: [], timeline: [] };
  }
  function chapters() {
    return book().chapters || [];
  }
  function getCh(id) {
    const list = chapters();
    return list.find((c) => c.id === id) || list[0] || null;
  }
  function chIndex(id) {
    return chapters().findIndex((c) => c.id === id);
  }
  function actMeta(id) {
    return ACT_CODES.find((a) => a.id === id) || { id: id, act: "", short: id, figure: "" };
  }
  function doneCount(ch) {
    const p = PROG[ch.id];
    if (!p || !p.done) return 0;
    return Object.keys(p.done).filter((k) => Number(k) < (ch.sections || []).length).length;
  }
  function markDone(ch, secIdx) {
    PROG[ch.id] = PROG[ch.id] || { done: {} };
    if (!PROG[ch.id].done[secIdx]) {
      PROG[ch.id].done[secIdx] = true;
      saveProg();
    }
  }
  function totalSections() {
    return chapters().reduce((a, c) => a + (c.sections || []).length, 0);
  }
  function totalDone() {
    return chapters().reduce((a, c) => a + doneCount(c), 0);
  }
  // First unfinished section of a chapter (used when opening a chapter without a saved position)
  function firstOpenSection(ch) {
    const n = (ch.sections || []).length;
    for (let i = 0; i < n; i++) {
      if (!(PROG[ch.id] && PROG[ch.id].done && PROG[ch.id].done[i])) return i;
    }
    return 0;
  }

  // ---------------------------------------------------------------------------
  // Text helpers
  // ---------------------------------------------------------------------------
  function esc(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  // **bold** and `term` (glossary-linked) inline markup
  function prose(str) {
    if (!str) return "";
    const glossary = book().glossary || [];
    return esc(str)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.+?)`/g, (_, termText) => {
        const clean = termText.trim();
        const found = glossary.find((g) => g.term.includes(clean) || clean.includes(g.term.split("（")[0]));
        if (found) {
          return `<button type="button" class="inline-term" data-term-id="${esc(found.id)}" aria-label="${esc(clean)}：查看释义">${termText}</button>`;
        }
        return `<span class="inline-term is-plain">${termText}</span>`;
      });
  }
  function secTitle(s) {
    return String(s.title || "").replace(/^\d+\.\s*/, "");
  }

  // ---------------------------------------------------------------------------
  // Pager: paginates a flow element into screen-sized CSS columns, flipped horizontally.
  // ---------------------------------------------------------------------------
  const reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  function Pager(root, opts) {
    this.root = root;
    this.vp = root.querySelector(".pager-viewport");
    this.flow = root.querySelector(".pager-flow");
    this.ind = root.querySelector("[data-pager-ind]");
    this.prevBtn = root.querySelector("[data-pager-prev]");
    this.nextBtn = root.querySelector("[data-pager-next]");
    this.opts = opts || {};
    this.index = 0;
    this.count = 1;
    this.stride = 1;
    this.bind();
  }
  Pager.prototype.colsFor = function (w) {
    const c = this.opts.cols || { 0: 1 };
    let n = 1;
    Object.keys(c)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((minW) => {
        if (w >= minW) n = c[minW];
      });
    return n;
  };
  Pager.prototype.layout = function (keepFrac) {
    const frac = keepFrac == null ? null : keepFrac;
    const vp = this.vp;
    const flow = this.flow;
    const cs = window.getComputedStyle(vp);
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    let padX = parseFloat(cs.getPropertyValue("--pad-x")) || 22;
    const padY = parseFloat(cs.getPropertyValue("--pad-y")) || 16;
    const n = this.colsFor(vw);
    const maxCol = this.opts.maxCol || 9999;
    // Each page is flanked by padX on both sides, so the gap between columns is 2·padX and a
    // neighbouring page can never peek into the viewport. Keep a comfortable measure by widening
    // the padding (never the line length) on wide screens.
    if ((vw - 2 * n * padX) / n > maxCol) padX = (vw - n * maxCol) / (2 * n);
    const gap = padX * 2;
    const innerW = Math.max(120, vw - padX * 2);
    const innerH = Math.max(120, vh - padY * 2);
    flow.style.width = innerW + "px";
    flow.style.height = innerH + "px";
    flow.style.left = padX + "px";
    flow.style.top = padY + "px";
    flow.style.columnCount = String(n);
    flow.style.columnGap = gap + "px";
    flow.style.setProperty("--page-h", innerH + "px");
    this.cols = n;
    this.stride = innerW + gap;
    this.setX(0, false);
    // Count screens using an end sentinel (robust against trailing empty columns)
    let end = flow.querySelector(":scope > .pager-end");
    if (!end) {
      end = document.createElement("span");
      end.className = "pager-end";
      end.setAttribute("aria-hidden", "true");
      flow.appendChild(end);
    }
    const off = end.getBoundingClientRect().left - flow.getBoundingClientRect().left;
    this.count = Math.max(1, Math.floor((off + 2) / this.stride) + 1);
    let target = this.index;
    if (frac != null) target = Math.round(frac * (this.count - 1));
    if (this.opts.startAt === "end") {
      target = this.count - 1;
      this.opts.startAt = null;
    }
    this.go(Math.min(this.count - 1, Math.max(0, target)), false);
  };
  Pager.prototype.frac = function () {
    return this.count > 1 ? this.index / (this.count - 1) : 0;
  };
  Pager.prototype.setX = function (px, animate) {
    this.flow.style.transition = animate && !reduceMotion.matches ? "" : "none";
    this.flow.style.transform = "translate3d(" + px + "px,0,0)";
  };
  Pager.prototype.go = function (i, animate) {
    const prev = this.index;
    this.index = Math.min(this.count - 1, Math.max(0, i));
    this.setX(-this.index * this.stride, animate !== false);
    this.vp.scrollLeft = 0;
    if (this.ind) this.ind.textContent = this.index + 1 + " / " + this.count;
    if (this.prevBtn) this.prevBtn.disabled = this.index === 0 && !this.opts.hasPrevEdge;
    if (this.nextBtn) this.nextBtn.disabled = this.index === this.count - 1 && !this.opts.hasNextEdge;
    // Keep off-screen pages out of the tab order is impractical in multicol; instead mark visibility for AT.
    if (this.opts.onChange) this.opts.onChange(this.index, this.count, prev);
  };
  Pager.prototype.next = function () {
    if (this.index < this.count - 1) this.go(this.index + 1);
    else if (this.opts.onEdge) this.opts.onEdge(1);
  };
  Pager.prototype.prev = function () {
    if (this.index > 0) this.go(this.index - 1);
    else if (this.opts.onEdge) this.opts.onEdge(-1);
  };
  Pager.prototype.bind = function () {
    const self = this;
    const vp = this.vp;
    if (this.prevBtn) this.prevBtn.addEventListener("click", () => self.prev());
    if (this.nextBtn) this.nextBtn.addEventListener("click", () => self.next());

    // Overflow-hidden containers can still be scrolled by focus; pin and follow focus instead.
    vp.addEventListener("scroll", () => {
      if (vp.scrollLeft !== 0) vp.scrollLeft = 0;
      if (vp.scrollTop !== 0) vp.scrollTop = 0;
    });
    vp.addEventListener("focusin", (e) => {
      const r = e.target.getBoundingClientRect();
      const vr = vp.getBoundingClientRect();
      if (r.left < vr.left || r.right > vr.right) {
        const off = r.left - self.flow.getBoundingClientRect().left;
        self.go(Math.floor(off / self.stride));
      }
    });

    // Touch swipe with drag-follow
    let sx = 0, sy = 0, dx = 0, dragging = false, tracking = false, t0 = 0;
    vp.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) { tracking = false; return; }
      tracking = true; dragging = false; dx = 0;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; t0 = Date.now();
    }, { passive: true });
    vp.addEventListener("touchmove", (e) => {
      if (!tracking) return;
      dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      if (!dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) dragging = true;
      if (dragging) {
        e.preventDefault();
        const atEdge = (dx > 0 && self.index === 0) || (dx < 0 && self.index === self.count - 1);
        if (!reduceMotion.matches) self.setX(-self.index * self.stride + dx * (atEdge ? 0.3 : 1), false);
      }
    }, { passive: false });
    vp.addEventListener("touchend", () => {
      if (!tracking) return;
      tracking = false;
      if (!dragging) return;
      self.suppressClick = Date.now();
      const fast = Date.now() - t0 < 280 && Math.abs(dx) > 24;
      if (dx < -50 || (fast && dx < 0)) self.next();
      else if (dx > 50 || (fast && dx > 0)) self.prev();
      else self.go(self.index);
    });

    // Tap / click the outer page edges to flip
    vp.addEventListener("click", (e) => {
      if (self.suppressClick && Date.now() - self.suppressClick < 400) return;
      if (e.target.closest("button, a, input, select, textarea, label, summary, .no-flip")) return;
      const sel = window.getSelection && window.getSelection();
      if (sel && String(sel).length > 0) return;
      const r = vp.getBoundingClientRect();
      const x = e.clientX - r.left;
      if (x < r.width * 0.3) self.prev();
      else if (x > r.width * 0.7) self.next();
    });

    // Mouse wheel / trackpad: one flip per gesture
    let wheelLock = 0;
    vp.addEventListener("wheel", (e) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 12 || Date.now() - wheelLock < 550) return;
      wheelLock = Date.now();
      if (d > 0) self.next();
      else self.prev();
    }, { passive: false });
  };

  function pagerShell(id, inner, label, barExtra) {
    return `
      <div class="pager" id="${id}">
        <div class="pager-viewport" role="region" aria-roledescription="分页" aria-label="${esc(label)}">
          <div class="pager-flow">${inner}</div>
        </div>
        <nav class="pager-bar" aria-label="翻页">
          <button type="button" class="pager-btn" data-pager-prev aria-label="上一页">${ICON.left}<span class="pager-btn-txt">上一页</span></button>
          <div class="pager-center">
            ${barExtra || ""}
            <span class="pager-ind" data-pager-ind aria-live="polite">1 / 1</span>
          </div>
          <button type="button" class="pager-btn" data-pager-next aria-label="下一页"><span class="pager-btn-txt">下一页</span>${ICON.right}</button>
        </nav>
      </div>`;
  }

  // The pager that keyboard arrows act on: the top sheet, else the current view's pager.
  let viewPager = null;
  const sheetStack = [];
  function activePager() {
    const top = sheetStack[sheetStack.length - 1];
    if (top) return top.pager;
    return viewPager;
  }

  // ---------------------------------------------------------------------------
  // App chrome: top bar (desktop nav) + mobile bottom tab bar
  // ---------------------------------------------------------------------------
  function navItems(active) {
    const items = [
      { key: "home", href: "#/", label: "读书", icon: ICON.book },
      { key: "atlas", href: "#/atlas/" + STATE.atlasTab, label: "图谱", icon: ICON.atlas },
      { key: "me", href: "#/me", label: "进度", icon: ICON.progress }
    ];
    return items
      .map(
        (it) =>
          `<a class="nav-item ${active === it.key ? "is-active" : ""}" href="${it.href}" ${active === it.key ? 'aria-current="page"' : ""}>${it.icon}<span>${it.label}</span></a>`
      )
      .join("");
  }

  function topBar(active, middle, right) {
    return `
      <header class="topbar">
        <div class="topbar-inner">
          <div class="topbar-left">
            ${middle || `<a class="brand-anchor" href="#/" aria-label="性学三论 · 首页"><span class="brand-serif">性学三论</span><span class="brand-year">1905</span></a>`}
          </div>
          <div class="topbar-right">
            ${right || ""}
            <nav class="desk-nav" aria-label="主导航">${navItems(active)}</nav>
          </div>
        </div>
      </header>`;
  }

  function tabBar(active) {
    return `<nav class="tabbar" aria-label="主导航">${navItems(active)}</nav>`;
  }

  function setProgressLine(pct) {
    const bar = document.getElementById("scroll-progress-line");
    if (bar) bar.style.width = (pct || 0).toFixed(1) + "%";
  }

  function mount(html, viewName) {
    closeAllSheets(true);
    viewPager = null;
    const app = document.getElementById("monolith-app");
    app.className = "app view-" + viewName;
    app.innerHTML = html;
    document.documentElement.classList.toggle("in-reader", viewName === "reader");
    return app;
  }

  // ---------------------------------------------------------------------------
  // VIEW: 读书 (home) — explains itself in one screen, resume card first
  // ---------------------------------------------------------------------------
  function renderHome() {
    STATE.view = "home";
    setProgressLine(0);
    const list = chapters();
    const last = LAST && getCh(LAST.ch) ? LAST : null;
    const lastCh = last ? getCh(last.ch) : null;
    const curId = lastCh ? lastCh.id : (list[0] || {}).id;
    const done = totalDone();
    const total = totalSections();

    let resume;
    if (lastCh) {
      const sec = (lastCh.sections || [])[last.sec] || lastCh.sections[0];
      resume = `
        <a class="resume-card" href="#/read/${esc(lastCh.id)}/${last.sec}" data-resume="1">
          <span class="meta-label">继续阅读 · ${esc(actMeta(lastCh.id).act)}</span>
          <strong class="resume-title">${esc(lastCh.title)}</strong>
          <span class="resume-sub">第 ${last.sec + 1} 节 · ${esc(secTitle(sec))}</span>
          <span class="resume-foot"><span>本节约 ${Math.round((last.frac || 0) * 100)}% · 全书 ${done}/${total} 节</span>${ICON.arrow}</span>
        </a>`;
    } else {
      resume = `
        <a class="resume-card" href="#/read/${esc((list[0] || {}).id || "intro-li")}/0" data-resume="1">
          <span class="meta-label">从这里开始</span>
          <strong class="resume-title">${esc((list[0] || {}).title || "导读")}</strong>
          <span class="resume-sub">李银河导读 · 约 ${(list[0] || {}).readingMinutes || 10} 分钟</span>
          <span class="resume-foot"><span>共 ${list.length} 篇 · ${total} 节</span>${ICON.arrow}</span>
        </a>`;
    }

    const dots = ACT_CODES.map((am) => {
      const ch = list.find((c) => c.id === am.id);
      if (!ch) return "";
      const n = (ch.sections || []).length;
      const d = doneCount(ch);
      const cls = am.id === curId ? "is-active" : d >= n && n ? "is-read" : d > 0 ? "is-started" : "";
      return `
        <a class="act-dot-btn ${cls}" href="#/read/${esc(am.id)}" data-jump-ch="${esc(am.id)}" aria-label="${esc(am.act + " " + ch.title + "，已读 " + d + "/" + n + " 节")}">
          <span class="act-dot-core" aria-hidden="true"></span>
          <span class="act-dot-text"><span class="act-dot-act">${esc(am.act)}</span><span class="act-dot-name">${esc(ch.title)}</span><span class="act-dot-prog">${d}/${n}</span></span>
        </a>`;
    }).join("");

    const app = mount(
      `
      ${topBar("home")}
      <main class="view home-view" id="main">
        <section class="home-hero">
          <div class="home-kicker"><span class="kicker-rule"></span><span class="meta-label">SIGMUND FREUD · 1905</span><span class="kicker-rule"></span></div>
          <h1 class="home-title">性学三论</h1>
          <p class="home-german">Drei Abhandlungen zur Sexualtheorie</p>
          <p class="home-lede">弗洛伊德 1905 年的经典，拆成 ${list.length} 篇 ${total} 节现代中文精读。正文左右翻页；原典摘录、科学审视和互动模型收在每节末尾，想看再点开。</p>
          <ul class="home-how" aria-label="怎么读">
            <li><span class="how-key">← →</span><span>翻页</span></li>
            <li><span class="how-key how-term">词</span><span>点下划线词看释义</span></li>
            <li><span class="how-key">节末</span><span>原典 · 科学</span></li>
          </ul>
        </section>
        <section class="home-side" aria-label="阅读入口">
          ${resume}
          <nav class="act-dots-nav" aria-label="七篇速览">
            <div class="act-dots-pill">${dots}</div>
            <span class="act-dots-caption" id="act-dots-caption">${esc(actMeta(curId).act)} · ${esc((getCh(curId) || {}).title || "")}</span>
          </nav>
        </section>
      </main>
      ${tabBar("home")}
    `,
      "home"
    );

    const cap = app.querySelector("#act-dots-caption");
    app.querySelectorAll("[data-jump-ch]").forEach((dot) => {
      const show = () => {
        const ch = getCh(dot.dataset.jumpCh);
        if (cap && ch) cap.textContent = actMeta(ch.id).act + " · " + ch.title;
      };
      dot.addEventListener("mouseenter", show);
      dot.addEventListener("focus", show);
    });
  }

  // ---------------------------------------------------------------------------
  // VIEW: 阅读 (reader) — one section per flow, paginated by screen
  // ---------------------------------------------------------------------------
  function renderReader(chId, secIdx, startAt) {
    const ch = getCh(chId);
    if (!ch) return renderHome();
    const sections = ch.sections || [];
    let sec = Number.isFinite(secIdx) ? secIdx : null;
    let frac = null;
    if (sec == null) {
      if (LAST && LAST.ch === ch.id) {
        sec = LAST.sec;
        frac = LAST.frac;
      } else sec = firstOpenSection(ch);
    } else if (LAST && LAST.ch === ch.id && LAST.sec === sec && !startAt) {
      frac = LAST.frac;
    }
    sec = Math.min(sections.length - 1, Math.max(0, sec));
    STATE.view = "reader";
    STATE.chId = ch.id;
    STATE.sec = sec;
    const am = actMeta(ch.id);
    const s = sections[sec];

    const crumb = `
      <a class="icon-btn back-btn" href="#/" aria-label="返回首页">${ICON.left}</a>
      <div class="reader-crumb">
        <span class="crumb-act">${esc(am.act)} · ${esc(ch.title)}</span>
        <span class="crumb-sec">第 ${sec + 1}/${sections.length} 节 · ${esc(secTitle(s))}</span>
      </div>`;
    const right = `
      <button type="button" class="icon-btn" data-open="sections" aria-label="本篇目录">${ICON.toc}</button>
      <button type="button" class="icon-btn text-btn" data-font-cycle aria-label="调整字号（当前 ${STATE.fontStep + 1}/5）">Aa</button>`;

    const app = mount(
      `
      ${topBar("home", crumb, right)}
      <main class="view reader-view" id="main">
        ${pagerShell("reader-pager", buildSectionFlow(ch, sec), am.act + " " + ch.title + " 第 " + (sec + 1) + " 节")}
      </main>
    `,
      "reader"
    );

    try {
      history.replaceState(null, "", "#/read/" + ch.id + "/" + sec);
    } catch (_) {}

    const pagerEl = app.querySelector("#reader-pager");
    const isFirst = chIndex(ch.id) === 0 && sec === 0;
    const isLastSec = chIndex(ch.id) === chapters().length - 1 && sec === sections.length - 1;
    viewPager = new Pager(pagerEl, {
      cols: { 0: 1, 1000: 2 },
      maxCol: 640,
      startAt: startAt || null,
      hasPrevEdge: !isFirst,
      hasNextEdge: !isLastSec,
      onChange: (i, n) => {
        LAST = { ch: ch.id, sec: sec, frac: n > 1 ? i / (n - 1) : 0 };
        saveLast();
        if (i === n - 1) markDone(ch, sec);
        const pct = ((sec + (n > 1 ? i / (n - 1) : 1)) / sections.length) * 100;
        setProgressLine(pct);
      },
      onEdge: (dir) => gotoAdjacentSection(ch, sec, dir)
    });
    layoutWhenReady(viewPager, frac);
    bindFlowInteractions(app, ch, sec);

    app.querySelector("[data-open=sections]").addEventListener("click", () => openSectionsSheet(ch, sec));
    app.querySelector("[data-font-cycle]").addEventListener("click", (e) => {
      setFontStep((STATE.fontStep + 1) % FONT_STEPS.length);
      e.currentTarget.setAttribute("aria-label", "调整字号（当前 " + (STATE.fontStep + 1) + "/5）");
    });
  }

  function layoutWhenReady(pager, frac) {
    const run = () => pager.layout(frac);
    run();
    // Re-measure once fonts settle so page counts are exact.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (pager.flow.isConnected) pager.layout(pager.frac());
      });
    }
  }

  function gotoAdjacentSection(ch, sec, dir) {
    const sections = ch.sections || [];
    const list = chapters();
    const ci = chIndex(ch.id);
    if (dir > 0) {
      if (sec < sections.length - 1) return renderReader(ch.id, sec + 1, "start");
      if (ci < list.length - 1) return renderReader(list[ci + 1].id, 0, "start");
      return;
    }
    if (sec > 0) return renderReader(ch.id, sec - 1, "end");
    if (ci > 0) {
      const prevCh = list[ci - 1];
      return renderReader(prevCh.id, (prevCh.sections || []).length - 1, "end");
    }
  }

  function buildSectionFlow(ch, secIdx) {
    const sections = ch.sections || [];
    const s = sections[secIdx];
    const am = actMeta(ch.id);
    let html = "";

    if (secIdx === 0) {
      const takeN = (ch.keyTakeaways || []).length;
      html += `
        <header class="ch-cover">
          <div class="meta-label">${esc(am.act)} · ${esc(ch.numberLabel || "")} · 约 ${ch.readingMinutes || 12} 分钟</div>
          <h1 class="chapter-h1">${esc(ch.title)}</h1>
          <p class="chapter-german">${esc(ch.germanTitle || "")}${ch.year ? ` (${esc(String(ch.year).split("·")[0].trim())})` : ""}</p>
          ${ch.epigraph ? `<blockquote class="chapter-epigraph">“${esc(ch.epigraph.quote)}”${ch.epigraph.source ? `<cite>— ${esc(ch.epigraph.source)}</cite>` : ""}</blockquote>` : ""}
          <div class="cover-actions">
            ${takeN ? `<button type="button" class="layer-btn" data-open="thesis"><span>本篇要点</span><b>${takeN} 条</b></button>` : ""}
            ${window.MonolithSchematics ? `<button type="button" class="layer-btn" data-open="figure"><span>互动模型</span><b>${esc(am.figure)}</b></button>` : ""}
          </div>
          <p class="flip-hint" aria-hidden="true"><span class="hint-touch">左右滑动翻页</span><span class="hint-desk">← → 键 / 点页面两侧翻页</span></p>
        </header>`;
      html += renderIntuition(ch.id);
    }

    html += `
      <header class="sec-head page-break">
        <div class="sec-index-kicker">第 ${secIdx + 1} 节 / 共 ${sections.length} 节</div>
        <h2 class="sec-h2">${esc(secTitle(s))}</h2>
        ${s.subtitle ? `<p class="sec-subtitle">${esc(s.subtitle)}</p>` : ""}
      </header>
      ${(s.simplifiedContent || []).map(blockHtml).join("")}
      ${sectionEndHtml(ch, secIdx)}
    `;
    return html;
  }

  function sectionEndHtml(ch, secIdx) {
    const sections = ch.sections || [];
    const s = sections[secIdx];
    const ex = (s.originalExcerpts || []).length;
    const mg = (s.marginalia || []).length;
    const list = chapters();
    const ci = chIndex(ch.id);
    let next;
    if (secIdx < sections.length - 1) {
      const ns = sections[secIdx + 1];
      next = `
        <button type="button" class="next-card" data-next>
          <span class="meta-label">下一节 · ${secIdx + 2}/${sections.length}</span>
          <strong>${esc(secTitle(ns))}</strong>
          ${ns.subtitle ? `<span class="next-sub">${esc(ns.subtitle)}</span>` : ""}
          <span class="next-go">继续 ${ICON.arrow}</span>
        </button>`;
    } else if (ci < list.length - 1) {
      const nc = list[ci + 1];
      next = `
        <button type="button" class="next-card" data-next>
          <span class="meta-label">本篇读完 · 下一篇 ${esc(actMeta(nc.id).act)}</span>
          <strong>${esc(nc.title)}</strong>
          <span class="next-sub">${esc(nc.germanTitle || "")}</span>
          <span class="next-go">进入下一篇 ${ICON.arrow}</span>
        </button>`;
    } else {
      next = `
        <a class="next-card" href="#/atlas/scorecard">
          <span class="meta-label">全书读完</span>
          <strong>去看 120 年科学裁决表</strong>
          <span class="next-sub">哪些论断被证实，哪些被推翻</span>
          <span class="next-go">打开图谱 ${ICON.arrow}</span>
        </a>`;
    }
    return `
      <section class="sec-end page-break" aria-label="本节结束">
        <div class="sec-end-mark"><span class="square-obsidian"></span><span class="meta-label">第 ${secIdx + 1} 节 · 读完</span></div>
        ${
          ex || mg
            ? `<p class="sec-end-note">想深入，再点开：</p>
               <div class="layer-grid">
                 ${ex ? `<button type="button" class="layer-btn" data-open="excerpts"><span>原典摘录</span><b>${ex} 条</b><small>徐胤德文直译本</small></button>` : ""}
                 ${mg ? `<button type="button" class="layer-btn" data-open="notes"><span>科学与考据</span><b>${mg} 条</b><small>120 年跨学科审视</small></button>` : ""}
               </div>`
            : ""
        }
        ${next}
      </section>`;
  }

  function renderIntuition(chId) {
    const th = window.MonolithSchematics && window.MonolithSchematics.THRESHOLDS && window.MonolithSchematics.THRESHOLDS[chId];
    if (!th) return "";
    const picked = STATE.intuitionPicked[chId];
    const has = picked === 0 || picked === 1;
    return `
      <section class="intuition-box page-break" id="module-threshold" aria-label="开篇一问">
        <div class="intuition-top"><span class="meta-label">开篇一问 · 读前先选</span><span class="brand-year">${esc(th.code)}</span></div>
        <p class="intuition-prompt">${esc(th.prompt)}</p>
        <div class="intuition-choices">
          ${th.options
            .map(
              (opt, i) => `
            <button type="button" class="intuition-option ${picked === i ? "is-selected" : ""}" data-intuition-idx="${i}" aria-pressed="${picked === i}">
              <span class="sharp-radio-box" aria-hidden="true"></span>
              <span class="intuition-opt-text"><span class="intuition-opt-code">${esc(opt.code)}</span><span class="intuition-opt-sub">${esc(opt.sub)}</span></span>
            </button>`
            )
            .join("")}
        </div>
        <div id="intuition-reveal-slot">${has && th.options[picked] ? revealHtml(th.options[picked].reveal) : ""}</div>
      </section>`;
  }
  function revealHtml(text) {
    return `<div class="intuition-reveal"><span class="reveal-tag">思想坐标</span><p class="reveal-body">${esc(text)}</p></div>`;
  }

  function blockHtml(b) {
    if (!b) return "";
    if (b.type === "paragraph") return `<p class="prose-p">${prose(b.text)}</p>`;
    if (b.type === "AnalogyCard") {
      return `
        <div class="analogy-callout">
          <div class="analogy-kicker"><span class="square-obsidian"></span><span>类比 · ${esc(b.title || "通俗模型")}</span></div>
          <p>${prose(b.text)}</p>
        </div>`;
    }
    if (b.type === "KeyPoints" || b.type === "ProcessSteps") {
      const items = b.type === "KeyPoints" ? b.items || [] : b.steps || [];
      return `
        <div class="monograph-list-box">
          ${b.title ? `<div class="monograph-list-title">${esc(b.title)}</div>` : ""}
          ${items
            .map((it, idx) => {
              const label = b.type === "KeyPoints" ? it.label : it.title;
              const body = b.type === "KeyPoints" ? it.detail : it.desc;
              const code = b.type === "KeyPoints" ? String(idx + 1).padStart(2, "0") : it.step || String(idx + 1).padStart(2, "0");
              return `
              <div class="monograph-list-item">
                <span class="mono-idx">${esc(code)}</span>
                <div class="mono-item-body"><strong>${esc(label)}：</strong>${prose(body)}</div>
              </div>`;
            })
            .join("")}
        </div>`;
    }
    if (b.type === "ComparisonTable") {
      return `
        <div class="monograph-table-wrap">
          ${b.title ? `<div class="monograph-table-cap">${esc(b.title)}</div>` : ""}
          <table class="monograph-table">
            <thead><tr>${(b.headers || []).map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
            <tbody>${(b.rows || []).map((row) => `<tr>${(row || []).map((c) => `<td>${prose(c)}</td>`).join("")}</tr>`).join("")}</tbody>
          </table>
        </div>`;
    }
    return "";
  }

  function bindFlowInteractions(scope, ch, sec) {
    bindTerms(scope);
    scope.querySelectorAll("[data-open]").forEach((btn) => {
      if (btn.dataset.open === "sections") return;
      btn.addEventListener("click", () => {
        const k = btn.dataset.open;
        if (k === "thesis") openThesisSheet(ch);
        else if (k === "figure") openFigureSheet(ch);
        else if (k === "excerpts") openExcerptsSheet(ch, sec);
        else if (k === "notes") openNotesSheet(ch, sec);
      });
    });
    const nextBtn = scope.querySelector("[data-next]");
    if (nextBtn) nextBtn.addEventListener("click", () => gotoAdjacentSection(ch, sec, 1));

    const th = window.MonolithSchematics && window.MonolithSchematics.THRESHOLDS && window.MonolithSchematics.THRESHOLDS[ch.id];
    if (th) {
      scope.querySelectorAll("[data-intuition-idx]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.intuitionIdx);
          STATE.intuitionPicked[ch.id] = idx;
          safeSet("am_intuition_picked", JSON.stringify(STATE.intuitionPicked));
          scope.querySelectorAll("[data-intuition-idx]").forEach((b, i) => {
            b.classList.toggle("is-selected", i === idx);
            b.setAttribute("aria-pressed", String(i === idx));
          });
          const slot = scope.querySelector("#intuition-reveal-slot");
          if (slot && th.options[idx]) slot.innerHTML = revealHtml(th.options[idx].reveal);
          if (viewPager) {
            const keep = viewPager.index;
            viewPager.layout();
            viewPager.go(keep, false);
          }
        });
      });
    }
  }

  function bindTerms(scope) {
    scope.querySelectorAll("[data-term-id]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openTermSheet(el.dataset.termId);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Sheets — secondary layers on their own (paginated) page
  // ---------------------------------------------------------------------------
  function openSheet(opt) {
    const root = document.getElementById("sheet-root");
    const wrap = document.createElement("div");
    wrap.className = "sheet-layer";
    const id = "sheet-" + Date.now() + "-" + sheetStack.length;
    const paged = opt.paged !== false;
    wrap.innerHTML = `
      <div class="sheet-backdrop" data-sheet-close></div>
      <section class="sheet ${opt.wide ? "is-wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="${id}-t">
        <header class="sheet-head">
          <div class="sheet-head-txt">
            ${opt.kicker ? `<span class="meta-label">${esc(opt.kicker)}</span>` : ""}
            <h2 class="sheet-title" id="${id}-t">${esc(opt.title)}</h2>
          </div>
          <button type="button" class="icon-btn sheet-close" data-sheet-close aria-label="关闭">${ICON.close}</button>
        </header>
        ${paged ? pagerShell(id + "-p", opt.html, opt.title) : `<div class="sheet-body">${opt.html}</div>`}
      </section>`;
    root.appendChild(wrap);
    const entry = { el: wrap, pager: null, returnFocus: document.activeElement };
    sheetStack.push(entry);
    document.documentElement.classList.add("has-sheet");
    wrap.querySelectorAll("[data-sheet-close]").forEach((b) => b.addEventListener("click", closeTopSheet));
    requestAnimationFrame(() => wrap.classList.add("is-open"));
    if (paged) {
      entry.pager = new Pager(wrap.querySelector(".pager"), {
        cols: opt.cols || { 0: 1 },
        maxCol: 620
      });
      entry.pager.layout();
    }
    bindTerms(wrap);
    if (opt.onMount) opt.onMount(wrap, entry);
    const closeBtn = wrap.querySelector(".sheet-close");
    if (closeBtn) closeBtn.focus({ preventScroll: true });
    return entry;
  }

  function closeTopSheet() {
    const entry = sheetStack.pop();
    if (!entry) return;
    entry.el.remove();
    if (!sheetStack.length) document.documentElement.classList.remove("has-sheet");
    if (entry.returnFocus && entry.returnFocus.isConnected) {
      try {
        entry.returnFocus.focus({ preventScroll: true });
      } catch (_) {}
    }
  }
  function closeAllSheets() {
    while (sheetStack.length) {
      const e = sheetStack.pop();
      e.el.remove();
    }
    document.documentElement.classList.remove("has-sheet");
  }

  function openThesisSheet(ch) {
    const kt = ch.keyTakeaways || [];
    const ev = ch.editionEvolution || [];
    openSheet({
      kicker: actMeta(ch.id).act + " · 本篇要点",
      title: ch.title,
      html: `
        <p class="sheet-lede">${prose(ch.coreThesis)}</p>
        ${kt
          .map(
            (k, i) => `
          <div class="sheet-item">
            <span class="mono-idx">${String(i + 1).padStart(2, "0")}</span>
            <div><strong class="sheet-item-title">${esc(k.title)}</strong><p>${prose(k.summary)}</p></div>
          </div>`
          )
          .join("")}
        ${
          ev.length
            ? `<div class="sheet-sub page-break-soft"><span class="meta-label">版本考据</span></div>
               ${ev.map((e) => `<div class="sheet-item"><span class="mono-idx">${esc(e.year)}</span><div><p>${prose(e.note)}</p></div></div>`).join("")}`
            : ""
        }`
    });
  }

  function openFigureSheet(ch) {
    openSheet({
      kicker: actMeta(ch.id).figure + " · 互动模型",
      title: "拖动滑块，看模型变化",
      paged: false,
      wide: true,
      html: `<div id="figure-mount" class="figure-mount"></div>`,
      onMount: (wrap) => {
        const m = wrap.querySelector("#figure-mount");
        if (m && window.MonolithSchematics) window.MonolithSchematics.mountSchematic(m, ch.id);
      }
    });
  }

  function openExcerptsSheet(ch, sec) {
    const s = ch.sections[sec];
    openSheet({
      kicker: "第 " + (sec + 1) + " 节 · 原典摘录",
      title: secTitle(s),
      html: (s.originalExcerpts || [])
        .map(
          (ex) => `
        <div class="excerpt-item">
          <p class="excerpt-quote">“${prose(ex.quote)}”</p>
          <div class="excerpt-meta">${esc(ex.context || "《性学三论》徐胤德文直译本")}</div>
          ${ex.footnote ? `<p class="excerpt-foot"><span class="science-type-tag">原注</span> ${prose(ex.footnote)}</p>` : ""}
        </div>`
        )
        .join("")
    });
  }

  function openNotesSheet(ch, sec) {
    const s = ch.sections[sec];
    openSheet({
      kicker: "第 " + (sec + 1) + " 节 · 科学与考据",
      title: secTitle(s),
      html: (s.marginalia || [])
        .map(
          (m) => `
        <div class="science-note-item">
          <div class="note-lead">
            <div class="science-note-head">
              <span class="science-type-tag">${esc(MARGIN_TYPES[m.type] || "跨学科")}</span>
              ${m.verdict ? `<span class="verdict-badge">${esc(m.verdict)}</span>` : ""}
            </div>
            <h3 class="science-note-title">${esc(m.title)}</h3>
          </div>
          <p class="science-note-body">${prose(m.body)}</p>
          ${m.sourceRef ? `<div class="science-note-ref">REF · ${esc(m.sourceRef)}</div>` : ""}
        </div>`
        )
        .join("")
    });
  }

  function openSectionsSheet(ch, cur) {
    const sections = ch.sections || [];
    openSheet({
      kicker: actMeta(ch.id).act + " · 本篇目录",
      title: ch.title,
      html: sections
        .map((s, i) => {
          const done = PROG[ch.id] && PROG[ch.id].done && PROG[ch.id].done[i];
          return `
          <button type="button" class="toc-row ${i === cur ? "is-current" : ""}" data-goto-sec="${i}" ${i === cur ? 'aria-current="true"' : ""}>
            <span class="mono-idx">${String(i + 1).padStart(2, "0")}</span>
            <span class="toc-row-txt"><strong>${esc(secTitle(s))}</strong>${s.subtitle ? `<span>${esc(s.subtitle)}</span>` : ""}</span>
            <span class="toc-row-state">${i === cur ? "当前" : done ? "已读" : ""}</span>
          </button>`;
        })
        .join(""),
      onMount: (wrap) => {
        wrap.querySelectorAll("[data-goto-sec]").forEach((b) =>
          b.addEventListener("click", () => {
            const i = Number(b.dataset.gotoSec);
            closeAllSheets();
            renderReader(ch.id, i, "start");
          })
        );
      }
    });
  }

  function openTermSheet(termId) {
    const g = (book().glossary || []).find((x) => x.id === termId);
    if (!g) return;
    const ch = getCh(g.chapterId);
    openSheet({
      kicker: (g.category || "概念") + " · 词条",
      title: g.term,
      html: `
        <p class="term-ger">${esc(g.german)}${g.english ? " · " + esc(g.english) : ""}</p>
        <p class="sheet-lede">${prose(g.shortDef)}</p>
        <div class="lex-pane freud"><div class="lex-pane-label">1905 弗洛伊德原论</div><p>${prose(g.freudView)}</p></div>
        <div class="lex-pane"><div class="lex-pane-label">当代跨学科审视</div><p>${prose(g.modernView)}</p></div>
        ${ch ? `<p class="term-src meta-label">出处 · ${esc(actMeta(ch.id).act)} ${esc(ch.title)}</p>` : ""}`
    });
  }

  function openScoreSheet(item) {
    openSheet({
      kicker: "科学裁决 · " + (item.verdictLabel || ""),
      title: item.claim,
      html: `
        <div class="lex-pane freud"><div class="lex-pane-label">原书核心假说</div><p>${prose(item.freudSummary)}</p></div>
        <div class="lex-pane"><div class="lex-pane-label">现代实验室与临床证据</div><p>${prose(item.modernEvidence)}</p></div>`
    });
  }

  function openThinkerSheet(t) {
    openSheet({
      kicker: (t.stance || "思想交锋") + " · " + (t.era || ""),
      title: t.name + (t.originalName ? " · " + t.originalName : ""),
      html: `
        ${t.work ? `<p class="term-ger">${esc(t.work)}</p>` : ""}
        <p class="sheet-lede">${prose(t.coreChallenge)}</p>
        ${t.quote ? `<blockquote class="chapter-epigraph">“${esc(t.quote)}”</blockquote>` : ""}`
    });
  }

  // ---------------------------------------------------------------------------
  // VIEW: 图谱 (atlas) — four tabs, each its own paginated view
  // ---------------------------------------------------------------------------
  function atlasItems(tab) {
    const b = book();
    const q = (STATE.atlasQuery || "").trim().toLowerCase();
    const has = (...fields) => !q || fields.some((f) => String(f || "").toLowerCase().includes(q));
    if (tab === "lexicon") return (b.glossary || []).filter((g) => has(g.term, g.german, g.english, g.shortDef, g.freudView, g.modernView));
    if (tab === "scorecard") return (b.scienceScorecard || []).filter((s) => has(s.claim, s.freudSummary, s.modernEvidence, s.verdictLabel));
    if (tab === "thinkers") return (b.thinkers || []).filter((t) => has(t.name, t.originalName, t.coreChallenge, t.work, t.stance));
    return (b.timeline || []).filter((ev) => has(ev.year, ev.title, ev.description));
  }

  function atlasCardsHtml(tab, list) {
    if (!list.length) return `<p class="empty-note">没有匹配的条目，换个词试试。</p>`;
    if (tab === "lexicon") {
      return list
        .map(
          (g, i) => `
        <button type="button" class="atlas-card" data-card="${i}">
          <span class="atlas-card-top"><span class="lexicon-code">CON-${String(i + 1).padStart(2, "0")}</span><span class="verdict-badge">${esc(g.category)}</span></span>
          <span class="atlas-card-title">${esc(g.term)}</span>
          <span class="atlas-card-ger">${esc(g.german)}</span>
          <span class="atlas-card-body">${esc(g.shortDef)}</span>
        </button>`
        )
        .join("");
    }
    if (tab === "scorecard") {
      return list
        .map((s, i) => {
          const cls = s.verdict === "debunked" ? "debunked" : s.verdict === "revised" ? "revised" : "";
          const tag = s.verdict === "confirmed" ? "证实" : s.verdict === "debunked" ? "证伪" : "修正";
          return `
          <button type="button" class="atlas-card" data-card="${i}">
            <span class="atlas-card-top"><span class="lexicon-code">AUD-${String(i + 1).padStart(2, "0")}</span><span class="verdict-badge ${cls}">${tag}</span></span>
            <span class="atlas-card-title">${esc(s.claim)}</span>
            <span class="atlas-card-body">${esc(s.verdictLabel || "")}</span>
          </button>`;
        })
        .join("");
    }
    if (tab === "thinkers") {
      return list
        .map(
          (t, i) => `
        <button type="button" class="atlas-card" data-card="${i}">
          <span class="atlas-card-top"><span class="lexicon-code">${esc(t.era || "")}</span></span>
          <span class="atlas-card-title">${esc(t.name)}</span>
          <span class="atlas-card-ger">${esc(t.originalName || "")} · ${esc(t.stance || "")}</span>
          ${t.quote ? `<span class="atlas-card-body is-quote">“${esc(t.quote)}”</span>` : ""}
        </button>`
        )
        .join("");
    }
    return list
      .map(
        (ev) => `
      <div class="atlas-card is-static ${ev.highlight ? "is-highlight" : ""}">
        <span class="atlas-card-top"><span class="timeline-year">${esc(ev.year)}</span><span class="lexicon-code">${esc({ life: "生平", edition: "版本", world: "世界", milestone: "里程碑" }[ev.track] || ev.track || "")}</span></span>
        <span class="atlas-card-title">${esc(ev.title)}</span>
        <span class="atlas-card-body">${esc(ev.description)}</span>
      </div>`
      )
      .join("");
  }

  function renderAtlas(tab) {
    if (tab && ATLAS_TABS.some((t) => t.id === tab)) STATE.atlasTab = tab;
    STATE.view = "atlas";
    setProgressLine(0);
    const b = book();
    const counts = {
      lexicon: (b.glossary || []).length,
      scorecard: (b.scienceScorecard || []).length,
      thinkers: (b.thinkers || []).length,
      timeline: (b.timeline || []).length
    };
    const cur = ATLAS_TABS.find((t) => t.id === STATE.atlasTab);
    const list = atlasItems(STATE.atlasTab);
    const app = mount(
      `
      ${topBar("atlas")}
      <main class="view atlas-view" id="main">
        <div class="atlas-head">
          <div class="atlas-tabs" role="tablist" aria-label="图谱分类">
            ${ATLAS_TABS.map(
              (t) =>
                `<a role="tab" class="atlas-tab ${t.id === STATE.atlasTab ? "is-active" : ""}" href="#/atlas/${t.id}" aria-selected="${t.id === STATE.atlasTab}"><span class="tab-short">${t.label}</span><span class="tab-full">${t.full}</span><span class="tab-count">${counts[t.id]}</span></a>`
            ).join("")}
          </div>
          <label class="atlas-search">
            <span class="sr-only">在${esc(cur.full)}中检索</span>
            <input type="search" id="atlas-search-box" placeholder="检索 ${esc(cur.full)}…" value="${esc(STATE.atlasQuery)}" autocomplete="off" />
          </label>
        </div>
        ${pagerShell("atlas-pager", `<div class="atlas-cards">${atlasCardsHtml(STATE.atlasTab, list)}</div>`, cur.full)}
      </main>
      ${tabBar("atlas")}
    `,
      "atlas"
    );
    const pagerEl = app.querySelector("#atlas-pager");
    viewPager = new Pager(pagerEl, { cols: { 0: 1, 700: 2, 1100: 3 }, maxCol: 520 });
    layoutWhenReady(viewPager, 0);
    bindAtlasCards(pagerEl, list);

    const input = app.querySelector("#atlas-search-box");
    input.addEventListener("input", () => {
      STATE.atlasQuery = input.value;
      const l2 = atlasItems(STATE.atlasTab);
      const flow = pagerEl.querySelector(".pager-flow");
      flow.innerHTML = `<div class="atlas-cards">${atlasCardsHtml(STATE.atlasTab, l2)}</div>`;
      viewPager.index = 0;
      viewPager.layout();
      bindAtlasCards(pagerEl, l2);
    });
  }

  function bindAtlasCards(scope, list) {
    scope.querySelectorAll("[data-card]").forEach((card) => {
      card.addEventListener("click", () => {
        const item = list[Number(card.dataset.card)];
        if (!item) return;
        if (STATE.atlasTab === "lexicon") openTermSheet(item.id);
        else if (STATE.atlasTab === "scorecard") openScoreSheet(item);
        else if (STATE.atlasTab === "thinkers") openThinkerSheet(item);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // VIEW: 进度 (progress + full table of contents + settings)
  // ---------------------------------------------------------------------------
  function renderMe() {
    STATE.view = "me";
    setProgressLine(0);
    const list = chapters();
    const done = totalDone();
    const total = totalSections();
    const pct = total ? Math.round((done / total) * 100) : 0;
    const ambientOn = window.MonolithAudio && window.MonolithAudio.isOn();
    const rows = list
      .map((ch) => {
        const n = (ch.sections || []).length;
        const d = doneCount(ch);
        const isLast = LAST && LAST.ch === ch.id;
        return `
        <a class="me-row ${isLast ? "is-current" : ""}" href="#/read/${esc(ch.id)}">
          <span class="me-row-top"><span class="lexicon-code">${esc(actMeta(ch.id).act)} · ${esc(ch.numberLabel || "")}</span><span class="me-row-n">${d}/${n} 节${isLast ? " · 在读" : ""}</span></span>
          <strong class="me-row-title">${esc(ch.title)}</strong>
          <span class="me-bar" aria-hidden="true"><span style="width:${n ? (d / n) * 100 : 0}%"></span></span>
        </a>`;
      })
      .join("");
    const app = mount(
      `
      ${topBar("me")}
      <main class="view me-view" id="main">
        <div class="me-head">
          <div><span class="meta-label">我的进度</span><strong class="me-pct">${pct}<small>%</small></strong></div>
          <span class="me-sub">已读 ${done} / ${total} 节 · 点任一篇继续</span>
        </div>
        ${pagerShell(
          "me-pager",
          `
          <div class="me-list">${rows}</div>
          <section class="me-settings page-break-soft" aria-label="阅读设置">
            <span class="meta-label">阅读设置</span>
            <div class="set-row"><span>正文字号</span>
              <span class="set-ctrl"><button type="button" class="set-btn" data-font="-1" aria-label="减小字号">A−</button><span class="set-val" id="font-val">${STATE.fontStep + 1} / 5</span><button type="button" class="set-btn" data-font="1" aria-label="增大字号">A+</button></span></div>
            <div class="set-row"><span>书房白噪音</span>
              <button type="button" class="set-btn ambient-btn ${ambientOn ? "is-on" : ""}" data-ambient-toggle aria-pressed="${!!ambientOn}"><span class="ambient-led" aria-hidden="true"></span><span class="ambient-txt">${ambientOn ? "开" : "关"}</span></button></div>
            <div class="set-row"><span>清空阅读进度</span><button type="button" class="set-btn" data-reset>清空</button></div>
          </section>`,
          "全书目录与设置"
        )}
      </main>
      ${tabBar("me")}
    `,
      "me"
    );
    viewPager = new Pager(app.querySelector("#me-pager"), { cols: { 0: 1, 900: 2 }, maxCol: 560 });
    layoutWhenReady(viewPager, 0);

    app.querySelectorAll("[data-font]").forEach((btn) =>
      btn.addEventListener("click", () => {
        setFontStep(Math.min(4, Math.max(0, STATE.fontStep + Number(btn.dataset.font))));
        const v = app.querySelector("#font-val");
        if (v) v.textContent = STATE.fontStep + 1 + " / 5";
      })
    );
    const amb = app.querySelector("[data-ambient-toggle]");
    if (amb)
      amb.addEventListener("click", () => {
        if (!window.MonolithAudio) return;
        const on = window.MonolithAudio.toggle();
        amb.classList.toggle("is-on", on);
        amb.setAttribute("aria-pressed", String(on));
        amb.querySelector(".ambient-txt").textContent = on ? "开" : "关";
      });
    const reset = app.querySelector("[data-reset]");
    if (reset)
      reset.addEventListener("click", () => {
        if (!window.confirm("清空全部阅读进度？")) return;
        PROG = {};
        LAST = null;
        saveProg();
        saveLast();
        renderMe();
      });
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------
  function applyFontStep() {
    document.documentElement.style.setProperty("--fs-adj", FONT_STEPS[STATE.fontStep] + "px");
  }
  function setFontStep(step) {
    STATE.fontStep = step;
    safeSet("am_font_step", step);
    applyFontStep();
    if (viewPager) viewPager.layout(viewPager.frac());
  }

  // ---------------------------------------------------------------------------
  // Router (hash based; works on file://)
  //   #/                home       #/read/<ch>[/<sec>]   reader
  //   #/atlas/<tab>     atlas      #/me                  progress
  // ---------------------------------------------------------------------------
  function route() {
    const h = (location.hash || "#/").replace(/^#\/?/, "");
    const parts = h.split("/").filter(Boolean);
    if (parts[0] === "read" && parts[1]) {
      const sec = parts[2] != null ? Number(parts[2]) : null;
      renderReader(decodeURIComponent(parts[1]), Number.isFinite(sec) ? sec : null);
    } else if (parts[0] === "atlas") {
      renderAtlas(parts[1]);
    } else if (parts[0] === "me") {
      renderMe();
    } else {
      renderHome();
    }
    const main = document.getElementById("main");
    if (main) main.setAttribute("tabindex", "-1");
  }

  function init() {
    applyFontStep();
    // Migrate the previous edition's resume key once
    if (!LAST) {
      const oldCh = safeGet("am_current_ch", null);
      if (oldCh && getCh(oldCh) && getCh(oldCh).id === oldCh) LAST = { ch: oldCh, sec: 0, frac: 0 };
    }
    window.addEventListener("hashchange", route);

    document.addEventListener("keydown", (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "Escape" && sheetStack.length) {
        e.preventDefault();
        closeTopSheet();
        return;
      }
      if (typing) return;
      const p = activePager();
      if (!p) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !e.shiftKey && !(t && t.tagName === "BUTTON"))) {
        e.preventDefault();
        p.next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
        e.preventDefault();
        p.prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        p.go(0);
      } else if (e.key === "End") {
        e.preventDefault();
        p.go(p.count - 1);
      }
    });

    let rt = 0;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (viewPager && viewPager.flow.isConnected) viewPager.layout(viewPager.frac());
        sheetStack.forEach((s) => s.pager && s.pager.layout(s.pager.frac()));
      }, 140);
    });

    // Debug/test hook (read-only snapshot)
    window.__BOOK_APP__ = {
      pager: () => viewPager && { index: viewPager.index, count: viewPager.count, cols: viewPager.cols },
      sheetPager: () => {
        const top = sheetStack[sheetStack.length - 1];
        return top && top.pager ? { index: top.pager.index, count: top.pager.count } : null;
      },
      state: () => ({ view: STATE.view, ch: STATE.chId, sec: STATE.sec })
    };

    route();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
