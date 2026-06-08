import { optimizeReportWithLlm } from "./llm-report.js";

const tagDefinitions = {
  M: {
    name: "市场与人群判断",
    issueName: "市场判断断层",
    dimension: "市场与人群判断",
    diagnosis: "目标客户、触发场景和购买动机还不够清晰，容易先铺平台、先做声量，却不知道谁最可能被触发、相信并行动。",
    recommendation: "先把目标人群、关键场景、购买顾虑和已成交证据梳理出来，再决定内容、投放和触点顺序。",
    customerFeeling: "你东西不少，但我不知道你是不是为我准备的。",
    actions: ["线上认知诊断", "目标人群与购买场景初判", "第一优先产品 / 服务选择", "30 / 60 / 90 天增长顺序判断"],
    notRecommended: "盲目投放、找达人、铺账号、马上进新市场",
    serviceEntry: "线上认知诊断",
  },
  B: {
    name: "品牌认知锚点",
    issueName: "品牌锚点断层",
    dimension: "品牌认知锚点",
    diagnosis: "客户看得到企业存在，但不容易记住你到底代表什么，也难以形成一句话认知。",
    recommendation: "把企业从“我有什么”整理成客户能记住的一句话主张，并统一到官网、账号、资料和销售话术。",
    customerFeeling: "我知道你在卖什么，但我记不住你是谁。",
    actions: ["品牌锚点与一句话主张", "产品 / 品牌主线重构", "首屏、简介、账号主页、合作介绍、销售开场统一", "品牌内容标准初版"],
    notRecommended: "只做包装、拍大片、换 slogan",
    serviceEntry: "30 天表达打底",
  },
  V: {
    name: "产品 / 服务价值翻译",
    issueName: "价值翻译断层",
    dimension: "产品 / 服务价值翻译",
    diagnosis: "企业优势真实存在，但表达仍偏内行语言，客户不一定能立刻明白这些优势和自己有什么关系。",
    recommendation: "把产地、工艺、团队、资源、品质等内行优势翻译成客户可感知的购买理由和选择逻辑。",
    customerFeeling: "你说的都对，但我还没有被说服。",
    actions: ["产品价值翻译", "差异化卖点与客户利益重构", "使用场景、情绪价值、功能价值、身份价值梳理", "销售话术和内容选题统一"],
    notRecommended: "继续堆品质、匠心、稀缺、性价比等形容词",
    serviceEntry: "30 天表达打底",
  },
  T: {
    name: "信任证据",
    issueName: "信任证据断层",
    dimension: "信任证据",
    diagnosis: "案例、过程、结果、资质、评价或复购证据没有形成陌生客户可判断的证据链。",
    recommendation: "优先整理真实案例、过程证据、结果反馈、客户评价和风险保障，让客户不用反复追问也能判断可信度。",
    customerFeeling: "我对你有兴趣，但还缺一个让我放心的理由。",
    actions: ["信任证据盘点", "案例、过程、结果、反馈、资质材料整理", "高客单 / 合作客户证明资料", "陌生客户、新圈层客户和跨区域客户信任链搭建"],
    notRecommended: "只靠销售个人背书、只讲品牌故事",
    serviceEntry: "信任证据盘点 + 案例材料",
  },
  C: {
    name: "内容主线",
    issueName: "内容主线断层",
    dimension: "内容主线",
    diagnosis: "官网、社媒、短视频、直播、私域或线下资料容易各做各的，内容声量没有沉淀成统一认知。",
    recommendation: "用同一条品牌认知主线统领不同平台内容，让内容持续回答客户问题并指向同一个选择理由。",
    customerFeeling: "我看了几次，但还是不知道你到底想让我记住什么。",
    actions: ["内容主线与平台角色梳理", "选题库、脚本样板、发布包", "官网 / 社媒 / 私域 / 直播 / 线下资料表达统一", "内容复盘机制设计"],
    notRecommended: "继续加大发内容频率",
    serviceEntry: "内容主线 + 销售承接系统",
  },
  S: {
    name: "转化承接",
    issueName: "转化承接断层",
    dimension: "转化承接",
    diagnosis: "客户兴趣出现后，咨询、预约、成交、到店、合作或复盘主要依赖个人发挥，难以稳定复制。",
    recommendation: "补齐 FAQ、标准话术、资料包、线索记录和复盘机制，把内容兴趣接到明确下一步。",
    customerFeeling: "我有点想了解，但不知道现在该怎么继续。",
    actions: ["客户 FAQ 与异议处理", "咨询、预约、到店、购买、留资、合作路径设计", "私域 / 销售资料包", "线索记录和复盘表"],
    notRecommended: "继续靠老板、销售或客服个人发挥硬接线索",
    serviceEntry: "内容主线 + 销售承接系统",
  },
  K: {
    name: "资料 / AI 底盘",
    issueName: "资料 / AI 底盘断层",
    dimension: "资料 / AI 底盘",
    diagnosis: "企业经验、案例、话术、素材和复盘没有沉淀成团队与 AI 可调用的资料系统。",
    recommendation: "先搭企业资料库、案例库、话术库和审核标准，再让 AI 参与内容、销售和复盘。",
    customerFeeling: "你们应该有实力，但我看到的资料不像一个系统。",
    actions: ["企业资料库初版", "产品、案例、FAQ、话术、证据、素材分类", "AI 可调用资料结构", "SHUNSE Pulse 初步搭建"],
    notRecommended: "直接让 AI 批量生产内容",
    serviceEntry: "企业资料库 + AI 可调用结构",
  },
  G: {
    name: "新市场 / 跨语境表达",
    issueName: "新市场 / 跨语境错位",
    dimension: "新市场 / 跨语境表达",
    diagnosis: "进入新城市、新圈层、新平台或海外市场时，原有表达没有按新客户角色、信任路径和行动流程重组。",
    recommendation: "不要只翻译或换平台发布，要按目标市场的理解路径、合作流程和信任成本重构表达。",
    customerFeeling: "我大概看懂了，但还不能判断你是否适合我。",
    actions: ["新市场 / 跨语境表达诊断", "目标市场、目标圈层与客户角色判断", "新客户信任证据、合作流程和行动路径重组", "活动资料、渠道资料、独立站、海外社媒和咨询承接"],
    notRecommended: "直接换平台、换城市、翻译资料或开海外账号",
    serviceEntry: "新市场 / 跨语境表达诊断",
  },
  H: {
    name: "高潜共创",
    issueName: "高潜基础",
    dimension: "高潜共创",
    diagnosis: "企业已经具备较好的认知资产基础，适合进一步做系统化沉淀、复盘和共创提效。",
    recommendation: "可以进入 SHUNSE Pulse、90 天顺势引擎或生态共创，把已有基础转成可持续更新的增长系统。",
    customerFeeling: "你们已经有基础，我想看到更清晰、更可信、更持续的系统。",
    actions: ["共创候选评估", "90 天顺势引擎搭建", "月度 SHUNSE Pulse 更新", "新市场 / 生态 / 高阶共创判断"],
    notRecommended: "重复做零散优化",
    serviceEntry: "共创候选评估 + SHUNSE Pulse",
  },
};

