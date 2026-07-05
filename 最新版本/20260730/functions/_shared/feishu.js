import { businessIntentLabels, cooperationModeLabels, newMarketPlanLabels, selfCheckCatalog } from "./report.js";

const DEFAULT_FEISHU_BASE_URL = "https://open.feishu.cn";
const RETRY_DELAYS_MS = [300, 900];

export function hasFeishuConfig(env) {
  return Boolean(
    env.FEISHU_APP_ID
      && env.FEISHU_APP_SECRET
      && (
        (env.FEISHU_SUMMARY_DOC_TOKEN && env.FEISHU_DETAIL_DOC_TOKEN)
        || env.FEISHU_DOC_TOKEN
      ),
  );
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
  const summaryDocumentId = env.FEISHU_SUMMARY_DOC_TOKEN || env.FEISHU_DOC_TOKEN;
  const detailDocumentId = env.FEISHU_DETAIL_DOC_TOKEN || env.FEISHU_DOC_TOKEN;
  const summaryDocumentUrl = env.FEISHU_SUMMARY_DOC_URL || docxUrl(summaryDocumentId);
  const detailDocumentUrl = env.FEISHU_DETAIL_DOC_URL || docxUrl(detailDocumentId);

  try {
    const detail = await appendBlocksToDocument(baseUrl, accessToken, detailDocumentId, buildFeishuDetailBlocks(record), "Feishu detail append failed");
    const summary = await appendBlocksToDocument(baseUrl, accessToken, summaryDocumentId, buildFeishuSummaryBlocks(record), "Feishu summary append failed");

    return {
      provider: "feishu-doc",
      saved: true,
      mode: "fixed-docs-append",
      summaryDocumentId,
      summaryDocumentUrl,
      detailDocumentId,
      detailDocumentUrl,
      documentId: detailDocumentId,
      documentUrl: detailDocumentUrl,
      summaryBlocksCreated: summary.data?.children?.length || 0,
      detailBlocksCreated: detail.data?.children?.length || 0,
    };
  } catch (error) {
    throw new Error(`Feishu fixed docs append failed: ${error.message}`);
  }
}

async function createFeishuRecordDocument(baseUrl, accessToken, record, indexDocumentId) {
  const markdown = buildFeishuMarkdown(record);
  const fileName = `${safeFileName(record.submission?.companyName || "未命名企业")}-SHUNSE线上认知自测记录-${shortId(record.jobId)}.md`;
  const fileToken = await uploadMarkdownFile(baseUrl, accessToken, fileName, markdown);
  const imported = await importMarkdownAsDocx(baseUrl, accessToken, fileToken);

  return {
    provider: "feishu-doc",
    saved: true,
    mode: "markdown-import",
    documentId: imported.token,
    documentUrl: imported.url,
    indexDocumentId,
    fileToken,
    ticket: imported.ticket,
  };
}

async function uploadMarkdownFile(baseUrl, accessToken, fileName, markdown) {
  const bytes = new TextEncoder().encode(markdown);
  const formData = new FormData();
  formData.append("file_name", fileName);
  formData.append("parent_type", "explorer");
  formData.append("parent_node", "");
  formData.append("size", String(bytes.length));
  formData.append("file", new Blob([bytes], { type: "text/markdown; charset=utf-8" }), fileName);

  const data = await requestFeishuJson(`${baseUrl}/open-apis/drive/v1/files/upload_all`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  }, "Feishu markdown upload failed");

  if (!data.data?.file_token) throw new Error("Feishu markdown upload failed: empty file_token");
  return data.data.file_token;
}

async function importMarkdownAsDocx(baseUrl, accessToken, fileToken) {
  const task = await requestFeishuJson(`${baseUrl}/open-apis/drive/v1/import_tasks`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      file_extension: "md",
      file_token: fileToken,
      type: "docx",
      point: { mount_type: 1, mount_key: "" },
    }),
  }, "Feishu markdown import failed");

  const ticket = task.data?.ticket;
  if (!ticket) throw new Error("Feishu markdown import failed: empty ticket");

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await sleep(900 + attempt * 250);
    const status = await requestFeishuJson(`${baseUrl}/open-apis/drive/v1/import_tasks/${encodeURIComponent(ticket)}`, {
      headers: { authorization: `Bearer ${accessToken}` },
    }, "Feishu markdown import status failed");

    const result = status.data?.result || {};
    if (result.job_status === 0 && result.token) {
      return { ticket, token: result.token, url: result.url || "" };
    }
    if (result.job_status === 1) {
      throw new Error(result.job_error_msg || "Feishu markdown import failed");
    }
  }

  throw new Error("Feishu markdown import timed out");
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
  const data = await appendBlocksToDocument(baseUrl, accessToken, documentId, buildFeishuDetailBlocks(record), "Feishu append failed");

  return {
    provider: "feishu-doc",
    saved: true,
    mode: "docx-blocks",
    documentId,
    blocksCreated: data.data?.children?.length || 0,
  };
}

