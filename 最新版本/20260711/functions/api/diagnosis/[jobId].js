import { extractRecord, findIssueByJobId, getIssue, hasGithubConfig } from "../../_shared/github.js";

export async function onRequestGet(context) {
  const { env, params } = context;
  const jobId = params.jobId;

  try {
    if (!hasGithubConfig(env)) {
      return json(
        {
          ok: false,
          message: "当前未配置 GitHub 存储，无法跨设备查询报告。",
        },
        501,
      );
    }

    const issue = /^\d+$/.test(jobId)
      ? await getIssue(env, jobId)
      : await findIssueByJobId(env, jobId);

    if (!issue) {
      return json({ ok: false, message: "未找到对应报告" }, 404);
    }

    const record = extractRecord(issue.body);
    if (!record) {
      return json({ ok: false, message: "报告记录格式不正确" }, 500);
    }

    return json({
      ok: true,
      jobId: record.jobId,
      status: record.status,
      report: record.report,
      storage: {
        provider: "github-issues",
        saved: true,
        issueNumber: issue.number,
        issueUrl: issue.html_url,
      },
      integrations: record.integrations || {},
    });
  } catch (error) {
    return json({ ok: false, message: error.message || "查询失败" }, 400);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