const businessIntentLabels = {
  "intent-a": "产品、服务或项目不错，但客户线上看不懂、记不住、分不清",
  "intent-b": "想把老板经验、企业积累、产品优势整理成品牌资产",
  "intent-c": "想做内容、短视频、直播、私域或官网，但结果不稳定",
  "intent-d": "想提升咨询、到店、成交、复购、转介绍或合作拓展",
  "intent-e": "想进入新城市、新圈层、新平台或海外市场",
  "intent-f": "想用 AI 提效，但 AI 写出来空、乱、像别人",
};

const cooperationModeLabels = {
  "online-diagnosis": "线上认知诊断",
  "30-day-foundation": "30 天表达打底",
  "90-day-engine": "90 天顺势引擎搭建",
  "monthly-pulse": "月度 SHUNSE Pulse 更新",
  "overseas-rebuild": "新市场 / 出海认知重构",
  "ecosystem-support": "生态共创 / 高阶支持",
  "need-shunse-judge": "不确定，希望 SHUNSE 先判断",
};

const newMarketPlanLabels = {
  uncertain: "不确定",
  none: "暂时没有",
  "new-city": "有新城市计划",
  "new-circle": "有新圈层计划",
  "new-platform": "有新平台计划",
  overseas: "有海外市场计划",
};

const combinationDiagnosis = {
  "M+B": {
    name: "自有品牌没有落点",
    summary: "想做品牌，但还没决定先打谁、靠什么被记住。",
    action: "线上认知诊断 + 品牌锚点",
  },
  "M+V": {
    name: "好产品找不到购买理由",
    summary: "产品很多、优势很多，但客户利益没有被翻译出来。",
    action: "人群判断 + 产品价值重构",
  },
  "B+C": {
    name: "内容越做越散",
    summary: "有账号、有视觉、有内容，但没有稳定认知。",
    action: "品牌主线 + 内容系统",
  },
  "V+T": {
    name: "卖点像口号，证据跟不上",
    summary: "说得好听，但客户缺少相信的依据。",
    action: "卖点证据化 + 案例材料",
  },
  "T+S": {
    name: "有兴趣，但迟迟不成交",
    summary: "客户被吸引了，但缺信任材料和推进路径。",
    action: "信任链 + 销售承接",
  },
  "C+S": {
    name: "有内容流量，没有经营结果",
    summary: "内容和销售没有接起来，线索没被复盘。",
    action: "内容路径 + 私域 / 销售资料",
  },
  "K+C": {
    name: "AI 放大混乱",
    summary: "底稿散、主线散，AI 只会更快生成同质内容。",
    action: "资料库 + AI 工作流",
  },
  "K+T": {
    name: "有实力，但证据调用不动",
    summary: "真实案例和口碑存在，但没有变成可复用材料。",
    action: "案例库 + 信任证据库",
  },
  "G+T": {
    name: "想进新市场，但别人不敢信",
    summary: "新城市、新圈层或跨区域客户缺少判断你的证据。",
    action: "目标市场语境 + 信任链",
  },
  "H+K": {
    name: "基础好，但系统没沉淀",
    summary: "团队已经能做事，但经验还没有变成企业资产。",
    action: "90 天 SHUNSE Pulse",
  },
};

