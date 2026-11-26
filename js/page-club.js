/* 스포츠클럽: 개설 안내 · 학생 구성 · 시수 진행률 · 원터치 출석 */
(function () {
  const PE = window.PE, React = window.React, h = PE.h, cn = PE.cn, I = PE.I;
  const { useState, useMemo } = React;

  /* 단계 표시 (여러 화면에서 같이 써요) */
  PE.Steps = ({ steps, at }) => h`<ol className="wiz-steps">${steps.map((s, i) => h`<li key=${s} className=${cn(i === at && "on", i < at && "done")}><i>${i < at ? I("check", "") : i + 1}</i><span>${s}</span></li>`)}</ol>`;

  /* 학생 고르기 본문: 왼쪽은 반·성별·검색으로 고르는 명단, 오른쪽은 지금까지 고른 학생 */
  const GORDER = ["", "M", "F"]; const GTXT = { "": "전체", M: "♂ 남", F: "♀ 여" };
  const GenderCycle = ({ value, onChange }) => { const nx = GORDER[(GORDER.indexOf(value) + 1) % 3];
    return h`<button type="button" className=${cn("btn sm cycle gcyc", value)} aria-label=${`성별 보기: 지금 ${GTXT[value]}. 누르면 ${GTXT[nx]}`} title=${`누르면 ${GTXT[nx]}`} onClick=${() => onChange(nx)}>${value ? GTXT[value] : h`${I("users")}전체`}</button>`; };
  PE.StudentPickBody = function StudentPickBody({ students, classes, sel, setSel, tagOf }) {
    const [ck, setCk] = useState(classes[0] ? classes[0].key : null); const [q, setQ] = useState(""); const [g, setG] = useState("");
    const query = q.trim();
    const list = useMemo(() => (query ? students.filter((x) => x.name.includes(query) || (x.foreign || "").toLowerCase().includes(query.toLowerCase())) : students.filter((x) => `${x.grade}-${x.klass}` === ck))
      .filter((x) => !g || x.gender === g).slice().sort((a, b) => a.grade - b.grade || a.klass - b.klass || a.number - b.number), [students, ck, query, g]);
    const has = new Set(sel); const allIn = list.length > 0 && list.every((x) => has.has(x.id));
    const toggle = (id) => setSel(has.has(id) ? sel.filter((x) => x !== id) : [...sel, id]);
    const toggleAll = () => { const ids = list.map((x) => x.id); setSel(allIn ? sel.filter((x) => !ids.includes(x)) : [...sel, ...ids.filter((x) => !has.has(x))]); };
    const cnt = (key) => students.filter((x) => `${x.grade}-${x.klass}` === key && has.has(x.id)).length;
    const byId = useMemo(() => new Map(students.map((x) => [x.id, x])), [students]);
    const chosen = sel.map((id) => byId.get(id)).filter(Boolean).sort((a, b) => a.grade - b.grade || a.klass - b.klass || a.number - b.number);
    return h`<div className="spick2">
      <div className="sp-left">
        <input className="input" placeholder="이름 검색" aria-label="이름 검색" value=${q} onChange=${(e) => setQ(e.target.value)} />
        <div className="sp-cls"><div className="cc-row" style=${{ opacity: query ? 0.4 : 1 }}>${classes.map((c) => h`<button key=${c.key} type="button" className="cc" style=${{ "--tag": PE.GRADE_COLORS[c.grade] }} aria-pressed=${!query && ck === c.key} onClick=${() => { setQ(""); setCk(c.key); }}>${c.key}${cnt(c.key) ? h`<small className="num"> ${cnt(c.key)}</small>` : null}</button>`)}</div>
          <${GenderCycle} value=${g} onChange=${setG} /></div>
        <div className="spick-bar">${list.length ? h`<button type="button" className="link-btn" onClick=${toggleAll}>${allIn ? "보이는 학생 모두 해제" : "보이는 학생 모두 선택"}</button>` : h`<span></span>`}</div>
        <div className="spick-list">${list.map((x) => h`<button key=${x.id} type="button" className="sib-r" aria-pressed=${has.has(x.id)} onClick=${() => toggle(x.id)}><span className="check">${has.has(x.id) ? I("check", "") : null}</span><${PE.ClassTag} k=${x.grade + "-" + x.klass} /><span className="num sib-no">${x.number}</span><b><${PE.Nm} name=${x.name} /></b>${tagOf ? h`<span className="team-slot">${tagOf[x.id] ? h`<span className="in-team" title=${tagOf[x.id]}>${tagOf[x.id]}</span>` : null}</span>` : null}<span className=${cn("g-pill", x.gender)}>${x.gender === "M" ? "♂ 남" : x.gender === "F" ? "♀ 여" : "–"}</span></button>`)}
          ${!list.length ? h`<p className="card-sub" style=${{ padding: 10 }}>${students.length ? "여기에 해당하는 학생이 없어요." : "명렬표에 학생을 먼저 넣어 주세요."}</p>` : null}</div></div>
      <div className="sp-right"><div className="spick-bar"><span className="card-sub num">선택 ${sel.length}명</span>${sel.length ? h`<button type="button" className="link-btn" onClick=${() => setSel([])}>모두 지우기</button>` : null}</div>
        <div className="sp-chosen">${chosen.map((x) => h`<button key=${x.id} type="button" className=${cn("sp-chip", x.gender)} title="누르면 빼요" onClick=${() => toggle(x.id)}><small className="num">${x.grade}-${x.klass}</small><b><${PE.Nm} name=${x.name} /></b><span className="sx">${x.gender === "M" ? "♂" : x.gender === "F" ? "♀" : ""}</span>${I("x", "")}</button>`)}</div></div></div>`;
  };
  PE.StudentPicker = function StudentPicker({ title, students, classes, value, onDone, onClose, tagOf }) {
    const [sel, setSel] = useState(value || []);
    return h`<${PE.Dialog} open=${true} onClose=${onClose} wide><h2>${title || "학생 고르기"}</h2>
      <${PE.StudentPickBody} students=${students} classes=${classes} sel=${sel} setSel=${setSel} tagOf=${tagOf} />
      <div className="dialog-foot"><div></div><div><${PE.Button} onClick=${onClose}>취소<//><${PE.Button} variant="primary" onClick=${() => onDone(sel)}>${sel.length}명 선택 완료<//></div></div><//>`;
  };

  const TIMES = [{ value: "아침", label: "아침" }, { value: "점심", label: "점심" }, { value: "방과후", label: "방과후" }];
  const NumIn = ({ value, onChange, min = 1, max = 999, label }) => h`<input className="input num-in num" type="number" inputMode="numeric" aria-label=${label} min=${min} max=${max} value=${value} onChange=${(e) => { const n = Math.floor(Number(e.target.value)); onChange(Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0); }} />`;
  PE.NumIn = NumIn;
  /* 알약 모양 − 숫자 + (숫자는 직접 입력도 가능) */
  function NumStepper({ value, onChange, min = 1, max = 999, label, tone }) {
    const [txt, setTxt] = useState(null);
    const clamp = (n) => Math.min(max, Math.max(min, n));
    const commit = () => { if (txt == null) return; const n = Math.floor(Number(txt)); setTxt(null); if (txt !== "" && Number.isFinite(n)) onChange(clamp(n)); };
    return h`<div className=${cn("stepper", tone && "tone")} role="group" aria-label=${label}>
      <button type="button" aria-label="줄이기" disabled=${value <= min} onClick=${() => onChange(clamp(value - 1))}>${I("minus")}</button>
      <input className="num step-in" inputMode="numeric" aria-label=${label} value=${txt != null ? txt : value} onFocus=${(e) => e.target.select()} onChange=${(e) => setTxt(e.target.value.replace(/\D/g, "").slice(0, 3))} onBlur=${commit} onKeyDown=${(e) => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); } }} />
      <button type="button" aria-label="늘리기" disabled=${value >= max} onClick=${() => onChange(clamp(value + 1))}>${I("plus")}</button></div>`;
  }

  /* 클럽 개설·수정 안내 창 */
  PE.NumStepper = NumStepper;
  function ClubWizard({ init, students, classes, onClose, onSave }) {
    const [step, setStep] = useState(0);
    const [d, setD] = useState(() => init ? { ...init } : { name: "", time: "", days: [], place: "", total: 30, per: 1, members: [] });
    const STEPS = ["기본 정보", "운영 시수", "학생"];
    const ok = [d.name.trim().length > 0, d.total >= 1 && d.per >= 1, true][step];
    const times = d.per > 0 ? Math.ceil(d.total / d.per) : 0;
    return h`<${PE.Dialog} open=${true} onClose=${onClose} wide=${step === 2}><h2>${init ? "클럽 수정" : "스포츠클럽 개설"}</h2>
      <${PE.Steps} steps=${STEPS} at=${step} />
      ${step === 0 ? h`<div className="wiz-body">
        <div className="field"><label htmlFor="cl-nm">클럽 이름</label><input id="cl-nm" className="input" autoFocus placeholder="예: 아침 피구부" value=${d.name} onChange=${(e) => setD({ ...d, name: e.target.value })} /></div>
        <div className="field"><label>운영 요일 <small className="opt">선택</small></label><div className="cc-row">${PE.DAYS.map((x) => h`<button key=${x} type="button" className="cc" aria-pressed=${d.days.includes(x)} onClick=${() => setD({ ...d, days: d.days.includes(x) ? d.days.filter((y) => y !== x) : PE.DAYS.filter((y) => y === x || d.days.includes(y)) })}>${x}</button>`)}</div></div>
        <div className="field"><label>운영 시간 <small className="opt">선택</small></label><div className="cc-row">${TIMES.map((x) => h`<button key=${x.value} type="button" className="cc" aria-pressed=${d.time === x.value} onClick=${() => setD({ ...d, time: d.time === x.value ? "" : x.value })}>${x.label}</button>`)}</div></div></div>` : null}
      ${step === 1 ? h`<div className="wiz-body">
        <div className="set-row"><b>총 운영 시수</b><span className="unit-in"><${NumStepper} label="총 운영 시수" max=${999} value=${d.total} onChange=${(v) => setD({ ...d, total: v })} />시간</span></div>
        <div className="set-row"><b>1회 운영 시수</b><span className="unit-in"><${NumStepper} label="1회 운영 시수" max=${24} value=${d.per} onChange=${(v) => setD({ ...d, per: v })} />시간</span></div>
        <p className="wiz-note num">모두 <b>${times}회</b> 운영하면 ${d.total}시간을 채워요.</p></div>` : null}
      ${step === 2 ? h`<div className="wiz-body"><${PE.StudentPickBody} students=${students} classes=${classes} sel=${d.members} setSel=${(m) => setD({ ...d, members: m })} /></div>` : null}
      <div className="dialog-foot"><div>${step > 0 ? h`<${PE.Button} onClick=${() => setStep(step - 1)}>이전<//>` : null}</div>
        <div><${PE.Button} onClick=${onClose}>취소<//>${step < 2 ? h`<${PE.Button} variant="primary" disabled=${!ok} onClick=${() => setStep(step + 1)}>다음<//>` : h`<${PE.Button} variant="primary" onClick=${() => onSave({ ...d, name: d.name.trim(), place: "" })}>${init ? "저장" : "개설"}<//>`}</div></div><//>`;
  }

  const doneHours = (c) => c.sessions.reduce((a, s) => a + (s.hours || 0), 0);
  const pctOf = (c) => (c.total > 0 ? Math.min(100, Math.round((doneHours(c) / c.total) * 100)) : 0);
  const md = (d) => { const [, m, dd] = d.split("-"); return `${Number(m)}.${Number(dd)}`; };
  const rate = (n, t) => (t ? Math.round((n / t) * 100) + "%" : "–");

  /* 선택한 클럽의 세부 내용: 같은 화면 아래에 펼쳐요 */
  function ClubDetail({ club, S, students, classes, onGone }) {
    const [flip, setFlip] = PE.useSaved("clubFlip", false); const [edit, setEdit] = useState(false); const [del, setDel] = useState(false); const [ses, setSes] = useState(null);
    const upd = (fn) => S.updYear((y) => ({ ...y, clubs: y.clubs.map((c) => (c.id === club.id ? fn(c) : c)) }));
    const byId = useMemo(() => new Map(students.map((x) => [x.id, x])), [students]);
    const mem = club.members.map((id) => byId.get(id)).filter(Boolean).sort((a, b) => a.grade - b.grade || a.klass - b.klass || a.number - b.number);
    const sessions = [...club.sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const done = doneHours(club), pct = pctOf(club), N = sessions.length;
    const addSession = () => upd((c) => ({ ...c, sessions: [...c.sessions, { id: PE.uid(), date: PE.today(), hours: c.per, absent: [] }] }));
    const toggle = (sid, stu) => upd((c) => ({ ...c, sessions: c.sessions.map((s) => (s.id === sid ? { ...s, absent: s.absent.includes(stu) ? s.absent.filter((x) => x !== stu) : [...s.absent, stu] } : s)) }));
    const att = (stu) => sessions.filter((s) => !s.absent.includes(stu)).length;
    const here = (s) => mem.filter((x) => !s.absent.includes(x.id)).length;
    const cell = (s, x) => { const ab = s.absent.includes(x.id); return h`<button type="button" className=${cn("att", ab && "no")} aria-label=${`${x.name} ${md(s.date)} ${ab ? "결석" : "출석"}`} onClick=${() => toggle(s.id, x.id)}>${ab ? I("x", "") : I("check", "")}</button>`; };
    const sHead = (s) => h`<button type="button" className="ses-h" title="날짜·시수 고치기" onClick=${() => setSes(s)}><b className="num">${md(s.date)}</b><small className="num">${s.hours}시간</small></button>`;
    const stuInline = (x) => h`<span className="stu-i"><${PE.ClassTag} k=${x.grade + "-" + x.klass} /><b>${x.name}</b></span>`;
    const stuHead = (x) => h`<span className="stu-h"><${PE.ClassTag} k=${x.grade + "-" + x.klass} /><b>${x.name}</b></span>`;
    const cur = ses ? club.sessions.find((s) => s.id === ses.id) : null;
    const remain = Math.max(0, Math.ceil((club.total - done) / (club.per || 1)));
    return h`<section className="card">
        <div className="card-head tight"><div className="cd-nm"><div className="card-title" style=${{ fontSize: "var(--fs-lg)" }}>${club.name}</div><span className="card-sub num">${done} / ${club.total}시간 · ${N}회 운영 · 남은 ${remain}회</span></div>
          <div className="club-meta">${club.time ? h`<span className="badge">${club.time}</span>` : null}${club.days.length ? h`<span className="badge">${club.days.join("·")}</span>` : null}<span className="badge num">${mem.length}명</span>
            <${PE.Button} size="sm" onClick=${() => setEdit(true)}>${I("pencil")} 수정<//><${PE.Button} icon size="sm" variant="danger" aria-label="클럽 삭제" onClick=${() => setDel(true)}>${I("trash")}<//></div></div>
        <div className="cd-prog club"><${PE.Bar} pctText pct=${pct} runner=${PE.useStore().state.prefs.runner !== false ? "kid" : false} label="운영 진행률" /></div></section>
      <section className="card">
        <div className="card-head tight"><div className="card-title">출석부</div>
          <div className="bar-btns"><${PE.Button} size="sm" onClick=${() => setFlip(!flip)} title="행과 열을 서로 바꿔요">${I("swap")} 행열 전환<//>
            <${PE.Button} size="sm" variant="primary" disabled=${!mem.length} onClick=${addSession}>${I("plus")} 오늘 출석<//></div></div>
        ${!mem.length ? h`<p className="card-sub">‘수정’의 3단계에서 클럽 학생을 넣어 주세요.</p>` : !N ? h`<p className="card-sub">‘오늘 출석’을 누르면 모두 출석으로 한 줄이 생겨요. 빠진 학생만 눌러서 결석으로 바꾸면 돼요.</p>` : h`<div className="paps-scroll">${!flip ? h`<table className="att-t">
          <thead><tr><th className="stick">학생</th><th>출석</th><th>출석률</th>${sessions.map((s) => h`<th key=${s.id}>${sHead(s)}</th>`)}</tr></thead>
          <tbody>${mem.map((x) => h`<tr key=${x.id}><td className="stick">${stuInline(x)}</td><td className="num att-n">${att(x.id)}/${N}</td><td className="num att-n">${rate(att(x.id), N)}</td>${sessions.map((s) => h`<td key=${s.id}>${cell(s, x)}</td>`)}</tr>`)}</tbody>
          <tfoot><tr><td className="stick">출석</td><td></td><td></td>${sessions.map((s) => h`<td key=${s.id} className="num att-n">${here(s)}/${mem.length}</td>`)}</tr></tfoot></table>` : h`<table className="att-t">
          <thead><tr><th className="stick">날짜</th><th>출석</th>${mem.map((x) => h`<th key=${x.id}>${stuHead(x)}</th>`)}</tr></thead>
          <tbody><tr><td className="stick">출석</td><td></td>${mem.map((x) => h`<td key=${x.id} className="num att-n">${att(x.id)}/${N}</td>`)}</tr>
            <tr><td className="stick">출석률</td><td></td>${mem.map((x) => h`<td key=${x.id} className="num att-n">${rate(att(x.id), N)}</td>`)}</tr>
            ${sessions.map((s) => h`<tr key=${s.id}><td className="stick">${sHead(s)}</td><td className="num att-n">${here(s)}/${mem.length}</td>${mem.map((x) => h`<td key=${x.id}>${cell(s, x)}</td>`)}</tr>`)}</tbody></table>`}</div>`}</section>
      ${edit ? h`<${ClubWizard} init=${club} students=${students} classes=${classes} onClose=${() => setEdit(false)} onSave=${(d) => { upd((c) => ({ ...c, ...d, sessions: c.sessions })); setEdit(false); }} />` : null}
      ${cur ? h`<${PE.Dialog} open=${true} onClose=${() => setSes(null)} narrow><h2>운영 기록</h2>
        <div className="stu-form" style=${{ marginTop: 12 }}>
          <div className="field"><label>날짜</label><${PE.DatePicker} id="ses-date" label="날짜" value=${cur.date} onChange=${(v) => v && upd((c) => ({ ...c, sessions: c.sessions.map((s) => (s.id === cur.id ? { ...s, date: v } : s)) }))} /></div>
          <div className="field"><label>시수</label><${PE.Stepper} label="시수" min=${1} max=${8} value=${cur.hours} onChange=${(v) => upd((c) => ({ ...c, sessions: c.sessions.map((s) => (s.id === cur.id ? { ...s, hours: v } : s)) }))} /></div></div>
        <div className="dialog-foot"><div><${PE.Button} variant="danger" onClick=${() => { upd((c) => ({ ...c, sessions: c.sessions.filter((s) => s.id !== cur.id) })); setSes(null); }}>${I("trash")} 삭제<//></div><${PE.Button} variant="primary" onClick=${() => setSes(null)}>완료<//></div><//>` : null}
      <${PE.ConfirmDialog} open=${del} danger title=${`‘${club.name}’ 클럽을 삭제할까요?`} body="출석 기록도 함께 삭제돼요." confirmLabel="삭제" onClose=${() => setDel(false)} onConfirm=${() => { S.updYear((y) => ({ ...y, clubs: y.clubs.filter((c) => c.id !== club.id) })); setDel(false); onGone(); }} />`;
  }

  function Clubs() {
    const S = PE.useStore(); const { yd } = S; const classes = PE.myClasses(yd);
    const [sel, setSel] = PE.useSaved("clubSel", null); const [wiz, setWiz] = useState(false);
    const club = yd.clubs.find((c) => c.id === sel) || yd.clubs[0] || null;
    return h`<div className="page">
      <div className="roster-bar">
        <div className="club-chips six">${yd.clubs.map((c) => h`<button key=${c.id} type="button" className="club-chip" aria-pressed=${club && club.id === c.id} onClick=${() => setSel(c.id)}>
          <span className="cc-top">${c.time ? h`<span className="badge">${c.time}</span>` : null}<b>${c.name}</b></span>
          <span className="cc-bar"><${PE.Bar} pct=${pctOf(c)} label="운영 진행률" /><em className="num">${pctOf(c)}%</em></span></button>`)}</div>
        <${PE.Button} size="sm" variant="primary" onClick=${() => setWiz(true)}>${I("plus")} 클럽 개설<//></div>
      ${club ? h`<${ClubDetail} key=${club.id} club=${club} S=${S} students=${yd.students} classes=${classes} onGone=${() => setSel(null)} />` : null}
      ${wiz ? h`<${ClubWizard} students=${yd.students} classes=${classes} onClose=${() => setWiz(false)} onSave=${(d) => { const id = PE.uid(); S.updYear((y) => ({ ...y, clubs: [...y.clubs, { ...d, id, sessions: [] }] })); setWiz(false); setSel(id); }} />` : null}
    </div>`;
  }
  PE.pages = PE.pages || {};
  PE.pages.club = Clubs;
})();
