export const groups = [
  "品牌基础",
  "内容与传播",
  "广告与转化",
  "竞品、舆情和市场",
  "会员与品牌忠诚",
];
const field = (
  key,
  label,
  type = "text",
  value = "",
  options = null,
  extra = {},
) => ({ key, label, type, value, options, required: true, ...extra });
export const catalog = [
  {
    id: "persona",
    name: "目标受众深度画像",
    desc: "让模糊的客群，成为具体的人。",
    ref: "persona-builder",
    next: "tov",
    fields: [
      field("product", "产品 / 服务", "text", "随行保温杯"),
      field("category", "品类", "select", "生活家居", [
        "生活家居",
        "美妆护理",
        "食品饮品",
        "服饰配件",
        "数字服务",
      ]),
      field("price", "售价（元）", "number", 199),
      field("audience", "目标人群", "text", "25–35 岁城市通勤者"),
      field(
        "pain",
        "主要痛点",
        "textarea",
        "通勤携带不便；饮品容易变凉；重视设计但不想溢价",
      ),
      field("goal", "营销目的", "select", "促进购买", [
        "促进购买",
        "建立认知",
        "教育市场",
      ]),
      field(
        "difference",
        "产品差异",
        "textarea",
        "轻量杯身，单手开盖，简约配色",
      ),
    ],
  },
  {
    id: "brand",
    name: "品牌档案",
    desc: "统一定位、价值与表达的起点。",
    ref: "brand-profile",
    next: "persona",
    fields: [
      field("name", "品牌名称", "text", "栖日 QIRI"),
      field("category", "品牌品类", "text", "日常生活用品"),
      field(
        "position",
        "品牌定位",
        "textarea",
        "为城市通勤者提供轻盈、耐用、有设计感的日用品。",
      ),
      field("audience", "核心受众", "text", "25–35 岁城市通勤者"),
      field(
        "values",
        "品牌价值（分号分隔）",
        "textarea",
        "轻盈日常；耐用设计；理性消费",
      ),
      field("banned", "禁用词（逗号分隔）", "text", "第一,最好,绝对,治愈"),
      field("signature", "品牌短句", "text", "让每一天，轻一点。"),
    ],
  },
  {
    id: "tov",
    name: "品牌语气 TOV",
    desc: "找到品牌独有的说话方式。",
    ref: "tov-designer",
    next: "copy",
    fields: [
      field("tone", "主语气", "select", "温暖自然", [
        "温暖自然",
        "专业理性",
        "活泼轻快",
      ]),
      field("friendly", "专业 → 亲切", "range", 75, null, { min: 0, max: 100 }),
      field("casual", "正式 → 随性", "range", 65, null, { min: 0, max: 100 }),
      field("humor", "严肃 → 幽默", "range", 30, null, { min: 0, max: 100 }),
      field("innovative", "传统 → 创新", "range", 60, null, {
        min: 0,
        max: 100,
      }),
      field("preferred", "推荐用词", "text", "轻一点、陪伴、日常"),
      field("banned", "额外禁用词（逗号分隔）", "text", "全网最低,秒杀", null, {
        required: false,
      }),
    ],
  },
  {
    id: "copy",
    name: "电商文案生成",
    desc: "把产品价值，写进购买理由。",
    ref: "copywriter",
    next: "matrix",
    fields: [
      field("product", "产品名称", "text", "轻行随行保温杯"),
      field(
        "features",
        "卖点（分号分隔）",
        "textarea",
        "320g 轻量杯身；单手开盖；500ml 容量",
      ),
      field("price", "售价（元）", "number", 199),
      field("platform", "发布平台", "select", "商品详情页", [
        "商品详情页",
        "小红书",
        "淘宝",
        "Instagram",
      ]),
      field("goal", "营销目的", "select", "促进购买", [
        "促进购买",
        "建立认知",
        "教育市场",
      ]),
      field("offer", "优惠 / 行动指引", "text", "了解三款日常配色", null, {
        required: false,
      }),
    ],
  },
  {
    id: "matrix",
    name: "内容矩阵规划",
    desc: "让每一类客群都有值得看的内容。",
    ref: "content-matrix",
    next: "social",
    fields: [
      field("product", "产品 / 服务", "text", "轻行随行保温杯"),
      field("price", "售价（元）", "number", 199),
      field(
        "segments",
        "客群（每行一个，最多 8 个）",
        "textarea",
        "城市通勤者\n周末出游者\n品质生活爱好者",
      ),
      field("goal", "营销目的", "select", "建立认知", [
        "建立认知",
        "促进购买",
        "教育市场",
      ]),
    ],
  },
  {
    id: "social",
    name: "社群贴文生成",
    desc: "适合不同平台的自然表达。",
    ref: "social-post",
    next: "kpi",
    fields: [
      field("product", "产品名称", "text", "轻行随行保温杯"),
      field(
        "features",
        "内容主题 / 卖点",
        "textarea",
        "早八通勤，单手开盖，轻装出发",
      ),
      field("platform", "社群平台", "select", "小红书", [
        "小红书",
        "Instagram",
        "Facebook",
        "LINE",
        "Threads",
      ]),
      field("goal", "营销目的", "select", "建立认知", [
        "建立认知",
        "促进购买",
        "教育市场",
      ]),
      field("offer", "行动指引", "text", "留言分享你的通勤小习惯"),
    ],
  },
  {
    id: "kpi",
    name: "投放前 KPI 试算",
    desc: "先算清楚，再做投放决定。",
    ref: "kpi-calc",
    next: "diagnose",
    fields: [
      field("budget", "投放预算（元）", "number", 60000),
      field("cpc", "平均 CPC（元 / 点击）", "number", 8, null, { min: 0.01 }),
      field("cvr", "转化率 CVR（%）", "number", 1.5, null, { max: 100 }),
      field("aov", "客单价（元 / 订单）", "number", 1200),
      field("margin", "毛利率（%）", "number", 40, null, { max: 100 }),
    ],
  },
  {
    id: "diagnose",
    name: "Meta 广告健检",
    desc: "从关键指标找到优化方向。",
    ref: "ad-diagnoser",
    next: "roas",
    fields: [
      field("campaign", "广告活动名称", "text", "栖日秋季新品"),
      field("budget", "每日预算（元）", "number", 2000),
      field("days", "已投放天数", "number", 7, null, { min: 1 }),
      field("cpa", "每单广告成本 CPA（元）", "number", 120),
      field("roas", "实际 ROAS（倍）", "number", 2.4),
      field("ctr", "点击率 CTR（%）", "number", 0.8, null, { max: 100 }),
      field("margin", "毛利率（%）", "number", 40, null, { max: 100 }),
      field("targetCtr", "自定 CTR 目标（%）", "number", 1.2, null, {
        min: 0.01,
        max: 100,
      }),
      field("targetCpa", "自定 CPA 上限（元）", "number", 100, null, {
        min: 0.01,
      }),
    ],
  },
  {
    id: "roas",
    name: "广告 ROAS 计算",
    desc: "看见回报，也看清成本。",
    ref: "ad-calc",
    next: "competitor",
    fields: [
      field("spend", "广告花费（元）", "number", 30000),
      field("revenue", "归因营收（元）", "number", 90000),
      field("margin", "商品毛利率（%）", "number", 40, null, { max: 100 }),
      field("other", "其他已知变动成本（元）", "number", 3000),
    ],
  },
  {
    id: "competitor",
    name: "竞品监控雷达",
    desc: "在对比中找到差异化空间。",
    ref: "competitor",
    next: "sentiment",
    fields: [
      field("brand", "我方品牌", "text", "栖日 QIRI"),
      field("price", "我方售价（元）", "number", 199),
      field("strength", "我方差异化", "text", "轻量杯身与单手开盖"),
      field(
        "competitors",
        "虚构竞品：品牌,价格,评分（每行一个）",
        "textarea",
        "山屿,239,4.5\n澄物,179,4.2\n慢岸,299,4.7",
      ),
    ],
  },
  {
    id: "sentiment",
    name: "社群舆情分析",
    desc: "从评论中听见真实的需求。",
    ref: "sentiment-analyzer",
    next: "radar",
    fields: [
      field("brand", "分析品牌", "text", "栖日 QIRI"),
      field("source", "评论来源类型", "select", "用户粘贴（未经核实）", [
        "用户粘贴（未经核实）",
        "虚构示例",
        "Instagram",
        "Facebook",
        "Threads",
        "小红书",
      ]),
      field(
        "comments",
        "评论（每行一条，最多 12,000 字）",
        "textarea",
        "喜欢这个配色，好看又轻便\n价格有点贵，希望有优惠\n收到的杯盖漏水，客服没有回复\n容量是多少？\n已经推荐给同事，满意\n不好用，开盖有点卡",
        null,
        { maxLength: 12000 },
      ),
    ],
  },
  {
    id: "radar",
    name: "社群舆情雷达",
    desc: "用演示趋势提前识别话题变化。",
    ref: "trend",
    next: "scv",
    fields: [
      field("brand", "监测品牌", "text", "栖日 QIRI"),
      field("topic", "监测话题", "text", "通勤保温杯"),
      field("baseline", "模拟日均提及量（条）", "number", 120),
      field("growth", "模拟七日增幅（%）", "number", 35, null, {
        min: -100,
        max: 500,
      }),
      field("negative", "模拟负面比例（%）", "number", 18, null, { max: 100 }),
      field("threshold", "负面预警阈值（%）", "number", 25, null, {
        min: 1,
        max: 100,
      }),
    ],
  },
  ...["scv", "rfm", "dashboard"].map((id, i) => ({
    id,
    name: ["SCV 会员视图", "会员 RFM 分群", "会员指标看板"][i],
    desc: [
      "将分散订单汇成一个会员视图。",
      "找到高价值、成长与流失客群。",
      "用同一份数据理解经营表现。",
    ][i],
    ref: ["scv", "rfm", "member-dashboard"][i],
    next: ["rfm", "dashboard", "home"][i],
    fields: [
      field("reference", "分析截止日期", "date", "2026-09-17"),
      field("recent", "近期活跃阈值（天）", "number", 60, null, { min: 1 }),
      field("frequency", "高频阈值（有效订单数）", "number", 3, null, {
        min: 1,
      }),
      field("monetary", "高消费阈值（元）", "number", 600),
      field("refund", "退单处理方式", "select", "整单排除", [
        "整单排除",
        "净额扣减",
      ]),
    ],
  })),
];
export const byId = Object.fromEntries(catalog.map((t) => [t.id, t]));
export const defaults = (id) =>
  Object.fromEntries(byId[id].fields.map((f) => [f.key, f.value]));
