const DEFAULT_FEISHU_BASE_URL = "https://open.feishu.cn";

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
  const index = await getAppendIndex(baseUrl, accessToken, documentId);
  const url = `${baseUrl}/open-apis/docx/v1/documents/${encodeURIComponent(
    documentId,
  )}/blocks/${encodeURIComponent(documentId)}/children?document_revision_id=-1`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      index,
      children: buildFeishuBlocks(record),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code !== 0) {
    throw new Error(data.msg || `Feishu append failed with HTTP ${response.status}`);
  }

  return {
    provider: "feishu-doc",
    saved: true,
    documentId,
    blocksCreated: data.data?.children?.length || 0,
  };
}

async function getTenantAccessToken(baseUrl, env) {
  const response = await fetch(`${baseUrl}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      app_id: env.FEISHU_APP_ID,
      app_secret: env.FEISHU_APP_SECRET,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(data.msg || `Feishu token failed with HTTP ${response.status}`);
  }

  return data.tenant_access_token;
}

async function getAppendIndex(baseUrl, accessToken, documentId) {
  const url = `${baseUrl}/open-apis/docx/v1/documents/${encodeURIComponent(
    documentId,
  )}/blocks/${encodeURIComponent(documentId)}/children?page_size=500&document_revision_id=-1`;
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code !== 0) {
    throw new Error(data.msg || `Feishu block list failed with HTTP ${response.status}`);
  }

  return Array.isArray(data.data?.items) ? data.data.items.length : 0;
}

function buildFeishuBlocks(record) {
  const submission = record.submission || {};
  const report = record.report || {};
  const createdAt = formatDate(record.createdAt);
  const title = `${createdAt}｜${submission.companyName || "未命名企业"}｜${report.level || "待评估"}`;
  const lines = [
    `报告编号：${record.jobId}`,
    `企业：${submission.companyName || ""}`,
    `行业：${submission.industry || ""}`,
    `城市 / 国家：${submission.location || ""}`,
    `主营产品 / 服务：${submission.mainOffering || ""}`,
    `主要客户类型：${submission.currentCustomerTypes || ""}`,
    `联系人 / 职位：${submission.contactName || ""}`,
    `联系方式：${submission.contactMethod || ""}`,
    `是否出海：${submission.overseasNeed || ""}`,
    `目标市场：${submission.targetMarkets || ""}`,
    `核心问题：${submission.primaryProblem || ""}`,
    `90 天目标：${join(submission.expectedChanges)}`,
    `信任障碍：${join(submission.trustConcerns)}`,
    `品牌表达问题：${join(submission.brandIssues)}`,
    `内容问题：${join(submission.contentProblems)}`,
    `AI / 资料库状态：${join(submission.aiStatus)}`,
    `合作模式倾向：${join(submission.cooperationModes)}`,
    `报告分数：${report.score ?? ""}`,
    `报告等级：${report.level || ""}`,
    `核心判断：${report.executiveSummary || ""}`,
  ];

  return [
    headingBlock(2, title),
    textBlock(lines.join("\n")),
    headingBlock(3, "建议方向"),
    ...listBlocks(report.recommendations),
    headingBlock(3, "下一步"),
    ...listBlocks(report.nextSteps),
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
