/* PAPS: 반별 체력 측정 기록(NEIS 입력 양식 순서) · 종목 설정 · 기준표 · 엑셀 업로드 */
(function () {
  const PE = window.PE, React = window.React, h = PE.h, cn = PE.cn, I = PE.I;
  const { useState, useMemo, useRef } = React;

  /* 체력요소별로 고를 수 있는 종목 (초등) */
  const ITEMS = {
    "왕복오래달리기": { unit: "회" }, "오래달리기걷기": { unit: "초", low: true }, "스텝검사": { unit: "지수" },
    "앉아윗몸앞으로굽히기": { unit: "cm" }, "종합유연성": { unit: "점" },
    "윗몸말아올리기": { unit: "회" }, "악력": { unit: "kg" },
    "50m달리기": { unit: "초", low: true }, "제자리멀리뛰기": { unit: "cm" },
    "체질량지수": { unit: "kg/m²" },
  };
  const LABEL = { "왕복오래달리기": "왕복오래달리기", "오래달리기걷기": "오래달리기-걷기", "스텝검사": "스텝검사", "앉아윗몸앞으로굽히기": "앉아윗몸앞으로굽히기", "종합유연성": "종합유연성", "윗몸말아올리기": "윗몸말아올리기", "악력": "악력", "50m달리기": "50m 달리기", "제자리멀리뛰기": "제자리멀리뛰기", "체질량지수": "체질량지수(BMI)" };
  const ELEMENTS = [
    { key: "cardio", name: "심폐지구력", options: ["왕복오래달리기", "오래달리기걷기", "스텝검사"] },
    { key: "flex", name: "유연성", options: ["앉아윗몸앞으로굽히기", "종합유연성"] },
    { key: "strength", name: "근력·근지구력", options: ["악력", "윗몸말아올리기"] },
    { key: "power", name: "순발력", options: ["제자리멀리뛰기", "50m달리기"] },
  ];
  const BMI = "체질량지수";

  /* NEIS 입력 칸: 종목마다 차수(1·2차)·좌우 */
  const one = (item) => [{ k: item, name: LABEL[item], sub: "" }];
  const two = (item) => [{ k: item + "|1", name: LABEL[item], sub: "1차" }, { k: item + "|2", name: LABEL[item], sub: "2차" }];
  const FIELDS = {
    "왕복오래달리기": one("왕복오래달리기"), "오래달리기걷기": one("오래달리기걷기"), "스텝검사": one("스텝검사"),
    "앉아윗몸앞으로굽히기": two("앉아윗몸앞으로굽히기"), "종합유연성": one("종합유연성"),
    "윗몸말아올리기": one("윗몸말아올리기"),
    "악력": [{ k: "악력|R1", name: "악력", sub: "1차 오른쪽" }, { k: "악력|L1", name: "악력", sub: "1차 왼쪽" }, { k: "악력|R2", name: "악력", sub: "2차 오른쪽" }, { k: "악력|L2", name: "악력", sub: "2차 왼쪽" }],
    "50m달리기": two("50m달리기"), "제자리멀리뛰기": two("제자리멀리뛰기"),
  };
  const fieldLabel = (f) => f.name + (f.sub ? " " + f.sub : "");

  /* 여러 번 잰 기록에서 평가에 쓰는 값 */
  const nums = (rec, ks) => ks.map((k) => rec[k]).filter((v) => typeof v === "number" && Number.isFinite(v));
  function bestOf(item, rec) {
    const f = FIELDS[item];
    if (f.length === 1) { const v = rec[f[0].k]; return typeof v === "number" ? v : null; }
    if (item === "악력") { const r = nums(rec, ["악력|R1", "악력|R2"]), l = nums(rec, ["악력|L1", "악력|L2"]); const sides = [r, l].filter((a) => a.length).map((a) => Math.max(...a)); return sides.length ? Math.round((sides.reduce((a, b) => a + b, 0) / sides.length) * 10) / 10 : null; }
    const a = nums(rec, f.map((x) => x.k)); if (!a.length) return null;
    return ITEMS[item].low ? Math.min(...a) : Math.max(...a);
  }

  /* 기준표에서 값에 맞는 칸 찾기 (소수 자리 사이 틈은 가장 가까운 아래 칸으로) */
  function lookup(item, sex, grade, v) {
    const list = ((PE.PAPS_STANDARDS[sex] || {})[String(grade)] || {})[item];
    if (!list || v == null || !Number.isFinite(v)) return null;
    let best = null;
    for (const r of list) if (r[2] <= v && (!best || r[2] > best[2])) best = r;
    if (!best) best = list.reduce((a, r) => (r[2] < a[2] ? r : a), list[0]);
    return { level: best[0], score: best[1] };
  }
  const bmiOf = (rec) => { const hh = Number(rec.height), ww = Number(rec.weight); if (!hh || !ww) return null; const m = hh / 100; return Math.round((ww / (m * m)) * 10) / 10; };
  const totalGrade = (t) => (t >= 80 ? 1 : t >= 60 ? 2 : t >= 40 ? 3 : t >= 20 ? 4 : 5);

  function evaluate(stu, rec, items) {
    const out = { parts: {}, best: {}, total: null, grade: null, bmi: null, bmiClass: null };
    for (const el of ELEMENTS) out.best[el.key] = bestOf(items[el.key], rec);
    const sex = stu.gender; if (!sex) return { ...out, noSex: true };
    let sum = 0, cnt = 0;
    for (const el of ELEMENTS) { const r = lookup(items[el.key], sex, stu.grade, out.best[el.key]); out.parts[el.key] = r; if (r) { sum += r.score; cnt++; } }
    const b = bmiOf(rec); out.bmi = b; const rb = lookup(BMI, sex, stu.grade, b);
    if (rb) { out.bmiClass = rb.level; out.parts.bmi = rb; sum += rb.score; cnt++; }
    if (cnt === 5) { out.total = sum; out.grade = totalGrade(sum); }
    return out;
  }

  /* 종목 설정 */
  function ItemsDialog({ open, onClose, items, S, sem }) {
    return h`<${PE.Dialog} open=${open} onClose=${onClose}><h2>종목 설정 <span className="card-sub">${sem}학기</span></h2>
      <p className="sub">체력요소마다 이번 학기에 측정할 종목을 하나씩 골라요. 종목을 바꿔도 이미 적은 기록은 그대로 남아요.</p>
      <div className="items-set">
        ${ELEMENTS.map((el) => h`<div className="items-row" key=${el.key}><b>${el.name}</b>
          <div className="cc-row">${el.options.map((o) => h`<button key=${o} type="button" className="cc wide" aria-pressed=${items[el.key] === o} onClick=${() => S.setPapsItem(sem, el.key, o)}>${LABEL[o]}</button>`)}</div></div>`)}
        <div className="items-row"><b>비만</b><div className="cc-row"><button type="button" className="cc wide" aria-pressed="true" disabled>체질량지수(BMI)</button></div></div>
      </div>
      <p className="card-sub" style=${{ marginTop: 12 }}>오래달리기-걷기·스텝검사는 5·6학년 기준표만 있어요.</p>
      <div className="dialog-foot"><div></div><${PE.Button} variant="primary" onClick=${onClose}>완료<//></div><//>`;
  }

  /* 기준표: 체력요소별로 종목을 한 표에, 남·여 나란히 */
  function StandardDialog({ open, onClose, items, classes }) {
    const ELS = [...ELEMENTS.map((e) => ({ name: e.name, list: e.options, used: items[e.key] })), { name: "비만", list: [BMI], used: BMI }];
    const [el, setEl] = useState(0); const [grade, setGrade] = useState(null); const [mode, setMode] = useState("level");
    const E = ELS[el]; const isBmi = E.list[0] === BMI;
    const get = (sex, g, item) => (((PE.PAPS_STANDARDS[sex] || {})[String(g)] || {})[item]) || [];
    const gradesAll = [3, 4, 5, 6].filter((g) => E.list.some((it) => get("M", g, it).length));
    const gr = gradesAll.includes(grade) ? grade : (gradesAll.find((g) => classes.some((c) => c.grade === g)) || gradesAll[0]);
    const its = E.list.filter((it) => get("M", gr, it).length);
    const fmt = (it, lo, hi, first, last) => { const low = ITEMS[it].low; return lo === hi ? String(lo) : first ? (low ? `${hi} 이하` : `${lo} 이상`) : last ? (low ? `${lo} 이상` : `${hi} 이하`) : `${lo} ~ ${hi}`; };
    const byLevel = (list) => { const m = []; for (const r of list) { const g = m.find((x) => x.level === r[0]); if (g) { g.lo = Math.min(g.lo, r[2]); g.hi = Math.max(g.hi, r[3]); } else m.push({ level: r[0], lo: r[2], hi: r[3] }); } return m; };
    const lvText = (v) => (typeof v === "number" ? v + "등급" : v);
    let rows = [];
    if (mode === "level") {
      const g0 = byLevel(get("M", gr, its[0]));
      rows = g0.map((x, i) => ({ lv: x.level, cells: its.flatMap((it) => ["M", "F"].map((s) => { const g = byLevel(get(s, gr, it)); const x2 = g[i]; return x2 ? fmt(it, x2.lo, x2.hi, i === 0, i === g.length - 1) : ""; })) }));
    } else if (isBmi) {
      const M = get("M", gr, BMI), F = get("F", gr, BMI);
      rows = M.map((r, i) => ({ lv: r[0], sc: r[1], first: i === 0 || M[i - 1][0] !== r[0], cells: [fmt(BMI, r[2], r[3], i === 0, i === M.length - 1), F[i] ? fmt(BMI, F[i][2], F[i][3], i === 0, i === F.length - 1) : ""] }));
    } else {
      rows = Array.from({ length: 21 }, (_, i) => 20 - i).map((sc) => {
        const lvEntry = its.map((it) => get("M", gr, it).find((r) => r[1] === sc)).find(Boolean);
        return { lv: lvEntry ? lvEntry[0] : "", sc, cells: its.flatMap((it) => ["M", "F"].map((s) => { const L = get(s, gr, it); const idx = L.findIndex((r) => r[1] === sc); return idx < 0 ? "" : fmt(it, L[idx][2], L[idx][3], idx === 0, idx === L.length - 1); })) };
      });
      rows.forEach((r, i) => { r.first = i === 0 || rows[i - 1].lv !== r.lv; });
    }
    const showScore = mode === "score";
    return h`<${PE.Dialog} open=${open} onClose=${onClose} wide><h2>기준표</h2>
      <div className="std-pick">
        <div className="cc-row">${ELS.map((e, i) => h`<button key=${e.name} type="button" className="cc wide" aria-pressed=${el === i} onClick=${() => setEl(i)}>${e.name}</button>`)}</div>
        <div className="std-sub"><div className="cc-row">${gradesAll.map((g) => h`<button key=${g} type="button" className="cc" style=${{ "--tag": PE.GRADE_COLORS[g] }} aria-pressed=${gr === g} onClick=${() => setGrade(g)}>${g}학년</button>`)}</div>
          <span className="grow"></span><${PE.Seg} label="표시 방식" value=${mode} onChange=${setMode} options=${[{ value: "level", label: "등급만" }, { value: "score", label: "점수까지" }]} /></div></div>
      <div className="std-wrap"><table className="std">
        <thead><tr><th rowSpan="2">${isBmi ? "분류" : "등급"}</th>${showScore ? h`<th rowSpan="2">점수</th>` : null}${its.map((it) => h`<th key=${it} colSpan="2" className=${cn("grp", it === E.used && "used")}>${LABEL[it]} <small>(${ITEMS[it].unit})</small></th>`)}</tr>
          <tr>${its.map((it) => ["남", "여"].map((s) => h`<th key=${it + s} className=${cn("sx", s === "남" && "grp")}>${s}</th>`))}</tr></thead>
        <tbody>${rows.map((r, i) => h`<tr key=${i} className=${cn((!showScore || r.first) && "first")}><td>${!showScore || r.first ? lvText(r.lv) : ""}</td>${showScore ? h`<td className="num">${r.sc}</td>` : null}${r.cells.map((c, j) => h`<td key=${j} className=${cn("num", j % 2 === 0 && "grp")}>${c}</td>`)}</tr>`)}</tbody></table></div>
      <p className="card-sub" style=${{ marginTop: 10 }}>공식 기준표와 한 번 대조해 보세요.</p>
      <div className="dialog-foot"><div></div><${PE.Button} variant="primary" onClick=${onClose}>닫기<//></div><//>`;
  }

  /* 엑셀 업로드: 학년·반·번호로 학생을 찾아 기록을 채움 */
  const norm = (t) => String(t == null ? "" : t).replace(/\s+/g, "");
  function allFieldMap() {
    const m = new Map();
    for (const it of Object.keys(FIELDS)) for (const f of FIELDS[it]) { m.set(norm(fieldLabel(f)), f.k); if (!f.sub) m.set(norm(f.name), f.k); }
    m.set("신장", "height"); m.set("체중", "weight"); m.set("신장(cm)", "height"); m.set("체중(kg)", "weight");
    return m;
  }
  function PapsImport({ open, onClose, students, classes, preset, onTemplate, onApply }) {
    const [tpl, setTpl] = useState(null);
    const [info, setInfo] = useState(null); const [err, setErr] = useState(""); const fileIn = useRef(null);
    const close = () => { setInfo(null); setErr(""); setTpl(null); onClose(); };
    const read = async (file) => {
      if (!file) return; setErr(""); setInfo(null);
      try {
        const sheets = await PE.readXlsx(await file.arrayBuffer()); const fm = allFieldMap(); const by = {}; let skipped = 0, vals = 0;
        for (const sh of sheets) {
          const head = (sh.rows[0] || []).map(norm); const iGr = head.indexOf("학년"), iK = head.indexOf("반"), iNo = head.indexOf("번호"), iNm = head.indexOf("이름");
          if (iGr < 0 || iK < 0 || (iNo < 0 && iNm < 0)) continue;
          const cols = head.map((n, i) => ({ k: fm.get(n), i })).filter((c) => c.k);
          for (const r of sh.rows.slice(1)) {
            if (r[iGr] === "" && r[iK] === "") continue;
            const g = parseInt(r[iGr], 10), k = parseInt(r[iK], 10); const no = iNo >= 0 ? Number(r[iNo]) : NaN; const nm = iNm >= 0 ? String(r[iNm] || "").trim() : "";
            const stu = students.find((x) => x.grade === g && x.klass === k && ((!Number.isNaN(no) && no > 0 && x.number === no) || (nm && x.name === nm && (Number.isNaN(no) || no <= 0))));
            if (!stu) { skipped++; continue; }
            for (const c of cols) { const raw = r[c.i]; if (raw === "" || raw == null) continue; const n = Number(String(raw).replace(",", ".")); if (!Number.isFinite(n) || n < 0) continue; (by[stu.id] = by[stu.id] || {})[c.k] = n; vals++; }
          }
        }
        setInfo({ by, people: Object.keys(by).length, vals, skipped });
      } catch (e) { setErr("읽을 수 없는 파일이에요. 양식 받기로 내려받은 엑셀 파일을 골라 주세요."); }
    };
    return h`<${PE.Dialog} open=${open} onClose=${close} mid><h2>업로드</h2>
      <div className="imp-btns"><${PE.Button} onClick=${() => setTpl(tpl ? null : preset)}>${I("download")} 양식 받기<//><${PE.Button} onClick=${() => fileIn.current && fileIn.current.click()}>${I("upload")} 파일 선택<//></div>
      <input ref=${fileIn} type="file" accept=".xlsx" hidden onChange=${(e) => { read(e.target.files[0]); e.target.value = ""; }} />
      ${tpl ? h`<div className="tpl-pick"><span className="card-sub">입력할 반을 고르면 그 반 양식만 내려받아요.</span>
        <div className="cc-row">${classes.map((c) => h`<button key=${c.key} type="button" className="cc" style=${{ "--tag": PE.GRADE_COLORS[c.grade] }} aria-pressed=${tpl.includes(c.key)} onClick=${() => setTpl(tpl.includes(c.key) ? tpl.filter((x) => x !== c.key) : [...tpl, c.key])}>${c.key}</button>`)}</div>
        <${PE.Button} variant="primary" disabled=${!tpl.length} onClick=${() => { onTemplate(tpl); setTpl(null); }}>${I("download")} ${tpl.length}개 반 양식 내려받기<//></div>` : null}
      ${err ? h`<p className="form-err">${err}</p>` : null}
      ${info ? h`<div className="imp-sum"><span className="badge num">${info.people}명 · 기록 ${info.vals}칸</span>
        ${info.skipped ? h`<p className="card-sub" style=${{ marginTop: 8 }}>학생을 찾지 못한 줄 ${info.skipped}건은 건너뛰어요.</p>` : null}
        ${info.people ? h`<p className="card-sub" style=${{ marginTop: 4 }}>파일에 적힌 칸만 덮어쓰고, 빈 칸은 기존 기록을 그대로 둬요.</p>` : null}</div>` : null}
      <div className="dialog-foot"><div></div><div><${PE.Button} onClick=${close}>취소<//><${PE.Button} variant="primary" disabled=${!info || !info.people} onClick=${() => { onApply(info.by); close(); }}>가져오기<//></div></div><//>`;
  }

  /* 기록 입력 칸 */
  function Cell({ value, onCommit, label, unit, badge, miss, col }) {
    const [txt, setTxt] = useState(null);
    const shown = txt != null ? txt : value == null ? "" : String(value);
    const commit = () => { if (txt == null) return; const t = txt.trim().replace(",", "."); setTxt(null); if (t === "") return onCommit(null); const n = Number(t); if (Number.isFinite(n) && n >= 0) onCommit(n); };
    return h`<div className="pc"><input className=${cn("input pc-in num", miss && "miss")} inputMode="decimal" aria-label=${label} placeholder=${unit} value=${shown} onChange=${(e) => setTxt(e.target.value)} onBlur=${commit} data-col=${col} enterKeyHint="next" onFocus=${(e) => e.target.select()} onKeyDown=${(e) => { if (e.key !== "Enter") return; e.preventDefault(); const all = [...e.target.closest("table").querySelectorAll(`input[data-col="${col}"]`)]; const nx = all[all.indexOf(e.target) + 1]; if (nx) nx.focus(); else e.target.blur(); }} />${badge}</div>`;
  }
  const Pt = ({ r }) => (r ? h`<i className=${cn("pg", "g" + (typeof r.level === "number" ? r.level : 0))} title=${r.score + "점"}>${r.score}</i>` : h`<i className="pg none"></i>`);

  function Paps() {
    const S = PE.useStore(); const { yd } = S; const classes = PE.myClasses(yd); const sem = S.state.prefs.sem || (PE.currentSem(yd, PE.today()) === 2 ? 2 : 1); const P = yd.paps.s[sem]; const items = P.items; const rec = P.rec; const showScore = !!S.state.prefs.papsScore;
    const [sel, setSel] = PE.useSaved("papsSel", null); const [setOpen, setSetOpen] = useState(false); const [stdOpen, setStdOpen] = useState(false); const [imp, setImp] = useState(false);
    const keys = classes.map((c) => c.key);
    const shown = sel === null ? keys.slice(0, 1) : sel.filter((k) => keys.includes(k));
    const pick = (k) => { if (shown.includes(k)) return setSel(shown.filter((x) => x !== k)); setSel([...shown, k]); };
    const shownCls = classes.filter((c) => shown.includes(c.key));
    const rows = useMemo(() => shownCls.map((c) => ({ c, list: yd.students.filter((x) => x.grade === c.grade && x.klass === c.klass).sort((a, b) => a.number - b.number || a.name.localeCompare(b.name, "ko")) })).filter((g) => g.list.length), [yd.students, shown.join(",")]);
    const set = (sid, key) => (v) => S.setPapsValue(sem, sid, key, v);
    /* 한 명이라도 입력된 종류의 칸만, 비어 있으면 붉게 표시 */
    const colHas = useMemo(() => { const m = {}; for (const g of rows) for (const x of g.list) for (const [k, v] of Object.entries(rec[x.id] || {})) if (v != null) m[k] = true; return m; }, [rows, rec]);

    /* 화면 칸 구성 */
    const cols = [];
    for (const el of ELEMENTS) { const it = items[el.key]; const f = FIELDS[it]; f.forEach((x, i) => cols.push({ kind: "f", el: el.key, f: x, grp: i === 0, single: f.length === 1, unit: ITEMS[it].unit })); if (f.length > 1 && showScore) cols.push({ kind: "res", el: el.key, item: it }); }

    const doTemplate = async (ks) => {
      const fcols = cols.filter((c) => c.kind === "f");
      const head = ["학년", "반", "번호", "이름", ...fcols.map((c) => fieldLabel(c.f)), "신장", "체중"];
      const out = [head];
      for (const c of classes.filter((q) => ks.includes(q.key))) for (const x of yd.students.filter((s) => s.grade === c.grade && s.klass === c.klass).sort((a, b) => a.number - b.number)) {
        const r = rec[x.id] || {}; out.push([c.grade, c.klass, x.number, x.name, ...fcols.map((q) => (r[q.f.k] == null ? "" : r[q.f.k])), r.height == null ? "" : r.height, r.weight == null ? "" : r.weight]);
      }
      await PE.download("PAPS_양식.xlsx", PE.writeXlsx([{ name: "PAPS", widths: [8, 8, 8, 14, ...head.slice(4).map(() => 18)], rows: out }]));
    };

    return h`<div className="page">
      <div className="roster-bar">
        <div className="roster-tabs">${classes.map((c) => h`<button key=${c.key} type="button" className="cc roster-tab" data-g=${c.grade} aria-pressed=${shown.includes(c.key)} style=${{ "--tag": PE.GRADE_COLORS[c.grade] }} onClick=${() => pick(c.key)}>${c.key}</button>`)}</div>
        <span className="grow"></span>
        <div className="bar-btns"><span className="card-sub num">${sem}학기</span><${PE.Button} size="sm" onClick=${() => setSetOpen(true)}>${I("settings")} 종목 설정<//>
        <${PE.Button} size="sm" aria-pressed=${showScore} className=${showScore ? "toggled" : ""} onClick=${() => S.setPref("papsScore", !showScore)}>${I("eye")} 점수 보기<//>
        <${PE.Button} size="sm" onClick=${() => setStdOpen(true)}>${I("clipboard")} 기준표<//>
        <${PE.Button} size="sm" disabled=${!classes.length} onClick=${() => setImp(true)}>${I("upload")} 업로드<//></div></div>
      ${classes.length === 0 ? h`<section className="card"><p className="empty-note" style=${{ marginTop: 0 }}><a href="#settings" style=${{ color: "var(--primary)", fontWeight: 700 }}>기본 설정</a>에서 담당 학급을 먼저 골라 주세요.</p></section>` : null}
      ${rows.length === 0 ? null : h`<section className="card paps-card"><div className="paps-scroll"><table className="paps">
        <thead><tr><th rowSpan="2" className="c-cls">반</th><th rowSpan="2" className="c-no">번호</th><th rowSpan="2" className="c-nm">이름</th><th rowSpan="2" className="c-gd">성별</th>
          ${ELEMENTS.map((el) => { const it = items[el.key]; const n = FIELDS[it].length; return h`<th key=${el.key} colSpan=${n > 1 && showScore ? n + 1 : n} className="mc grp ghead"><b>${LABEL[it]}</b></th>`; })}
          <th rowSpan="2" className="mc grp"><b>신장</b><small>cm</small></th><th rowSpan="2" className="mc"><b>체중</b><small>kg</small></th><th rowSpan="2" className="mc"><b>비만</b><small>BMI</small></th>${showScore ? h`<th rowSpan="2" className="mc"><b>종합</b><small>점수 · 등급</small></th>` : null}</tr>
        <tr>${cols.map((c, i) => c.kind === "res" ? h`<th key=${"r" + i} className="mc sub"><small>${c.item === "악력" ? "좌우 평균" : "최고"}${showScore ? " · 점수" : ""}</small></th>` : h`<th key=${c.f.k} className=${cn("mc sub", c.grp && "grp")}><small>${c.f.sub ? c.f.sub + " " : ""}(${c.unit})</small></th>`)}</tr></thead>
        <tbody>${rows.map((g) => g.list.map((x, i) => { const r = rec[x.id] || {}; const ev = evaluate(x, r, items);
          return h`<tr key=${x.id} className=${cn(i === 0 && "cls-first")} style=${{ "--tag": PE.GRADE_COLORS[g.c.grade] }}>
            <td className="c-cls"><${PE.ClassTag} k=${g.c.key} /></td>
            <td className="num c-no">${x.number}</td><td className=${cn("c-nm", "g-" + x.gender)}>${x.name}</td>
            <td className="c-gd"><span className=${cn("g-pill", x.gender)}>${x.gender === "M" ? "남" : x.gender === "F" ? "여" : "–"}</span></td>
            ${cols.map((c, ci) => c.kind === "res"
              ? h`<td key=${"r" + ci} className="c-res num">${ev.best[c.el] != null ? h`<b>${ev.best[c.el]}</b>` : h`<em>–</em>`}${showScore ? h`<${Pt} r=${ev.parts[c.el]} />` : null}</td>`
              : h`<td key=${c.f.k} className=${cn(c.grp && "grp")}><${Cell} label=${`${x.name} ${fieldLabel(c.f)}`} col=${c.f.k} unit=${c.unit} value=${r[c.f.k]} miss=${r[c.f.k] == null && colHas[c.f.k]} onCommit=${set(x.id, c.f.k)} badge=${c.single && showScore ? h`<${Pt} r=${ev.parts[c.el]} />` : null} /></td>`)}
            <td className="grp"><${Cell} label=${x.name + " 신장"} col="height" unit="cm" value=${r.height} miss=${r.height == null && colHas.height} onCommit=${set(x.id, "height")} /></td>
            <td><${Cell} label=${x.name + " 체중"} col="weight" unit="kg" value=${r.weight} miss=${r.weight == null && colHas.weight} onCommit=${set(x.id, "weight")} /></td>
            <td className="c-bmi num">${ev.bmi != null ? h`<b>${ev.bmi}</b><small>${ev.bmiClass || ""}</small>` : h`<em>–</em>`}</td>
            ${showScore ? h`<td className="c-tot num">${ev.total != null ? h`<b>${ev.total}점</b><i className=${cn("pg", "t" + ev.grade)}>${ev.grade}등급</i>` : ev.noSex ? h`<em title="명렬표에서 성별을 먼저 정해 주세요">성별 필요</em>` : h`<em>–</em>`}</td>` : null}</tr>`; }))}</tbody></table></div></section>`}
      <${ItemsDialog} open=${setOpen} onClose=${() => setSetOpen(false)} items=${items} S=${S} sem=${sem} />
      <${StandardDialog} open=${stdOpen} onClose=${() => setStdOpen(false)} items=${items} classes=${classes} />
      <${PapsImport} open=${imp} onClose=${() => setImp(false)} students=${yd.students} classes=${classes} preset=${shown.length ? shown : keys.slice(0, 1)} onTemplate=${doTemplate} onApply=${(by) => S.setPapsBulk(sem, by)} />
    </div>`;
  }
  /* 대시보드용: 한 반에서 아직 측정 안 된 체력요소·학생 (체력요소 4개 + 신장·체중) */
  PE.papsMissing = (yd, sem, key) => { const P = PE.normPaps(yd.paps).s[sem]; const items = P.items; const [g, kl] = key.split("-").map(Number);
    const st = yd.students.filter((x) => x.grade === g && x.klass === kl).sort((a, b) => a.number - b.number);
    const defs = [...ELEMENTS.map((el) => ({ name: LABEL[items[el.key]] || el.name, has: (rec) => bestOf(items[el.key], rec) != null })), { name: "신장·체중", has: (rec) => Number(rec.height) > 0 && Number(rec.weight) > 0 }];
    const parts = defs.map((d) => ({ name: d.name, missing: st.filter((x) => !d.has(P.rec[x.id] || {})) }));
    const total = st.length * defs.length; const miss = parts.reduce((s, q) => s + q.missing.length, 0);
    return { students: st.length, total, filled: total - miss, parts: parts.filter((q) => q.missing.length) }; };
  PE.pages = PE.pages || {};
  PE.pages.paps = Paps;
})();