const selfCheckCatalog = {
  "q1-a": answer(1, "陌生客户第一次看到你们时，最可能是什么反应？", "“你们到底是做什么的？”需要销售重新解释。", "B"),
  "q1-b": answer(1, "陌生客户第一次看到你们时，最可能是什么反应？", "“看起来不错，但和别人差不多。”没有留下明确记忆点。", "V"),
  "q1-c": answer(1, "陌生客户第一次看到你们时，最可能是什么反应？", "客户会追问案例、资质、评价、复购，说明还不够放心。", "T"),
  "q1-d": answer(1, "陌生客户第一次看到你们时，最可能是什么反应？", "客户有兴趣，但不知道下一步怎么咨询、预约、购买、到店、留资或合作。", "S"),
  "q1-e": answer(1, "陌生客户第一次看到你们时，最可能是什么反应？", "客户能很快明白你是谁、适合谁、为什么值得继续看。", "H"),

  "q2-a": answer(2, "自有品牌或品牌升级最卡在哪里？", "还在从“我有什么产品”出发，没有真正想清“谁为什么会买”。", "M"),
  "q2-b": answer(2, "自有品牌或品牌升级最卡在哪里？", "有品牌名、包装或故事，但客户记不住品牌到底代表什么。", "B"),
  "q2-c": answer(2, "自有品牌或品牌升级最卡在哪里？", "产品不错，但表达仍停留在好品质、原生态、匠心、性价比。", "V"),
  "q2-d": answer(2, "自有品牌或品牌升级最卡在哪里？", "包装、账号、宣传册、官网、直播、私域各做各的，品牌感不统一。", "C"),
  "q2-e": answer(2, "自有品牌或品牌升级最卡在哪里？", "已经知道先打哪类人、靠什么被记住、用什么证据建立信任。", "H"),

  "q3-a": answer(3, "客户问为什么选你时，你们通常怎么回答？", "主要靠老板或销售现场发挥，讲得好不好看个人状态。", "S"),
  "q3-b": answer(3, "客户问为什么选你时，你们通常怎么回答？", "会讲产地、工艺、团队、历史、资源，但客户不一定知道和自己有什么关系。", "V"),
  "q3-c": answer(3, "客户问为什么选你时，你们通常怎么回答？", "会发很多资料过去，但没有一条清楚的选择逻辑。", "C"),
  "q3-d": answer(3, "客户问为什么选你时，你们通常怎么回答？", "最后常常还是靠价格、关系、熟人介绍或反复沟通推动。", "T"),
  "q3-e": answer(3, "客户问为什么选你时，你们通常怎么回答？", "能讲清楚适合谁、解决什么问题、凭什么信、下一步怎么开始。", "H"),

  "q4-a": answer(4, "你们对目标客户的判断，最接近哪种状态？", "目标客户说得比较泛，例如年轻人、中高端客户、老板、家庭用户、新中产、外地客户。", "M"),
  "q4-b": answer(4, "你们对目标客户的判断，最接近哪种状态？", "知道客户是谁，但不知道他在哪个场景会被触发。", "M"),
  "q4-c": answer(4, "你们对目标客户的判断，最接近哪种状态？", "知道客户画像，但内容、产品页、销售话术没有围绕他的顾虑展开。", "S"),
  "q4-d": answer(4, "你们对目标客户的判断，最接近哪种状态？", "本地客户、外地客户、高端客户、合作方或海外客户都用同一套表达。", "G"),
  "q4-e": answer(4, "你们对目标客户的判断，最接近哪种状态？", "能按不同人群、场景、平台和购买顾虑组织表达。", "H"),

  "q5-a": answer(5, "现在最缺哪一种让客户相信的东西？", "缺真实案例：做过、卖过、服务过，但没有可复述的案例。", "T"),
  "q5-b": answer(5, "现在最缺哪一种让客户相信的东西？", "缺过程证据：选品、生产、服务、交付、体验、团队能力没有被看见。", "T"),
  "q5-c": answer(5, "现在最缺哪一种让客户相信的东西？", "缺结果证据：复购、口碑、评价、转介绍、项目成果或客户反馈没有沉淀。", "T"),
  "q5-d": answer(5, "现在最缺哪一种让客户相信的东西？", "证据不少，但散在聊天记录、相册、PPT、销售个人经验里。", "K"),
  "q5-e": answer(5, "现在最缺哪一种让客户相信的东西？", "已有案例、过程、结果和客户反馈，并能按不同客户场景调用。", "H"),

  "q6-a": answer(6, "你们的内容现在最像哪一种？", "老板想到什么发什么，内容靠灵感和临时安排。", "C"),
  "q6-b": answer(6, "你们的内容现在最像哪一种？", "每个平台都在做，但没有统一品牌主线。", "C"),
  "q6-c": answer(6, "你们的内容现在最像哪一种？", "内容看起来不错，但客户看完没有咨询、预约、购买、到店、留资或合作动作。", "S"),
  "q6-d": answer(6, "你们的内容现在最像哪一种？", "内容越做越像同行，甚至越用 AI 越像模板。", "B"),
  "q6-e": answer(6, "你们的内容现在最像哪一种？", "内容能持续回答客户问题，并把客户带向明确下一步。", "H"),

  "q7-a": answer(7, "线索、咨询或客户兴趣来了以后，最常见的问题是什么？", "客户问的问题反复出现，但没有形成 FAQ 和标准话术。", "S"),
  "q7-b": answer(7, "线索、咨询或客户兴趣来了以后，最常见的问题是什么？", "主要靠老板、销售、客服、门店或项目负责人的个人能力承接。", "S"),
  "q7-c": answer(7, "线索、咨询或客户兴趣来了以后，最常见的问题是什么？", "内容、客服、销售、门店、合作沟通或项目介绍拿出去的说法不一致。", "C"),
  "q7-d": answer(7, "线索、咨询或客户兴趣来了以后，最常见的问题是什么？", "有咨询、有沟通，但没有线索记录、复盘和下一轮内容优化。", "K"),
  "q7-e": answer(7, "线索、咨询或客户兴趣来了以后，最常见的问题是什么？", "已有咨询路径、话术、资料包、记录和复盘机制。", "H"),

  "q8-a": answer(8, "如果现在给你一笔品牌预算，你第一步最可能做什么？", "先投广告、找达人、做矩阵、铺平台，看哪个能跑出来。", "M"),
  "q8-b": answer(8, "如果现在给你一笔品牌预算，你第一步最可能做什么？", "先升级包装、拍宣传片、做视觉，让品牌看起来更高级。", "B"),
  "q8-c": answer(8, "如果现在给你一笔品牌预算，你第一步最可能做什么？", "先多发内容、多做账号、多直播或多铺触点，把声量做起来。", "C"),
  "q8-d": answer(8, "如果现在给你一笔品牌预算，你第一步最可能做什么？", "不知道该先打人群、补资料、做内容、做承接，还是进新市场。", "M"),
  "q8-e": answer(8, "如果现在给你一笔品牌预算，你第一步最可能做什么？", "先判断目标人群、品牌主线、信任证据和承接路径，再决定投哪里。", "H"),

  "q9-a": answer(9, "如果让 AI 帮你们做内容、资料、脚本或销售话术，最大问题是什么？", "AI 不懂我们，因为企业资料、案例、话术和产品信息没有整理好。", "K"),
  "q9-b": answer(9, "如果让 AI 帮你们做内容、资料、脚本或销售话术，最大问题是什么？", "AI 写出来很顺，但都是空话，缺少真实判断和品牌味道。", "V"),
  "q9-c": answer(9, "如果让 AI 帮你们做内容、资料、脚本或销售话术，最大问题是什么？", "AI 做了很多内容，但平台、销售、私域和复盘没有接上。", "S"),
  "q9-d": answer(9, "如果让 AI 帮你们做内容、资料、脚本或销售话术，最大问题是什么？", "AI 容易写错、编造或夸大，因为缺少证据和审核标准。", "T"),
  "q9-e": answer(9, "如果让 AI 帮你们做内容、资料、脚本或销售话术，最大问题是什么？", "已有资料库、内容标准和审核流程，AI 能在团队判断下提高效率。", "H"),

  "q10-skip": answer(10, "如果涉及新城市、新圈层、新平台、跨省或海外市场，最可能卡在哪里？", "暂时完全不涉及。", ""),
  "q10-a": answer(10, "如果涉及新城市、新圈层、新平台、跨省或海外市场，最可能卡在哪里？", "只是把原有资料翻译、改写或换个平台发布，没有按目标人群和场景重组。", "G"),
  "q10-b": answer(10, "如果涉及新城市、新圈层、新平台、跨省或海外市场，最可能卡在哪里？", "不同城市、圈层、平台、客户角色都用同一套卖点。", "G"),
  "q10-c": answer(10, "如果涉及新城市、新圈层、新平台、跨省或海外市场，最可能卡在哪里？", "合作流程、价格逻辑、体验保障、交付稳定、案例或售后没有讲清。", "T"),
  "q10-d": answer(10, "如果涉及新城市、新圈层、新平台、跨省或海外市场，最可能卡在哪里？", "有展会、活动、平台、独立站或海外社媒动作，但咨询承接和资料复用不稳定。", "S"),
  "q10-e": answer(10, "如果涉及新城市、新圈层、新平台、跨省或海外市场，最可能卡在哪里？", "能按目标市场、客户角色、信任路径和行动流程组织表达。", "H"),
};

