// Global Book Data Registry (works seamlessly on file:// and http://)
window.BOOK_DATA = {
  meta: {
    title: "性学三论",
    subtitle: "无删节德文汉译本 · 百年科学深研与现代精简交互网页书",
    germanTitle: "Drei Abhandlungen zur Sexualtheorie",
    author: "西格蒙德·弗洛伊德 (Sigmund Freud)",
    translator: "徐胤（德文直译）",
    introAuthor: "李银河（导读）",
    publisher: "浙江文艺出版社 · 果麦经典 (1905首发 / 1924定本 / 2015汉译)",
    coverImage: "assets/images/cover.jpeg",
    signatureImage: "assets/images/li_yinhe_signature.jpg"
  },
  chapters: [],
  glossary: [],
  thinkers: [],
  timeline: [],
  scienceScorecard: [],
  registerChapters: function(list) {
    if (Array.isArray(list)) {
      this.chapters.push(...list);
    }
  },
  appendSections: function(chapterId, list) {
    var ch = this.chapters.find(function(c) { return c.id === chapterId; });
    if (ch && Array.isArray(list)) {
      ch.sections.push.apply(ch.sections, list);
    }
  },
  registerGlossary: function(list) {
    if (Array.isArray(list)) {
      this.glossary.push(...list);
    }
  },
  registerThinkers: function(list) {
    if (Array.isArray(list)) {
      this.thinkers.push(...list);
    }
  },
  registerTimeline: function(list) {
    if (Array.isArray(list)) {
      this.timeline.push(...list);
    }
  },
  registerScienceScorecard: function(list) {
    if (Array.isArray(list)) {
      this.scienceScorecard.push(...list);
    }
  }
};
