const TOOLS = ["copy", "social", "matrix"];
const policy = {
 persona:"规则模拟 · 非真实调研", brand:"本次会话内复用 · 不调用 AI", tov:"规则模拟 · 可编辑",
 kpi:"真实计算 · 不调用 AI", roas:"真实计算 · 不调用 AI", diagnose:"规则健检 · 结论需验证",
 competitor:"模拟对比 · 非实时监控", sentiment:"关键词规则 · 非 AI 语义分析", radar:"模拟趋势 · 非实时监测",
 scv:"本地计算 · 订单不上传", rfm:"本地计算 · 订单不上传", dashboard:"本地计算 · 订单不上传",
};
let status = { ready: false, message: "正在检查服务连接…" },
  csrf = "",
  loaded = false;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export async function loadAIStatus() {
  try {
    const res = await fetch("/api/ai/status", { cache: "no-store" });
    if (
      !res.ok ||
      !res.headers.get("content-type")?.includes("application/json")
    )
      throw Error();
    const data = await res.json();
    csrf = data.csrf || "";
    status = data;
  } catch {
    status = {
      ready: false,
      message:
        "AI 尚未连接，可先体验规则演示。",
    };
  }
  loaded = true;
  return status;
}
export function mountAI(id) {
  document.querySelector("#ai-controls")?.remove();
  const form = document.querySelector("#tool-form");
  if (!form) return;
  const box = document.createElement("div");
  box.id = "ai-controls";
  box.className = "notice blue";
  if (!TOOLS.includes(id)) {
    box.textContent = policy[id] || "本地处理";
    form.prepend(box);
    return;
  }
  box.innerHTML = `<label class="field"><span>生成方式</span><select id="ai-mode"><option value="local">规则演示</option><option value="ai" ${status.ready ? "" : "disabled"}>DeepSeek AI</option></select></label><p class="source">${status.ready ? "AI 已连接，仅点击生成时调用。" : esc(status.message)}</p><div id="ai-consent-wrap" hidden><label class="data-choice"><input type="checkbox" id="ai-consent"><span>将本次品牌与产品资料交给 DeepSeek 生成，不含会员订单。</span></label></div>`;
  form.prepend(box);
  box.querySelector("#ai-mode").onchange = (e) => {
    box.querySelector("#ai-consent-wrap").hidden = e.target.value !== "ai";
    form.querySelector("#run").textContent =
      e.target.value === "ai" ? "生成 AI 内容 ↗" : "生成规则演示 ↗";
  };
  if (!loaded)
    loadAIStatus().then(() => {
      if (document.querySelector("#ai-controls") === box) mountAI(id);
    });
}
async function requestAI(payload) {
  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf, "X-Requested-With": "SHUNSE" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(55000),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw Error("AI 服务不可用；未切换成模拟结果。");
  }
  if (!res.ok) throw Error(data.error || "生成失败，未自动重试");
  if (data.source !== "live-ai")
    throw Error("服务返回的结果来源异常，已拒绝展示");
  if (data.status) {
    status = data.status;
    const meter = document.querySelector("#ai-controls small");
    if (meter)
      meter.textContent = `本月调用 ${status.calls}/${status.callLimit}；记账估算 ${status.accountedCost}/${status.budget} ${status.currency}。内容不写入后台历史，不自动重试。`;
  }
  return data;
}
function stamp(r, a, scope = "full") {
  r.ai = {
    model: a.model,
    cacheHit: a.cacheHit,
    usage: a.usage,
    estimatedCost: a.estimatedCost,
    chargedThisRequest: a.chargedThisRequest,
    generatedAt: a.generatedAt,
    scope,
    revision: a.revision,
  };
  r.kind =
    scope === "full"
      ? "真实 AI 内容 + 本地结构"
      : "混合结果 · 部分单元由 AI 生成";
  r.source = "live-ai";
}
export function readAIChoice() {
  return {
    mode: document.querySelector("#ai-mode")?.value,
    consent: !!document.querySelector("#ai-consent")?.checked,
  };
}
export async function enhanceWithAI(id, v, context, r, choice) {
  if (choice.mode !== "ai") return r;
  if (!status.ready) throw Error("真实 AI 尚未启用");
  if (!choice.consent) throw Error("请先确认本次向模型发送品牌与产品资料。");
  const a = await requestAI({ tool: id, input: v, context, scope: "full" });
  if (id === "matrix") {
    for (const item of a.items) r.tables[0].rows[item.index][2] = item.text;
    r.aiCells = Object.fromEntries(
      a.items.map((i) => [i.index, a.generatedAt]),
    );
  } else {
    r.sections[0].text = a.text;
    r.sections[r.sections.length - 1].text =
      "以上文案由已配置的模型生成，产品事实仍来自输入。请人工核验功效、价格、资质、品牌禁用词与发布规范；其他说明由本地规则整理。";
  }
  stamp(r, a);
  return r;
}
export function mountAIResult(r, update, onError) {
  if (!r) return;
  const result = document.querySelector("#result");
  result.querySelectorAll("[data-ai-note]").forEach((el) => el.remove());
  if (r.ai) {
    const note = document.createElement("div");
    note.className = "notice blue";
    note.dataset.aiNote = "true";
    note.textContent = `AI 来源：${r.ai.model} · ${r.ai.cacheHit ? "命中已有结果，本次无模型调用" : "本次实际请求模型"} · 本次记账估算 ${r.ai.chargedThisRequest} ${status.currency || ""}。${r.ai.scope === "cell" ? "只更新指定单元，其余内容保留原样。" : ""} 费用以服务商账单为准。`;
    result.prepend(note);
  }
  if (r.tool !== "matrix" || !status.ready) return;
  for (const copyButton of result.querySelectorAll("[data-copy-row]")) {
    const index = Number(copyButton.dataset.copyRow);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = r.aiCells?.[index] ? "AI 改写此项" : "AI 生成此项";
    button.style.marginTop = "8px";
    button.onclick = async () => {
      const direction = prompt(
        "填写此项的改写方向（最多300字）。继续即允许将此矩阵的品牌、产品和所选单元资料发送至已配置的模型。只改写此项，不修改其他内容。",
        "更具体地描述使用场景",
      );
      if (direction === null) return;
      button.disabled = true;
      button.textContent = "正在生成…";
      try {
        const a = await requestAI({
          tool: "matrix",
          input: r.input,
          context: r.contextSnapshot || {},
          scope: "cell",
          cell: { index },
          direction: direction.slice(0, 300),
        });
        r.tables[0].rows[index][2] = a.items[0].text;
        r.aiCells = { ...r.aiCells, [index]: a.generatedAt };
        stamp(r, a, "cell");
        if (document.querySelector("#result") === result) update();
      } catch (e) {
        onError(e.message);
        button.disabled = false;
        button.textContent = "AI 生成此项";
      }
    };
    copyButton.parentElement.append(button);
  }
}
