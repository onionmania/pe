/* 명렬표: 반별 학생 명단 (항목 커스텀 · 1~4반 동시 보기 · 엑셀) */
(function () {
  const PE = window.PE, React = window.React, h = PE.h, cn = PE.cn, I = PE.I;
  const { useState, useMemo, useRef } = React;
  const GENDER = { M: "남", F: "여" };
  const nextGender = (g) => (g === "M" ? "F" : g === "F" ? "" : "M");
  const toGender = (v) => { const t = String(v == null ? "" : v).trim(); return /^(남|남자|M|male)$/i.test(t) ? "M" : /^(여|여자|F|female)$/i.test(t) ? "F" : ""; };
  const COLS = [{ value: 1, label: "1반 보기", icon: "grid" }, { value: 2, label: "2반 보기", icon: "grid" }, { value: 3, label: "3반 보기", icon: "grid" }, { value: 4, label: "4반 보기", icon: "grid" }];

  const sibList = (v) => (Array.isArray(v) ? v : []);
  const sibText = (v, byId) => (Array.isArray(v) ? v.map((id) => byId.get(id)).filter(Boolean).map((o) => `${o.name}(${o.grade}-${o.klass})`).join(", ") : typeof v === "string" ? v : "");

  /* 형제자매 고르기: 반 버튼 → 그 반 명단에서 클릭, 또는 이름 검색 */
  function SiblingPicker({ students, classes, selfId, value, onDone, onClose }) {
    const [sel, setSel] = useState(value); const [ck, setCk] = useState(null); const [q, setQ] = useState("");
    const query = q.trim();
    const list = useMemo(() => {
      const base = query ? students.filter((x) => x.name.includes(query) || (x.foreign || "").toLowerCase().includes(query.toLowerCase())) : ck ? students.filter((x) => `${x.grade}-${x.klass}` === ck) : [];
      return base.filter((x) => x.id !== selfId).sort((a, b) => a.grade - b.grade || a.klass - b.klass || a.number - b.number);
    }, [students, ck, query]);
    const toggle = (id) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
    const byId = new Map(students.map((x) => [x.id, x]));
    return h`<${PE.Dialog} open=${true} onClose=${onClose} mid><h2>형제자매 고르기</h2>
      <input className="input" placeholder="이름 검색" aria-label="이름 검색" value=${q} onChange=${(e) => setQ(e.target.value)} style=${{ margin: "10px 0" }} />
      <div className="cc-row" style=${{ opacity: query ? 0.4 : 1 }}>${classes.map((c) => h`<button key=${c.key} type="button" className="cc" style=${{ "--tag": PE.GRADE_COLORS[c.grade] }} aria-pressed=${!query && ck === c.key} onClick=${() => { setQ(""); setCk(ck === c.key ? null : c.key); }}>${c.key}</button>`)}</div>
      <div className="sib-list">${list.map((x) => h`<button key=${x.id} type="button" className="sib-r" aria-pressed=${sel.includes(x.id)} onClick=${() => toggle(x.id)}><span className="check">${sel.includes(x.id) ? I("check", "") : null}</span><${PE.ClassTag} k=${x.grade + "-" + x.klass} /><span className="num sib-no">${x.number}</span><b><${PE.Nm} name=${x.name} /></b></button>`)}
        ${(query || ck) && !list.length ? h`<p className="card-sub" style=${{ padding: 8 }}>찾는 학생이 없어요.</p>` : null}</div>
      ${sel.length ? h`<div className="sib-sel">${sel.map((id) => byId.get(id)).filter(Boolean).map((o) => h`<span key=${o.id} className="sib-chip"><${PE.Nm} name=${o.name} /><small>${o.grade}-${o.klass}</small></span>`)}</div>` : null}
      <div className="dialog-foot"><div></div><div><${PE.Button} onClick=${onClose}>취소<//><${PE.Button} variant="primary" onClick=${() => onDone(sel)}>선택 완료<//></div></div><//>`;
  }

  /* 항목 관리: 성별은 고정, 나머지는 만들고 지우기 */
  function FieldsDialog({ open, onClose, fields, S }) {
    const hideGender = !!S.state.prefs.hideGender;
    const [nm, setNm] = useState(""); const [del, setDel] = useState(null);
    const add = () => { const v = nm.trim(); if (!v || fields.some((f) => f.name === v)) return; S.addField(v); setNm(""); };
    return h`<${PE.Dialog} open=${open} onClose=${onClose} narrow><h2>항목 관리</h2><p className="sub">번호·이름·성별 말고 적어 둘 항목을 만들어요.</p>
      <div className="fields-list">
        <div className="field-row fixed"><span>성별</span><${PE.Button} icon variant="ghost" aria-label=${hideGender ? "성별 보이기" : "성별 숨기기"} title=${hideGender ? "지금 숨김 · 누르면 보여요" : "누르면 명렬표에서 숨겨요"} onClick=${() => S.setPref("hideGender", !hideGender)}>${I(hideGender ? "eyeoff" : "eye")}<//><${PE.Button} icon variant="ghost" disabled aria-label="성별은 삭제할 수 없어요" title="성별은 삭제할 수 없어요">${I("trashoff")}<//></div>
        ${fields.map((f) => h`<div className="field-row" key=${f.id}><input className="input" aria-label="항목 이름" value=${f.name} onChange=${(e) => S.renameField(f.id, e.target.value)} onBlur=${(e) => { if (!e.target.value.trim()) S.renameField(f.id, "항목"); }} /><${PE.Button} icon variant="ghost" aria-label=${f.name + (f.hidden ? " 보이기" : " 숨기기")} title=${f.hidden ? "지금 숨김 · 누르면 보여요" : "누르면 명렬표에서 숨겨요"} onClick=${() => S.setFieldHidden(f.id, !f.hidden)}>${I(f.hidden ? "eyeoff" : "eye")}<//><${PE.Button} icon variant="ghost" aria-label=${f.name + " 삭제"} onClick=${() => setDel(f)}>${I("trash")}<//></div>`)}
        <form className="field-row" onSubmit=${(e) => { e.preventDefault(); add(); }}><input className="input" placeholder="새 항목 (예: 특이사항)" aria-label="새 항목 이름" value=${nm} onChange=${(e) => setNm(e.target.value)} /><${PE.Button} icon variant="primary" type="submit" aria-label="항목 추가" disabled=${!nm.trim()}>${I("plus")}<//></form></div>
      <div className="dialog-foot"><div></div><${PE.Button} variant="primary" onClick=${onClose}>완료<//></div>
      <${PE.ConfirmDialog} open=${!!del} danger title=${del ? `‘${del.name}’ 항목을 삭제할까요?` : ""} body="이 항목에 입력된 값이 모든 반에서 함께 삭제돼요." confirmLabel="삭제" onClose=${() => setDel(null)} onConfirm=${() => { S.removeField(del.id); setDel(null); }} /><//>`;
  }

  /* 엑셀(.xlsx) 또는 예전 웹의 .json 가져오기 */
  function ImportDialog({ open, onClose, classes, onApply, onTemplate }) {
    const [info, setInfo] = useState(null); const [err, setErr] = useState(""); const fileIn = useRef(null);
    const close = () => { setInfo(null); setErr(""); onClose(); };
    const mine = new Set(classes.map((c) => c.key));
    const finish = (by, names, skipped) => { for (const k of Object.keys(by)) { by[k].sort((a, b) => (a.number || 1e9) - (b.number || 1e9)).forEach((x, i) => { x.number = i + 1; }); } setInfo({ by, names: [...names], skipped }); };
    const fromJson = (d) => {
      const arr = Array.isArray(d) ? d : d.students; if (!Array.isArray(arr)) throw new Error("x");
      const by = {}, names = new Set(); let skipped = 0;
      for (const x of arr) { const key = `${x.grade}-${x.klass}`; if (!mine.has(key) || !x.name) { skipped++; continue; }
        const extra = {}; const sib = x.siblings || (x.custom && x.custom.siblings); const memo = x.notes || (x.custom && x.custom.notes);
        if (sib) { extra["형제자매"] = String(sib); names.add("형제자매"); } if (memo) { extra["메모"] = String(memo); names.add("메모"); }
        (by[key] = by[key] || []).push({ number: Number(x.number) || 0, name: String(x.name), gender: toGender(x.gender), extra }); }
      finish(by, names, skipped);
    };
    const fromSheets = (sheets) => {
      const by = {}, names = new Set(); let skipped = 0;
      for (const sh of sheets) {
        const head = (sh.rows[0] || []).map((x) => String(x).trim()); const ci = (n) => head.indexOf(n);
        const iName = ci("이름"); if (iName < 0) continue;
        const iNo = ci("번호"), iF = ci("외국이름"), iG = ci("성별"), iGr = ci("학년"), iK = ci("반");
        const extraCols = head.map((n, i) => ({ n, i })).filter((c) => c.n && !["번호", "이름", "외국이름", "성별", "학년", "반"].includes(c.n));
        const sm = /^(\d)\D+(\d+)/.exec(sh.name.trim());
        for (const r of sh.rows.slice(1)) {
          const name = String(r[iName] == null ? "" : r[iName]).trim(); if (!name) continue;
          let key = null;
          if (iGr >= 0 && iK >= 0 && r[iGr] !== "" && r[iK] !== "") key = `${parseInt(r[iGr], 10)}-${parseInt(r[iK], 10)}`; else if (sm) key = `${sm[1]}-${sm[2]}`;
          if (!key || !mine.has(key)) { skipped++; continue; }
          const extra = {}; for (const c of extraCols) { const v = r[c.i]; if (v !== "" && v != null) { extra[c.n] = String(v); names.add(c.n); } }
          (by[key] = by[key] || []).push({ number: iNo >= 0 ? Number(r[iNo]) || 0 : 0, name, foreign: iF >= 0 ? String(r[iF] == null ? "" : r[iF]).trim() : "", gender: iG >= 0 ? toGender(r[iG]) : "", extra });
        }
      }
      finish(by, names, skipped);
    };
    const read = async (file) => {
      if (!file) return; setErr(""); setInfo(null);
      try {
        if (/\.json$/i.test(file.name)) fromJson(JSON.parse(await file.text()));
        else fromSheets(await PE.readXlsx(await file.arrayBuffer()));
      } catch (e) { setErr("읽을 수 없는 파일이에요. 이 화면에서 내려받은 엑셀 파일이나 예전 웹의 .json 파일을 골라 주세요."); }
    };
    const keys = info ? Object.keys(info.by).sort() : [];
    return h`<${PE.Dialog} open=${open} onClose=${close} mid><h2>업로드</h2>
      <div className="imp-btns"><${PE.Button} onClick=${onTemplate}>${I("download")} 양식 받기<//><${PE.Button} onClick=${() => fileIn.current && fileIn.current.click()}>${I("upload")} 파일 선택<//></div>
      <input ref=${fileIn} type="file" accept=".xlsx,.json,application/json" hidden onChange=${(e) => read(e.target.files[0])} />
      ${err ? h`<p className="form-err">${err}</p>` : null}
      ${info ? h`<div className="imp-sum">${keys.length ? keys.map((k) => h`<span key=${k} className="badge num">${k} · ${info.by[k].length}명</span>`) : h`<span className="card-sub">내 담당 학급에 해당하는 학생이 없어요.</span>`}
        ${info.names.length ? h`<p className="card-sub" style=${{ marginTop: 8 }}>항목: ${info.names.join(", ")}</p>` : null}
        ${info.skipped ? h`<p className="card-sub" style=${{ marginTop: 4 }}>담당 학급이 아니거나 빈 줄 ${info.skipped}건은 건너뛰어요.</p>` : null}
        ${keys.length ? h`<p className="card-sub" style=${{ marginTop: 4 }}>위 반의 기존 명단은 파일 내용으로 바뀌어요.</p>` : null}</div>` : null}
      <div className="dialog-foot"><div></div><div><${PE.Button} onClick=${close}>취소<//><${PE.Button} variant="primary" disabled=${!keys.length} onClick=${() => { onApply(info.by, info.names); close(); }}>가져오기<//></div></div><//>`;
  }

  /* 학생 추가·수정 창 */
  function StudentDialog({ student, cls, fields, nextNo, onClose, onSave, onDelete, dupText, students, classes }) {
    const isNew = !student;
    const [id] = useState(() => (student ? student.id : PE.uid()));
    const [d, setD] = useState(() => ({ number: student ? student.number : nextNo, name: student ? student.name : "", foreign: student ? student.foreign || "" : "", gender: student ? student.gender : "", extra: { ...((student && student.extra) || {}) } }));
    const [pick, setPick] = useState(null);
    const ok = d.name.trim(); const byId = useMemo(() => new Map(students.map((x) => [x.id, x])), [students]);
    return h`<${PE.Dialog} open=${true} onClose=${onClose} mid>
      <div className="stu-head"><h2>${isNew ? "학생 추가" : "학생 정보"}</h2><${PE.ClassTag} k=${cls.key} /></div>
      <form className="stu-form" onSubmit=${(e) => { e.preventDefault(); if (ok) onSave({ ...d, id, name: d.name.trim(), foreign: d.foreign.trim() }); }}>
        <div className="stu-row">
          <div className="field"><label>번호</label><${PE.Stepper} label="번호" min=${1} max=${99} value=${d.number} onChange=${(v) => setD({ ...d, number: v })} /></div>
          <div className="field"><label>성별</label><${PE.Seg} label="성별" value=${d.gender} onChange=${(v) => setD({ ...d, gender: d.gender === v ? "" : v })} options=${[{ value: "M", label: "남" }, { value: "F", label: "여" }]} /></div></div>
        <div className="name-row">
          <div className="field"><label htmlFor="stu-name">이름</label><input id="stu-name" className="input" autoFocus value=${d.name} onChange=${(e) => setD({ ...d, name: e.target.value })} /></div>
          <div className="field"><label htmlFor="stu-fn">외국이름 <small className="opt">선택</small></label><input id="stu-fn" className="input" value=${d.foreign} onChange=${(e) => setD({ ...d, foreign: e.target.value })} /></div></div>
        ${dupText ? h`<small className="dup-note">${I("users", "")} ${dupText}</small>` : null}
        ${fields.map((f) => { const v = d.extra[f.id];
          if (f.type === "sib") { const ids = sibList(v).filter((i) => byId.has(i)); const legacy = typeof v === "string" ? v : "";
            return h`<div className="field" key=${f.id}><label>${f.name}</label>
              <div className="sib-box">${ids.map((i) => { const o = byId.get(i); return h`<span key=${i} className="sib-chip"><${PE.Nm} name=${o.name} /><small>${o.grade}-${o.klass}</small><button type="button" aria-label=${o.name + " 빼기"} onClick=${() => setD({ ...d, extra: { ...d.extra, [f.id]: ids.filter((x) => x !== i) } })}>${I("x", "")}</button></span>`; })}
                ${legacy ? h`<span className="sib-chip legacy">${legacy}<button type="button" aria-label="기존 메모 지우기" onClick=${() => setD({ ...d, extra: { ...d.extra, [f.id]: [] } })}>${I("x", "")}</button></span>` : null}
                <button type="button" className="sib-add" onClick=${() => setPick(f)}>${I("plus", "")} 고르기</button></div></div>`; }
          return h`<div className="field" key=${f.id}><label>${f.name}</label><input className="input" value=${typeof v === "string" ? v : ""} onChange=${(e) => setD({ ...d, extra: { ...d.extra, [f.id]: e.target.value } })} /></div>`; })}
        <div className="dialog-foot"><div>${isNew ? null : h`<${PE.Button} variant="danger" onClick=${onDelete}>${I("trash")} 삭제<//>`}</div><div><${PE.Button} onClick=${onClose}>취소<//><${PE.Button} variant="primary" type="submit" disabled=${!ok}>${isNew ? "추가" : "저장"}<//></div></div></form>
      ${pick ? h`<${SiblingPicker} students=${students} classes=${classes} selfId=${id} value=${sibList(d.extra[pick.id]).filter((i) => byId.has(i))} onClose=${() => setPick(null)} onDone=${(ids) => { setD({ ...d, extra: { ...d.extra, [pick.id]: ids } }); setPick(null); }} />` : null}<//>`;
  }

  /* 반 하나의 명단: 글자로 깔끔하게, 학생을 누르면 수정 */
  function ClassPanel({ cls, S, fields: allFields, hideGender, multi, dupMap, byId, onAdd, onEdit, onClear }) {
    const { yd } = S;
    const list = useMemo(() => yd.students.filter((x) => x.grade === cls.grade && x.klass === cls.klass).sort((a, b) => a.number - b.number || a.name.localeCompare(b.name, "ko")), [yd.students, cls.key]);
    const boys = list.filter((x) => x.gender === "M").length, girls = list.filter((x) => x.gender === "F").length;
    const broken = list.some((x, i) => x.number !== i + 1);
    const fields = allFields.filter((f) => !f.hidden);
    const dupOf = (x) => { const d = dupMap.get(x.name.trim()); return d && d.length > 1 ? d.filter((k) => k.id !== x.id) : null; };
    const slots = list.reduce((m, x) => Math.max(m, (dupOf(x) ? 1 : 0) + (x.foreign ? 1 : 0)), 0);
    const style = { "--slot": slots * 17 + "px", "--gt": `40px fit-content(180px) ${hideGender ? "" : "40px "}${fields.map(() => "minmax(0, 1fr)").join(" ")}` };
    return h`<section className=${cn("card roster-panel", multi && "multi")} style=${{ "--tag": PE.GRADE_COLORS[cls.grade] }}>
      <div className="card-head tight">
        <div className="card-title"><span className="rp-dot"></span>${cls.grade}학년 ${cls.klass}반 <span className="card-sub num">${list.length}명${boys || girls ? ` · 남 ${boys} · 여 ${girls}` : ""}</span></div>
        <div className="rp-actions">
          ${broken ? h`<${PE.Button} size="sm" onClick=${() => S.renumber(cls.grade, cls.klass)}>번호 재정렬<//>` : null}
          <${PE.Button} icon size="sm" variant="danger" aria-label="학생 모두 삭제" title="이 반 학생 모두 삭제" disabled=${!list.length} onClick=${() => onClear(cls)}>${I("trash")}<//>
          <${PE.Button} icon size="sm" aria-label="학생 추가" title="학생 추가" onClick=${() => onAdd(cls)}>${I("plus")}<//></div></div>
      <div className="roster" style=${style}>
        ${list.length ? h`<div className="roster-h"><span>번호</span><span className="r-name-h">이름</span>${hideGender ? null : h`<span>성별</span>`}${fields.map((f) => h`<span key=${f.id}>${f.name}</span>`)}</div>` : null}
        ${list.map((x) => { const others = dupOf(x);
          return h`<button type="button" className="roster-r" key=${x.id} onClick=${() => onEdit(x)}>
            <span className="r-no num">${x.number}</span>
            <span className="r-name">${x.name}<span className="r-ic">${others ? h`<i className="dup" title=${"동명이인: " + others.map((o) => `${o.key} ${o.name}(${o.number}번)`).join(", ")}>${I("users", "")}</i>` : null}${x.foreign ? h`<i className="for" title=${"외국이름: " + x.foreign}>${I("globe", "")}</i>` : null}</span></span>
            ${hideGender ? null : h`<span className=${cn("g-pill", x.gender)}>${GENDER[x.gender] || "–"}</span>`}
            ${fields.map((f) => { const t = sibText((x.extra || {})[f.id], byId); return h`<span key=${f.id} className="r-ext" title=${t}>${t || h`<em>–</em>`}</span>`; })}</button>`; })}
      </div></section>`;
  }

  function Roster() {
    const S = PE.useStore(); const { yd } = S; const classes = PE.myClasses(yd); const fields = yd.fields || [];
    const N = Math.min(4, Math.max(1, S.state.prefs.rosterCols || 1));
    const [sel, setSel] = PE.useSaved("rosterSel", null);
    const [edit, setEdit] = useState(null); const [imp, setImp] = useState(false); const [fieldsOpen, setFieldsOpen] = useState(false);
    const [clear, setClear] = useState(null);
    const keys = classes.map((c) => c.key);
    let shown = sel === null ? keys.slice(0, 1) : sel.filter((k) => keys.includes(k));
    const shownCls = classes.filter((c) => shown.includes(c.key));
    const pick = (k) => setSel(shown.includes(k) ? shown.filter((x) => x !== k) : [...shown, k]);
    const setCols = (n) => S.setPref("rosterCols", n);
    const byId = useMemo(() => new Map(yd.students.map((x) => [x.id, x])), [yd.students]);
    /* 이름이 같은 학생(모든 학년·반 포함) */
    const dupMap = useMemo(() => { const m = new Map(); for (const x of yd.students) { const n = x.name.trim(); if (!n) continue; if (!m.has(n)) m.set(n, []); m.get(n).push({ id: x.id, key: `${x.grade}-${x.klass}`, name: n, number: x.number }); } return m; }, [yd.students]);
    const doTemplate = async () => {
      const ex = fields.filter((f) => f.type !== "sib").map((f) => f.name);
      await PE.download(`명렬표_양식.xlsx`, PE.writeXlsx([{ name: "명렬표", widths: [8, 8, 8, 16, 16, 8, ...ex.map(() => 20)], rows: [["학년", "반", "번호", "이름", "외국이름", "성별", ...ex]] }]));
    };
    const stuCls = edit ? (edit.student ? classes.find((c) => c.grade === edit.student.grade && c.klass === edit.student.klass) : edit.cls) : null;
    const dupText = edit && edit.student ? (() => { const d = dupMap.get(edit.student.name.trim()); return d && d.length > 1 ? "동명이인: " + d.filter((o) => o.id !== edit.student.id).map((o) => `${o.key} ${o.number}번`).join(", ") : ""; })() : "";
    const nextNo = (c) => Math.max(0, ...yd.students.filter((x) => x.grade === c.grade && x.klass === c.klass).map((x) => x.number || 0)) + 1;
    const panelProps = { S, fields, hideGender: !!S.state.prefs.hideGender, multi: N > 1, dupMap, byId, onAdd: (c) => setEdit({ cls: c }), onEdit: (x) => setEdit({ student: x }), onClear: setClear };

    return h`<div className="page">
      <div className="roster-bar">
        <div className="roster-tabs">${classes.map((c) => h`<button key=${c.key} type="button" className="cc roster-tab" data-g=${c.grade} aria-pressed=${shown.includes(c.key)} style=${{ "--tag": PE.GRADE_COLORS[c.grade] }} onClick=${() => pick(c.key)}>${c.key}</button>`)}</div>
        <span className="grow"></span>
        <div className="bar-btns"><${PE.Cycle} label="한 화면에 보는 반 수" value=${N} onChange=${setCols} options=${COLS} />
        <${PE.Button} size="sm" onClick=${() => setFieldsOpen(true)}>${I("settings")} 항목 관리<//>
        <${PE.Button} size="sm" disabled=${!classes.length} onClick=${() => setImp(true)}>${I("upload")} 업로드<//></div></div>
      ${classes.length === 0 ? h`<section className="card"><p className="empty-note" style=${{ marginTop: 0 }}><a href="#settings" style=${{ color: "var(--primary)", fontWeight: 700 }}>기본 설정</a>에서 담당 학급을 먼저 골라 주세요.</p></section>` : null}
      <div className="roster-grid" style=${{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>${shownCls.map((c) => h`<${ClassPanel} key=${c.key} cls=${c} ...${panelProps} />`)}</div>

      ${edit && stuCls ? h`<${StudentDialog} key=${edit.student ? edit.student.id : "new-" + edit.cls.key} student=${edit.student} cls=${stuCls} fields=${fields} nextNo=${edit.cls ? nextNo(edit.cls) : 1} dupText=${dupText} students=${yd.students} classes=${classes} onClose=${() => setEdit(null)}
        onSave=${(d) => { const old = edit.student ? edit.student.extra || {} : {};
          if (edit.student) { const { id: _i, ...patch } = d; S.updateStudent(edit.student.id, patch); } else S.addStudents(edit.cls.grade, edit.cls.klass, [d]);
          for (const f of fields.filter((x) => x.type === "sib")) S.syncSibs(d.id, f.id, sibList(d.extra[f.id]), sibList(old[f.id]));
          setEdit(null); }}
        onDelete=${() => { const id = edit.student.id; setEdit(null); S.removeStudent(id); }} />` : null}
      <${ImportDialog} onTemplate=${doTemplate} open=${imp} onClose=${() => setImp(false)} classes=${classes} onApply=${(by, names) => S.importRoster(by, names)} />
      <${FieldsDialog} open=${fieldsOpen} onClose=${() => setFieldsOpen(false)} fields=${fields} S=${S} />
      <${PE.ConfirmDialog} open=${!!clear} danger title=${clear ? `${clear.key} 학생을 모두 삭제할까요?` : ""} body="이 반 학생이 모두 삭제돼요." confirmLabel="삭제" onClose=${() => setClear(null)} onConfirm=${() => { S.replaceStudents(clear.grade, clear.klass, []); setClear(null); }} />
    </div>`;
  }
  PE.pages = PE.pages || {};
  PE.pages.roster = Roster;
})();
