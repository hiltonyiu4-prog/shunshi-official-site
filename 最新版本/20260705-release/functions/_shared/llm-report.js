const DEFAULT_LLM_BASE_URL = "https://ark.cn-beijing.volces.com/api/coding/v3";
const DEFAULT_LLM_MODEL = "deepseek-v4-pro";
const LLM_TIMEOUT_MS = 25000;

export function hasReportLlmConfig(env) {
  return Boolean(env.DEEPSEEK_API_KEY || env.REPORT_LLM_API_KEY);
}

export async function optimizeReportWithLlm({ env, jobId, submission, baseReport }) {
  if (!hasReportLlmConfig(env)) {
    return markLlmState(baseReport, {
      optimized: false,
      skipped: true,
      reason: "missing DEEPSEEK_API_KEY or REPORT_LLM_API_KEY",
    });
  }

  try {
    const optimized = await callReportLlm({ env, jobId, submission, baseReport });
    return mergeOptimizedReport(baseReport, optimized, {
      optimized: true,
      provider: "report-llm",
      model: getLlmModel(env),
    });
  } catch (error) {
    return markLlmState(baseReport, {
      optimized: false,
      fallback: true,
      error: error.message || "LLM optimization failed",
    });
  }
}

async function callReportLlm({ env, jobId, submission, baseReport }) {
  return requestReportLlm({ env, jobId, submission, baseReport });
}

