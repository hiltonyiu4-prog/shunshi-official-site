import { onRequestPost } from "../functions/api/diagnosis.js";

const request = new Request("https://example.com/api/diagnosis", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    companyName: "顺世测试企业",
    industry: "咨询服务",
    location: "杭州 / 中国",
    mainOffering: "品牌增长咨询",
    currentCustomerTypes: "增长期 B2B 企业",
    contactName: "测试联系人",
    contactRole: "市场负责人",
    contactMethod: "test@example.com",
    acquisitionMethods: "沙龙、官网、转介绍",
    businessGoal: "让客户在线上更快理解我们适合谁、凭什么可信。",
    newMarketPlan: "new-city",
    targetMarkets: "长三角",
    shunseQuestion: "应该先补品牌表达、信任证据，还是销售承接？",
    businessIntentions: ["intent-a", "intent-d"],
    selfCheck1: "q1-b",
    selfCheck2: "q2-c",
    selfCheck3: "q3-c",
    selfCheck4: "q4-c",
    selfCheck5: "q5-d",
    selfCheck6: "q6-b",
    selfCheck7: "q7-a",
    selfCheck8: "q8-e",
    selfCheck9: "q9-a",
    selfCheck10: "q10-b",
    cooperationModes: ["30-day-foundation"],
  }),
});

const response = await onRequestPost({ request, env: {} });
const data = await response.json();

if (!response.ok || !data.ok || !data.report || data.status !== "ready") {
  console.error(data);
  throw new Error("Smoke test failed");
}

console.log(`Smoke test passed: ${data.jobId} -> ${data.report.title}`);
