import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const baseUrl = process.env.PUBLIC_BASE_URL || "https://shun-se.com";
const artifactDir = process.env.TEST_ARTIFACT_DIR || "test-artifacts";
const startedAt = new Date();

const results = {
  startedAt: startedAt.toISOString(),
  baseUrl,
  checks: [],
};

await mkdir(artifactDir, { recursive: true });

await runCheck("diagnosis_page_head", async () => {
  const response = await fetch(`${baseUrl}/diagnosis/`, { method: "HEAD" });
  return {
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get("content-type"),
  };
});

await runCheck("api_health", async () => {
  const response = await fetch(`${baseUrl}/api/diagnosis`);
  const data = await response.json();
  return { ok: response.ok && data.ok, status: response.status, data };
});

await runCheck("api_submit_single", async () => {
  const response = await fetch(`${baseUrl}/api/diagnosis`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(makePayload("单次公网测试企业")),
  });
  const data = await response.json();
  return summarizeApiResponse(response, data);
});

await runCheck("browser_mobile_form_pdf", async () => runBrowserFlow());

await runCheck("api_submit_10_concurrent", async () => {
  const started = Date.now();
  const responses = await Promise.all(
    Array.from({ length: 10 }, (_, index) => submitPayload(`并发测试企业 ${index + 1}`)),
  );
  const elapsedMs = Date.now() - started;
  const okCount = responses.filter((item) => item.ok).length;
  const statuses = responses.map((item) => item.status);
  const durations = responses.map((item) => item.elapsedMs).sort((a, b) => a - b);
  return {
    ok: okCount === 10,
    okCount,
    total: responses.length,
    elapsedMs,
    statuses,
    minMs: durations[0],
    medianMs: durations[Math.floor(durations.length / 2)],
    maxMs: durations[durations.length - 1],
    llmStates: responses.map((item) => item.llm),
    feishuStates: responses.map((item) => item.feishu),
  };
});

results.finishedAt = new Date().toISOString();
results.ok = results.checks.every((check) => check.ok);

const stamp = startedAt.toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
const jsonPath = `${artifactDir}/public-test-${stamp}.json`;
const markdownPath = `${artifactDir}/public-test-${stamp}.md`;
await writeFile(jsonPath, JSON.stringify(results, null, 2));
await writeFile(markdownPath, renderMarkdown(results));
await writeFile(`${artifactDir}/latest-public-test.json`, JSON.stringify(results, null, 2));
await writeFile(`${artifactDir}/latest-public-test.md`, renderMarkdown(results));

console.log(JSON.stringify({ ok: results.ok, jsonPath, markdownPath }, null, 2));

async function runCheck(name, fn) {
  const started = Date.now();
  try {
    const result = await fn();
    results.checks.push({
      name,
      ok: Boolean(result.ok),
      elapsedMs: Date.now() - started,
      ...result,
    });
  } catch (error) {
    results.checks.push({
      name,
      ok: false,
      elapsedMs: Date.now() - started,
      error: error.message || String(error),
    });
  }
}

async function submitPayload(companyName) {
  const started = Date.now();
  const response = await fetch(`${baseUrl}/api/diagnosis`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(makePayload(companyName)),
  });
  const data = await response.json();
  return {
    elapsedMs: Date.now() - started,
    ...summarizeApiResponse(response, data),
  };
}

function summarizeApiResponse(response, data) {
  return {
    ok: response.ok && data.ok && Boolean(data.report),
    status: response.status,
    jobId: data.jobId,
    reportTitle: data.report?.title,
    score: data.report?.score,
    primary: data.report?.analysisSummary?.[0]?.value,
    combo: data.report?.comboDiagnosis?.name,
    enter: data.report?.servicePath?.enter,
    llm: data.report?.metadata?.llm || null,
    feishu: data.integrations?.feishu || null,
  };
}

