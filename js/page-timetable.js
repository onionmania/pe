/* 시간표: 기초 시간표 → 시수 계산 → 학기 시간표 */
(function () {
  const PE = window.PE, React = window.React, h = PE.h, cn = PE.cn, I = PE.I;
  const { useState, useMemo, useEffect } = React;
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  const periods = Array.from({ length: PE.PERIODS }, (_, i) => i + 1);

  /* 학급 고르는 칩 줄 (학년별로 묶음) */
  function ClassChips({ classes, value, onPick, size }) {
    const grades = [...new Set(classes.map((c) => c.grade))];
    return h`<div className=${cn("cc-wrap", size)}>${grades.map((g) => h`<div className="cc-row" key=${g}>${classes.filter((c) => c.grade === g).map((c) =>
      h`<button key=${c.key} type="button" className="cc" aria-pressed=${value === c.key} style=${{ "--tag": PE.GRADE_COLORS[c.grade] }} onClick=${() => onPick(value === c.key ? null : c.key)}>${c.key}</button>`)}</div>`)}</div>`;
  }

  function Timetable() {
    const S = PE.useStore(); const { yd } = S; const today = PE.today();
    const classes = PE.myClasses(yd);
    const curSem = PE.currentSem(yd, today);
    const sem = S.state.prefs.sem || (curSem === 2 ? 2 : 1); const setSem = (v) => S.setPref("sem", v);
    const [paint, setPaint] = useState(null);            // null | 학급키 | "erase"
    const [cell, setCell] = useState(null);              // {day, period} 기초 시간표 칸 선택
    const [dayEdit, setDayEdit] = useState(null);        // 날짜 문자열
    const [applyOpen, setApplyOpen] = useState(false);
    const [clearOpen, setClearOpen] = useState(false);
    const [month, setMonth] = useState(null);
    useEffect(() => { setMonth(null); }, [sem]);
    const [copyOpen, setCopyOpen] = useState(false);
    const [flash, setFlash] = useState(0);
    const layout = S.state.prefs.scLayout, mode = S.state.prefs.scMode;
    const inSem = (x) => x.start && x.end && today >= x.start && today <= x.end;
    const todaySem = inSem(yd.sem1) ? 1 : inSem(yd.sem2) ? 2 : null;
    const goToday = () => { setSem(todaySem); setMonth(today.slice(0, 7)); setFlash((n) => n + 1); };
    useEffect(() => {
      if (!flash) return;
      const timer = setTimeout(() => {
        let d = today; while (PE.isWeekend(d)) d = PE.addDays(d, 1);
        const el = document.querySelector(`.sc-cell[data-date="${d}"]`); if (!el) return;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
      }, 80);
      return () => clearTimeout(timer);
    }, [flash]);

    const r = sem === 2 ? yd.sem2 : yd.sem1; const hasRange = r.start && r.end && r.end >= r.start;
    const weekly = yd.weekly[sem] || {};
    const off = PE.offSet(yd); const holMap = new Map(yd.holidays.map((x) => [x.start, x]));
    const stats = PE.hoursStats(yd, sem, today);
    const setCellKey = (day, period, key) => S.setWeeklyCell(sem, day, period, key);

    const clickBase = (day, period, e) => {
      const cur = (weekly[day] || {})[period];
      if (paint === "erase") setCellKey(day, period, null);
      else if (paint) setCellKey(day, period, cur === paint ? null : paint);
      else setCell({ day, period, x: e.clientX, y: e.clientY });
    };

    /* 학기 달력용 월 목록 */
    const months = useMemo(() => { if (!hasRange) return []; const out = []; let d = r.start.slice(0, 7);
      while (d <= r.end.slice(0, 7)) { out.push(d); const [y, m] = d.split("-").map(Number); d = PE.ymd(new Date(y, m, 1)).slice(0, 7); } return out; }, [r.start, r.end]);
    const view = month && months.includes(month) ? month : (months.includes(today.slice(0, 7)) ? today.slice(0, 7) : months[0]);

    /* 월~금 주 단위 줄. keep(날짜)가 거짓이면 빈 칸 */
    const weeks = useMemo(() => {
      if (!hasRange || !view) return [];
      const cont = mode === "cont"; const [y, m] = view.split("-").map(Number);
      const from = cont ? PE.parse(r.start) : new Date(y, m - 1, 1), to = cont ? PE.parse(r.end) : new Date(y, m, 0);
      const keep = (s) => (cont ? s >= r.start && s <= r.end : s.slice(0, 7) === view);
      const mon = new Date(from); mon.setDate(from.getDate() - ((from.getDay() + 6) % 7));
      const out = [];
      while (mon <= to) { const row = []; for (let i = 0; i < 5; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); const s = PE.ymd(d); row.push(keep(s) ? s : null); } if (row.some(Boolean)) out.push(row); mon.setDate(mon.getDate() + 7); }
      return out;
    }, [view, mode, r.start, r.end]);
    const pickMonth = (m) => { if (mode === "cont") { const el = document.getElementById("sc-m-" + m) || document.querySelector(`.sc-cell[data-date^="${m}-"]:not(.blank)`); if (el) el.scrollIntoView({ block: "start", behavior: "smooth" }); } else setMonth(m); };
    const scCells = [];
    const dividers = false; const seen = new Set();
    weeks.forEach((row, wi) => {
      if (dividers) for (const date of row) { if (date && !seen.has(date.slice(0, 7))) { seen.add(date.slice(0, 7)); scCells.push(h`<div key=${"m" + date} id=${"sc-m-" + date.slice(0, 7)} className="sc-month">${Number(date.slice(5, 7))}월</div>`); break; } }
      row.forEach((date, di) => {
        if (!date) { scCells.push(h`<div key=${wi + "-" + di} className="sc-cell blank"></div>`); return; }
        const inRange = date >= r.start && date <= r.end; const hol = holMap.get(date); const map = yd.schedule[date] || {};
        scCells.push(h`<button key=${date} data-date=${date} type="button" disabled=${!inRange || !!hol} className=${cn("sc-cell", hol && hol.kind, !inRange && "out", date === today && "today", date < today && inRange && "past")} onClick=${() => setDayEdit(date)} aria-label=${PE.fmt(date, { dow: true })}>
          <span className="sc-date"><b className="d num">${mode === "cont" ? `${Number(date.slice(5, 7))}.${Number(date.slice(8))}` : Number(date.slice(8))}</b>${hol ? h`<em>${hol.name}</em>` : null}</span>
          ${inRange && !hol ? h`<span className=${cn("sc-slots", layout)}>${periods.map((p) => map[p] ? h`<${PE.ClassTag} key=${p} k=${map[p]} className="mini" />` : h`<span key=${p} className="slot-empty num">${p}교시</span>`)}</span>` : null}</button>`);
      });
    });

    /* 시수 */
    const rows = classes.map((c) => ({ ...c, target: (yd.hours[sem] || {})[c.key], planned: (stats[c.key] || {}).planned || 0 }));
    const totalTarget = rows.reduce((n, x) => n + (x.target || 0), 0), totalPlanned = rows.reduce((n, x) => n + x.planned, 0);
    const diffCell = (x) => { if (x.target == null) return h`<span className="card-sub">–</span>`; const d = x.target - x.planned;
      return d === 0 ? h`<span className="diff ok">${I("check", "")} 딱 맞아요</span>` : d > 0 ? h`<span className="diff short num">${d} 부족</span>` : h`<span className="diff over num">${-d} 초과</span>`; };

    const dayMap = dayEdit ? yd.schedule[dayEdit] || {} : {};
    const setDay = (period, key) => { const next = { ...dayMap }; if (key) next[period] = key; else delete next[period]; S.setScheduleDay(dayEdit, next); };
    const weeklyOf = (date) => (yd.weekly[sem] || {})[PE.dow(date)] || {};

    const applyCount = hasRange ? PE.schoolDays(r, off).length : 0;
    const hasWeekly = Object.values(weekly).some((d) => Object.keys(d).length);
    const has1 = Object.values(yd.weekly[1] || {}).some((d) => Object.keys(d).length);

    return h`<div className="page">
      <div className="year-switch"><span className="card-sub num">${hasRange ? `${PE.fmt(r.start)} – ${PE.fmt(r.end)} · 수업일 ${applyCount}일` : "기본 설정에서 학기 기간을 먼저 정해 주세요"}</span></div>

      ${classes.length === 0 ? h`<section className="card"><p className="empty-note" style=${{ marginTop: 0 }}><a href="#settings" style=${{ color: "var(--primary)", fontWeight: 700 }}>기본 설정</a>에서 담당 학급을 먼저 골라 주세요.</p></section>` : h`
      <div className="tt-top">
        <section className="card">
          <div className="card-head tight"><div className="card-title"><span className="ico sm">${I("clock")}</span>기초 시간표 <span className="card-sub">내 한 주</span></div>
            ${sem === 2 ? h`<${PE.Button} size="sm" disabled=${!has1} onClick=${() => (hasWeekly ? setCopyOpen(true) : S.copyWeekly(1, 2))}>${I("copy")} 1학기 가져오기<//>` : null}</div>
          <div className="paint">
            <span className="paint-label">칠하기</span>
            <${ClassChips} classes=${classes} value=${paint} onPick=${(k) => setPaint(k)} />
            <button type="button" className="cc erase" aria-pressed=${paint === "erase"} onClick=${() => setPaint(paint === "erase" ? null : "erase")}>${I("eraser", "")} 지우개</button></div>
          <div className="tt">
            <span></span>${PE.DAYS.map((d, i) => h`<span className=${cn("tt-h", (new Date(today + "T00:00:00").getDay() || 7) === i + 1 && "now")} key=${d}>${d}</span>`)}
            ${periods.map((p) => h`<${React.Fragment} key=${p}><span className="tt-p num">${p}교시</span>${PE.DAYS.map((_, i) => { const day = i + 1; const key = (weekly[day] || {})[p];
              return h`<button key=${day} type="button" className=${cn("tt-cell", key && "filled")} aria-label=${`${PE.DAYS[i]}요일 ${p}교시 ${key || "비어 있음"}`} onClick=${(e) => clickBase(day, p, e)}>${key ? h`<${PE.ClassTag} k=${key} />` : h`<span className="plus">${I("plus", "")}</span>`}</button>`; })}<//>`)}
          </div>
        </section>

        <section className="card">
          <div className="card-head tight"><div className="card-title"><span className="ico sm">${I("clipboard")}</span>수업 시수 계산 <span className="card-sub">${sem}학기</span></div></div>
          <div className="hours">
            <div className="hours-h"><span>학급</span><span>목표</span><span>배정</span><span>차이</span></div>
            ${rows.map((x) => h`<div className="hours-r" key=${x.key}><span><${PE.ClassTag} k=${x.key} /></span>
              <input className="input hours-in num" type="number" min="0" inputMode="numeric" placeholder="시수" aria-label=${x.key + " 목표 시수"} value=${x.target == null ? "" : x.target} onChange=${(e) => S.setHours(sem, x.key, e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value))))} />
              <b className="num">${x.planned}</b>${diffCell(x)}</div>`)}
            <div className="hours-r total"><span>합계</span><b className="num">${totalTarget || "–"}</b><b className="num">${totalPlanned}</b><span></span></div></div>
        </section>
      </div>

      <section className="card">
        <div className="card-head tight"><div className="card-title"><span className="ico sm">${I("calendar")}</span>학기 시간표</div>
</div>
        ${!hasRange ? h`<p className="card-sub">기본 설정에서 ${sem}학기 기간을 정하면 달력이 나타나요.</p>` : h`<div>
          <div className="month-tabs">${months.map((m) => h`<button key=${m} type="button" aria-pressed=${mode !== "cont" && m === view} onClick=${() => pickMonth(m)}>${Number(m.slice(5))}월</button>`)}
            <button type="button" className="today-btn" disabled=${!todaySem} title=${todaySem ? "오늘 날짜로 이동" : "오늘은 학기 기간이 아니에요"} onClick=${goToday}>오늘</button>
            <span className="grow"></span>
            <${PE.Cycle} label="달력 보기" value=${mode} onChange=${(v) => S.setPref("scMode", v)} options=${[{ value: "month", label: "월별", icon: "calendar" }, { value: "cont", label: "연속", icon: "calrange" }]} />
            <${PE.Cycle} label="수업 배열" value=${layout} onChange=${(v) => S.setPref("scLayout", v)} options=${[{ value: "col", label: "세로", icon: "rows" }, { value: "row", label: "가로", icon: "columns" }]} />
            <${PE.Button} size="sm" variant="danger" disabled=${!hasRange} title="이 학기 시간표를 모두 삭제해요" onClick=${() => setClearOpen(true)}>${I("trash")} 삭제<//>
            <${PE.Button} size="sm" variant="primary" disabled=${!hasRange || !hasWeekly} title="기초 시간표를 학기 전체 날짜에 채워 넣어요" onClick=${() => setApplyOpen(true)}>${I("wand")} 적용<//></div>
          <div className="sc-head">${PE.DAYS.map((d) => h`<span key=${d}>${d}</span>`)}</div>
          <div className=${cn("sc", layout, mode, dividers && "div")}>${scCells}</div></div>`}
      </section>`}

      <${PE.Popover} open=${!!cell} at=${cell} onClose=${() => setCell(null)}>${cell ? h`<div className="pop-head"><b>${PE.DAYS[cell.day - 1]}요일 ${cell.period}교시</b></div>
        <${ClassChips} classes=${classes} size="md" value=${(weekly[cell.day] || {})[cell.period]} onPick=${(k) => { setCellKey(cell.day, cell.period, k); setCell(null); }} />
        <${PE.Button} size="sm" variant="danger" className="pop-del" onClick=${() => { setCellKey(cell.day, cell.period, null); setCell(null); }}>${I("trash")} 삭제<//>` : null}<//>

      <${PE.Dialog} open=${!!dayEdit} onClose=${() => setDayEdit(null)} fit>${dayEdit ? h`<h2>${PE.fmt(dayEdit, { dow: true })} 수업</h2>
        <div className="day-rows"><div className="day-row day-head"><span>교시</span><span>선택됨</span><span>학급 고르기</span></div>${periods.map((p) => h`<div className="day-row" key=${p}><span className="num">${p}교시</span><span className=${cn("day-now", !dayMap[p] && "empty")} style=${{ "--tag": dayMap[p] ? PE.GRADE_COLORS[PE.keyGrade(dayMap[p])] : undefined }}>${dayMap[p] ? h`<b className="num">${dayMap[p]}</b>` : h`<em>–</em>`}</span><div className="day-pick"><${ClassChips} classes=${classes} size="sm" value=${dayMap[p]} onPick=${(k) => setDay(p, k)} /></div></div>`)}</div>
        <div className="dialog-foot"><div><${PE.Button} onClick=${() => S.setScheduleDay(dayEdit, { ...weeklyOf(dayEdit) })}>기초 시간표로 채우기<//></div><div><${PE.Button} variant="danger" onClick=${() => S.setScheduleDay(dayEdit, {})}>삭제<//><${PE.Button} variant="primary" onClick=${() => setDayEdit(null)}>완료<//></div></div>` : null}<//>

      <${PE.Dialog} open=${applyOpen} onClose=${() => setApplyOpen(false)}><h2>기초 시간표를 ${sem}학기에 적용</h2>
        <p className="sub">수업일 ${applyCount}일에 요일별로 기초 시간표를 넣어요. 공휴일과 재량휴업일은 건너뛰어요.</p>
        <div className="apply-opts">
          <button type="button" className="apply-opt" onClick=${() => { S.applyWeekly(sem, false); setApplyOpen(false); }}><b>빈 칸만 채우기</b><span>이미 입력한 날의 수업은 그대로 둬요.</span></button>
          <button type="button" className="apply-opt" onClick=${() => { S.applyWeekly(sem, true); setApplyOpen(false); }}><b>모두 덮어쓰기</b><span>학기 시간표를 기초 시간표 그대로 새로 채워요.</span></button></div>
        <div className="dialog-foot"><div></div><div><${PE.Button} onClick=${() => setApplyOpen(false)}>취소<//></div></div><//>
      <${PE.ConfirmDialog} open=${copyOpen} title="1학기 기초 시간표를 가져올까요?" body="지금 입력된 2학기 기초 시간표는 1학기 것으로 바뀌어요. 학기 시간표는 그대로예요." confirmLabel="가져오기" onClose=${() => setCopyOpen(false)} onConfirm=${() => { S.copyWeekly(1, 2); setCopyOpen(false); }} />
      <${PE.ConfirmDialog} open=${clearOpen} danger title=${sem + "학기 시간표를 삭제할까요?"} body="이 학기에 입력된 모든 날의 수업이 삭제돼요. 기초 시간표는 그대로 남아요." confirmLabel="삭제" onClose=${() => setClearOpen(false)} onConfirm=${() => { S.clearSchedule(sem); setClearOpen(false); }} />
    </div>`;
  }
  PE.pages = PE.pages || {};
  PE.pages.timetable = Timetable;
})();
