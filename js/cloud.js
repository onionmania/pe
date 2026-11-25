/* 구글 로그인 + 클라우드(Firestore) 저장. firebase-config.js 가 비어 있으면 아무 것도 안 해요(체험 모드). */
(function () {
  const PE = window.PE, React = window.React, h = PE.h, I = PE.I;
  const cfg = window.PE_FIREBASE || {}; const fb = window.firebase;
  const on = !!(cfg.apiKey && cfg.projectId && fb);
  const admins = (cfg.adminEmails || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  const C = (PE.cloud = { on, admins, auth: null, db: null, MAX: 950000 });
  C.isAdmin = (u) => !!u && admins.includes(String(u.email || "").toLowerCase());
  if (on) { try { fb.initializeApp(cfg); C.auth = fb.auth(); C.db = fb.firestore(); } catch (e) { C.on = false; console.error(e); } }

  C.signIn = async () => {
    const p = new fb.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
    try { await C.auth.signInWithPopup(p); }
    catch (e) {
      if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
      if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") { await C.auth.signInWithRedirect(p); return; }
      throw e;
    }
  };
  C.signOut = () => C.auth.signOut();
  /* 이 기기가 마지막으로 맞춰 본 클라우드 버전(base)과, 아직 못 올린 수정(dirty) 기록 */
  const mk = (uid) => "pe2-cloud-" + uid;
  C.meta = (uid) => { try { return JSON.parse(localStorage.getItem(mk(uid))) || { base: 0, dirty: false }; } catch (e) { return { base: 0, dirty: false }; } };
  C.setMeta = (uid, m) => { try { localStorage.setItem(mk(uid), JSON.stringify(m)); } catch (e) { /* 무시 */ } };
  C.pull = async (uid) => { const s = await C.db.collection("users").doc(uid).get(); if (!s.exists) return null; const d = s.data(); return { data: JSON.parse(d.data), savedAt: d.savedAt || 0, bytes: d.bytes || 0 }; };
  /* 올리기: 그 사이 다른 기기가 먼저 올렸으면 덮어쓰지 않고 conflict 로 알려 줘요 */
  C.push = async (user, state, base, force) => {
    const text = JSON.stringify(state); const bytes = new Blob([text]).size;
    if (bytes > C.MAX) { const e = new Error("too-big"); e.code = "too-big"; throw e; }
    const uref = C.db.collection("users").doc(user.uid), pref = C.db.collection("profiles").doc(user.uid);
    return C.db.runTransaction(async (tx) => {
      const us = await tx.get(uref), ps = await tx.get(pref); const cur = us.exists ? us.data().savedAt || 0 : 0;
      if (!force && cur > base) return { conflict: true, cloud: { data: JSON.parse(us.data().data), savedAt: cur } };
      const now = Math.max(Date.now(), cur + 1);
      tx.set(uref, { data: text, savedAt: now, bytes });
      const prof = { name: user.displayName || "", email: user.email || "", photo: user.photoURL || "", bytes, lastSeenAt: now };
      if (!ps.exists) prof.createdAt = now; tx.set(pref, prof, { merge: true });
      return { ok: true, savedAt: now, bytes };
    });
  };
  C.touch = async (uid, user, bytes) => { try { const ref = C.db.collection("profiles").doc(uid); const s = await ref.get(); const now = Date.now(); const prof = { name: user.displayName || "", email: user.email || "", photo: user.photoURL || "", lastSeenAt: now }; if (!s.exists) { prof.createdAt = now; prof.bytes = bytes || 0; } await ref.set(prof, { merge: true }); } catch (e) { /* 접속 기록 실패는 무시 */ } };
  C.listProfiles = async () => { const q = await C.db.collection("profiles").get(); return q.docs.map((d) => ({ uid: d.id, ...d.data() })); };

  PE.useAuth = function useAuth() {
    const { useState, useEffect } = React; const [a, setA] = useState(() => (!C.on ? { status: "off", user: null } : C.auth.currentUser ? { status: "in", user: C.auth.currentUser } : { status: "loading", user: null }));
    useEffect(() => { if (!C.on) return; return C.auth.onAuthStateChanged((u) => setA({ status: u ? "in" : "out", user: u || null }), () => setA({ status: "out", user: null })); }, []);
    return a;
  };

  const fmtB = (n) => (n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0) + " KB" : (n / 1048576).toFixed(2) + " MB");
  const fmtD = (t) => { if (!t) return "–"; const d = new Date(t); const p = (x) => String(x).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
  const ago = (t) => { if (!t) return "–"; const m = Math.round((Date.now() - t) / 60000); if (m < 1) return "방금"; if (m < 60) return m + "분 전"; const hh = Math.round(m / 60); if (hh < 24) return hh + "시간 전"; return Math.round(hh / 24) + "일 전"; };
  PE.fmtBytes = fmtB;

  /* 로그인 화면 */
  PE.LoginScreen = function LoginScreen({ onSample }) {
    const [err, setErr] = React.useState(""); const [busy, setBusy] = React.useState(false);
    const go = async () => { setErr(""); setBusy(true); try { await C.signIn(); } catch (e) { setErr(e.code === "auth/unauthorized-domain" ? "이 주소가 파이어베이스의 '승인된 도메인'에 없어요. 설명서의 4단계를 확인해 주세요." : "로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요. (" + (e.code || e.message) + ")"); } setBusy(false); };
    return h`<div className="login"><div className="card login-card">
      <div className="login-logo">🏃</div><h1>체육 워크스페이스</h1>
      <p className="card-sub">구글 계정으로 로그인하면 집·학교 어디서든 같은 데이터를 쓸 수 있어요.</p>
      <button type="button" className="g-btn" disabled=${busy} onClick=${go}><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>${busy ? "로그인 중…" : "Google 계정으로 로그인"}</button>
      ${err ? h`<p className="form-err">${err}</p>` : null}
      <div className="login-or"><span>또는</span></div>
      <button type="button" className="sample-btn" onClick=${onSample}>샘플 데이터로 둘러보기</button>
      <p className="card-sub login-note">가입 전에 어떤 기능이 있는지 미리 볼 수 있어요. 고쳐도 저장되지 않아요.</p>
      <p className="card-sub login-note">로그인하면 이름과 이메일, 가입일, 사용 용량만 관리자에게 보여요. 학생 정보는 내 계정에서만 볼 수 있어요.</p></div></div>`;
  };

  /* 관리자 페이지: 가입자 수 · 저장 용량 (학생 데이터는 읽지 않아요) */
  PE.pages = PE.pages || {};
  PE.pages.admin = function Admin() {
    const { useState, useEffect } = React; const A = PE.useAuth(); const [rows, setRows] = useState(null); const [err, setErr] = useState("");
    const load = () => { setRows(null); setErr(""); C.listProfiles().then((r) => setRows(r.sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0)))).catch((e) => setErr(e.code === "permission-denied" ? "권한이 없어요. 관리자 계정으로 로그인했는지, 보안 규칙의 관리자 이메일이 맞는지 확인해 주세요." : "불러오지 못했어요. (" + (e.code || e.message) + ")")); };
    useEffect(() => { if (C.on && C.isAdmin(A.user)) load(); }, [A.user && A.user.uid]);
    if (!C.on || !C.isAdmin(A.user)) return h`<div className="page"><div className="card"><h2>관리자만 볼 수 있어요</h2><p className="card-sub">관리자로 등록된 구글 계정으로 로그인해 주세요.</p></div></div>`;
    const total = (rows || []).reduce((s, r) => s + (r.bytes || 0), 0); const LIM = 1073741824; const pct = total / LIM * 100;
    return h`<div className="page"><div className="page-head"><h1>관리자</h1><${PE.Button} size="sm" onClick=${load}>새로고침<//></div>
      <div className="adm-stats">
        <div className="card adm-stat"><span>가입한 사람</span><b className="num">${rows ? rows.length : "–"}<small>명</small></b></div>
        <div className="card adm-stat"><span>쓰는 저장 용량</span><b className="num">${rows ? fmtB(total) : "–"}</b><small>무료 한도 1 GB의 ${pct < 0.01 ? "0.01% 미만" : pct.toFixed(2) + "%"}</small></div>
        <div className="card adm-stat"><span>1인 평균</span><b className="num">${rows && rows.length ? fmtB(Math.round(total / rows.length)) : "–"}</b></div></div>
      ${err ? h`<p className="form-err">${err}</p>` : null}
      <div className="card"><div className="paps-scroll"><table className="rank-t adm-t"><thead><tr><th className="l">이름</th><th className="l">이메일</th><th>가입일</th><th>마지막 접속</th><th>용량</th></tr></thead><tbody>
        ${(rows || []).map((r) => h`<tr key=${r.uid}><td className="l">${r.photo ? h`<img className="adm-ph" src=${r.photo} alt="" referrerPolicy="no-referrer" />` : null}${r.name || "–"}</td><td className="l">${r.email}</td><td className="num">${fmtD(r.createdAt)}</td><td className="num">${ago(r.lastSeenAt)}</td><td className="num">${fmtB(r.bytes || 0)}</td></tr>`)}
        ${rows && !rows.length ? h`<tr><td colSpan="5" className="card-sub">아직 가입한 사람이 없어요.</td></tr>` : null}</tbody></table></div>
        <p className="card-sub" style=${{ marginTop: 10 }}>이 표에는 이름·이메일·가입일·마지막 접속·용량만 보여요. 학생 이름 같은 저장 내용은 관리자도 볼 수 없어요.</p></div></div>`;
  };

  /* 설정 메뉴의 계정 칸 */
  PE.AccountSection = function AccountSection({ onClose }) {
    const A = PE.useAuth(); if (!C.on || A.status === "loading") return null;
    const S = PE.useStore();
    return h`<div className="smenu-sec first"><b>계정</b>
      ${A.status !== "in" ? h`<p className="card-sub">${S.sample ? "샘플 데이터를 둘러보는 중이에요." : "로그인하지 않았어요."}</p><div className="set-row"><${PE.Button} size="sm" variant="primary" onClick=${S.exitSample}>구글로 로그인<//></div>`
      : h`<div className="acct"><b>${A.user.displayName || "이름 없음"}</b><span className="card-sub">${A.user.email}</span></div>
        <div className="set-row">${C.isAdmin(A.user) ? h`<a className="btn sm" href="#admin" onClick=${onClose}>관리자 페이지</a>` : null}<${PE.Button} size="sm" variant="danger" onClick=${() => C.signOut()}>로그아웃<//></div>`}</div>`;
  };
})();
