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
  const quickProblems = list(submission.quickProblems);
  const expectedChanges = list(submission.expectedChanges);
  const trustConcerns = list(submission.trustConcerns);
  const brandIssues = list(submission.brandIssues);
  const contentProblems = list(submission.contentProblems);

  return `<!-- ${MARKER}:${encodeRecord(record)} -->

# SHUNSE 甲方需求诊断线索

- 状态：${record.status}
- 企业：${submission.companyName || ""}
- 行业：${submission.industry || ""}
- 城市 / 国家：${submission.location || ""}
- 主营产品 / 服务：${submission.mainOffering || ""}
- 主要客户类型：${submission.currentCustomerTypes || ""}
- 联系人：${submission.contactName || ""}
- 联系方式：${submission.contactMethod || ""}
- 是否出海：${submission.overseasNeed || ""}
- 目标市场：${submission.targetMarkets || ""}
- 提交时间：${record.createdAt}
- 更新时间：${record.updatedAt}

## 需求摘要

- 只解决一个问题：${submission.primaryProblem || ""}
- 可选问题：${quickProblems}
- 90 天目标：${expectedChanges}
- 信任障碍：${trustConcerns}
- 品牌表达问题：${brandIssues}
- 内容问题：${contentProblems}

## 报告摘要

- 标题：${report.title || ""}
- 分数：${report.score || ""}
- 等级：${report.level || ""}

${report.executiveSummary || ""}
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
