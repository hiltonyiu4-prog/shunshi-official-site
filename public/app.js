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
      <h3>六类诊断</h3>
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
      <h3>一句话诊断</h3>
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

function validateCurrentStep() {
  const controls = stepSections
    .filter((section) => Number(section.dataset.step) === currentStep)
    .flatMap((section) => Array.from(section.querySelectorAll("input, select, textarea")));

  const invalidControl = controls.find((control) => !control.checkValidity());
  if (invalidControl) {
    invalidControl.reportValidity();
    return false;
  }

  return true;
}

function renderReport(report, jobId) {
  currentReport = report;
  currentJobId = jobId;
  reportPanel.hidden = false;
  diagnosisGrid.classList.add("report-ready");

  const generatedAt = report.generatedAt
    ? new Date(report.generatedAt).toLocaleString("zh-CN")
    : new Date().toLocaleString("zh-CN");
  const llm = report.metadata?.llm;
  const llmBadge = llm?.optimized ? "DeepSeek 已优化终版" : "规则报告终版";

  reportView.innerHTML = `
    <div class="report-cover">
      <p class="section-label">BRAND DIAGNOSIS REPORT</p>
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

    ${renderTextSection("客户可能的真实感受", report.customerFeeling)}

    ${renderTextSection("为什么这是品牌管理问题", report.brandManagementInsight)}

    <section class="report-section">
      <h3>初步发现</h3>
      <ul>${listItems(report.findings)}</ul>
    </section>

    ${renderTagProfile(report.metadata?.dominantTags)}

    ${renderDimensions(report.dimensions)}

    <section class="report-section">
      <h3>建议方向</h3>
      <ol>${listItems(report.recommendations)}</ol>
    </section>

    ${renderRoadmap(report.path)}

    ${renderServicePath(report.servicePath)}

    ${renderListSection("不建议先做", report.notRecommended)}

    ${renderListSection("会后建议补充材料", report.materialRequests)}

    ${renderListSection("适合继续咨询的问题", report.consultingHooks)}

    <section class="report-section">
      <h3>下一步</h3>
      <ul>${listItems(report.nextSteps)}</ul>
    </section>

    <section class="report-section">
      <h3>边界说明</h3>
      <ul>${listItems(report.boundaries)}</ul>
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

  if (!validateCurrentStep()) return;

  const payload = collectPayload();
  submitButton.disabled = true;
  downloadButton.disabled = true;
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
    setStatus(error.message || "提交失败，请稍后重试", "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function downloadPdf() {
  if (!currentReport || !currentJobId) return;

  const fileName = `${currentReport.title || "brand-diagnosis"}-${currentJobId.slice(0, 8)}.pdf`;
  const target = reportView.cloneNode(true);
  target.style.padding = "24px";
  target.style.width = "780px";
  target.style.background = "#ffffff";

  if (window.html2pdf) {
    await window
      .html2pdf()
      .set({
        margin: 10,
        filename: fileName,
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(target)
      .save();
  } else {
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
