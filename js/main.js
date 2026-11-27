/* 앱 껍데기: 사이드바 · 상단바 · 모바일 탭바 · 화면 연결 */
(function () {
  const PE = window.PE, React = window.React, h = PE.h, I = PE.I;
  const { useState, useEffect } = React;
  const NAV = [{ to: "dashboard", label: "대시보드", short: "홈", icon: "dashboard" }, { to: "settings", label: "기본 설정", short: "설정", icon: "settings" }, { to: "timetable", label: "시간표", icon: "clock" }, { to: "roster", label: "명렬표", icon: "users" }, { to: "paps", label: "PAPS", icon: "activity" }, { to: "eval", label: "평가", icon: "clipboard" }, { to: "club", label: "스포츠클럽", short: "클럽", icon: "flag" }, { to: "comp", label: "대회 운영", short: "대회", icon: "trophy" }];
  const route = () => { const r = (location.hash || "").replace("#", ""); return r === "admin" || NAV.some((n) => n.to === r) ? r : "dashboard"; };
  function useRoute() { const [r, setR] = useState(route); useEffect(() => { const f = () => setR(route()); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []); return r; }

  class Boundary extends React.Component {
    constructor(p) { super(p); this.state = { e: null }; }
    static getDerivedStateFromError(e) { return { e }; }
    render() { const e = this.state.e; if (!e) return this.props.children;
      return h`<div className="page"><div className="card"><h2>이 화면에서 오류가 났어요</h2><p className="card-sub" style=${{ margin: "8px 0" }}>${String(e.message || e)}</p><pre style=${{ whiteSpace: "pre-wrap", fontSize: 11, color: "var(--text-3)" }}>${String(e.stack || "").split("\n").slice(0, 6).join("\n")}</pre></div></div>`; }
  }

  const LOGOS = ["🏃", "⚽", "🏀", "⚾", "🏐", "🏈", "🎾", "🏸", "🏓", "🥎", "🏑", "🥅", "🏅", "🥇", "🏆", "🤸", "🏊", "🚴", "🤾", "⛹️", "🧘", "🎽", "👟", "⏱️"];
  function App() {
    const emo = (s) => (s.includes("\uFE0F") ? s : s + "\uFE0F");
    const S = PE.useStore(); const r = useRoute();     const [themeOpen, setThemeOpen] = useState(false); const [menuAt, setMenuAt] = useState(null); const [logoAt, setLogoAt] = useState(null); const logo = S.state.prefs.logo || "🏃";
    useEffect(() => { const w = S.state.prefs.width || 2; document.documentElement.style.setProperty("--page-max", w === 1 ? "1200px" : w === 3 ? "100vw" : "1440px"); }, [S.state.prefs.width]);
    const Page = PE.pages[r];
    const link = (n) => h`<a key=${n.to} href=${"#" + n.to} aria-current=${r === n.to ? "page" : undefined}>${I(n.icon)}${n.label}</a>`;
    return h`<div className="app">
      <header className="topbar">
        <div className="brand"><button type="button" className="brand-mark" data-pop-ignore="1" aria-label="로고 이모지 고르기" title="눌러서 이모지 바꾸기" onClick=${(e) => { const r = e.currentTarget.getBoundingClientRect(); setLogoAt(logoAt ? null : { x: r.left, y: r.bottom }); }}>${emo(logo)}</button><a href="#dashboard"><b>체육 워크스페이스</b></a></div>
        <nav className="topnav" aria-label="메뉴">${NAV.map(link)}</nav>
        <span className="grow"></span><${PE.SaveBadge} s=${S.saveS} />
        <${PE.Button} icon variant="ghost" data-pop-ignore="1" aria-label="설정" onClick=${(e) => { const r = e.currentTarget.getBoundingClientRect(); setMenuAt(menuAt ? null : { x: r.right, y: r.bottom }); }}>${I("gear")}<//></header>
      ${S.sample ? h`<div className="sample-bar"><span>샘플 데이터를 둘러보는 중이에요. 고쳐도 저장되지 않고, 새로고침하면 처음으로 돌아가요.</span><${PE.Button} size="sm" variant="primary" onClick=${S.exitSample}>구글로 로그인<//></div>` : null}
      <div className="main"><${Boundary} key=${r}><${Page} /><//></div>
      <nav className="tabbar" aria-label="메뉴">${NAV.map((n) => h`<a key=${n.to} href=${"#" + n.to} aria-current=${r === n.to ? "page" : undefined}>${I(n.icon)}${n.short || n.label}</a>`)}
        <button type="button" className="tab-gear" data-s=${S.saveS} data-pop-ignore="1" aria-label="설정 · 저장 상태" onClick=${(e) => { const b = e.currentTarget.getBoundingClientRect(); setMenuAt(menuAt ? null : { x: b.right, y: b.top }); }}>${I("gear")}<span><i></i>${S.saveS === "saving" ? "저장 중" : S.saveS === "error" ? "실패" : S.saveS === "toobig" ? "용량" : "저장됨"}</span></button></nav>
      <${PE.Popover} open=${!!logoAt} at=${logoAt} onClose=${() => setLogoAt(null)}><div className="pop-head"><b>로고 이모지</b></div><div className="emoji-grid">${LOGOS.map((e) => h`<button key=${e} type="button" className="emoji-b" aria-pressed=${e === logo} onClick=${() => { S.setPref("logo", e); setLogoAt(null); }}>${emo(e)}</button>`)}</div><//>
      <${PE.SettingsMenu} open=${!!menuAt} at=${menuAt} onClose=${() => setMenuAt(null)} onTheme=${() => { setMenuAt(null); setThemeOpen(true); }} />
      <${PE.SettingsDialog} open=${themeOpen} onClose=${() => setThemeOpen(false)} />
    </div>`;
  }
  /* 다른 기기·이 기기의 데이터가 서로 달라서 어느 쪽을 쓸지 물어볼 때 */
  function ConflictDialog() {
    const S = PE.useStore(); const c = S.conflict; if (!c) return null;
    const cnt = (st) => Object.values((st && st.years) || {}).reduce((n, y) => n + ((y.students || []).length), 0);
    const when = (t) => { const d = new Date(t); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
    return h`<${PE.Dialog} open=${true} onClose=${() => {}} narrow><h2>어느 데이터를 쓸까요?</h2>
      <p className="sub">이 기기와 클라우드(내 계정)에 저장된 데이터가 서로 달라요. 고르지 않은 쪽은 사라지지 않게 이 기기에 백업해 둬요.</p>
      <div className="cf-grid">
        <button type="button" className="cf-card" onClick=${() => S.resolveConflict("local")}><b>이 기기의 데이터</b><span>학생 ${cnt(c.local)}명</span><em>클라우드를 이 데이터로 바꿔요</em></button>
        <button type="button" className="cf-card" onClick=${() => S.resolveConflict("cloud")}><b>클라우드의 데이터</b><span>학생 ${cnt(c.cloud.data)}명 · ${when(c.cloud.savedAt)} 저장</span><em>이 기기를 클라우드 데이터로 바꿔요</em></button></div><//>`;
  }
  function Root() {
    const A = PE.useAuth(); const [sample, setSample] = useState(false);
    const body = h`<${App} /><${ConflictDialog} />`;
    if (!PE.cloud.on) return h`<${PE.StoreProvider}>${body}<//>`;
    if (A.status === "loading") return h`<p style=${{ padding: 24, fontFamily: "sans-serif", color: "#888" }}>불러오는 중…</p>`;
    if (A.status === "in") return h`<${PE.StoreProvider} key=${A.user.uid} user=${A.user}>${body}<//>`;
    if (sample) return h`<${PE.StoreProvider} key="sample" sample exitSample=${() => setSample(false)}>${body}<//>`;
    return h`<${PE.LoginScreen} onSample=${() => setSample(true)} />`;
  }
  ReactDOM.createRoot(document.getElementById("root")).render(h`<${Root} />`);
  const boot = document.getElementById("boot"); if (boot) boot.remove();
})();