export async function generateReport({ env, jobId, submission }) {
  const baseReport = env.AGENT_WEBHOOK_URL
    ? await callAgentWebhook({ env, jobId, submission })
    : mockReport({ jobId, submission });

  const finalReport = await optimizeReportWithLlm({ env, jobId, submission, baseReport });
  return normalizeReport(finalReport, {
    jobId,
    submission,
    source: finalReport.metadata?.source || baseReport.metadata?.source || "shunse-online-cognition-v2",
  });
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
  const profile = buildTagProfile(submission);
  const analysis = analyzeProfile(profile, submission);
  const firstTag = analysis.primaryTag;
  const secondaryTag = analysis.secondaryTag;
  const firstPriority = tagDefinitions[firstTag]?.name || "线上认知资产打底";
  const score = scoreProfile(profile);
  const mode = inferCooperationMode(submission, firstTag);
  const intentions = mapValues(submission.businessIntentions, businessIntentLabels);
  const newMarketPlan = newMarketPlanLabels[submission.newMarketPlan] || submission.newMarketPlan || "未填写";
  const servicePath = buildServicePath(firstTag, secondaryTag, mode, analysis);
  const notRecommended = buildNotRecommended(analysis);
  const materialRequests = buildMaterialRequests(analysis);
  const consultingHooks = buildConsultingHooks(analysis, submission);

  return normalizeReport(
    {
      title: `${company} SHUNSE 企业线上认知自测报告`,
      score,
      level: reportLevel(score, profile),
      executiveSummary: buildExecutiveSummary(company, analysis, firstPriority),
      analysisSummary: buildAnalysisSummary(analysis, mode, score),
      comboDiagnosis: analysis.combination,
      customerFeeling: tagDefinitions[firstTag]?.customerFeeling || "",
      brandManagementInsight: buildBrandManagementInsight(analysis),
      findings: buildFindings(submission, profile, intentions, newMarketPlan, analysis),
      recommendations: buildRecommendations(firstTag, profile, mode, submission, analysis),
      nextSteps: [
        `建议先进入「${mode}」，用一次 30 分钟会后沟通确认自测结果是否和真实资料一致。`,
        "请补充企业介绍、产品资料、案例证据、官网/账号链接、销售话术和客户常见问题，便于 SHUNSE 做二次判断。",
        "会后输出更细的问题清单、优先级、30/60/90 天行动路径和建议合作模式。",
      ],
      dimensions: buildDimensions(profile, submission),
      path: buildRoadmap(firstTag, submission),
      servicePath,
      notRecommended,
      materialRequests,
      consultingHooks,
      boundaries: buildBoundaries(submission),
      downloadable: {
        format: "html-pdf",
        rationale: "报告先以 HTML 呈现，用户确认后本地生成 PDF。50 人沙龙体量下不占用服务器 CPU，也不会因为单点 PDF 服务排队。",
      },
      metadata: {
        source: "shunse-online-cognition-v2",
        jobId,
        firstPriority,
        secondaryPriority: secondaryTag ? tagDefinitions[secondaryTag]?.name : "",
        consultationSignal: analysis.consultationSignal,
        tagSummary: profile.summary,
        dominantTags: profile.dominantTags,
        selfCheckChoices: profile.selected.map(
          (item) => `Q${item.questionNumber} ${item.label}${item.tag ? `（${tagDefinitions[item.tag].issueName}）` : ""}`,
        ),
        businessIntentions: intentions,
        newMarketPlan,
      },
    },
    { jobId, submission, source: "shunse-online-cognition-v2" },
  );
}

