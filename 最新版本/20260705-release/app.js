const form = document.querySelector("#diagnosisForm");
const diagnosisGrid = document.querySelector("#diagnosisGrid");
const reportPanel = document.querySelector("#reportPanel");
const submitButton = document.querySelector("#submitButton");
const nextStepButton = document.querySelector("#nextStepButton");
const prevStepButton = document.querySelector("#prevStepButton");
const downloadButton = document.querySelector("#downloadButton");
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
      <h3>3 个简单判断</h3>
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
  downloadButton.disabled = true;
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
  const llm = report.metadata?.llm;
  const llmBadge = llm?.optimized ? "AI 已优化终版" : "规则报告终版";

  const shortRecommendations = (report.recommendations || []).slice(0, 3);
  const shortMaterials = (report.materialRequests || []).slice(0, 5);
  const shortHooks = (report.consultingHooks || []).slice(0, 2);
  const shortNextSteps = (report.nextSteps || []).slice(0, 3);

  reportView.innerHTML = `
    <div class="report-cover">
      <p class="section-label">SHUNSE PULSE</p>
      <h3>${escapeHtml(report.title || "品牌管理初诊报告")}</h3>
      <div class="score-row">
        <div class="score">${Number(report.score || 0)}<span>/100</span></div>
        <div class="level">${escapeHtml(report.level || "待评估")}</div>
      </div>
      <p class="meta">报告编号：${escapeHtml(jobId)} · 生成时间：${escapeHtml(generatedAt)} · ${escapeHtml(llmBadge)}</p>
    </div>

    <section class="report-section">
      <h3>核心判断</h3>
      <p>${escapeHtml(report.executiveSummary || "暂无摘要。")}</p>
    </section>

    ${renderAnalysisSummary(report.analysisSummary)}

    ${renderComboDiagnosis(report.comboDiagnosis)}

    ${renderTextSection("客户心里可能会怎么想", report.customerFeeling)}

    ${renderTextSection("为什么要先改这里", report.brandManagementInsight)}

    <section class="report-section">
      <h3>现在先做这几件事</h3>
      <ol>${listItems(shortRecommendations)}</ol>
    </section>

    ${renderServicePath(report.servicePath)}

    ${renderListSection("不建议先做", (report.notRecommended || []).slice(0, 3))}

    ${renderListSection("会后建议补充材料", shortMaterials)}

    ${renderListSection("适合继续咨询的问题", shortHooks)}

    <section class="report-section">
      <h3>下一步</h3>
      <ul>${listItems(shortNextSteps)}</ul>
    </section>
  `;

  emptyState.hidden = true;
  reportView.hidden = false;
  downloadButton.disabled = false;

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
      ? "报告已生成，可下载 PDF；信息已同步给 SHUNSE"
      : data.storage?.saved
        ? "报告已生成，可下载 PDF；信息已进入后续跟进"
        : "报告已生成，可下载 PDF";
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

async function downloadPdf() {
  if (!currentReport || !currentJobId) return;

  const fileName = `${currentReport.title || "brand-diagnosis"}-${currentJobId.slice(0, 8)}.pdf`;
  downloadButton.disabled = true;
  const target = reportView.cloneNode(true);
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-render-root";
  target.classList.add("pdf-render-target");
  wrapper.appendChild(target);
  document.body.appendChild(wrapper);

  if (window.html2pdf) {
    try {
      await window
        .html2pdf()
        .set({
          margin: 10,
          filename: fileName,
          image: { type: "jpeg", quality: 0.96 },
          html2canvas: {
            scale: Math.min(2, window.devicePixelRatio || 1.5),
            useCORS: true,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0,
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(target)
        .save();
    } finally {
      wrapper.remove();
      downloadButton.disabled = false;
    }
  } else {
    wrapper.remove();
    downloadButton.disabled = false;
    window.print();
  }
}

form.addEventListener("submit", submitDiagnosis);
downloadButton.addEventListener("click", downloadPdf);
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
    downloadButton.disabled = true;
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
