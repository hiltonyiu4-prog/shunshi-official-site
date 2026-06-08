const MARKER = "shunshi-diagnosis-record";

function githubHeaders(env) {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "content-type": "application/json",
    "user-agent": "shunshi-diagnosis-site",
    "x-github-api-version": "2022-11-28",
  };
}

export function hasGithubConfig(env) {
  return Boolean(env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO);
}

export function encodeRecord(record) {
  const bytes = new TextEncoder().encode(JSON.stringify(record));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function decodeRecord(encoded) {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function extractRecord(body = "") {
  const match = body.match(new RegExp(`<!-- ${MARKER}:([A-Za-z0-9+/=]+) -->`));
  return match ? decodeRecord(match[1]) : null;
}

export function buildIssueBody(record) {
  const submission = record.submission || {};
  const report = record.report || {};
  const metadata = report.metadata || {};

  return `<!-- ${MARKER}:${encodeRecord(record)} -->

# SHUNSE 企业线上认知自测线索

- 状态：${record.status}
- 企业：${submission.companyName || ""}
- 行业：${submission.industry || ""}
- 城市 / 国家：${submission.location || ""}
- 主营产品 / 服务：${submission.mainOffering || ""}
- 主要客户类型：${submission.currentCustomerTypes || ""}
- 主要获客 / 触达方式：${submission.acquisitionMethods || ""}
- 联系人：${[submission.contactName, submission.contactRole].filter(Boolean).join(" / ")}
- 联系方式：${submission.contactMethod || ""}
- 经营目标：${submission.businessGoal || ""}
- 经营意图：${list(metadata.businessIntentions) || list(submission.businessIntentions)}
- 新市场计划：${metadata.newMarketPlan || submission.newMarketPlan || ""}
- 目标市场：${submission.targetMarkets || ""}
- 提交时间：${record.createdAt}
- 更新时间：${record.updatedAt}

## 自测摘要

- 希望 SHUNSE 判断的问题：${submission.shunseQuestion || submission.primaryProblem || ""}
- 标签分布：${metadata.tagSummary || ""}
- 自测选择：${list(metadata.selfCheckChoices)}

## 报告摘要

- 标题：${report.title || ""}
- 分数：${report.score || ""}
- 等级：${report.level || ""}
- 主诊断：${metadata.firstPriority || ""}
- 次诊断：${metadata.secondaryPriority || ""}
- 咨询信号：${metadata.consultationSignal || ""}
- 组合诊断：${report.comboDiagnosis?.name || ""}
- 建议进入：${report.servicePath?.enter || ""}
- 大模型优化：${metadata.llm?.optimized ? "已优化" : metadata.llm?.fallback ? "失败后回退规则报告" : "未启用"}

${report.executiveSummary || ""}

## 会后跟进

- 适合继续咨询的问题：${list(report.consultingHooks)}
- 建议补充材料：${list(report.materialRequests)}
`;
}

function list(value) {
  return Array.isArray(value) && value.length ? value.join(", ") : "";
}

export async function createIssue(env, record) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/issues`;
  const titleCompany = record.submission?.companyName || "未命名企业";
  const response = await fetch(url, {
    method: "POST",
    headers: githubHeaders(env),
    body: JSON.stringify({
      title: `品牌诊断线索｜${titleCompany}｜${record.jobId.slice(0, 8)}`,
      body: buildIssueBody(record),
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitHub issue create failed: ${message}`);
  }

  return response.json();
}

export async function updateIssue(env, issueNumber, record) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/issues/${issueNumber}`;
  const titleCompany = record.submission?.companyName || "未命名企业";
  const response = await fetch(url, {
    method: "PATCH",
    headers: githubHeaders(env),
    body: JSON.stringify({
      title: `品牌诊断线索｜${titleCompany}｜${record.status}｜${record.jobId.slice(0, 8)}`,
      body: buildIssueBody(record),
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitHub issue update failed: ${message}`);
  }

  return response.json();
}

export async function getIssue(env, issueNumber) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/issues/${issueNumber}`;
  const response = await fetch(url, { headers: githubHeaders(env) });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitHub issue read failed: ${message}`);
  }

  return response.json();
}

export async function findIssueByJobId(env, jobId) {
  const query = encodeURIComponent(`repo:${env.GITHUB_OWNER}/${env.GITHUB_REPO} ${jobId} in:body`);
  const url = `https://api.github.com/search/issues?q=${query}&per_page=1`;
  const response = await fetch(url, { headers: githubHeaders(env) });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitHub issue search failed: ${message}`);
  }

  const data = await response.json();
  return data.items?.[0] || null;
}