export const num = (v) =>
  new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(v);
const n = (v) => Number(v);
const m = (label, value, unit = "") => ({
  label,
  value: value == null ? "—" : typeof value === "number" ? num(value) : value,
  unit,
});
const sec = (title, text) => ({ title, text });
const tbl = (title, headers, rows) => ({ title, headers, rows });
const result = (
  title,
  kind,
  metrics = [],
  sections = [],
  tables = [],
  bars = [],
) => ({ title, kind, metrics, sections, tables, bars });
export function validate(id, v) {
  const errors = [];
  for (const f of byId[id].fields) {
    const x = v[f.key];
    if (f.required && (x == null || String(x).trim() === ""))
      errors.push(f.label + "不能为空");
    if (
      ["number", "range"].includes(f.type) &&
      (!Number.isFinite(n(x)) || n(x) < (f.min ?? 0) || n(x) > (f.max ?? 1e12))
    )
      errors.push(f.label + "超出有效范围");
    if (String(x ?? "").length > (f.maxLength ?? 3000))
      errors.push(f.label + "内容过长");
  }
  return errors;
}
export function kpi(v) {
  const clicks = v.budget / v.cpc,
    orders = (clicks * v.cvr) / 100,
    revenue = orders * v.aov,
    gross = (revenue * v.margin) / 100;
  return {
    clicks,
    orders,
    revenue,
    gross,
    cpa: orders > 0 ? v.budget / orders : null,
    roas: v.budget > 0 ? revenue / v.budget : null,
    contribution: gross - v.budget,
    breakCpa: (v.aov * v.margin) / 100,
  };
}
export function roas(v) {
  const gross = (v.revenue * v.margin) / 100;
  return {
    roas: v.spend > 0 ? v.revenue / v.spend : null,
    gross,
    contribution: gross - v.spend - v.other,
    breakRevenue: v.margin > 0 ? (v.spend + v.other) / (v.margin / 100) : null,
  };
}
function clean(text, ctx, v = {}) {
  const terms = [ctx.brand?.banned, ctx.tov?.banned, v.banned]
    .filter(Boolean)
    .join(",")
    .split(/[,，;；\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
  for (const word of terms) text = text.split(word).join("〔措辞已调整〕");
  return text;
}
function voice(ctx) {
  const t = ctx.tov || {};
  return t.tone === "专业理性"
    ? "从日常需求出发，关注具体功能与使用条件。"
    : t.tone === "活泼轻快"
      ? "今天也要轻装出发！给日常加一点小惊喜。"
      : "忙碌的日子里，也给自己留一点从容。";
}
export function analyzeComments(text) {
  const comments = text
    .split(/\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  return comments.map((text) => {
    const neg = (
      text.match(
        /不喜欢|不好|不满意|不推荐|不好用|漏水|贵|失望|差|投诉|卡|退款|没有回复|坏|诈骗|过敏|受伤/g,
      ) || []
    ).length;
    const pos = (
      text
        .replace(/不喜欢|不好|不满意|不推荐|不好用/g, "")
        .match(/喜欢|好看|满意|推荐|轻便|舒服|方便|好用/g) || []
    ).length;
    return {
      text,
      emotion: neg > pos ? "负面" : pos > neg ? "正面" : "中性",
      crisis: /诈骗|过敏|受伤|安全|起火/.test(text),
    };
  });
}
export const sampleOrders = () => {
  const out = [];
  for (let i = 1; i <= 18; i++) {
    for (let j = 0; j < 1 + (i % 5); j++) {
      const days = i * 5 + j * 31;
      const d = new Date(Date.UTC(2026, 8, 17) - days * 86400000)
        .toISOString()
        .slice(0, 10);
      out.push({
        order_id: `Q${i}-${j}`,
        email: `demo${i}@example.test`,
        name: `演示会员 ${String(i).padStart(2, "0")}`,
        phone: "",
        date: d,
        amount: 199 + (i % 3) * 100,
        status: "completed",
        refund_amount: 0,
        channel: j % 2 ? "小程序" : "商城",
      });
    }
  }
  out.push(
    { ...out[0], order_id: "CANCEL-1", status: "cancelled" },
    {
      ...out[1],
      order_id: "REFUND-1",
      status: "refunded",
      refund_amount: out[1].amount,
    },
    {
      ...out[2],
      order_id: "PARTIAL-1",
      status: "partial_refund",
      refund_amount: 50,
    },
  );
  return out;
};
export function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (!quoted && cell.length) throw Error("CSV 引号位置不正确");
      else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("CSV 存在未闭合的引号");
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  if (rows.length < 2) throw Error("CSV 至少需要标题和一条数据");
  const headers = rows.shift().map((x) => x.trim());
  if (new Set(headers).size !== headers.length) throw Error("CSV 标题不能重复");
  return { headers, rows };
}
export const mappings = {
  email: ["email", "邮箱", "電子郵件"],
  date: ["date", "日期", "订单日期"],
  amount: ["amount", "金额", "金額", "订单金额"],
  order_id: ["order_id", "订单号"],
  name: ["name", "姓名"],
  phone: ["phone", "电话"],
  status: ["status", "状态"],
  refund_amount: ["refund_amount", "退款金额"],
  channel: ["channel", "渠道"],
};
export function autoMap(headers) {
  return Object.fromEntries(
    Object.entries(mappings).map(([k, aliases]) => [
      k,
      headers.find((h) => aliases.includes(h.toLowerCase())) || "",
    ]),
  );
}
const validDate = (d) =>
  /^\d{4}-\d{2}-\d{2}$/.test(d) &&
  !Number.isNaN(Date.parse(d)) &&
  new Date(d).toISOString().slice(0, 10) === d;
export function importOrders(parsed, map) {
  for (const k of ["email", "date", "amount"])
    if (!map[k]) throw Error("缺少必需字段映射：" + k);
  const selected = Object.values(map).filter(Boolean);
  if (new Set(selected).size !== selected.length)
    throw Error("每个源字段只能映射一次");
  const good = [],
    errors = [],
    ids = new Set();
  parsed.rows.forEach((cells, i) => {
    const v = Object.fromEntries(
      Object.entries(map).map(([k, h]) => [
        k,
        h ? (cells[parsed.headers.indexOf(h)] ?? "").trim() : "",
      ]),
    );
    const e = [];
    if (cells.length !== parsed.headers.length) e.push("列数与标题不一致");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.push("邮箱无效");
    if (!validDate(v.date)) e.push("日期须为有效 YYYY-MM-DD");
    if (
      v.amount === "" ||
      !Number.isFinite(Number(v.amount)) ||
      Number(v.amount) < 0
    )
      e.push("金额必须为非负数字");
    if (
      v.refund_amount !== "" &&
      (!Number.isFinite(Number(v.refund_amount)) ||
        Number(v.refund_amount) < 0 ||
        Number(v.refund_amount) > Number(v.amount))
    )
      e.push("退款金额需介于 0 与订单金额之间");
    const status = v.status.toLowerCase() || "completed";
    if (
      ![
        "completed",
        "paid",
        "cancelled",
        "canceled",
        "refunded",
        "partial_refund",
        "已完成",
        "已付款",
        "已取消",
        "已退款",
        "部分退款",
      ].includes(status)
    )
      e.push("未知订单状态：" + status);
    if (v.order_id && ids.has(v.order_id)) e.push("重复订单号");
    if (v.order_id) ids.add(v.order_id);
    if (e.length) errors.push({ line: i + 2, reason: e.join("；") });
    else
      good.push({
        ...v,
        email: v.email.toLowerCase(),
        amount: Number(v.amount),
        refund_amount: Number(v.refund_amount || 0),
        status,
      });
  });
  return { orders: good, errors };
}
export function members(orders, v) {
  if (!validDate(v.reference)) throw Error("分析截止日期无效");
  const people = new Map();
  let excluded = 0,
    future = 0,
    refunds = 0,
    count = 0,
    revenue = 0;
  for (const o of orders) {
    if (o.date > v.reference) {
      future++;
      continue;
    }
    if (["cancelled", "canceled", "已取消"].includes(o.status)) {
      excluded++;
      continue;
    }
    const full = ["refunded", "已退款"].includes(o.status),
      partial =
        ["partial_refund", "部分退款"].includes(o.status) ||
        o.refund_amount > 0;
    if ((full || partial) && v.refund === "整单排除") {
      excluded++;
      continue;
    }
    const refund = full ? o.amount : o.refund_amount || 0;
    refunds += refund;
    const amount = o.amount - refund;
    if (amount <= 0) {
      excluded++;
      continue;
    }
    count++;
    revenue += amount;
    const p = people.get(o.email) || {
      email: o.email,
      name: o.name || "未命名",
      first: o.date,
      last: o.date,
      F: 0,
      M: 0,
    };
    p.F++;
    p.M += amount;
    p.first = p.first < o.date ? p.first : o.date;
    p.last = p.last > o.date ? p.last : o.date;
    people.set(o.email, p);
  }
  const rows = [...people.values()].map((p) => {
    const R = Math.floor(
        (Date.parse(v.reference) - Date.parse(p.last)) / 86400000,
      ),
      rh = R <= Number(v.recent),
      fh = p.F >= Number(v.frequency),
      mh = p.M >= Number(v.monetary);
    const key = `${+rh}${+fh}${+mh}`,
      names = {
        111: "核心价值",
        110: "高频成长",
        101: "潜力大客",
        100: "新近培育",
        "011": "重点挽回",
        "010": "沉睡常客",
        "001": "流失大客",
        "000": "低频沉睡",
      };
    return { ...p, R, score: key, group: names[key] };
  });
  return {
    rows,
    excluded,
    future,
    refunds,
    count,
    revenue,
    aov: count ? revenue / count : 0,
    repeat: rows.length
      ? (rows.filter((p) => p.F > 1).length / rows.length) * 100
      : 0,
    active: rows.length
      ? (rows.filter((p) => p.R <= v.recent).length / rows.length) * 100
      : 0,
  };
}
export function generate(id, raw, ctx = {}, orders = sampleOrders()) {
  const errors = validate(id, raw);
  if (errors.length) throw Error(errors.join("；"));
  const v = { ...raw };
  for (const f of byId[id].fields)
    if (["number", "range"].includes(f.type)) v[f.key] = Number(v[f.key]);
  let r;
  const brand = ctx.brand?.name || "未设定品牌",
    persona = ctx.persona || {},
    tov = ctx.tov || {};
  if (id === "brand")
    r = result(
      v.name + " · 品牌档案",
      "输入整理",
      [],
      [
        sec("品牌定位", v.position),
        sec("受众与价值", `${v.audience}\n${v.values}`),
        sec(
          "表达约束",
          `品牌短句：${v.signature}\n禁用词：${v.banned}\n保存后供 Persona、TOV、内容工具使用。`,
        ),
      ],
    );
  if (id === "persona")
    r = result(
      v.audience + " · 受众画像",
      "规则模拟",
      [],
      [
        sec(
          "人物轮廓",
          `${v.audience}，关注${v.category}。在选择${v.product}（¥${num(v.price)}）时，希望获得：${v.difference}。\n这是根据输入构建的假设画像，不是调研结论。`,
        ),
        sec(
          "痛点与购买动机",
          `${v.pain}\n沟通目标：${v.goal}。将每一个卖点对应到一个具体使用场景。`,
        ),
        sec(
          "触达与内容建议",
          `先用使用场景解释${v.product}的价值，再用可核实参数帮助比较。\n在目标客群常用平台做小样本访谈与内容测试，不预设其年龄、收入或平台偏好为事实。`,
        ),
      ],
    );
  if (id === "tov")
    r = result(
      brand + " · 表达指南",
      "规则模拟",
      [
        m("亲切度", v.friendly, "%"),
        m("随性度", v.casual, "%"),
        m("幽默度", v.humor, "%"),
        m("创新度", v.innovative, "%"),
      ],
      [
        sec(
          "语气原则",
          `${v.tone}；${v.friendly >= 50 ? "用第二人称建立陪伴感" : "优先说明事实和依据"}；${v.casual >= 50 ? "短句与日常语言" : "完整句式与清晰层次"}；${v.humor >= 50 ? "允许轻度俏皮，不消费痛点" : "不使用夸张玩笑"}；${v.innovative >= 50 ? "尝试新场景与新比喻" : "使用熟悉、稳定的表达"}。\n推荐词：${v.preferred}`,
        ),
        sec(
          "表达示例",
          clean(
            `${voice({ tov: v })}\n${ctx.brand?.signature || "让日常更从容。"}\n${v.preferred.split(/[、,，]/)[0]}，从一个小选择开始。`,
            ctx,
            v,
          ),
        ),
        sec(
          "禁用与检查",
          `${[ctx.brand?.banned, v.banned].filter(Boolean).join("，") || "未设置"}\n避免无法核实的效果承诺；具体参数以产品证据为准。`,
        ),
      ],
    );
  if (id === "copy" || id === "social") {
    const platforms = {
      商品详情页: "主标题 → 功能参数 → 场景 → 行动",
      淘宝: "品名与规格 → 卖点 → 购买信息",
      小红书: "场景开头 → 体验要点 → 互动问题",
      Instagram: "短段落 → 视觉建议 → 标签",
      Facebook: "故事 → 价值说明 → 讨论",
      LINE: "简短消息 → 单一行动",
      Threads: "一句观点 → 一段场景 → 一个问题",
    };
    const opening =
      tov.friendly >= 50 ? "给你一个更从容的选择。" : "产品信息与使用建议。";
    const body = clean(
      `${id === "copy" ? v.product + "｜" + (tov.preferred || "轻盈日常") : v.platform + " · " + v.product}\n\n${voice(ctx)} ${opening}\n\n面向${persona.audience || ctx.brand?.audience || "重视日常品质的人"}：${persona.pain || "让选择更简单，让使用更顺手"}。\n${v.features
        .split(/[；;\n]/)
        .filter(Boolean)
        .map((x) => "• " + x)
        .join(
          "\n",
        )}\n\n${v.price != null ? "参考售价 ¥" + num(v.price) + "。 " : ""}${v.goal === "促进购买" ? "比较需求与规格，再选择适合自己的款式。" : v.goal === "教育市场" ? "先了解这些功能分别适合什么场景。" : "从一个日常场景，认识" + brand + "。"}\n${v.offer || "了解更多产品信息"}\n${ctx.brand?.signature || ""}\n${["小红书", "Instagram", "Threads"].includes(v.platform) ? "#" + v.product.replace(/\s/g, "") + " #日常灵感" : ""}`,
      ctx,
    );
    r = result(
      v.product + " · " + v.platform,
      "规则模拟",
      [],
      [
        sec("可编辑文案", body),
        sec(
          "平台与语气说明",
          `${platforms[v.platform]}\n主语气：${tov.tone || "温暖自然"}；随性 ${tov.casual ?? 50}/100，幽默 ${tov.humor ?? 30}/100，创新 ${tov.innovative ?? 50}/100。\n${tov.casual >= 50 ? "使用短句排版。" : "保持完整说明。"}${tov.humor >= 50 ? "可加入轻松提问：今天你轻装了吗？" : ""}${tov.innovative >= 50 ? "建议尝试「通勤包减负」创意视角。" : ""}`,
        ),
        sec(
          "发布前核验",
          "这不是模型输出。卖点来自输入，未核实产品功效、资质或库存；发布前请检查事实、措辞与平台规范。",
        ),
      ],
    );
  }
  if (id === "matrix") {
    const seg = v.segments
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (seg.length > 8) throw Error("客群最多 8 个");
    const formats = [
      "开发邮件",
      "LINE 消息",
      "电话开场",
      "一页提案",
      "口碑分享",
    ];
    r = result(
      v.product + " · 内容矩阵",
      "规则模拟",
      [m("客群", seg.length, "类"), m("内容单元", seg.length * 5, "个")],
      [
        sec(
          "策略说明",
          `围绕${v.goal}，向不同客群传达 ¥${num(v.price)} 的${v.product}。可按客群、内容形式筛选，并单独复制每个单元。`,
        ),
      ],
      [
        tbl(
          "客群 × 内容形式",
          ["客群", "形式", "内容建议"],
          seg.flatMap((s) =>
            formats.map((f, j) => [
              s,
              f,
              clean(
                `${s}的${["日常困扰", "使用场景", "选择顾虑", "需求与价值", "真实体验"][j]}：${v.product}如何提供帮助？${voice(ctx)} 聚焦${persona.pain || "具体使用需求"}。${v.goal === "促进购买" ? "引导了解 ¥" + num(v.price) + " 的规格与购买条件" : "先提供有用信息，再介绍品牌"}。`,
                ctx,
              ),
            ]),
          ),
        ),
      ],
    );
  }
  if (id === "kpi") {
    const a = kpi(v);
    r = result(
      "投放可行性试算",
      "真实计算",
      [
        m("预计点击", a.clicks, "次"),
        m("预计订单", a.orders, "单"),
        m("预计营收", a.revenue, "元"),
        m("广告 CPA", a.cpa, "元 / 单"),
        m("ROAS", a.roas, "倍"),
        m("扣广告后贡献", a.contribution, "元"),
      ],
      [
        sec(
          "计算公式",
          `点击 = 预算 ÷ CPC；订单 = 点击 × CVR；营收 = 订单 × 客单价。\n商品毛利 = 营收 × 毛利率 = ¥${num(a.gross)}。\n扣广告后贡献 = 商品毛利 − 预算，不是净利润，未计履约、工资、税费等。\n预计订单保留小数表示期望值，非承诺订单数。`,
        ),
        sec(
          "损益平衡",
          `仅考虑商品毛利与广告：盈亏平衡 CPA = 客单价 × 毛利率 = ¥${num(a.breakCpa)}。\n70% 安全 CPA = ¥${num(a.breakCpa * 0.7)}（自定安全系数，不是行业标准）。\n零转化或零预算时，无法确定的比率显示「—」。`,
        ),
      ],
      [
        tbl(
          "CVR 敏感度（其他假设不变）",
          ["CVR", "预计订单", "ROAS", "扣广告后贡献（元）"],
          [-40, -20, 0, 20, 40].map((d) => {
            const cv = Math.min(100, v.cvr * (1 + d / 100)),
              s = kpi({ ...v, cvr: cv });
            return [
              num(cv) + "%",
              num(s.orders),
              s.roas == null ? "—" : num(s.roas),
              num(s.contribution),
            ];
          }),
        ),
      ],
    );
  }
  if (id === "roas") {
    const a = roas(v);
    r = result(
      "广告回报与贡献分析",
      "真实计算",
      [
        m("广告 ROAS", a.roas, "倍"),
        m("商品毛利", a.gross, "元"),
        m("已知成本后贡献", a.contribution, "元"),
        m("平衡营收", a.breakRevenue, "元"),
      ],
      [
        sec(
          "公式与边界",
          `ROAS = 归因营收 ÷ 广告花费，不是利润率。\n商品毛利 = 归因营收 × 商品毛利率。\n贡献 = 商品毛利 − 广告花费 − 其他已知变动成本。\n平衡营收 =（广告花费 + 其他已知成本）÷ 毛利率。毛利率为 0 时无有限平衡点。\n未纳入全部固定成本、税费与归因误差，不能称为净利润。`,
        ),
      ],
      [
        tbl(
          "营收敏感度",
          ["营收变动", "归因营收（元）", "ROAS", "贡献（元）"],
          [-20, 0, 20].map((d) => {
            const s = roas({ ...v, revenue: v.revenue * (1 + d / 100) });
            return [
              d + "%",
              num(v.revenue * (1 + d / 100)),
              s.roas == null ? "—" : num(s.roas),
              num(s.contribution),
            ];
          }),
        ),
      ],
    );
  }
  if (id === "diagnose") {
    const issues = [
      v.ctr < v.targetCtr
        ? "CTR 低于自定目标：尝试一个新的素材开头，保持其余变量一致。"
        : "CTR 达到自定目标：继续观察转化质量。",
      v.cpa > v.targetCpa
        ? "CPA 高于自定上限：检查落地页与受众匹配，先做小规模测试。"
        : "CPA 未超过自定上限：仍需核对订单质量。",
      (v.roas * v.margin) / 100 < 1
        ? "商品毛利尚不足以覆盖广告费：优先复核归因、毛利与成本。"
        : "商品毛利可覆盖广告费，但不代表净盈利。",
    ];
    r = result(
      v.campaign + " · 健检报告",
      "规则模拟 + 真实比较",
      [
        m("估算累计预算", v.budget * v.days, "元"),
        m("CTR 与目标差", v.ctr - v.targetCtr, "百分点"),
        m("CPA 与上限差", v.cpa - v.targetCpa, "元"),
      ],
      [
        sec("逐项诊断", issues.map((s, i) => `${i + 1}. ${s}`).join("\n")),
        sec(
          "建议实验",
          `先验证${v.ctr < v.targetCtr ? "素材表达" : "转化路径"}。一次改变一个变量，事先约定观察窗口与止损线。\n${v.days < 7 ? "当前观察窗口较短，避免过早归因。" : "结合订单量与转化延迟检查稳定性。"}\n本工具没有连接 Meta；原因是待验证假设，不提供虚构行业基准或提升承诺。`,
        ),
      ],
    );
  }
  if (id === "competitor") {
    const lines = v.competitors.split("\n").filter((x) => x.trim());
    const rows = lines.map((line, i) => {
      const [name, p, s] = line.split(/[,，]/).map((x) => x.trim());
      if (
        !name ||
        p === "" ||
        s === "" ||
        !Number.isFinite(+p) ||
        +p <= 0 ||
        !Number.isFinite(+s) ||
        +s < 0 ||
        +s > 5
      )
        throw Error(
          "竞品第 " + (i + 1) + " 行格式应为：品牌,正数价格,0–5 评分",
        );
      return [name, +p, +s, +p - v.price];
    });
    if (!rows.length) throw Error("请至少输入一个竞品");
    r = result(
      v.brand + " · 竞品对比",
      "虚构示例 / 输入计算",
      [
        m("对比竞品", rows.length, "个"),
        m("我方售价", v.price, "元"),
        m("竞品均价", rows.reduce((s, r) => s + r[1], 0) / rows.length, "元"),
      ],
      [
        sec(
          "差异化建议",
          `以「${v.strength}」为待验证的沟通主张。对比价格仅反映当前输入，不代表同规格、同渠道或促销条件。\n评分仅为演示输入，没有真实样本或已验证来源；建议补充规格、采样时间、有效评论数后再决策。`,
        ),
      ],
      [
        tbl(
          "价格与评分对照",
          ["品牌", "售价（元）", "输入评分 / 5", "相对我方价差（元）"],
          rows,
        ),
      ],
      rows.map((r) => ({
        label: r[0],
        value: r[1],
        max: Math.max(v.price, ...rows.map((x) => x[1])),
        unit: "元",
      })),
    );
  }
  if (id === "sentiment") {
    const rows = analyzeComments(v.comments);
    const counts = ["正面", "中性", "负面"].map(
        (e) => rows.filter((r) => r.emotion === e).length,
      ),
      crisis = rows.filter((r) => r.crisis);
    r = result(
      v.brand + " · 评论洞察",
      "规则模拟",
      [
        m("有效评论", rows.length, "条"),
        m("正面", counts[0], "条"),
        m("负面", counts[2], "条"),
        m("风险词命中", crisis.length, "条"),
      ],
      [
        sec(
          "来源与方法",
          `来源类型：${v.source}；样本量：${rows.length}。\n本地关键词计数，做了基础否定词处理，但可能误判反讽、语境与混合情绪。不是实时舆情抓取或经验证的模型结论。`,
        ),
        sec(
          "风险与行动",
          `${crisis.length ? "优先人工核验涉及安全、过敏、诈骗等词的评论；命中不代表指控属实。" : counts[2] ? "先逐条复核负面反馈，再按产品、履约、服务分类回应。" : "样本未触发风险关键词，不能据此认定没有风险。"}\n建议保留原文与处理记录，不自动发消息。`,
        ),
      ],
      [
        tbl(
          "逐条分类（可核对原文）",
          ["评论原文", "规则情绪", "风险提示"],
          rows.map((r) => [
            r.text,
            r.emotion,
            r.crisis ? "需人工核验" : "未命中",
          ]),
        ),
      ],
      counts.map((c, i) => ({
        label: ["正面", "中性", "负面"][i],
        value: c,
        max: rows.length,
        unit: "条",
      })),
    );
  }
  if (id === "radar") {
    const seed = [...v.topic].reduce((s, c) => s + c.charCodeAt(0), 0);
    const days = Array.from({ length: 7 }, (_, i) =>
      Math.max(
        0,
        Math.round(
          v.baseline *
            (1 + ((v.growth / 100) * i) / 6) *
            (1 + (i === 0 || i === 6 ? 0 : (((seed + i * 7) % 11) - 5) / 100)),
        ),
      ),
    );
    r = result(
      v.brand + " · " + v.topic,
      "模拟趋势",
      [
        m(
          "七日模拟提及",
          days.reduce((a, b) => a + b, 0),
          "条",
        ),
        m("设定负面比例", v.negative, "%"),
        m("预警状态", v.negative >= v.threshold ? "需关注" : "阈值内"),
      ],
      [
        sec(
          "趋势解释",
          `数据来源：本地生成的虚构序列；不是抓取结果。话题影响中间日的模拟波动；增幅为首尾设定增幅。\n预警规则：负面比例 ≥ 自定阈值 ${v.threshold}%。`,
        ),
        sec(
          "建议动作",
          v.negative >= v.threshold
            ? "抽样复核负面原文，检查问题是否集中于同一产品或履约环节。模拟预警不代表真实危机。"
            : "继续记录真实样本来源和采样窗口；不要把低样本量的平稳误认为安全。",
        ),
      ],
      [
        tbl(
          "七日模拟样本",
          ["时间", "模拟提及数", "模拟负面数"],
          days.map((d, i) => [
            "D" + (i + 1),
            d,
            Math.round((d * v.negative) / 100),
          ]),
        ),
      ],
      days.map((d, i) => ({
        label: "D" + (i + 1),
        value: d,
        max: Math.max(...days),
        unit: "条",
      })),
    );
  }
  if (["scv", "rfm", "dashboard"].includes(id)) {
    const a = members(orders, v);
    const rules = `以规范化邮箱合并会员，不自动按姓名或手机号合并。\nR = 截止日期距最后有效订单的天数，≤ ${v.recent} 为高；F = 有效订单数，≥ ${v.frequency} 为高；M = 净订单金额合计，≥ ¥${v.monetary} 为高。\n三项高低组合形成 8 群（不是统计分位数）。退单模式：${v.refund}。取消单始终排除，截止日后的订单排除。全额退单不计订单次数，部分退款净额模式保留一次有效订单。\n采用订单日期口径，不是按退款发生日的现金流口径。`;
    const segments = [
      "核心价值",
      "高频成长",
      "潜力大客",
      "新近培育",
      "重点挽回",
      "沉睡常客",
      "流失大客",
      "低频沉睡",
    ];
    const actions = [
      "邀请体验新品，不默认打折",
      "交叉品类教育",
      "售后关怀与复购提醒",
      "完善使用指南",
      "核实流失原因，再小规模挽回",
      "征询需求与偏好",
      "人工关怀高消费历史客户",
      "控制触达频率",
    ];
    r = result(
      byId[id].name + " · 本地分析",
      "本地数据 / 真实计算",
      [
        m("有效会员", a.rows.length, "人"),
        m("有效订单", a.count, "单"),
        m("净订单营收", a.revenue, "元"),
        m("客单价", a.aov, "元 / 单"),
        m("复购会员率", a.repeat, "%"),
        m("近期活跃率", a.active, "%"),
      ],
      [
        sec(
          "数据口径",
          `当前数据集 ${orders.length} 行；规则排除 ${a.excluded} 行；截止日后排除 ${a.future} 行；净额模式扣减退款 ¥${num(a.refunds)}。\n客单价 = 净营收 / 有效订单；复购会员率 = ≥2 单会员 / 有效会员；活跃率 = R 达标会员 / 有效会员。全部基于已导入时间范围，不是完整历史 LTV。`,
        ),
        sec("公开分群规则", rules),
      ],
      id === "dashboard"
        ? [
            tbl(
              "渠道贡献",
              ["渠道", "净营收（元）"],
              [...new Set(orders.map((o) => o.channel || "未提供"))].map(
                (ch) => {
                  const s = members(
                    orders.filter((o) => (o.channel || "未提供") === ch),
                    v,
                  );
                  return [ch, num(s.revenue)];
                },
              ),
            ),
            tbl(
              "分群摘要",
              ["分群", "人数", "建议动作"],
              segments.map((s, i) => [
                s,
                a.rows.filter((p) => p.group === s).length,
                actions[i],
              ]),
            ),
          ]
        : id === "rfm"
          ? [
              tbl(
                "RFM 分群与动作",
                ["分群", "人数", "建议动作"],
                segments.map((s, i) => [
                  s,
                  a.rows.filter((p) => p.group === s).length,
                  actions[i],
                ]),
              ),
              tbl(
                "会员明细",
                [
                  "会员",
                  "邮箱",
                  "R（天）",
                  "F（单）",
                  "M（元）",
                  "RFM 高低码",
                  "分群",
                ],
                a.rows.map((p) => [
                  p.name,
                  p.email,
                  p.R,
                  p.F,
                  num(p.M),
                  p.score,
                  p.group,
                ]),
              ),
            ]
          : [
              tbl(
                "统一会员视图",
                [
                  "会员",
                  "邮箱",
                  "首单",
                  "末单",
                  "有效订单",
                  "净营收（元）",
                  "R（天）",
                  "分群",
                ],
                a.rows.map((p) => [
                  p.name,
                  p.email,
                  p.first,
                  p.last,
                  p.F,
                  num(p.M),
                  p.R,
                  p.group,
                ]),
              ),
            ],
      segments.map((s) => ({
        label: s,
        value: a.rows.filter((p) => p.group === s).length,
        max: Math.max(1, a.rows.length),
        unit: "人",
      })),
    );
  }
  return {
    ...r,
    input: { ...raw },
    tool: id,
    createdAt: new Date().toISOString(),
  };
}
export function toCSV(headers, rows) {
  const cell = (v) =>
    '"' +
    String(v ?? "")
      .replaceAll('"', '""')
      .replace(/^[=+@-]/, "'$&") +
    '"';
  return (
    "\uFEFF" + [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n")
  );
}
export function toMarkdown(r) {
  return (
    "# " +
    r.title +
    "\n\n类型：" +
    r.kind +
    "\n\n" +
    r.metrics.map((m) => `${m.label}：${m.value} ${m.unit}`).join("\n") +
    "\n\n" +
    r.sections.map((s) => "## " + s.title + "\n\n" + s.text).join("\n\n") +
    "\n\n" +
    r.tables
      .map(
        (t) =>
          "## " +
          t.title +
          "\n\n" +
          [t.headers, ...t.rows].map((row) => row.join(" | ")).join("\n"),
      )
      .join("\n\n")
  );
}
