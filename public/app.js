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
    contactMethod: get("contactMethod"),
    overseasNeed: formData.get("overseasNeed"),
    targetMarkets: get("targetMarkets"),
    primaryProblem: get("primaryProblem"),
    quickProblems: getAll("quickProblems"),
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
    source: "official-site-diagnosis",
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

  reportView.innerHTML = `
    <div class="report-cover">
      <p class="section-label">BRAND DIAGNOSIS REPORT</p>
      <h3>${escapeHtml(report.title || "品牌管理初诊报告")}</h3>
      <div class="score-row">
        <div class="score">${Number(report.score || 0)}<span>/100</span></div>
        <div class="level">${escapeHtml(report.level || "待评估")}</div>
      </div>
      <p class="meta">报告编号：${escapeHtml(jobId)} · 生成时间：${escapeHtml(generatedAt)}</p>
    </div>

    <section class="report-section">
      <h3>核心判断</h3>
      <p>${escapeHtml(report.executiveSummary || "暂无摘要。")}</p>
    </section>

    <section class="report-section">
      <h3>初步发现</h3>
      <ul>${listItems(report.findings)}</ul>
    </section>

    <section class="report-section">
      <h3>建议方向</h3>
      <ol>${listItems(report.recommendations)}</ol>
    </section>

    <section class="report-section">
      <h3>下一步</h3>
      <ul>${listItems(report.nextSteps)}</ul>
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
  setStatus("正在保存问卷并生成报告...", "working");

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

    const storageText = data.storage?.saved
      ? "问卷和报告已保存到 GitHub Issues"
      : "已生成报告；当前未配置 GitHub 存储，仅保存在本机浏览器";
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
  target.style.width = "760px";
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