function analyzeProfile(profile, submission) {
  const issueTags = profile.dominantTags.filter((item) => item.tag !== "H");
  const strongestIssueCount = Math.max(0, ...issueTags.map((item) => item.count));
  const isHighPotential = (profile.counts.H || 0) >= 5 && strongestIssueCount <= 2;
  const primaryTag = isHighPotential
    ? "H"
    : issueTags[0]?.tag || profile.dominantTags[0]?.tag || inferLegacyTag(submission);
  const secondaryTag = isHighPotential
    ? issueTags[0]?.tag || (profile.counts.K ? "K" : "")
    : issueTags.find((item) => item.tag !== primaryTag)?.tag || "";
  const specialRules = [];

  if ((profile.counts.K || 0) >= 2) {
    specialRules.push("K 出现 2 次及以上：AI 分析前要优先整理企业真实资料底稿。");
  }
  if ((profile.counts.G || 0) >= 1) {
    specialRules.push("G 出现 1 次及以上：新市场 / 跨语境表达需要单独列为会后诊断项。");
  }
  if ((profile.counts.M || 0) >= 2) {
    specialRules.push("M 出现 2 次及以上：不建议马上投放、拍大片或铺矩阵，应先做市场与人群判断。");
  }
  if (isHighPotential) {
    specialRules.push("H 出现 5 次及以上且其他单项不高：可判断为高潜共创型。");
  }

  const combination = findCombination(primaryTag, secondaryTag, profile);
  const consultationSignal = inferConsultationSignal(profile, primaryTag, submission);

  return {
    primaryTag,
    secondaryTag,
    isHighPotential,
    specialRules,
    combination,
    consultationSignal,
  };
}

function buildExecutiveSummary(company, analysis, firstPriority) {
  const definition = tagDefinitions[analysis.primaryTag] || tagDefinitions.M;
  const secondary = analysis.secondaryTag ? `，同时需要留意「${tagDefinitions[analysis.secondaryTag]?.name}」` : "";
  const combo = analysis.combination ? `整体更像「${analysis.combination.name}」：${analysis.combination.summary}` : "";
  return `${company}当前最应该先围绕「${firstPriority}」整理线上认知资产${secondary}。这不是单纯做设计、发内容或上 AI 工具的问题，而是要管理客户从“看见你”到“理解你、相信你、愿意咨询”的路径。${combo}`;
}

function buildAnalysisSummary(analysis, mode, score) {
  const rows = [
    {
      label: "主诊断",
      value: tagDefinitions[analysis.primaryTag]?.issueName || "待判断",
      detail: tagDefinitions[analysis.primaryTag]?.diagnosis || "",
    },
  ];

  if (analysis.secondaryTag) {
    rows.push({
      label: "次诊断",
      value: tagDefinitions[analysis.secondaryTag]?.issueName || "待判断",
      detail: tagDefinitions[analysis.secondaryTag]?.diagnosis || "",
    });
  }

  rows.push(
    {
      label: "建议进入",
      value: mode,
      detail: "先用一次轻量诊断确认资料和业务事实，再决定 30 天打底、90 天引擎或 SHUNSE Pulse。",
    },
    {
      label: "咨询信号",
      value: analysis.consultationSignal,
      detail: score >= 70 ? "基础较好，适合讨论系统化放大。" : "断层较明确，适合先做可落地的表达与承接修复。",
    },
  );

  return rows;
}

function buildBrandManagementInsight(analysis) {
  const primary = tagDefinitions[analysis.primaryTag] || tagDefinitions.M;
  return `这类问题本质上是品牌管理问题：不是让品牌“看起来更好”，而是让客户在关键触点上形成稳定判断。SHUNSE 会先处理「${primary.name}」，再把内容、资料、销售承接和 AI 底盘接成一个可复盘的系统。`;
}

