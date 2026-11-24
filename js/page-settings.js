/* 기본 설정: 학기 날짜 → 쉬는 날 → 담당 학급 */
(function () {
  const PE = window.PE, React = window.React, h = PE.h, cn = PE.cn, I = PE.I;
  const { useState } = React;
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];

  function HolidayDialog({ draft, marks, onClose, onSave, onDelete }) {
    const [d, setD] = useState(draft);
    React.useEffect(() => setD(draft), [draft]);
    if (!draft || !d) return null;
    const editing = draft.exists; const ok = d.name.trim() && d.start;
    const save = () => onSave({ ...d, name: d.name.trim(), end: d.start });
    return h`<${PE.Dialog} open=${true} onClose=${onClose}>
      <h2>${editing ? "쉬는 날 수정" : "쉬는 날 추가"}</h2><p className="sub">공휴일이나 재량휴업일이 달라지면 여기서 바로 고치세요.</p>
      <div className="field"><label>종류</label>
        <${PE.Seg} label="종류" value=${d.kind} onChange=${(kind) => setD({ ...d, kind, name: d.name || (kind === "closure" ? "재량휴업일" : "") })} options=${[{ value: "holiday", label: "공휴일" }, { value: "closure", label: "재량휴업일" }]} /></div>
      <div className="two" style=${{ marginTop: 12, alignItems: "end" }}>
        <div className="field"><label htmlFor="hs">날짜</label><${PE.DatePicker} id="hs" value=${d.start} marks=${marks} onChange=${(v) => setD({ ...d, start: v })} /></div>
        <div className="field"><label htmlFor="hn">이름</label>
          <input id="hn" className="input" autoFocus value=${d.name} placeholder=${d.kind === "closure" ? "예: 재량휴업일" : "예: 선거일"} onChange=${(e) => setD({ ...d, name: e.target.value })} onKeyDown=${(e) => e.key === "Enter" && ok && save()} /></div></div>
      <div className="dialog-foot"><div>${editing ? h`<${PE.Button} variant="danger" onClick=${() => onDelete(d.id)}>${I("trash")} 삭제<//>` : null}</div>
        <div><${PE.Button} onClick=${onClose}>취소<//><${PE.Button} variant="primary" disabled=${!ok} onClick=${save}>저장<//></div></div><//>`;
  }

  function Settings() {
    const S = PE.useStore(); const { yd, state } = S; const year = state.year; const today = PE.today();
    const [draft, setDraft] = useState(null); const [delYear, setDelYear] = useState(false);
    const years = Object.keys(state.years).map(Number).sort();
    const off = PE.offSet(yd);
    const kindOf = new Map(yd.holidays.map((x) => [x.start, x.kind]));
    const marks = (d) => kindOf.get(d);

    const bad = (k) => yd[k].start && yd[k].end && yd[k].end < yd[k].start;
    const days = (k) => (yd[k].start && yd[k].end && !bad(k) ? `수업일 ${PE.schoolDays(yd[k], off).length}일` : "기간을 정해 주세요");
    const group = (key, title, cls) => h`<div className=${cn("sem-group", cls)}>
      <div className="sem-group-head"><b>${title}</b><span className="num">${bad(key) ? "종료일이 시작일보다 빨라요" : days(key)}</span></div>
      <div className="sem-range">
        <div className="field"><label htmlFor=${key + "s"}>시작</label><${PE.DatePicker} id=${key + "s"} value=${yd[key].start} marks=${marks} onChange=${(v) => S.setRange(key, v, yd[key].end)} /></div>
        <span className="sem-arrow" aria-hidden="true">→</span>
        <div className="field"><label htmlFor=${key + "e"}>종료</label><${PE.DatePicker} id=${key + "e"} value=${yd[key].end} min=${yd[key].start} marks=${marks} onChange=${(v) => S.setRange(key, yd[key].start, v)} /></div></div></div>`;

    const sorted = [...yd.holidays].sort((a, b) => a.start.localeCompare(b.start));
    const short = (s) => { const d = PE.parse(s); return `${d.getMonth() + 1}.${d.getDate()}(${DOW[d.getDay()]})`; };
    const total = Object.values(yd.grades).reduce((n, g) => n + g.mine.length, 0);
    const defaults = PE.defaultHolidays(year);

    const gradeRow = (g) => { const gd = yd.grades[g];
      return h`<div className="grade-set" key=${g}><span className="lbl">${g}학년</span>
        <${PE.Stepper} value=${gd.count} min=${0} max=${12} label=${g + "학년 반 수"} onChange=${(n) => S.setClassCount(g, n)} />
        <div className="chips">${gd.count === 0 ? h`<span className="card-sub">반이 없어요</span>` : Array.from({ length: gd.count }, (_, i) => i + 1).map((k) =>
          h`<button key=${k} type="button" className="chip" aria-pressed=${gd.mine.includes(k)} onClick=${() => S.toggleClass(g, k)}>${k}반</button>`)}</div></div>`; };

    return h`<div className="page">
      <div className="year-switch">
        <${PE.Seg} label="학년도" value=${year} onChange=${S.setYear} options=${years.map((y) => ({ value: y, label: y + "학년도" }))} />
        <${PE.Button} size="sm" onClick=${S.addYear}>${I("plus")} 새 학년도 시작<//>
        ${years.length > 1 ? h`<${PE.Button} size="sm" variant="ghost danger" onClick=${() => setDelYear(true)}>${I("trash")} ${year}학년도 삭제<//>` : null}</div>

      <section className="card">
        <div className="card-head"><div className="card-title"><span className="ico">${I("calendar")}</span>학기 기간</div></div>
        <div className="sem-groups">${group("sem1", "1학기", "s1")}${group("sem2", "2학기", "s2")}</div>
      </section>

      <section className="card">
        <div className="card-head"><div className="card-title"><span className="ico">${I("flag")}</span>공휴일 · 재량휴업일 <span className="badge num">${sorted.length}</span></div>
          <div style=${{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span className="card-sub"><span style=${{ color: "var(--holiday)" }}>●</span> 공휴일 <span style=${{ color: "var(--closure)", marginLeft: 8 }}>●</span> 재량휴업일</span>
            <${PE.Button} size="sm" onClick=${() => S.loadDefaultHolidays(year)}>${I("wand")} 기본 공휴일 불러오기<//>
            <${PE.Button} size="sm" variant="primary" onClick=${() => setDraft({ id: PE.uid(), kind: "holiday", name: "", start: today, end: today })}>${I("plus")} 추가<//></div></div>
        ${defaults.missingLunar ? h`<p className="card-sub" style=${{ marginBottom: 10 }}>음력 공휴일이 준비되지 않은 해예요. 설날·추석 등은 직접 추가해 주세요.</p>` : null}
        ${sorted.length === 0 ? h`<p className="card-sub">등록된 날이 없어요. 기본 공휴일을 불러오거나 직접 추가하세요.</p>` : h`<div className="hol-grid">${sorted.map((x) =>
          h`<button key=${x.id} type="button" className=${cn("hol-chip", x.kind)} title=${(x.kind === "closure" ? "재량휴업일" : "공휴일") + " · 눌러서 수정"} onClick=${() => setDraft({ ...x, exists: true })}><i></i><b>${short(x.start)}</b><span>${x.name}</span></button>`)}</div>`}
      </section>

      <section className="card">
        <div className="card-head"><div className="card-title"><span className="ico">${I("users")}</span>담당 학년 · 학급</div><span className="badge">담당 ${total}개 반</span></div>
        <div className="class-cols"><div>${[1, 2, 3].map(gradeRow)}</div><div>${[4, 5, 6].map(gradeRow)}</div></div>
      </section>
      <${HolidayDialog} draft=${draft} marks=${marks} onClose=${() => setDraft(null)} onSave=${(x) => { const { exists, ...clean } = x; S.saveHoliday(clean); setDraft(null); }} onDelete=${(id) => { S.removeHoliday(id); setDraft(null); }} />
      <${PE.ConfirmDialog} open=${delYear} danger title=${year + "학년도를 삭제할까요?"} body="이 학년도의 학기 날짜, 쉬는 날, 시간표가 모두 사라지고 되돌릴 수 없어요." confirmLabel="삭제" onClose=${() => setDelYear(false)} onConfirm=${() => { S.removeYear(year); setDelYear(false); }} />
    </div>`;
  }
  PE.pages = PE.pages || {};
  PE.pages.settings = Settings;
})();
