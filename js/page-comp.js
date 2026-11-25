/* 대회 운영: 리그 · 토너먼트 만들기, 경기 기록, 순위표, 대진표 */
(function () {
  const PE = window.PE, React = window.React, h = PE.h, cn = PE.cn, I = PE.I;
  const { useState, useMemo, useRef } = React; const ReactDOM = window.ReactDOM;
  const shuffleArr = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- 경기 만들기 ---------- */
  /* 리그: 모든 팀이 서로 한 번(또는 두 번)씩. 라운드마다 한 팀은 한 경기만 */
  function leagueMatches(ids, legs, courts) {
    const t = [...ids]; if (t.length % 2) t.push(null);
    const n = t.length; let arr = [...t]; const base = [];
    for (let r = 0; r < n - 1; r++) {
      const ms = [];
      for (let i = 0; i < n / 2; i++) { const a = arr[i], b = arr[n - 1 - i]; if (a && b) ms.push(r % 2 ? [b, a] : [a, b]); }
      base.push(ms); arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
    }
    const all = legs === 2 ? [...base, ...base.map((ms) => ms.map(([a, b]) => [b, a]))] : base;
    const out = []; let no = 0;
    all.forEach((ms, r) => ms.forEach(([a, b], i) => out.push({ id: PE.uid(), round: r, a, b, no: ++no, court: (i % courts) + 1 })));
    return out;
  }
  /* 빅매치 참가자는 높은 시드(결승·준결승에서 만나는 자리)부터 앉힌다 */
  const arrangeIds = (ids, big) => [...ids.filter((i) => big[i]), ...ids.filter((i) => !big[i])];
  const seedOrder = (slots) => { const seeds = seedsFor(slots.length); return slots.map((id, k) => ({ id, sd: seeds[k] })).filter((x) => x.id).sort((a, b) => a.sd - b.sd).map((x) => x.id); };
  /* 토너먼트 자리: 2의 거듭제곱 칸에 채우고, 남는 칸은 부전승 */
  function seedsFor(len) { let size = 2; while (size < len) size *= 2; let seeds = [1, 2]; while (seeds.length < size) { const n = seeds.length * 2 + 1; seeds = seeds.flatMap((x) => [x, n - x]); } return seeds; }
  function makeSlots(ids) {
    const seeds = seedsFor(ids.length);
    return seeds.map((sd) => ids[sd - 1] || null); /* 부전승은 위 시드에게, 대진표 양쪽에 고르게 */
  }
  const roundName = (cnt) => (cnt === 1 ? "결승" : cnt === 2 ? "준결승" : `${cnt * 2}강`);
  function bracket(c) {
    const size = c.slots.length, R = Math.round(Math.log2(size)); const rounds = []; let no = 0;
    for (let r = 0; r < R; r++) {
      const cnt = size >> (r + 1), ms = [];
      for (let i = 0; i < cnt; i++) {
        let a, b, bye = false;
        if (r === 0) { a = c.slots[2 * i]; b = c.slots[2 * i + 1]; bye = !a || !b; } else { a = rounds[r - 1][2 * i].w; b = rounds[r - 1][2 * i + 1].w; }
        const key = `t${r}-${i}`, res = a && b ? c.res[key] : null;
        const m = { key, r, i, a, b, bye, res, name: roundName(cnt) };
        m.w = bye ? (a || b) : res ? (res.w === "a" ? a : res.w === "b" ? b : null) : null;
        m.l = !bye && res ? (res.w === "a" ? b : res.w === "b" ? a : null) : null;
        ms.push(m);
      }
      let k = 0, rn = 0; ms.forEach((m) => { if (!m.bye) { m.rn = ++rn; m.no = ++no; m.court = (k++ % c.courts) + 1; } });
      rounds.push(ms);
    }
    let third = null;
    if (c.third && R >= 2) { const sf = rounds[R - 2]; const a = sf[0].l, b = sf[1].l; third = { key: "third", a, b, res: a && b ? c.res.third : null, name: "3·4위전", court: 1 }; }
    return { rounds, third, final: rounds[R - 1][0] };
  }

  /* ---------- 순위 ---------- */
  function standings(c) {
    const T = new Map(c.entrants.map((e) => [e.id, { id: e.id, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0 }]));
    for (const m of c.matches) { const r = c.res[m.id]; if (!r) continue; const A = T.get(m.a), B = T.get(m.b); if (!A || !B) continue; A.p++; B.p++;
      if (r.sa != null) { A.f += r.sa; A.a += r.sb; B.f += r.sb; B.a += r.sa; }
      if (r.w === "a") { A.w++; B.l++; } else if (r.w === "b") { B.w++; A.l++; } else { A.d++; B.d++; } }
    const rows = [...T.values()].map((x) => ({ ...x, pts: x.w * c.pts.w + x.d * c.pts.d + x.l * c.pts.l, diff: x.f - x.a }));
    const h2h = (x, y) => { let s = 0; for (const m of c.matches) { const r = c.res[m.id]; if (!r) continue; if (m.a === x.id && m.b === y.id) s += r.w === "a" ? 1 : r.w === "b" ? -1 : 0; else if (m.a === y.id && m.b === x.id) s += r.w === "b" ? 1 : r.w === "a" ? -1 : 0; } return s; };
    const order = c.entrants.map((e) => e.id);
    rows.sort((x, y) => y.pts - x.pts || (c.tie === "h2h" ? h2h(y, x) : 0) || y.diff - x.diff || y.f - x.f || y.w - x.w || (c.tie !== "h2h" ? h2h(y, x) : 0) || order.indexOf(x.id) - order.indexOf(y.id));
    let rank = 0; rows.forEach((r, i) => { const p = rows[i - 1]; if (!p || p.pts !== r.pts || p.diff !== r.diff || p.f !== r.f || p.w !== r.w) rank = i + 1; r.rank = rank; });
    return rows;
  }

  const SCORING = [{ value: "score", label: "득점·실점" }, { value: "sets", label: "세트 스코어" }, { value: "wdl", label: "승·무·패" }];
  const scText = (c, r) => (!r ? "vs" : c.scoring === "wdl" ? (r.w === "a" ? "승 : 패" : r.w === "b" ? "패 : 승" : "무 : 무") : `${r.sa} : ${r.sb}`);

  /* ---------- 대회 만들기 안내 창 ---------- */
  const row = (label, sub, ctl) => h`<div className="set-row"><span><b>${label}</b>${sub ? h`<br /><small className="card-sub">${sub}</small>` : null}</span>${ctl}</div>`;
  /* 경기 규칙 입력 (만들 때와 고칠 때 같이 써요) */
  function RulesBody({ d, set, isL, lock }) {
    return h`<${React.Fragment}>
        ${isL ? h`<div className="wiz-sec"><b className="sec-t">리그</b>
          ${row("경기 횟수", lock.legs ? "기록이 있어서 바꿀 수 없어요" : "서로 몇 번씩 만나는지", h`<${PE.Seg} label="경기 횟수" value=${d.legs} onChange=${(v) => set("legs", v)} options=${[{ value: 1, label: "한 번씩" }, { value: 2, label: "두 번씩" }].map((o) => ({ ...o, disabled: lock.legs && o.value !== d.legs }))} />`)}
          ${row("무승부", lock.noDraw ? "무승부 기록이 있어서 끌 수 없어요" : "", h`<${PE.Seg} label="무승부" value=${d.draw ? "y" : "n"} onChange=${(v) => set("draw", v === "y")} options=${[{ value: "n", label: "없음", disabled: lock.noDraw }, { value: "y", label: "있음" }]} />`)}
          ${row("승점", "승 · 무 · 패", h`<span className="pts-in">${["w", "d", "l"].map((k) => (k === "d" && !d.draw ? null : h`<label key=${k}>${{ w: "승", d: "무", l: "패" }[k]}<${PE.NumIn} label=${"승점 " + k} max=${9} value=${d.pts[k]} onChange=${(v) => set("pts", { ...d.pts, [k]: v })} /></label>`))}</span>`)}
          ${row("승점이 같을 때", "", h`<${PE.Seg} label="동률 기준" value=${d.scoring === "wdl" ? "h2h" : d.tie} onChange=${(v) => set("tie", v)} options=${d.scoring === "wdl" ? [{ value: "h2h", label: "승자승 먼저" }] : [{ value: "diff", label: "득실차 먼저" }, { value: "h2h", label: "승자승 먼저" }]} />`)}</div>`
        : h`<div className="wiz-sec"><b className="sec-t">토너먼트</b>
          ${row("3·4위전", "", h`<${PE.Seg} label="3·4위전" value=${d.third ? "y" : "n"} onChange=${(v) => set("third", v === "y")} options=${[{ value: "n", label: "없음" }, { value: "y", label: "진행" }]} />`)}
          ${lock.edit ? null : row("대진 배치", "", h`<${PE.Seg} label="대진 배치" value=${d.seed} onChange=${(v) => set("seed", v)} options=${[{ value: "random", label: "무작위" }, { value: "order", label: "고른 순서" }]} />`)}</div>`}
        <div className="wiz-sec"><b className="sec-t">기록</b>
          ${row("기록 방식", lock.scoring ? "기록이 있어서 바꿀 수 없어요" : d.scoring === "score" ? "양쪽 점수를 모두 적어요" : d.scoring === "sets" ? "이긴 세트 수만 적어요 (예 2:1)" : "누가 이겼는지만 적어요", h`<${PE.Seg} label="기록 방식" value=${d.scoring} onChange=${(v) => set("scoring", v, v === "wdl" ? { tie: "h2h" } : null)} options=${SCORING.map((o) => ({ ...o, disabled: lock.scoring && o.value !== d.scoring }))} />`)}
          ${d.scoring === "score" ? row("목표 점수", "먼저 이 점수에 닿으면 끝", h`<span className="unit-in"><${PE.Seg} label="목표 점수" value=${d.useTarget ? "y" : "n"} onChange=${(v) => set("useTarget", v === "y")} options=${[{ value: "n", label: "없음" }, { value: "y", label: "있음" }]} />${d.useTarget ? h`<${PE.NumStepper} label="목표 점수" min=${1} max=${99} value=${d.target} onChange=${(v) => set("target", v)} />` : null}</span>`) : null}
          ${d.scoring === "sets" ? row("세트 수", `${Math.ceil(d.sets / 2)}세트를 먼저 따면 승리`, h`<${PE.Seg} label="세트 수" value=${d.sets} onChange=${(v) => set("sets", v)} options=${[{ value: 1, label: "단판" }, { value: 3, label: "3세트" }, { value: 5, label: "5세트" }].map((o) => ({ ...o, disabled: lock.scoring && o.value !== d.sets }))} />`) : null}</div>
        <div className="wiz-sec"><b className="sec-t">경기장</b>
          ${row("경기장 수", "경기를 경기장에 차례로 자동 배치해요", h`<${PE.Stepper} label="경기장 수" min=${1} max=${8} value=${d.courts} onChange=${(v) => set("courts", v)} />`)}</div><//>`;
  }

  /* 만든 대회의 설정 고치기 */
  function CompEdit({ c, onSave, onClose }) {
    const played = Object.keys(c.res || {}).length > 0; const isL = c.format === "league";
    const hasDraw = Object.values(c.res || {}).some((r) => r && r.w === "d");
    const [d, setD] = useState({ name: c.name, legs: c.legs, pts: { ...c.pts }, draw: !!c.draw, tie: c.tie, third: !!c.third, scoring: c.scoring, useTarget: !!c.target, target: c.target || 11, sets: c.sets || 3, courts: c.courts });
    const set = (k, v, x) => setD({ ...d, [k]: v, ...(x || {}) });
    return h`<${PE.Dialog} open=${true} onClose=${onClose}><h2>대회 설정</h2>
      <p className="sub">${played ? "경기 기록이 있어서 일부 항목은 바꿀 수 없어요. 승점 같은 규칙은 바꾸면 지금까지의 기록에도 바로 적용돼요." : "아직 기록이 없어서 모든 규칙을 바꿀 수 있어요."}</p>
      <div className="wiz-body" style=${{ minHeight: 0, marginTop: 12 }}>
        <div className="field"><label htmlFor="cp-ed-nm">대회 이름</label><input id="cp-ed-nm" className="input" value=${d.name} onChange=${(e) => set("name", e.target.value)} /></div>
        <${RulesBody} d=${d} set=${set} isL=${isL} lock=${{ edit: true, legs: played, scoring: played, noDraw: hasDraw }} /></div>
      <div className="dialog-foot"><div></div><div><${PE.Button} onClick=${onClose}>취소<//><${PE.Button} variant="primary" disabled=${!d.name.trim()} onClick=${() => onSave(d)}>저장<//></div></div><//>`;
  }

  /* 팀 나누기 화면 (대회 만들기 · 팀 수정에서 같이 써요) */
  function TeamBoard({ students, classes, teams, setTeams, pool, setPool, lockCount }) {
    const [pick, setPick] = useState(null); const [sepG, setSepG] = useState(false);
    const [drag, setDrag] = useState(null); const noClick = useRef(0);
    const chipDown = (e, id, from) => {
      if (e.button > 0) return; e.stopPropagation(); const sx = e.clientX, sy = e.clientY; let moved = false;
      const cardAt = (ev) => { const el = document.elementFromPoint(ev.clientX, ev.clientY); const c = el && el.closest("[data-team]"); return c ? c.dataset.team : null; };
      const mv = (ev) => { if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; moved = true; setDrag({ id, x: ev.clientX, y: ev.clientY, over: cardAt(ev) }); };
      const up = (ev) => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
        if (!moved) return; noClick.current = Date.now(); const to = ev.type === "pointerup" ? cardAt(ev) : null; setDrag(null);
        if (to && to !== from) { setTeams((ts) => ts.map((t) => ({ ...t, members: t.id === to ? [...t.members, id] : t.members.filter((x) => x !== id) }))); setPool((p) => { const q = p.filter((x) => x !== id); return to === "pool" ? [...q, id] : q; }); } };
      window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up); };
    const byId = useMemo(() => new Map(students.map((x) => [x.id, x])), [students]);
    const setTeamCount = (k) => setTeams(k > teams.length ? [...teams, ...Array.from({ length: k - teams.length }, (_, i) => ({ id: PE.uid(), name: `${teams.length + i + 1}팀`, members: [] }))] : teams.slice(0, k));
    const pickDone = (ids) => { const keep = new Set(ids); const inTeam = new Set(teams.flatMap((t) => t.members).filter((x) => keep.has(x)));
      setTeams(teams.map((t) => ({ ...t, members: t.members.filter((x) => keep.has(x)) }))); setPool([...pool.filter((x) => keep.has(x)), ...ids.filter((x) => !inTeam.has(x) && !pool.includes(x))]); };
    const randomAssign = () => {
      const T = teams.length; const gOf = (id) => (byId.get(id) || {}).gender; const all = [...teams.flatMap((t) => t.members), ...pool]; const mem = teams.map(() => []);
      const ms = shuffleArr(all.filter((i) => gOf(i) === "M")), fs = shuffleArr(all.filter((i) => gOf(i) === "F")), rest = shuffleArr(all.filter((i) => gOf(i) !== "M" && gOf(i) !== "F"));
      const sep = sepG && T >= 2 && ms.length && fs.length; const tm = sep ? Math.min(T - 1, Math.max(1, Math.round((T * ms.length) / (ms.length + fs.length)))) : T;
      const put = (id, from, to) => { let best = [], min = 1e9; for (let i = from; i < to; i++) { if (mem[i].length < min) { min = mem[i].length; best = [i]; } else if (mem[i].length === min) best.push(i); } mem[best[Math.floor(Math.random() * best.length)]].push(id); };
      ms.forEach((id) => put(id, 0, tm)); fs.forEach((id) => (sep ? put(id, tm, T) : put(id, 0, T))); rest.forEach((id) => put(id, 0, T));
      setTeams(teams.map((t, i) => ({ ...t, members: mem[i] }))); setPool([]); };
    const gc = (ids, inp) => { const g = (k) => ids.filter((id) => (byId.get(id) || {}).gender === k).length; return h`<span className=${cn("gcnt num", inp && "in")}><b className="gm">♂ ${g("M")}</b><b className="gf">♀ ${g("F")}</b></span>`; };
    const chip = (x, from) => h`<span key=${x.id} className=${cn("sp-chip static", x.gender, drag && drag.id === x.id && "dragging")} onPointerDown=${(e) => chipDown(e, x.id, from)}><small className="num">${x.grade}-${x.klass}</small><b><${PE.Nm} name=${x.name} /></b><span className="sx">${x.gender === "M" ? "♂" : x.gender === "F" ? "♀" : ""}</span></span>`;
    return h`<div>
          ${lockCount ? null : h`<div className="set-row"><span><b>팀 수</b></span><${PE.Stepper} label="팀 수" min=${2} max=${32} value=${teams.length} onChange=${setTeamCount} /></div>`}
          <div className="team-auto"><${PE.Button} size="sm" onClick=${() => setPick("auto")}>${I("person")} 학생 선택<//><${PE.Seg} label="랜덤 배정 방식" value=${sepG ? "s" : "m"} onChange=${(v) => setSepG(v === "s")} options=${[{ value: "m", label: "남녀 섞어서" }, { value: "s", label: "남녀 따로" }]} /><${PE.Button} size="sm" disabled=${!(pool.length || teams.some((t) => t.members.length))} onClick=${randomAssign} title="누를 때마다 다시 섞어요">${I("wand")} 랜덤 배정<//></div>
          <div data-team="pool" className=${cn("team-pool", drag && drag.over === "pool" && "drop")}><div className="pool-head"><b>미배정</b><span className="card-sub num">${pool.length}명</span>${gc(pool)}</div>${pool.length ? h`<div className="pool-chips">${pool.map((id) => byId.get(id)).filter(Boolean).map((x) => chip(x, "pool"))}</div>` : h`<span className="card-sub">‘학생 선택’으로 고른 학생이 여기에 모여요. 끌어서 팀에 넣거나 ‘랜덤 배정’을 눌러요.</span>`}</div>
          <div className="team-grid">${teams.map((t, i) => h`<div key=${t.id} data-team=${t.id} className=${cn("team-card", drag && drag.over === t.id && "drop")}><div className="team-name"><input className="input" aria-label=${`${i + 1}번째 팀 이름`} value=${t.name} onChange=${(e) => setTeams(teams.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))} />${gc(t.members, true)}</div>
            <button type="button" className="team-mem" onClick=${() => { if (Date.now() - noClick.current > 300) setPick(t.id); }}>${t.members.length ? h`<span className="team-chips">${t.members.map((id) => byId.get(id)).filter(Boolean).map((x) => chip(x, t.id))}</span>` : h`<em>${I("plus", "")} 학생 넣기</em>`}</button></div>`)}</div>
      ${drag && byId.get(drag.id) ? ReactDOM.createPortal(h`<span className=${cn("sp-chip ghost", byId.get(drag.id).gender)} style=${{ left: drag.x, top: drag.y }}><small className="num">${byId.get(drag.id).grade}-${byId.get(drag.id).klass}</small><b><${PE.Nm} name=${byId.get(drag.id).name} /></b></span>`, document.body) : null}
      ${pick === "auto" ? h`<${PE.StudentPicker} title="참가 학생" students=${students} classes=${classes} value=${[...teams.flatMap((t) => t.members), ...pool]} onClose=${() => setPick(null)} onDone=${(ids) => { pickDone(ids); setPick(null); }} />` : null}
      ${pick && pick !== "auto" ? h`<${PE.StudentPicker} tagOf=${Object.fromEntries(teams.filter((t) => t.id !== pick).flatMap((t) => t.members.map((id) => [id, t.name])))} title=${(teams.find((t) => t.id === pick) || {}).name + " 학생"} students=${students} classes=${classes} value=${(teams.find((t) => t.id === pick) || { members: [] }).members} onClose=${() => setPick(null)} onDone=${(ids) => { setPool(pool.filter((x) => !ids.includes(x))); setTeams(teams.map((t) => (t.id === pick ? { ...t, members: ids } : { ...t, members: t.members.filter((x) => !ids.includes(x)) }))); setPick(null); }} />` : null}</div>`;
  }

  function CompWizard({ students, classes, onClose, onCreate }) {
    const [step, setStep] = useState(0);
    const [d, setD] = useState({ name: "", format: "league", legs: 1, pts: { w: 2, d: 1, l: 0 }, draw: false, tie: "diff", third: false, seed: "random", scoring: "score", useTarget: false, target: 11, sets: 3, courts: 1, unit: "individual" });
    const [people, setPeople] = useState([]); const [cls, setCls] = useState([]);
    const [teams, setTeams] = useState(() => [1, 2, 3, 4].map((n) => ({ id: PE.uid(), name: `${n}팀`, members: [] })));
    const [pool, setPool] = useState([]);
    const set = (k, v, x) => setD({ ...d, [k]: v, ...(x || {}) });
    const byId = useMemo(() => new Map(students.map((x) => [x.id, x])), [students]);
    const STEPS = ["대회 방식", "참가 단위", "경기 규칙", "참가자"];
    const isL = d.format === "league";
    const entrants = d.unit === "individual" ? people.map((id) => byId.get(id)).filter(Boolean).map((x) => ({ id: PE.uid(), name: x.name, sub: `${x.grade}-${x.klass}`, grade: x.grade, members: [x.id] }))
      : d.unit === "class" ? classes.filter((c) => cls.includes(c.key)).map((c) => ({ id: PE.uid(), name: c.key, grade: c.grade, members: [] }))
      : teams.map((t) => ({ id: t.id, name: t.name.trim() || "이름 없는 팀", members: t.members }));
    const n = entrants.length;
    const games = isL ? (n * (n - 1) / 2) * d.legs : Math.max(0, n - 1) + (d.third && n >= 4 ? 1 : 0);
    const ok = [d.name.trim().length > 0, true, true, n >= 2][step];
    const create = () => {
      const es = d.format === "tournament" && d.seed === "random" ? shuffleArr(entrants) : entrants; const ids = es.map((e) => e.id);
      const c = { id: PE.uid(), name: d.name.trim(), format: d.format, legs: d.legs, pts: d.pts, draw: isL && d.draw, tie: d.scoring === "wdl" ? "h2h" : d.tie, third: d.third, scoring: d.scoring, target: d.scoring === "score" && d.useTarget ? d.target : null, sets: d.sets, courts: d.courts, unit: d.unit, entrants: es, res: {}, created: PE.today() };
      if (isL) c.matches = leagueMatches(ids, d.legs, d.courts); else c.slots = makeSlots(ids);
      onCreate(c);
    };
    const big = (key, val, icon, title, desc) => h`<button type="button" className="opt-card" aria-pressed=${d[key] === val} onClick=${() => set(key, val)}>${I(icon)}<b>${title}</b><span>${desc}</span></button>`;
    return h`<${PE.Dialog} open=${true} onClose=${onClose} wide=${step === 3 && (d.unit === "individual" || d.unit === "team")}><h2>대회 만들기</h2>
      <${PE.Steps} steps=${STEPS} at=${step} />
      ${step === 0 ? h`<div className="wiz-body">
        <div className="field"><label htmlFor="cp-nm">대회 이름</label><input id="cp-nm" className="input" autoFocus placeholder="예: 5학년 피구 리그" value=${d.name} onChange=${(e) => set("name", e.target.value)} /></div>
        <div className="opt-grid">${big("format", "league", "grid", "리그", "모든 참가자가 서로 겨루고 승점으로 순위를 정해요")}${big("format", "tournament", "trophy", "토너먼트", "지면 탈락, 이기면 다음 경기로 올라가요")}</div></div>` : null}
      ${step === 2 ? h`<div className="wiz-body"><${RulesBody} d=${d} set=${set} isL=${isL} lock=${{}} /></div>` : null}
      ${step === 1 ? h`<div className="wiz-body" style=${{ minHeight: 0 }}><div className="opt-grid three">
        ${big("unit", "individual", "person", "개인", "학생 한 명 한 명이 참가해요")}${big("unit", "team", "team3", "팀", "학생들을 모아 팀을 만들어요")}${big("unit", "class", "school", "학급", "반끼리 겨뤄요")}</div></div>` : null}
      ${step === 3 ? h`<div className="wiz-body">
        ${d.unit === "class" ? h`<div className="field"><label>참가 학급</label><div className="cc-wrap md"><div className="cc-row">${classes.map((c) => h`<button key=${c.key} type="button" className="cc" style=${{ "--tag": PE.GRADE_COLORS[c.grade] }} aria-pressed=${cls.includes(c.key)} onClick=${() => setCls(cls.includes(c.key) ? cls.filter((x) => x !== c.key) : [...cls, c.key])}>${c.key}</button>`)}</div></div>
          ${!classes.length ? h`<p className="card-sub">기본 설정에서 담당 학급을 먼저 골라 주세요.</p>` : null}</div>` : null}
        ${d.unit === "individual" ? h`<${PE.StudentPickBody} students=${students} classes=${classes} sel=${people} setSel=${setPeople} />` : null}
        ${d.unit === "team" ? h`<${TeamBoard} students=${students} classes=${classes} teams=${teams} setTeams=${setTeams} pool=${pool} setPool=${setPool} />` : null}
        <p className="wiz-note num">${n < 2 ? "참가자를 둘 이상 골라 주세요." : h`참가 <b>${n}</b>${d.unit === "class" ? "학급" : d.unit === "team" ? "팀" : "명"} · 모두 <b>${games}경기</b>${!isL && (n & (n - 1)) ? ` · 부전승 ${makeSlots(entrants).length - n}` : ""}`}</p></div>` : null}
      <div className="dialog-foot"><div>${step > 0 ? h`<${PE.Button} onClick=${() => setStep(step - 1)}>이전<//>` : null}</div>
        <div><${PE.Button} onClick=${onClose}>취소<//>${step < 3 ? h`<${PE.Button} variant="primary" disabled=${!ok} onClick=${() => setStep(step + 1)}>다음<//>` : h`<${PE.Button} variant="primary" disabled=${!ok} onClick=${create}>대회 만들기<//>`}</div></div><//>`;

  }

  /* 팀 대회: 대회 만들기의 팀 나누기 화면으로 고쳐요 */
  function TeamEdit({ c, students, onClose, onSave }) {
    const S = PE.useStore(); const classes = PE.myClasses(S.yd);
    const [teams, setTeams] = useState(() => c.entrants.map((e) => ({ id: e.id, name: e.name, members: e.members || [] }))); const [pool, setPool] = useState([]);
    return h`<${PE.Dialog} open=${true} onClose=${onClose} wide><h2>팀 수정</h2>
      <div className="wiz-body"><${TeamBoard} students=${students} classes=${classes} teams=${teams} setTeams=${setTeams} pool=${pool} setPool=${setPool} lockCount=${true} />
        <p className="wiz-note">팀 수는 대진이 이미 만들어져 있어서 바꿀 수 없어요. 경기 기록은 그대로예요.${pool.length ? ` 미배정 ${pool.length}명은 대회에서 빠져요.` : ""}</p></div>
      <div className="dialog-foot"><div></div><div><${PE.Button} onClick=${onClose}>취소<//><${PE.Button} variant="primary" onClick=${() => onSave(teams)}>저장<//></div></div><//>`;
  }

  /* ---------- 경기 결과 적기 ---------- */
  function ResultDialog({ c, m, nm, onSave, onClose }) {
    const r = m.res; const needWinner = c.format === "tournament" || !c.draw;
    const [sa, setSa] = useState(r && r.sa != null ? r.sa : 0); const [sb, setSb] = useState(r && r.sb != null ? r.sb : 0);
    const max = c.scoring === "sets" ? Math.ceil(c.sets / 2) : 999;
    const tied = sa === sb; const blocked = tied && needWinner;
    const save = () => onSave({ sa, sb, w: sa > sb ? "a" : sb > sa ? "b" : "d" });
    const goal = c.scoring === "sets" ? max : c.target || 0;
    const win = (setMine, other, setOther) => { setMine(goal); if (other >= goal) setOther(Math.max(0, goal - 1)); };
    const side = (v, setV, name, o, setO) => h`<div className="res-side">${goal ? h`<button type="button" className=${cn("win-btn", v === goal && o < goal && "on")} onClick=${() => win(setV, o, setO)}>${name} 승리</button>` : h`<b className="res-nm">${name}</b>`}
      <${PE.NumStepper} tone label=${name + " 점수"} min=${0} max=${max} value=${v} onChange=${setV} /></div>`;
    return h`<${PE.Dialog} open=${true} onClose=${onClose} mid>
      <div className="stu-head"><h2>${m.name || `${m.round + 1}라운드`}</h2>${m.rn ? (m.name === "결승" ? null : h`<span className="badge num">${m.rn}경기</span>`) : m.no ? h`<span className="badge num">${m.no}경기</span>` : null}${c.courts > 1 && m.court ? h`<span className="badge num">${m.court}경기장</span>` : null}</div>
      ${c.scoring === "wdl" ? h`<div className="wdl">
        <button type="button" className="opt-card" aria-pressed=${!!r && r.w === "a"} onClick=${() => onSave({ sa: null, sb: null, w: "a" })}><b>${nm(m.a)}</b><span>승리</span></button>
        ${needWinner ? null : h`<button type="button" className="opt-card" aria-pressed=${!!r && r.w === "d"} onClick=${() => onSave({ sa: null, sb: null, w: "d" })}><b>무승부</b><span> </span></button>`}
        <button type="button" className="opt-card" aria-pressed=${!!r && r.w === "b"} onClick=${() => onSave({ sa: null, sb: null, w: "b" })}><b>${nm(m.b)}</b><span>승리</span></button></div>`
      : h`<div><div className="res-grid">${side(sa, setSa, nm(m.a), sb, setSb)}${side(sb, setSb, nm(m.b), sa, setSa)}</div>
        <p className="card-sub" style=${{ textAlign: "center", marginTop: 10 }}>${c.scoring === "sets" ? `${c.sets}세트 경기 · ${max}세트 먼저` : c.target ? `목표 ${c.target}점 · ‘승리’ 버튼을 누르면 이긴 쪽에 목표 점수가 들어가요` : " "}</p>
</div>`}
      <div className="dialog-foot"><div>${r ? h`<${PE.Button} variant="danger" onClick=${() => onSave(null)}>${I("trash")} 기록 지우기<//>` : null}</div>
        <div><${PE.Button} onClick=${onClose}>취소<//>${c.scoring === "wdl" ? null : h`<${PE.Button} variant="primary" disabled=${blocked} onClick=${save}>저장<//>`}</div></div><//>`;
  }

  /* 손잡이를 잡고 위아래로 순서를 바꾸는 목록 (끌면 다른 줄이 실시간으로 비켜줘요) */
  function MatchList({ ms, row, onReorder, style }) {
    const [dg, setDg] = useState(null); const refs = useRef({}); const st = useRef(null);
    const down = (e, i) => {
      e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId);
      const r = ms.map((x) => refs.current[x.key].getBoundingClientRect()); const gap = r.length > 1 ? r[1].top - r[0].bottom : 0;
      st.current = { i, y0: e.clientY, sc0: window.scrollY, h: r[i].height + gap, n: ms.length };
      setDg({ i, to: i, dy: 0, h: st.current.h, settle: false });
    };
    const calc = (e) => { const s = st.current; const dy = e.clientY - s.y0 + (window.scrollY - s.sc0); return { dy, to: Math.min(s.n - 1, Math.max(0, Math.round(s.i + dy / s.h))) }; };
    const move = (e) => { const s = st.current; if (!s || !dg || dg.settle) return;
      if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 14); else if (e.clientY < 70) window.scrollBy(0, -14);
      setDg({ ...dg, ...calc(e) }); };
    const up = (e) => { const s = st.current; if (!s || !dg || dg.settle) return; const { to } = calc(e); st.current = null;
      setDg({ ...dg, to, dy: (to - s.i) * s.h, settle: true });
      setTimeout(() => { setDg(null); onReorder(s.i, to); }, 190); };
    return h`<div className="ml" style=${style}>${ms.map((x, j) => { let ty = 0; let cls = "ml-i";
      if (dg) { if (j === dg.i) { ty = dg.dy; cls += dg.settle ? " drag settle" : " drag"; } else if (dg.i < dg.to && j > dg.i && j <= dg.to) ty = -dg.h; else if (dg.to < dg.i && j >= dg.to && j < dg.i) ty = dg.h; }
      return h`<div key=${x.key} ref=${(el) => { refs.current[x.key] = el; }} className=${cls} style=${{ transform: ty ? `translateY(${ty}px)` : undefined }}>
        <button type="button" className="ml-grip" aria-label="끌어서 순서 바꾸기" onPointerDown=${(e) => down(e, j)} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up}>${I("grip")}</button>${row(x)}</div>`; })}</div>`;
  }

  /* 경기 결과 한 건을 대회에 적용 (토너먼트는 이 경기에 달린 다음 라운드 기록도 정리) */
  function applyRes(x, m, res) {
    const r = { ...x.res }; if (res) r[m.key] = res; else delete r[m.key];
    if (x.format !== "league" && m.key !== "third") { const R = Math.round(Math.log2(x.slots.length)); const old = x.res[m.key]; if (!res || !old || old.w !== res.w) { for (let rr = m.r + 1; rr < R; rr++) delete r[`t${rr}-${m.i >> (rr - m.r)}`]; delete r.third; } }
    const lv = { ...(x.live || {}) }; delete lv[m.key]; return { ...x, res: r, live: lv };
  }

  /* ---------- 대회 한 개 ---------- */
  function CompView({ c, S, students, onGone }) {
    const [m, setM] = useState(null); const [hov, setHov] = useState(null); const [del, setDel] = useState(false); const [reset, setReset] = useState(false); const [oldV] = PE.useSaved("compVert", false); const [bmode, setBmode] = PE.useSaved("compMode", oldV ? "vd" : "hr"); const [cv, setCv] = PE.useSaved("compCv", false); const [pend, setPend] = PE.useSaved("compPend", false); const [menu, setMenu] = useState(null); const [editOpen, setEditOpen] = useState(false); const [teamEd, setTeamEd] = useState(null);
    const upd = (fn) => S.updYear((y) => ({ ...y, comps: y.comps.map((x) => (x.id === c.id ? fn(x) : x)) }));
    const E = useMemo(() => new Map(c.entrants.map((e) => [e.id, e])), [c.entrants]);
    const byId = useMemo(() => new Map(students.map((x) => [x.id, x])), [students]);
    const nm = (id) => (E.get(id) ? E.get(id).name : "미정");
    const isL = c.format === "league";
    const out = c.out || {}, big = c.big || {};
    const flag = (kind, id) => upd((x) => { const m = { ...(x[kind] || {}) }; if (m[id]) delete m[id]; else m[id] = true; const n = { ...x, [kind]: m };
      if (kind === "big" && x.format === "tournament" && !Object.keys(x.res || {}).length) n.slots = makeSlots(arrangeIds(seedOrder(x.slots), m)); return n; });
    const lbl = (id) => nm(id);
    const openMenu = (e, id) => setMenu({ id, x: e.clientX, y: e.clientY });
    const arranged = useMemo(() => { if (!isL) return null; const bm = (x) => big[x.a] && big[x.b]; const a = [...c.matches.filter((x) => !bm(x)), ...c.matches.filter(bm)].map((x) => ({ ...x, bigm: bm(x) }));
      /* 타임(한 번에 c.courts경기) 단위로 채운다: 같은 타임에 같은 학생이 있는 경기는 건너뛰고 뒤에서 당겨온다 */
      const rest = [...a], out = [];
      while (rest.length) {
        const used = new Set(), slot = [];
        for (let i = 0; i < rest.length && slot.length < c.courts;) {
          const q = rest[i];
          if (used.has(q.a) || used.has(q.b)) { i++; continue; }
          used.add(q.a); used.add(q.b); slot.push(q); rest.splice(i, 1);
        }
        slot.forEach((q, k) => { q.court = k + 1; out.push(q); });
      }
      out.forEach((q, i) => { q.no = i + 1; }); return out; }, [c.matches, c.big, c.courts]);
    const br = useMemo(() => (isL ? null : bracket(c)), [c]);
    const vert = bmode === "vd" || bmode === "vu" || (bmode === "vb" && !!br && br.rounds.length >= 2);
    const list = isL ? arranged.map((x) => ({ ...x, key: x.id, res: c.res[x.id] })) : [...br.rounds.flat().filter((x) => !x.bye), ...(br.third ? [br.third] : [])];
    const shown = pend ? list.filter((x) => !x.res) : list;
    const total = list.length, played = list.filter((x) => x.res).length, pct = total ? Math.round((played / total) * 100) : 0;
    const save = (res) => {
      upd((x) => applyRes(x, m, res));
      setM(null);
    };
    const open = (x) => { if (x.a && x.b && !x.bye) setM(x); };
    const champ = !isL && br.final.w ? nm(br.final.w) : null;
    const rows = isL ? standings(c) : null;
    const showFA = c.scoring !== "wdl";
    const live = c.live || {};
    const mrow = (x, cvm) => { const lv = live[x.key] && !x.res; const ho = !x.res && (out[x.a] || out[x.b]);
      const pill = h`<span role="button" tabIndex="0" className=${cn("live-pill num", lv && "on")} title="지금 경기 중이면 눌러서 표시해요" onClick=${(e) => { e.stopPropagation(); flag("live", x.key); }} onKeyDown=${(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); flag("live", x.key); } }}>${x.no}경기</span>`;
      return h`<div key=${x.key} role="button" tabIndex="0" className=${cn("mrow", x.res && "done", cvm ? "cv" : "fl", x.bigm && "bigm", lv && "live", ho && "hasout")} onClick=${() => open(x)} onKeyDown=${(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(x); } }}>
      ${cvm ? h`<span className="m-top">${pill}${x.bigm ? h`<span className="bigtag">${I("flame")}빅매치</span>` : null}</span>` : h`<span className="m-meta">${pill}${x.bigm ? h`<span className="bigtag">${I("flame")}빅매치</span>` : h`<span className="badge num">${x.round + 1}R</span>`}${c.courts > 1 ? h`<span className="badge num">${x.court}경기장</span>` : null}</span>`}
      <b className=${cn("m-a", x.res && x.res.w === "a" && "win", out[x.a] && "out")}>${lbl(x.a)}</b><span className=${cn("m-sc num", !x.res && "vs")}>${scText(c, x.res)}</span><b className=${cn("m-b", x.res && x.res.w === "b" && "win", out[x.b] && "out")}>${lbl(x.b)}</b></div>`; };
    const saveEdit = (d) => {
      upd((x) => { const pl = Object.keys(x.res || {}).length > 0; const n = { ...x, name: d.name.trim(), pts: d.pts, tie: (pl ? x.scoring : d.scoring) === "wdl" ? "h2h" : d.tie, courts: d.courts };
        if (x.format === "league") n.draw = d.draw; else n.third = d.third;
        n.target = (pl ? x.scoring : d.scoring) === "score" && d.useTarget ? d.target : null;
        if (!pl) { n.scoring = d.scoring; n.sets = d.sets; if (x.format === "league" && d.legs !== x.legs) { n.legs = d.legs; n.matches = leagueMatches(x.entrants.map((e) => e.id), d.legs, d.courts); n.live = {}; } }
        return n; });
      setEditOpen(false); };
    const reorderF = (fi, ti) => { const f = arranged.findIndex((q) => q.id === shown[fi].key), t = arranged.findIndex((q) => q.id === shown[ti].key); reorder(f, t); };
    const shuffleT = () => upd((x) => { const ids = shuffleArr(x.entrants.map((e) => e.id)); return { ...x, slots: makeSlots(arrangeIds(ids, x.big || {})) }; });
    const shuffle = () => upd((x) => { const ids = x.entrants.map((e) => e.id); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } return { ...x, matches: leagueMatches(ids, x.legs, x.courts) }; });
    const reorder = (from, to) => { if (from === to) return;
      upd((x) => { const a = arranged.map(({ bigm, ...q }) => ({ ...q })); const [it] = a.splice(from, 1); a.splice(to, 0, it); const nb = a[to + 1] || a[to - 1]; if (nb && !(big[nb.a] && big[nb.b])) it.round = nb.round;
        return { ...x, matches: a }; }); };
    const bm = (x) => { const line = (id, w, s) => h`<div className=${cn("bm-l", w && "win", !id && "tbd", id && out[id] && "out", id && big[id] && "big")}><span className="bm-n"><span>${id ? nm(id) : x.bye ? "부전승" : "미정"}</span>${id && big[id] ? h`<i className="bm-fire">${I("flame")}</i>` : null}</span>${s != null ? h`<b className="num">${s}</b>` : null}</div>`;
      const r = x.res; const sv = (k) => (!r ? null : c.scoring === "wdl" ? (r.w === k ? "승" : "") : k === "a" ? r.sa : r.sb);
      return h`<button key=${x.key} type="button" className=${cn("bm", x.bye && "bye", x.a && x.b && !x.bye && "play", r && "done")} onClick=${() => open(x)}>
        ${x.no ? h`<small className="num">${x.rn ? (x.name === "결승" ? "결승" : `${x.name} ${x.rn}경기`) : `${x.no}경기`}${c.courts > 1 ? ` · ${x.court}경기장` : ""}</small>` : null}${line(x.a, r ? r.w === "a" : x.bye && !!x.a, sv("a"))}${line(x.b, r ? r.w === "b" : x.bye && !!x.b, sv("b"))}</button>`; };
    const ENT = h`<section className="card"><div className="card-head tight"><div className="card-title">참가자 <span className="card-sub num">${c.entrants.length}</span></div></div>
        <div className=${cn("ent-list", c.unit === "team" && "ent-2")} style=${c.unit === "team" ? { "--n": Math.min(c.entrants.length, 8) } : undefined}>${c.entrants.map((e) => h`<button key=${e.id} type="button" className=${cn("ent", out[e.id] && "out", big[e.id] && "big")} onClick=${(ev) => openMenu(ev, e.id)}>${big[e.id] ? h`<span className="fire">${I("flame")}</span>` : null}${e.sub ? h`<small>${e.sub}</small>` : null}<b>${c.unit === "individual" ? h`<${PE.Nm} name=${e.name} />` : lbl(e.id)}</b>${c.unit === "team" && e.members.length ? h`<span>${e.members.map((id) => byId.get(id)).filter(Boolean).map((x) => x.name).join(", ")}</span>` : null}</button>`)}</div>${!isL ? h`<p className="card-sub" style=${{ marginTop: 10 }}>이름을 누르면 오늘 <b>불참</b>이나 <b>빅매치</b>를 정할 수 있어요. 빅매치끼리는 대진표에서 최대한 늦게 만나요.</p>` : null}</section>`;
    /* 세로 대진표: 칸마다 선이 이어져요 (두 경기의 선이 만나서 다음 경기로) */
    const vbracket = () => {
      const R = br.rounds.length; const dn = (extra) => extra;
      const row = (name, ms, dir, lines, first, mid) => h`<div key=${name + ms.length + dir} className=${cn("b-round", first && "first", mid && "vmid")}><span className="b-name">${name}</span><div className="b-ms">${ms.map((x, i) => {
        const odd = i % 2 === 1, single = ms.length === 1; const w = !!x.w;
        return h`<div key=${x.key} className="vc">${bm(x)}${lines ? h`<${React.Fragment}><i className=${cn("vl s", single && "long", w && "win")} />${!single ? h`<i className=${cn("vl", odd ? "h2" : "h1", w && "win")} />` : null}${!single && !odd ? h`<i className=${cn("vl o", (w || (ms[i + 1] && ms[i + 1].w)) && "win")} />` : null}<//>` : null}${mid && br.final.w ? h`<span className="champ-tag">우승 · ${nm(br.final.w)}</span>` : null}</div>`; })}</div></div>`;
      if (bmode === "vb") {
        const part = (side) => br.rounds.slice(0, R - 1).map((ms, r) => { const hh = ms.length / 2; return row(ms[0].name, side === "T" ? ms.slice(0, hh) : ms.slice(hh), side === "T" ? "dn" : "up", true, r === 0, false); });
        return h`<div className=${cn("bracket", "v", "vbi", br.rounds[0].length / 2 > 8 && "dense")} style=${{ "--n0": br.rounds[0].length / 2 }}><div className="vcol dn">${part("T")}</div>${row("결승", [br.final], "dn", false, false, true)}<div className="vcol up">${part("B")}</div></div>`; }
      const up = bmode === "vu";
      return h`<div className=${cn("bracket", "v", br.rounds[0].length > 8 && "dense")} style=${{ "--n0": br.rounds[0].length }}><div className=${cn("vcol", up ? "up" : "dn")}>${br.rounds.map((ms, r) => row(ms[0].name, ms, up ? "up" : "dn", r < R - 1, r === 0, false))}</div></div>`;
    };
    /* 가로 대진표: 경기마다 박스, 선이 이어지고 이긴 쪽만 굵은 색 */
    const hbracket = () => {
      const R = br.rounds.length; const bi = bmode === "hb" && R >= 2;
      const cell = (x, i, n, lines, mir, tag, ms) => { const odd = i % 2 === 1, single = n === 1, w = !!x.w;
        return h`<div key=${x.key} className=${cn("hc", mir && "mir")}>${bm(x)}${lines ? h`<${React.Fragment}><i className=${cn("hl s", single && "long", w && "win")} />${!single ? h`<i className=${cn("hl", odd ? "v2" : "v1", w && "win")} />` : null}${!single && !odd ? h`<i className=${cn("hl o", (w || (ms[i + 1] && ms[i + 1].w)) && "win")} />` : null}<//>` : null}${tag || null}</div>`; };
      const colEl = (key, name, ms, lines, mir, tag, cls) => h`<div key=${key} className=${cn("hcol2", cls)}><span className="b-name">${name}</span><div className="hcs">${ms.map((x, i) => cell(x, i, ms.length, lines, mir, tag, ms))}</div></div>`;
      const champ = br.final.w ? h`<span className="champ-tag">우승 · ${nm(br.final.w)}</span>` : null;
      if (bi) {
        const half = (side) => { const cols = br.rounds.slice(0, R - 1).map((ms, r) => { const hh = ms.length / 2; return colEl(side + r, ms[0].name, side === "L" ? ms.slice(0, hh) : ms.slice(hh), true, side === "R"); }); return side === "R" ? cols.reverse() : cols; };
        return h`<div className="hbr2 bi">${half("L")}${colEl("mid", "결승", [br.final], false, false, champ, "hmid2")}${half("R")}</div>`; }
      return h`<div className="hbr2">${br.rounds.map((ms, r) => colEl(r, ms[0].name, ms, r < R - 1, false, r === R - 1 ? champ : null, r === R - 1 ? "hlast" : ""))}</div>`;
    };
    return h`<${React.Fragment}>
      <section className="card cdet">
        <div className="cd-top"><div className="cd-nm"><div className="card-title">${c.name}</div><span className="card-sub num">${played} / ${total}경기</span></div>
          <div className="club-meta"><span className="badge">${isL ? (c.legs === 2 ? "리그 · 두 번씩" : "리그") : "토너먼트"}</span><span className="badge">${SCORING.find((x) => x.value === c.scoring).label}${c.target ? ` · ${c.target}점` : c.scoring === "sets" ? ` · ${c.sets}세트` : ""}</span>${isL ? h`<span className="badge num">승점 ${c.pts.w}${c.draw ? "·" + c.pts.d : ""}·${c.pts.l}</span>` : null}<span className="badge num">경기장 ${c.courts}</span>
            ${!isL ? (() => { const MS = [{ v: "vd", t: "세로 · 하강", i: "rows" }, { v: "vu", t: "세로 · 상승", i: "rows" }, { v: "vb", t: "세로 · 양방향", i: "rows" }, { v: "hr", t: "가로 · 오른쪽", i: "columns" }, { v: "hb", t: "가로 · 양방향", i: "columns" }]; const cur = MS.find((x) => x.v === bmode) || MS[2]; return h`<${PE.Button} size="sm" onClick=${() => setBmode(MS[(MS.indexOf(cur) + 1) % MS.length].v)} title="누를 때마다 대진표 모양이 바뀌어요">${I(cur.i)} ${cur.t}<//>`; })() : null}
            ${!played ? h`<${PE.Button} size="sm" onClick=${isL ? shuffle : shuffleT} title=${isL ? "경기 순서를 무작위로 다시 짜요" : "대진을 무작위로 다시 짜요"}>${I("shuffle")} 대진표 섞기<//>` : null}
            <${PE.Button} size="sm" onClick=${() => setEditOpen(true)}>${I("settings")} 설정<//>
            <${PE.Button} size="sm" disabled=${!played} onClick=${() => setReset(true)}>${I("eraser")} 기록 초기화<//>
            <${PE.Button} icon size="sm" aria-label="보관함으로 보내기" title="보관함으로 보내기" onClick=${() => setDel(true)}>${I("archive")}<//></div></div>
        <div className="cd-prog"><${PE.Bar} pctText pct=${pct} runner=${S.state.prefs.runner !== false ? "kid" : false} label="대회 진행률" />${champ ? h`<span className="champ">${I("trophy")} 우승 ${champ}</span>` : null}</div></section>

      ${isL && c.unit === "individual" ? null : ENT}
      ${isL ? h`<div className="comp-cols">
        <section className="card"><div className="card-head tight"><div className="card-title">순위표</div></div>
          <div className="paps-scroll"><table className="rank-t"><thead><tr><th>순위</th><th className="l">참가자</th><th>경기</th><th>승</th>${c.draw ? h`<th>무</th>` : null}<th>패</th>${showFA ? h`<th>득</th><th>실</th><th>차</th>` : null}<th>승점</th></tr></thead>
            <tbody>${rows.map((r) => h`<tr key=${r.id} className=${cn(r.rank === 1 && r.p > 0 && "top")}><td className="num">${r.rank}</td><td className="l"><button type="button" className=${cn("rk-btn", out[r.id] && "out", big[r.id] && "big")} title="누르면 불참·빅매치를 정해요" onClick=${(e) => openMenu(e, r.id)}><b className="rk-nm">${nm(r.id)}</b>${big[r.id] ? h`<span className="fire">${I("flame")}</span>` : null}</button></td><td className="num">${r.p}</td><td className="num">${r.w}</td>${c.draw ? h`<td className="num">${r.d}</td>` : null}<td className="num">${r.l}</td>${showFA ? h`<td className="num">${r.f}</td><td className="num">${r.a}</td><td className="num">${r.diff > 0 ? "+" + r.diff : r.diff}</td>` : null}<td className="num pts">${r.pts}</td></tr>`)}</tbody></table></div>
          <p className="card-sub" style=${{ marginTop: 10 }}>승점이 같으면 ${c.scoring === "wdl" ? "승자승 → 승수" : c.tie === "h2h" ? "승자승 → 득실차 → 다득점" : "득실차 → 다득점 → 승자승"} 순이에요.<br />이름을 누르면 오늘 <b>불참</b>이나 <b>빅매치</b>를 정할 수 있어요.</p></section>
        <section className="card"><div className="card-head tight"><div className="card-title">경기 일정</div>
          <div className="bar-btns"><${PE.Seg} label="경기 거르기" value=${pend ? "p" : "a"} onChange=${(v) => setPend(v === "p")} options=${[{ value: "a", label: "모든 경기" }, { value: "p", label: "예정 경기" }]} />
          ${c.courts > 1 ? h`<${PE.Seg} label="보기 방식" value=${cv ? "c" : "a"} onChange=${(v) => setCv(v === "c")} options=${[{ value: "a", label: "한 줄 보기" }, { value: "c", label: "경기장 보기" }]} />` : null}</div></div>
          ${cv && c.courts > 1 ? h`<div className="court-cols" style=${{ "--cn": c.courts, "--k": Math.min(1, c.courts / 4) }}>${Array.from({ length: c.courts }, (_, i) => { const ms = shown.filter((x) => x.court === i + 1); return h`<div key=${i} className="court-col"><b className="court-h">${i + 1}경기장</b>${ms.map((x) => mrow(x, true))}</div>`; })}</div>`
          : h`<${MatchList} ms=${shown} row=${mrow} onReorder=${reorderF} style=${{ "--meta": c.courts > 1 ? "200px" : "136px" }} />`}</section></div>`
      : h`<section className="card"><div className="card-head tight"><div className="card-title">대진표</div></div>
          <div className="paps-scroll">${vert ? vbracket() : hbracket()}</div>
          ${br.third ? h`<div className="third"><span className="b-name">3·4위전</span>${bm(br.third)}</div>` : null}</section>`}



      ${teamEd ? h`<${TeamEdit} c=${c} students=${students} onClose=${() => setTeamEd(null)} onSave=${(ts) => { upd((x) => ({ ...x, entrants: x.entrants.map((q) => { const t = ts.find((y) => y.id === q.id); return t ? { ...q, name: t.name.trim() || q.name, members: t.members } : q; }) })); setTeamEd(null); }} />` : null}
      ${editOpen ? h`<${CompEdit} c=${c} onClose=${() => setEditOpen(false)} onSave=${saveEdit} />` : null}
      <${PE.Popover} open=${!!menu} at=${menu} onClose=${() => setMenu(null)}>${menu ? h`<div className="pop-head"><b>${nm(menu.id)}</b></div>
        <div className="flag-btns"><button type="button" className="flag out" aria-pressed=${!!out[menu.id]} onClick=${() => flag("out", menu.id)}>${I("userx")} 불참</button>
          ${true ? h`<button type="button" className="flag big" aria-pressed=${!!big[menu.id]} onClick=${() => flag("big", menu.id)}>${I("flame")} 빅매치</button>` : null}${c.unit === "team" ? h`<button type="button" className="flag" onClick=${() => { setTeamEd(menu.id); setMenu(null); }}>${I("pencil")} 팀 수정</button>` : null}</div>` : null}<//>
      ${m ? h`<${ResultDialog} key=${m.key} c=${c} m=${m} nm=${nm} onClose=${() => setM(null)} onSave=${save} />` : null}
      <${PE.ConfirmDialog} open=${reset} danger title="경기 기록을 모두 지울까요?" body="대진과 참가자는 그대로 두고 결과만 지워요." confirmLabel="지우기" onClose=${() => setReset(false)} onConfirm=${() => { upd((x) => ({ ...x, res: {} })); setReset(false); }} />
      <${PE.ConfirmDialog} open=${del} title=${`‘${c.name}’ 대회를 보관함으로 보낼까요?`} body="목록에서 사라지고 보관함에 모아 둬요. 기록은 그대로 남고, 보관함에서 다시 꺼내거나 삭제할 수 있어요." confirmLabel="보관함으로" onClose=${() => setDel(false)} onConfirm=${() => { S.updYear((y) => ({ ...y, comps: y.comps.map((x) => (x.id === c.id ? { ...x, archived: true } : x)) })); setDel(false); onGone(); }} />
    <//>`;
  }

  /* ---------- 점수판: 점수 세기 + 서브 순서 ---------- */
  const shuf = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  /* 지금까지의 득점 기록(events: "a"/"b")으로 지금 서브하는 쪽과 사람을 계산 */
  function serveNow(rule, n, first, ev, na, nb) {
    const cnt = { a: Math.max(1, na), b: Math.max(1, nb) }; const other = first === "a" ? "b" : "a";
    if (rule === "alt") { const t = Math.floor(ev.length / Math.max(1, n)); const side = t % 2 === 0 ? first : other; const o = side === "a" ? "b" : "a";
      const kf = (tt, sd) => (sd === first ? Math.floor(tt / 2) : Math.floor((tt - 1) / 2)); const nxt = { [side]: kf(t, side) % cnt[side], [o]: kf(t + 1, o) % cnt[o] }; return { side, idx: nxt[side], nxt }; }
    let srv = first; const idx = { a: -1, b: -1 }; idx[first] = 0;
    ev.forEach((w) => { if (w !== srv) { srv = w; idx[w] = (idx[w] + 1) % cnt[w]; } });
    const o = srv === "a" ? "b" : "a"; return { side: srv, idx: idx[srv], nxt: { [srv]: idx[srv], [o]: (idx[o] + 1) % cnt[o] } };
  }
  function Scoreboard({ comps, students, onClose, onSave }) {
    const [step, setStep] = useState(0); const [cid, setCid] = useState(null); const [a, setA] = useState(null); const [b, setB] = useState(null);
    const [first, setFirst] = useState("a"); const [rule, setRule] = useState("alt"); const [n, setN] = useState(1);
    const [oa, setOa] = useState([]); const [ob, setOb] = useState([]); const [ev, setEv] = useState([]); const [log, setLog] = useState([]); const [saved, setSaved] = useState(false);
    const c = comps.find((x) => x.id === cid) || null;
    const byId = useMemo(() => new Map(students.map((x) => [x.id, x])), [students]);
    const E = useMemo(() => new Map((c ? c.entrants : []).map((e) => [e.id, e])), [c]);
    const nm = (id) => (E.get(id) ? E.get(id).name : "");
    const mem = (id) => ((E.get(id) || {}).members || []).filter((sid) => byId.has(sid));
    const sname = (sid) => (byId.get(sid) || {}).name || "";
    /* 이 대회에서 아직 안 한 경기 (바로 불러오기용) + 두 참가자에 연결된 경기 찾기 */
    const matches = useMemo(() => { if (!c) return []; if (c.format === "league") return c.matches.map((x) => ({ key: x.id, a: x.a, b: x.b, res: c.res[x.id], label: `${x.round + 1}라운드` })); const br = bracket(c); return [...br.rounds.flat().filter((x) => !x.bye), ...(br.third ? [br.third] : [])].map((x) => ({ ...x, label: x.name })); }, [c]);
    const ready = matches.filter((x) => x.a && x.b && !x.res);
    const link = a && b ? matches.find((x) => x.a && x.b && ((x.a === a && x.b === b) || (x.a === b && x.b === a)) && !x.res) || matches.find((x) => x.a && x.b && ((x.a === a && x.b === b) || (x.a === b && x.b === a))) : null;
    const choose = (id) => { if (id === a) setA(null); else if (id === b) setB(null); else if (!a) setA(id); else if (!b) setB(id); else setB(id); };
    const pairUp = (x) => { setA(x.a); setB(x.b); };
    const toServe = () => { setOa([]); setOb([]); setEv([]); setLog([]); setSaved(false); setStep(2); };
    const needA = mem(a).length > 1 && oa.length !== mem(a).length, needB = mem(b).length > 1 && ob.length !== mem(b).length;
    const start = () => { setSaved(false); setStep(3); };
    const cur = serveNow(rule, n, first, ev, oa.length, ob.length);
    const ca = ev.filter((x) => x === "a").length, cb = ev.length - ca;
    const won = (arr) => ({ a: arr.filter((q) => q.a > q.b).length, b: arr.filter((q) => q.b > q.a).length });
    const sets = c && c.scoring === "sets"; const wdl = c && c.scoring === "wdl";
    const all = sets ? [...log, ...(ev.length ? [{ a: ca, b: cb }] : [])] : [];
    const sw = won(all);
    const fa = sets ? sw.a : ca, fb = sets ? sw.b : cb;
    const needWinner = c && (c.format === "tournament" || !c.draw);
    const tied = fa === fb; const canSave = !!link && (sets ? all.length > 0 : ev.length > 0) && !(tied && needWinner);
    const reach = c && c.scoring === "score" && c.target && Math.max(ca, cb) >= c.target;
    const endSet = () => { if (!ev.length) return; setLog([...log, { a: ca, b: cb }]); setEv([]); setFirst(first === "a" ? "b" : "a"); };
    const doSave = () => {
      const swap = link.a !== a; const x = swap ? fb : fa, y = swap ? fa : fb; const w = x > y ? "a" : y > x ? "b" : "d";
      onSave(c.id, link, wdl ? { sa: null, sb: null, w } : { sa: x, sb: y, w }); setSaved(true); };
    const orderBox = (id, ord, setOrd) => { const ms = mem(id); if (ms.length < 2) return null;
      return h`<div className="sb-ord"><div className="sb-ord-h"><b>${nm(id)}</b></div>
        <div className="sb-chips">${ms.map((sid) => { const k = ord.indexOf(sid); return h`<button key=${sid} type="button" className="cc" aria-pressed=${k >= 0} onClick=${() => setOrd(k >= 0 ? ord.filter((q) => q !== sid) : [...ord, sid])}>${k >= 0 ? h`<b className="sb-no num">${k + 1}</b>` : null}${sname(sid)}</button>`; })}</div></div>`; };
    const crumbs = ["대회", "선수·팀", "서브", "점수"];
    const sideName = (k, id) => h`<div className=${cn("sb-name", cur.side === k && "serving")}><b>${nm(id)}</b>${cur.side === k ? h`<span className="badge sb-srv">서브</span>` : null}</div>`;
    const topCol = (k, id, cs) => h`<div className=${cn("sb-col", cur.side === k && "serving")}>${sideName(k, id)}
      <div className="sb-score num">${cs}</div>${sets ? h`<div className="sb-sets num">${k === "a" ? sw.a : sw.b}세트</div>` : null}
      <button type="button" className="sb-minus" disabled=${!ev.some((q) => q === k)} aria-label=${nm(id) + " 1점 빼기"} onClick=${() => { const i = ev.lastIndexOf(k); setEv(ev.filter((_, j) => j !== i)); }}>${I("minus")} 1점</button></div>`;
    const midCol = (k, id, ord) => { const mm = ord.length > 1 ? ord : []; const serving = cur.side === k;
      if (!mm.length) return h`<div className=${cn("sb-mcol", serving && "serving")}>${serving ? h`<span className="sb-now solo">서브</span>` : null}</div>`;
      const i = cur.nxt[k], n2 = mm.length; const pv = mm[(i - 1 + n2) % n2], nx = mm[(i + 1) % n2];
      return h`<div className=${cn("sb-mcol", serving && "serving")}><span className="sb-ctx">${n2 > 2 ? sname(pv) : ""}</span><span className=${cn("sb-now", !serving && "wait")}>${sname(mm[i])}</span><span className="sb-ctx">${sname(nx)}</span></div>`; };
    const tapCol = (k, id) => h`<button type="button" className=${cn("sb-tap", k)} aria-label=${nm(id) + " 1점 올리기"} onClick=${() => setEv([...ev, k])}><span>+1</span></button>`;
return h`<${PE.Dialog} open=${true} onClose=${onClose} wide full>
      <div className=${cn("stu-head", step === 3 && "sbh")}><h2>점수판</h2>${c ? h`<span className="badge">${c.name}</span>` : null}<span className="grow"></span>
        <div className="sb-crumbs">${crumbs.map((t, i) => h`<button key=${t} type="button" className=${cn("sb-crumb", i === step && "on")} disabled=${i > step} onClick=${() => setStep(i)}>${i + 1}. ${t}</button>`)}</div></div>
      ${step === 0 ? h`<div className="sb-list">${comps.length ? comps.map((x) => h`<button key=${x.id} type="button" className="opt-card" onClick=${() => { setCid(x.id); setA(null); setB(null); setStep(1); }}><b>${x.name}</b><span>${x.format === "league" ? "리그" : "토너먼트"} · ${x.entrants.length}${x.unit === "team" ? "팀" : x.unit === "class" ? "반" : "명"}</span></button>`) : h`<p className="card-sub">먼저 대회를 만들어 주세요.</p>`}</div>` : null}
      ${step === 1 && c ? h`<div className="sb-pick">
        <div className="sb-vs"><div className=${cn("sb-slot", a && "on")}>${a ? nm(a) : "왼쪽"}</div><b>VS</b><div className=${cn("sb-slot", b && "on")}>${b ? nm(b) : "오른쪽"}</div></div>
        <div className="sb-chips">${c.entrants.map((e) => h`<button key=${e.id} type="button" className=${cn("cc", c.out && c.out[e.id] && "out")} aria-pressed=${e.id === a || e.id === b} onClick=${() => choose(e.id)}>${e.name}</button>`)}</div>
        ${ready.length ? h`<div className="sb-ready"><div className="card-sub">남은 경기</div><div className="sb-chips">${ready.slice(0, 24).map((x) => h`<button key=${x.key} type="button" className="btn sm" onClick=${() => pairUp(x)}>${nm(x.a)} vs ${nm(x.b)}</button>`)}</div></div>` : null}</div>` : null}
      ${step === 2 && c ? h`<div className="sb-serve">
        <div className="sb-row"><span className="sb-lbl">먼저 서브</span><${PE.Seg} label="먼저 서브" value=${first} onChange=${setFirst} options=${[{ value: "a", label: nm(a) }, { value: "b", label: nm(b) }]} /></div>
        <div className="sb-row"><span className="sb-lbl">서브 방식</span><${PE.Seg} label="서브 방식" value=${rule} onChange=${setRule} options=${[{ value: "alt", label: "몇 점마다 교대" }, { value: "rally", label: "득점하면 서브" }]} />
          ${rule === "alt" ? h`<${PE.NumStepper} label="교대 점수" min=${1} max=${20} value=${n} onChange=${setN} />` : null}</div>
        ${orderBox(a, oa, setOa)}${orderBox(b, ob, setOb)}</div>` : null}
      ${step === 3 && c ? h`<div className="sb-board">
        <div className="sb-top">${topCol("a", a, ca)}${topCol("b", b, cb)}</div>
        <div className="sb-mid">${midCol("a", a, oa)}${midCol("b", b, ob)}</div>
        ${reach ? h`<p className="sb-reach">목표 ${c.target}점에 닿았어요</p>` : null}
        ${sets && log.length ? h`<div className="sb-log num">${log.map((q, i) => h`<span key=${i}>${i + 1}세트 ${q.a} : ${q.b}</span>`)}</div>` : null}
        <div className="sb-taps">${tapCol("a", a)}${tapCol("b", b)}</div></div>` : null}
      <div className="dialog-foot"><div>${step === 3 ? h`<${PE.Button} disabled=${!ev.length} onClick=${() => setEv(ev.slice(0, -1))}>${I("swap")} 되돌리기<//>` : null}</div>
        <div>${step === 3 && sets ? h`<${PE.Button} disabled=${!ev.length} onClick=${endSet}>세트 끝<//>` : null}
          ${step > 0 ? h`<${PE.Button} onClick=${() => setStep(step - 1)}>이전<//>` : null}
          ${step === 1 ? h`<${PE.Button} variant="primary" disabled=${!(a && b)} onClick=${toServe}>다음<//>` : null}
          ${step === 2 ? h`<${PE.Button} variant="primary" disabled=${needA || needB} onClick=${start}>시작<//>` : null}
          ${step === 3 ? h`<${PE.Button} variant="primary" disabled=${!canSave || saved} onClick=${doSave} title=${link ? "" : "이 두 사람(팀)의 경기가 대회에 없어요"}>${saved ? "저장했어요" : "결과 저장"}<//>` : null}
          <${PE.Button} onClick=${onClose}>닫기<//></div></div><//>`;
  }

  /* ---------- 보관함: 꺼내기 · 삭제 ---------- */
  function ArchiveBox({ kept, prog, S, onClose }) {
    const [del, setDel] = useState(null);
    const patch = (id, fn) => S.updYear((y) => ({ ...y, comps: fn(y.comps, id) }));
    return h`<${PE.Dialog} open=${true} onClose=${onClose} mid><h2>대회 보관함</h2><p className="sub">보관한 대회는 목록과 점수판에 나오지 않아요. 삭제는 여기에서만 할 수 있어요.</p>
      <div className="ev-items">${kept.length ? kept.map((x) => { const [p, t] = prog(x); return h`<div key=${x.id} className="ev-item"><div className="ev-item-top">
          <div className="grow"><b>${x.name}</b> <span className="card-sub">${x.format === "league" ? "리그" : "토너먼트"} · ${x.entrants.length}${x.unit === "team" ? "팀" : x.unit === "class" ? "반" : "명"} · ${t ? Math.round((p / t) * 100) : 0}%</span></div>
          <${PE.Button} size="sm" onClick=${() => patch(x.id, (cs, id) => cs.map((q) => { if (q.id !== id) return q; const { archived: _a, ...rest } = q; return rest; }))}>꺼내기<//>
          <${PE.Button} icon variant="ghost" aria-label=${x.name + " 삭제"} onClick=${() => setDel(x)}>${I("trash")}<//></div></div>`; }) : h`<p className="card-sub">보관한 대회가 없어요.</p>`}</div>
      <div className="dialog-foot"><div></div><${PE.Button} variant="primary" onClick=${onClose}>닫기<//></div>
      <${PE.ConfirmDialog} open=${!!del} danger title=${del ? `‘${del.name}’ 대회를 삭제할까요?` : ""} body="경기 기록도 함께 삭제되고 되돌릴 수 없어요." confirmLabel="삭제" onClose=${() => setDel(null)} onConfirm=${() => { const id = del.id; patch(id, (cs, i) => cs.filter((q) => q.id !== i)); setDel(null); }} /><//>`;
  }

  function Comps() {
    const S = PE.useStore(); const { yd } = S; const classes = PE.myClasses(yd);
    const [sel, setSel] = PE.useSaved("compSel", null); const [wiz, setWiz] = useState(false); const [sb, setSb] = useState(false);
    const [box, setBox] = useState(false);
    const live = yd.comps.filter((x) => !x.archived); const kept = yd.comps.filter((x) => x.archived);
    const c = live.find((x) => x.id === sel) || live[0] || null;
    const prog = (x) => { if (x.format === "league") { const t = x.matches.length; return [x.matches.filter((q) => x.res[q.id]).length, t]; } const b = bracket(x); const l = [...b.rounds.flat().filter((q) => !q.bye), ...(b.third ? [b.third] : [])]; return [l.filter((q) => q.res).length, l.length]; };
    return h`<div className="page">
      <div className="roster-bar">
        <div className="club-chips six">${live.map((x) => { const [p, t] = prog(x); const pct = t ? Math.round((p / t) * 100) : 0; return h`<button key=${x.id} type="button" className="club-chip" aria-pressed=${c && c.id === x.id} onClick=${() => setSel(x.id)}>
          <span className="cc-top"><span className="badge">${x.format === "league" ? "리그" : "토너먼트"}</span><b>${x.name}</b></span>
          <span className="cc-bar"><${PE.Bar} pct=${pct} label="대회 진행률" /><em className="num">${pct}%</em></span></button>`; })}</div>
        <div className="comp-btns"><${PE.Button} size="sm" variant="primary" onClick=${() => setWiz(true)}>${I("plus")} 대회 만들기<//>
          <${PE.Button} size="sm" onClick=${() => setBox(true)}>${I("archive")} 보관함${kept.length ? ` ${kept.length}` : ""}<//>
          <${PE.Button} size="sm" onClick=${() => setSb(true)}>${I("clipboard")} 점수판<//></div></div>
      ${c ? h`<${CompView} key=${c.id} c=${c} S=${S} students=${yd.students} onGone=${() => setSel(null)} />` : null}
      ${sb ? h`<${Scoreboard} comps=${live} students=${yd.students} onClose=${() => setSb(false)} onSave=${(id, m, res) => S.updYear((y) => ({ ...y, comps: y.comps.map((x) => (x.id === id ? applyRes(x, m, res) : x)) }))} />` : null}
      ${box ? h`<${ArchiveBox} kept=${kept} prog=${prog} S=${S} onClose=${() => setBox(false)} />` : null}
      ${wiz ? h`<${CompWizard} students=${yd.students} classes=${classes} onClose=${() => setWiz(false)} onCreate=${(x) => { S.updYear((y) => ({ ...y, comps: [...y.comps, x] })); setWiz(false); setSel(x.id); }} />` : null}
    </div>`;
  }
  PE.pages = PE.pages || {};
  PE.pages.comp = Comps;
})();
