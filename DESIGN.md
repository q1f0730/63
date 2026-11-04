# DESIGN.md — 《性学三论》互动网页书 · Atelier Monolith（分页阅读版）

本文件描述**当前实际发布的设计**（`css/styles.css` + `js/app.js`）。旧版文档里的「Archival Ivory」暖纸色、深色主题、三栏布局、阅读模式切换与全局搜索均**未实现**，已删除。

## 1. 视觉身份：Google Stitch「Atelier Monolith」

纯白学术画廊：白画布、墨黑字、1px 细线、无阴影、无圆角（唯一例外是首页的篇章圆点胶囊）。不使用任何图片素材——仓库里没有 `assets/` 目录，数据里也不再引用图片。

### 色板（`:root` 变量）
| 变量 | 值 | 用途 |
|---|---|---|
| `--surface` | `#FFFFFF` | 画布、卡片 |
| `--surface-low` | `#F5F5F6` | 引文 / 开篇一问 / 原论面板底色 |
| `--surface-mid` | `#EFEFF1` | 悬停、已证伪徽章底色 |
| `--hairline` | `#E4E4E7` | 1px 分割线、卡片边框、书脊线 |
| `--hairline-subtle` | `#F1F1F3` | 列表内部细线 |
| `--hairline-strong` | `#D4D4D8` | 未读圆点、引文左线 |
| `--ink` | `#09090B` | 标题、强调、主按钮底色、焦点框 |
| `--ink-body` | `#18181B` | 正文 |
| `--ink-secondary` | `#52525B` | 次级文字 |
| `--ink-muted` | `#63636B` | 元信息（比 Stitch 原值 `#71717A` 略深，保证白底对比度 ≥ 5.5:1） |
| `--ink-faint` | `#A1A1AA` | 已开始圆点、修正徽章边框 |

只有这一套浅色主题。

### 字体
- 衬线（标题、引文、德文原题）：`Newsreader, Songti SC, STSong, Noto Serif SC, Source Han Serif SC, SimSun, Georgia, serif`
- 无衬线（正文、界面）：`Inter, -apple-system, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif`
- 等宽（页码、编号、出处）：`JetBrains Mono, Cascadia Mono, SFMono-Regular, Consolas, monospace`
- 均为系统字体栈，不加载网络字体。

### 字号
- 正文 `--read-base`：手机 17px、电脑 18px，行高 1.86；「Aa」/ A−A+ 在 −2…+2px 五档间调整（`--fs-adj`）。
- 篇名 34px（电脑 42px）；节标题 25px（电脑 29px）；首页书名 44–64px（电脑 96–112px）。

## 2. 结构：每个功能一屏，正文按屏分页

### 路由（hash，`file://` 可用）
| 地址 | 视图 |
|---|---|
| `#/` | **读书**：一屏讲清这是什么 + 继续阅读卡片 + 七篇圆点 |
| `#/read/<篇id>/<节序号>` | **阅读器** |
| `#/atlas/<lexicon\|scorecard\|thinkers\|timeline>` | **图谱**四个分栏，各自分页 |
| `#/me` | **进度**：全书目录 + 每篇已读节数 + 设置（字号、白噪音、清空进度） |

导航只有「读书 / 图谱 / 进度」三项：手机在底部标签栏，电脑在顶栏右侧。阅读器里隐藏标签栏，换成「返回 · 篇名/节名 · 本篇目录 · Aa」顶栏和翻页底栏。

### 分页器（`Pager`，`js/app.js`）
- 一节正文放进一个 CSS 多栏容器（`column-fill: auto`，高度 = 一屏可用高度），每屏一页（手机 1 栏，≥1000px 两栏书页展开，中间 1px 书脊线），用 `transform` 横向平移翻页。
- 页数用末尾哨兵元素的位置计算；窗口尺寸变化或字号变化后按当前位置比例重新分页。
- 翻页方式：触屏滑动（跟手）、`← → PageUp PageDown 空格 Home End`、点页面左右 30% 区域、底栏按钮、鼠标滚轮（一次手势翻一页）。翻过最后一页进入下一节，往回翻到上一节最后一页。
- 每节流：第 1 节前有**篇封面页**（篇名、德文原题、题记、「本篇要点」「互动模型」按钮）和**开篇一问**页；每节最后一页是**节末页**（原典摘录 / 科学与考据入口 + 黑色「下一节」卡片）。
- 防断行：标题 `break-after: avoid`，列表条目和表格行 `break-inside: avoid`，段落 `orphans/widows: 2`；内容块不使用 `overflow:auto/hidden`（否则无法跨页断开）。

### 抽屉（Sheet）
原典摘录、科学与考据、本篇要点 + 版本考据、互动模型、本篇目录、词条释义、裁决 / 人物详情，都在独立抽屉中打开：手机从底部升起占满屏，电脑停靠在右侧（560px，互动模型 780px）。抽屉内容同样用分页器翻页（互动模型例外，保持为可操作的单页）。`Esc` 关闭，焦点回到触发按钮。

### 进度
- `am_progress_v2`：每篇已读完（翻到最后一页）的节。
- `am_last_v2`：上次位置 `{篇, 节, 页位置比例}`，首页「继续阅读」用它。
- `am_font_step`、`am_intuition_picked` 保存字号和开篇一问的选择。

## 3. 响应式
- `< 600px`：底栏按钮只显示箭头。
- `max-height: 720px`：首页隐藏「怎么读」提示条，缩小篇名与题记。
- `≥ 900px`：顶栏导航替代底部标签栏；首页改为左右两栏（左书名与说明，右续读卡片 + 带篇名的七篇列表）；图谱分栏显示全称、搜索框并排；抽屉改为右侧停靠。
- `≥ 1000px`：阅读器两页展开；图谱 ≥1100px 三栏、≥700px 两栏；进度页 ≥900px 两栏。

## 4. 无障碍
- 所有键盘焦点用 2px 墨黑 `:focus-visible` 轮廓；鼠标 / 触屏点击不显示。
- 图标按钮都有中文 `aria-label`；页码 `aria-live="polite"`；抽屉 `role="dialog" aria-modal="true"`；图谱分栏 `role="tablist"`；正文里的词条是真正的 `<button>`。
- `prefers-reduced-motion: reduce` 时关闭翻页滑动、抽屉动画和跟手拖动。
