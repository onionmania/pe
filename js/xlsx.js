/* 아주 작은 엑셀(.xlsx) 읽기·쓰기: 외부 라이브러리 없이 동작 */
(function () {
  const PE = (window.PE = window.PE || {});
  const enc = new TextEncoder(), dec = new TextDecoder();
  const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u) => { let c = 0xffffffff; for (let i = 0; i < u.length; i++) c = crcT[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
  const colName = (i) => { let s = ""; for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s; return s; };

  /* 압축 없이 묶는 ZIP */
  function zip(files) {
    const parts = [], central = []; let off = 0;
    const u16 = (n) => [n & 255, (n >> 8) & 255], u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
    for (const f of files) {
      const name = enc.encode(f.name), data = typeof f.data === "string" ? enc.encode(f.data) : f.data, crc = crc32(data);
      const head = new Uint8Array([0x50, 0x4b, 3, 4, 20, 0, 0, 8, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), 0, 0]);
      parts.push(head, name, data);
      central.push(new Uint8Array([0x50, 0x4b, 1, 2, 20, 0, 20, 0, 0, 8, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off)]), name);
      off += head.length + name.length + data.length;
    }
    const cl = central.reduce((n, a) => n + a.length, 0);
    const end = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cl), ...u32(off), 0, 0]);
    return new Blob([...parts, ...central, end], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  /* sheets: [{ name, rows: [[값…], …], widths?: [글자수…] }] */
  PE.writeXlsx = function (sheets) {
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const files = [
      { name: "[Content_Types].xml", data: X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") + "</Types>" },
      { name: "_rels/.rels", data: X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: "xl/workbook.xml", data: X + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map((s, i) => `<sheet name="${esc(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("") + "</sheets></workbook>" },
      { name: "xl/_rels/workbook.xml.rels", data: X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") + `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: "xl/styles.xml", data: X + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="맑은 고딕"/></font><font><b/><sz val="11"/><name val="맑은 고딕"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8EEFB"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' },
    ];
    sheets.forEach((s, si) => {
      const w = s.widths || [];
      const rows = s.rows.map((row, ri) => `<row r="${ri + 1}">` + row.map((v, ci) => {
        if (v == null || v === "") return "";
        const ref = colName(ci) + (ri + 1), st = ri === 0 ? ' s="1"' : "";
        return typeof v === "number" ? `<c r="${ref}"${st}><v>${v}</v></c>` : `<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
      }).join("") + "</row>").join("");
      files.push({ name: `xl/worksheets/sheet${si + 1}.xml`, data: X + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + (w.length ? "<cols>" + w.map((n, i) => `<col min="${i + 1}" max="${i + 1}" width="${n}" customWidth="1"/>`).join("") + "</cols>" : "") + `<sheetData>${rows}</sheetData></worksheet>` });
    });
    return zip(files);
  };

  async function inflate(u8) {
    const ds = new DecompressionStream("deflate-raw");
    const stream = new Blob([u8]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  async function unzip(buf) {
    const u = new Uint8Array(buf), dv = new DataView(buf); const out = {};
    let e = u.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error("엑셀(.xlsx) 파일이 아니에요");
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
    for (let i = 0; i < n; i++) {
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      const name = dec.decode(u.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
      const lnl = dv.getUint16(lo + 26, true), lxl = dv.getUint16(lo + 28, true), start = lo + 30 + lnl + lxl; const raw = u.subarray(start, start + csize);
      out[name] = method === 0 ? raw : method === 8 ? await inflate(raw) : null;
    }
    return out;
  }
  const xml = (u8) => new DOMParser().parseFromString(dec.decode(u8), "application/xml");
  const colIdx = (ref) => { const m = /^([A-Z]+)/.exec(ref); let n = 0; for (const ch of m[1]) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const textOf = (el) => Array.from(el.getElementsByTagName("t")).map((t) => t.textContent).join("");

  /* → [{ name, rows: [[값…], …] }] */
  PE.readXlsx = async function (buf) {
    const z = await unzip(buf);
    if (!z["xl/workbook.xml"]) throw new Error("엑셀(.xlsx) 파일이 아니에요");
    const wb = xml(z["xl/workbook.xml"]); const rels = z["xl/_rels/workbook.xml.rels"] ? xml(z["xl/_rels/workbook.xml.rels"]) : null;
    const rel = {}; if (rels) for (const r of Array.from(rels.getElementsByTagName("Relationship"))) rel[r.getAttribute("Id")] = r.getAttribute("Target");
    const sst = z["xl/sharedStrings.xml"] ? Array.from(xml(z["xl/sharedStrings.xml"]).getElementsByTagName("si")).map(textOf) : [];
    const sheets = [];
    for (const [i, s] of Array.from(wb.getElementsByTagName("sheet")).entries()) {
      const rid = s.getAttribute("r:id") || s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
      let t = rel[rid] || `worksheets/sheet${i + 1}.xml`; t = t.replace(/^\//, "").replace(/^xl\//, ""); const data = z["xl/" + t]; if (!data) continue;
      const rows = [];
      for (const row of Array.from(xml(data).getElementsByTagName("row"))) {
        const arr = []; const ri = Number(row.getAttribute("r")) - 1;
        for (const c of Array.from(row.getElementsByTagName("c"))) {
          const ty = c.getAttribute("t"); const vEl = c.getElementsByTagName("v")[0]; let v = "";
          if (ty === "s") v = sst[Number(vEl && vEl.textContent)] || ""; else if (ty === "inlineStr") v = textOf(c); else if (vEl) v = ty === "n" || !ty ? (isNaN(Number(vEl.textContent)) ? vEl.textContent : Number(vEl.textContent)) : vEl.textContent;
          arr[colIdx(c.getAttribute("r"))] = v;
        }
        rows[ri] = Array.from(arr, (x) => (x == null ? "" : x));
      }
      sheets.push({ name: s.getAttribute("name"), rows: Array.from(rows, (r) => r || []) });
    }
    return sheets;
  };
})();
