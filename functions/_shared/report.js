const labels = {
  quickProblems: {
    "product-not-understood": "产品好，但客户线上看不懂",
    "content-no-mainline": "内容做了不少，但没有主线",
    "ai-not-operational": "AI 工具用过，但没有真正进入业务",
    "sales-hard-to-copy": "销售承接靠个人经验，难复制",
    "overseas-translation-only": "想出海，但资料只是翻译",
    "no-review": "投了钱做内容 / 投放，但没有复盘",
  },
  expectedChanges: {
    "product-value-clear": "产品价值被讲清楚",
    "brand-more-trusted": "品牌表达更可信",
    "content-less-similar": "内容不再自嗨和同质",
    "touchpoints-mainline": "全域触点有统一主线",
    "sales-assets-complete": "销售话术、FAQ、案例证据更完整",
    "lead-review-built": "线索记录和复盘机制建立",
    "knowledge-base-built": "企业资料库 / 行业知识库搭起来",
    "ai-workflow-working": "AI 工作流辅助内容、销售和复盘",
    "overseas-trust": "出海资料被目标国家客户理解和信任",
    "shunse-pulse": "初步形成 SHUNSE Pulse",
  },
  purchaseMotivations: {
    function: "功能需求",
    emotion: "情绪价值",
    identity: "身份表达",
    "social-topic": "社交谈资",
    "value-for-money": "性价比",
    trust: "信任安全感",
    professionalism: "专业度 / 稳定交付",
  },
  trustConcerns: {
    price: "价格",
    effect: "效果",
    quality: "品质",
    delivery: "交付",
    aesthetic: "审美",
    risk: "风险",
    "brand-trust": "品牌可信度",
    "supply-stability": "供应稳定性",
    compliance: "合规 / 资质",
    "cross-border-trust": "跨境信任成本",
  },
  brandIssues: {
    "intro-old": "企业介绍比较旧",
    "value-unclear": "产品价值说不清",
    "claim-unclear": "品牌主张不明确",
    "visual-inconsistent": "视觉风格不统一",
    "proof-insufficient": "案例证据不足",
    "sales-inconsistent": "销售说法不统一",
    "team-cannot-explain": "老板懂，但团队讲不清",
    "customer-not-convinced": "客户看完资料仍不知道为什么选我们",
  },
  contentProblems: {
    "too-little": "内容少",
    similar: "内容多但同质",
    "self-talking": "内容自嗨，客户没感觉",
    "no-mainline": "没有统一主线",
    "siloed-platforms": "平台各做各的",
    "no-review": "没有复盘",
    "unknown-effective": "不知道什么内容有效",
  },
  salesAssets: {
    "standard-script": "标准销售话术",
    "customer-faq": "客户 FAQ",
    "lead-source-record": "线索来源记录",
    "case-proof": "案例证据 / 客户评价",
  },
  aiStatus: {
    "not-used": "没怎么用 AI",
    copywriting: "用 AI 写过文案",
    "image-video": "用 AI 做过图片 / 视频",
    "prompts-unsystematic": "有提示词，但不系统",
    "company-knowledge-base": "有企业资料库",
    "industry-knowledge-base": "有行业资料库",
    "faq-script-base": "有客户 FAQ / 话术库",
    "review-base": "有复盘库",
    "want-shunse-pulse": "希望搭建 SHUNSE Pulse",
  },
  cooperationModes: {
    "online-diagnosis": "线上认知诊断",
    "30-day-foundation": "30 天表达打底",
    "90-day-engine": "90 天顺势引擎搭建",
    "monthly-pulse": "月度 SHUNSE Pulse 更新",
    "overseas-rebuild": "出海品牌线上认知重构",
    "ecosystem-support": "生态共创 / 高阶支持",
    "need-shunse-judge": "不确定，希望 SHUNSE 先判断",
  },
};

export async function generateReport({ env, jobId, submission }) {
  if (env.AGENT_WEBHOOK_URL) {
    return callAgentWebhook({ env, jobId, submission });
  }

  return mockReport({ jobId, submission });
}

