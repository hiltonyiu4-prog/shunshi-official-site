const DEFAULT_LLM_BASE_URL = "https://api.deepseek.com";
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
      provider: "deepseek",
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
          "你是 SHUNSE 顺世的会后品牌诊断报告编辑。",
          "你的目标是把规则诊断初稿优化成企业主看得懂、愿意继续咨询的终版报告。",
          "不要夸大承诺，不要编造企业事实，不要新增不存在的数据。",
          "报告表达要有品牌管理感：强调管理客户理解、信任、选择和行动路径，而不是只做视觉、内容或 AI 工具。",
          "只输出一个 JSON 对象，不要 Markdown，不要解释。",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "请基于 brief 做轻量报告润色，只返回需要覆盖的字段，不要返回完整原报告。提升清晰度、咨询转化意图和品牌管理感。请只返回 JSON。",
          jsonShapeExample: {
            executiveSummary: "一段更适合企业主阅读的核心判断",
            recommendations: ["建议一", "建议二"],
            servicePath: { notFirst: "不建议先做什么", enter: "建议先进入什么", why: "原因", actions: ["动作一"] },
            consultingHooks: ["适合继续咨询的问题一"],
          },
          outputRules: [
            "必须返回 JSON object。",
            "不要返回 title、score、metadata。",
            "优先返回 executiveSummary、recommendations、servicePath、consultingHooks、materialRequests、brandManagementInsight。",
            "servicePath 保持 object，包含 notFirst/enter/why/actions。",
            "consultingHooks 要像会后顾问能继续追问的问题，利于咨询和商单转化。",
            "materialRequests 要具体、可收集，便于会后诊断。",
            "语言简洁、笃定、有诊断感，但不要制造焦虑。",
          ],
          jobId,
          submission: compactSubmission(submission),
          brief: compactReport(baseReport),
        }),
      },
    ],
  };

  try {
    const response = await fetch(`${getLlmBaseUrl(env)}/chat/completions`, {
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
      throw new Error(data.error?.message || `DeepSeek failed with HTTP ${response.status}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek returned empty content");
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
    throw new Error("DeepSeek returned non-JSON content");
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

function getLlmModel(env) {
  return env.DEEPSEEK_MODEL || env.REPORT_LLM_MODEL || DEFAULT_LLM_MODEL;
}
