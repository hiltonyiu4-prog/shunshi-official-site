const form = document.querySelector("#diagnosisForm");
const diagnosisGrid = document.querySelector("#diagnosisGrid");
const reportPanel = document.querySelector("#reportPanel");
const submitButton = document.querySelector("#submitButton");
const nextStepButton = document.querySelector("#nextStepButton");
const prevStepButton = document.querySelector("#prevStepButton");
const reportView = document.querySelector("#reportView");
const emptyState = document.querySelector("#emptyState");
const statusStrip = document.querySelector("#statusStrip");
const statusText = document.querySelector("#statusText");
const generationPanel = document.querySelector("#generationPanel");
const stepSections = Array.from(document.querySelectorAll("[data-step]"));
const stepButtons = Array.from(document.querySelectorAll("[data-step-button]"));

let currentReport = null;
let currentJobId = null;
let currentStep = 1;
const totalSteps = 5;
const selfCheckFields = Array.from({ length: 10 }, (_, index) => `selfCheck${index + 1}`);

function setStatus(message, state = "idle") {
  statusText.textContent = message;
  statusStrip.dataset.state = state;
}

function collectPayload() {
  const formData = new FormData(form);
  const get = (name) => formData.get(name)?.trim();
  const getAll = (name) => formData.getAll(name);

  return {
    companyName: get("companyName"),
    industry: get("industry"),
    location: get("location"),
    mainOffering: get("mainOffering"),
    currentCustomerTypes: get("currentCustomerTypes"),
    contactName: get("contactName"),
    contactRole: get("contactRole"),
    contactMethod: get("contactMethod"),
    acquisitionMethods: get("acquisitionMethods"),
    businessGoal: get("businessGoal"),
    newMarketPlan: formData.get("newMarketPlan"),
    overseasNeed: formData.get("newMarketPlan") === "overseas" ? "yes" : "uncertain",
    targetMarkets: get("targetMarkets"),
    shunseQuestion: get("shunseQuestion"),
    primaryProblem: get("shunseQuestion"),
    businessIntentions: getAll("businessIntentions"),
    expectedChanges: getAll("expectedChanges"),
    customerSegments: get("customerSegments"),
    purchaseMotivations: getAll("purchaseMotivations"),
    trustConcerns: getAll("trustConcerns"),
    priorityOffering: get("priorityOffering"),
    productStrength: get("productStrength"),
    differentiation: get("differentiation"),
    whyChooseUs: get("whyChooseUs"),
    proofCase: get("proofCase"),
    operationStability: get("operationStability"),
    brandIssues: getAll("brandIssues"),
    currentIntro: get("currentIntro"),
    desiredPerception: get("desiredPerception"),
    touchpoints: getAll("touchpoints"),
    contentProblems: getAll("contentProblems"),
    leadSources: get("leadSources"),
    commonQuestions: get("commonQuestions"),
    commonObjections: get("commonObjections"),
    reviewCadence: get("reviewCadence"),
    salesAssets: getAll("salesAssets"),
    aiStatus: getAll("aiStatus"),
    aiBiggestProblem: get("aiBiggestProblem"),
    cooperationModes: getAll("cooperationModes"),
    supportingMaterials: get("supportingMaterials"),
    ...Object.fromEntries(selfCheckFields.map((field) => [field, formData.get(field) || ""])),
    source: "official-site-cognition-check",
  };
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function listItems(items = []) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderDimensions(dimensions = []) {
  if (!dimensions.length) return "";
  return `
    <section class="report-section">
      <h3>诊断维度</h3>
      <div class="dimension-list">
        ${dimensions
          .map(
            (item) => `
              <div class="dimension-item">
                <div>
                  <strong>${escapeHtml(item.name)}</strong>
                  <p>${escapeHtml(item.conclusion)}</p>
                </div>
                <span data-priority="${escapeHtml(item.priority)}">${escapeHtml(item.priority)}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderRoadmap(path = []) {
  if (!path.length) return "";
  return `
    <section class="report-section">
      <h3>30 / 60 / 90 天路径</h3>
      <div class="roadmap-list">
        ${path
          .map(
            (item) => `
              <div class="roadmap-item">
                <p class="roadmap-period">${escapeHtml(item.period)}</p>
                <h4>${escapeHtml(item.title)}</h4>
                <ul>${listItems(item.actions)}</ul>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderTagProfile(tags = []) {
  if (!tags.length) return "";
  return `
    <section class="report-section">
      <h3>认知标签画像</h3>
      <div class="tag-profile">
        ${tags
          .map(
            (tag) => `
              <div class="tag-chip">
                <strong>${escapeHtml(tag.name)}</strong>
                <span>${Number(tag.count || 0)}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderAnalysisSummary(items = []) {
  if (!items.length) return "";
  return `
    <section class="report-section">
      <h3>2 个简单判断</h3>
      <div class="insight-cards">
        ${items
          .map(
            (item) => `
              <div class="insight-card">
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
                <p>${escapeHtml(item.detail)}</p>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderComboDiagnosis(combo) {
  if (!combo) return "";
  return `
    <section class="report-section">
      <h3>组合诊断</h3>
      <div class="combo-box">
        <p class="section-label">${escapeHtml(combo.key || "COMBO")}</p>
        <h4>${escapeHtml(combo.name)}</h4>
        <p>${escapeHtml(combo.summary)}</p>
        <strong>建议切入：${escapeHtml(combo.action)}</strong>
      </div>
    </section>
  `;
}

function renderCognitionType(type) {
  if (!type) return "";
  return `
    <section class="report-section type-result-card">
      <div class="type-result-top">
        <span>你的客户认知阶段</span>
        <strong>${escapeHtml(type.code || "")}</strong>
      </div>
      <h3>${escapeHtml(type.name || type.headline || "待判断阶段")}</h3>
      <p class="type-judgment">${escapeHtml(type.plainJudgment || "")}</p>
      <div class="type-two-col">
        <div>
          <span>客户现在卡在哪</span>
          <p>${escapeHtml(type.customerLine || "客户还需要更清楚的理由，才能继续往下判断。")}</p>
        </div>
        <div>
          <span>问题主要在哪里</span>
          <p>${escapeHtml(type.problemFocus || type.plainJudgment || "客户还没有形成足够清楚的判断。")}</p>
        </div>
      </div>
      <p class="type-handoff">你不用在这里读完一份长报告。更细的题目记录会留给后续沟通时复核。</p>
    </section>
  `;
}

function renderTextSection(title, content) {
  if (!content) return "";
  return `
    <section class="report-section">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(content)}</p>
    </section>
  `;
}

function renderListSection(title, items = []) {
  if (!items.length) return "";
  return `
    <section class="report-section">
      <h3>${escapeHtml(title)}</h3>
      <ul>${listItems(items)}</ul>
    </section>
  `;
}

function renderServicePath(servicePath) {
  if (!servicePath) return "";
  return `
    <section class="report-section">
      <h3>建议服务路径</h3>
      <div class="service-path">
        <div>
          <span>不建议先做</span>
          <strong>${escapeHtml(servicePath.notFirst || "继续零散执行")}</strong>
        </div>
        <div>
          <span>建议先进入</span>
          <strong>${escapeHtml(servicePath.enter || "线上认知诊断")}</strong>
        </div>
      </div>
      <p>${escapeHtml(servicePath.why || "")}</p>
      <ul>${listItems(servicePath.actions || [])}</ul>
    </section>
  `;
}

function showStep(step) {
  currentStep = Math.max(1, Math.min(totalSteps, step));

  stepSections.forEach((section) => {
    section.hidden = Number(section.dataset.step) !== currentStep;
  });

  stepButtons.forEach((button) => {
    const isActive = Number(button.dataset.stepButton) === currentStep;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", isActive ? "step" : "false");
    if (isActive && window.matchMedia("(max-width: 640px)").matches) {
      button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  });

  prevStepButton.disabled = currentStep === 1;
  nextStepButton.hidden = currentStep === totalSteps;
  submitButton.hidden = currentStep !== totalSteps;
}

function requiredLabelFor(control) {
  const fieldset = control.closest("fieldset");
  if (fieldset) return fieldset.querySelector("legend")?.textContent?.trim() || "必填题";

  const label = control.closest("label");
  return label?.querySelector("span")?.textContent?.replace("（必填）", "")?.trim() || control.name || "必填项";
}

function focusInvalidControl(control) {
  const section = control.closest("[data-step]");
  const targetStep = Number(section?.dataset.step || currentStep);
  if (targetStep !== currentStep) showStep(targetStep);

  const anchor = control.closest("fieldset, label, .question-section") || control;
  control.focus?.({ preventScroll: true });
  control.reportValidity();
  window.setTimeout(() => {
    anchor.scrollIntoView({ behavior: "smooth", block: "center" });
    control.focus?.({ preventScroll: true });
  }, 80);

  setStatus(`请先补充：${requiredLabelFor(control)}`, "error");
}

function controlsForStep(step) {
  return stepSections
    .filter((section) => Number(section.dataset.step) === step)
    .flatMap((section) => Array.from(section.querySelectorAll("input, select, textarea")));
}

function validateControls(controls) {
  const invalidControl = controls.find((control) => !control.checkValidity());
  if (invalidControl) {
    focusInvalidControl(invalidControl);
    return false;
  }

  return true;
}

function validateCurrentStep() {
  return validateControls(controlsForStep(currentStep));
}

function validateAllRequired() {
  return validateControls(stepSections.flatMap((section) => Array.from(section.querySelectorAll("input, select, textarea"))));
}

function setSubmittingState(isSubmitting) {
  submitButton.disabled = isSubmitting;
  nextStepButton.disabled = isSubmitting;
  prevStepButton.disabled = isSubmitting;
  form.hidden = isSubmitting;
  generationPanel.hidden = !isSubmitting;
  reportPanel.hidden = true;
}

function renderReport(report, jobId) {
  currentReport = report;
  currentJobId = jobId;
  reportPanel.hidden = false;
  generationPanel.hidden = true;
  form.hidden = true;
  diagnosisGrid.classList.add("report-ready");

  const generatedAt = report.generatedAt
    ? new Date(report.generatedAt).toLocaleString("zh-CN")
    : new Date().toLocaleString("zh-CN");
  const typeName = report.cognitionType?.name || report.level || "待评估";
  const nextStepItems = (report.nextSteps || []).slice(0, 3);

  reportView.innerHTML = `
    <div class="report-cover">
      <p class="section-label">SHUNSE PULSE</p>
      <h3>你的初步结果：${escapeHtml(typeName)}</h3>
      <p class="meta">报告编号：${escapeHtml(jobId)} · 生成时间：${escapeHtml(generatedAt)}</p>
    </div>

    ${renderCognitionType(report.cognitionType)}

    <section class="report-section">
      <h3>一句话总结</h3>
      <p>${escapeHtml(report.cognitionType?.plainJudgment || report.executiveSummary || "顺世已经收到你的自测信息，会结合企业资料继续判断。")}</p>
      <p>这份自测只给你一个初步方向：你现在卡在哪里、该不该先做品牌管理、以及适合从哪一块切入，还需要结合真实资料继续判断。</p>
    </section>

    ${renderAnalysisSummary(report.analysisSummary)}

    ${renderServicePath(report.servicePath)}

    <section class="report-section">
      <h3>下一步怎么跟顺世沟通</h3>
      <ul>${listItems(nextStepItems)}</ul>
    </section>
  `;

  emptyState.hidden = true;
  reportView.hidden = false;

  if (window.matchMedia("(max-width: 900px)").matches) {
    reportPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function rememberResult(data) {
  localStorage.setItem(`shunshi-diagnosis:${data.jobId}`, JSON.stringify(data));

  if (data.storage?.issueNumber) {
    localStorage.setItem(`shunshi-diagnosis:${data.storage.issueNumber}`, JSON.stringify(data));
  }

  const lookupId = data.storage?.issueNumber || data.jobId;
  const url = new URL(window.location.href);
  url.searchParams.set("job", lookupId);
  window.history.replaceState({}, "", url);
}

async function loadExistingReport(lookupId) {
  setStatus("正在读取已生成报告...", "working");

  try {
    const response = await fetch(`/api/diagnosis/${encodeURIComponent(lookupId)}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || "读取报告失败");
    }

    rememberResult(data);
    renderReport(data.report, data.jobId);
    setStatus("已读取历史报告", "ready");
  } catch (error) {
    const cached = localStorage.getItem(`shunshi-diagnosis:${lookupId}`);

    if (cached) {
      const data = JSON.parse(cached);
      renderReport(data.report, data.jobId);
      setStatus("已从本机缓存恢复报告", "ready");
      return;
    }

    setStatus(error.message || "读取报告失败", "error");
  }
}

async function submitDiagnosis(event) {
  event.preventDefault();

  if (!validateAllRequired()) return;

  const payload = collectPayload();
  setSubmittingState(true);
  setStatus("正在保存问卷、生成并优化报告...", "working");

  try {
    const response = await fetch("/api/diagnosis", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.message || "提交失败");
    }

    rememberResult(data);
    renderReport(data.report, data.jobId);

    const feishu = data.integrations?.feishu;
    const storageText = feishu?.saved
      ? "初步结果已生成；信息已同步给 SHUNSE"
      : data.storage?.saved
        ? "初步结果已生成；信息已进入后续跟进"
        : "初步结果已生成";
    setStatus(storageText, "ready");
  } catch (error) {
    console.error(error);
    form.hidden = false;
    generationPanel.hidden = true;
    reportPanel.hidden = true;
    setStatus(error.message || "提交失败，请稍后重试", "error");
  } finally {
    submitButton.disabled = false;
    nextStepButton.disabled = false;
    prevStepButton.disabled = false;
  }
}

form.addEventListener("submit", submitDiagnosis);
nextStepButton.addEventListener("click", () => {
  if (validateCurrentStep()) showStep(currentStep + 1);
});
prevStepButton.addEventListener("click", () => showStep(currentStep - 1));
stepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetStep = Number(button.dataset.stepButton);
    if (targetStep <= currentStep || validateCurrentStep()) {
      showStep(targetStep);
    }
  });
});
form.addEventListener("reset", () => {
  window.setTimeout(() => {
    form.hidden = false;
    generationPanel.hidden = true;
    reportPanel.hidden = true;
    diagnosisGrid.classList.remove("report-ready");
    emptyState.hidden = false;
    reportView.hidden = true;
    reportView.innerHTML = "";
    currentReport = null;
    currentJobId = null;
    setStatus("等待提交问卷");
    showStep(1);
  }, 0);
});

const initialLookupId = new URLSearchParams(window.location.search).get("job");
if (initialLookupId) {
  loadExistingReport(initialLookupId);
}

showStep(1);