async function callAgentWebhook({ env, jobId, submission }) {
  const headers = { "content-type": "application/json" };
  if (env.AGENT_WEBHOOK_TOKEN) {
    headers.authorization = `Bearer ${env.AGENT_WEBHOOK_TOKEN}`;
  }

  const response = await fetch(env.AGENT_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ jobId, submission }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Agent webhook failed: ${message}`);
  }

  const data = await response.json();
  return normalizeReport(data.report || data, { jobId, submission, source: "agent-webhook" });
}

function mockReport({ jobId, submission }) {
  const company = submission.companyName || "该企业";
  const quickProblems = mapLabels("quickProblems", submission.quickProblems);
  const expectedChanges = mapLabels("expectedChanges", submission.expectedChanges);
  const trustConcerns = mapLabels("trustConcerns", submission.trustConcerns);
  const brandIssues = mapLabels("brandIssues", submission.brandIssues);
  const contentProblems = mapLabels("contentProblems", submission.contentProblems);
  const salesAssets = mapLabels("salesAssets", submission.salesAssets);
  const aiStatus = mapLabels("aiStatus", submission.aiStatus);
  const cooperationModes = mapLabels("cooperationModes", submission.cooperationModes);

  const issueCount =
    quickProblems.length + trustConcerns.length + brandIssues.length + contentProblems.length;
  const proofBonus = submission.proofCase ? 5 : 0;
  const assetBonus = Math.min(salesAssets.length, 4) * 2;
  const score = Math.max(38, Math.min(88, 78 - issueCount * 3 + proofBonus + assetBonus));
  const firstPriority = inferFirstPriority(submission);
  const mode = inferCooperationMode(submission, cooperationModes);
  const dimensions = buildDimensions(submission);
  const path = buildRoadmap(firstPriority, submission);
  const boundaries = buildBoundaries(submission);

  return normalizeReport(
    {
      title: `${company} SHUNSE 甲方需求初诊报告`,
      score,
      level: score >= 76 ? "基础较稳，可进入增长加速" : score >= 60 ? "需要先完成表达打底" : "建议优先补齐判断与信任底盘",
      executiveSummary: `${company}当前更适合先围绕「${firstPriority}」建立清晰判断。重点不是马上多做内容或工具，而是先把市场、人群、产品价值和信任承接看清楚，再决定是否进入 30 天表达打底、90 天顺势引擎或月度 SHUNSE Pulse。`,
      findings: [
        submission.primaryProblem
          ? `当前最想解决的问题：${submission.primaryProblem}`
          : quickProblems.length
            ? `当前问题集中在：${quickProblems.join("、")}。`
            : "当前核心问题尚未用一句话明确，建议先完成问题定义。",
        buildFinding("市场与人群判断", submission.customerSegments, trustConcerns, "客户担心点"),
        brandIssues.length
          ? `品牌与表达层面存在：${brandIssues.join("、")}。`
          : "品牌与表达问题尚未充分暴露，需要结合企业介绍、案例和销售材料继续判断。",
        contentProblems.length
          ? `内容与触点层面存在：${contentProblems.join("、")}。`
          : "内容触点问题暂不明显，但仍需确认各渠道是否围绕同一条产品价值主线。",
        aiStatus.length
          ? `AI 与资料库现状：${aiStatus.join("、")}。`
          : "AI 与资料库成熟度信息不足，后续需要确认资料沉淀和复盘机制。",
      ],
      recommendations: [
        `第一阶段优先解决：${firstPriority}。`,
        expectedChanges.length
          ? `90 天目标建议围绕：${expectedChanges.slice(0, 3).join("、")}。`
          : "先补充 90 天目标，避免诊断停留在泛泛的品牌升级。",
        mode ? `建议合作模式：${mode}。` : "建议由 SHUNSE 先做线上认知诊断，再判断合作深度。",
        submission.overseasNeed === "yes"
          ? "涉及出海时，不要只翻译资料，应重构目标国家客户能理解和信任的表达语境。"
          : "如果暂不出海，先把国内目标客户、产品主线和线索承接打通。",
      ],
      nextSteps: [
        "补充企业介绍、产品手册、官网/账号链接、客户案例和销售话术。",
        "由 SHUNSE 内部完成六类诊断：市场人群、产品品牌、内容触点、销售转化、资料库 AI、出海语境。",
        "输出问题清单、优先级判断、30/60/90 天路径和推荐合作模式。",
      ],
      dimensions,
      path,
      boundaries,
      downloadable: {
        format: "html-pdf",
        rationale: "报告先以 HTML 呈现，用户确认后本地生成 PDF。50 人沙龙体量下不占用服务器 CPU，也不会因为单点 PDF 服务排队。",
      },
      metadata: {
        source: "shunse-brief-mock-v1",
        jobId,
        firstPriority,
      },
    },
    { jobId, submission, source: "shunse-brief-mock-v1" },
  );
}

function inferFirstPriority(submission) {
  const brandIssues = asArray(submission.brandIssues);
  const contentProblems = asArray(submission.contentProblems);
  const salesAssets = asArray(submission.salesAssets);
  const aiStatus = asArray(submission.aiStatus);

  if (!submission.customerSegments || asArray(submission.trustConcerns).length >= 3) {
    return "市场与消费人群判断";
  }
  if (
    brandIssues.includes("value-unclear") ||
    brandIssues.includes("claim-unclear") ||
    brandIssues.includes("customer-not-convinced")
  ) {
    return "产品价值主线与品牌表达";
  }
  if (contentProblems.includes("no-mainline") || contentProblems.includes("siloed-platforms")) {
    return "内容矩阵主线";
  }
  if (salesAssets.length < 2) {
    return "销售话术、FAQ 与案例证据";
  }
  if (aiStatus.includes("want-shunse-pulse") || aiStatus.includes("prompts-unsystematic")) {
    return "企业资料库与 AI 工作流";
  }
  if (submission.overseasNeed === "yes") {
    return "出海表达与国家语境";
  }
  return "企业介绍与品牌表达打底";
}

function inferCooperationMode(submission, selectedModes) {
  if (selectedModes.length) return selectedModes[0];
  if (submission.overseasNeed === "yes") return labels.cooperationModes["overseas-rebuild"];
  if (asArray(submission.aiStatus).includes("want-shunse-pulse")) {
    return labels.cooperationModes["monthly-pulse"];
  }
  if (asArray(submission.expectedChanges).length >= 4) return labels.cooperationModes["90-day-engine"];
  return labels.cooperationModes["30-day-foundation"];
}

function buildDimensions(submission) {
  return [
    dimension(
      "市场与人群判断",
      !submission.customerSegments || asArray(submission.trustConcerns).length >= 3 ? "高" : "中",
      submission.customerSegments
        ? `已描述目标客户，但仍需验证购买动机与成交证据。`
        : "目标客户画像不足，容易导致内容和销售动作失焦。",
    ),
    dimension(
      "产品与品牌表达",
      asArray(submission.brandIssues).length >= 2 ? "高" : "中",
      asArray(submission.brandIssues).length
        ? `当前表达问题包括：${mapLabels("brandIssues", submission.brandIssues).slice(0, 3).join("、")}。`
        : "需要结合企业介绍、案例和官网进一步判断表达清晰度。",
    ),
    dimension(
      "内容与全域触点",
      asArray(submission.contentProblems).includes("no-mainline") ? "高" : "中",
      asArray(submission.touchpoints).length
        ? "已有触点需要统一主线，避免平台各自为战。"
        : "触点基础不足，建议先建立官网/私域/资料的基本承接。",
    ),
    dimension(
      "销售与转化承接",
      asArray(submission.salesAssets).length < 2 ? "高" : "中",
      asArray(submission.salesAssets).length
        ? `已有资产：${mapLabels("salesAssets", submission.salesAssets).join("、")}。`
        : "销售话术、FAQ、案例证据和线索记录需要优先补齐。",
    ),
    dimension(
      "资料库与 AI 工作流",
      asArray(submission.aiStatus).includes("want-shunse-pulse") ? "高" : "中",
      asArray(submission.aiStatus).length
        ? `AI/资料库现状：${mapLabels("aiStatus", submission.aiStatus).slice(0, 3).join("、")}。`
        : "AI 使用和资料沉淀信息不足，暂不建议直接上复杂自动化。",
    ),
    dimension(
      "出海 / 国家语境",
      submission.overseasNeed === "yes" ? "高" : "低",
      submission.overseasNeed === "yes"
        ? "需要从目标国家客户的理解方式和信任成本重构表达。"
        : "当前优先级不高，先把国内表达和承接跑顺。",
    ),
  ];
}

function dimension(name, priority, conclusion) {
  return { name, priority, conclusion };
}

function buildRoadmap(firstPriority, submission) {
  return [
    {
      period: "0-30 天",
      title: "表达打底",
      actions: [
        `围绕「${firstPriority}」完成问题定义和第一版价值主线。`,
        "整理企业介绍、产品优势、客户案例和常见异议。",
        "形成官网/销售资料/私域话术可共用的一页式表达框架。",
      ],
    },
    {
      period: "31-60 天",
      title: "承接完善",
      actions: [
        "补齐客户 FAQ、案例证据、销售话术和线索记录字段。",
        "建立内容复盘表，判断哪些主题带来有效咨询。",
        submission.overseasNeed === "yes"
          ? "同步重构目标市场的英文/多语种资料。"
          : "先跑通国内主要触点的统一表达。",
      ],
    },
    {
      period: "61-90 天",
      title: "顺势引擎",
      actions: [
        "沉淀企业资料库、行业知识库和复盘库。",
        "将高频内容、销售问答和案例沉淀为可复用 AI 工作流。",
        "按月更新 SHUNSE Pulse，持续校准市场、人群和表达。",
      ],
    },
  ];
}

function buildBoundaries(submission) {
  const boundaries = [
    "本报告是沙龙初诊，不替代深度访谈和资料审计。",
    "不承诺立即爆单，优先解决判断、表达、信任和承接问题。",
    "如果缺少真实案例、销售记录和客户反馈，诊断结论需要后续复核。",
  ];

  if (submission.overseasNeed === "yes") {
    boundaries.push("出海表达不能只翻译中文资料，需要按目标国家语境重写信任证据。");
  }

  return boundaries;
}

function buildFinding(title, text, tags, tagTitle) {
  const parts = [];
  if (text) parts.push(text);
  if (tags.length) parts.push(`${tagTitle}：${tags.join("、")}`);
  return parts.length ? `${title}：${parts.join("；")}。` : `${title}：信息不足，需要继续补充。`;
}

function mapLabels(group, values) {
  return asArray(values).map((value) => labels[group]?.[value] || value);
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeReport(report, context) {
  return {
    title: String(report.title || "SHUNSE 甲方需求初诊报告"),
    score: Number.isFinite(Number(report.score)) ? Math.max(0, Math.min(100, Number(report.score))) : 60,
    level: String(report.level || "待评估"),
    executiveSummary: String(report.executiveSummary || report.summary || "暂无摘要。"),
    findings: normalizeList(report.findings),
    recommendations: normalizeList(report.recommendations),
    nextSteps: normalizeList(report.nextSteps),
    dimensions: Array.isArray(report.dimensions) ? report.dimensions : [],
    path: Array.isArray(report.path) ? report.path : [],
    boundaries: normalizeList(report.boundaries),
    downloadable: report.downloadable || null,
    generatedAt: report.generatedAt || new Date().toISOString(),
    metadata: {
      ...(report.metadata || {}),
      source: context.source,
      jobId: context.jobId,
    },
  };
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}
