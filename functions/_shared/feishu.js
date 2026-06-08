const DEFAULT_FEISHU_BASE_URL = "https://open.feishu.cn";
const RETRY_DELAYS_MS = [300, 900];

export function hasFeishuConfig(env) {
  return Boolean(env.FEISHU_APP_ID && env.FEISHU_APP_SECRET && env.FEISHU_DOC_TOKEN);
}

export async function appendSubmissionToFeishu(env, record) {
  if (!hasFeishuConfig(env)) {
    return {
      provider: "feishu-doc",
      saved: false,
      skipped: true,
      reason: "missing FEISHU_APP_ID, FEISHU_APP_SECRET, or FEISHU_DOC_TOKEN",
    };
  }

  const baseUrl = env.FEISHU_OPEN_BASE_URL || DEFAULT_FEISHU_BASE_URL;
  const accessToken = await getTenantAccessToken(baseUrl, env);
  const documentId = env.FEISHU_DOC_TOKEN;

  try {
    const data = await appendSubmissionWithDocsAi(baseUrl, accessToken, documentId, record);
    return {
      provider: "feishu-doc",
      saved: true,
      mode: "docs-ai",
      documentId,
      revisionId: data.data?.revision_id,
    };
  } catch (primaryError) {
    const fallback = await appendSubmissionWithDocxBlocks(baseUrl, accessToken, documentId, record).catch((fallbackError) => {
      throw new Error(`${primaryError.message}; fallback failed: ${fallbackError.message}`);
    });
    return fallback;
  }
}

async function appendSubmissionWithDocsAi(baseUrl, accessToken, documentId, record) {
  const url = `${baseUrl}/open-apis/docs_ai/v1/documents/${encodeURIComponent(documentId)}`;
  return requestFeishuJson(url, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      block_id: "-1",
      command: "block_insert_after",
      content: buildFeishuXml(record),
      format: "xml",
      revision_id: -1,
    }),
  }, "Feishu docs_ai append failed");
}

async function appendSubmissionWithDocxBlocks(baseUrl, accessToken, documentId, record) {
  const index = await getAppendIndex(baseUrl, accessToken, documentId);
  const url = `${baseUrl}/open-apis/docx/v1/documents/${encodeURIComponent(
    documentId,
  )}/blocks/${encodeURIComponent(documentId)}/children?document_revision_id=-1`;

  const data = await requestFeishuJson(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      index,
      children: buildFeishuBlocks(record),
    }),
  }, "Feishu append failed");

  return {
    provider: "feishu-doc",
    saved: true,
    documentId,
    blocksCreated: data.data?.children?.length || 0,
  };
}

