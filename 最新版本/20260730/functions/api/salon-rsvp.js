import { appendSalonRsvpToFeishu, hasSalonFeishuConfig } from "../_shared/salon-feishu.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const payload = await request.json();
    const submission = sanitizeSubmission(payload, request);
    validateSubmission(submission);

    const record = {
      rsvpId: crypto.randomUUID(),
      status: "ready",
      submission,
      integrations: {
        feishu: {
          provider: "feishu-doc",
          saved: false,
          configured: hasSalonFeishuConfig(env),
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      record.integrations.feishu = await appendSalonRsvpToFeishu(env, record);
    } catch (error) {
      record.integrations.feishu = {
        provider: "feishu-doc",
        saved: false,
        error: error.message,
      };
    }

    return json({
      ok: true,
      rsvpId: record.rsvpId,
      status: record.status,
      integrations: record.integrations,
    });
  } catch (error) {
    return json({ ok: false, message: error.message || "提交失败" }, 400);
  }
}

export async function onRequestGet() {
  return json({
    ok: true,
    message: "Use POST /api/salon-rsvp to submit salon RSVP.",
  });
}

function sanitizeSubmission(payload, request) {
  return {
    name: clean(payload.name, 80),
    company: clean(payload.company, 160),
    role: clean(payload.role, 120),
    phone: clean(payload.phone, 80),
    wechat: clean(payload.wechat, 120),
    status: clean(payload.status, 40) || "待确认",
    source: clean(payload.source, 200) || "salon-yunnan",
    userAgent: clean(request.headers.get("user-agent"), 500),
  };
}

function validateSubmission(submission) {
  if (!submission.name) throw new Error("请填写姓名");
  if (!submission.company) throw new Error("请填写公司名称");
  if (!submission.phone && !submission.wechat) throw new Error("请至少填写手机号码或微信号");
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
