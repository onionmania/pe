/* 평가: 반을 골라 보고, 평가 항목을 만들어 학생별로 기록해요 */
(function () {
  const PE = window.PE, React = window.React, h = PE.h, cn = PE.cn, I = PE.I;
  const { useState, useMemo } = React;
  const COLS = [{ value: 1, label: "1반 보기", icon: "grid" }, { value: 2, label: "2반 보기", icon: "grid" }, { value: 3, label: "3반 보기", icon: "grid" }, { value: 4, label: "4반 보기", icon: "grid" }];
  const KINDS = [{ value: "level", label: "4단계" }, { value: "score", label: "점수" }, { value: "text", label: "메모" }];
  const LV = ["매우", "잘함", "보통", "노력"];
  const LV_FULL = ["매우잘함", "잘함", "보통", "노력요함"];
  const LEGACY = { 상: "매우", 중: "보통", 하: "노력" };
  /* 엔터: 같은 항목의 다음 학생(아래 칸)으로. 맨 아래면 다음 항목의 첫 학생으로 */
  const goDown = (e) => {
    e.preventDefault(); const td = e.target.closest("td"), tr = td.parentElement, tb = tr.parentElement, idx = td.cellIndex; const tbl = tb.parentElement;
    const pick = (row, i) => { const c = row && row.cells[i]; return c && !c.querySelector(".flip.on") && c.querySelector("input.step-in, input.ev-in, button.ev-lv:not(.b)"); };
    let el = null; for (let r = tr.nextElementSibling; r && !el; r = r.nextElementSibling) el = pick(r, idx);
    for (let i = idx + 1; i < tr.cells.length && !el; i++) el = pick(tb.rows[0], i);
    if (el) { el.focus(); if (el.select) el.select(); } else e.target.blur();
  };
  const onEnter = (e) => { if (e.key === "Enter") goDown(e); };
  function ScoreCell({ it, v, onSet }) {
    const [txt, setTxt] = useState(null); const cur = v === "" || v == null ? null : Number(v);
    const commit = () => { if (txt == null) return; setTxt(null); if (txt === "" || txt === ".") onSet(""); else { const n = Number(txt); if (Number.isFinite(n)) onSet(Math.min(999, Math.max(0, n))); } };
    const bump = (d) => onSet(Math.min(999, Math.max(0, Math.round(((cur || 0) + d) * 100) / 100)));
    return h`<div className="stepper ev-st" role="group" aria-label=${it.name}>
      <button type="button" tabIndex="-1" aria-label="줄이기" disabled=${cur == null || cur <= 0} onClick=${() => bump(-1)}>${I("minus")}</button>
      <input className="num step-in" style=${{ width: `calc(${Math.max(1, String(txt != null ? txt : cur == null ? "" : cur).length)}ch + 14px)` }} inputMode="decimal" enterKeyHint="next" aria-label=${it.name} value=${txt != null ? txt : cur == null ? "" : cur} onFocus=${(e) => e.target.select()}
        onChange=${(e) => { const t = e.target.value.replace(/[^\d.]/g, ""); if ((t.match(/\./g) || []).length <= 1) { const [a, b] = t.split("."); setTxt(b == null ? a.slice(0, 3) : a.slice(0, 3) + "." + b.slice(0, 1)); } }} onBlur=${commit}
        onKeyDown=${(e) => { if (e.key === "Enter") { commit(); goDown(e); } }} />
      <button type="button" tabIndex="-1" aria-label="늘리기" onClick=${() => bump(1)}>${I("plus")}</button></div>`;
  }
  const norm = (e) => ({ items: (e && e.items) || [], data: (e && e.data) || {} });

  function ItemsDialog({ open, onClose, ev, grades, upd }) {
    const [nm, setNm] = useState(""); const [kind, setKind] = useState("level"); const [gs, setGs] = useState([]); const [del, setDel] = useState(null);
    const add = () => { const v = nm.trim(); if (!v) return; upd((e) => ({ ...e, items: [...e.items, { id: PE.uid(), name: v, kind, grades: gs }] })); setNm(""); };
    const patch = (id, p) => upd((e) => ({ ...e, items: e.items.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
    const gchips = (val, set) => h`<div className="cc-row ev-gs">${grades.map((g) => h`<button key=${g} type="button" className="cc" style=${{ "--tag": PE.GRADE_COLORS[g] }} aria-pressed=${val.includes(g)} onClick=${() => set(val.includes(g) ? val.filter((x) => x !== g) : [...val, g])}>${g}학년</button>`)}</div>`;
    return h`<${PE.Dialog} open=${open} onClose=${onClose} mid><h2>평가 항목 관리</h2><p className="sub">학년을 고르지 않으면 모든 학년에 보여요.</p>
      <form className="ev-new" onSubmit=${(e) => { e.preventDefault(); add(); }}>
        <div className="ev-item-top"><input className="input" placeholder="새 항목 (예: 피구 · 던지기)" aria-label="새 항목 이름" value=${nm} onChange=${(e) => setNm(e.target.value)} />
          <${PE.Seg} label="기록 방식" value=${kind} onChange=${setKind} options=${KINDS} />
          <${PE.Button} icon variant="primary" type="submit" aria-label="항목 추가" disabled=${!nm.trim()}>${I("plus")}<//></div>
        ${gchips(gs, setGs)}</form>
      <div className="ev-items">${ev.items.map((it) => h`<div key=${it.id} className="ev-item">
          <div className="ev-item-top"><input className="input" aria-label="항목 이름" value=${it.name} onChange=${(e) => patch(it.id, { name: e.target.value })} onBlur=${(e) => { if (!e.target.value.trim()) patch(it.id, { name: "항목" }); }} />
            <span className="badge">${(KINDS.find((k) => k.value === it.kind) || KINDS[0]).label}</span>
            <${PE.Button} icon variant="ghost" aria-label=${it.name + (it.hidden ? " 보이기" : " 숨기기")} onClick=${() => patch(it.id, { hidden: !it.hidden })}>${I(it.hidden ? "eyeoff" : "eye")}<//>
            <${PE.Button} icon variant="ghost" aria-label=${it.name + " 삭제"} onClick=${() => setDel(it)}>${I("trash")}<//></div>
          ${gchips(it.grades || [], (v) => patch(it.id, { grades: v }))}</div>`)}
        ${!ev.items.length ? h`<p className="card-sub">아직 항목이 없어요. 아래에서 만들어 주세요.</p>` : null}</div>
      <div className="dialog-foot"><div></div><${PE.Button} variant="primary" onClick=${onClose}>완료<//></div>
      <${PE.ConfirmDialog} open=${!!del} danger title=${del ? `‘${del.name}’ 항목을 삭제할까요?` : ""} body="이 항목에 입력된 기록이 모든 반에서 함께 삭제돼요." confirmLabel="삭제" onClose=${() => setDel(null)}
        onConfirm=${() => { const id = del.id; upd((e) => { const data = {}; for (const [sid, v] of Object.entries(e.data)) { const { [id]: _x, [id + "~"]: _y, ...rest } = v; data[sid] = rest; } return { items: e.items.filter((x) => x.id !== id), data }; }); setDel(null); }} /><//>`;
  }

  function Cell({ it, v, onSet }) {
    if (it.kind === "level") { const val = LEGACY[v] || v; const i = LV.indexOf(val);
      return h`<button type="button" className=${cn("ev-lv", i >= 0 && "lv" + i)} title=${LV_FULL.join(" → ") + " → 비움 (누를 때마다 바뀌어요)"} aria-label=${it.name + " " + (i >= 0 ? LV_FULL[i] : "비어 있음")} onKeyDown=${onEnter} onClick=${() => onSet(i < 0 ? LV[0] : LV[i + 1] || "")}>${i >= 0 ? val : h`<em>–</em>`}</button>`; }
    if (it.kind === "score") return h`<${ScoreCell} it=${it} v=${v} onSet=${onSet} />`;
    return h`<input className="input ev-in" enterKeyHint="next" aria-label=${it.name} value=${v || ""} onKeyDown=${onEnter} onChange=${(e) => onSet(e.target.value)} />`;
  }

  /* 점수 → 4단계 변환: conv = { r: [노력, 보통, 잘함, 매우 비율], dir: "high" | "low", on } */
  const PRESETS = [{ r: [5, 3, 2, 0], t: "5 : 3 : 2 : 0" }, { r: [4, 3, 2, 1], t: "4 : 3 : 2 : 1" }, { r: [2.5, 2.5, 2.5, 2.5], t: "2.5 : 2.5 : 2.5 : 2.5" }];
  const LVN = ["노력", "보통", "잘함", "매우"]; /* 낮은 단계부터 (비율 입력 순서) */
  function levelsFor(rows, conv) {
    const a = rows.filter((x) => x.v !== "" && x.v != null && Number.isFinite(Number(x.v))).map((x) => ({ id: x.id, v: Number(x.v) }));
    const out = new Map();
    if (conv.mode === "range") { a.forEach((x) => { const k = conv.rg.findIndex(([lo, hi]) => Number.isFinite(lo) && Number.isFinite(hi) && x.v >= lo && x.v <= hi); if (k >= 0) out.set(x.id, k); }); return out; }
    a.sort((p, q) => (conv.dir === "low" ? p.v - q.v : q.v - p.v));
    const r = conv.ver === 2 ? conv.r : [...conv.r].reverse(); const t = r.reduce((s, x) => s + x, 0); const rr = t > 0 ? r : [1, 1, 1, 1]; const tt = t > 0 ? t : 4;
    const N = a.length; let cum = 0; const cut = rr.map((x) => { cum += x; return Math.round((N * cum) / tt); }); cut[3] = N;
    let i = 0;
    while (i < N) { let j = i; while (j < N && a[j].v === a[i].v) j++; let lv = cut.findIndex((c) => i < c); if (lv < 0) lv = 3; for (let k = i; k < j; k++) out.set(a[k].id, lv); i = j; }
    return out;
  }
  /* 기록에서 4개 구간의 처음 값을 제안: 매우 → 노력 순서로 [이상, 이하] */
  function suggestRanges(rows) {
    const vals = rows.filter((x) => x.v !== "" && x.v != null).map((x) => Number(x.v)).filter(Number.isFinite);
    if (!vals.length) return [["90", "100"], ["80", "89"], ["70", "79"], ["0", "69"]];
    const lo = Math.min(...vals), hi = Math.max(...vals); const dec = vals.some((x) => !Number.isInteger(x)); const u = dec ? 0.1 : 1; const f = (n) => Math.round((lo + ((hi - lo) * n) / 4) * 10) / 10;
    const fx = (x) => String(dec ? Math.round(x * 10) / 10 : Math.round(x)); const c1 = dec ? f(1) : Math.round(f(1)), c2 = dec ? f(2) : Math.round(f(2)), c3 = dec ? f(3) : Math.round(f(3));
    return [[fx(c3 + u), fx(hi)], [fx(c2 + u), fx(c3)], [fx(c1 + u), fx(c2)], [fx(lo), fx(c1)]];
  }
  /* 숫자 − + 알약 (세 자리 · 소수 한 자리까지, 값은 글자로 주고받아요) */
  function DecStepper({ value, onChange, label, bad, step = 1, max = 999 }) {
    const cur = value === "" || value == null ? NaN : Number(value);
    const bump = (d) => onChange(String(Math.min(max, Math.max(0, Math.round(((Number.isFinite(cur) ? cur : 0) + d * step) * 10) / 10))));
    return h`<div className=${cn("stepper dec", bad && "bad")} role="group" aria-label=${label}>
      <button type="button" tabIndex="-1" aria-label="줄이기" disabled=${Number.isFinite(cur) && cur <= 0} onClick=${() => bump(-1)}>${I("minus")}</button>
      <input className="num step-in" inputMode="decimal" aria-label=${label} value=${value} onFocus=${(e) => e.target.select()}
        onChange=${(e) => { const t = e.target.value.replace(/[^\d.]/g, ""); if ((t.match(/\./g) || []).length > 1) return; const [a, b] = t.split("."); onChange(b == null ? a.slice(0, 3) : a.slice(0, 3) + "." + b.slice(0, 1)); }}
        onKeyDown=${(e) => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } }} />
      <button type="button" tabIndex="-1" aria-label="늘리기" disabled=${Number.isFinite(cur) && cur >= max} onClick=${() => bump(1)}>${I("plus")}</button></div>`;
  }
  function ConvDialog({ it, title, rows, conv, onApply, onOff, onClose }) {
    const [mode, setMode] = useState(conv ? conv.mode || "ratio" : "ratio");
    const [dir, setDir] = useState(conv && conv.dir ? conv.dir : "high"); const fit10 = (a) => { const t = a.reduce((x, y) => x + y, 0); if (t <= 0 || Math.abs(t - 10) < 1e-9) return a; const b = a.map((x) => Math.round((x * 10) / t)); const d = 10 - b.reduce((x, y) => x + y, 0); const k = b.indexOf(Math.max(...b)); b[k] = Math.max(0, b[k] + d); return b; };
    const [rS, setRS] = useState(() => fit10(conv && conv.r ? (conv.ver === 2 ? conv.r : [...conv.r].reverse()) : PRESETS[1].r).map(String));
    const r = rS.map((t) => (String(t).trim() === "" ? 0 : Number(t)));
    const [rg, setRg] = useState(() => (conv && conv.rg ? conv.rg.map(([a, b]) => [String(a), String(b)]) : suggestRanges(rows)));
    const num = (t) => (String(t).trim() === "" ? NaN : Number(t));
    const rgN = rg.map(([a, b]) => [num(a), num(b)]);
    /* 구간 점검: 문제가 되는 칸(bc[행][0=시작,1=끝])만 빨갛게, 설명은 아래에 한 줄씩 */
    const bc = [0, 1, 2, 3].map(() => [false, false]); const msgs = []; const rd1 = (x) => Math.round(x * 10) / 10;
    if (rgN.some(([a, b]) => !Number.isFinite(a) || !Number.isFinite(b))) { msgs.push("빈 칸에 숫자를 넣어 주세요"); rgN.forEach(([a, b], i) => { if (!Number.isFinite(a)) bc[i][0] = true; if (!Number.isFinite(b)) bc[i][1] = true; }); }
    rgN.forEach(([a, b], i) => { if (Number.isFinite(a) && Number.isFinite(b) && a > b) { bc[i][0] = bc[i][1] = true; msgs.push(`${LV_FULL[i]}의 시작(${a})이 끝(${b})보다 커요`); } });
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const [a, b] = rgN[i], [c, d] = rgN[j]; if (![a, b, c, d].every(Number.isFinite) || a > b || c > d) continue; const lo = Math.max(a, c), hi = Math.min(b, d); if (lo > hi) continue;
      if (c <= a && a <= d) bc[i][0] = true; if (c <= b && b <= d) bc[i][1] = true; if (a <= c && c <= b) bc[j][0] = true; if (a <= d && d <= b) bc[j][1] = true;
      msgs.push(`${LV_FULL[i]}와 ${LV_FULL[j]} 구간이 겹쳐요 (${lo === hi ? lo : lo + " ~ " + hi})`); }
    const bad = mode === "range" && msgs.length > 0;
    const rSum = rd1(r.reduce((x, y) => x + y, 0)); const rBad = mode === "ratio" && Math.abs(rSum - 10) > 1e-9;
    const cv = mode === "range" ? { mode, rg: rgN } : { mode, r, dir, ver: 2 };
    const lv = useMemo(() => (bad || rBad ? new Map() : levelsFor(rows, cv)), [rows, mode, rS, dir, rg]);
    const total = rows.filter((x) => x.v !== "" && x.v != null && Number.isFinite(Number(x.v))).length;
    const cnt = [0, 0, 0, 0]; lv.forEach((k) => cnt[k]++);
    /* 어느 구간에도 안 들어가는 숫자 찾기 (구간 사이 빈틈 + 기록이 구간 밖인 경우) */
    const holes = (() => { if (mode !== "range" || bad) return []; const dec = rgN.some(([a, b]) => !Number.isInteger(a) || !Number.isInteger(b)); const u = dec ? 0.1 : 1; const rd = (x) => Math.round(x * 10) / 10;
      const iv = [...rgN].sort((p, q) => p[0] - q[0]); const out = []; const fm = (a, b) => (a === b ? String(a) : `${a} ~ ${b}`);
      for (let k = 0; k < iv.length - 1; k++) { const g0 = rd(iv[k][1] + u), g1 = rd(iv[k + 1][0] - u); if (g1 >= g0) out.push(fm(g0, g1)); }
      const vs = [...new Set(rows.filter((x) => x.v !== "" && x.v != null).map((x) => Number(x.v)).filter(Number.isFinite))].sort((p, q) => p - q);
      const lo = iv[0][0], hi = iv[iv.length - 1][1]; vs.filter((v) => v < lo || v > hi).forEach((v) => out.push(String(v))); return out; })();
    const warn = mode === "range" ? (msgs[0] || (holes.length ? "구간에 포함되지 않는 숫자: " + holes.join(", ") : "")) : rBad ? `합이 ${rSum}예요. 합이 10이 되도록 나눠 주세요 (${rSum > 10 ? rd1(rSum - 10) + " 줄이기" : rd1(10 - rSum) + " 더 나누기"})` : "";
    const same = (a, b) => a.every((x, i) => x === b[i]);
    const setRow = (i, k, v) => setRg(rg.map((x, j) => (j === i ? (k === 0 ? [v, x[1]] : [x[0], v]) : x)));
    return h`<${PE.Dialog} open=${true} onClose=${onClose} mid><h2>4단계 변환</h2><p className="sub">${title} · ${it.name} · 기록 ${total}명</p>
      <div className="cv-body">
        <div className="sb-row cv-top"><span className="sb-lbl">방식</span><${PE.Seg} label="변환 방식" value=${mode} onChange=${setMode} options=${[{ value: "ratio", label: "비율로 나누기" }, { value: "range", label: "구간 직접 정하기" }]} /></div>
        ${mode === "ratio" ? h`<div className="cv-opts">
          <div className="sb-row"><span className="sb-lbl">좋은 기록</span><${PE.Seg} label="좋은 기록 방향" value=${dir} onChange=${setDir} options=${[{ value: "high", label: "높을수록" }, { value: "low", label: "낮을수록" }]} /></div>
          <div className="sb-row"><span className=${"sb-lbl cv-lblsum" + (rBad ? " bad" : "")}>비율<small>(${rd1(rSum)}/10)</small></span><div className="sb-chips">${PRESETS.map((q) => h`<button key=${q.t} type="button" className="cc" aria-pressed=${same(r, q.r)} onClick=${() => setRS(q.r.map(String))}>${q.t}</button>`)}</div></div></div>` : null}
        <div className="cv-rgs">${[0, 1, 2, 3].map((i) => h`<div key=${i} className=${"cv-rg" + (mode === "range" ? " rg" : "")}>
          <span className=${"ev-lv static lv" + i}>${LV_FULL[i]}</span>
          ${mode === "ratio" ? h`<${DecStepper} label=${LV_FULL[i] + " 비율"} max=${10} bad=${rBad} value=${rS[i]} onChange=${(v) => setRS(rS.map((x, j) => (j === i ? v : x)))} />`
            : h`<${DecStepper} label=${LV_FULL[i] + " 시작"} bad=${bc[i][0]} value=${rg[i][0]} onChange=${(v) => setRow(i, 0, v)} /><span className="cv-til">~</span><${DecStepper} label=${LV_FULL[i] + " 끝"} bad=${bc[i][1]} value=${rg[i][1]} onChange=${(v) => setRow(i, 1, v)} />`}
          <span className=${"cv-n num lv" + i}>${bad || rBad ? "–" : cnt[i] + "명"}</span>
          </div>`)}</div>
        <p className="cv-warn" role="alert">${warn}</p>
      </div>
      <div className="dialog-foot"><div>${conv && conv.on ? h`<${PE.Button} onClick=${onOff}>${I("swap")} 원래 점수로<//>` : null}</div>
        <div><${PE.Button} onClick=${onClose}>취소<//><${PE.Button} variant="primary" disabled=${bad || rBad || holes.length > 0 || !total} onClick=${() => onApply({ ...cv, on: true })}>변환하기<//></div></div><//>`;
  }

  /* 칸 표시: 점수·4단계 옆에서 눌러 재시험 표시 · 해제 (기록 값은 따로 두 번째 키 "항목id~"에 저장) */
  const MARKS = ["재시험"];
  function MarkBtn({ it, v, onSet }) {
    const i = MARKS.indexOf(v);
    return h`<button type="button" tabIndex="-1" className=${cn("ev-mk", i >= 0 && "on m" + i)} title=${(i >= 0 ? v + " · " : "") + "눌러서 재시험 표시 · 다시 누르면 해제"} aria-label=${it.name + " 표시 " + (i >= 0 ? v : "없음")} onClick=${() => onSet(i + 1 < MARKS.length ? MARKS[i + 1] : i < 0 ? MARKS[0] : "")}>${i >= 0 ? v : I("flag")}</button>`;
  }

  function ClassPanel({ cls, students, items, data, setVal, setConv, multi }) {
    const list = useMemo(() => students.filter((x) => x.grade === cls.grade && x.klass === cls.klass).sort((a, b) => a.number - b.number), [students, cls.key]);
    const its = items.filter((it) => !it.hidden && (!(it.grades || []).length || it.grades.includes(cls.grade)));
    const [cvId, setCvId] = useState(null);
    const filled = list.length * its.length ? Math.round((list.reduce((s, x) => s + its.filter((it) => { const v = (data[x.id] || {})[it.id]; return v !== "" && v != null; }).length, 0) / (list.length * its.length)) * 100) : 0;
    const convOf = (it) => (it.kind === "score" && it.conv && it.conv[cls.key]) || null;
    const lvMaps = {}; its.forEach((it) => { const cv = convOf(it); if (cv && cv.on) lvMaps[it.id] = levelsFor(list.map((x) => ({ id: x.id, v: (data[x.id] || {})[it.id] })), cv); });
    const cvIt = its.find((it) => it.id === cvId);
    const cell = (x, it, i) => { const inner = cell0(x, it, i); if (it.kind === "text") return inner; const m = (data[x.id] || {})[it.id + "~"];
      return h`<div className=${cn("ev-cw", m && "marked")}>${inner}<${MarkBtn} it=${it} v=${m} onSet=${(val) => setVal(x.id, it.id + "~", val)} /></div>`; };
    const cell0 = (x, it, i) => { const v = (data[x.id] || {})[it.id]; const cv = convOf(it);
      if (!cv) return h`<${Cell} it=${it} v=${v} onSet=${(val) => setVal(x.id, it.id, val)} />`;
      const on = !!cv.on; const k = on ? lvMaps[it.id].get(x.id) : undefined;
      return h`<div className=${cn("flip", on && "on")} style=${{ "--i": i }}><div className="flip-in"><div className="face f"><${Cell} it=${it} v=${v} onSet=${(val) => setVal(x.id, it.id, val)} /></div>
        <button type="button" tabIndex="-1" className=${cn("face b ev-lv", k != null && "lv" + k)} title="눌러서 원래 점수 보기" aria-label=${on ? (k != null ? LV_FULL[k] : "기록 없음") : undefined} onClick=${() => setConv(it.id, cls.key, { ...cv, on: false })}>${k != null ? LV[k] : h`<em>–</em>`}</button></div></div>`; };
    const head = (it) => { if (it.kind !== "score") return it.name; const cv = convOf(it);
      return h`<button type="button" className="th-btn" title="눌러서 점수를 4단계로 바꿔 보기" onClick=${() => setCvId(it.id)}>${it.name}${I("swap")}${cv && cv.on ? h`<em>4단계</em>` : null}</button>`; };
    return h`<section className=${cn("card roster-panel", multi && "multi")} style=${{ "--tag": PE.GRADE_COLORS[cls.grade] }}>
      <div className="card-head tight"><div className="card-title"><span className="rp-dot"></span>${cls.grade}학년 ${cls.klass}반 <span className="card-sub num">${list.length}명${its.length ? ` · 입력 ${filled}%` : ""}</span></div></div>
      ${!list.length ? h`<p className="card-sub">명렬표에 학생이 없어요.</p>` : !its.length ? h`<p className="card-sub">이 학년에 해당하는 평가 항목이 없어요. ‘항목 관리’에서 만들어 주세요.</p>` : h`<div className="paps-scroll"><table className="ev-t"><thead><tr><th>번호</th><th className="l">이름</th><th>성별</th>${its.map((it) => h`<th key=${it.id}>${head(it)}</th>`)}</tr></thead>
        <tbody>${list.map((x, i) => h`<tr key=${x.id}><td className="num">${x.number}</td><td className="l"><b><${PE.Nm} name=${x.name} /></b></td><td><span className=${"g-pill " + x.gender}>${x.gender === "M" ? "남" : x.gender === "F" ? "여" : "–"}</span></td>${its.map((it) => h`<td key=${it.id} className=${"k-" + it.kind}>${cell(x, it, i)}</td>`)}</tr>`)}</tbody></table></div>`}
      ${cvIt ? h`<${ConvDialog} it=${cvIt} title=${`${cls.grade}학년 ${cls.klass}반`} rows=${list.map((x) => ({ id: x.id, v: (data[x.id] || {})[cvIt.id] }))} conv=${convOf(cvIt)} onClose=${() => setCvId(null)}
        onApply=${(cv) => { setConv(cvIt.id, cls.key, cv); setCvId(null); }} onOff=${() => { setConv(cvIt.id, cls.key, { ...convOf(cvIt), on: false }); setCvId(null); }} />` : null}</section>`;
  }

  function Evaluation() {
    const S = PE.useStore(); const { yd } = S; const classes = PE.myClasses(yd); const ev = norm(yd.evals);
    const N = Math.min(4, Math.max(1, S.state.prefs.evalCols || 1));
    const [sel, setSel] = PE.useSaved("evalSel", null); const [open, setOpen] = useState(false);
    const keys = classes.map((c) => c.key);
    const shown = sel === null ? keys.slice(0, 1) : sel.filter((k) => keys.includes(k));
    const pick = (k) => setSel(shown.includes(k) ? shown.filter((x) => x !== k) : [...shown, k]);
    const upd = (fn) => S.updYear((y) => ({ ...y, evals: fn(norm(y.evals)) }));
    const setConv = (iid, key, cv) => upd((e) => ({ ...e, items: e.items.map((x) => (x.id === iid ? { ...x, conv: { ...(x.conv || {}), [key]: cv } } : x)) }));
    const setVal = (sid, iid, v) => upd((e) => ({ ...e, data: { ...e.data, [sid]: { ...(e.data[sid] || {}), [iid]: v } } }));
    const grades = [...new Set(classes.map((c) => c.grade))].sort();
    return h`<div className="page">
      <div className="roster-bar">
        <div className="roster-tabs">${classes.map((c) => h`<button key=${c.key} type="button" className="cc roster-tab" aria-pressed=${shown.includes(c.key)} style=${{ "--tag": PE.GRADE_COLORS[c.grade] }} onClick=${() => pick(c.key)}>${c.key}</button>`)}</div>
        <span className="grow"></span>
        <div className="bar-btns"><${PE.Cycle} label="한 화면에 보는 반 수" value=${N} onChange=${(n) => S.setPref("evalCols", n)} options=${COLS} />
          <${PE.Button} size="sm" onClick=${() => setOpen(true)}>${I("settings")} 항목 관리<//></div></div>
      ${classes.length === 0 ? h`<section className="card"><p className="empty-note" style=${{ marginTop: 0 }}><a href="#settings" style=${{ color: "var(--primary)", fontWeight: 700 }}>기본 설정</a>에서 담당 학급을 먼저 골라 주세요.</p></section>` : null}
      <div className="roster-grid" style=${{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>${classes.filter((c) => shown.includes(c.key)).map((c) => h`<${ClassPanel} key=${c.key} cls=${c} students=${yd.students} items=${ev.items} data=${ev.data} setVal=${setVal} setConv=${setConv} multi=${N > 1} />`)}</div>
      <${ItemsDialog} open=${open} onClose=${() => setOpen(false)} ev=${ev} grades=${grades} upd=${upd} />
    </div>`;
  }
  PE.evalProgress = (yd, keys) => { const ev = norm(yd.evals); let f = 0, t = 0;
    for (const k of keys) { const [g, kl] = k.split("-").map(Number); const its = ev.items.filter((it) => !it.hidden && (!(it.grades || []).length || it.grades.includes(g))); const st = yd.students.filter((x) => x.grade === g && x.klass === kl);
      t += its.length * st.length; for (const x of st) for (const it of its) { const v = (ev.data[x.id] || {})[it.id]; if (v !== "" && v != null) f++; } }
    return t ? Math.round((f / t) * 100) : null; };
  PE.pages = PE.pages || {};
  PE.pages.eval = Evaluation;
})();