function answer(questionNumber, question, label, tag) {
  return { questionNumber, question, label, tag };
}

function buildTagProfile(submission) {
  const selected = [];
  for (let index = 1; index <= 10; index += 1) {
    const value = submission[`selfCheck${index}`];
    const item = selfCheckCatalog[value];
    if (item) selected.push({ value, ...item });
  }

  const counts = Object.fromEntries(Object.keys(tagDefinitions).map((tag) => [tag, 0]));
  selected.forEach((item) => {
    if (item.tag && counts[item.tag] !== undefined) counts[item.tag] += 1;
  });

  if (!selected.length) {
    applyLegacySignals(counts, submission);
  }

  const dominantTags = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([tag, count]) => ({ tag, name: tagDefinitions[tag].issueName, count }))
    .sort((a, b) => b.count - a.count || tagSortWeight(a.tag) - tagSortWeight(b.tag));

  const summary = dominantTags.length
    ? dominantTags.map((item) => `${item.name} ${item.count}`).join(" / ")
    : "暂无明显断层，需要补充自测信息";

  return { selected, counts, dominantTags, summary };
}

function findCombination(primaryTag, secondaryTag, profile) {
  const candidatePairs = [];
  if (primaryTag && secondaryTag) candidatePairs.push([primaryTag, secondaryTag]);
  const topIssueTags = profile.dominantTags.filter((item) => item.tag !== "H").slice(0, 3).map((item) => item.tag);
  for (let index = 0; index < topIssueTags.length; index += 1) {
    for (let next = index + 1; next < topIssueTags.length; next += 1) {
      candidatePairs.push([topIssueTags[index], topIssueTags[next]]);
    }
  }
  if ((profile.counts.H || 0) > 0 && (profile.counts.K || 0) > 0) {
    candidatePairs.push(["H", "K"]);
  }

  for (const pair of candidatePairs) {
    const key = combinationKey(pair[0], pair[1]);
    if (combinationDiagnosis[key]) {
      return { key, ...combinationDiagnosis[key] };
    }
  }

  return null;
}

function buildServicePath(firstTag, secondaryTag, mode, analysis) {
  const primary = tagDefinitions[firstTag] || tagDefinitions.M;
  const secondary = secondaryTag ? tagDefinitions[secondaryTag] : null;
  const actions = Array.from(new Set([...(primary.actions || []), ...((secondary && secondary.actions) || [])])).slice(0, 6);

  return {
    notFirst: primary.notRecommended,
    enter: mode,
    why: analysis.combination
      ? `因为当前组合诊断是「${analysis.combination.name}」，更适合先做「${analysis.combination.action}」。`
      : `因为当前主诊断是「${primary.issueName}」，应先处理客户理解、信任和行动路径。`,
    actions,
  };
}

function buildNotRecommended(analysis) {
  const tags = [analysis.primaryTag, analysis.secondaryTag].filter(Boolean);
  const items = tags.map((tag) => tagDefinitions[tag]?.notRecommended).filter(Boolean);
  analysis.specialRules.forEach((rule) => {
    if (rule.includes("不建议")) items.push(rule.replace(/^.*：/, ""));
  });
  return Array.from(new Set(items)).slice(0, 4);
}

function buildMaterialRequests(analysis) {
  const base = [
    "企业介绍、产品手册、服务说明、合作资料或品牌资料",
    "官网、公众号、视频号、小红书、抖音、直播、私域或独立站链接",
    "3 个客户最常问的问题，以及 3 个最难回答的销售 / 客服 / 合作问题",
  ];
  const byTag = {
    M: ["当前最想优先打透的目标客户、已成交客户类型和主要获客来源"],
    B: ["品牌名、包装、视觉、账号主页、企业简介和理想目标人群"],
    V: ["产品卖点、工艺 / 产地 / 团队 / 资源说明，以及客户选择你的真实原因"],
    T: ["1-3 个真实客户案例、复购记录、转介绍、评价截图、资质或交付证明"],
    C: ["近 10 条内容样本、账号链接、直播脚本、私域内容或线下资料"],
    S: ["咨询流程、报价 / 预约 / 到店 / 合作路径、销售话术和线索记录方式"],
    K: ["案例库、话术库、素材库、PPT、聊天记录、网盘资料和 AI 提示词样本"],
    G: ["目标地区、目标客户类型、活动 / 展会资料、多语言资料或海外咨询记录"],
    H: ["已有内容复盘、销售数据、客户反馈和希望共创的业务目标"],
  };
  const tags = [analysis.primaryTag, analysis.secondaryTag].filter(Boolean);
  const materials = [...base];
  tags.forEach((tag) => materials.push(...(byTag[tag] || [])));
  return Array.from(new Set(materials)).slice(0, 7);
}

function buildConsultingHooks(analysis, submission) {
  const primary = tagDefinitions[analysis.primaryTag] || tagDefinitions.M;
  const hooks = [
    `你们现在最值得验证的是：客户是否真的能在 10 秒内说清「你是谁、适合谁、为什么值得信」。`,
    `建议带着现有官网/账号/销售资料做一次会后诊断，SHUNSE 可以判断「${primary.name}」应不应该成为第一阶段切入点。`,
  ];

  if (analysis.combination) {
    hooks.push(`如果你们的实际资料也符合「${analysis.combination.name}」，后续商单更适合从「${analysis.combination.action}」切入。`);
  }
  if ((submission.businessGoal || "").trim()) {
    hooks.push(`围绕你填写的目标「${submission.businessGoal}」，下一步可以拆成资料、内容、承接三类改造清单。`);
  }

  return hooks.slice(0, 4);
}