async function runBrowserFlow() {
  const require = createRequire(import.meta.url);
  const { chromium } = require("/Users/hilton/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 900 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(`${baseUrl}/diagnosis/`, { waitUntil: "networkidle", timeout: 45000 });
  await page.fill('input[name="companyName"]', "浏览器公网测试企业");
  await page.fill('input[name="contactName"]', "测试人");
  await page.fill('input[name="contactMethod"]', "test@example.com");
  await page.fill('textarea[name="businessGoal"]', "希望通过线上认知诊断带来更多咨询。");
  await page.click("#nextStepButton");
  await page.check('input[name="businessIntentions"][value="intent-a"]');
  await page.check('input[name="businessIntentions"][value="intent-d"]');
  await page.click("#nextStepButton");
  for (const [name, value] of [
    ["selfCheck1", "q1-c"],
    ["selfCheck2", "q2-d"],
    ["selfCheck3", "q3-c"],
    ["selfCheck4", "q4-d"],
  ]) {
    await page.check(`input[name="${name}"][value="${value}"]`);
  }
  await page.click("#nextStepButton");
  for (const [name, value] of [
    ["selfCheck5", "q5-d"],
    ["selfCheck6", "q6-b"],
    ["selfCheck7", "q7-d"],
    ["selfCheck8", "q8-c"],
  ]) {
    await page.check(`input[name="${name}"][value="${value}"]`);
  }
  await page.click("#nextStepButton");
  for (const [name, value] of [
    ["selfCheck9", "q9-a"],
    ["selfCheck10", "q10-c"],
  ]) {
    await page.check(`input[name="${name}"][value="${value}"]`);
  }
  await page.check('input[name="cooperationModes"][value="need-shunse-judge"]');

  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/diagnosis") && response.request().method() === "POST",
    { timeout: 60000 },
  );
  await page.click("#submitButton");
  const response = await responsePromise;
  const data = await response.json();
  await page.waitForSelector(".report-cover", { timeout: 60000 });
  const text = await page.locator("#reportView").innerText();
  const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
  await page.click("#downloadButton");
  const download = await downloadPromise;
  const metrics = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  await page.screenshot({ path: `${artifactDir}/latest-browser-mobile.png`, fullPage: true });
  await browser.close();

  return {
    ok:
      response.ok() &&
      data.ok &&
      text.includes("组合诊断") &&
      text.includes("建议服务路径") &&
      download.suggestedFilename().endsWith(".pdf") &&
      metrics.width <= metrics.inner + 1 &&
      errors.length === 0,
    status: response.status(),
    jobId: data.jobId,
    downloadName: download.suggestedFilename(),
    rendered: {
      combo: text.includes("组合诊断"),
      servicePath: text.includes("建议服务路径"),
      pdfBadge: text.includes("DeepSeek 已优化终版") || text.includes("规则报告终版"),
    },
    horizontalOverflow: metrics.width > metrics.inner + 1,
    errors,
    llm: data.report?.metadata?.llm || null,
    feishu: data.integrations?.feishu || null,
  };
}

function makePayload(companyName) {
  return {
    companyName,
    industry: "文旅 / 消费品牌",
    location: "云南 / 中国",
    mainOffering: "高山食材礼盒与体验空间",
    currentCustomerTypes: "外地游客、企业礼赠客户",
    contactName: "测试人",
    contactRole: "创始人",
    contactMethod: "test@example.com",
    acquisitionMethods: "熟人介绍、小红书、线下活动",
    businessGoal: "希望通过线上认知诊断带来更多咨询。",
    businessIntentions: ["intent-a", "intent-d"],
    newMarketPlan: "new-city",
    targetMarkets: "上海、深圳",
    shunseQuestion: "我们应该先补品牌表达、信任证据，还是销售承接？",
    selfCheck1: "q1-c",
    selfCheck2: "q2-d",
    selfCheck3: "q3-c",
    selfCheck4: "q4-d",
    selfCheck5: "q5-d",
    selfCheck6: "q6-b",
    selfCheck7: "q7-d",
    selfCheck8: "q8-c",
    selfCheck9: "q9-a",
    selfCheck10: "q10-c",
    cooperationModes: ["need-shunse-judge"],
  };
}

function renderMarkdown(data) {
  const lines = [
    "# SHUNSE 诊断页公网测试报告",
    "",
    `- 时间：${data.startedAt} - ${data.finishedAt}`,
    `- 目标：${data.baseUrl}`,
    `- 总结果：${data.ok ? "通过" : "未通过"}`,
    "",
    "## 检查项",
    "",
  ];

  for (const check of data.checks) {
    lines.push(`### ${check.ok ? "通过" : "失败"} ${check.name}`);
    lines.push("");
    lines.push(`- 耗时：${check.elapsedMs} ms`);
    if (check.status) lines.push(`- HTTP：${check.status}`);
    if (check.jobId) lines.push(`- Job ID：${check.jobId}`);
    if (check.reportTitle) lines.push(`- 报告：${check.reportTitle}`);
    if (check.primary) lines.push(`- 主诊断：${check.primary}`);
    if (check.combo) lines.push(`- 组合诊断：${check.combo}`);
    if (check.enter) lines.push(`- 建议进入：${check.enter}`);
    if (check.downloadName) lines.push(`- PDF：${check.downloadName}`);
    if (check.okCount !== undefined) {
      lines.push(`- 并发成功：${check.okCount}/${check.total}`);
      lines.push(`- 并发总耗时：${check.elapsedMs} ms`);
      lines.push(`- 单请求 min/median/max：${check.minMs}/${check.medianMs}/${check.maxMs} ms`);
    }
    if (check.llm) lines.push(`- LLM：${JSON.stringify(check.llm)}`);
    if (check.feishu) lines.push(`- 飞书：${JSON.stringify(check.feishu)}`);
    if (check.error) lines.push(`- 错误：${check.error}`);
    lines.push("");
  }

  lines.push("## 结论");
  lines.push("");
  lines.push(data.ok ? "公网诊断链路可用；当前 Cloudflare 未配置 DeepSeek API Key 时走规则报告终版回退。" : "存在失败项，需先修复后再进入沙龙使用。");
  lines.push("");
  return `${lines.join("\n")}\n`;
}
