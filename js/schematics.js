// Atelier Monolith — Interactive SVG Schematics, Chapter Intuition Thresholds & Ambient Audio
// Pure White (#FFFFFF) · Crisp Monochrome Vectors (#09090B) · Zero Cartoon Gimmicks

window.MonolithAudio = (function () {
  let ctx = null;
  let gainNode = null;
  let running = false;

  function ensureGraph() {
    if (ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    // Synthesize warm brownian study rain / Berggasse 19 room tone
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 1.8;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;

    gainNode = ctx.createGain();
    gainNode.gain.value = 0.0;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
  }

  function toggle() {
    try {
      ensureGraph();
      if (!ctx || !gainNode) {
        running = !running;
        return running;
      }
      if (ctx.state === "suspended") ctx.resume();
      running = !running;
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setTargetAtTime(running ? 0.045 : 0.0, now, 0.35);
      return running;
    } catch (_) {
      running = !running;
      return running;
    }
  }

  return {
    toggle,
    isOn: () => running
  };
})();

window.MonolithSchematics = (function () {
  // =========================================================================
  // 7 Chapter Opening Intuition Thresholds (序幕叩问 // STEP IN)
  // =========================================================================
  const THRESHOLDS = {
    "intro-li": {
      code: "HYPOTHESIS v0.0",
      prompt: "翻开一部诞生于 120 年前、部分具体结论已被现代实验室推翻的经典著作，你认为今天重读《性学三论》最大的价值在于什么？",
      options: [
        {
          code: "[ 01 ] 将其奉为字字无误的心理诊疗圣经",
          sub: "沿用百年前的原始术语解释当代一切心理困惑与两性关系。",
          reveal: "李银河在导读中明确提醒：切忌盲目崇拜。弗洛伊德关于“单一性病因论”“阴茎嫉妒”及“阴道高潮更成熟”的假说带有鲜明的维多利亚父权烙印，早已被现代医学证伪——看清大厦的阴影，恰恰是为了看清地基的伟岸。"
        },
        {
          code: "[ 02 ] 见证“把性从罪恶审判解放为科学连续谱”的破冰时刻",
          sub: "像审视哥伦布航海图一样，区分其开创性的问题意识与时代局限。",
          reveal: "这正是李银河倡导的现代重读姿态：弗洛伊德第一次拆毁了“常态与变态”之间的道德高墙，提出了全身快感区、普遍双性潜质与艺术升华论。整座现代性学与精神动力学大厦，正是在他开辟的地基上拔地而起的。"
        }
      ]
    },
    "preface-1920": {
      code: "HYPOTHESIS v0.1",
      prompt: "1920 年的欧洲知识界出现了一个奇特现象：学者们欣然接受了弗洛伊德的“潜意识”与“内心冲突”，唯独一提到“性驱力（力比多）”便群起攻之。你认为根源何在？",
      options: [
        {
          code: "[ 01 ] 纯粹的学术分歧：早期临床样本缺乏统计学严谨性",
          sub: "批评者仅从实证科学方法论出发，质疑性学假说的边界。",
          reveal: "科学方法确有演进空间，但弗洛伊德敏锐戳穿了一个双标现场：半个世纪前哲学家叔本华写下“性冲动决定人类追求”时，同一批学者奉若神明；一旦精神分析在活人身上坐实它，人们便集体失忆——这背后是深层的心理阻抗。"
        },
        {
          code: "[ 02 ] 人类自恋的防御本能：理性自我不愿承认受制于原始驱力",
          sub: "继哥白尼、达尔文之后，人类难以承受“自我并非心灵主人”的第三记重击。",
          reveal: "直击要害。在 1920 年第四版序言中，弗洛伊德指出：人们指责他“泛性论”，实则是意识压抑防线的本能反扑。他拓展后的“性（力比多）”，本就与柏拉图《会饮篇》中促成万物联结的爱欲（Eros）同源。"
        }
      ]
    },
    "essay-1": {
      code: "HYPOTHESIS v1.0",
      prompt: "在 1905 年以前，医学界普遍将人类的性冲动视为一把出厂焊死的钥匙与锁孔——如果是你，在翻开精神分析的切片前，会如何解释偏离常规的爱欲？",
      options: [
        {
          code: "[ 01 ] 先天神经退化或器质性脑结构畸变",
          sub: "19 世纪克拉夫特-埃宾学派主流视点：视偏离常态者为遗传衰败（Degeneration）的病患。",
          reveal: "弗洛伊德用事实击碎了这一偏见：若退化论成立，便无法解释为何古希腊鼎盛文明普遍接纳同性爱，更无法解释为何无数智识卓绝、心智健全的人同样拥有非典型偏好。“神经退化”只是披着白大褂的道德审判。"
        },
        {
          code: "[ 02 ] 普遍潜伏于每个人生命内部的原始分力重组",
          sub: "精神分析视角：性对象与性目的并非天生焊死，常态与变态只是光谱与固着程度的差异。",
          reveal: "准确触及了第一篇的革命核心。弗洛伊德果断将“性对象”与“性目的”解耦：所谓正常性生活，不过是诸多局部冲动经筛选整合后的结果；唯有当某种局部偏好“彻底排他”且“僵化固着”时，才越过临床边界。"
        }
      ]
    },
    "essay-2": {
      code: "HYPOTHESIS v2.0",
      prompt: "几乎没有成年人能清晰记得自己 3 岁以前发生的事，而婴儿又常表现出执着地吮吸拇指、探索身体的行为。你会如何理解这片被遗忘的童年地带？",
      options: [
        {
          code: "[ 01 ] 童年如白纸般纯洁无欲，早期记忆只是因大脑未发育而自然消散",
          sub: "传统育儿常识：性冲动直到十几岁青春期才随激素第一次凭空降临。",
          reveal: "现代神经科学证实：婴儿海马体高速神经元新生确实会改写早期记忆突触（Josselyn & Frankland, 2014），但弗洛伊德率先打破了“无欲童年”神话——超声波甚至已观测到胎儿与婴儿早期的自发生理唤起与感官探索。"
        },
        {
          code: "[ 02 ] 幼年已存在广泛的感官快感探索，并在潜伏期筑起了羞耻与道德堤坝",
          sub: "早期经验并未真正消失，而是在潜意识深处塑造了成年后的亲密底色。",
          reveal: "这正是第二篇最石破天惊的洞见。弗洛伊德揭示了从口唇、肛门到生殖器期的快感演化，以及人类独有的“潜伏期”如何将早期能量转化为羞耻感、审美与文化创造力。"
        }
      ]
    },
    "essay-3": {
      code: "HYPOTHESIS v3.0",
      prompt: "进入青春期后，童年分散在口唇、凝视、皮肤抚触上的种种快感是如何与成年亲密关系衔接的？",
      options: [
        {
          code: "[ 01 ] 童年感官习惯被彻底清除，由全新的生殖本能取而代之",
          sub: "旧系统推倒重来，前戏与最终满足只是同一生理反射的不同强度。",
          reveal: "心理演化从不轻易废弃旧零件。弗洛伊德精妙指出：童年的局部快感并未消失，而是转型为成年亲密中的“前期快感（Vorlust）”——亲吻、凝视与拥抱搭起兴奋之桥，这与现代脑科学区分多巴胺“渴望（Wanting）”与阿片肽“享乐（Liking）”惊人吻合。"
        },
        {
          code: "[ 02 ] 局部快感被收编为“前期快感”，而受阻的能量可改道升华为创造力",
          sub: "新统帅整合旧部属，同时在家庭温情与外部伴侣之间完成心理断乳。",
          reveal: "精准把握了第三篇的主线。但同样在本篇中，弗洛伊德提出了著名的误判——要求女性从“阴蒂快感”向“阴道快感”转移。1998 年泌尿外科专家 Helen O'Connell 通过盆腔 MRI 解剖证实两者实为同一阴蒂-尿道-阴道复合体，为百年争论画上了科学句号。"
        }
      ]
    },
    "love-psychology": {
      code: "HYPOTHESIS v4.0",
      prompt: "临床中常遇到一种悖论：有的人面对深爱敬重的伴侣时拘谨冷淡，面对毫无感情牵绊的对象却欲望汹涌。为什么“深爱”反而会熄灭“情欲”？",
      options: [
        {
          code: "[ 01 ] 单纯的审美疲劳：时间久了多巴胺自然耗竭",
          sub: "新鲜感消退是唯一的生物学原因，与童年依恋心理无关。",
          reveal: "审美疲劳只能解释日久生厌，却无法解释为何许多人在热恋伊始便对心目中的“纯洁女神”丧失性能力。弗洛伊德发现了更幽微的结构：温情流（源于童年照料者）与肉欲流（青春期涌现）未能在同一个人身上安全汇合。"
        },
        {
          code: "[ 02 ] “温情流”与“肉欲流”发生撕裂：高洁的伴侣无意间触发了潜意识乱伦禁忌",
          sub: "把爱人捧上神坛的同时，潜意识将肉体欲望视作对神圣客体的亵渎。",
          reveal: "一语中的。这便是弗洛伊德命名的“心理性阳痿 / 圣女-妓女分裂”：他们恋爱之处无性欲，性欲之处无恋爱。当代伴侣治疗大师 Esther Perel 进一步拓展了这一洞察——健康的现代亲密关系，正是在安全港湾与无羞耻情欲张力之间重建桥梁。"
        }
      ]
    },
    "cultural-morality": {
      code: "HYPOTHESIS v5.0",
      prompt: "1908 年，社会学家将现代人普遍的焦虑与神经衰弱归咎于“火车提速、电报电话与商业竞争”。如果你站在维也纳街头，会赞同这一诊断吗？",
      options: [
        {
          code: "[ 01 ] 赞同：现代科技与城市节奏超出了人类神经系统的负荷极限",
          sub: "外部信息过载与职场高压本身就足以直接制造全部现代神经症。",
          reveal: "弗洛伊德反驳道：快节奏与竞争固然消耗体力，却无法解释为何神经症症状总是围绕亲密冲突呈现高度规律性。外部压力只是压垮骆驼的稻草，真正被掏空的内因，是严苛虚伪的“文化性道德”截断了生命力的正常出口。"
        },
        {
          code: "[ 02 ] 存疑：当社会用一刀切的严苛禁欲要求所有人，升华之外必有巨大心理代价",
          sub: "过度压抑不仅催生双重道德谎言，甚至连带扼杀了人的独立求知勇气。",
          reveal: "这正是弗洛伊德最具社会批判锋芒的论断。他在本篇中直言：升华固然造就文明，但强求人人彻底禁欲无异于竭泽而渔；尤其当年轻人在性议题上被长期禁止思考时，这种“思维抑制”便会蔓延终生，削弱其独立批判的智识勇气。"
        }
      ]
    }
  };

  // =========================================================================
  // 7 Bespoke Atelier Monolith Interactive SVG Schematics (FIG. 00 - FIG. 06)
  // =========================================================================

  // FIG. 00: 李银河导读 — 百年性学大厦地基与阴影透视仪
  function mountEdificeLens(container) {
    const pillars = [
      { code: "P1", name: "对象与目的解耦", status: "confirmed", h: 120 },
      { code: "P2", name: "同性爱去病理化", status: "confirmed", h: 125 },
      { code: "P3", name: "全身快感区可塑性", status: "confirmed", h: 112 },
      { code: "P4", name: "力比多升华机制", status: "revised", h: 105 },
      { code: "P5", name: "单一性病因独尊论", status: "debunked", h: 95 },
      { code: "P6", name: "阳具嫉羡/高潮转移", status: "debunked", h: 90 }
    ];

    container.innerHTML = `
      <div class="schematic-module">
        <div class="schematic-head">
          <div>
            <span class="meta-label">FIG. 00 // 历史坐标透视模型</span>
            <h3 class="schematic-title">性学大厦 · 奠基石柱与时代阴影审视仪</h3>
          </div>
          <span class="brand-year">1905 ORIGINAL ↔ 2024 AUDIT</span>
        </div>

        <div class="schematic-viewport">
          <svg viewBox="0 0 560 185" style="width:100%;max-width:560px;height:185px" id="edificeSvg"></svg>
          <div class="schematic-readout-corner">LENS EPOCH: <span id="edificeYear">2024</span></div>
        </div>

        <div class="schematic-controls">
          <div class="sch-control-row">
            <div class="sch-control-top">
              <span class="sch-control-label">SLIDER · 科学史审视焦距 (Historical Audit Lens)</span>
              <span class="sch-control-val" id="edificeLabel">2024 现代实证透视 (100%)</span>
            </div>
            <input type="range" id="edificeSlider" min="0" max="100" step="5" value="100" />
            <div class="sch-ticks">
              <span>◀ 1905 原典初建全貌</span>
              <span>1973 去病理化转折</span>
              <span>2024 现代脑科学去伪存真 ▶</span>
            </div>
          </div>
        </div>

        <div class="schematic-synthesis">
          <div class="synthesis-head">
            <span>结构审视结论 // STRUCTURAL AUDIT</span>
            <span class="square-obsidian"></span>
          </div>
          <p class="synthesis-body" id="edificeSynthesis"></p>
        </div>
      </div>
    `;

    const svg = container.querySelector("#edificeSvg");
    const slider = container.querySelector("#edificeSlider");
    const labelEl = container.querySelector("#edificeLabel");
    const yearEl = container.querySelector("#edificeYear");
    const synEl = container.querySelector("#edificeSynthesis");

    function update() {
      const t = Number(slider.value) / 100; // 0 = 1905, 1 = 2024
      const yr = Math.round(1905 + t * 119);
      yearEl.textContent = String(yr);
      labelEl.textContent =
        t < 0.25
          ? `${yr} 维也纳原典初建态`
          : t < 0.75
          ? `${yr} 临床与实证检验期`
          : `${yr} 现代跨学科定评态`;

      let barsHtml = `
        <line x1="24" y1="152" x2="536" y2="152" stroke="#09090B" stroke-width="1.5" />
        <line x1="24" y1="26" x2="536" y2="26" stroke="#E4E4E7" stroke-dasharray="3,3" stroke-width="1" />
      `;
      pillars.forEach((p, i) => {
        const x = 44 + i * 82;
        const isDebunked = p.status === "debunked";
        const isRevised = p.status === "revised";
        const curH = isDebunked ? Math.round(p.h * (1 - t * 0.72)) : p.h;
        const y = 152 - curH;
        const fill = isDebunked && t > 0.45 ? "none" : isRevised && t > 0.45 ? "#D4D4D8" : "#09090B";
        const stroke = isDebunked && t > 0.45 ? "#A1A1AA" : "#09090B";
        const dash = isDebunked && t > 0.45 ? 'stroke-dasharray="3,3"' : "";
        barsHtml += `
          <rect x="${x}" y="${y}" width="44" height="${curH}" fill="${fill}" stroke="${stroke}" stroke-width="1" ${dash} />
          <text x="${x + 22}" y="168" text-anchor="middle" font-family="monospace" font-size="10" fill="#09090B">${p.code}</text>
          <text x="${x + 22}" y="${y - 6}" text-anchor="middle" font-family="sans-serif" font-size="9.5" fill="#52525B">${p.name.slice(0, 5)}</text>
        `;
      });
      svg.innerHTML = barsHtml;

      if (t < 0.3) {
        synEl.textContent =
          "1905 原典视界：弗洛伊德以一己之力搭建起六根理论支柱。在当时保守医学界看来，所有论断均惊世骇俗，尚未经受现代解剖学与神经影像的逐一甄别。";
      } else if (t < 0.75) {
        synEl.textContent =
          "20 世纪中叶检验期：金赛报告（1948）、马斯特斯实验室（1966）与 APA 去病理化决议（1973）相继登场——前四根核心承重柱愈发坚固，而后两根父权时代脚手架开始松动。";
      } else {
        synEl.textContent =
          "2024 现代审视结论：P1-P3（对象解耦、同性自然连续谱、快感区可塑性）获遗传学与脑成像全面确证；P4（升华）修正为前额叶调控模型；P5-P6（唯性病因论、阳具嫉羡与高潮转移说）已被实证剥离。大厦主体依然巍然屹立。";
      }
    }

    slider.addEventListener("input", update);
    update();
  }

  // FIG. 01: 1920原版序 — 人类自恋三次去中心化与阻抗模型
  function mountNarcissismOrbit(container) {
    const stages = [
      {
        year: "1543 · 宇宙学去中心",
        thinker: "哥白尼 (Copernicus)",
        radius: 72,
        offset: 0,
        resistance: "38%",
        desc: "第一重打击：地球从宇宙绝对中心退居为绕日运行的普通行星。神学震怒，但人类尚可退守“万物之灵”的生物学优越感。"
      },
      {
        year: "1859 · 生物学去中心",
        thinker: "达尔文 (Darwin)",
        radius: 50,
        offset: 42,
        resistance: "68%",
        desc: "第二重打击：《物种起源》证明人类并非与动物割裂的特权造物，体内同样流淌着古老的演化驱力。"
      },
      {
        year: "1905 · 心理学去中心",
        thinker: "弗洛伊德 (Freud)",
        radius: 26,
        offset: 92,
        resistance: "96%",
        desc: "第三重终极打击：《性学三论》揭示意识自我连“自己心灵房屋的主人”都不是，潜意识与力比多在幕后深刻塑造着理性与道德——由此引爆全社会最激烈的情感阻抗。"
      }
    ];

    let idx = 2;
    container.innerHTML = `
      <div class="schematic-module">
        <div class="schematic-head">
          <div>
            <span class="meta-label">FIG. 01 // 思想史阻抗拓扑</span>
            <h3 class="schematic-title">人类自恋的三次去中心化位移</h3>
          </div>
          <div class="sch-mode-btns" id="orbitBtns">
            <button class="sch-mode-btn" data-idx="0">1543 哥白尼</button>
            <button class="sch-mode-btn" data-idx="1">1859 达尔文</button>
            <button class="sch-mode-btn is-active" data-idx="2">1905 弗洛伊德</button>
          </div>
        </div>

        <div class="schematic-viewport">
          <svg viewBox="0 0 540 180" style="width:100%;max-width:540px;height:180px" id="orbitSvg"></svg>
          <div class="schematic-readout-corner">RESISTANCE INDEX: <span id="orbitRes">96%</span></div>
        </div>

        <div class="schematic-synthesis">
          <div class="synthesis-head">
            <span id="orbitMeta">1905 · 心理学去中心 // 弗洛伊德</span>
            <span class="square-obsidian"></span>
          </div>
          <p class="synthesis-body" id="orbitDesc"></p>
        </div>
      </div>
    `;

    const svg = container.querySelector("#orbitSvg");
    const resEl = container.querySelector("#orbitRes");
    const metaEl = container.querySelector("#orbitMeta");
    const descEl = container.querySelector("#orbitDesc");

    function render() {
      const s = stages[idx];
      resEl.textContent = s.resistance;
      metaEl.textContent = `${s.year} // ${s.thinker}`;
      descEl.textContent = s.desc;

      const egoX = 270 + s.offset;
      svg.innerHTML = `
        <line x1="40" y1="90" x2="500" y2="90" stroke="#E4E4E7" stroke-dasharray="3,3" />
        <line x1="270" y1="16" x2="270" y2="164" stroke="#E4E4E7" stroke-dasharray="3,3" />
        <circle cx="270" cy="90" r="72" fill="none" stroke="#D4D4D8" stroke-dasharray="2,3" />
        <circle cx="270" cy="90" r="46" fill="none" stroke="#E4E4E7" />
        <circle cx="270" cy="90" r="4" fill="#09090B" />
        <text x="270" y="15" text-anchor="middle" font-family="monospace" font-size="10" fill="#71717A">REALITY / UNCONSCIOUS CENTER</text>
        <line x1="270" y1="90" x2="${egoX}" y2="90" stroke="#09090B" stroke-width="1.5" />
        <circle cx="${egoX}" cy="90" r="${s.radius * 0.35}" fill="#FFFFFF" stroke="#09090B" stroke-width="2" />
        <text x="${egoX}" y="132" text-anchor="middle" font-family="monospace" font-size="10.5" fill="#09090B">EGO [人类傲慢自恋坐标]</text>
      `;
    }

    container.querySelectorAll("#orbitBtns .sch-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        idx = Number(btn.dataset.idx);
        container.querySelectorAll("#orbitBtns .sch-mode-btn").forEach((b, i) => {
          b.classList.toggle("is-active", i === idx);
        });
        render();
      });
    });
    render();
  }

  // FIG. 02: 第一篇《性变态》 — Stitch Screen 2 Verbatim Dual-Axis Vector Lab!
  function mountAberrationsPrism(container) {
    container.innerHTML = `
      <div class="schematic-module">
        <div class="schematic-head">
          <div>
            <span class="meta-label">FIG. 02 // 互动模型</span>
            <h3 class="schematic-title">欲望棱镜 · 性对象与固着阈值双轴解耦实验台</h3>
          </div>
          <span class="brand-year">AXIS A &amp; B INTERACTIVE LAB</span>
        </div>

        <div class="schematic-viewport">
          <svg viewBox="0 0 540 180" style="width:100%;max-width:540px;height:180px">
            <line x1="40" y1="90" x2="500" y2="90" stroke="#E4E4E7" stroke-dasharray="3,3" stroke-width="1" />
            <line x1="270" y1="20" x2="270" y2="160" stroke="#E4E4E7" stroke-dasharray="3,3" stroke-width="1" />
            <text x="40" y="80" fill="#71717A" font-family="monospace" font-size="10">同性极 [HOMO]</text>
            <text x="270" y="80" text-anchor="middle" fill="#71717A" font-family="monospace" font-size="10">双性潜能 [BI]</text>
            <text x="500" y="80" text-anchor="end" fill="#71717A" font-family="monospace" font-size="10">异性极 [HETERO]</text>
            <circle cx="270" cy="90" r="3" fill="#09090B" />
            <line id="pVectorLine" x1="270" y1="90" x2="270" y2="90" stroke="#09090B" stroke-width="2" />
            <ellipse id="pResonance" cx="270" cy="90" rx="26" ry="16" fill="none" stroke="#09090B" stroke-dasharray="2,2" opacity="0.45" />
            <circle id="pTargetNode" cx="270" cy="90" r="6" fill="#09090B" stroke="#FFFFFF" stroke-width="2" />
          </svg>
          <div class="schematic-readout-corner">Vector: (<span id="pCoordX">0.00</span>, <span id="pCoordY">0.50</span>)</div>
        </div>

        <div class="schematic-controls">
          <div class="sch-control-row">
            <div class="sch-control-top">
              <span class="sch-control-label">SLIDER A · 性对象极性谱 (Sexual Object Continuum)</span>
              <span class="sch-control-val" id="pObjVal">双性流动基底 (0.00)</span>
            </div>
            <input type="range" id="pSliderObj" min="-1" max="1" step="0.05" value="0" />
            <div class="sch-ticks">
              <span>◀ 同性极向 (Inversion)</span>
              <span>原始双性原型</span>
              <span>异性极向 (Norm) ▶</span>
            </div>
          </div>

          <div class="sch-control-row">
            <div class="sch-control-top">
              <span class="sch-control-label">SLIDER B · 固着与排他阈值 (Fixation &amp; Exclusivity Index)</span>
              <span class="sch-control-val" id="pFixVal">中度流动 (0.50)</span>
            </div>
            <input type="range" id="pSliderFix" min="0.1" max="1.0" step="0.05" value="0.5" />
            <div class="sch-ticks">
              <span>偶发/流动光谱 (Healthy Plasticity)</span>
              <span>排他独占固着 (Clinical Fixation)</span>
            </div>
          </div>
        </div>

        <div class="schematic-synthesis">
          <div class="synthesis-head">
            <span>精神分析拓扑状态报告 // ANALYTIC SYNTHESIS</span>
            <span class="square-obsidian"></span>
          </div>
          <p class="synthesis-body" id="pSynthesis"></p>
        </div>
      </div>
    `;

    const sObj = container.querySelector("#pSliderObj");
    const sFix = container.querySelector("#pSliderFix");

    function update() {
      const obj = parseFloat(sObj.value);
      const fix = parseFloat(sFix.value);

      container.querySelector("#pObjVal").textContent =
        obj < -0.3 ? `同性极向偏斜 (${obj.toFixed(2)})` : obj > 0.3 ? `异性极向偏斜 (${obj.toFixed(2)})` : `双性流动基底 (${obj.toFixed(2)})`;
      container.querySelector("#pFixVal").textContent =
        fix < 0.35 ? `偶发/高可塑态 (${fix.toFixed(2)})` : fix > 0.72 ? `排他独占固着 (${fix.toFixed(2)})` : `中度流动 (${fix.toFixed(2)})`;

      const tx = 270 + obj * 200;
      const ty = 90 - (fix - 0.5) * 84;

      container.querySelector("#pCoordX").textContent = obj.toFixed(2);
      container.querySelector("#pCoordY").textContent = fix.toFixed(2);

      const node = container.querySelector("#pTargetNode");
      const line = container.querySelector("#pVectorLine");
      const res = container.querySelector("#pResonance");

      node.setAttribute("cx", tx);
      node.setAttribute("cy", ty);
      line.setAttribute("x2", tx);
      line.setAttribute("y2", ty);
      res.setAttribute("cx", tx);
      res.setAttribute("cy", ty);
      res.setAttribute("rx", Math.max(7, (1.12 - fix) * 46));
      res.setAttribute("ry", Math.max(7, (1.12 - fix) * 26));

      const syn = container.querySelector("#pSynthesis");
      if (Math.abs(obj) <= 0.25) {
        syn.textContent =
          fix > 0.72
            ? "状态：两栖性反转（Amphigenic）。个体对两性客体均保持强烈吸引，印证弗洛伊德提出的“普遍双性潜质（Bisexualität）”基底；现代金赛量表（Kinsey 3）与表观遗传学亦确证其属于自然多样性。"
            : "状态：原初未分化连续谱。力比多尚未被社会规训压缩至单一轨道，保留高度探索弹性——这正是弗洛伊德拆解“钥匙焊死锁孔”神话的起点。";
      } else if (obj < -0.25) {
        syn.textContent =
          fix > 0.72
            ? "状态：稳定同性取向（Absolute Inversion）。弗洛伊德在 1905/1915 年长注中明确拒绝将其定性为“退化或疾病”；1973 年 APA 与 2019 年《Science》47 万人基因组研究彻底确证其为人类自然连续谱。"
            : "状态：境遇/流动型同性吸引。性冲动与常规生殖目标解耦，同时保留跨客体流动性，驳斥了非黑即白的粗陋先天机械论。";
      } else {
        syn.textContent =
          fix > 0.72
            ? "状态：高度排他固着。弗洛伊德反讽地指出：“连人类为什么会只爱异性，本身也不是天经地义的，而是无数局部冲动遭受压抑与收窄后的产物”；若局部信物彻底取代活人并引发痛苦，方构成现代 DSM-5 定义的偏好障碍。"
            : "状态：常态亲密延伸光谱。迷恋爱人的围巾、凝视或轻度施受张力皆作为“前期快感”融入鲜活关系，完全属于健康人性的一部分。";
      }
    }

    sObj.addEventListener("input", update);
    sFix.addEventListener("input", update);
    update();
  }

  // FIG. 03: 第二篇《幼儿期性欲》 — 1958 哈洛恒河猴接触安慰遥测模型
  function mountHarlowTelemetry(container) {
    let stressOn = false;
    container.innerHTML = `
      <div class="schematic-module">
        <div class="schematic-head">
          <div>
            <span class="meta-label">FIG. 03 // 依附假说实证对照</span>
            <h3 class="schematic-title">1958 哈洛双母体实验 · 进食依附 vs 接触安慰</h3>
          </div>
          <div class="sch-mode-btns" id="harlowSwitch">
            <button class="sch-mode-btn is-active" data-stress="off">常态观察 (24H)</button>
            <button class="sch-mode-btn" data-stress="on">施加恐惧刺激 (STRESS)</button>
          </div>
        </div>

        <div class="schematic-viewport">
          <svg viewBox="0 0 540 175" style="width:100%;max-width:540px;height:175px" id="harlowSvg"></svg>
          <div class="schematic-readout-corner">PROTOCOL: HARLOW (1958) / BOWLBY</div>
        </div>

        <div class="schematic-synthesis">
          <div class="synthesis-head">
            <span>实验对照判读 // EMPIRICAL CORRECTION</span>
            <span class="square-obsidian"></span>
          </div>
          <p class="synthesis-body" id="harlowSyn"></p>
        </div>
      </div>
    `;

    const svg = container.querySelector("#harlowSvg");
    const syn = container.querySelector("#harlowSyn");

    function render() {
      const wireW = stressOn ? 8 : 28;
      const clothW = stressOn ? 320 : 295;
      svg.innerHTML = `
        <text x="36" y="54" font-family="monospace" font-size="11" fill="#52525B">WIRE MOTHER [铁丝供奶母体]</text>
        <rect x="36" y="64" width="340" height="18" fill="#FFFFFF" stroke="#E4E4E7" />
        <rect x="36" y="64" width="${wireW}" height="18" fill="#A1A1AA" />
        <text x="388" y="77" font-family="monospace" font-size="11" fill="#52525B">${stressOn ? "0.0 h (逃离)" : "0.8 h / day (仅进食)"}</text>

        <text x="36" y="118" font-family="monospace" font-size="11" fill="#09090B">CLOTH MOTHER [温暖绒布无奶母体]</text>
        <rect x="36" y="128" width="340" height="18" fill="#FFFFFF" stroke="#09090B" />
        <rect x="36" y="128" width="${clothW}" height="18" fill="#09090B" />
        <text x="388" y="141" font-family="monospace" font-size="11" fill="#09090B">${stressOn ? "100% 紧抱安全基地" : "17.2 h / day (依偎)"}</text>
      `;

      syn.textContent = stressOn
        ? "突发惊吓状态：当机械咆哮怪兽进入实验舱，幼猴从不奔向提供奶水的铁丝母体，而是 100% 扑向温暖柔软的绒布母体获取安全调节——鲍尔比（Bowlby）据此确立现代依恋理论：安全依恋是独立演化出的原初本能，而非进食快感的附属副产品。"
        : "日常 24 小时遥测：弗洛伊德原以为婴儿对母亲的爱最初“依附（Anlehnung）”于吃奶饱腹；然而哈洛实验测得幼猴每天仅花不到 1 小时在铁丝奶瓶母体上吸奶，却花逾 17 小时紧贴无奶的绒布母体——修正了早期精神分析的营养依附假说。";
    }

    container.querySelectorAll("#harlowSwitch .sch-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        stressOn = btn.dataset.stress === "on";
        container.querySelectorAll("#harlowSwitch .sch-mode-btn").forEach((b) => {
          b.classList.toggle("is-active", (b.dataset.stress === "on") === stressOn);
        });
        render();
      });
    });
    render();
  }

  // FIG. 04: 第三篇《青春期的改变》 — 水力拓扑与升华分流流场
  function mountLibidoHydraulics(container) {
    container.innerHTML = `
      <div class="schematic-module">
        <div class="schematic-head">
          <div>
            <span class="meta-label">FIG. 04 // 能量动力学模型</span>
            <h3 class="schematic-title">力比多水力分流 · 压抑阻尼与升华河道</h3>
          </div>
          <span class="brand-year">FLOW CONSERVATION LAB</span>
        </div>

        <div class="schematic-viewport">
          <svg viewBox="0 0 540 180" style="width:100%;max-width:540px;height:180px" id="hydroSvg"></svg>
          <div class="schematic-readout-corner">SUBLIMATION: <span id="hydroSubPct">0%</span> / NEUROSIS: <span id="hydroNeuroPct">0%</span></div>
        </div>

        <div class="schematic-controls">
          <div class="sch-control-row">
            <div class="sch-control-top">
              <span class="sch-control-label">SLIDER A · 严苛道德压抑闸门 (Repression Gate)</span>
              <span class="sch-control-val" id="hydroGateVal">65%</span>
            </div>
            <input type="range" id="hydroGate" min="15" max="95" step="5" value="65" />
          </div>

          <div class="sch-control-row">
            <div class="sch-control-top">
              <span class="sch-control-label">SLIDER B · 审美与求知升华导流力 (Sublimation Capacity)</span>
              <span class="sch-control-val" id="hydroCapVal">55%</span>
            </div>
            <input type="range" id="hydroCap" min="10" max="95" step="5" value="55" />
          </div>
        </div>

        <div class="schematic-synthesis">
          <div class="synthesis-head">
            <span>动力学平衡诊断 // DYNAMIC EQUILIBRIUM</span>
            <span class="square-obsidian"></span>
          </div>
          <p class="synthesis-body" id="hydroSyn"></p>
        </div>
      </div>
    `;

    const gIn = container.querySelector("#hydroGate");
    const cIn = container.querySelector("#hydroCap");
    const svg = container.querySelector("#hydroSvg");

    function update() {
      const gate = Number(gIn.value);
      const cap = Number(cIn.value);
      container.querySelector("#hydroGateVal").textContent = gate + "%";
      container.querySelector("#hydroCapVal").textContent = cap + "%";

      const direct = Math.max(5, Math.round((100 - gate) * 0.85));
      const blocked = 100 - direct;
      const sublimated = Math.min(blocked - 3, Math.round(blocked * (cap / 105)));
      const neurotic = Math.max(3, 100 - direct - sublimated);

      container.querySelector("#hydroSubPct").textContent = sublimated + "%";
      container.querySelector("#hydroNeuroPct").textContent = neurotic + "%";

      const w1 = Math.max(1.5, direct * 0.16);
      const w2 = Math.max(1.5, sublimated * 0.18);
      const w3 = Math.max(1.5, neurotic * 0.18);

      svg.innerHTML = `
        <path d="M 30 90 L 180 90" stroke="#09090B" stroke-width="12" fill="none" />
        <line x1="185" y1="30" x2="185" y2="150" stroke="#09090B" stroke-width="1.5" stroke-dasharray="3,3" />
        <path d="M 185 90 C 280 90, 310 38, 430 38" stroke="#09090B" stroke-width="${w2}" fill="none" />
        <path d="M 185 90 C 280 90, 310 90, 430 90" stroke="#71717A" stroke-width="${w1}" fill="none" />
        <path d="M 185 90 C 280 90, 310 142, 430 142" stroke="#09090B" stroke-dasharray="4,3" stroke-width="${w3}" fill="none" />

        <text x="32" y="72" font-family="monospace" font-size="10" fill="#09090B">LIBIDO INFLOW [100%]</text>
        <text x="438" y="42" font-family="monospace" font-size="10.5" fill="#09090B">升华创造 ${sublimated}%</text>
        <text x="438" y="94" font-family="monospace" font-size="10.5" fill="#71717A">亲密表达 ${direct}%</text>
        <text x="438" y="146" font-family="monospace" font-size="10.5" fill="#52525B">症状回流 ${neurotic}%</text>
      `;

      const syn = container.querySelector("#hydroSyn");
      if (neurotic >= 40) {
        syn.textContent =
          "高压淤积预警：道德闸门严密封堵，而升华渠道不足以承接剩余能量。受阻的力比多被迫沿退行通道倒灌，以强迫观念、躯体转换或莫名焦虑（神经症症状）的形式寻求代偿宣泄。";
      } else if (sublimated >= 45) {
        syn.textContent =
          "建设性升华态（Sublimierung）：原始局部冲动经前额叶认知重评改道汇入求知欲、艺术审美与公共创造，同时保留适度而坦诚的现实亲密出口——这正是弗洛伊德眼中健康的文化动力结构。";
      } else {
        syn.textContent =
          "自然疏导态：较低的外部羞耻压制使大部分情感与情欲得以在成年伴侣关系中顺畅流动，心理防御损耗极低。";
      }
    }

    gIn.addEventListener("input", update);
    cIn.addEventListener("input", update);
    update();
  }

  // FIG. 05: 爱情心理学 — 温情流与肉欲流双波相位干涉仪
  function mountLoveInterference(container) {
    container.innerHTML = `
      <div class="schematic-module">
        <div class="schematic-head">
          <div>
            <span class="meta-label">FIG. 05 // 关系动力学示波器</span>
            <h3 class="schematic-title">温情流与肉欲流 · 相位分裂与汇合模型</h3>
          </div>
          <span class="brand-year">AFFECTION × SENSUALITY PHASE</span>
        </div>

        <div class="schematic-viewport">
          <svg viewBox="0 0 540 175" style="width:100%;max-width:540px;height:175px" id="waveSvg"></svg>
          <div class="schematic-readout-corner">PHASE SHIFT: <span id="wavePhaseLabel">180° SPLIT</span></div>
        </div>

        <div class="schematic-controls">
          <div class="sch-control-row">
            <div class="sch-control-top">
              <span class="sch-control-label">SLIDER · 潜意识禁忌隔离度 (Madonna–Whore Split Index)</span>
              <span class="sch-control-val" id="waveVal">0.80 (圣妓分裂态)</span>
            </div>
            <input type="range" id="waveSlider" min="0" max="1" step="0.05" value="0.8" />
            <div class="sch-ticks">
              <span>◀ 0.00 双流同相共振 (成熟整合之爱)</span>
              <span>1.00 彻底反相撕裂 (深爱处无欲) ▶</span>
            </div>
          </div>
        </div>

        <div class="schematic-synthesis">
          <div class="synthesis-head">
            <span>临床关系拓扑 // RELATIONAL TOPOLOGY</span>
            <span class="square-obsidian"></span>
          </div>
          <p class="synthesis-body" id="waveSyn"></p>
        </div>
      </div>
    `;

    const sl = container.querySelector("#waveSlider");
    const svg = container.querySelector("#waveSvg");

    function buildWavePath(phaseOffset, amp, yCenter) {
      let d = "";
      for (let x = 30; x <= 510; x += 6) {
        const rad = ((x - 30) / 480) * Math.PI * 4 + phaseOffset;
        const y = yCenter + Math.sin(rad) * amp;
        d += (x === 30 ? "M " : " L ") + x + " " + y.toFixed(1);
      }
      return d;
    }

    function update() {
      const split = parseFloat(sl.value);
      const phase = split * Math.PI;
      const deg = Math.round(split * 180);

      container.querySelector("#wavePhaseLabel").textContent = `${deg}° ${split < 0.25 ? "COHERENT" : "SPLIT"}`;
      container.querySelector("#waveVal").textContent =
        split < 0.25 ? `${split.toFixed(2)} (双流汇合)` : split > 0.65 ? `${split.toFixed(2)} (圣妓撕裂态)` : `${split.toFixed(2)} (部分阻隔)`;

      const p1 = buildWavePath(0, 36, 88);
      const p2 = buildWavePath(phase, 36, 88);

      svg.innerHTML = `
        <line x1="30" y1="88" x2="510" y2="88" stroke="#E4E4E7" stroke-dasharray="3,3" />
        <path d="${p1}" fill="none" stroke="#09090B" stroke-width="2" />
        <path d="${p2}" fill="none" stroke="#71717A" stroke-width="1.75" stroke-dasharray="4,3" />
        <text x="34" y="26" font-family="monospace" font-size="10" fill="#09090B">—— 温情流 (Zärtlichkeit · 敬重与依恋)</text>
        <text x="290" y="26" font-family="monospace" font-size="10" fill="#71717A">--- 肉欲流 (Sinnlichkeit · 感官激情)</text>
      `;

      const syn = container.querySelector("#waveSyn");
      if (split > 0.65) {
        syn.textContent =
          "反相撕裂态（“凡是他们恋爱之处皆无性欲，性欲之处皆无恋爱”）：因未能跨越童年依恋意象的潜意识羞耻屏障，个体将高洁敬重的伴侣等同于不可亵渎的圣像，唯有在贬低客体时才能释放肉欲。";
      } else if (split < 0.25) {
        syn.textContent =
          "同相共振态（完全正常的爱情态度）：卸除对身体欲望的污名化防卫后，温柔深沉的人格敬重与炽热坦荡的感官渴望指向同一个真实伴侣，达成弗洛伊德与现代伴侣治疗共同指向的成熟亲密整合。";
      } else {
        syn.textContent =
          "过渡磨合态：伴侣间具备深厚安全感，但过度熟悉与“亲人化”削弱了部分情欲张力。保留适度独立边界与去羞耻沟通可进一步收窄相位差。";
      }
    }

    sl.addEventListener("input", update);
    update();
  }

  // FIG. 06: 文化的性道德 — 社会规训刻度与心智活力相图
  function mountCivilizationPhase(container) {
    container.innerHTML = `
      <div class="schematic-module">
        <div class="schematic-head">
          <div>
            <span class="meta-label">FIG. 06 // 文明代价相图</span>
            <h3 class="schematic-title">文化性道德严苛刻度 vs 社会秩序与心智活力</h3>
          </div>
          <span class="brand-year">1908 CULTURAL CRITIQUE</span>
        </div>

        <div class="schematic-viewport">
          <svg viewBox="0 0 540 180" style="width:100%;max-width:540px;height:180px" id="civSvg"></svg>
          <div class="schematic-readout-corner">OPTIMAL ZONE: 42%–58%</div>
        </div>

        <div class="schematic-controls">
          <div class="sch-control-row">
            <div class="sch-control-top">
              <span class="sch-control-label">SLIDER · 社会性道德规训刻度 (Cultural Restriction Index)</span>
              <span class="sch-control-val" id="civDialVal">88% (维多利亚绝对禁欲期)</span>
            </div>
            <input type="range" id="civSlider" min="10" max="96" step="2" value="88" />
            <div class="sch-ticks">
              <span>◀ 第一阶：原初自由态</span>
              <span>现代知情同意均衡带</span>
              <span>第三阶：唯合法生育高压期 ▶</span>
            </div>
          </div>
        </div>

        <div class="schematic-synthesis">
          <div class="synthesis-head">
            <span>社会病理学评估 // SOCIOLOGICAL DIAGNOSIS</span>
            <span class="square-obsidian"></span>
          </div>
          <p class="synthesis-body" id="civSyn"></p>
        </div>
      </div>
    `;

    const sl = container.querySelector("#civSlider");
    const svg = container.querySelector("#civSvg");

    function calcMetrics(v) {
      const order = v < 35 ? Math.round(32 + v * 1.25) : Math.min(90, Math.round(74 + (100 - Math.abs(v - 54)) * 0.16));
      const vitality =
        v > 62
          ? Math.max(16, Math.round(96 - (v - 44) * 1.42))
          : v < 26
          ? Math.round(54 + v * 0.9)
          : Math.min(90, Math.round(88 - Math.abs(v - 48) * 0.55));
      return { order, vitality };
    }

    function update() {
      const v = Number(sl.value);
      const { order, vitality } = calcMetrics(v);

      container.querySelector("#civDialVal").textContent =
        v > 72 ? `${v}% (严苛禁欲与双重道德期)` : v >= 40 && v <= 60 ? `${v}% (理性契约与活力均衡带)` : `${v}% (低约束过渡带)`;

      let orderPath = "";
      let vitPath = "";
      for (let k = 10; k <= 96; k += 4) {
        const x = 40 + ((k - 10) / 86) * 460;
        const m = calcMetrics(k);
        const yo = 156 - m.order * 1.25;
        const yv = 156 - m.vitality * 1.25;
        orderPath += (k === 10 ? "M " : " L ") + x.toFixed(1) + " " + yo.toFixed(1);
        vitPath += (k === 10 ? "M " : " L ") + x.toFixed(1) + " " + yv.toFixed(1);
      }

      const cx = 40 + ((v - 10) / 86) * 460;
      const cyO = 156 - order * 1.25;
      const cyV = 156 - vitality * 1.25;

      svg.innerHTML = `
        <rect x="${40 + (30 / 86) * 460}" y="22" width="${(20 / 86) * 460}" height="134" fill="#EAEAEF" opacity="0.55" />
        <line x1="40" y1="156" x2="500" y2="156" stroke="#09090B" stroke-width="1" />
        <path d="${vitPath}" fill="none" stroke="#09090B" stroke-width="2" />
        <path d="${orderPath}" fill="none" stroke="#71717A" stroke-width="1.5" stroke-dasharray="4,3" />
        <line x1="${cx}" y1="22" x2="${cx}" y2="156" stroke="#09090B" stroke-width="1" />
        <circle cx="${cx}" cy="${cyV}" r="5" fill="#09090B" stroke="#FFFFFF" stroke-width="1.5" />
        <circle cx="${cx}" cy="${cyO}" r="4" fill="#71717A" />
        <text x="44" y="20" font-family="monospace" font-size="10" fill="#09090B">—— 国民心智与创造活力 (${vitality}%)</text>
        <text x="280" y="20" font-family="monospace" font-size="10" fill="#71717A">--- 社会协作秩序 (${order}%)</text>
      `;

      const syn = container.querySelector("#civSyn");
      if (v > 70) {
        syn.textContent =
          "过度压抑亏损区（马尔库塞后称“额外压抑”）：当社会将一切非生育性满足打入地狱，表面维持了体面秩序，实则批量制造婚内冷淡、双重道德伪善、神经症蔓延，甚至因早期性好奇被禁绝而连带挫伤了国民的独立思考力。";
      } else if (v >= 40 && v <= 60) {
        syn.textContent =
          "现代理性均衡带：以平等尊重与知情同意守护社会协作边界，同时解除对自然情感与身体愉悦的无端羞耻审判——社会秩序与个体生命创造力在此区间同步达到峰值。";
      } else {
        syn.textContent =
          "低规训散漫区：缺乏基本的延迟满足与契约边界，文化升华动力减弱。弗洛伊德并非主张废除一切文明约束，而是呼吁卸除那些“得不偿失的虚伪高压”。";
      }
    }

    sl.addEventListener("input", update);
    update();
  }

  const SCHEMATIC_MAP = {
    "intro-li": mountEdificeLens,
    "preface-1920": mountNarcissismOrbit,
    "essay-1": mountAberrationsPrism,
    "essay-2": mountHarlowTelemetry,
    "essay-3": mountLibidoHydraulics,
    "love-psychology": mountLoveInterference,
    "cultural-morality": mountCivilizationPhase
  };

  function mountSchematic(container, chapterId) {
    if (!container) return;
    const fn = SCHEMATIC_MAP[chapterId] || mountAberrationsPrism;
    fn(container);
  }

  return {
    THRESHOLDS,
    mountSchematic
  };
})();
