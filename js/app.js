// 《性学三论》 — Stitch "Atelier Monolith" Immersive Interactive Web Book Engine
// Project: projects/17556580722105377490 | Design System: assets/46cb1893d1284330b6d0feef9ea9bd92
// Pure White (#FFFFFF) · Progressive Shallow-to-Deep Immersion · Complete Scholarly Content

(function () {
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
    { id: "intro-li", act: "ACT 00", short: "导读 · 李银河", archiveNo: "2015-00" },
    { id: "preface-1920", act: "ACT 01", short: "1920第四版原序", archiveNo: "1920-00" },
    { id: "essay-1", act: "ACT I", short: "I. 性变态", archiveNo: "1905-01" },
    { id: "essay-2", act: "ACT II", short: "II. 幼儿期性欲", archiveNo: "1905-02" },
    { id: "essay-3", act: "ACT III", short: "III. 青春期的改变", archiveNo: "1905-03" },
    { id: "love-psychology", act: "ACT IV", short: "IV. 爱情心理学", archiveNo: "1910-04" },
    { id: "cultural-morality", act: "ACT V", short: "V. 文化的性道德", archiveNo: "1908-05" }
  ];

  const SVG_ICONS = {
    menu: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25"><line x1="2" y1="4.5" x2="14" y2="4.5"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="11.5" x2="14" y2="11.5"/></svg>',
    arrowRight: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.35"><line x1="2.5" y1="8" x2="13" y2="8"/><polyline points="9,4 13.2,8 9,12"/></svg>',
    arrowDown: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.35"><line x1="8" y1="2.5" x2="8" y2="13"/><polyline points="4,9 8,13.2 12,9"/></svg>',
    close: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.35"><line x1="3.5" y1="3.5" x2="12.5" y2="12.5"/><line x1="12.5" y1="3.5" x2="3.5" y2="12.5"/></svg>'
  };

  const STATE = {
    screen: "prologue", // "prologue" | "reader"
    currentChapterId: safeGet("am_current_ch", "intro-li"),
    // Tracks how many sections the reader has progressively unfolded per chapter (starts at 1 for zero overload!)
    unfoldedMap: safeGetJson("am_unfolded_map", {}),
    intuitionPicked: safeGetJson("am_intuition_picked", {}),
    activeSidenoteTermId: null,
    atlasOpen: false,
    atlasTab: "lexicon", // "lexicon" | "scorecard" | "thinkers" | "timeline"
    atlasQuery: ""
  };

  function getBook() {
    return (
      window.BOOK_DATA || {
        chapters: [],
        glossary: [],
        thinkers: [],
        scienceScorecard: [],
        timeline: []
      }
    );
  }

  function getActMeta(chapterId) {
    return ACT_CODES.find((a) => a.id === chapterId) || ACT_CODES[0];
  }

  function getUnfoldedCount(ch) {
    const total = (ch.sections || []).length || 1;
    const saved = Number(STATE.unfoldedMap[ch.id] || 1);
    return Math.min(total, Math.max(1, saved));
  }

  function setUnfoldedCount(chId, count) {
    STATE.unfoldedMap[chId] = count;
    safeSet("am_unfolded_map", JSON.stringify(STATE.unfoldedMap));
  }

  function getChapterPct(ch) {
    const total = (ch.sections || []).length || 1;
    if (!STATE.unfoldedMap[ch.id]) return 0;
    return Math.min(100, Math.round((STATE.unfoldedMap[ch.id] / total) * 100));
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Format markdown bold (**text**) and inline glossary highlights (`term`)
  function formatProse(str) {
    if (!str) return "";
    const glossary = getBook().glossary || [];
    return escapeHtml(str)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.+?)`/g, (_, termText) => {
        const clean = termText.trim();
        const found = glossary.find(
          (g) => g.term.includes(clean) || clean.includes(g.term.split("（")[0])
        );
        if (found) {
          return `<span class="inline-term" data-term-id="${escapeHtml(found.id)}" title="点击在右侧边注栏查看词条详解">${termText}</span>`;
        }
        return `<span class="inline-term">${termText}</span>`;
      });
  }

  // =========================================================================
  // Shared Components: Header & Footer
  // =========================================================================
  function renderSharedFooter(activeKey) {
    const ambientOn = window.MonolithAudio && window.MonolithAudio.isOn();
    return `
      <footer class="monolith-footer">
        <div class="monolith-footer-inner">
          <div class="meta-label">VIENNA 1905 ARCHIVAL EDITION // 徐胤德文直译精简与百年科学重读</div>
          <div class="footer-nav-links">
            <button class="footer-link-btn ${activeKey === "prologue" ? "active" : ""}" data-nav-action="prologue">PROLOGUE 序幕</button>
            <button class="footer-link-btn ${activeKey === "reader" ? "active" : ""}" data-nav-action="reader">ESSAYS 正文</button>
            <button class="footer-link-btn ${activeKey === "atlas" ? "active" : ""}" data-nav-action="atlas">ATLAS 图谱</button>
          </div>
          <button class="ambient-btn ${ambientOn ? "is-on" : ""}" data-ambient-toggle="1">
            <span class="ambient-led"></span>
            <span>自然白噪音 AMBIENT: ${ambientOn ? "ON" : "OFF"}</span>
          </button>
        </div>
      </footer>
    `;
  }

  function bindGlobalTriggers(scopeEl) {
    scopeEl.querySelectorAll("[data-nav-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.navAction;
        if (act === "prologue") {
          closeAtlas();
          openPrologue();
        } else if (act === "reader") {
          closeAtlas();
          openChapter(STATE.currentChapterId || "intro-li");
        } else if (act === "atlas") {
          openAtlas("lexicon");
        }
      });
    });

    scopeEl.querySelectorAll("[data-ambient-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!window.MonolithAudio) return;
        const on = window.MonolithAudio.toggle();
        document.querySelectorAll("[data-ambient-toggle]").forEach((b) => {
          b.classList.toggle("is-on", on);
          const span = b.querySelector("span:last-child");
          if (span) span.textContent = `自然白噪音 AMBIENT: ${on ? "ON" : "OFF"}`;
        });
      });
    });
  }

  // =========================================================================
  // SCREEN 1: Pure-White Minimalist Prologue (Stitch monolith_01_prologue)
  // =========================================================================
  function openPrologue() {
    STATE.screen = "prologue";
    const bar = document.getElementById("scroll-progress-line");
    if (bar) bar.style.width = "0%";

    const chapters = getBook().chapters || [];
    const hasStarted = Object.keys(STATE.unfoldedMap).length > 0;
    const curMeta = getActMeta(STATE.currentChapterId);

    const app = document.getElementById("monolith-app");
    app.innerHTML = `
      <div class="prologue-shell">
        <header class="monolith-header">
          <div class="monolith-header-inner">
            <button class="brand-anchor" data-nav-action="prologue">
              <span class="brand-serif">性学三论</span>
              <span class="brand-year">1905</span>
            </button>
            <button class="index-trigger-btn borderless" data-nav-action="atlas">
              <span>目录 INDEX</span>
              ${SVG_ICONS.menu}
            </button>
          </div>
        </header>

        <main class="prologue-center">
          <div class="prologue-kicker-row">
            <span class="kicker-rule"></span>
            <span class="meta-label">SIGMUND FREUD · 1905 — 现代精简与跨学科重读</span>
            <span class="kicker-rule"></span>
          </div>

          <div>
            <h1 class="prologue-hero-title">性学三论</h1>
            <span class="prologue-german-sub">Drei Abhandlungen zur Sexualtheorie</span>
          </div>

          <div class="prologue-poem">
            <p>推开 1905 年维也纳柏格街 19 号的诊室之门，</p>
            <p>由浅入深，重返人类潜意识最受争议的起点。</p>
          </div>

          <button class="btn-prologue-pill" id="btn-enter-immersion">
            <span>${hasStarted ? `继续沉浸 · ${curMeta.short}` : "序幕 · 开启沉浸阅读"}</span>
            ${SVG_ICONS.arrowRight}
          </button>

          <nav class="act-dots-nav" aria-label="七幕篇章速览">
            <div class="act-dots-pill">
              ${ACT_CODES.map((am, idx) => {
                const ch = chapters.find((c) => c.id === am.id);
                const pct = ch ? getChapterPct(ch) : 0;
                const isActive = am.id === STATE.currentChapterId;
                const cls = isActive ? "is-active" : pct > 0 ? "is-read" : "";
                return `
                  <button class="act-dot-btn ${cls}" data-jump-ch="${am.id}" aria-label="${escapeHtml(am.short)}">
                    <span class="act-dot-core"></span>
                    <span class="act-dot-tooltip">${escapeHtml(am.short)}</span>
                  </button>
                `;
              }).join("")}
            </div>
            <span class="act-dots-caption">${escapeHtml(curMeta.act)} // 7 CHAPTERS</span>
          </nav>
        </main>

        ${renderSharedFooter("prologue")}
      </div>
    `;

    bindGlobalTriggers(app);

    const enterBtn = document.getElementById("btn-enter-immersion");
    if (enterBtn) {
      enterBtn.addEventListener("click", () => {
        openChapter(hasStarted ? STATE.currentChapterId : "intro-li");
      });
    }

    app.querySelectorAll("[data-jump-ch]").forEach((dot) => {
      dot.addEventListener("click", () => {
        openChapter(dot.dataset.jumpCh);
      });
    });

    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // =========================================================================
  // SCREEN 2: Asymmetric Chapter Reader (Stitch monolith_02_chapter_reader)
  // =========================================================================
  function openChapter(chapterId, preserveScroll) {
    const chapters = getBook().chapters || [];
    const ch = chapters.find((c) => c.id === chapterId) || chapters[0];
    if (!ch) return;

    STATE.screen = "reader";
    STATE.currentChapterId = ch.id;
    safeSet("am_current_ch", ch.id);

    if (!STATE.unfoldedMap[ch.id]) {
      setUnfoldedCount(ch.id, 1);
    }

    // Pick a default glossary term linked to this chapter for the sticky sidenote
    const glossary = getBook().glossary || [];
    const chTerms = glossary.filter((g) => g.chapterId === ch.id);
    if (!STATE.activeSidenoteTermId || !glossary.some((g) => g.id === STATE.activeSidenoteTermId)) {
      STATE.activeSidenoteTermId = (chTerms[0] || glossary[0] || {}).id || null;
    } else if (chTerms.length && !preserveScroll) {
      STATE.activeSidenoteTermId = chTerms[0].id;
    }

    renderReaderDOM(ch);
    if (!preserveScroll) {
      window.scrollTo({ top: 0, behavior: "instant" });
      updateScrollTelemetry();
    }
  }

  function renderReaderDOM(ch) {
    const chapters = getBook().chapters || [];
    const chIdx = chapters.findIndex((c) => c.id === ch.id);
    const nextCh = chIdx >= 0 && chIdx < chapters.length - 1 ? chapters[chIdx + 1] : null;
    const prevCh = chIdx > 0 ? chapters[chIdx - 1] : null;
    const actMeta = getActMeta(ch.id);
    const unfoldedCount = getUnfoldedCount(ch);
    const sections = ch.sections || [];
    const visibleSections = sections.slice(0, unfoldedCount);
    const nextHiddenSec = sections[unfoldedCount] || null;

    const app = document.getElementById("monolith-app");
    app.innerHTML = `
      <div class="reader-shell">
        <header class="monolith-header">
          <div class="monolith-header-inner">
            <div style="display:flex;align-items:baseline;gap:10px;min-width:0">
              <button class="brand-anchor" data-nav-action="prologue" title="返回序幕扉页">
                <span class="brand-serif">性学三论</span>
              </button>
              <span class="header-crumb-sep">/</span>
              <span class="header-act-label">${escapeHtml(actMeta.act)} · ${escapeHtml(ch.germanTitle || ch.numberLabel)}</span>
            </div>

            <div class="header-right-actions">
              <button class="index-trigger-btn" data-nav-action="atlas">
                <span class="dot-obsidian"></span>
                <span>目录与图谱 INDEX</span>
                ${SVG_ICONS.menu}
              </button>
            </div>
          </div>
        </header>

        <main class="reader-main">
          <div class="reader-grid">
            <!-- Left 8-Col Essay Column -->
            <article class="essay-column">
              <!-- Chapter Monument Header -->
              <header class="chapter-lead-header">
                <div class="archive-stamp-row">
                  <span class="square-obsidian"></span>
                  <span>[ ARCHIVE NO. ${escapeHtml(actMeta.archiveNo)} / ${escapeHtml(ch.numberLabel)} · EST. ${ch.readingMinutes || 12} MIN IMMERSION ]</span>
                </div>
                <h1 class="chapter-h1">${escapeHtml(ch.title)}</h1>
                <p class="chapter-german">${escapeHtml(ch.germanTitle || "")} ${ch.year ? `(${escapeHtml(ch.year.split("·")[0].trim())})` : ""}</p>
                ${
                  ch.epigraph
                    ? `<blockquote class="chapter-epigraph">
                        “${escapeHtml(ch.epigraph.quote)}”
                        ${ch.epigraph.source ? `<cite>— ${escapeHtml(ch.epigraph.source)}</cite>` : ""}
                      </blockquote>`
                    : ""
                }

                <details class="monolith-drawer" style="margin-top:24px">
                  <summary>
                    <span>[ 本篇核心主旨与 ${(ch.keyTakeaways || []).length} 项导读提要 ]</span>
                    <span>+</span>
                  </summary>
                  <div class="drawer-inner">
                    <p style="margin:0;font-size:14.5px;line-height:1.8;color:var(--ink-body)">${formatProse(ch.coreThesis)}</p>
                    ${
                      Array.isArray(ch.keyTakeaways) && ch.keyTakeaways.length
                        ? `<div style="border-top:1px solid var(--hairline);padding-top:12px;display:flex;flex-direction:column;gap:10px">
                            ${ch.keyTakeaways
                              .map(
                                (kt, i) => `
                              <div style="font-size:13.5px;line-height:1.7">
                                <strong style="font-family:var(--font-mono);font-size:11.5px;margin-right:6px">[0${i + 1}] ${escapeHtml(kt.title)}:</strong>
                                <span style="color:var(--ink-secondary)">${formatProse(kt.summary)}</span>
                              </div>
                            `
                              )
                              .join("")}
                          </div>`
                        : ""
                    }
                  </div>
                </details>
              </header>

              <!-- Module 1: Opening Intuition Threshold (序幕叩问 // STEP IN) -->
              ${renderIntuitionThresholdHtml(ch.id)}

              <!-- Module 2 & 3: Progressive Sections + Inline Interactive Schematic after Section 1 -->
              <div id="sections-stream">
                ${visibleSections
                  .map((sec, idx) => {
                    const secHtml = renderSectionHtml(sec, idx, sections.length);
                    const schematicSlot = idx === 0 ? `<div id="chapter-schematic-mount"></div>` : "";
                    return secHtml + schematicSlot;
                  })
                  .join("")}
              </div>

              <!-- Progressive Unfold Bar (由浅入深：按节渐进展开，或一键展开全章) -->
              ${
                nextHiddenSec
                  ? `
                <div class="unfold-next-bar" id="unfold-bar">
                  <div class="unfold-info">
                    <span>PROGRESSIVE READING // 已展开 ${unfoldedCount} / ${sections.length} 节</span>
                    <strong>下一节：${escapeHtml(nextHiddenSec.title)}</strong>
                  </div>
                  <div class="unfold-actions">
                    <button class="btn-monolith-ghost" id="btn-unfold-all">展开本篇全部 (${sections.length})</button>
                    <button class="btn-monolith-primary" id="btn-unfold-next">
                      <span>继续深入下一节</span>
                      ${SVG_ICONS.arrowDown}
                    </button>
                  </div>
                </div>
              `
                  : ""
              }

              <!-- Chapter Milestone Transition Footer -->
              <div class="milestone-footer">
                <div>
                  <span class="meta-label" style="display:block;margin-bottom:4px">READING MILESTONE // ${escapeHtml(actMeta.act)}</span>
                  <span style="font-family:var(--font-mono);font-size:12px;color:var(--ink-secondary)">
                    ${
                      unfoldedCount >= sections.length
                        ? `已完成《${escapeHtml(ch.numberLabel)}》全部 ${sections.length} 节推演`
                        : `当前已展开 ${unfoldedCount}/${sections.length} 节 · 亦可直接前往下一幕`
                    }
                  </span>
                </div>
                <div style="display:flex;gap:12px;flex-wrap:wrap">
                  ${
                    prevCh
                      ? `<button class="index-trigger-btn" id="btn-prev-act">← 上一幕</button>`
                      : ""
                  }
                  ${
                    nextCh
                      ? `<button class="btn-monolith-primary" id="btn-next-act">
                          <span>下一幕 · ${escapeHtml(getActMeta(nextCh.id).act)} ${escapeHtml(nextCh.title)}</span>
                          ${SVG_ICONS.arrowRight}
                        </button>`
                      : `<button class="btn-monolith-primary" id="btn-finish-atlas">
                          <span>终章达成 · 检阅 120 年跨学科科学总表</span>
                          ${SVG_ICONS.arrowRight}
                        </button>`
                  }
                </div>
              </div>
            </article>

            <!-- Right 4-Col Sticky Marginalia & Telemetry Column -->
            <aside class="marginalia-aside">
              <div class="marginalia-sticky">
                <!-- 1. Section Outline -->
                <div>
                  <div class="side-block-title">
                    <span class="square-obsidian" style="width:6px;height:6px"></span>
                    <span>SECTIONS // 本篇脉络 (${unfoldedCount}/${sections.length})</span>
                  </div>
                  <div class="side-sec-list">
                    ${sections
                      .map((s, idx) => {
                        const isOpen = idx < unfoldedCount;
                        return `
                          <button class="side-sec-btn ${isOpen ? "is-open" : "is-locked"}" data-goto-sec="${idx}">
                            <span style="font-family:var(--font-mono);font-size:11px">[0${idx + 1}]</span>
                            <span>${escapeHtml(s.title.replace(/^\d+\.\s*/, ""))}</span>
                          </button>
                        `;
                      })
                      .join("")}
                  </div>
                </div>

                <!-- 2. Live Contextual Sidenote -->
                <div id="sticky-sidenote-slot">
                  ${renderSidenoteCardHtml(STATE.activeSidenoteTermId, ch)}
                </div>

                <!-- 3. Historical Context Note -->
                ${
                  Array.isArray(ch.editionEvolution) && ch.editionEvolution[0]
                    ? `
                  <div class="sidenote-card">
                    <div class="meta-label" style="margin-bottom:6px">ARCHIVAL NOTE // 版本考据</div>
                    <div class="sn-ger">${escapeHtml(ch.editionEvolution[0].year)}</div>
                    <p>${formatProse(ch.editionEvolution[0].note)}</p>
                  </div>
                `
                    : ""
                }

                <!-- 4. Reading Telemetry -->
                <div class="telemetry-box">
                  <div>STATUS: IMMERSIVE READING</div>
                  <div>CHAPTER PROGRESS: ${Math.round((unfoldedCount / sections.length) * 100)}%</div>
                  <div>SCROLL DEPTH: <span id="side-scroll-pct">0%</span></div>
                </div>
              </div>
            </aside>
          </div>
        </main>

        ${renderSharedFooter("reader")}
      </div>
    `;

    bindGlobalTriggers(app);
    bindIntuitionThreshold(app, ch.id);
    bindInlineGlossaryTerms(app, ch);

    // Mount bespoke Atelier Monolith Interactive SVG Schematic
    const schMount = document.getElementById("chapter-schematic-mount");
    if (schMount && window.MonolithSchematics) {
      window.MonolithSchematics.mountSchematic(schMount, ch.id);
    }

    // Progressive Unfold Handlers
    const unfoldNextBtn = document.getElementById("btn-unfold-next");
    if (unfoldNextBtn) {
      unfoldNextBtn.addEventListener("click", () => {
        const nextIdx = unfoldedCount; // 0-based index of newly revealed section
        setUnfoldedCount(ch.id, unfoldedCount + 1);
        renderReaderDOM(ch);
        const targetEl = document.getElementById(`sec-anchor-${nextIdx}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    const unfoldAllBtn = document.getElementById("btn-unfold-all");
    if (unfoldAllBtn) {
      unfoldAllBtn.addEventListener("click", () => {
        setUnfoldedCount(ch.id, sections.length);
        renderReaderDOM(ch);
      });
    }

    // Right sidebar section jump (auto-unfolds if not yet unfolded!)
    app.querySelectorAll("[data-goto-sec]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetIdx = Number(btn.dataset.gotoSec);
        if (targetIdx >= getUnfoldedCount(ch)) {
          setUnfoldedCount(ch.id, targetIdx + 1);
          renderReaderDOM(ch);
        }
        const el = document.getElementById(`sec-anchor-${targetIdx}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // Prev / Next Act navigation
    const prevBtn = document.getElementById("btn-prev-act");
    if (prevBtn && prevCh) {
      prevBtn.addEventListener("click", () => openChapter(prevCh.id));
    }
    const nextBtn = document.getElementById("btn-next-act");
    if (nextBtn && nextCh) {
      nextBtn.addEventListener("click", () => openChapter(nextCh.id));
    }
    const finishAtlasBtn = document.getElementById("btn-finish-atlas");
    if (finishAtlasBtn) {
      finishAtlasBtn.addEventListener("click", () => openAtlas("scorecard"));
    }
  }

  function renderIntuitionThresholdHtml(chapterId) {
    const th =
      window.MonolithSchematics &&
      window.MonolithSchematics.THRESHOLDS &&
      window.MonolithSchematics.THRESHOLDS[chapterId];
    if (!th) return "";

    const pickedIdx = STATE.intuitionPicked[chapterId];
    const hasPicked = pickedIdx === 0 || pickedIdx === 1;

    return `
      <section class="intuition-box" id="module-threshold">
        <div class="intuition-top">
          <span class="meta-label">序幕叩问 // STEP IN · 阅读前直觉锚定</span>
          <span class="brand-year">${escapeHtml(th.code)}</span>
        </div>
        <p class="intuition-prompt">${escapeHtml(th.prompt)}</p>
        <div class="intuition-choices">
          ${th.options
            .map(
              (opt, i) => `
            <button class="intuition-option ${pickedIdx === i ? "is-selected" : ""}" data-intuition-idx="${i}">
              <span class="sharp-radio-box"></span>
              <div>
                <span class="intuition-opt-code">${escapeHtml(opt.code)}</span>
                <p class="intuition-opt-sub">${escapeHtml(opt.sub)}</p>
              </div>
            </button>
          `
            )
            .join("")}
        </div>
        <div id="intuition-reveal-slot">
          ${
            hasPicked && th.options[pickedIdx]
              ? `<div class="intuition-reveal">
                  <span class="reveal-tag">思想坐标</span>
                  <p class="reveal-body">${escapeHtml(th.options[pickedIdx].reveal)}</p>
                </div>`
              : ""
          }
        </div>
      </section>
    `;
  }

  function bindIntuitionThreshold(scopeEl, chapterId) {
    const th =
      window.MonolithSchematics &&
      window.MonolithSchematics.THRESHOLDS &&
      window.MonolithSchematics.THRESHOLDS[chapterId];
    if (!th) return;

    scopeEl.querySelectorAll("[data-intuition-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.intuitionIdx);
        STATE.intuitionPicked[chapterId] = idx;
        safeSet("am_intuition_picked", JSON.stringify(STATE.intuitionPicked));

        scopeEl.querySelectorAll("[data-intuition-idx]").forEach((b, i) => {
          b.classList.toggle("is-selected", i === idx);
        });
        const slot = scopeEl.querySelector("#intuition-reveal-slot");
        if (slot && th.options[idx]) {
          slot.innerHTML = `
            <div class="intuition-reveal">
              <span class="reveal-tag">思想坐标</span>
              <p class="reveal-body">${escapeHtml(th.options[idx].reveal)}</p>
            </div>
          `;
        }
      });
    });
  }

  function renderSectionHtml(sec, idx, totalSecs) {
    const blocks = sec.simplifiedContent || [];
    const excerpts = sec.originalExcerpts || [];
    const marginalia = sec.marginalia || [];

    const typeLabels = {
      science: "21世纪科学实证",
      debate: "学术争鸣",
      culture: "思想与译文考据",
      history: "维也纳史料",
      case: "临床档案"
    };

    return `
      <section class="essay-section" id="sec-anchor-${idx}">
        <div class="sec-index-kicker">SECTION 0${idx + 1} / 0${totalSecs}</div>
        <h2 class="sec-h2">${escapeHtml(sec.title)}</h2>
        ${sec.subtitle ? `<p class="sec-subtitle">${escapeHtml(sec.subtitle)}</p>` : ""}

        <div class="sec-prose-flow">
          ${blocks.map((b) => renderContentBlockHtml(b)).join("")}
        </div>

        ${
          excerpts.length || marginalia.length
            ? `
          <div class="depth-drawers-stack">
            <div class="meta-label" style="margin-bottom:2px">深度文献归档 // EXPANDABLE ARCHIVES</div>
            ${
              excerpts.length
                ? `
              <details class="monolith-drawer">
                <summary>
                  <span>[ 原典译文 · 徐胤德文直译本对照摘录 (${excerpts.length}) ]</span>
                  <span>▾</span>
                </summary>
                <div class="drawer-inner">
                  ${excerpts
                    .map(
                      (ex) => `
                    <div class="excerpt-item">
                      <p class="excerpt-quote">“${formatProse(ex.quote)}”</p>
                      <div class="excerpt-meta">SOURCE // ${escapeHtml(ex.context || "《性学三论》德文直译定本")}</div>
                      ${ex.footnote ? `<p class="excerpt-foot">[弗洛伊德原注] ${formatProse(ex.footnote)}</p>` : ""}
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </details>
            `
                : ""
            }

            ${
              marginalia.length
                ? `
              <details class="monolith-drawer">
                <summary>
                  <span>[ 现代科学 · 120年跨学科深研与批判审视 (${marginalia.length}) ]</span>
                  <span>▾</span>
                </summary>
                <div class="drawer-inner">
                  ${marginalia
                    .map(
                      (m) => `
                    <div class="science-note-item">
                      <div class="science-note-head">
                        <span class="science-type-tag">${escapeHtml(typeLabels[m.type] || "跨学科审视")}</span>
                        <span class="science-note-title">${escapeHtml(m.title)}</span>
                      </div>
                      <p class="science-note-body">${formatProse(m.body)}</p>
                      ${m.sourceRef ? `<div class="science-note-ref">REF // ${escapeHtml(m.sourceRef)}</div>` : ""}
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </details>
            `
                : ""
            }
          </div>
        `
            : ""
        }
      </section>
    `;
  }

  function renderContentBlockHtml(b) {
    if (!b) return "";
    if (b.type === "paragraph") {
      return `<p class="prose-p">${formatProse(b.text)}</p>`;
    }
    if (b.type === "AnalogyCard") {
      return `
        <div class="analogy-callout">
          <div class="analogy-kicker">
            <span class="square-obsidian" style="width:6px;height:6px"></span>
            <span>类比视界 // ${escapeHtml(b.title || "通俗模型")}</span>
          </div>
          <p>${formatProse(b.text)}</p>
        </div>
      `;
    }
    if (b.type === "KeyPoints") {
      return `
        <div class="monograph-list-box">
          ${b.title ? `<div class="monograph-list-title">INDEXED POINTS // ${escapeHtml(b.title)}</div>` : ""}
          ${(b.items || [])
            .map(
              (it, idx) => `
            <div class="monograph-list-item">
              <span class="mono-idx">[${String(idx + 1).padStart(2, "0")}]</span>
              <div class="mono-item-body">
                <strong>${escapeHtml(it.label)}：</strong>${formatProse(it.detail)}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }
    if (b.type === "ProcessSteps") {
      return `
        <div class="monograph-list-box">
          ${b.title ? `<div class="monograph-list-title">SEQUENCE // ${escapeHtml(b.title)}</div>` : ""}
          ${(b.steps || [])
            .map(
              (st, idx) => `
            <div class="monograph-list-item">
              <span class="mono-idx">[${escapeHtml(st.step || String(idx + 1).padStart(2, "0"))}]</span>
              <div class="mono-item-body">
                <strong>${escapeHtml(st.title)}：</strong>${formatProse(st.desc)}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }
    if (b.type === "ComparisonTable") {
      return `
        <div class="monograph-table-wrap">
          ${b.title ? `<div class="monograph-table-cap">COMPARATIVE MATRIX // ${escapeHtml(b.title)}</div>` : ""}
          <table class="monograph-table">
            <thead>
              <tr>
                ${(b.headers || []).map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${(b.rows || [])
                .map(
                  (row) => `
                <tr>
                  ${(row || []).map((cell) => `<td>${formatProse(cell)}</td>`).join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    }
    return "";
  }

  function renderSidenoteCardHtml(termId, ch) {
    const glossary = getBook().glossary || [];
    const g = glossary.find((item) => item.id === termId) || glossary[0];
    if (!g) return "";
    return `
      <div class="sidenote-card">
        <div class="side-block-title" style="margin-bottom:8px">
          <span class="square-obsidian" style="width:6px;height:6px"></span>
          <span>SIDENOTE // 概念边注</span>
        </div>
        <h4>${escapeHtml(g.term)}</h4>
        <div class="sn-ger">${escapeHtml(g.german)} · ${escapeHtml(g.english)}</div>
        <p style="margin-bottom:10px">${formatProse(g.shortDef)}</p>
        <p style="padding-top:8px;border-top:1px solid var(--hairline);font-size:12px">
          <strong style="color:var(--ink)">现代审视：</strong>${formatProse(g.modernView)}
        </p>
        <button class="btn-monolith-ghost" style="margin-top:10px;font-size:11px" data-open-lexicon="${escapeHtml(g.term)}">
          在跨学科词典中检阅全部 24 词条 →
        </button>
      </div>
    `;
  }

  function bindInlineGlossaryTerms(scopeEl, ch) {
    scopeEl.querySelectorAll("[data-term-id]").forEach((span) => {
      span.addEventListener("click", () => {
        const tid = span.dataset.termId;
        if (!tid) return;
        STATE.activeSidenoteTermId = tid;
        const slot = document.getElementById("sticky-sidenote-slot");
        if (slot) {
          slot.innerHTML = renderSidenoteCardHtml(tid, ch);
          bindSidenoteLexiconBtn(slot);
        }
      });
    });
    const slot = document.getElementById("sticky-sidenote-slot");
    if (slot) bindSidenoteLexiconBtn(slot);
  }

  function bindSidenoteLexiconBtn(slot) {
    slot.querySelectorAll("[data-open-lexicon]").forEach((btn) => {
      btn.addEventListener("click", () => {
        STATE.atlasQuery = "";
        openAtlas("lexicon");
      });
    });
  }

  // =========================================================================
  // SCREEN 3: Catalogue & Cross-Disciplinary Knowledge Atlas (monolith_03)
  // =========================================================================
  function openAtlas(tabName) {
    if (tabName) STATE.atlasTab = tabName;
    STATE.atlasOpen = true;
    const overlay = document.getElementById("atlas-overlay");
    if (!overlay) return;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    renderAtlasContent(overlay);
  }

  function closeAtlas() {
    STATE.atlasOpen = false;
    const overlay = document.getElementById("atlas-overlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function renderAtlasContent(overlay) {
    const book = getBook();
    const chapters = book.chapters || [];
    const curMeta = getActMeta(STATE.currentChapterId);
    const curCh = chapters.find((c) => c.id === STATE.currentChapterId) || chapters[0];
    const curPct = curCh ? getChapterPct(curCh) : 0;
    const totalMins = chapters.reduce((acc, c) => acc + (c.readingMinutes || 15), 0);

    overlay.innerHTML = `
      <header class="monolith-header">
        <div class="monolith-header-inner">
          <div style="display:flex;align-items:center;gap:16px">
            <button class="brand-anchor" id="atlas-brand-close">
              <span class="brand-serif">性学三论</span>
            </button>
            <span class="header-crumb-sep">|</span>
            <span class="meta-label">CATALOGUE &amp; SCIENTIFIC ATLAS // 目录与跨学科图谱</span>
          </div>
          <div class="header-right-actions">
            <span class="brand-year" style="display:none">7 ACTS · 24 CONCEPTS · 12 VERDICTS</span>
            <button class="index-trigger-btn" id="btn-close-atlas" style="border-color:var(--ink);color:var(--ink)">
              <span>ESC / 关闭</span>
              ${SVG_ICONS.close}
            </button>
          </div>
        </div>
      </header>

      <main class="atlas-main">
        <div class="atlas-head-strip">
          <div>
            <div class="meta-label">ARCHIVAL REVISION SYSTEM // 1905 — 2024</div>
            <h1>篇章目录与120年跨学科科学实证总览</h1>
          </div>
          <div class="brand-year">
            当前位置：<strong style="color:var(--ink)">${escapeHtml(curMeta.act)} (${curPct}%)</strong>
          </div>
        </div>

        <div class="atlas-split-grid">
          <!-- Left Column: 7 Acts Chapter Navigation -->
          <section class="atlas-col-left">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;padding-bottom:14px;border-bottom:1px solid var(--hairline);margin-bottom:8px">
                <span class="meta-label" style="color:var(--ink)">CHAPTER NAVIGATION // 全书七幕篇章</span>
                <span class="brand-year">7 ACTS</span>
              </div>

              <div class="atlas-act-list">
                ${chapters
                  .map((c) => {
                    const am = getActMeta(c.id);
                    const pct = getChapterPct(c);
                    const isCur = c.id === STATE.currentChapterId;
                    return `
                      <button class="atlas-act-row ${isCur ? "is-current" : ""}" data-atlas-ch="${c.id}">
                        <div class="atlas-act-top">
                          <span>
                            <strong style="color:var(--ink)">${escapeHtml(am.act)}</strong>
                            ${isCur ? `<span class="current-pill-black">CURRENT · ${pct}%</span>` : ""}
                          </span>
                          <span>${c.readingMinutes || 15} MIN · ${pct === 100 ? "已读完 100%" : pct > 0 ? `已展 ${pct}%` : "待读"}</span>
                        </div>
                        <h3>${escapeHtml(c.title)}</h3>
                        <p>${escapeHtml(c.coreThesis)}</p>
                      </button>
                    `;
                  })
                  .join("")}
              </div>
            </div>

            <div style="padding-top:20px;margin-top:20px;border-top:1px solid var(--hairline);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
              <span class="brand-year">全书精读约 ${totalMins} MIN · 36 小节</span>
              <button class="btn-monolith-primary" id="btn-resume-reading">
                <span>跳转至当前阅读章节</span>
                ${SVG_ICONS.arrowRight}
              </button>
            </div>
          </section>

          <!-- Right Column: Cross-Disciplinary Knowledge Atlas -->
          <section class="atlas-col-right">
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--hairline);margin-bottom:16px">
              <span class="meta-label" style="color:var(--ink)">CROSS-DISCIPLINARY ATLAS // 跨学科知识图谱</span>
            </div>

            <div class="atlas-tabs-bar">
              <button class="atlas-tab-btn ${STATE.atlasTab === "lexicon" ? "is-active" : ""}" data-atab="lexicon">核心概念词典 (${(book.glossary || []).length})</button>
              <button class="atlas-tab-btn ${STATE.atlasTab === "scorecard" ? "is-active" : ""}" data-atab="scorecard">现代科学实证 (${(book.scienceScorecard || []).length})</button>
              <button class="atlas-tab-btn ${STATE.atlasTab === "thinkers" ? "is-active" : ""}" data-atab="thinkers">思想交锋人物 (${(book.thinkers || []).length})</button>
              <button class="atlas-tab-btn ${STATE.atlasTab === "timeline" ? "is-active" : ""}" data-atab="timeline">百年演进年表 (${(book.timeline || []).length})</button>
            </div>

            <input
              type="text"
              class="atlas-search-input"
              id="atlas-search-box"
              placeholder="检索德语原词、精神分析概念、脑科学核团或学者姓名..."
              value="${escapeHtml(STATE.atlasQuery)}"
            />

            <div class="atlas-records-scroll" id="atlas-records-mount">
              ${renderAtlasRecordsHtml()}
            </div>
          </section>
        </div>
      </main>
    `;

    document.getElementById("btn-close-atlas").addEventListener("click", closeAtlas);
    document.getElementById("atlas-brand-close").addEventListener("click", () => {
      closeAtlas();
      openPrologue();
    });
    document.getElementById("btn-resume-reading").addEventListener("click", () => {
      closeAtlas();
      openChapter(STATE.currentChapterId);
    });

    overlay.querySelectorAll("[data-atlas-ch]").forEach((row) => {
      row.addEventListener("click", () => {
        const targetId = row.dataset.atlasCh;
        closeAtlas();
        openChapter(targetId);
      });
    });

    overlay.querySelectorAll("[data-atab]").forEach((tabBtn) => {
      tabBtn.addEventListener("click", () => {
        STATE.atlasTab = tabBtn.dataset.atab;
        renderAtlasContent(overlay);
      });
    });

    const searchIn = document.getElementById("atlas-search-box");
    if (searchIn) {
      searchIn.addEventListener("input", () => {
        STATE.atlasQuery = searchIn.value;
        const mount = document.getElementById("atlas-records-mount");
        if (mount) mount.innerHTML = renderAtlasRecordsHtml();
      });
    }
  }

  function renderAtlasRecordsHtml() {
    const book = getBook();
    const q = (STATE.atlasQuery || "").trim().toLowerCase();

    if (STATE.atlasTab === "lexicon") {
      const list = (book.glossary || []).filter(
        (g) =>
          !q ||
          g.term.toLowerCase().includes(q) ||
          (g.german || "").toLowerCase().includes(q) ||
          (g.english || "").toLowerCase().includes(q) ||
          (g.freudView || "").toLowerCase().includes(q) ||
          (g.modernView || "").toLowerCase().includes(q)
      );
      if (!list.length) return `<p class="brand-year">未找到匹配词条。</p>`;
      return list
        .map(
          (g, i) => `
        <div class="lexicon-row">
          <div class="lexicon-row-head">
            <div>
              <span class="lexicon-code">[CON-${String(i + 1).padStart(2, "0")}]</span>
              <span class="lexicon-term-title">${escapeHtml(g.german)}</span>
              <span style="font-size:14px;color:var(--ink-secondary);margin-left:6px">(${escapeHtml(g.term)})</span>
            </div>
            <span class="verdict-badge">${escapeHtml(g.category)}</span>
          </div>
          <div class="lexicon-twin-grid">
            <div class="lex-pane freud">
              <div class="lex-pane-label">1905 弗洛伊德原论</div>
              <p>${formatProse(g.freudView)}</p>
            </div>
            <div class="lex-pane">
              <div class="lex-pane-label">2024 跨学科实证审视</div>
              <p>${formatProse(g.modernView)}</p>
            </div>
          </div>
        </div>
      `
        )
        .join("");
    }

    if (STATE.atlasTab === "scorecard") {
      const list = (book.scienceScorecard || []).filter(
        (s) =>
          !q ||
          s.claim.toLowerCase().includes(q) ||
          (s.freudSummary || "").toLowerCase().includes(q) ||
          (s.modernEvidence || "").toLowerCase().includes(q)
      );
      if (!list.length) return `<p class="brand-year">未找到匹配实证记录。</p>`;
      return list
        .map((s, i) => {
          const vCls =
            s.verdict === "debunked"
              ? "debunked"
              : s.verdict === "revised"
              ? "revised"
              : "";
          const codeTag =
            s.verdict === "confirmed"
              ? "CONFIRMED · "
              : s.verdict === "debunked"
              ? "DEBUNKED · "
              : "REVISED · ";
          return `
            <div class="lexicon-row">
              <div class="lexicon-row-head">
                <div>
                  <span class="lexicon-code">[AUD-${String(i + 1).padStart(2, "0")}]</span>
                  <span class="lexicon-term-title" style="font-size:18px">${escapeHtml(s.claim)}</span>
                </div>
                <span class="verdict-badge ${vCls}">${codeTag}${escapeHtml(s.verdictLabel)}</span>
              </div>
              <div class="lexicon-twin-grid">
                <div class="lex-pane freud">
                  <div class="lex-pane-label">原书核心假说</div>
                  <p>${formatProse(s.freudSummary)}</p>
                </div>
                <div class="lex-pane">
                  <div class="lex-pane-label">现代实验室与临床证据</div>
                  <p>${formatProse(s.modernEvidence)}</p>
                </div>
              </div>
            </div>
          `;
        })
        .join("");
    }

    if (STATE.atlasTab === "thinkers") {
      const list = (book.thinkers || []).filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          (t.originalName || "").toLowerCase().includes(q) ||
          (t.coreChallenge || "").toLowerCase().includes(q)
      );
      if (!list.length) return `<p class="brand-year">未找到匹配学者。</p>`;
      return list
        .map(
          (t, i) => `
        <div class="lexicon-row">
          <div class="lexicon-row-head">
            <div>
              <span class="lexicon-code">[FIG-${String(i + 1).padStart(2, "0")}]</span>
              <span class="lexicon-term-title" style="font-size:19px">${escapeHtml(t.name)}</span>
              <span style="font-size:12.5px;color:var(--ink-muted);margin-left:6px">${escapeHtml(t.originalName || "")}</span>
            </div>
            <span class="verdict-badge revised">${escapeHtml(t.stance || t.era || "")}</span>
          </div>
          <p style="margin:0 0 8px;font-size:13.5px;line-height:1.72;color:var(--ink-body)">${formatProse(t.coreChallenge)}</p>
          ${
            t.quote
              ? `<p style="margin:0;font-family:var(--font-serif);font-style:italic;font-size:13.5px;color:var(--ink-secondary)">“${escapeHtml(t.quote)}” — ${escapeHtml(t.work || "")}</p>`
              : ""
          }
        </div>
      `
        )
        .join("");
    }

    // Timeline
    const list = (book.timeline || []).filter(
      (ev) =>
        !q ||
        String(ev.year).toLowerCase().includes(q) ||
        (ev.title || "").toLowerCase().includes(q) ||
        (ev.description || "").toLowerCase().includes(q)
    );
    if (!list.length) return `<p class="brand-year">未找到匹配时间轴节点。</p>`;
    return list
      .map(
        (ev) => `
      <div class="lexicon-row" style="padding-bottom:14px">
        <div class="lexicon-row-head" style="margin-bottom:6px">
          <div>
            <span class="lexicon-code" style="color:var(--ink);font-weight:600">[${escapeHtml(ev.year)}]</span>
            <strong style="font-size:15px;color:var(--ink)">${escapeHtml(ev.title)}</strong>
          </div>
          <span class="brand-year">${escapeHtml(ev.track || "")}</span>
        </div>
        <p style="margin:0;font-size:13.5px;line-height:1.7;color:var(--ink-secondary)">${formatProse(ev.description)}</p>
      </div>
    `
      )
      .join("");
  }

  // =========================================================================
  // Scroll Progress Bar & Keyboard Navigation
  // =========================================================================
  function updateScrollTelemetry() {
    if (STATE.screen !== "reader") return;
    const docEl = document.documentElement || { scrollHeight: 1000 };
    const total = (docEl.scrollHeight || 1000) - (window.innerHeight || 800);
    const pct = total > 0 ? Math.min(100, Math.max(0, ((window.scrollY || 0) / total) * 100)) : 0;
    const bar = document.getElementById("scroll-progress-line");
    if (bar) bar.style.width = pct.toFixed(1) + "%";
    const sidePct = document.getElementById("side-scroll-pct");
    if (sidePct) sidePct.textContent = Math.round(pct) + "%";
  }

  function init() {
    window.addEventListener("scroll", updateScrollTelemetry);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && STATE.atlasOpen) {
        closeAtlas();
      }
    });

    openPrologue();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
