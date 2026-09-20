import {
  catalog,
  groups,
  byId,
  defaults,
  generate,
  parseCSV,
  autoMap,
  mappings,
  importOrders,
  sampleOrders,
  toCSV,
  toMarkdown,
} from "./engine.js?v=20260920";
import { mountAI, enhanceWithAI, mountAIResult, readAIChoice } from "./ai.js?v=20260920";
import { homeView } from "./home.js?v=20260920";
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const KEY = "shunshi-demo-v1";
let persisted = {};
try {
  persisted = JSON.parse(localStorage.getItem(KEY) || "{}");
  if (!persisted || typeof persisted !== 'object' || Array.isArray(persisted)) persisted = {};
} catch {}
const state = {
  ctx: {},
  saved: Array.isArray(persisted.saved) ? persisted.saved : [],
  drafts: {},
  results: {},
  orders: sampleOrders(),
  dataLabel: "虚构示例订单",
  group: -1,
  query: "",
  parsed: null,
  map: null,
  importErrors: [],
  matrixAudience: "",
  matrixFormat: "",
};
let active = "home",
  timer;
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").classList.add("show");
  clearTimeout(timer);
  timer = setTimeout(() => $("#toast").classList.remove("show"), 3200);
}
function persist() {
  try {
    const next = { ctx: { ...persisted.ctx, ...structuredClone(state.ctx) }, saved: structuredClone(state.saved) };
    localStorage.setItem(
      KEY,
      JSON.stringify(next),
    );
    persisted = next;
    return true;
  } catch {
    toast("本地保存失败：浏览器可能禁用存储或容量不足。");
    return false;
  }
}
function navigate(id) {
  if (location.hash === "#" + id) render();
  else location.hash = id;
}
function currentValues() {
  const f = $("#tool-form");
  return f ? Object.fromEntries(new FormData(f)) : {};
}
function remember() {
  if (byId[active] && $("#tool-form")) state.drafts[active] = currentValues();
}
function nav() {
  $("#nav").innerHTML = `<a href="#home" class="${active==='home'?'active':''}">全部工具</a><a class="desktop-link" href="https://shun-se.com/" target="_blank" rel="noopener">返回官网 ↗</a><a class="nav-consult" href="https://shun-se.com/diagnosis/" target="_blank" rel="noopener">预约诊断</a>`;
}

function cards() {
  return (
    catalog
      .filter(
        (t, i) =>
          (state.group < 0 || Math.floor(i / 3) === state.group) &&
          (!state.query ||
            (t.name + t.desc + groups[Math.floor(i / 3)])
              .toLowerCase()
              .includes(state.query.toLowerCase())),
      )
      .map((t) => {
        const i = catalog.indexOf(t);
        return `<a class="tool-card" href="#${t.id}"><div class="card-top"><span class="icon">${["◎", "▧", "Aa", "✎", "▦", "↗", "∑", "⌁", "%", "◈", "≋", "◉", "▤", "⋮", "▥"][i]}</span><span class="tiny-tag">${i >= 6 && i < 9 ? "计算与诊断" : i >= 12 ? "本地数据" : "规则模拟"}</span></div><h3>${t.name}</h3><p>${t.desc}</p><div class="card-bottom">${groups[Math.floor(i / 3)]}<span>↗</span></div></a>`;
      })
      .join("") ||
    '<div class="empty">没有找到工具，试试「品牌」「广告」或「会员」。</div>'
  );
}

