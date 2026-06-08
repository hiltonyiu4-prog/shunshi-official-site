import { createIssue, hasGithubConfig, updateIssue } from "../_shared/github.js";
import { generateReport } from "../_shared/report.js";
import { appendSubmissionToFeishu, hasFeishuConfig } from "../_shared/feishu.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const submission = await request.json();
    validateSubmission(submission);

    const now = new Date().toISOString();
    const jobId = crypto.randomUUID();
    const record = {
      jobId,
      status: "processing",
      submission: sanitizeSubmission(submission),
      report: null,
      storage: {
        provider: hasGithubConfig(env) ? "github-issues" : "none",
        saved: false,
      },
      integrations: {
        feishu: {
          provider: "feishu-doc",
          saved: false,
          configured: hasFeishuConfig(env),
        },
      },
      createdAt: now,
      updatedAt: now,
    };

    let issue = null;
    if (hasGithubConfig(env)) {
      issue = await createIssue(env, record);
      record.storage = {
        provider: "github-issues",
        saved: true,
        issueNumber: issue.number,
        issueUrl: issue.html_url,
      };
    }

    try {
      const report = await generateReport({ env, jobId, submission: record.submission });
      record.status = "ready";
      record.report = report;
      record.updatedAt = new Date().toISOString();

      try {
        record.integrations.feishu = await appendSubmissionToFeishu(env, record);
      } catch (error) {
        record.integrations.feishu = {
          provider: "feishu-doc",
          saved: false,
          error: error.message,
        };
      }

      if (issue) {
        issue = await updateIssue(env, issue.number, record);
        record.storage.issueUrl = issue.html_url;
      }

      return json({
        ok: true,
        jobId,
        status: record.status,
        report,
        storage: record.storage,
        integrations: record.integrations,
      });
    } catch (error) {
      record.status = "failed";
      record.error = error.message;
      record.updatedAt = new Date().toISOString();

      if (issue) {
        await updateIssue(env, issue.number, record);
      }

      throw error;
    }
  } catch (error) {
    return json({ ok: false, message: error.message || "提交失败" }, 400);
  }
}

export async function onRequestGet() {
  return json({
    ok: true,
    message: "Use POST /api/diagnosis to create a diagnosis report.",
  });
}

function validateSubmission(submission) {
  if (!submission || typeof submission !== "object") {
    throw new Error("问卷数据格式不正确");
  }
  if (!String(submission.companyName || "").trim()) {
    throw new Error("请填写企业名称");
  }
  if (!String(submission.contactName || "").trim()) {
    throw new Error("请填写联系人");
  }
  if (!String(submission.contactMethod || "").trim()) {
    throw new Error("请填写联系方式");
  }
}

function sanitizeSubmission(submission) {
  const sanitized = {};

  for (const field of TEXT_FIELDS) {
    sanitized[field] = clean(submission[field], LONG_TEXT_FIELDS.has(field) ? 3000 : 500);
  }

  for (const field of ARRAY_FIELDS) {
    sanitized[field] = Array.isArray(submission[field])
      ? submission[field].map((item) => clean(item, 120)).filter(Boolean).slice(0, 24)
      : [];
  }

  return sanitized;
}

function clean(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const TEXT_FIELDS = [
  "companyName",
  "industry",
  "location",
  "mainOffering",
  "currentCustomerTypes",
  "contactName",
  "contactMethod",
  "overseasNeed",
  "targetMarkets",
  "primaryProblem",
  "customerSegments",
  "priorityOffering",
  "productStrength",
  "differentiation",
  "whyChooseUs",
  "proofCase",
  "operationStability",
  "currentIntro",
  "desiredPerception",
  "leadSources",
  "commonQuestions",
  "commonObjections",
  "reviewCadence",
  "aiBiggestProblem",
  "supportingMaterials",
  "source",
];

const LONG_TEXT_FIELDS = new Set([
  "primaryProblem",
  "customerSegments",
  "currentIntro",
  "desiredPerception",
  "aiBiggestProblem",
  "supportingMaterials",
]);

const ARRAY_FIELDS = [
  "quickProblems",
  "expectedChanges",
  "purchaseMotivations",
  "trustConcerns",
  "brandIssues",
  "touchpoints",
  "contentProblems",
  "salesAssets",
  "aiStatus",
  "cooperationModes",
];
