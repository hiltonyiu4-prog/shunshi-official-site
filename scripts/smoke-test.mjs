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
    contactMethod: "test@example.com",
    overseasNeed: "uncertain",
    primaryProblem: "产品价值没有被目标客户正确理解。",
    quickProblems: ["product-not-understood", "content-no-mainline"],
    expectedChanges: ["product-value-clear", "touchpoints-mainline", "sales-assets-complete"],
    customerSegments: "已经有增长压力的 B2B 企业创始人和市场负责人。",
    trustConcerns: ["effect", "brand-trust"],
    brandIssues: ["value-unclear", "customer-not-convinced"],
    contentProblems: ["no-mainline", "no-review"],
    salesAssets: ["case-proof"],
    aiStatus: ["prompts-unsystematic", "want-shunse-pulse"],
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
