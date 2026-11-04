# DESIGN.md — 《性学三论》数字典藏交互网页书 (Vienna 1905 × Guomai Minimalist Editorial)

## 1. Visual Philosophy & Aesthetic Direction
Inspired by the original Guomai Classic cover (`cover.jpeg` — warm archival paper, bronze-sepia serif typography, minimalist botanical dual-contour ink line art) fused with **Fin-de-siècle Vienna 1905** scholarly elegance (Berggasse 19 study, Viennese Secession geometry, Criterion/Stripe Press digital book craftsmanship).

The interface must feel like **an intimate, luminous museum-grade interactive monograph**, never a generic SaaS dashboard:
- **Generous archival paper breathing room**, hairline rules (`1px solid rgba(140, 102, 74, 0.22)`), drop caps, marginalia side-notes, and tactile book-like transitions.
- **Dual-Layer Reading Clarity**: Effortlessly distinguishes between **现代精简导读 (Distilled Modern Reading)**, **弗洛伊德德译原典摘录 (Original Verbatim Excerpts & Footnotes)**, and **百年网络深研扩展 (Deep Web Research: Modern Science Verdict, Vienna 1905 Context, Thinker Debates, Clinical Cases)**.

## 2. Color Palette (Light "Archival Ivory" Default + "Berggasse Midnight" Dark Theme)

### Archival Ivory (Default)
- **Canvas Background (`--bg-paper`)**: `#F6F3EC` (Warm museum rag paper)
- **Elevated Page / Card Surface (`--bg-surface`)**: `#FCFBF8`
- **Subtle Tinted Callout Surface (`--bg-subtle`)**: `#EFECE3`
- **Primary Ink (`--ink-primary`)**: `#1F1C1A` (Deep Viennese charcoal ink)
- **Secondary Ink (`--ink-secondary`)**: `#57504A` (Warm slate sepia)
- **Muted / Marginalia Ink (`--ink-muted`)**: `#8A8077`
- **Brand Accent — Guomai Bronze (`--accent-bronze`)**: `#8C664A` (From book cover title)
- **Psychoanalytic Crimson / Eros Accent (`--accent-crimson`)**: `#7A2E2E` (Berggasse Persian rug crimson)
- **Modern Science Verdict Sage (`--accent-sage`)**: `#2F5D50` (Empirical verification / neuroscience)
- **Historical & Debate Ochre (`--accent-ochre`)**: `#9A6B2F` (1905–1924 palimpsest & philosophical debates)
- **Border Hairline (`--border-hairline`)**: `rgba(140, 102, 74, 0.20)`

### Berggasse Midnight (Dark Mode)
- **Canvas Background**: `#151312`
- **Elevated Surface**: `#1E1B19`
- **Subtle Surface**: `#272320`
- **Primary Ink**: `#EDE8DF`
- **Secondary Ink**: `#B5ACA0`
- **Guomai Bronze**: `#C89B7B`
- **Eros Crimson**: `#C96A6A`
- **Science Sage**: `#6CA896`

## 3. Typography System
- **Chinese Editorial Serif (Headings, Book Titles, Verbatim Quotes)**: `'Noto Serif SC'`, `'Source Han Serif SC'`, `'Songti SC'`, `STSong`, serif
- **Chinese Modern Clean Reading (Simplified Prose, UI Controls, Science Cards)**: `'Noto Sans SC'`, `'PingFang SC'`, `'Microsoft YaHei'`, sans-serif
- **Western / German Classical Serif (Sigmund Freud, German Terms like *Trieb*, *Libido*, *Sexualziel*, Roman Numerals)**: `'Cormorant Garamond'`, `'Playfair Display'`, `'EB Garamond'`, Georgia, serif
- **Monospace Metadata / Edition Years / Citations**: `'JetBrains Mono'`, monospace
- **Type Scale**:
  - Hero Book Title: `44px–56px`, letter-spacing `0.14em`, weight `600`
  - Chapter Title: `32px–38px`, line-height `1.3`
  - Section Heading: `22px–25px`, weight `600`
  - Reading Body: `17.5px` (adjustable `15px–21px`), line-height `1.9`, max-width `68ch`

## 4. Core Layout & Interactive Book Architecture
1. **Top Archival Ribbon Bar**:
   - Book crest + current Part/Chapter breadcrumb + Reading Progress Hairline Bar
   - **3 Reading Mode Switcher**: `精简畅读 (Distilled)` | `原典+深研全览 (Enriched Dual-Layer)` | `沉浸书页 (Focus)`
   - Global Search (`Ctrl+K`), Concept Glossary Drawer trigger, Theme & Typography adjuster (`A- / A+`, Ivory / Sepia / Midnight).
2. **Three-Column Scholarly Layout (Desktop)**:
   - **Left Wing (260px, collapsible)**: Structured Book TOC (8 Sections across Frontmatter, *Three Essays*, *Practice: Love & Morality*, Appendix), Chapter completion indicators, Quick Jump to Interactive Labs.
   - **Center Book Leaf (Max 760px)**:
     - Chapter Hero Banner (German original title, publication/revision years, 1-minute Executive Thesis Card, Key Takeaways, Reading Time).
     - Section-by-section **Simplified & Restructured Narrative** (clear logic, digestible sub-points, visual comparison tables & inline SVG diagrams).
     - Toggleable / Embedded **「弗洛伊德原典精摘 & 译注」** blockquotes with bronze left rule.
   - **Right Marginalia / Deep-Research Rail (340px, sticky & interactive)**:
     - Contextually synced cards or tabbed drawers for each chapter:
       - 🔬 **当代科学审视 (Modern Science Verdict)**: Badge (`已证实 Confirmed` / `部分修正 Revised` / `已证伪 Debunked`) + neuroscience/sexology evidence.
       - 🏛️ **维也纳 1905 历史现场 (Historical & Edition Palimpsest)**: 1905–1924 revisions & cultural backdrop.
       - ⚔️ **思想交锋 (Thinker Dialogues)**: Jung, Adler, Horney, Beauvoir, Lacan, Foucault, Perel.
       - 📋 **临床个案连线 (Clinical Case Files)**: Dora, Little Hans, Rat Man, Leonardo.
3. **Dedicated Interactive Exploration Views (Top-Level Tabs)**:
   - 📖 **全书精读 (The Enriched Book)** — Full 8-part interactive dual-layer reader
   - 🧪 **心智与力比多实验室 (Interactive Labs)** — Interactive visualizers:
     1. *Object vs Aim Matrix (性对象 × 性目标解构矩阵)*
     2. *Libido Hydraulic & Sublimation Simulator (力比多河流：压抑、症状与升华交互模型)*
     3. *Psychosexual Stages & Modern Developmental Comparison (口唇-肛门-潜伏-青春期隧道模型 vs 现代依恋/神经科学)*
     4. *Sacred vs Profane Love Split Explorer (圣爱与欲爱分裂与整合诊断器)*
   - 🕸️ **概念星图与思想交锋 (Concept Atlas & Thinker Debates)** — Filterable German-Chinese-English glossary + 8 thinkers' critiques of Freud
   - ⏳ **百年双轨年表 (1856–2025 Dual Timeline)** — Freud's life & 6 editions of *Three Essays* alongside modern sexology & neuroscience milestones