async function requestReportLlm({ env, jobId, submission, baseReport }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), LLM_TIMEOUT_MS);
  const requestBody = {
    model: getLlmModel(env),
    temperature: 0.35,
    max_tokens: 1800,
    thinking: { type: "disabled" },
    messages: [
      {
        role: "system",
        content: [
          "你是 SHUNSE 顺世的沙龙现场诊断顾问。",
          "你的目标不是写完整咨询报告，而是把规则诊断初稿压缩成企业主 30 秒能看懂的诊断小票。",
          "不要夸大承诺，不要编造企业事实，不要新增不存在的数据。",
          "用大白话，少讲概念。像顾问当面说话：说中问题，告诉他先做什么，再引导会后咨询。",
          "只输出一个 JSON 对象，不要 Markdown，不要解释。",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "请基于 brief 做沙龙现场短诊断，只返回需要覆盖的字段，不要返回完整原报告。目标是短、直白、能带来咨询意愿。请只返回 JSON。",
          jsonShapeExample: {
            executiveSummary: "100字以内：你现在最大的问题 + 为什么先处理它",
            recommendations: ["你现在先做什么", "不要先做什么", "会后要核验什么"],
            servicePath: { notFirst: "别先做什么", enter: "建议先进什么", why: "50字以内原因", actions: ["动作一"] },
            consultingHooks: ["一句适合会后追问的问题"],
          },
          outputRules: [
            "必须返回 JSON object。",
            "不要返回 title、score、metadata。",
            "优先返回 executiveSummary、recommendations、servicePath、consultingHooks、materialRequests、brandManagementInsight。",
            "总字数控制在 450 字以内。",
            "executiveSummary 不超过 100 个中文字符。",
            "recommendations 只给 3 条，每条不超过 32 个中文字符。",
            "consultingHooks 只给 2 条，每条不超过 42 个中文字符。",
            "materialRequests 只给 3-5 条。",
            "servicePath 保持 object，包含 notFirst/enter/why/actions。",
            "servicePath.actions 最多 3 条。",
            "禁止使用：认知资产、心智、闭环、势能、赋能、链路、方法论、系统化升级 这类虚词。",
            "多用：客户看不懂、客户不放心、下一步不知道怎么走、资料太散、内容没带来咨询。",
            "语言要直接、接地气，但不要制造焦虑。",
          ],
          jobId,
          submission: compactSubmission(submission),
          brief: compactReport(baseReport),
        }),
      },
    ],
  };

  try {
    const response = await fetch(getChatCompletionsUrl(env), {
      method: "POST",
      headers: {
        authorization: `Bearer ${getLlmApiKey(env)}`,
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error?.message || `Report LLM failed with HTTP ${response.status}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Report LLM returned empty content");
    }

    return parseJsonObject(content);
  } finally {
    clearTimeout(timeout);
  }
}

function mergeOptimizedReport(baseReport, optimized, llmState) {
  const merged = {
    ...baseReport,
    ...pickReportFields(optimized),
    title: baseReport.title,
    score: baseReport.score,
    metadata: {
      ...(baseReport.metadata || {}),
      ...(optimized.metadata && typeof optimized.metadata === "object" ? optimized.metadata : {}),
      llm: {
        ...llmState,
        optimizedAt: new Date().toISOString(),
      },
    },
  };

  return merged;
}

function markLlmState(baseReport, llmState) {
  return {
    ...baseReport,
    metadata: {
      ...(baseReport.metadata || {}),
      llm: llmState,
    },
  };
}

function pickReportFields(value) {
  if (!value || typeof value !== "object") return {};
  const fields = [
    "level",
    "executiveSummary",
    "analysisSummary",
    "comboDiagnosis",
    "customerFeeling",
    "brandManagementInsight",
    "findings",
    "recommendations",
    "nextSteps",
    "dimensions",
    "path",
    "servicePath",
    "notRecommended",
    "materialRequests",
    "consultingHooks",
    "boundaries",
    "downloadable",
  ];
  return Object.fromEntries(fields.filter((field) => value[field] !== undefined).map((field) => [field, value[field]]));
}

function parseJsonObject(content) {
  const trimmed = String(content || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Report LLM returned non-JSON content");
  }
}

function compactSubmission(submission) {
  const keys = [
    "companyName",
    "industry",
    "location",
    "mainOffering",
    "currentCustomerTypes",
    "contactRole",
    "acquisitionMethods",
    "businessGoal",
    "newMarketPlan",
    "targetMarkets",
    "shunseQuestion",
    "businessIntentions",
    "cooperationModes",
    "supportingMaterials",
    "selfCheck1",
    "selfCheck2",
    "selfCheck3",
    "selfCheck4",
    "selfCheck5",
    "selfCheck6",
    "selfCheck7",
    "selfCheck8",
    "selfCheck9",
    "selfCheck10",
  ];
  return Object.fromEntries(keys.filter((key) => submission[key]).map((key) => [key, submission[key]]));
}

function compactReport(report) {
  return {
    score: report.score,
    level: report.level,
    executiveSummary: report.executiveSummary,
    primary: report.metadata?.firstPriority,
    secondary: report.metadata?.secondaryPriority,
    consultationSignal: report.metadata?.consultationSignal,
    tagSummary: report.metadata?.tagSummary,
    comboDiagnosis: report.comboDiagnosis?.name ? report.comboDiagnosis : null,
    customerFeeling: report.customerFeeling,
    brandManagementInsight: report.brandManagementInsight,
    findings: limitList(report.findings, 4),
    recommendations: limitList(report.recommendations, 4),
    servicePath: report.servicePath,
    materialRequests: limitList(report.materialRequests, 5),
    consultingHooks: limitList(report.consultingHooks, 4),
  };
}

function limitList(value, limit) {
  return Array.isArray(value) ? value.slice(0, limit) : [];
}

function getLlmApiKey(env) {
  return env.DEEPSEEK_API_KEY || env.REPORT_LLM_API_KEY;
}

function getLlmBaseUrl(env) {
  return (env.DEEPSEEK_BASE_URL || env.REPORT_LLM_BASE_URL || DEFAULT_LLM_BASE_URL).replace(/\/+$/, "");
}

function getChatCompletionsUrl(env) {
  const baseUrl = getLlmBaseUrl(env);
  return baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
}

function getLlmModel(env) {
  return env.DEEPSEEK_MODEL || env.REPORT_LLM_MODEL || DEFAULT_LLM_MODEL;
}
