#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build standalone single-file HTML for offline reading.
Bundles index.html + css/styles.css + data/book_init.js + data/modules/*.js + js/schematics.js + js/app.js.
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))

def main():
    css_path = os.path.join(ROOT, "css", "styles.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()

    js_parts = []
    # 1. book_init.js
    init_path = os.path.join(ROOT, "data", "book_init.js")
    with open(init_path, "r", encoding="utf-8") as f:
        js_parts.append(f.read())

    # 2. modules in order
    mod_dir = os.path.join(ROOT, "data", "modules")
    mod_files = sorted([f for f in os.listdir(mod_dir) if f.endswith(".js")])
    for mf in mod_files:
        with open(os.path.join(mod_dir, mf), "r", encoding="utf-8") as f:
            js_parts.append(f.read())

    # 3. schematics.js
    with open(os.path.join(ROOT, "js", "schematics.js"), "r", encoding="utf-8") as f:
        js_parts.append(f.read())

    # 4. app.js
    with open(os.path.join(ROOT, "js", "app.js"), "r", encoding="utf-8") as f:
        js_parts.append(f.read())

    all_js = "\n\n".join(js_parts)

    single_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#FFFFFF" />
  <title>性学三论 — Sigmund Freud (1905) · 现代精简与跨学科重读</title>
  <meta name="description" content="弗洛伊德《性学三论》（徐胤德文直译本·李银河导读）纯白极简互动网页书：分页翻读的现代精简导读、原典摘录、内嵌交互模型与 120 年科学实证对照。" />
  <style>
{css_content}
  </style>
</head>
<body>
  <div class="scroll-progress-line" id="scroll-progress-line" aria-hidden="true"></div>
  <div id="monolith-app"></div>
  <div id="sheet-root"></div>
  <noscript><p style="padding:24px;font-family:sans-serif">本网页书需要启用 JavaScript。</p></noscript>
  <script>
{all_js}
  </script>
</body>
</html>
"""
    out_path = os.path.join(ROOT, "性学三论_单文件直开版.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(single_html)
    print(f"[OK] Single-file bundle generated at {out_path} ({len(single_html.encode('utf-8'))} bytes)")

if __name__ == "__main__":
    main()