function inferConsultationSignal(profile, primaryTag, submission) {
  if ((profile.counts.H || 0) >= 5) return "高潜共创";
  if (primaryTag === "G" || submission.newMarketPlan === "overseas") return "新市场专项";
  if ((profile.counts.K || 0) >= 2) return "资料库 / AI 底盘优先";
  if ((profile.counts.M || 0) >= 2 || (profile.counts.B || 0) + (profile.counts.V || 0) >= 3) return "适合 30 天表达打底";
  return "适合轻量诊断";
}

function combinationKey(left, right) {
  const direct = `${left}+${right}`;
  const reverse = `${right}+${left}`;
  if (combinationDiagnosis[direct]) return direct;
  if (combinationDiagnosis[reverse]) return reverse;
  return direct;
}

function applyLegacySignals(counts, submission) {
  if (!submission.customerSegments || asArray(submission.trustConcerns).length >= 3) counts.M += 1;
  if (asArray(submission.brandIssues).length) counts.B += 1;
  if (asArray(submission.brandIssues).includes("value-unclear")) counts.V += 1;
  if (asArray(submission.trustConcerns).length || submission.proofCase) counts.T += 1;
  if (asArray(submission.contentProblems).length) counts.C += 1;
  if (asArray(submission.salesAssets).length < 2) counts.S += 1;
  if (asArray(submission.aiStatus).length) counts.K += 1;
  if (submission.overseasNeed === "yes" || submission.newMarketPlan === "overseas") counts.G += 1;
}

function scoreProfile(profile) {
  const answered = Math.max(profile.selected.length, 1);
  const highPotential = profile.counts.H || 0;
  const issueTotal = Object.entries(profile.counts)
    .filter(([tag]) => tag !== "H")
    .reduce((sum, [, count]) => sum + count, 0);
  const dominantIssue = Math.max(
    0,
    ...Object.entries(profile.counts)
      .filter(([tag]) => tag !== "H")
      .map(([, count]) => count),
  );
  const completenessBonus = Math.min(answered, 10);
  const score = 64 + highPotential * 4 + completenessBonus - issueTotal * 1.6 - dominantIssue * 1.5;
  return Math.max(45, Math.min(92, Math.round(score)));
}

function reportLevel(score, profile) {
  if ((profile.counts.H || 0) >= 5 || score >= 78) return "认知资产基础较稳，可进入系统化增长";
  if (score >= 62) return "已有业务基础，需要补齐关键认知断层";
  return "建议先做线上认知底盘重建";
}

function buildFindings(submission, profile, intentions, newMarketPlan, analysis) {
  const topIssue = profile.dominantTags.find((item) => item.tag !== "H");
  const highPotentialCount = profile.counts.H || 0;
  const findings = [
    intentions.length
      ? `当前经营意图集中在：${intentions.join("、")}。`
      : "当前经营意图尚未明确，建议先确认最想突破的业务目标。",
    submission.businessGoal
      ? `填写的经营目标：${submission.businessGoal}`
      : submission.shunseQuestion
        ? `希望 SHUNSE 判断的问题：${submission.shunseQuestion}`
        : "本次自测还缺少一句话经营目标，后续访谈需要补充。",
    `自测标签分布：${profile.summary}。`,
  ];

  if (topIssue) {
    findings.push(`最集中的断层是「${topIssue.name}」：${tagDefinitions[topIssue.tag].diagnosis}`);
    findings.push(`客户真实感受通常是：「${tagDefinitions[topIssue.tag].customerFeeling}」`);
  }

  if (analysis.combination) {
    findings.push(`组合诊断：${analysis.combination.name}。${analysis.combination.summary}`);
  }

  if (highPotentialCount >= 3) {
    findings.push(`同时出现 ${highPotentialCount} 个高潜基础信号，说明企业已有部分可沉淀资产，适合进入系统化整理和复盘。`);
  }

  if (submission.newMarketPlan && submission.newMarketPlan !== "none") {
    findings.push(`新市场计划：${newMarketPlan}。如果要跨城市、圈层、平台或海外，表达需要重新组织理解路径和信任路径。`);
  }

  findings.push(...analysis.specialRules);

  return findings;
}

function buildRecommendations(firstTag, profile, mode, submission, analysis) {
  const issueTags = profile.dominantTags.filter((item) => item.tag !== "H").slice(0, 3);
  const recommendations = issueTags.length
    ? issueTags.map((item) => tagDefinitions[item.tag].recommendation)
    : [tagDefinitions.H.recommendation];

  recommendations.unshift(`第一阶段优先解决：${tagDefinitions[firstTag]?.name || "线上认知资产打底"}。`);
  if (analysis.combination) {
    recommendations.push(`组合策略建议：${analysis.combination.action}。`);
  }
  recommendations.push(`建议进入：${mode}。`);

  if (submission.newMarketPlan === "overseas" || issueTags.some((item) => item.tag === "G")) {
    recommendations.push("涉及海外或跨语境表达时，不要只做翻译，应重组目标客户的理解、信任和行动路径。");
  }

  recommendations.push("会后咨询重点不是马上报价做执行，而是先确认真实资料能不能支撑客户理解、信任和行动。");

  return recommendations;
}

