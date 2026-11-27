/* 공용 부품: 아이콘, 버튼류, 진행 막대, 대화상자, 테마 고르기 */
(function () {
  const PE = window.PE, React = window.React, h = PE.h, cn = PE.cn;
  const { useEffect, useRef } = React;

  const ICONS = {
    dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    listcheck: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    eraser: '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    settings: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".6"/><circle cx="17.5" cy="10.5" r=".6"/><circle cx="8.5" cy="7.5" r=".6"/><circle cx="6.5" cy="12.5" r=".6"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.7-1.7H16c3 0 5.5-2.5 5.5-5.5C22 6 17.5 2 12 2z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', plus: '<path d="M5 12h14"/><path d="M12 5v14"/>', minus: '<path d="M5 12h14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    rows: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
    columns: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>',
    calrange: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/>',
    grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    userx: '<path d="M2 21a8 8 0 0 1 11.873-7"/><circle cx="10" cy="8" r="5"/><path d="m17 17 5 5"/><path d="m22 17-5 5"/>',
    flame: '<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>',
    shuffle: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/>',
    eyeoff: '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
    trashoff: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="m3 3 18 18"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    team3: '<circle cx="12" cy="7" r="3"/><path d="M7 21v-2a5 5 0 0 1 10 0v2"/><circle cx="4.5" cy="10" r="2.2"/><path d="M1.5 20v-1a3.3 3.3 0 0 1 3-3.3"/><circle cx="19.5" cy="10" r="2.2"/><path d="M22.5 20v-1a3.3 3.3 0 0 0-3-3.3"/>',
    school: '<path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10"/><path d="M18 5v17"/><path d="m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/>',
    cap: '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84l-8.57-3.9a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    pencil: '<path d="M21.2 6.8a1 1 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    activity: '<path d="M22 12h-2.5a2 2 0 0 0-1.9 1.5l-2.4 8.4a.25.25 0 0 1-.5 0L9.2 2.2a.25.25 0 0 0-.5 0l-2.3 8.4A2 2 0 0 1 4.5 12H2"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.7V17c0 .6-.5 1-1 1.2C7.8 18.8 7 20.2 7 22"/><path d="M14 14.7V17c0 .6.5 1 1 1.2 1.2.6 2 2 2 3.8"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    medal: '<path d="M7.2 15 2.7 7.1a2 2 0 0 1 .1-2.2l1.6-2.1A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.1a2 2 0 0 1 .1 2.2L16.8 15"/><circle cx="12" cy="17" r="5"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    swap: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
    wand: '<path d="m15 4 5 5"/><path d="m3 21 12-12"/><path d="M5 3v2"/><path d="M4 4h2"/><path d="M19 15v2"/><path d="M18 16h2"/>',
  };
  PE.Icon = ({ name, className }) => h`<svg className=${cn("ico", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML=${{ __html: ICONS[name] || "" }} />`;
  const I = (n, c) => h`<${PE.Icon} name=${n} className=${c} />`;
  PE.I = I;

  PE.Button = ({ variant, size, icon, className, children, ...rest }) =>
    h`<button type="button" className=${cn("btn", variant, size === "sm" && "sm", icon && "icon-btn", icon && size === "sm" && "sm", className)} ...${rest}>${children}</button>`;

  PE.Seg = ({ value, options, onChange, label }) =>
    h`<div className="seg" role="group" aria-label=${label}>${options.map((o) => h`<button key=${o.value} type="button" aria-pressed=${value === o.value} disabled=${o.disabled} onClick=${() => onChange(o.value)}>${o.icon ? I(o.icon, "") : null}${o.label}</button>`)}</div>`;

  /* 사이클 버튼: 누를 때마다 다음 보기로 넘어가요. 지금 상태를 글자로 보여 줍니다 */
  /* 학생 이름: 2·3·4글자 모두 3글자 폭에 맞춰 가운데 정렬 */
  PE.Nm = ({ name }) => { const n = [...(name || "")].length; return h`<span className=${"nm3" + (n >= 5 ? " l5" : n === 4 ? " l4" : "")}><span className="nm3-i">${name}</span></span>`; };
  /* 화면 설정을 저장해 두었다가 다음에 열어도 그대로 보여줘요 */
  PE.useSaved = (key, init) => { const S = PE.useStore(); const k = "u_" + key; const v = S.state.prefs[k]; const cur = v === undefined ? init : v; return [cur, (x) => S.setPref(k, typeof x === "function" ? x(cur) : x)]; };
  PE.Cycle = ({ value, options, onChange, label }) => { const i = Math.max(0, options.findIndex((o) => o.value === value)); const next = options[(i + 1) % options.length];
    return h`<button type="button" className="btn sm cycle" aria-label=${`${label}: 지금 ${options[i].label}. 누르면 ${next.label}`} title=${`누르면 ${next.label}`} onClick=${() => onChange(next.value)}>${I(options[i].icon || "swap")}${options[i].label}</button>`; };

  PE.Stepper = ({ value, onChange, min = 0, max = 12, label }) =>
    h`<div className="stepper" role="group" aria-label=${label}>
      <button type="button" aria-label="줄이기" disabled=${value <= min} onClick=${() => onChange(value - 1)}>${I("minus")}</button>
      <output className="num">${value}</output>
      <button type="button" aria-label="늘리기" disabled=${value >= max} onClick=${() => onChange(value + 1)}>${I("plus")}</button></div>`;

  /* 달리는 체육 선생님 (오른쪽을 보고 달려요) */
  PE.Runner = ({ kid }) => h`<svg className=${"runner" + (kid ? " kid" : "")} viewBox="0 0 40 52" aria-hidden="true">${kid ? h`<path className="r-pack" d="M14.5 21.5 Q10.5 22 10.8 28 Q11 33 15 33.5 Z" />` : null}
    <g className="r-arm back"><path d="M20 22 L14 31" /></g>
    <g className="r-leg back"><path d="M20 33 L19 43 L15 49" /></g>
    <path className="r-body" d="M14 21 Q20 17 26 21 L25 35 L15 35 Z" />
    <path className="r-stripe" d="M15.2 28 L24.8 28" />
    <g className="r-leg front"><path d="M20 33 L23 42 L21 49" /></g>
    <g className="r-arm front"><path d="M21 22 L28 28" /></g>
    <circle className="r-head" cx="21" cy="12" r="5.6" />
    <path className="r-hair" d="M15.6 11 Q16 5.6 21.5 6 Q26.4 6.4 26.6 11 Q22 8.6 15.6 11Z" />
    ${kid ? null : h`<path className="r-band" d="M15.8 10.8 L26.4 10.6" />`}
    ${kid ? null : h`<path className="r-whistle" d="M23.5 18 L26 21" />`}</svg>`;

  /* 시작 전: 막대 앞에 앉아서 쉬는 사람 */
  PE.Sitter = ({ kid }) => h`<svg className=${"runner sitter" + (kid ? " kid" : "")} viewBox="0 0 40 52" aria-hidden="true">
    ${kid ? h`<path className="r-pack" d="M10.5 26 Q7 27 7.5 33 Q8 38 11.5 38 Z" />` : null}
    <g className="r-leg"><path d="M16 46 L28 44 L30 51" /></g>
    <path className="r-body" d="M11 28 Q16 24 21 27 L20 45 L12 45 Z" />
    <path className="r-stripe" d="M11.8 36 L20.4 36" />
    <g className="r-leg"><path d="M17 46 L27 41 L29 51" /></g>
    <g className="r-arm"><path d="M17 30 L25 39 L27 41" /></g>
    <circle className="r-head" cx="17" cy="19" r="5.6" />
    <path className="r-hair" d="M11.6 18 Q12 12.6 17.5 13 Q22.4 13.4 22.6 18 Q18 15.6 11.6 18Z" />
    ${kid ? null : h`<path className="r-band" d="M11.8 17.8 L22.4 17.6" />`}
    <text className="zz" x="25" y="12">z</text><text className="zz z2" x="30" y="6">z</text></svg>`;

  /* 100%: 두 팔을 번쩍 들고 폴짝 뛰는 사람 */
  PE.Cheer = ({ kid }) => h`<svg className=${"runner cheer" + (kid ? " kid" : "")} viewBox="0 0 40 52" aria-hidden="true">${kid ? h`<path className="r-pack" d="M14.5 21.5 Q10.5 22 10.8 28 Q11 33 15 33.5 Z" />` : null}
    <g className="r-arm back"><path d="M20 22 L12 11" /></g>
    <g className="r-leg back"><path d="M20 33 L17 43 L13 48" /></g>
    <path className="r-body" d="M14 21 Q20 17 26 21 L25 35 L15 35 Z" />
    <path className="r-stripe" d="M15.2 28 L24.8 28" />
    <g className="r-leg front"><path d="M20 33 L24 42 L26 48" /></g>
    <g className="r-arm front"><path d="M21 22 L29 11" /></g>
    <circle className="r-head" cx="20.5" cy="12.5" r="5.6" />
    <path className="r-hair" d="M15 11.5 Q15.4 6 20.9 6.4 Q25.8 6.8 26 11.5 Q21.4 9 15 11.5Z" />
    <path className="r-smile" d="M18 14.6 Q20.5 17 23 14.6" />
    <path className="r-star" d="M6 8 L7 5 L8 8 L11 9 L8 10 L7 13 L6 10 L3 9 Z" /><path className="r-star s2" d="M33 6 L34 3.5 L35 6 L37.5 7 L35 8 L34 10.5 L33 8 L30.5 7 Z" /></svg>`;

  /* 가로 진행 막대: ticks는 0~100 위치. runner면 채움 끝에 달리는 선생님 */
  PE.Bar = ({ pct, size, tone, ticks, label, runner, pctText }) =>
    h`<div className=${cn("bar", size, tone, runner && "has-runner")} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct == null ? undefined : pct} aria-label=${label}>
      <${Fill} pct=${pct || 0} runner=${runner} pctText=${pctText} />
      ${(ticks || []).map((t, i) => h`<span key=${i} className=${cn("bar-tick", t.kind)} style=${{ left: t.pos + "%" }} title=${t.name}></span>`)}</div>`;
  function Fill({ pct, runner, pctText }) {
    const [w, setW] = React.useState(0);
    useEffect(() => { const t = setTimeout(() => setW(pct), 60); return () => clearTimeout(t); }, [pct]);
    const pt = pctText ? h`<span className=${cn("rn-pct num", pct < 12 && "ahead")}>${pct}<small>%</small></span>` : null;
    return h`<div className="bar-fill" style=${{ width: w + "%" }}>${runner && pct >= 100 ? h`<span className="runner-wrap"><${PE.Cheer} kid=${runner === "kid"} />${pt}</span>` : runner && pct > 0 ? h`<span className="runner-wrap"><${PE.Runner} kid=${runner === "kid"} />${pt}</span>` : runner ? h`<span className="runner-wrap sit"><${PE.Sitter} kid=${runner === "kid"} />${pt}</span>` : null}</div>`;
  }

  PE.Dialog = function Dialog({ open, onClose, wide, fit, narrow, mid, full, children }) {
    const ref = React.useRef(null);
    useEffect(() => { if (!open) return; const k = (e) => { if (e.key !== "Escape") return; const all = document.querySelectorAll(".overlay"); if (all[all.length - 1] === ref.current) onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open]);
    if (!open) return null;
    return ReactDOM.createPortal(h`<div ref=${ref} className="overlay" onMouseDown=${(e) => e.target === e.currentTarget && onClose()}><div className=${cn("dialog", wide && "wide", fit && "fit", narrow && "narrow", mid && "mid", full && "full")} role="dialog" aria-modal="true">${children}</div></div>`, document.body);
  };

  /* 클릭한 자리 근처에 뜨는 작은 팝업 (바깥을 누르거나 Esc로 닫힘) */
  PE.Popover = function Popover({ open, at, onClose, children }) {
    const ref = React.useRef(null); const [pos, setPos] = React.useState(null);
    React.useLayoutEffect(() => {
      if (!open || !at) { setPos(null); return; }
      const el = ref.current; const w = el ? el.offsetWidth : 200, hh = el ? el.offsetHeight : 120; const m = 8;
      let left = at.x + 6, top = at.y + 6;
      if (left + w > window.innerWidth - m) left = Math.max(m, at.x - w - 6);
      if (top + hh > window.innerHeight - m) top = Math.max(m, at.y - hh - 6);
      setPos({ left, top });
    }, [open, at && at.x, at && at.y]);
    useEffect(() => {
      if (!open) return;
      const k = (e) => e.key === "Escape" && onClose();
      const d = (e) => { if (ref.current && !ref.current.contains(e.target) && !(e.target.closest && e.target.closest("[data-pop-ignore]"))) onClose(); };
      window.addEventListener("keydown", k); document.addEventListener("mousedown", d, true);
      return () => { window.removeEventListener("keydown", k); document.removeEventListener("mousedown", d, true); };
    }, [open]);
    if (!open || !at) return null;
    return ReactDOM.createPortal(h`<div ref=${ref} className="pop" role="dialog" style=${{ left: pos ? pos.left : at.x, top: pos ? pos.top : at.y, visibility: pos ? "visible" : "hidden" }}>${children}</div>`, document.body);
  };

  /* 파일 저장: 미리보기에서는 다운로드 권한 창구를, 배포 후에는 일반 다운로드를 써요 */
  PE.download = async function (filename, blob) {
    try {
      if (window.claude && window.claude.use) { const d = await window.claude.use("downloads"); if (d) { await d.save({ filename, data: blob }); return true; } }
    } catch (e) { if (e && e.code === "declined") return false; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); return true;
  };

  PE.SaveBadge = ({ s }) => h`<span className="save" data-s=${s} role="status"><i></i>${s === "saving" ? "저장 중…" : s === "error" ? "저장 실패" : s === "toobig" ? "용량 초과" : "저장됨"}</span>`;

  /* ---------- 테마 ---------- */
  PE.THEMES = [
    { id: "flat", name: "플랫", desc: "그림자 없이 단정한 기본형", dark: true },
    { id: "glass", name: "글래스모피즘", desc: "색 배경 위에 비치는 유리 카드", dark: true },
    { id: "brutal", name: "네오브루탈리즘", desc: "굵은 테두리와 평평한 그림자", dark: true },
  ];
  PE.ACCENTS = [["#3461f0", "파랑"], ["#4f46e5", "남색"], ["#8b5cf6", "보라"], ["#ec4899", "분홍"], ["#e11d48", "빨강"], ["#f97316", "주황"], ["#16a34a", "초록"], ["#0d9488", "청록"], ["#334155", "슬레이트"]];
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
  function applyAccent(hex) {
    const st = document.documentElement.style; const keys = ["--primary", "--primary-hover", "--primary-soft", "--primary-contrast", "--ring"];
    if (!hex) { keys.forEach((k) => st.removeProperty(k)); return; }
    st.setProperty("--primary", hex); st.setProperty("--primary-hover", `color-mix(in srgb, ${hex} 82%, black)`);
    st.setProperty("--primary-soft", `color-mix(in srgb, ${hex} 15%, var(--surface))`); st.setProperty("--primary-contrast", lum(hex) > 0.5 ? "#111" : "#fff"); st.setProperty("--ring", hex + "66");
  }
  PE.useAppearance = function () {
    const S = PE.useStore();
    const [sys, setSys] = React.useState(() => (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
    useEffect(() => { if (!window.matchMedia) return; const m = matchMedia("(prefers-color-scheme: dark)"); const f = () => setSys(m.matches ? "dark" : "light"); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
    const meta = PE.THEMES.find((t) => t.id === S.state.theme) || PE.THEMES[0];
    const resolved = S.state.mode === "auto" ? sys : S.state.mode;
    useEffect(() => { document.documentElement.dataset.theme = meta.id; document.documentElement.dataset.mode = resolved; }, [meta.id, resolved]);
    useEffect(() => { applyAccent(S.state.accent); }, [S.state.accent]);
    return { theme: meta.id, resolved, meta };
  };

  /* 테마 창: 테마 · 밝기 · 포인트 색 */
  PE.SettingsDialog = function SettingsDialog({ open, onClose }) {
    const S = PE.useStore();
    const { resolved } = PE.useAppearance();
    const acc = S.state.accent;
    return h`<${PE.Dialog} open=${open} onClose=${onClose} wide>
      <h2>테마</h2><p className="sub">선택은 자동 저장돼요.</p>
      <div className="field"><label>화면 테마</label>
        <div className="theme-grid">${PE.THEMES.map((t) => h`<button key=${t.id} type="button" className="theme-card" aria-pressed=${S.state.theme === t.id} onClick=${() => S.setTheme(t.id)}>
          <div className="pv" data-theme=${t.id} data-mode=${resolved}><div className="pc"><div className="pb"><i></i></div></div><div className="pb" style=${{ width: "70%" }}><i style=${{ background: "var(--accent)", width: "40%" }}></i></div></div>
          <b>${t.name}</b><small>${t.desc}</small></button>`)}</div></div>
      <div className="field" style=${{ marginTop: 18 }}><label>밝기</label>
        <${PE.Seg} label="밝기" value=${S.state.mode} onChange=${S.setMode} options=${[{ value: "auto", label: "자동" }, { value: "light", label: "라이트", icon: "sun" }, { value: "dark", label: "다크", icon: "moon" }]} /></div>
      <div className="field" style=${{ marginTop: 18 }}><label>포인트 색</label>
        <div className="swatches">
          <${PE.Button} size="sm" variant=${!acc ? "primary" : ""} onClick=${() => S.setAccent(null)}>테마 기본<//>
          ${PE.ACCENTS.map(([hex, name]) => h`<button key=${hex} type="button" className="swatch" title=${name} aria-label=${name} aria-pressed=${acc === hex} style=${{ background: hex }} onClick=${() => S.setAccent(hex)}>${acc === hex ? I("check", "") : null}</button>`)}
          <label className="swatch custom" title="직접 고르기" aria-label="직접 고르기"><input type="color" value=${acc || "#3461f0"} onChange=${(e) => S.setAccent(e.target.value)} /></label></div></div>
      <div className="dialog-foot"><div></div><${PE.Button} variant="primary" onClick=${onClose}>완료<//></div><//>`;
  };

  /* 설정 버튼 바로 아래에 이어서 뜨는 작은 메뉴 */
  PE.SettingsMenu = function SettingsMenu({ open, at, onClose, onTheme }) {
    const S = PE.useStore(); const runner = S.state.prefs.runner !== false;
    const { resolved } = PE.useAppearance(); const acc = S.state.accent;
    const meta = (PE.THEMES.find((t) => t.id === S.state.theme) || {}).name || "";
    const fileRef = React.useRef(null); const [msg, setMsg] = React.useState(null);
    const backup = async () => { const d = new Date(); const t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; const ok = await PE.download(`체육워크스페이스_백업_${t}.json`, new Blob([JSON.stringify(S.state)], { type: "application/json" })); if (ok) setMsg({ text: "백업 파일을 저장했어요." }); };
    const restore = async (e) => {
      const f = e.target.files[0]; e.target.value = ""; if (!f) return;
      try { const o = JSON.parse(await f.text()); if (!o || o.v !== 1 || !o.years || !o.year || !o.years[o.year]) throw new Error("x"); S.restoreAll(o); setMsg({ text: "백업을 불러왔어요. 지금 화면의 데이터가 백업 내용으로 바뀌었어요." }); }
      catch (err) { setMsg({ err: true, text: "읽을 수 없는 파일이에요. 이 화면에서 저장한 백업 파일(.json)을 골라 주세요." }); }
    };
    return h`<${PE.Popover} open=${open} at=${at} onClose=${onClose}>
      <div className="smenu">
        ${PE.AccountSection ? h`<${PE.AccountSection} onClose=${onClose} />` : null}
        <div className="smenu-sec"><b>테마</b>
          <div className="mini-themes">${PE.THEMES.map((t) => h`<button key=${t.id} type="button" className="theme-card mini" aria-pressed=${S.state.theme === t.id} onClick=${() => S.setTheme(t.id)}>
            <div className="pv" data-theme=${t.id} data-mode=${resolved}><div className="pc"><div className="pb"><i></i></div></div><div className="pb" style=${{ width: "70%" }}><i style=${{ background: "var(--accent)", width: "40%" }}></i></div></div><b>${t.name}</b></button>`)}</div>
          <div className="set-row"><span>밝기</span><${PE.Seg} label="밝기" value=${S.state.mode} onChange=${S.setMode} options=${[{ value: "auto", label: "자동" }, { value: "light", label: "라이트" }, { value: "dark", label: "다크" }]} /></div>
          <div className="set-row acc-row"><span>포인트 색</span><div className="swatches sm">
            <button type="button" className="swatch def" title="테마 기본 색" aria-label="테마 기본 색" aria-pressed=${!acc} onClick=${() => S.setAccent(null)}>기본</button>
            ${PE.ACCENTS.map(([hex, name]) => h`<button key=${hex} type="button" className="swatch" title=${name} aria-label=${name} aria-pressed=${acc === hex} style=${{ background: hex }} onClick=${() => S.setAccent(hex)}>${acc === hex ? I("check", "") : null}</button>`)}
            <label className="swatch custom" title="직접 고르기" aria-label="직접 고르기" data-pop-ignore><input type="color" value=${acc || "#3461f0"} onChange=${(e) => S.setAccent(e.target.value)} /></label></div></div></div>
        <div className="smenu-sec"><b>학기</b>
          <div className="set-row"><span>보는 학기</span><${PE.Seg} label="학기" value=${S.state.prefs.sem || (PE.currentSem(S.yd, PE.today()) === 2 ? 2 : 1)} onChange=${(v) => S.setPref("sem", v)} options=${[{ value: 1, label: "1학기" }, { value: 2, label: "2학기" }]} /></div></div>
        <div className="smenu-sec"><b>화면</b>
          <div className="set-row"><span>달리는 사람</span><${PE.Seg} label="달리는 사람" value=${runner ? "on" : "off"} onChange=${(v) => S.setPref("runner", v === "on")} options=${[{ value: "on", label: "켜기" }, { value: "off", label: "끄기" }]} /></div>
          <div className="set-row"><span>화면 폭</span><${PE.Seg} label="화면 폭" value=${S.state.prefs.width || 2} onChange=${(v) => S.setPref("width", v)} options=${[{ value: 1, label: "1단계" }, { value: 2, label: "2단계" }, { value: 3, label: "3단계" }]} /></div>
          <div className="set-row"><span>진행률 보기</span><${PE.Seg} label="진행률 보기" value=${S.state.prefs.dash} onChange=${(v) => S.setPref("dash", v)} options=${[{ value: "grade", label: "학년별" }, { value: "class", label: "반별" }]} /></div></div>
        <div className="smenu-sec"><b>데이터 백업</b>
          <div className="set-row"><${PE.Button} size="sm" onClick=${backup}>${I("download")} 저장<//><${PE.Button} size="sm" onClick=${() => fileRef.current && fileRef.current.click()}>${I("upload")} 불러오기<//></div>
          <input ref=${fileRef} type="file" accept=".json,application/json" hidden onChange=${restore} />
          ${msg ? h`<p className=${msg.err ? "form-err" : "card-sub"}>${msg.text}</p>` : null}</div>
      </div><//>`;
  };

  /* ---------- 날짜 고르기: 테마를 따르는 달력 팝업 ---------- */
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  PE.DatePicker = function DatePicker({ id, value, onChange, min, marks, placeholder, label }) {
    const { useState, useRef } = React;
    const [open, setOpen] = useState(false); const [view, setView] = useState((value || PE.today()).slice(0, 7)); const [pos, setPos] = useState(null);
    const btn = useRef(null), pop = useRef(null);
    const toggle = () => {
      if (open) { setOpen(false); return; }
      const r = btn.current.getBoundingClientRect(); const w = 292, hgt = 352;
      let top = r.bottom + 6; if (top + hgt > window.innerHeight - 8) top = Math.max(8, r.top - hgt - 6);
      setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - w - 8)), top }); setView((value || PE.today()).slice(0, 7)); setOpen(true);
    };
    useEffect(() => {
      if (!open) return;
      const down = (e) => { if (pop.current && !pop.current.contains(e.target) && !btn.current.contains(e.target)) setOpen(false); };
      const key = (e) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
      const close = () => setOpen(false);
      document.addEventListener("mousedown", down); window.addEventListener("keydown", key, true); window.addEventListener("resize", close); window.addEventListener("scroll", close, true);
      return () => { document.removeEventListener("mousedown", down); window.removeEventListener("keydown", key, true); window.removeEventListener("resize", close); window.removeEventListener("scroll", close, true); };
    }, [open]);
    const [vy, vm] = view.split("-").map(Number);
    const shift = (n) => { const d = new Date(vy, vm - 1 + n, 1); setView(PE.ymd(d).slice(0, 7)); };
    const first = new Date(vy, vm - 1, 1), len = new Date(vy, vm, 0).getDate(); const today = PE.today();
    const cells = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(h`<span key=${"b" + i}></span>`);
    for (let d = 1; d <= len; d++) {
      const s = PE.ymd(new Date(vy, vm - 1, d)); const w = PE.dow(s); const kind = marks && marks(s); const dis = min && s < min;
      cells.push(h`<button key=${s} type="button" disabled=${dis} className=${cn("dp-day num", w === 0 && "sun", w === 6 && "sat", kind === "holiday" && "hol", kind === "closure" && "clo", s === today && "today", s === value && "sel")} onClick=${() => { onChange(s); setOpen(false); }}>${d}</button>`);
    }
    const text = value ? `${value.replace(/-/g, ". ")} (${DOW[PE.dow(value)]})` : placeholder || "날짜 고르기";
    return h`<div className="dp"><button id=${id} ref=${btn} type="button" className=${cn("input dp-btn num", !value && "empty")} aria-label=${label} aria-haspopup="dialog" aria-expanded=${open} onClick=${toggle}><span>${text}</span>${I("calendar", "")}</button>
      ${open && pos ? ReactDOM.createPortal(h`<div ref=${pop} className="dp-pop" role="dialog" aria-label="날짜 고르기" style=${{ left: pos.left, top: pos.top }}>
        <div className="dp-head"><button type="button" className="dp-nav" aria-label="이전 달" onClick=${() => shift(-1)}>${I("left")}</button><b>${vy}년 ${vm}월</b><button type="button" className="dp-nav" aria-label="다음 달" onClick=${() => shift(1)}>${I("right")}</button></div>
        <div className="dp-wk">${DOW.map((x) => h`<span key=${x}>${x}</span>`)}</div><div className="dp-grid">${cells}</div>
        <div className="dp-foot"><button type="button" className="dp-link" onClick=${() => { onChange(today); setOpen(false); }}>오늘</button>${value ? h`<button type="button" className="dp-link" onClick=${() => { onChange(""); setOpen(false); }}>지우기</button>` : null}</div></div>`, document.body) : null}</div>`;
  };

  PE.ConfirmDialog = ({ open, title, body, confirmLabel, danger, onConfirm, onClose }) =>
    h`<${PE.Dialog} open=${open} onClose=${onClose}><h2>${title}</h2><p className="sub" style=${{ marginBottom: 0 }}>${body}</p>
      <div className="dialog-foot"><div></div><div><${PE.Button} onClick=${onClose}>취소<//><${PE.Button} variant=${danger ? "primary danger-fill" : "primary"} onClick=${onConfirm}>${confirmLabel || "확인"}<//></div></div><//>`;

  PE.ClassTag = ({ k, className }) => h`<span className=${cn("class-tag num", className)} style=${{ "--tag": PE.GRADE_COLORS[PE.keyGrade(k)] || "#64748b" }}>${k}</span>`;
})();
