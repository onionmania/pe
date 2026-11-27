/* 대시보드: 한 화면에 들어오는 학기 진행 현황 + 학년별 진행률 */
(function () {
  const PE = window.PE, React = window.React, h = PE.h, cn = PE.cn, I = PE.I;
  const { useState, useMemo } = React;
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  const dday = (n) => (n === 0 ? "D-Day" : n > 0 ? `D-${n}` : `D+${-n}`);

  function Hero({ yd, year, which, setView, today }) {
    const S_runner = PE.useStore().state.prefs.runner !== false;
    const cur = PE.currentSem(yd, today);
    const st = PE.semStats(yd, which, today); const { sem } = st;
    const inBreak = cur === "break" && which === 1;
    const span = sem.start && sem.end ? Math.max(1, PE.diffDays(sem.start, sem.end)) : 1;
    const pos = (d) => Math.min(100, Math.max(0, (PE.diffDays(sem.start, d) / span) * 100));
    const toEnd = sem.end ? PE.diffDays(today, sem.end) : null;
    let status = "";
    if (st.state === "during") status = "진행 중"; else if (st.state === "before") status = `개학까지 ${dday(PE.diffDays(today, sem.start))}`; else if (st.state === "after") status = inBreak ? "방학 중" : "종료";
    if (inBreak && yd.sem2.start) status = `2학기 개학까지 ${dday(PE.diffDays(today, yd.sem2.start))}`;
    return h`<section className="card">
      <div className="card-head tight">
        <div className="card-title" style=${{ fontSize: "var(--fs-lg)", fontWeight: "var(--heading-weight)" }}>${year}학년도 ${which}학기 진행 현황</div></div>
      ${st.state === "unset" ? h`<p className="empty-note">${which}학기 기간이 아직 없어요. <a href="#settings" style=${{ color: "var(--primary)", fontWeight: 700 }}>기본 설정</a>에서 정해 주세요.</p>` : h`<div>
        <div className="hero-top"><div className="big-pct num">${st.pct}<small>%</small></div><span className="badge">${status}</span>
          <div className="hero-stats">
            <div><span>지난 수업일</span><b className="num">${st.done}<em>/${st.total}일</em></b></div>
            <div><span>남은 수업일</span><b className="num">${st.remaining}<em>일</em></b></div>
            <div><span>${which === 2 ? "학기 종료까지" : "방학까지"}</span><b className="num">${toEnd == null ? "–" : dday(toEnd)}</b></div></div></div>
        <${PE.Bar} size="lg" pct=${st.pct} runner=${S_runner} label=${which + "학기 진행률"} />
        <div className="bar-scale num"><span>${PE.fmt(sem.start)}</span><span>${PE.fmt(sem.end)}</span></div></div>`}
    </section>`;
  }

  function TodayCard({ yd, today }) {
    const d = PE.parse(today); const hol = PE.holidayOn(yd, today);
    const cur = PE.currentSem(yd, today); const sem = cur === 2 ? yd.sem2 : yd.sem1;
    let msg, tone = "";
    if (hol) { msg = hol.name; tone = hol.kind; } else if (PE.isWeekend(today)) msg = "주말";
    else if (sem.start && today < sem.start) msg = "학기 시작 전"; else if (cur === "break") msg = "방학 중";
    else if (cur === 2 && yd.sem2.end && today > yd.sem2.end) msg = "학기 종료"; else msg = "수업일";
    const t = PE.todayClasses(yd, today);
    return h`<section className="card today-card">
      <div className="today-head"><div><div className="kicker">오늘</div><div className="date num">${d.getMonth() + 1}월 ${d.getDate()}일 <span>${DOW[d.getDay()]}요일</span></div></div><span className=${cn("badge", tone)}>${msg}</span></div>
      <div className="today-list-title">오늘 수업${t.from === "weekly" ? h` <span className="card-sub">· 기초 시간표 기준</span>` : null}</div>
      ${t.items.length === 0 ? h`<p className="card-sub">${t.from === "off" ? "오늘은 수업이 없어요." : "시간표에 오늘 수업이 없어요."}</p>` : h`<div className="today-classes">${t.items.map((x) =>
        h`<div key=${x.period} className="today-class"><span className="num">${x.period}교시</span><${PE.ClassTag} k=${x.key} /></div>`)}</div>`}
    </section>`;
  }

  function ProgressCard({ icon, title, rows, values, empty, tone, wide, onMore }) {
    return h`<section className="card">
      <div className="card-head tight"><div className="card-title"><span className="ico sm">${I(icon)}</span>${title}</div>${onMore ? h`<button type="button" className="pc-more" onClick=${onMore} title=${title + " 빠진 것 보기"}>${I("listcheck")} 빠진 것</button>` : null}</div>
      ${rows.length === 0 && empty ? h`<p className="empty-note" style=${{ marginTop: 0 }}>${empty}</p>` : rows.length === 0 ? h`<p className="empty-note" style=${{ marginTop: 0 }}><a href="#settings" style=${{ color: "var(--primary)", fontWeight: 700 }}>기본 설정</a>에서 담당 학급을 골라 주세요.</p>` : h`<div>${rows.map((r) => {
        const v = values ? values[r.id] : null;
        return h`<div className=${"grade-row" + (wide ? " wide" : "")} key=${r.id}><span className="g num" title=${r.label}>${r.label}</span>
          <${PE.Bar} size="sm" tone=${tone} pct=${v == null ? 0 : v} label=${r.label + " " + title} /><span className="v num">${v == null ? "—" : v + "%"}</span></div>`; })}</div>`}
      ${values || !empty ? null : h`<div className="empty-note">${empty}</div>`}
    </section>`;
  }

  /* 빠진 것 보기: 학년(또는 반)별로, 끝나지 않은 반만 보여 줘요 */
  function MissingDialog({ kind, rows, yd, which, onClose }) {
    const get = (k) => (kind === "paps" ? PE.papsMissing(yd, which, k) : PE.evalMissing(yd, k));
    const data = useMemo(() => rows.map((r) => ({ r, cls: r.keys.map((k) => ({ k, m: get(k) })) })), [rows, yd, which, kind]);
    const left = (x) => x.cls.reduce((s, c) => s + new Set(c.m.parts.flatMap((q) => q.missing.map((t) => t.id))).size, 0);
    const first = data.find((x) => left(x) > 0);
    const [sel, setSel] = useState(first ? first.r.id : rows[0] && rows[0].id);
    const cur = data.find((x) => x.r.id === sel) || data[0];
    const title = kind === "paps" ? "PAPS 측정 현황" : "평가 입력 현황"; const word = kind === "paps" ? "측정" : "입력";
    return h`<${PE.Dialog} open=${true} onClose=${onClose} mid><h2>${title}</h2><p className="sub">아직 ${word}하지 않은 것만 보여요.${kind === "paps" ? ` (${which}학기 · 체력요소 4개와 신장·체중)` : ""}</p>
      <div className="cc-row ms-tabs">${data.map((x) => { const n = left(x); return h`<button key=${x.r.id} type="button" className="cc" aria-pressed=${x.r.id === sel} onClick=${() => setSel(x.r.id)}>${x.r.label}${n ? h`<b className="ms-n">${n}</b>` : h`<span className="ms-ok">${I("check", "")}</span>`}</button>`; })}</div>
      <div className="ms-body">${cur ? cur.cls.map(({ k, m }) => {
        const none = m.total && m.filled === 0; const done = m.total && !m.parts.length;
        const nmChip = (t) => h`<span key=${t.id} className="ms-chip"><i className="num">${t.number}</i>${t.name}</span>`;
        return h`<div key=${k} className=${cn("ms-class", done && "done")}>
          <div className="ms-ch"><${PE.ClassTag} k=${k} />${!m.total ? h`<span className="card-sub">${m.students ? "해당 항목이 없어요" : "명렬표에 학생이 없어요"}</span>` : done ? h`<span className="ms-done">${I("check", "")} 모두 완료</span>` : none ? h`<span className="ms-start">아직 시작 전 · ${m.students}명 모두</span>` : h`<span className="card-sub num">${Math.round((m.filled / m.total) * 100)}% 완료</span>`}</div>
          ${!done && !none ? h`<div className="ms-parts">${m.parts.map((q) => h`<div key=${q.name} className="ms-part"><b>${q.name}</b>${q.missing.length === m.students ? h`<span className="ms-all">전원 미${word}</span>` : h`<span className="ms-names">${q.missing.map(nmChip)}</span>`}</div>`)}</div>` : null}</div>`; }) : null}</div>
      <div className="dialog-foot"><div></div><${PE.Button} variant="primary" onClick=${onClose}>닫기<//></div><//>`;
  }

  function Dashboard() {
    const S = PE.useStore(); const { yd, state, demo } = S; const today = PE.today();
    const view = S.state.prefs.sem || null; const setView = () => {};
    const cur = PE.currentSem(yd, today); const which = view || (cur === "break" ? 1 : cur);
    const classes = PE.myClasses(yd); const byClass = state.prefs.dash === "class";
    const rows = byClass ? classes.map((c) => ({ id: c.key, label: c.key, keys: [c.key] }))
      : [...new Set(classes.map((c) => c.grade))].map((g) => ({ id: g, label: g + "학년", keys: classes.filter((c) => c.grade === g).map((c) => c.key) }));
    const stats = PE.hoursStats(yd, which, today);
    const lesson = {}; let any = false;
    for (const r of rows) { let p = 0, d = 0; for (const k of r.keys) { const e = stats[k]; if (e) { p += e.planned; d += e.done; } } if (p) { lesson[r.id] = Math.round((d / p) * 100); any = true; } }
    const fake = (seed) => { const o = {}; rows.forEach((r, i) => (o[r.id] = Math.min(100, Math.max(8, Math.round(seed + (i % 2 ? -9 : 7) * ((i % 4) + 1) * 0.8))))); return o; };
    const live = yd.comps.filter((x) => !x.archived); const compRows = live.map((x) => ({ id: x.id, label: x.name })); const compVals = {};
    for (const x of live) { try { const [p, t] = PE.compProgress(x); compVals[x.id] = t ? Math.round((p / t) * 100) : 0; } catch (e) { compVals[x.id] = 0; } }
    const [miss, setMiss] = useState(null);
    const papsVals = (() => { const o = {}; let any3 = false; for (const r of rows) { let f = 0, t = 0; for (const k of r.keys) { const m = PE.papsMissing(yd, which, k); f += m.filled; t += m.total; } if (t) { o[r.id] = Math.round((f / t) * 100); any3 = true; } } return any3 ? o : null; })();
    return h`<div className="page dash">
      <div className="grid-2 dash-top"><${Hero} yd=${yd} year=${state.year} which=${which} setView=${setView} today=${today} /><${TodayCard} yd=${yd} today=${today} /></div>
      <div className="grid-4">
        <${ProgressCard} icon="clock" title="수업 진행" rows=${rows} values=${demo ? fake(58) : any ? lesson : null} />
        <${ProgressCard} icon="activity" title="PAPS" rows=${rows} values=${demo ? fake(36) : papsVals} tone="accent" onMore=${() => setMiss("paps")} />
        <${ProgressCard} icon="clipboard" title="평가" onMore=${() => setMiss("eval")} rows=${rows} values=${demo ? fake(72) : (() => { const o = {}; let any2 = false; for (const r of rows) { const v = PE.evalProgress(yd, r.keys); if (v != null) { o[r.id] = v; any2 = true; } } return any2 ? o : null; })()} />
        <${ProgressCard} icon="trophy" title="대회" rows=${compRows} values=${demo ? null : compVals} wide empty="진행 중인 대회가 없어요." />
      </div>
      ${miss ? h`<${MissingDialog} kind=${miss} rows=${rows} yd=${yd} which=${which} onClose=${() => setMiss(null)} />` : null}</div>`;
  }
  PE.pages = PE.pages || {};
  PE.pages.dashboard = Dashboard;
})();
