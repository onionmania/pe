/* 기본 도구: 날짜 계산, 공휴일 계산, 저장소(상태) */
(function () {
  const React = window.React;
  const PE = (window.PE = {});
  PE.h = window.htm.bind(React.createElement);
  PE.cn = (...a) => a.filter(Boolean).join(" ");
  PE.uid = () => Math.random().toString(36).slice(2, 10);

  /* ---------- 날짜 (모두 "YYYY-MM-DD" 문자열로 다룹니다) ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  PE.ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  PE.parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  PE.addDays = (s, n) => { const d = PE.parse(s); d.setDate(d.getDate() + n); return PE.ymd(d); };
  PE.diffDays = (a, b) => Math.round((PE.parse(b) - PE.parse(a)) / 86400000);
  PE.dow = (s) => PE.parse(s).getDay();
  PE.isWeekend = (s) => { const w = PE.dow(s); return w === 0 || w === 6; };
  PE.today = () => window.__TODAY || PE.ymd(new Date());
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  PE.fmt = (s, opts = {}) => { if (!s) return "미정"; const d = PE.parse(s); return `${opts.year ? d.getFullYear() + "년 " : ""}${d.getMonth() + 1}월 ${d.getDate()}일${opts.dow ? " (" + DOW[d.getDay()] + ")" : ""}`; };
  PE.fmtShort = (s) => { if (!s) return "미정"; const d = PE.parse(s); return `${d.getMonth() + 1}.${d.getDate()}`; };
  PE.range = (start, end) => { const out = []; if (!start || !end || end < start) return out; for (let d = start; d <= end; d = PE.addDays(d, 1)) out.push(d); return out; };

  /* ---------- 공휴일 자동 계산 (대체공휴일 포함) ----------
     음력 공휴일은 날짜표가 있는 해(2025~2028)만 채웁니다. 법이 바뀔 수 있으니 목록에서 언제든 고칠 수 있어요. */
  const LUNAR = {
    2025: { seol: "2025-01-29", buddha: "2025-05-05", chuseok: "2025-10-06" },
    2026: { seol: "2026-02-17", buddha: "2026-05-24", chuseok: "2026-09-25" },
    2027: { seol: "2027-02-07", buddha: "2027-05-13", chuseok: "2027-09-15" },
    2028: { seol: "2028-01-27", buddha: "2028-05-02", chuseok: "2028-10-03" },
  };
  const SOLAR = [["01-01", "신정", false], ["03-01", "삼일절", true], ["05-05", "어린이날", true], ["06-06", "현충일", false], ["08-15", "광복절", true], ["10-03", "개천절", true], ["10-09", "한글날", true], ["12-25", "성탄절", true]];
  PE.defaultHolidays = function (startYear) {
    const from = `${startYear}-03-01`, to = PE.ymd(new Date(startYear + 1, 2, 0));
    const groups = []; let missing = false;
    for (const y of [startYear, startYear + 1]) {
      for (const [md, name, sub] of SOLAR) groups.push({ name, dates: [`${y}-${md}`], sub: sub ? "day" : null });
      const l = LUNAR[y];
      if (l) {
        groups.push({ name: "설날 연휴", dates: [PE.addDays(l.seol, -1), l.seol, PE.addDays(l.seol, 1)], sub: "group" });
        groups.push({ name: "부처님오신날", dates: [l.buddha], sub: "day" });
        groups.push({ name: "추석 연휴", dates: [PE.addDays(l.chuseok, -1), l.chuseok, PE.addDays(l.chuseok, 1)], sub: "group" });
      } else if (y >= startYear) missing = true;
    }
    const count = new Map();
    groups.forEach((g) => g.dates.forEach((d) => count.set(d, (count.get(d) || 0) + 1)));
    const taken = new Set(count.keys());
    const subs = []; const done = new Set();
    const nextFree = (after) => { let d = PE.addDays(after, 1); while (PE.isWeekend(d) || taken.has(d)) d = PE.addDays(d, 1); taken.add(d); return d; };
    for (const g of groups.slice().sort((a, b) => a.dates[0].localeCompare(b.dates[0]))) {
      if (!g.sub) continue;
      const clash = g.dates.some((d) => count.get(d) > 1);
      const hit = g.sub === "day" ? PE.isWeekend(g.dates[0]) || clash : g.dates.some((d) => PE.dow(d) === 0) || clash;
      if (!hit) continue;
      const key = g.dates.find((d) => count.get(d) > 1);
      if (key && done.has(key)) continue;
      if (key) done.add(key);
      subs.push({ start: nextFree(g.dates[g.dates.length - 1]), name: `${g.name.replace(" 연휴", "")} 대체공휴일` });
    }
    const out = [];
    for (const g of groups) for (const d of g.dates) if (d >= from && d <= to) out.push({ start: d, end: d, name: g.name });
    for (const s of subs) if (s.start >= from && s.start <= to) out.push({ start: s.start, end: s.start, name: s.name });
    // 같은 날 겹치는 항목(예: 부처님오신날=어린이날)은 하나만 남깁니다
    const seen = new Set();
    return { missingLunar: missing, items: out.sort((a, b) => a.start.localeCompare(b.start)).filter((x) => { if (seen.has(x.start)) return false; seen.add(x.start); return true; }).map((x) => ({ ...x, kind: "holiday" })) };
  };

  /* ---------- 학년도 데이터 ---------- */
  const emptyGrades = () => { const g = {}; for (let i = 1; i <= 6; i++) g[i] = { count: 4, mine: [] }; return g; };
  PE.newYear = function (year, prev) {
    const d = PE.defaultHolidays(year);
    const grades = prev ? JSON.parse(JSON.stringify(prev.grades)) : emptyGrades();
    return {
      sem1: { start: `${year}-03-02`, end: "" }, sem2: { start: "", end: "" },
      holidays: d.items.map((x) => ({ id: PE.uid(), ...x })), grades,
      weekly: { 1: {}, 2: {} }, schedule: {}, hours: { 1: {}, 2: {} }, students: [], clubs: [], comps: [], paps: PE.defaultPaps(), fields: prev && prev.fields ? JSON.parse(JSON.stringify(prev.fields)) : PE.defaultFields(),
    };
  };
  /* 예전에 저장된 데이터도 새 구조로 맞춰 줍니다 */
  PE.normalize = function (state) {
    const years = {};
    for (const [y, yd] of Object.entries(state.years)) {
      const hol = [];
      for (const x of yd.holidays || []) {
        const e = x.end || x.start;
        if (e === x.start) hol.push({ id: x.id, start: x.start, end: x.start, name: x.name, kind: x.kind });
        else for (const d of PE.range(x.start, e)) hol.push({ id: PE.uid(), start: d, end: d, name: x.name, kind: x.kind });
      }
      years[y] = { ...yd, holidays: hol, weekly: { 1: {}, 2: {}, ...(yd.weekly || {}) }, schedule: yd.schedule || {}, hours: { 1: {}, 2: {}, ...(yd.hours || {}) }, students: yd.students || [], clubs: yd.clubs || [], comps: yd.comps || [], evals: yd.evals || { items: [], data: {} }, paps: PE.normPaps(yd.paps), fields: (yd.fields || PE.defaultFields()).map((f) => (f.id === "sib" ? { ...f, type: "sib" } : f)) };
    }
    return { ...state, years, prefs: { dash: "grade", scLayout: "row", scMode: "cont", runner: true, width: 2, papsScore: false, ...(state.prefs || {}) } };
  };
  PE.defaultPapsSem = () => ({ items: { cardio: "왕복오래달리기", flex: "앉아윗몸앞으로굽히기", strength: "악력", power: "제자리멀리뛰기" }, rec: {} });
  PE.defaultPaps = () => ({ v: 3, s: { 1: PE.defaultPapsSem(), 2: PE.defaultPapsSem() } });
  PE.normPaps = (p) => { if (p && p.v === 3) return { v: 3, s: { 1: { ...PE.defaultPapsSem(), ...(p.s[1] || {}) }, 2: { ...PE.defaultPapsSem(), ...(p.s[2] || {}) } } }; const d = PE.defaultPaps(); if (p && p.rec) d.s[1].rec = p.rec; return d; };
  const ps = (paps, sem, fn) => ({ ...paps, s: { ...paps.s, [sem]: fn(paps.s[sem]) } });
  PE.defaultFields = () => [{ id: "sib", name: "형제자매", type: "sib" }];
  PE.PERIODS = 6;
  PE.DAYS = ["월", "화", "수", "목", "금"];
  PE.classKey = (g, k) => `${g}-${k}`;
  PE.myClasses = (yd) => Object.entries(yd.grades).flatMap(([g, v]) => v.mine.map((k) => ({ grade: Number(g), klass: k, key: `${g}-${k}` }))).sort((a, b) => a.grade - b.grade || a.klass - b.klass);
  PE.GRADE_COLORS = { 1: "#f59e0b", 2: "#84cc16", 3: "#3b82f6", 4: "#10b981", 5: "#8b5cf6", 6: "#ec4899" };
  PE.keyGrade = (key) => Number(String(key).split("-")[0]);
  PE.seedState = function () {
    const y = PE.newYear(2026);
    y.sem1 = { start: "2026-03-03", end: "2026-07-27" }; y.sem2 = { start: "2026-08-19", end: "2026-12-31" };
    y.holidays.push({ id: PE.uid(), start: "2026-06-03", end: "2026-06-03", name: "전국동시지방선거", kind: "holiday" });
    for (const g of [3, 4, 5, 6]) y.grades[g].mine = [1, 2];
    return PE.normalize({ v: 1, theme: "flat", mode: "auto", accent: null, year: 2026, years: { 2026: y }, savedAt: null });
  };

  /* 쉬는 날(주말 제외) 집합, 수업일 목록 */
  PE.offSet = (yd) => { const s = new Set(); for (const h of yd.holidays) for (const d of PE.range(h.start, h.end || h.start)) s.add(d); return s; };
  PE.schoolDays = (sem, off) => PE.range(sem.start, sem.end).filter((d) => !PE.isWeekend(d) && !off.has(d));
  PE.holidayOn = (yd, date) => yd.holidays.find((h) => date >= h.start && date <= (h.end || h.start));

  /* 학기 시간표에서 학급별 계획/진행 시수 */
  PE.hoursStats = function (yd, sem, today) {
    const r = sem === 2 ? yd.sem2 : yd.sem1; const off = PE.offSet(yd); const by = {};
    if (!r.start || !r.end) return by;
    for (const [date, periods] of Object.entries(yd.schedule)) {
      if (date < r.start || date > r.end || PE.isWeekend(date) || off.has(date)) continue;
      for (const key of Object.values(periods)) { const e = (by[key] = by[key] || { planned: 0, done: 0 }); e.planned++; if (date <= today) e.done++; }
    }
    return by;
  };
  /* 오늘 수업: 학기 시간표가 있으면 그것, 없으면 기초 시간표 */
  PE.todayClasses = function (yd, today) {
    if (PE.isWeekend(today) || PE.holidayOn(yd, today)) return { items: [], from: "off" };
    const day = yd.schedule[today];
    if (day && Object.keys(day).length) return { items: Object.entries(day).map(([p, key]) => ({ period: Number(p), key })).sort((a, b) => a.period - b.period), from: "schedule" };
    const sem = PE.currentSem(yd, today); const w = sem === "break" ? null : (yd.weekly[sem] || {})[PE.dow(today)];
    const items = w ? Object.entries(w).map(([p, key]) => ({ period: Number(p), key })).sort((a, b) => a.period - b.period) : [];
    return { items, from: items.length ? "weekly" : "none" };
  };

  /* 지금 보여 줄 학기: 방학 중이면 'break' */
  PE.currentSem = (yd, today) => {
    const { sem1, sem2 } = yd;
    if (sem2.start && today >= sem2.start) return 2;
    if (sem1.end && today > sem1.end) return "break";
    return 1;
  };
  PE.semStats = function (yd, which, today) {
    const sem = which === 2 ? yd.sem2 : yd.sem1;
    const off = PE.offSet(yd);
    const days = PE.schoolDays(sem, off);
    const total = days.length;
    const done = days.filter((d) => d <= today).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const state = !sem.start || !sem.end ? "unset" : today < sem.start ? "before" : today > sem.end ? "after" : "during";
    return { sem, days, total, done, remaining: total - done, pct: state === "after" ? 100 : pct, state, off };
  };

  /* ---------- 저장소 ---------- */
  const KEY = "pe2-v1"; const mem = { v: null };
  PE.storage = {
    async load() { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) { /* 사용 불가 */ } return mem.v ? JSON.parse(mem.v) : null; },
    async save(state) { const t = JSON.stringify(state); mem.v = t; try { localStorage.setItem(KEY, t); } catch (e) { /* 메모리 보관 */ } },
  };
  const Ctx = React.createContext(null);
  PE.useStore = () => React.useContext(Ctx);
  PE.StoreProvider = function StoreProvider({ children, user }) {
    const { useState, useEffect, useRef, useMemo } = React;
    const [state, setState] = useState(PE.seedState);
    const [ready, setReady] = useState(false);
    const [saveS, setSaveS] = useState("saved");
    const [demo, setDemo] = useState(false);
    const dirty = useRef(false), timer = useRef(null);
    const C = PE.cloud; const cloud = !!(user && C && C.on); const uid = user && user.uid;
    const [conflict, setConflict] = useState(null); const [tick, setTick] = useState(0);
    const cdirty = useRef(false), baseRef = useRef(0), blocked = useRef(false), cTimer = useRef(null);
    const keep = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 보관 실패는 무시 */ } };
    const useCloud = (r, local) => { if (local) keep("pe2-v1-backup", local); const st = PE.normalize(r.data); baseRef.current = r.savedAt; C.setMeta(uid, { base: r.savedAt, dirty: false }); cdirty.current = false; setState(st); PE.storage.save(st); };
    useEffect(() => {
      let off = false;
      PE.storage.load().then(async (s) => {
        const local = s && s.v === 1 ? PE.normalize(s) : null;
        if (!cloud) { if (!off) { if (local) setState(local); setReady(true); } return; }
        try {
          const m = C.meta(uid); const r = await C.pull(uid); if (off) return;
          if (!r) { baseRef.current = 0; if (local) setState(local); cdirty.current = true; }
          else if (local && r.savedAt !== m.base && (m.dirty || m.base === 0)) { blocked.current = true; setState(local); setConflict({ cloud: r, local }); }
          else if (local && r.savedAt === m.base) { baseRef.current = m.base; setState(local); cdirty.current = !!m.dirty; }
          else useCloud(r, local);
          C.touch(uid, user, r ? r.bytes : 0);
          setReady(true);
        } catch (e) { if (!off) { setSaveS("error"); if (local) setState(local); blocked.current = true; setReady(true); } }
      }).catch(() => setReady(true));
      return () => { off = true; };
    }, [uid]);
    useEffect(() => {
      if (!ready || !dirty.current) return;
      if (!cloud) setSaveS("saving"); clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try { await PE.storage.save(state); dirty.current = false; if (cloud) { C.setMeta(uid, { base: baseRef.current, dirty: cdirty.current }); } else setSaveS("saved"); } catch (e) { setSaveS("error"); }
      }, 400);
      return () => clearTimeout(timer.current);
    }, [state, ready]);
    /* 클라우드 올리기: 바뀐 뒤 2.5초 쉬면 올려요. 다른 기기가 먼저 올렸으면 덮어쓰지 않고 물어봐요 */
    const forceRef = useRef(false);
    useEffect(() => {
      if (!cloud || !ready || !cdirty.current || blocked.current) return;
      setSaveS("saving"); clearTimeout(cTimer.current);
      cTimer.current = setTimeout(async () => {
        try {
          const res = await Promise.race([C.push(user, state, baseRef.current, forceRef.current), new Promise((_, rj) => setTimeout(() => rj(Object.assign(new Error("timeout"), { code: "timeout" })), 12000))]);
          if (res.conflict) { blocked.current = true; setConflict({ cloud: res.cloud, local: state }); setSaveS("error"); return; }
          baseRef.current = res.savedAt; forceRef.current = false; cdirty.current = false; C.setMeta(uid, { base: res.savedAt, dirty: false }); setSaveS("saved");
        } catch (e) { setSaveS(e.code === "too-big" ? "toobig" : "error"); }
      }, 2500);
      return () => clearTimeout(cTimer.current);
    }, [state, ready, tick]);
    useEffect(() => { if (!cloud) return; const f = () => setTick((t) => t + 1); window.addEventListener("online", f); return () => window.removeEventListener("online", f); }, [cloud]);
    const resolveConflict = (choice) => {
      if (!conflict) return;
      if (choice === "cloud") { useCloud(conflict.cloud, conflict.local); blocked.current = false; setConflict(null); setSaveS("saved"); }
      else { keep("pe2-cloud-backup", conflict.cloud.data); baseRef.current = conflict.cloud.savedAt; cdirty.current = true; forceRef.current = true; blocked.current = false; setConflict(null); setTick((t) => t + 1); }
    };
    const set = (fn) => { dirty.current = true; if (cloud) cdirty.current = true; setState((p) => fn(p)); };
    const api = useMemo(() => {
      const yr = (p, fn) => ({ ...p, years: { ...p.years, [p.year]: fn(p.years[p.year]) } });
      return {
        setTheme: (theme) => set((p) => ({ ...p, theme })),
        setMode: (mode) => set((p) => ({ ...p, mode })),
        setAccent: (accent) => set((p) => ({ ...p, accent })),
        setPref: (k, v) => set((p) => ({ ...p, prefs: { ...p.prefs, [k]: v } })),
        setYear: (year) => set((p) => ({ ...p, year })),
        addYear: () => set((p) => { const next = Math.max(...Object.keys(p.years).map(Number)) + 1; return { ...p, year: next, years: { ...p.years, [next]: PE.newYear(next, p.years[p.year]) } }; }),
        setRange: (key, start, end) => set((p) => yr(p, (y) => ({ ...y, [key]: { start, end } }))),
        removeYear: (year) => set((p) => { const ks = Object.keys(p.years).map(Number); if (ks.length < 2) return p; const years = { ...p.years }; delete years[year]; return { ...p, years, year: p.year === year ? Math.max(...Object.keys(years).map(Number)) : p.year }; }),
        saveHoliday: (h) => set((p) => yr(p, (y) => ({ ...y, holidays: y.holidays.some((x) => x.id === h.id) ? y.holidays.map((x) => (x.id === h.id ? h : x)) : [...y.holidays, h] }))),
        removeHoliday: (id) => set((p) => yr(p, (y) => ({ ...y, holidays: y.holidays.filter((x) => x.id !== id) }))),
        loadDefaultHolidays: (year) => set((p) => yr(p, (y) => {
          const have = new Set(y.holidays.map((h) => h.start + "|" + h.name));
          const add = PE.defaultHolidays(year).items.filter((x) => !have.has(x.start + "|" + x.name)).map((x) => ({ id: PE.uid(), ...x }));
          return { ...y, holidays: [...y.holidays, ...add] };
        })),
        setWeeklyCell: (sem, day, period, key) => set((p) => yr(p, (y) => { const w = { ...(y.weekly[sem] || {}) }; const d = { ...(w[day] || {}) }; if (key) d[period] = key; else delete d[period]; w[day] = d; return { ...y, weekly: { ...y.weekly, [sem]: w } }; })),
        copyWeekly: (from, to) => set((p) => yr(p, (y) => ({ ...y, weekly: { ...y.weekly, [to]: JSON.parse(JSON.stringify(y.weekly[from] || {})) } }))),
        applyWeekly: (sem, replace) => set((p) => yr(p, (y) => {
          const r = sem === 2 ? y.sem2 : y.sem1; const off = PE.offSet(y); const schedule = { ...y.schedule };
          for (const date of PE.schoolDays(r, off)) { const base = (y.weekly[sem] || {})[PE.dow(date)] || {}; schedule[date] = replace ? { ...base } : { ...base, ...(schedule[date] || {}) }; if (!Object.keys(schedule[date]).length) delete schedule[date]; }
          return { ...y, schedule };
        })),
        clearSchedule: (sem) => set((p) => yr(p, (y) => { const r = sem === 2 ? y.sem2 : y.sem1; const schedule = {}; for (const [d, v] of Object.entries(y.schedule)) if (!(r.start && d >= r.start && d <= r.end)) schedule[d] = v; return { ...y, schedule }; })),
        setScheduleDay: (date, map) => set((p) => yr(p, (y) => { const schedule = { ...y.schedule }; if (map && Object.keys(map).length) schedule[date] = map; else delete schedule[date]; return { ...y, schedule }; })),
        setHours: (sem, key, n) => set((p) => yr(p, (y) => { const h = { ...(y.hours[sem] || {}) }; if (n == null || Number.isNaN(n)) delete h[key]; else h[key] = n; return { ...y, hours: { ...y.hours, [sem]: h } }; })),
        addStudents: (g, k, list) => set((p) => yr(p, (y) => { let n = Math.max(0, ...y.students.filter((x) => x.grade === g && x.klass === k).map((x) => x.number || 0)); return { ...y, students: [...y.students, ...list.map((x) => ({ id: x.id || PE.uid(), grade: g, klass: k, number: x.number || ++n, name: x.name, foreign: x.foreign || "", gender: x.gender || "", extra: x.extra || {} }))] }; })),
        /* 형제자매 양방향 연결: sid의 목록이 old→ids로 바뀔 때 상대 학생 쪽도 맞춰 줌 */
        syncSibs: (sid, fid, ids, old) => set((p) => yr(p, (y) => { const add = ids.filter((i) => !old.includes(i)), del = old.filter((i) => !ids.includes(i)); return { ...y, students: y.students.map((x) => { const cur = Array.isArray((x.extra || {})[fid]) ? x.extra[fid] : []; if (add.includes(x.id) && !cur.includes(sid)) return { ...x, extra: { ...(x.extra || {}), [fid]: [...cur, sid] } }; if (del.includes(x.id) && cur.includes(sid)) return { ...x, extra: { ...(x.extra || {}), [fid]: cur.filter((i) => i !== sid) } }; return x; }) }; })),
        updateStudent: (id, patch) => set((p) => yr(p, (y) => ({ ...y, students: y.students.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))),
        removeStudent: (id) => set((p) => yr(p, (y) => ({ ...y, students: y.students.filter((x) => x.id !== id) }))),
        renumber: (g, k) => set((p) => yr(p, (y) => { const mine = y.students.filter((x) => x.grade === g && x.klass === k).sort((a, b) => a.number - b.number); const no = new Map(mine.map((x, i) => [x.id, i + 1])); return { ...y, students: y.students.map((x) => (no.has(x.id) ? { ...x, number: no.get(x.id) } : x)) }; })),
        setPapsItem: (sem, el, item) => set((p) => yr(p, (y) => ({ ...y, paps: ps(y.paps, sem, (s) => ({ ...s, items: { ...s.items, [el]: item } })) }))),
        setPapsValue: (sem, sid, key, v) => set((p) => yr(p, (y) => ({ ...y, paps: ps(y.paps, sem, (s) => { const r = { ...(s.rec[sid] || {}) }; if (v == null) delete r[key]; else r[key] = v; return { ...s, rec: { ...s.rec, [sid]: r } }; }) }))),
        setPapsBulk: (sem, by) => set((p) => yr(p, (y) => ({ ...y, paps: ps(y.paps, sem, (s) => { const rec = { ...s.rec }; for (const [sid, vals] of Object.entries(by)) rec[sid] = { ...(rec[sid] || {}), ...vals }; return { ...s, rec }; }) }))),
        updYear: (fn) => set((p) => yr(p, fn)),
        restoreAll: (obj) => set(() => PE.normalize(obj)),
        addField: (name) => set((p) => yr(p, (y) => ({ ...y, fields: [...y.fields, { id: PE.uid(), name }] }))),
        renameField: (id, name) => set((p) => yr(p, (y) => ({ ...y, fields: y.fields.map((f) => (f.id === id ? { ...f, name } : f)) }))),
        setFieldHidden: (id, v) => set((p) => yr(p, (y) => ({ ...y, fields: y.fields.map((f) => (f.id === id ? { ...f, hidden: !!v } : f)) }))),
        removeField: (id) => set((p) => yr(p, (y) => ({ ...y, fields: y.fields.filter((f) => f.id !== id), students: y.students.map((x) => { if (!x.extra || !(id in x.extra)) return x; const e = { ...x.extra }; delete e[id]; return { ...x, extra: e }; }) }))),
        setExtra: (sid, fid, v) => set((p) => yr(p, (y) => ({ ...y, students: y.students.map((x) => (x.id === sid ? { ...x, extra: { ...(x.extra || {}), [fid]: v } } : x)) }))),
        /* 엑셀·예전 파일 가져오기: by = { "3-1": [{number,name,gender,extra:{항목이름:값}}] } */
        importRoster: (by, fieldNames) => set((p) => yr(p, (y) => {
          const fields = [...y.fields]; const idOf = {};
          for (const nm of fieldNames) { let f = fields.find((x) => x.name === nm); if (!f) { f = { id: PE.uid(), name: nm }; fields.push(f); } idOf[nm] = f.id; }
          let students = y.students;
          for (const [key, list] of Object.entries(by)) { const [g, k] = key.split("-").map(Number); students = [...students.filter((x) => !(x.grade === g && x.klass === k)), ...list.map((x, i) => { const extra = {}; for (const [nm, v] of Object.entries(x.extra || {})) if (v !== "" && idOf[nm]) extra[idOf[nm]] = v; return { id: PE.uid(), grade: g, klass: k, number: x.number || i + 1, name: x.name, foreign: x.foreign || "", gender: x.gender || "", extra }; })]; }
          return { ...y, fields, students };
        })),
        replaceStudents: (g, k, list) => set((p) => yr(p, (y) => ({ ...y, students: [...y.students.filter((x) => !(x.grade === g && x.klass === k)), ...list.map((x, i) => ({ id: PE.uid(), grade: g, klass: k, number: x.number || i + 1, name: x.name, gender: x.gender || "", extra: {} }))] }))),
        setClassCount: (g, n) => set((p) => yr(p, (y) => ({ ...y, grades: { ...y.grades, [g]: { count: n, mine: y.grades[g].mine.filter((k) => k <= n) } } }))),
        toggleClass: (g, k) => set((p) => yr(p, (y) => { const cur = y.grades[g].mine; return { ...y, grades: { ...y.grades, [g]: { ...y.grades[g], mine: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k].sort((a, b) => a - b) } } }; })),
      };
    }, []);
    const value = { state, ready, saveS, demo, setDemo, conflict, resolveConflict, cloud, user, ...api, yd: state.years[state.year] };
    return React.createElement(Ctx.Provider, { value }, ready || !cloud ? children : React.createElement("p", { style: { padding: 24, fontFamily: "sans-serif", color: "#888" } }, "내 데이터를 불러오는 중…"));
  };
})();
