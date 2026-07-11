const DEFAULT_FEISHU_BASE_URL = "https://open.feishu.cn";
const RETRY_DELAYS_MS = [300, 900];

export function hasSalonFeishuConfig(env) {
  return Boolean(
    env.FEISHU_APP_ID
      && env.FEISHU_APP_SECRET
      && (env.FEISHU_SALON_DOC_TOKEN || env.FEISHU_SUMMARY_DOC_TOKEN || env.FEISHU_DOC_TOKEN),
  );
}

export async function appendSalonRsvpToFeishu(env, record) {
  if (!hasSalonFeishuConfig(env)) {
    return {
      provider: "feishu-doc",
      saved: false,
      skipped: true,
      reason: "missing FEISHU_APP_ID, FEISHU_APP_SECRET, or FEISHU_SALON_DOC_TOKEN",
    };
  }

  const baseUrl = env.FEISHU_OPEN_BASE_URL || DEFAULT_FEISHU_BASE_URL;
  const accessToken = await getTenantAccessToken(baseUrl, env);
  const documentId = env.FEISHU_SALON_DOC_TOKEN || env.FEISHU_SUMMARY_DOC_TOKEN || env.FEISHU_DOC_TOKEN;
  const documentUrl = env.FEISHU_SALON_DOC_URL || docxUrl(documentId);
  const data = await appendBlocksToDocument(baseUrl, accessToken, documentId, buildSalonBlocks(record), "Feishu salon append failed");

  return {
    provider: "feishu-doc",
    saved: true,
    mode: env.FEISHU_SALON_DOC_TOKEN ? "salon-doc-append" : "fallback-summary-doc-append",
    documentId,
    documentUrl,
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

async function appendBlocksToDocument(baseUrl, accessToken, documentId, children, label) {
  const index = await getAppendIndex(baseUrl, accessToken, documentId);
  const url = `${baseUrl}/open-apis/docx/v1/documents/${encodeURIComponent(
    documentId,
  )}/blocks/${encodeURIComponent(documentId)}/children?document_revision_id=-1`;

  return requestFeishuJson(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ index, children }),
  }, label);
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

function buildSalonBlocks(record) {
  const submission = record.submission || {};
  const createdAt = formatDate(record.createdAt);
  const row = [
    createdAt,
    submission.name,
    submission.company,
    submission.role,
    submission.phone,
    submission.wechat,
    submission.status,
    record.rsvpId,
    submission.source,
  ].map(tableCell).join(" | ");

  return [
    headingBlock(3, `${createdAt}｜${submission.company || "未填写公司"}｜${submission.name || "未填写姓名"}`),
    textBlock(`| 填写时间 | 姓名 | 公司 | 职务 | 手机 | 微信 | 出席状态 | 记录 ID | 来源 |`),
    textBlock(`| ${row} |`),
    textBlock([
      fieldLine("活动", "云南企业新时代增长与品牌重构闭门论坛"),
      fieldLine("记录 ID", record.rsvpId),
      fieldLine("填写时间", createdAt),
      fieldLine("姓名", submission.name),
      fieldLine("公司", submission.company),
      fieldLine("职务", submission.role),
      fieldLine("手机", submission.phone),
      fieldLine("微信", submission.wechat),
      fieldLine("出席状态", submission.status),
      fieldLine("来源页面", submission.source),
      fieldLine("User Agent", submission.userAgent),
    ].join("\n")),
    dividerBlock(),
  ];
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

function fieldLine(label, value) {
  return `${label}：${String(value || "").trim() || "未填写"}`;
}

function tableCell(value) {
  return String(value || "未填写").replace(/\|/g, "/").replace(/\s+/g, " ").trim();
}

function docxUrl(token) {
  return token ? `https://tcn9yblk27ey.feishu.cn/docx/${token}` : "";
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  } catch {
    return value || "";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