function fieldHTML(f, v) {
  const attrs = `name="${f.key}" id="f-${f.key}" ${f.required ? "required" : ""} ${f.maxLength ? 'maxlength="' + f.maxLength + '"' : ""}`;
  let control;
  if (f.type === "textarea")
    control = `<textarea ${attrs} rows="${f.key === "comments" ? 7 : 3}" maxlength="${f.maxLength || 3000}">${esc(v ?? "")}</textarea>`;
  else if (f.type === "select")
    control = `<select ${attrs}>${f.options.map((o) => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  else
    control = `<input ${attrs} type="${f.type}" value="${esc(v ?? "")}" ${["number", "range"].includes(f.type) ? `min="${f.min ?? 0}" max="${f.max ?? 1000000000000}" step="${f.type === "range" ? 1 : "any"}"` : ""} ${f.type === "text" ? 'maxlength="3000"' : ""}>`;
  return `<label class="field"><span>${esc(f.label)}${f.required ? " <em>*</em>" : ""}${f.type === "range" ? ` <output>${esc(v ?? 50)}</output>` : ""}</span>${control}</label>`;
}
function draft(id) {
  if (state.drafts[id]) return state.drafts[id];
  if (state.ctx[id] && ["brand", "persona", "tov"].includes(id))
    return { ...state.ctx[id] };
  const d = defaults(id);
  for (const f of byId[id].fields)
    if (["text", "textarea"].includes(f.type)) d[f.key] = "";
  if (id === "persona" && state.ctx.brand) {
    d.audience = state.ctx.brand.audience;
    d.difference = state.ctx.brand.position;
  }
  if (id === "sentiment") d.source = "用户粘贴（未经核实）";
  if (["copy", "matrix", "social"].includes(id) && state.ctx.product) {
    for (const key of ["product", "features", "price", "goal", "offer"])
      if (key in d && key in state.ctx.product) d[key] = state.ctx.product[key];
  }
  return d;
}
function uploadHTML() {
  return `<div class="upload"><strong>订单数据 · ${esc(state.dataLabel)}</strong><p>CSV 仅在本标签页内处理，不上传。必需：邮箱、日期、金额。可选：订单号、姓名、状态、退款金额、渠道。</p><label class="button">选择 CSV<input id="csv-file" type="file" accept=".csv,text/csv" hidden></label> <button type="button" data-action="sample-csv">下载示例 CSV</button><p class="source">日期：YYYY-MM-DD；状态：completed / cancelled / refunded / partial_refund。每行一张订单，最多 10,000 行 / 2MB。</p><div id="mapping">${mappingHTML()}</div></div>`;
}
function mappingHTML() {
  if (!state.parsed) return "";
  return `<h3>确认字段映射</h3><div class="row">${Object.keys(mappings)
    .map(
      (k) =>
        `<label class="field"><span>${k}${["email", "date", "amount"].includes(k) ? " *" : ""}</span><select data-map="${k}"><option value="">不导入此列</option>${state.parsed.headers.map((h) => `<option value="${esc(h)}" ${state.map[k] === h ? "selected" : ""}>${esc(h)}</option>`).join("")}</select></label>`,
    )
    .join(
      "",
    )}</div><button type="button" class="primary" data-action="import">校验并载入数据</button><div id="import-status" role="status"></div>`;
}
function toolPage(id) {
  const t = byId[id], member = ["scv", "rfm", "dashboard"].includes(id);
  const values = draft(id);
  const primaryFields = t.fields.filter((f,i) => f.required || i < 3 || ["kpi","roas","diagnose"].includes(id));
  const optional = t.fields.filter(f => !primaryFields.includes(f));
  const shared = ["persona","tov","copy","matrix","social"].includes(id);
  return `<div class="breadcrumbs"><a href="#home">全部工具</a> / ${groups[Math.floor(catalog.indexOf(t) / 3)]}</div>
    <div class="tool-title"><div><h1>${t.name}</h1><p>${t.desc}</p></div></div>
    ${shared ? `<details class="brand-context"><summary>品牌资料（可选） · ${esc(state.ctx.brand?.name || "本次未设置")}</summary><div class="context"><span>Persona：${state.ctx.persona ? "已复用" : "未设置"}</span><span>TOV：${esc(state.ctx.tov?.tone || "未设置")}</span><a href="#brand">设置品牌</a><a href="#persona">受众画像</a><a href="#tov">品牌语气</a></div></details>` : ""}
    <div class="workspace"><section class="panel input-panel" id="input-panel"><div class="panel-heading"><h2>填写资料</h2><button type="button" data-action="example">加载示例</button></div>
    <form id="tool-form">${member ? uploadHTML() : ""}${primaryFields.map(f=>fieldHTML(f,values[f.key])).join("")}
    ${optional.length ? `<details class="optional-fields"><summary>更多设置 · ${optional.length} 项</summary>${optional.map(f=>fieldHTML(f,values[f.key])).join("")}</details>` : ""}
    <div id="form-error" class="notice error" hidden role="alert"></div><button class="primary wide" id="run" type="submit">${["kpi","roas","diagnose","scv","rfm","dashboard"].includes(id) ? "开始计算" : id==="brand" ? "应用品牌资料" : "生成规则演示"} ↗</button>
    <p class="source">${member ? "订单仅在本页处理，不上传。" : "资料默认仅用于本次会话"}</p></form></section>
    <section class="panel result-panel" id="result-panel" tabindex="-1"><div class="panel-heading"><h2>查看结果</h2><span class="badge" id="result-kind">${esc(state.results[id]?.kind || "结果预览")}</span><button class="return-input" data-action="back-input">修改输入 ↑</button></div><div id="result">${resultHTML(state.results[id])}</div></section></div>`;
}
function tableHTML(t, idx) {
  let rows = t.rows;
  if (active === "matrix")
    rows = rows.filter(
      (r) =>
        (!state.matrixAudience || r[0] === state.matrixAudience) &&
        (!state.matrixFormat || r[1] === state.matrixFormat),
    );
  return `<div class="result-block"><h3>${esc(t.title)}</h3><div class="table-wrap"><table><thead><tr>${t.headers.map((h) => `<th>${esc(h)}</th>`).join("")}${active === "matrix" ? "<th>操作</th>" : ""}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((x, col) => `<td>${active === "matrix" && col === 2 ? `<textarea aria-label="编辑${esc(row[0])}${esc(row[1])}" data-matrix-row="${t.rows.indexOf(row)}" data-matrix-table="${idx}" style="min-width:230px">${esc(x)}</textarea>` : esc(x)}</td>`).join("")}${active === "matrix" ? `<td><button data-copy-row="${t.rows.indexOf(row)}" data-table="${idx}">复制</button></td>` : ""}</tr>`).join("") || `<tr><td colspan="${t.headers.length}">当前无有效数据</td></tr>`}</tbody></table></div></div>`;
}
function resultHTML(r) {
  if (!r) {
    const demo = generate(active, defaults(active));
    return `<div class="tool-preview"><div class="preview-label">虚构示例 · 非本次结果</div><h3>${esc(demo.title)}</h3>${demo.metrics.length ? `<div class="metric-grid">${demo.metrics.slice(0,3).map(m=>`<div class="metric"><span>${esc(m.label)}</span><strong>${esc(m.value)}</strong><small>${esc(m.unit)}</small></div>`).join("")}</div>` : `<div class="preview-lines">${demo.sections.slice(0,2).map(s=>`<div><strong>${esc(s.title)}</strong><br>${esc(s.text.slice(0,120))}…</div>`).join("")}</div>`}<p class="source">填写资料或加载示例后，生成你的结果。</p></div>`;
  }
  const section = (s,i) => `<div class="result-block"><h3>${esc(s.title)}</h3><textarea aria-label="编辑${esc(s.title)}" data-section="${i}" rows="${Math.min(12, Math.max(3, s.text.split("\n").length+2))}">${esc(s.text)}</textarea></div>`;
  return `<p class="result-note">${esc(r.kind)} · ${esc(r.title)}</p><div class="result-toolbar"><button data-action="edit">编辑</button><button data-action="copy">复制</button><button data-action="md">下载文档</button>${r.tables.length ? '<button data-action="csv">下载 CSV</button>' : ''}<details><summary>更多</summary><button data-action="json">下载 JSON</button><button data-action="save">存到本机</button></details></div>
  ${r.metrics.length ? `<div class="metric-grid">${r.metrics.map(m=>`<div class="metric"><span>${esc(m.label)}</span><strong>${esc(m.value)}</strong><small>${esc(m.unit)}</small></div>`).join("")}</div>` : ""}
  ${r.bars.length ? `<div class="result-block"><h3>${active==="radar"?"模拟七日趋势":"数据分布"}</h3>${r.bars.map(b=>`<div class="bar-row"><span>${esc(b.label)}</span><div class="bar"><i style="width:${Math.max(0,Math.min(100,b.max?b.value/b.max*100:0))}%"></i></div><small>${esc(b.value)} ${esc(b.unit)}</small></div>`).join("")}</div>` : ""}
  ${r.sections.map((s,i)=> i===0 ? section(s,i) : `<details><summary>${esc(s.title)}</summary>${section(s,i)}</details>`).join("")}
  ${active==="matrix" ? `<div class="row"><label class="field"><span>客群</span><select id="matrix-audience"><option value="">全部客群</option>${[...new Set(r.tables[0].rows.map(x=>x[0]))].map(x=>`<option ${x===state.matrixAudience?"selected":""}>${esc(x)}</option>`).join("")}</select></label><label class="field"><span>内容形式</span><select id="matrix-format"><option value="">全部形式</option>${[...new Set(r.tables[0].rows.map(x=>x[1]))].map(x=>`<option ${x===state.matrixFormat?"selected":""}>${esc(x)}</option>`).join("")}</select></label></div>` : ""}
  <div id="tables">${r.tables.map(tableHTML).join("")}</div><div class="next"><div><small>下一步</small><h3>${byId[byId[active]?.next]?.name || "返回工具首页"}</h3></div><a class="button" href="#${byId[active]?.next || "home"}">继续使用 →</a></div><a class="tool-consult" href="https://shun-se.com/diagnosis/" target="_blank" rel="noopener">需要业务建议？预约诊断 ↗</a>`;
}
function savedPage() {
  return `<div class="eyebrow">YOUR LOCAL LIBRARY</div><h1>本机资料</h1><p>仅保存在当前浏览器与站点域名内，不跨设备同步。清除浏览器数据会丢失，请及时导出。</p><div class="notice">仅主动保存的资料会留在本机。<button data-action="restore-brand">载入本机品牌资料</button><button data-action="clear-local">清除本地演示资料</button></div><div class="saved-list">${state.saved.map((r, i) => `<div class="saved-item"><div><span class="badge">${esc(r.kind)}</span><h3>${esc(r.title)}</h3><p>${esc(new Date(r.createdAt).toLocaleString("zh-CN"))}</p></div><div><button data-open-saved="${i}">打开</button> <button data-export-saved="${i}">导出 JSON</button> <button data-delete-saved="${i}">删除</button></div></div>`).join("") || '<div class="empty">还没有保存的结果。完成任一工具后，点击「更多 → 存到本机」。</div>'}</div>`;
}
function render() {
  const id = location.hash.slice(1) || "home";
  active = byId[id] || ["home", "saved"].includes(id) ? id : "home";
  nav();
  $("#app").innerHTML =
    active === "home"
      ? homeView({ groups, state, cards, escape: esc })
      : active === "saved"
        ? savedPage()
        : toolPage(active);
  if (byId[active]) {
    bindForm();
    mountAI(active);
    mountAIResult(state.results[active], refreshResult, toast);
  }
  document.body.dataset.page = active;
}
function refreshResult() {
  const r = state.results[active];
  $("#result").innerHTML = resultHTML(r);
  $("#result-kind").textContent = r.kind;
  mountAIResult(r, refreshResult, toast);
}
function bindForm() {
  $("#tool-form").addEventListener("input", (e) => {
    state.drafts[active] = currentValues();
    if (e.target.type === "range")
      e.target.closest("label").querySelector("output").textContent =
        e.target.value;
    if (state.results[active])
      $("#result-kind").textContent = "输入已修改 · 请重新执行";
  });
  $("#tool-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = active,
      v = currentValues(),
      button = $("#run");
    const aiChoice = readAIChoice(),
      context = structuredClone(state.ctx);
    state.drafts[id] = v;
    $("#form-error").hidden = true;
    button.disabled = true;
    button.textContent = "正在本地处理…";
    try {
      await new Promise((resolve) => setTimeout(resolve, 220));
      let r = generate(id, v, context, state.orders);
      if (aiChoice.mode === "ai")
        button.textContent = "正在请求模型（不会自动重试）…";
      r = await enhanceWithAI(id, v, context, r, aiChoice);
      r.contextSnapshot = context;
      if (["scv", "rfm", "dashboard"].includes(id)) {
        r.dataSource = state.dataLabel;
        r.kind = state.dataLabel + " / 真实计算";
        r.importErrors = structuredClone(state.importErrors);
      }
      if (["persona", "copy", "matrix", "social"].includes(id)) {
        state.ctx.product = {
          ...state.ctx.product,
          ...Object.fromEntries(
            Object.entries(v).filter(([k]) =>
              ["product", "features", "price", "goal", "offer"].includes(k),
            ),
          ),
        };
      }
      state.results[id] = r;
      if (["brand","persona","tov"].includes(id)) state.ctx[id] = { ...v };
      if (active === id) {
        refreshResult();
        toast(["brand","persona","tov"].includes(id) ? "已应用到本次会话，可供其他工具复用" : "结果已更新");
        if (matchMedia("(max-width: 767px)").matches) { $("#result-panel").scrollIntoView({behavior:"smooth",block:"start"}); $("#result-panel").focus({preventScroll:true}); }
      }
    } catch (error) {
      if (active === id) {
        $("#form-error").textContent = error.message;
        $("#form-error").hidden = false;
      }
    } finally {
      if (active === id) {
        button.disabled = false;
        button.textContent = "重新生成 / 计算 ↗";
      }
    }
  });
  $("#csv-file")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw Error("文件超过 2MB，请先拆分");
      const parsed = parseCSV(await file.text());
      if (parsed.rows.length > 10000) throw Error("单次最多导入 10,000 行");
      state.parsed = parsed;
      state.map = autoMap(parsed.headers);
      $("#mapping").innerHTML = mappingHTML();
    } catch (error) {
      toast(error.message);
    }
  });
}
function download(name, text, type = "text/plain") {
  const url = URL.createObjectURL(
    new Blob([text], { type: type + ";charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  let box = document.querySelector("#export-preview");
  if (!box) {
    box = document.createElement("dialog");
    box.id = "export-preview";
    document.body.append(box);
  }
  if (box.dataset.url) URL.revokeObjectURL(box.dataset.url);
  box.dataset.url = url;
  box.innerHTML = `<div class="panel-heading"><h2>导出文件已生成</h2><button id="close-export">关闭</button></div><p>${esc(name)} · 若浏览器未开始下载，可点击下方链接或复制内容保存。</p><a class="button primary" download="${esc(name)}" href="${esc(url)}">下载文件</a> <button id="copy-export">复制文件内容</button><label class="field" style="margin-top:20px"><span>文件内容预览</span><textarea readonly rows="12">${esc(text)}</textarea></label>`;
  box.querySelector("#close-export").onclick = () => box.close();
  box.querySelector("#copy-export").onclick = () => copy(text);
  if (!box.open) box.showModal();
  toast("文件已生成：" + name);
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("已复制到剪贴板");
  } catch {
    toast("浏览器不允许复制，请选中文本手动复制或导出。");
  }
}
document.addEventListener("input", (e) => {
  if (e.target.dataset.matrixRow !== undefined) {
    const r = state.results[active];
    r.tables[Number(e.target.dataset.matrixTable)].rows[
      Number(e.target.dataset.matrixRow)
    ][2] = e.target.value;
    r.edited = true;
  }
  if (e.target.matches("[data-section]")) {
    const r = state.results[active];
    r.sections[+e.target.dataset.section].text = e.target.value;
    r.edited = true;
  }
  if (e.target.id === "search") {
    state.query = e.target.value;
    if (active !== "home") {
      remember();
      navigate("home");
    } else $("#cards").innerHTML = cards();
  }
});
document.addEventListener("change", (e) => {
  if (e.target.dataset.map) state.map[e.target.dataset.map] = e.target.value;
  if (e.target.id === "matrix-audience" || e.target.id === "matrix-format") {
    state.matrixAudience = $("#matrix-audience").value;
    state.matrixFormat = $("#matrix-format").value;
    $("#tables").innerHTML = state.results[active].tables
      .map(tableHTML)
      .join("");
    mountAIResult(state.results[active], refreshResult, toast);
  }
});
document.addEventListener("click", (e) => {
  const target = e.target.closest("button,a");
  if (!target) return;
  const d = target.dataset;
  if (d.filter !== undefined) {
    state.group = Number(d.filter);
    document.querySelectorAll("[data-filter]").forEach(b=>{ const on=Number(b.dataset.filter)===state.group; b.classList.toggle("active",on); b.setAttribute("aria-pressed",String(on)); });
    $("#cards").innerHTML = cards();
  }
  if (d.copyRow !== undefined)
    copy(state.results[active].tables[+d.table].rows[+d.copyRow].join("\n"));
  if (d.openSaved !== undefined) {
    const r = structuredClone(state.saved[+d.openSaved]);
    state.results[r.tool] = r;
    state.drafts[r.tool] = r.input;
    navigate(r.tool);
  }
  if (d.exportSaved !== undefined)
    download(
      "shunshi-saved.json",
      JSON.stringify(state.saved[+d.exportSaved], null, 2),
      "application/json",
    );
  if (
    d.deleteSaved !== undefined &&
    confirm("删除这一份本地保存的结果？导出的副本不受影响。")
  ) {
    state.saved.splice(+d.deleteSaved, 1);
    persist();
    render();
  }
  if (!d.action) return;
  const r = state.results[active];
  switch (d.action) {
    case "example": {
      state.drafts[active] = defaults(active);
      if (active === "persona" && state.ctx.brand) {
        state.drafts.persona.audience = state.ctx.brand.audience;
        state.drafts.persona.difference = state.ctx.brand.position;
      }
      if (active === "sentiment") state.drafts[active].source = "虚构示例";
      if (["scv", "rfm", "dashboard"].includes(active)) {
        state.orders = sampleOrders();
        state.dataLabel = "虚构示例订单";
        state.parsed = null;
        state.map = null;
        state.importErrors = [];
        for (const id of ["scv", "rfm", "dashboard"]) delete state.results[id];
      }
      delete state.results[active];
      render();
      toast("已载入虚构示例，可修改后执行");
      break;
    }
    case "edit":
      $("#result textarea")?.focus();
      break;
    case "back-input":
      $("#input-panel").scrollIntoView({behavior:"smooth",block:"start"});
      $("#tool-form input, #tool-form textarea, #tool-form select")?.focus({preventScroll:true});
      break;
    case "restore-brand":
      state.ctx = structuredClone(persisted.ctx || {});
      toast(persisted.ctx ? "已载入本机品牌资料" : "本机暂无品牌资料");
      break;
    case "copy":
      copy(toMarkdown(r));
      break;
    case "save": {
      if (!confirm("将本次结果和当前品牌资料保存在这台设备？不上传服务器，可在「本机资料」清除。")) return;
      if (
        ["scv", "rfm", "dashboard"].includes(active) &&
        r.dataSource !== "虚构示例订单" &&
        !confirm(
          "这份报告可能包含会员邮箱等信息。确定保存在当前浏览器吗？请勿在共享设备保存真实客户信息。",
        )
      )
        return;
      const snap = structuredClone(r);
      if (["brand", "persona", "tov"].includes(active)) {
        state.ctx[active] = { ...r.input };
      }
      state.saved.unshift(snap);
      state.saved = state.saved.slice(0, 40);
      if (persist()) {
        nav();
        toast(
          "已保存到当前浏览器" +
            (["brand", "persona", "tov"].includes(active)
              ? "；下游复用执行时的结构化输入"
              : ""),
        );
        if (["brand", "persona", "tov"].includes(active)) render();
      }
      break;
    }
    case "md":
      download(active + ".md", toMarkdown(r), "text/markdown");
      break;
    case "json":
      download(
        active + ".json",
        JSON.stringify(r, null, 2),
        "application/json",
      );
      break;
    case "csv": {
      const tables = r.tables;
      const width = Math.max(...tables.map((t) => t.headers.length));
      const headers =
        tables.length === 1
          ? tables[0].headers
          : [
              "表名",
              "记录类型",
              ...Array.from({ length: width }, (_, i) => "列" + (i + 1)),
            ];
      const pad = (row) => [...row, ...Array(width - row.length).fill("")];
      const rows =
        tables.length === 1
          ? tables[0].rows
          : tables.flatMap((t) => [
              [t.title, "字段说明", ...pad(t.headers)],
              ...t.rows.map((row) => [t.title, "数据", ...pad(row)]),
            ]);
      download(active + ".csv", toCSV(headers, rows), "text/csv");
      break;
    }
    case "sample-csv": {
      const rows = sampleOrders(),
        headers = Object.keys(rows[0]);
      download(
        "shunshi-orders-example.csv",
        toCSV(
          headers,
          rows.map((o) => headers.map((h) => o[h])),
        ),
        "text/csv",
      );
      break;
    }
    case "import": {
      try {
        const v = importOrders(state.parsed, state.map);
        if (!v.orders.length)
          throw Error(
            "没有有效记录。" +
              v.errors
                .slice(0, 5)
                .map((e) => "第" + e.line + "行：" + e.reason)
                .join("；"),
          );
        state.orders = v.orders;
        state.importErrors = v.errors;
        state.dataLabel = "本地 CSV（" + v.orders.length + " 条有效）";
        $(".upload > strong").textContent = "订单数据 · " + state.dataLabel;
        $("#tool-form > p.source").textContent =
          "当前订单：" +
          state.orders.length +
          " 行。导入数据会在三个会员工具间复用。";
        for (const id of ["scv", "rfm", "dashboard"]) delete state.results[id];
        $("#import-status").innerHTML =
          `<div class="notice ${v.errors.length ? "error" : "blue"}">已载入 ${v.orders.length} 行；无效 ${v.errors.length} 行已跳过。请执行计算。${v.errors.length ? "<details><summary>查看全部无效记录原因</summary>" + v.errors.map((e) => `<p>第 ${e.line} 行：${esc(e.reason)}</p>`).join("") + "</details>" : ""}</div>`;
        $("#result").innerHTML = resultHTML(null);
        $("#result-kind").textContent = "数据已更新";
        toast("数据已供三个会员工具共用");
      } catch (error) {
        $("#import-status").innerHTML =
          '<div class="notice error">' + esc(error.message) + "</div>";
      }
      break;
    }
    case "clear-local":
      if (
        confirm(
          "清除当前站点保存的品牌、Persona、TOV 和全部结果？已经导出的文件不会删除。",
        )
      ) {
        try {
          localStorage.removeItem(KEY);
        } catch { toast("无法清除本机资料，请检查浏览器存储设置。"); break; }
        persisted = {};
        state.ctx = {};
        state.saved = [];
        state.drafts = {};
        state.results = {};
        render();
        toast("本地演示资料已清除，无法撤销；已导出的副本不受影响。");
      }
      break;
  }
});
window.addEventListener("hashchange", () => {
  remember();
  state.matrixAudience = "";
  state.matrixFormat = "";
  render();
  window.scrollTo(0, 0);
});
render();
if (navigator.modelContext?.registerTool) {
  try {
    navigator.modelContext.registerTool({
      name: "list_brand_tools",
      description: "List marketing demo tools. Read only.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(
              catalog.map((t) => ({ name: t.name, route: "#" + t.id })),
            ),
          },
        ],
      }),
    });
    navigator.modelContext.registerTool({
      name: "open_brand_tool",
      description: "Navigate to a tool, without generation or saving.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string", enum: catalog.map((t) => t.id) } },
        required: ["id"],
      },
      execute: async ({ id }) => {
        if (!byId[id]) throw Error("Unknown tool");
        navigate(id);
        return { content: [{ type: "text", text: "Opened " + byId[id].name }] };
      },
    });
  } catch (error) {
    console.info("Optional WebMCP unavailable:", error.message);
  }
}