function buildDimensions(profile, submission) {
  return Object.entries(tagDefinitions).map(([tag, definition]) => {
    const count = profile.counts[tag] || 0;
    const priority = count >= 2 ? "高" : count === 1 ? "中" : tag === "H" && (profile.counts.H || 0) >= 3 ? "高" : "低";
    const selected = profile.selected.filter((item) => item.tag === tag).slice(0, 2);
    const conclusion = selected.length
      ? `${selected.map((item) => item.label).join("；")}。`
      : tag === "G" && submission.newMarketPlan && submission.newMarketPlan !== "none"
        ? "有新市场计划，建议进一步检查是否需要重组目标客户理解路径。"
        : "本轮自测未暴露明显问题，后续可结合资料继续核验。";

    return { name: definition.dimension, priority, conclusion };
  });
}

function buildRoadmap(firstTag, submission) {
  const definition = tagDefinitions[firstTag] || tagDefinitions.M;
  return [
    {
      period: "0-30 天",
      title: "认知底盘打底",
      actions: [
        `围绕「${definition.name}」完成问题定义和资料盘点。`,
        "整理企业介绍、产品优势、客户案例、常见异议和现有内容触点。",
        "形成一页式线上认知主线：适合谁、解决什么、凭什么信、下一步怎么开始。",
      ],
    },
    {
      period: "31-60 天",
      title: "内容与承接统一",
      actions: [
        "把官网、账号、私域、销售资料和线下介绍统一到同一条认知主线。",
        "补齐 FAQ、案例证据、资料包、咨询路径和线索记录字段。",
        submission.newMarketPlan === "overseas"
          ? "同步重构目标海外市场的表达语境和信任证据。"
          : "先跑通当前主要客户来源的内容到咨询承接。",
      ],
    },
    {
      period: "61-90 天",
      title: "资料库与 SHUNSE Pulse",
      actions: [
        "沉淀企业资料库、案例库、话术库、内容复盘库和审核标准。",
        "将高频内容、销售问答和客户反馈整理成可复用 AI 工作流。",
        "按月更新 SHUNSE Pulse，持续校准市场、人群、表达和承接结果。",
      ],
    },
  ];
}

function buildBoundaries(submission) {
  const boundaries = [
    "本报告是沙龙自测初诊，不替代深度访谈、资料审计和真实业务数据复盘。",
    "不承诺立即带来成交增长，优先解决客户理解、信任和行动路径问题。",
    "如果缺少真实案例、销售记录和客户反馈，诊断结论需要后续复核。",
  ];

  if (submission.newMarketPlan === "overseas" || submission.overseasNeed === "yes") {
    boundaries.push("出海或跨语境表达不能只翻译中文资料，需要按目标市场语境重写信任证据。");
  }

  return boundaries;
}

function inferCooperationMode(submission, firstTag) {
  const rawModes = asArray(submission.cooperationModes);
  if (rawModes.includes("need-shunse-judge")) return cooperationModeLabels["online-diagnosis"];
  const selectedModes = mapValues(submission.cooperationModes, cooperationModeLabels);
  if (selectedModes.length) return selectedModes[0];
  if (firstTag === "G" || submission.newMarketPlan === "overseas") return cooperationModeLabels["overseas-rebuild"];
  if (firstTag === "K" || firstTag === "H") return cooperationModeLabels["monthly-pulse"];
  if (["M", "B", "V"].includes(firstTag)) return cooperationModeLabels["30-day-foundation"];
  return cooperationModeLabels["90-day-engine"];
}

function inferLegacyTag(submission) {
  if (!submission.customerSegments || asArray(submission.trustConcerns).length >= 3) return "M";
  if (asArray(submission.brandIssues).includes("value-unclear")) return "V";
  if (asArray(submission.contentProblems).length) return "C";
  if (asArray(submission.salesAssets).length < 2) return "S";
  if (asArray(submission.aiStatus).length) return "K";
  if (submission.overseasNeed === "yes") return "G";
  return "B";
}

function tagSortWeight(tag) {
  return ["M", "B", "V", "T", "C", "S", "K", "G", "H"].indexOf(tag);
}

function mapValues(value, dictionary) {
  return asArray(value).map((item) => dictionary[item] || item).filter(Boolean);
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeReport(report, context) {
  return {
    title: String(report.title || "SHUNSE 企业线上认知自测报告"),
    score: Number.isFinite(Number(report.score)) ? Math.max(0, Math.min(100, Number(report.score))) : 60,
    level: String(report.level || "待评估"),
    executiveSummary: String(report.executiveSummary || report.summary || "暂无摘要。"),
    analysisSummary: Array.isArray(report.analysisSummary) ? report.analysisSummary : [],
    comboDiagnosis: report.comboDiagnosis || null,
    customerFeeling: String(report.customerFeeling || ""),
    brandManagementInsight: String(report.brandManagementInsight || ""),
    findings: normalizeList(report.findings),
    recommendations: normalizeList(report.recommendations),
    nextSteps: normalizeList(report.nextSteps),
    dimensions: Array.isArray(report.dimensions) ? report.dimensions : [],
    path: Array.isArray(report.path) ? report.path : [],
    servicePath: report.servicePath || null,
    notRecommended: normalizeList(report.notRecommended),
    materialRequests: normalizeList(report.materialRequests),
    consultingHooks: normalizeList(report.consultingHooks),
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