async function appendBlocksToDocument(baseUrl, accessToken, documentId, children, label) {
  const batches = chunk(children, 6);
  const created = [];
  let lastResponse = null;

  for (const batch of batches) {
    const index = await getAppendIndex(baseUrl, accessToken, documentId);
    const url = `${baseUrl}/open-apis/docx/v1/documents/${encodeURIComponent(
      documentId,
    )}/blocks/${encodeURIComponent(documentId)}/children?document_revision_id=-1`;

    lastResponse = await requestFeishuJson(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        index,
        children: batch,
      }),
    }, label);
    created.push(...(lastResponse.data?.children || []));
  }

  return {
    ...(lastResponse || { code: 0, msg: "success", data: {} }),
    data: {
      ...((lastResponse && lastResponse.data) || {}),
      children: created,
    },
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

function buildFeishuSummaryBlocks(record) {
  const summary = buildFeishuSummary(record);

  return [
    headingBlock(3, `${summary.createdAt}｜${summary.companyName}｜${summary.score}分`),
    textBlock(`| ${summary.createdAt} | ${summary.companyName} | ${summary.contactName} | ${summary.contactMethod} | ${summary.jobId} | ${summary.level} | ${summary.score} | ${summary.detailLocator} |`),
    textBlock(`客户：${summary.companyName}\n报告 ID：${summary.jobId}\n填写日期：${summary.createdAt}\n结果：${summary.level}\n评分：${summary.score}\n主诊断：${summary.firstPriority}\n详情定位：${summary.detailLocator}`),
    dividerBlock(),
  ];
}

function buildFeishuDetailBlocks(record) {
  const { title, customerLines, selfCheckLines, resultLines, report } = buildFeishuContent(record);

  return [
    headingBlock(2, title),
    headingBlock(3, "客户填写记录"),
    ...customerLines.map(textBlock),
    headingBlock(3, "自测选择记录"),
    ...selfCheckLines.map(textBlock),
    headingBlock(3, "测试结果记录"),
    ...resultLines.map(textBlock),
    headingBlock(3, "报告建议方向"),
    listTextBlock(report.recommendations),
    headingBlock(3, "下一步"),
    listTextBlock(report.nextSteps),
    headingBlock(3, "适合继续咨询的问题"),
    listTextBlock(report.consultingHooks),
    headingBlock(3, "会后建议补充材料"),
    listTextBlock(report.materialRequests),
    dividerBlock(),
  ];
}

function buildFeishuBlocks(record) {
  return buildFeishuDetailBlocks(record);
}

function buildFeishuXml(record) {
  const { title, customerLines, selfCheckLines, resultLines, report } = buildFeishuContent(record);
  return [
    `<h2>${escapeXml(title)}</h2>`,
    "<h3>客户填写记录</h3>",
    ...customerLines.map((line) => `<p>${escapeXml(line)}</p>`),
    "<h3>自测选择记录</h3>",
    ...selfCheckLines.map((line) => `<p>${escapeXml(line)}</p>`),
    "<h3>测试结果记录</h3>",
    ...resultLines.map((line) => `<p>${escapeXml(line)}</p>`),
    "<h3>报告建议方向</h3>",
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

function buildFeishuMarkdown(record) {
  const { title, customerLines, selfCheckLines, resultLines, report } = buildFeishuContent(record);
  return [
    `# ${title}`,
    "",
    "## 客户填写记录",
    ...customerLines.map((line) => `- ${line}`),
    "",
    "## 自测选择记录",
    ...selfCheckLines.map((line) => `- ${line}`),
    "",
    "## 测试结果记录",
    ...resultLines.map((line) => `- ${line}`),
    "",
    "## 报告建议方向",
    ...markdownList(report.recommendations),
    "",
    "## 下一步",
    ...markdownList(report.nextSteps),
    "",
    "## 适合继续咨询的问题",
    ...markdownList(report.consultingHooks),
    "",
    "## 会后建议补充材料",
    ...markdownList(report.materialRequests),
    "",
  ].join("\n");
}

function buildFeishuContent(record) {
  const submission = record.submission || {};
  const report = record.report || {};
  const metadata = report.metadata || {};
  const createdAt = formatDate(record.createdAt);
  const title = `${createdAt}｜${submission.companyName || "未命名企业"}｜${report.level || "待评估"}`;
  const customerLines = [
    fieldLine("报告编号", record.jobId),
    fieldLine("提交时间", createdAt),
    fieldLine("企业名称", submission.companyName),
    fieldLine("填写人", submission.contactName),
    fieldLine("职务", submission.contactRole),
    fieldLine("联系方式", submission.contactMethod),
    fieldLine("行业", submission.industry),
    fieldLine("城市 / 国家", submission.location),
    fieldLine("主营产品 / 服务 / 项目", submission.mainOffering),
    fieldLine("当前主要客户 / 用户 / 合作方", submission.currentCustomerTypes),
    fieldLine("当前主要获客 / 成交 / 触达方式", submission.acquisitionMethods),
    fieldLine("目前最想突破的经营目标", submission.businessGoal),
    fieldLine("经营意图", labelList(submission.businessIntentions, businessIntentLabels)),
    fieldLine("新市场计划", newMarketPlanLabels[submission.newMarketPlan] || submission.newMarketPlan),
    fieldLine("目标国家 / 地区", submission.targetMarkets),
    fieldLine("希望 SHUNSE 判断的问题", submission.shunseQuestion || submission.primaryProblem),
    fieldLine("希望 SHUNSE 参与的深度", labelList(submission.cooperationModes, cooperationModeLabels)),
    fieldLine("建议附带资料 / 链接", submission.supportingMaterials),
  ];

  const selfCheckLines = buildSelfCheckLines(submission, metadata);
  const resultLines = [
    fieldLine("报告分数", report.score ?? ""),
    fieldLine("报告等级", report.level),
    fieldLine("主诊断", metadata.firstPriority),
    fieldLine("次诊断", metadata.secondaryPriority),
    fieldLine("咨询信号", metadata.consultationSignal),
    fieldLine("自测标签分布", metadata.tagSummary),
    fieldLine("组合诊断", report.comboDiagnosis?.name),
    fieldLine("建议进入", report.servicePath?.enter),
    fieldLine("不建议先做", report.servicePath?.notFirst),
    fieldLine("大模型优化", metadata.llm?.optimized ? `已优化（${metadata.llm.model || "report-llm"}）` : metadata.llm?.fallback ? "失败后回退规则报告" : "未启用"),
    fieldLine("核心判断", report.executiveSummary),
  ];

  return { title, customerLines, selfCheckLines, resultLines, report };
}

function buildFeishuSummary(record) {
  const submission = record.submission || {};
  const report = record.report || {};
  const metadata = report.metadata || {};
  const createdAt = formatDate(record.createdAt);
  const jobId = record.jobId || "";

  return {
    createdAt,
    companyName: submission.companyName || "未命名企业",
    contactName: submission.contactName || "未填写",
    contactMethod: submission.contactMethod || "未填写",
    jobId,
    level: report.level || "待评估",
    score: report.score ?? "",
    firstPriority: metadata.firstPriority || "",
    detailLocator: `在详情记录文档搜索：${shortId(jobId)} / ${submission.companyName || "未命名企业"}`,
  };
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

function listTextBlock(items) {
  const values = Array.isArray(items) && items.length ? items : ["暂无"];
  return textBlock(values.map((item, index) => `${index + 1}. ${item}`).join("\n"));
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

function fieldLine(label, value) {
  const text = Array.isArray(value) ? value.filter(Boolean).join("、") : String(value ?? "").trim();
  return `${label}：${text || "未填写"}`;
}

function labelList(values, dictionary) {
  return Array.isArray(values) && values.length
    ? values.map((value) => dictionary[value] || value).filter(Boolean).join("、")
    : "";
}

function buildSelfCheckLines(submission, metadata) {
  const lines = [];
  for (let index = 1; index <= 10; index += 1) {
    const value = submission[`selfCheck${index}`];
    const item = selfCheckCatalog[value];
    if (!value && index === 10) {
      lines.push(`Q${index}：未填写（选填）`);
      continue;
    }
    if (!item) {
      lines.push(`Q${index}：${value || "未填写"}`);
      continue;
    }
    lines.push(`Q${index}｜${item.question}：${item.label}${item.tag ? `（标签 ${item.tag}）` : ""}`);
  }

  if (metadata.selfCheckChoices?.length) {
    lines.push(`规则摘要：${metadata.selfCheckChoices.join(" / ")}`);
  }

  return lines;
}

function markdownList(items) {
  const values = Array.isArray(items) && items.length ? items : ["暂无"];
  return values.map((item) => `- ${String(item || "").trim() || "暂无"}`);
}

function safeFileName(value) {
  return String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|#%{}[\]^~`]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 60) || "未命名企业";
}

function shortId(value) {
  return String(value || "").slice(0, 8) || String(Date.now()).slice(-8);
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function docxUrl(token) {
  return token ? `https://tcn9yblk27ey.feishu.cn/docx/${token}` : "";
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
