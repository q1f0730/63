#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Automated smoke + layout check for the paginated web book.

Loads index.html straight from file:// (exactly like a double-click) at a phone
viewport (390x844, touch), a desktop viewport (1440x900, mouse) and a tablet
viewport (768x1024, touch) and asserts:

  1. zero console errors / uncaught page errors
  2. no broken images (every <img> loaded)
  3. home fits one screen (no document scroll) and every chapter dot is clickable
     with a real pointer click (nothing covers it) and opens that chapter
  4. reader: the document never scrolls vertically or horizontally, for EVERY
     section of EVERY chapter; no text fragment is clipped below the page,
     wider than its column, or peeking in from the neighbouring page; the end-of-section page is the last page
  5. page flipping works: ArrowRight / ArrowLeft, the bar buttons, tapping the
     right edge, and (phone) a horizontal swipe; flipping past the last page
     moves on to the next section
  6. secondary layers open as their own sheet (excerpts, notes, term, thesis,
     figure) and close with Escape
  7. atlas: each of the 4 tabs opens as its own paginated view and can be flipped
  8. every button / link has an accessible name

Usage:
    pip install playwright && playwright install chromium   # once
    python tools/check.py                  # uses Playwright's bundled Chromium
    python tools/check.py --chromium /usr/bin/chromium      # or a system Chromium

Exit code 0 = all checks passed.
"""
import argparse
import asyncio
import json
import os
import sys

from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "file://" + os.path.join(ROOT, "index.html").replace(os.sep, "/")

VIEWPORTS = [
    ("mobile", {"width": 390, "height": 844}, True),
    ("desktop", {"width": 1440, "height": 900}, False),
    ("tablet", {"width": 768, "height": 1024}, True),   # extra: exercises the widened-margin path
]

# Runs in the page: measures the current reader / pager for overflow and clipping.
LAYOUT_PROBE = r"""
() => {
  const de = document.documentElement;
  const vp = document.querySelector('.view .pager-viewport');
  const flow = vp && vp.querySelector('.pager-flow');
  const out = {
    docScrollH: de.scrollHeight, docScrollW: de.scrollWidth,
    innerH: innerHeight, innerW: innerWidth,
    vpScrollH: vp ? vp.scrollHeight : 0, vpClientH: vp ? vp.clientHeight : 0,
    clippedY: [], tooWide: [], bleed: []
  };
  if (!flow) return out;
  const fr = flow.getBoundingClientRect();
  const h = parseFloat(flow.style.height);
  const n = Number(flow.style.columnCount) || 1;
  const gap = parseFloat(flow.style.columnGap) || 0;
  const colW = (fr.width - gap * (n - 1)) / n;
  flow.querySelectorAll('*').forEach((el) => {
    if (el.classList.contains('pager-end')) return;
    for (const r of el.getClientRects()) {
      if (r.width === 0 && r.height === 0) continue;
      if (r.bottom > fr.top + h + 1.5) out.clippedY.push((el.className || el.tagName) + ' +' + Math.round(r.bottom - fr.top - h) + 'px');
      const vr = vp.getBoundingClientRect();
      const inside = r.left >= vr.left - 1 && r.right <= vr.right + 1;
      const outside = r.right <= vr.left + 1 || r.left >= vr.right - 1;
      if (!inside && !outside) out.bleed.push((el.className || el.tagName) + ' @' + Math.round(r.left - vr.left));
      if (r.width > colW + 1.5) out.tooWide.push((el.className || el.tagName) + ' ' + Math.round(r.width) + '>' + Math.round(colW));
    }
  });
  out.clippedY = out.clippedY.slice(0, 5);
  out.tooWide = out.tooWide.slice(0, 5);
  out.bleed = out.bleed.slice(0, 5);
  return out;
}
"""

SWIPE = r"""
(dir) => {
  const vp = document.querySelector('.view .pager-viewport');
  const r = vp.getBoundingClientRect();
  const y = r.top + r.height / 2;
  const x0 = dir > 0 ? r.right - 60 : r.left + 60;
  const x1 = dir > 0 ? r.left + 60 : r.right - 60;
  const mk = (x) => new Touch({ identifier: 1, target: vp, clientX: x, clientY: y });
  vp.dispatchEvent(new TouchEvent('touchstart', { touches: [mk(x0)], changedTouches: [mk(x0)], bubbles: true, cancelable: true }));
  for (let i = 1; i <= 6; i++) {
    const x = x0 + (x1 - x0) * i / 6;
    vp.dispatchEvent(new TouchEvent('touchmove', { touches: [mk(x)], changedTouches: [mk(x)], bubbles: true, cancelable: true }));
  }
  vp.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [mk(x1)], bubbles: true, cancelable: true }));
}
"""

MARK_VISIBLE = r"""
(sel) => {
  document.querySelectorAll('[data-check-target]').forEach((e) => e.removeAttribute('data-check-target'));
  const top = [...document.querySelectorAll('.sheet-layer')].pop();
  const scope = top || document;
  const v = (top ? top.querySelector('.pager-viewport') : document.querySelector('.view .pager-viewport'));
  const vr = v ? v.getBoundingClientRect() : { left: 0, right: innerWidth };
  const el = [...document.querySelectorAll(sel)].find((t) => {
    const r = t.getBoundingClientRect();
    if (!r.width) return false;
    if (t.closest('.pager-viewport')) return r.left >= vr.left - 1 && r.right <= vr.right + 1;
    return true;
  });
  if (!el) return false;
  el.setAttribute('data-check-target', '1');
  return true;
}
"""

UNNAMED = r"""
() => [...document.querySelectorAll('button, a[href], [role=tab], input')]
  .filter((el) => el.offsetParent !== null || el.closest('.sheet-layer'))
  .filter((el) => !((el.getAttribute('aria-label') || '').trim() || (el.innerText || '').trim() || el.labels && el.labels.length || el.getAttribute('placeholder')))
  .map((el) => el.outerHTML.slice(0, 80))