async function getTenantAccessToken(baseUrl, env) {
  const data = await requestFeishuJson(`${baseUrl}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      app_id: env.FEISHU_APP_ID,
      app_secret: env.FEISHU_APP_SECRET,
    }),
  }, "Feishu token failed");

  if (!data.tenant_access_token) throw new Error("Feishu token failed: empty tenant_access_token");

  return data.tenant_access_token;
}

async function getAppendIndex(baseUrl, accessToken, documentId) {
  const url = `${baseUrl}/open-apis/docx/v1/documents/${encodeURIComponent(
    documentId,
  )}/blocks/${encodeURIComponent(documentId)}/children?page_size=500&document_revision_id=-1`;
  const data = await requestFeishuJson(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  }, "Feishu block list failed");

  return Array.isArray(data.data?.items) ? data.data.items.length : 0;
}

async function requestFeishuJson(url, options, label) {
  let lastError = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.code === 0) return data;

    const message = data.msg || `${label} with HTTP ${response.status}`;
    lastError = new Error(message);
    if (!shouldRetryFeishu(response.status, data, message) || attempt === RETRY_DELAYS_MS.length) {
      throw lastError;
    }

    await sleep(RETRY_DELAYS_MS[attempt]);
  }

  throw lastError || new Error(label);
}

function shouldRetryFeishu(status, data, message) {
  if ([429, 500, 502, 503, 504].includes(status)) return true;
  const text = `${data?.code || ""} ${message || ""}`.toLowerCase();
  return text.includes("frequency") || text.includes("too many") || text.includes("rate limit");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildFeishuBlocks(record) {
  const submission = record.submission || {};
  const report = record.report || {};
  const metadata = report.metadata || {};
  const createdAt = formatDate(record.createdAt);
  const title = `${createdAt}｜${submission.companyName || "未命名企业"}｜${report.level || "待评估"}`;
  const lines = [
    `报告编号：${record.jobId}`,
    `企业：${submission.companyName || ""}`,
    `行业：${submission.industry || ""}`,
    `城市 / 国家：${submission.location || ""}`,
    `主营产品 / 服务：${submission.mainOffering || ""}`,
    `主要客户类型：${submission.currentCustomerTypes || ""}`,
    `当前主要获客 / 触达方式：${submission.acquisitionMethods || ""}`,
    `联系人 / 职位：${[submission.contactName, submission.contactRole].filter(Boolean).join(" / ")}`,
    `联系方式：${submission.contactMethod || ""}`,
    `经营目标：${submission.businessGoal || ""}`,
    `经营意图：${join(metadata.businessIntentions) || join(submission.businessIntentions)}`,
    `新市场计划：${metadata.newMarketPlan || submission.newMarketPlan || ""}`,
    `目标市场：${submission.targetMarkets || ""}`,
    `希望 SHUNSE 判断的问题：${submission.shunseQuestion || submission.primaryProblem || ""}`,
    `自测标签分布：${metadata.tagSummary || ""}`,
    `自测选择摘要：${join(metadata.selfCheckChoices)}`,
    `合作模式倾向：${join(submission.cooperationModes)}`,
    `报告分数：${report.score ?? ""}`,
    `报告等级：${report.level || ""}`,
    `主诊断：${metadata.firstPriority || ""}`,
    `次诊断：${metadata.secondaryPriority || ""}`,
    `咨询信号：${metadata.consultationSignal || ""}`,
    `组合诊断：${report.comboDiagnosis?.name || ""}`,
    `建议进入：${report.servicePath?.enter || ""}`,
    `大模型优化：${metadata.llm?.optimized ? "已优化" : metadata.llm?.fallback ? "失败后回退规则报告" : "未启用"}`,
    `核心判断：${report.executiveSummary || ""}`,
  ];

  return [
    headingBlock(2, title),
    textBlock(lines.join("\n")),
    headingBlock(3, "建议方向"),
    ...listBlocks(report.recommendations),
    headingBlock(3, "下一步"),
    ...listBlocks(report.nextSteps),
    headingBlock(3, "适合继续咨询的问题"),
    ...listBlocks(report.consultingHooks),
    headingBlock(3, "会后建议补充材料"),
    ...listBlocks(report.materialRequests),
    dividerBlock(),
  ];
}

function buildFeishuXml(record) {
  const { title, lines, report } = buildFeishuContent(record);
  return [
    `<h2>${escapeXml(title)}</h2>`,
    `<p>${lines.map(escapeXml).join("<br/>")}</p>`,
    "<h3>建议方向</h3>",
    listXml(report.recommendations),
    "<h3>下一步</h3>",
    listXml(report.nextSteps),
    "<h3>适合继续咨询的问题</h3>",
    listXml(report.consultingHooks),
    "<h3>会后建议补充材料</h3>",
    listXml(report.materialRequests),
    "<p>---</p>",
  ].join("");
}

function buildFeishuContent(record) {
  const submission = record.submission || {};
  const report = record.report || {};
  const metadata = report.metadata || {};
  const createdAt = formatDate(record.createdAt);
  const title = `${createdAt}｜${submission.companyName || "未命名企业"}｜${report.level || "待评估"}`;
  const lines = [
    `报告编号：${record.jobId}`,
    `企业：${submission.companyName || ""}`,
    `行业：${submission.industry || ""}`,
    `城市 / 国家：${submission.location || ""}`,
    `主营产品 / 服务：${submission.mainOffering || ""}`,
    `主要客户类型：${submission.currentCustomerTypes || ""}`,
    `当前主要获客 / 触达方式：${submission.acquisitionMethods || ""}`,
    `联系人 / 职位：${[submission.contactName, submission.contactRole].filter(Boolean).join(" / ")}`,
    `联系方式：${submission.contactMethod || ""}`,
    `经营目标：${submission.businessGoal || ""}`,
    `经营意图：${join(metadata.businessIntentions) || join(submission.businessIntentions)}`,
    `新市场计划：${metadata.newMarketPlan || submission.newMarketPlan || ""}`,
    `目标市场：${submission.targetMarkets || ""}`,
    `希望 SHUNSE 判断的问题：${submission.shunseQuestion || submission.primaryProblem || ""}`,
    `自测标签分布：${metadata.tagSummary || ""}`,
    `自测选择摘要：${join(metadata.selfCheckChoices)}`,
    `合作模式倾向：${join(submission.cooperationModes)}`,
    `报告分数：${report.score ?? ""}`,
    `报告等级：${report.level || ""}`,
    `主诊断：${metadata.firstPriority || ""}`,
    `次诊断：${metadata.secondaryPriority || ""}`,
    `咨询信号：${metadata.consultationSignal || ""}`,
    `组合诊断：${report.comboDiagnosis?.name || ""}`,
    `建议进入：${report.servicePath?.enter || ""}`,
    `大模型优化：${metadata.llm?.optimized ? "已优化" : metadata.llm?.fallback ? "失败后回退规则报告" : "未启用"}`,
    `核心判断：${report.executiveSummary || ""}`,
  ];

  return { title, lines, report };
}

function headingBlock(level, content) {
  const key = `heading${level}`;
  return {
    block_type: level + 2,
    [key]: {
      elements: [textRun(content)],
      style: {},
    },
  };
}

function textBlock(content) {
  return {
    block_type: 2,
    text: {
      elements: [textRun(content)],
      style: {},
    },
  };
}

function bulletBlock(content) {
  return {
    block_type: 12,
    bullet: {
      elements: [textRun(content)],
      style: {},
    },
  };
}

function dividerBlock() {
  return { block_type: 22, divider: {} };
}

function textRun(content) {
  return {
    text_run: {
      content: String(content || "").slice(0, 5000),
      text_element_style: {},
    },
  };
}

function listBlocks(items) {
  return Array.isArray(items) && items.length
    ? items.map((item) => bulletBlock(item))
    : [bulletBlock("暂无")];
}

function listXml(items) {
  const values = Array.isArray(items) && items.length ? items : ["暂无"];
  return `<ul>${values.map((item) => `<li>${escapeXml(item)}</li>`).join("")}</ul>`;
}

function escapeXml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function join(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  } catch {
    return value || "";
  }
}
