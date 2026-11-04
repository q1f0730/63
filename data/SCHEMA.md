# Unified Data Schema Specification (`window.BOOK_DATA`)

All data files in `e:\sex\data\` attach their payload onto `window.BOOK_DATA = window.BOOK_DATA || {};` using plain UTF-8 JavaScript (NO ES module `import`/`export`, so `index.html` works both via direct `file:///` double-click and via HTTP server!).

## Chapter Object Structure
Each chapter in `window.BOOK_DATA.chapters` (array or keyed registration via `window.BOOK_DATA.registerChapters([...])`) MUST follow this exact schema:

```js
{
  id: "essay-1", // Unique slug: "intro-li", "preface-1920", "essay-1", "essay-2", "essay-3", "love-psychology", "cultural-morality"
  numberLabel: "第一篇", // e.g., "导读", "原版序", "第一篇", "第二篇", "第三篇", "实践篇·上", "实践篇·下"
  category: "core-essays", // "frontmatter" | "core-essays" | "practice"
  title: "每个人都有点“性变态”",
  germanTitle: "Die sexuellen Abirrungen",
  englishTitle: "The Sexual Aberrations",
  year: "1905首发 · 1924定本",
  readingMinutes: 12,
  heroImage: "assets/images/ch1_aberrations.png", // Assigned per chapter
  epigraph: {
    quote: "从精神分析的角度来看，哪怕最乖张的性变态里，也藏着一段人性的心理重塑过程。",
    source: "西格蒙德·弗洛伊德《性学三论》第一篇"
  },
  coreThesis: "一句话/一段话核心主旨（120-200字，极度清晰好懂地概括本章颠覆了什么常识、提出了什么核心框架）。",
  keyTakeaways: [
    { title: "打破常识一", summary: "简明扼要的要点说明（50-90字）" },
    // 3 to 5 key takeaways
  ],
  editionEvolution: [
    { year: "1905 初版", note: "该章在1905年初版中的核心面貌..." },
    { year: "1915 三版增补", note: "弗洛伊德后来增补了什么关键概念或脚注..." }
  ],
  sections: [
    {
      id: "e1-s1",
      title: "1. 拆解常识：性对象与性目标的分离",
      subtitle: "为什么说“男女自然相吸”只是一个诗意的童话？",
      simplifiedContent: [
        // Array of rich structured content blocks in clear, vivid, simplified modern Chinese!
        // Each item can be:
        // { type: "paragraph", text: "..." }  (supports **bold** and `term` highlights)
        // { type: "AnalogyCard", title: "通俗比喻：...", text: "..." }
        // { type: "ComparisonTable", headers: ["维度", "传统常识", "弗洛伊德的拆解"], rows: [[...], [...]] }
        // { type: "KeyPoints", title: "核心拆解", items: [{ label: "...", detail: "..." }] }
        // { type: "ProcessSteps", title: "心理机制推演", steps: [{ step: "01", title: "...", desc: "..." }] }
      ],
      originalExcerpts: [
        {
          quote: "流行的性冲动理论，简直像充满诗意的童话那样完美：全人类被分割成了男人和女人两部分，两者在爱中寻求结合，直到再次融为一体……",
          context: "徐胤德文直译本 · 第一篇第1节《性对象的变异》",
          footnote: "可选：弗洛伊德极具价值的原注精粹（如1910年关于古希腊人与现代人情欲差异的著名长注！）"
        }
      ],
      marginalia: [
        {
          type: "science", // "science" | "history" | "debate" | "case" | "culture"
          verdict: "部分证实 · 概念重塑", // Optional badge for "science": "已证实" | "部分修正" | "已证伪" | "范式先驱"
          title: "当代性学回响：从金赛量表到去病理化",
          body: "基于真实深度网络搜索的详实扩展内容（200-350字），包含具体学者、年份、实验或历史事实...",
          sourceRef: "Alfred Kinsey (1948); APA DSM-II (1973); 弗洛伊德1935年《致一位美国母亲的信》"
        }
      ]
    }
  ],
  chapterSummaryDiagram: {
    title: "本章思想结构图",
    nodes: [
      { id: "n1", label: "核心起点", detail: "..." }
    ]
  }
}
```


## Additional Global Data Collections (in `part3_love_morality_atlas.js`)

### 1. `window.BOOK_DATA.registerGlossary([...])`
```js
{
  id: "libido",
  term: "力比多 / 原欲",
  german: "Libido",
  english: "Libido / Sexual Drive Energy",
  category: "核心动力", // "核心动力" | "发展阶段" | "防御与转化" | "爱情与客体" | "文化与临床"
  chapterId: "essay-1",
  shortDef: "一句话简明定义（40-70字）",
  freudView: "弗洛伊德在书中的完整界定与演变（100-160字）",
  modernView: "当代心理学/神经科学的对应理解或修正（80-140字）"
}
```

### 2. `window.BOOK_DATA.registerThinkers([...])`
```js
{
  id: "foucault",
  name: "米歇尔·福柯",
  originalName: "Michel Foucault",
  era: "1926–1984 · 法国哲学与思想史家",
  work: "《性经验史》(Histoire de la sexualité, 1976)",
  stance: "批判与重构", // "批判与决裂" | "实证修正" | "女性主义重审" | "哲学深化" | "当代印证"
  coreChallenge: "他对弗洛伊德《性学三论》及压抑假说的核心回应与交锋（150-240字）",
  quote: "代表性论断或核心思想凝练",
  relatedChapterId: "cultural-morality"
}
```

### 3. `window.BOOK_DATA.registerScienceScorecard([...])`
```js
{
  id: "sc-1",
  claim: "弗洛伊德原书论断标题（如：人类天生的双性潜质与性倾向连续谱）",
  chapterId: "essay-1",
  verdict: "confirmed", // "confirmed" (先见之明/高度印证) | "revised" (部分深刻/机制重构) | "debunked" (已被证伪/时代局限)
  verdictLabel: "先见之明 · 现代印证",
  freudSummary: "弗洛伊德在书中的原始主张（60-100字）",
  modernEvidence: "现代神经科学、性学实验室或发展心理学的具体证据（120-200字，含研究者与年份）"
}
```

### 4. `window.BOOK_DATA.registerTimeline([...])`
```js
{
  year: "1905",
  age: "49岁",
  track: "milestone", // "life" (生平轨迹) | "edition" (《性学三论》版本演进) | "world" (世界性学与科学回响)
  title: "《性学三论》初版问世 · 精神分析黄金之年",
  description: "详实生动的历史细节（80-150字）",
  highlight: true // boolean
}
```