"""


class Report:
    def __init__(self):
        self.passed = 0
        self.failed = []
        self.stats = {}

    def check(self, cond, label):
        if cond:
            self.passed += 1
        else:
            self.failed.append(label)
        return cond


async def wait_settle(pg, ms=420):
    await pg.wait_for_timeout(ms)


async def pager(pg):
    return await pg.evaluate("window.__BOOK_APP__.pager()")


async def run_viewport(browser, name, vp, mobile, rep):
    ctx = await browser.new_context(viewport=vp, is_mobile=mobile, has_touch=mobile, device_scale_factor=1)
    pg = await ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    pg.on("console", lambda m: m.type == "error" and errors.append("console: " + m.text))
    pg.on("requestfailed", lambda r: errors.append("requestfailed: " + r.url))

    await pg.goto(URL)
    await wait_settle(pg, 600)
    st = rep.stats.setdefault(name, {})

    # --- home ---------------------------------------------------------------
    m = await pg.evaluate(LAYOUT_PROBE)
    rep.check(m["docScrollH"] <= m["innerH"], f"{name}: home fits one screen (scrollHeight {m['docScrollH']} <= {m['innerH']})")
    home_scroll = await pg.evaluate("document.querySelector('.home-view').scrollHeight - document.querySelector('.home-view').clientHeight")
    rep.check(home_scroll <= 1, f"{name}: home view has no inner scroll (overflow {home_scroll}px)")
    imgs = await pg.evaluate("[...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)")
    rep.check(not imgs, f"{name}: no broken images {imgs}")

    dots = await pg.evaluate("[...document.querySelectorAll('.act-dot-btn')].map(d => d.dataset.jumpCh)")
    rep.check(len(dots) == 7, f"{name}: 7 chapter dots (found {len(dots)})")
    dot_ok = 0
    for i, ch in enumerate(dots):
        await pg.goto(URL + "#/")
        await wait_settle(pg, 250)
        try:
            await pg.click(f".act-dot-btn >> nth={i}", timeout=2500)  # real pointer click, fails if covered
            await wait_settle(pg, 300)
            state = await pg.evaluate("window.__BOOK_APP__.state()")
            if state["view"] == "reader" and state["ch"] == ch:
                dot_ok += 1
        except Exception as e:  # noqa
            rep.check(False, f"{name}: dot {i} not clickable: {str(e).splitlines()[0]}")
    rep.check(dot_ok == len(dots), f"{name}: chapter dots open their chapter ({dot_ok}/{len(dots)})")
    st["dots_clicked"] = f"{dot_ok}/{len(dots)}"

    # reset progress so the run is deterministic
    await pg.evaluate("localStorage.clear()")

    # --- reader: every section of every chapter ------------------------------
    chapters = await pg.evaluate("BOOK_DATA.chapters.map(c => [c.id, c.sections.length])")
    total_pages, sections_checked, worst = 0, 0, 0
    for ch, nsec in chapters:
        for s in range(nsec):
            await pg.goto(URL + f"#/read/{ch}/{s}")  # hash route re-renders the reader from scratch
            await wait_settle(pg, 220)
            p = await pager(pg)
            m = await pg.evaluate(LAYOUT_PROBE)
            tag = f"{name}: {ch}/{s}"
            rep.check(m["docScrollH"] <= m["innerH"], f"{tag} document scrolls vertically ({m['docScrollH']}>{m['innerH']})")
            rep.check(m["docScrollW"] <= m["innerW"], f"{tag} document scrolls horizontally ({m['docScrollW']}>{m['innerW']})")
            rep.check(m["vpScrollH"] <= m["vpClientH"] + 1, f"{tag} page viewport overflows vertically")
            rep.check(not m["clippedY"], f"{tag} text clipped below page: {m['clippedY']}")
            rep.check(not m["tooWide"], f"{tag} content wider than column: {m['tooWide']}")
            rep.check(not m["bleed"], f"{tag} neighbouring page peeks into the screen: {m['bleed']}")
            # last page holds the end-of-section card
            await pg.keyboard.press("End")
            await wait_settle(pg, 380)
            end_visible = await pg.evaluate(
                "(() => { const e = document.querySelector('.sec-end'); const v = document.querySelector('.view .pager-viewport').getBoundingClientRect(); const r = e.getBoundingClientRect(); return r.left >= v.left - 1 && r.right <= v.right + 1; })()"
            )
            rep.check(end_visible, f"{tag} end-of-section page not on last page")
            total_pages += p["count"]
            worst = max(worst, p["count"])
            sections_checked += 1
    st["sections_checked"] = sections_checked
    st["reader_pages_total"] = total_pages
    st["max_pages_in_a_section"] = worst

    # --- page flipping -------------------------------------------------------
    await pg.goto(URL + "#/read/essay-1/0")
    await pg.evaluate("localStorage.clear()")
    await pg.reload()
    await wait_settle(pg, 500)
    m = await pg.evaluate(LAYOUT_PROBE)
    st["reader_doc_scrollHeight"] = m["docScrollH"]
    p0 = await pager(pg)
    await pg.keyboard.press("ArrowRight"); await wait_settle(pg)
    p1 = await pager(pg)
    rep.check(p1["index"] == 1, f"{name}: ArrowRight flips to page 2 (got {p1})")
    await pg.click("[data-pager-next]"); await wait_settle(pg)
    p2 = await pager(pg)
    rep.check(p2["index"] == 2, f"{name}: next button flips (got {p2})")
    await pg.keyboard.press("ArrowLeft"); await wait_settle(pg)
    p3 = await pager(pg)
    rep.check(p3["index"] == 1, f"{name}: ArrowLeft flips back (got {p3})")
    box = await pg.evaluate("(() => { const r = document.querySelector('.view .pager-viewport').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()")
    # tap/click the right edge, on a spot with no button
    await pg.mouse.click(box[0] + box[2] - 6, box[1] + 8) if not mobile else await pg.touchscreen.tap(box[0] + box[2] - 6, box[1] + 8)
    await wait_settle(pg)
    p4 = await pager(pg)
    rep.check(p4["index"] == 2, f"{name}: tapping the right edge flips (got {p4})")
    if mobile:
        await pg.evaluate(SWIPE, 1); await wait_settle(pg)
        p5 = await pager(pg)
        rep.check(p5["index"] == 3, f"{name}: swipe left flips forward (got {p5})")
        await pg.evaluate(SWIPE, -1); await wait_settle(pg)
        p6 = await pager(pg)
        rep.check(p6["index"] == 2, f"{name}: swipe right flips back (got {p6})")
    await pg.screenshot(path=os.path.join(ROOT, "tools", f".check_{name}_midflip.png")) if os.environ.get("CHECK_SHOTS") else None
    # flip past the end -> next section
    await pg.keyboard.press("End"); await wait_settle(pg)
    await pg.keyboard.press("ArrowRight"); await wait_settle(pg, 600)
    s = await pg.evaluate("window.__BOOK_APP__.state()")
    rep.check(s["sec"] == 1, f"{name}: flipping past last page opens next section (got {s})")
    await pg.keyboard.press("ArrowLeft"); await wait_settle(pg, 600)
    s = await pg.evaluate("window.__BOOK_APP__.state()")
    rep.check(s["sec"] == 0, f"{name}: flipping back from first page returns to previous section's last page (got {s})")
    p = await pager(pg)
    rep.check(p["index"] == p["count"] - 1, f"{name}: ...landing on its last page (got {p})")

    # --- sheets --------------------------------------------------------------
    async def sheet_open(selector, label):
        # click the first matching element that is on the current page
        found = await pg.evaluate(MARK_VISIBLE, selector)
        if not rep.check(found, f"{name}: {label}: no visible '{selector}' on this page"):
            return False
        await pg.click("[data-check-target]", timeout=5000)
        await wait_settle(pg, 400)
        n = await pg.evaluate("document.querySelectorAll('.sheet-layer').length")
        ok = rep.check(n >= 1, f"{name}: {label} sheet opens")
        mm = await pg.evaluate("document.documentElement.scrollHeight")
        rep.check(mm <= vp["height"], f"{name}: {label} sheet does not scroll the page")
        sp = await pg.evaluate("window.__BOOK_APP__.sheetPager()")
        if sp and sp["count"] > 1:
            await pg.keyboard.press("ArrowRight"); await wait_settle(pg)
            sp2 = await pg.evaluate("window.__BOOK_APP__.sheetPager()")
            rep.check(sp2["index"] == 1, f"{name}: {label} sheet flips its own pages")
        await pg.keyboard.press("Escape"); await wait_settle(pg, 250)
        n2 = await pg.evaluate("document.querySelectorAll('.sheet-layer').length")
        rep.check(n2 == 0, f"{name}: {label} sheet closes with Escape")
        return ok

    await pg.keyboard.press("End"); await wait_settle(pg)
    await sheet_open("[data-open=excerpts]", "excerpts")
    await sheet_open("[data-open=notes]", "science notes")
    await pg.keyboard.press("Home"); await wait_settle(pg)
    await sheet_open(".ch-cover [data-open=thesis]", "chapter thesis")
    await sheet_open(".ch-cover [data-open=figure]", "interactive figure")
    await sheet_open("[data-open=sections]", "section list")
    # a glossary term on any visible page
    await pg.goto(URL + "#/read/essay-1/0")
    await pg.reload()
    await wait_settle(pg, 400)
    for _ in range(8):
        vis = await pg.evaluate("(() => { const v = document.querySelector('.view .pager-viewport').getBoundingClientRect(); return [...document.querySelectorAll('.inline-term[data-term-id]')].some(t => { const r = t.getBoundingClientRect(); return r.left >= v.left && r.right <= v.right; }); })()")
        if vis:
            break
        await pg.keyboard.press("ArrowRight"); await wait_settle(pg)
    await sheet_open(".inline-term[data-term-id]", "glossary term")

    # --- atlas: each tab is its own paginated view ----------------------------
    tab_pages = {}
    await pg.goto(URL + "#/atlas/lexicon")
    await wait_settle(pg, 400)
    for tab in ["lexicon", "scorecard", "thinkers", "timeline"]:
        await pg.click(f".atlas-tab[href='#/atlas/{tab}']")
        await wait_settle(pg, 400)
        active = await pg.evaluate("document.querySelector('.atlas-tab.is-active').getAttribute('href')")
        rep.check(active == f"#/atlas/{tab}", f"{name}: atlas tab {tab} opens")
        m = await pg.evaluate(LAYOUT_PROBE)
        rep.check(m["docScrollH"] <= m["innerH"], f"{name}: atlas {tab} does not scroll")
        rep.check(not m["clippedY"], f"{name}: atlas {tab} clipped: {m['clippedY']}")
        p = await pager(pg)
        tab_pages[tab] = p["count"]
        if p["count"] > 1:
            await pg.keyboard.press("ArrowRight"); await wait_settle(pg)
            p2 = await pager(pg)
            rep.check(p2["index"] == 1, f"{name}: atlas {tab} flips")
        if tab != "timeline":
            await sheet_open(".atlas-card[data-card]", f"atlas {tab} card")
    st["atlas_pages"] = tab_pages

    # search filters
    await pg.fill("#atlas-search-box", "1905")
    await wait_settle(pg, 300)
    n = await pg.evaluate("document.querySelectorAll('.atlas-card').length")
    rep.check(n >= 1, f"{name}: atlas search returns results")

    # --- progress view -------------------------------------------------------
    await pg.goto(URL + "#/me")
    await wait_settle(pg, 400)
    m = await pg.evaluate(LAYOUT_PROBE)
    rep.check(m["docScrollH"] <= m["innerH"], f"{name}: progress view does not scroll")
    rep.check(not m["clippedY"], f"{name}: progress view clipped: {m['clippedY']}")

    # --- accessibility basics --------------------------------------------------
    for h in ["#/", "#/read/essay-2/1", "#/atlas/thinkers", "#/me"]:
        await pg.goto(URL + h)
        await wait_settle(pg, 300)
        unnamed = await pg.evaluate(UNNAMED)
        rep.check(not unnamed, f"{name}: unnamed controls on {h}: {unnamed[:3]}")

    rep.check(not errors, f"{name}: console/page errors: {errors[:5]}")
    st["console_errors"] = len(errors)
    await ctx.close()


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chromium", default=os.environ.get("CHROMIUM_PATH"), help="path to a Chromium binary (optional)")
    ap.add_argument("--only", choices=[v[0] for v in VIEWPORTS], help="run a single viewport")
    args = ap.parse_args()
    rep = Report()
    async with async_playwright() as p:
        kw = {"args": ["--no-sandbox"]}
        if args.chromium:
            kw["executable_path"] = args.chromium
        browser = await p.chromium.launch(**kw)
        for name, vp, mobile in VIEWPORTS:
            if args.only and name != args.only:
                continue
            await run_viewport(browser, name, vp, mobile, rep)
            print(f"[{name}] done: {rep.passed} passed, {len(rep.failed)} failed so far", flush=True)
        await browser.close()

    print(json.dumps(rep.stats, ensure_ascii=False, indent=2))
    print(f"\nPASSED {rep.passed} checks, FAILED {len(rep.failed)}")
    for f in rep.failed:
        print("  ✗ " + f)
    sys.exit(1 if rep.failed else 0)


if __name__ == "__main__":
    asyncio.run(main())
