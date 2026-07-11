const sections = Array.from(document.querySelectorAll(".slide"));
const dots = Array.from(document.querySelectorAll(".dot"));
const arrow = document.querySelector(".arrow-down");
const pageDots = document.querySelector(".page-dots");
const siteHeader = document.querySelector(".site-header");
const footer = document.querySelector(".site-footer");
const heroCanvas = document.querySelector(".hero-canvas");

function setActive(id) {
  dots.forEach((dot) => {
    const target = dot.getAttribute("href")?.slice(1);
    dot.classList.toggle("is-active", target === id);
  });
}

if (sections.length && dots.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    {
      root: null,
      threshold: 0.58,
    },
  );

  sections.forEach((section) => observer.observe(section));
}

if (footer) {
  const footerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const shouldHideChrome = entry.isIntersecting;
        pageDots?.classList.toggle("is-hidden", shouldHideChrome);
        siteHeader?.classList.toggle("is-hidden", shouldHideChrome);
      });
    },
    {
      root: null,
      threshold: 0.18,
    },
  );

  footerObserver.observe(footer);
}

arrow?.addEventListener("click", () => {
  document.querySelector("#judgement")?.scrollIntoView({ behavior: "smooth" });
});

dots.forEach((dot) => {
  dot.addEventListener("click", (event) => {
    const id = dot.getAttribute("href");
    const target = id ? document.querySelector(id) : null;
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth" });
  });
});

if (
  document.body.classList.contains("home-page") &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !window.matchMedia("(pointer: coarse)").matches
) {
  const root = document.documentElement;
  let targetY = window.scrollY;
  let currentY = targetY;
  let frameId = 0;
  let isProgrammaticScroll = false;
  let savedScrollBehavior = "";
  let scrollBehaviorLocked = false;
  let restoreTimer = 0;
  let snapTargetY = null;
  let snapCooldownUntil = 0;
  let snapCooldownDirection = 0;
  let animationStartY = targetY;
  let animationStartTime = 0;

  function maxScrollY() {
    return Math.max(0, root.scrollHeight - window.innerHeight);
  }

  function clampScroll(value) {
    return Math.max(0, Math.min(maxScrollY(), value));
  }

  function normalizedWheelDelta(event) {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 18;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight * 0.9;
    return event.deltaY;
  }

  function snapPoints() {
    return sections
      .map((section, index) => {
        if (index === 0) return 0;
        return Math.round(section.getBoundingClientRect().top + window.scrollY);
      })
      .filter((point, index, points) => index === 0 || point > points[index - 1] + 20);
  }

  function pageSnapTarget(deltaY) {
    const direction = Math.sign(deltaY);
    if (!direction) return null;

    const points = snapPoints();
    if (points.length < 2) return null;

    const current = window.scrollY;
    const deadzone = 2;

    if (direction > 0) {
      return points.find((point) => point > current + deadzone) ?? null;
    }

    for (let index = points.length - 1; index >= 0; index -= 1) {
      if (points[index] < current - deadzone) return points[index];
    }

    return null;
  }

  function lockNativeSmoothScroll() {
    clearTimeout(restoreTimer);
    if (scrollBehaviorLocked) return;
    savedScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    scrollBehaviorLocked = true;
  }

  function restoreNativeSmoothScroll() {
    clearTimeout(restoreTimer);
    restoreTimer = window.setTimeout(() => {
      root.style.scrollBehavior = savedScrollBehavior;
      scrollBehaviorLocked = false;
    }, 80);
  }

  function canScrollInside(element, deltaY) {
    let node = element;
    while (node && node !== document.body && node !== root) {
      const style = window.getComputedStyle(node);
      const canScrollY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
      if (canScrollY) {
        const atTop = node.scrollTop <= 0;
        const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
        if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function beginSmoothScroll() {
    animationStartY = window.scrollY;
    currentY = animationStartY;
    animationStartTime = performance.now();
    if (!frameId) frameId = window.requestAnimationFrame(stepSmoothScroll);
  }

  function stepSmoothScroll(now) {
    const duration = snapTargetY !== null ? 420 : 320;
    const progress = Math.min(1, (now - animationStartTime) / duration);
    const eased = easeOutCubic(progress);
    currentY = animationStartY + (targetY - animationStartY) * eased;

    if (progress >= 1) {
      currentY = targetY;
      isProgrammaticScroll = true;
      window.scrollTo(0, currentY);
      isProgrammaticScroll = false;
      frameId = 0;
      if (snapTargetY !== null) {
        snapCooldownUntil = performance.now() + 120;
        snapTargetY = null;
      }
      restoreNativeSmoothScroll();
      return;
    }

    isProgrammaticScroll = true;
    window.scrollTo(0, currentY);
    isProgrammaticScroll = false;
    frameId = window.requestAnimationFrame(stepSmoothScroll);
  }

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey) return;

      const deltaY = normalizedWheelDelta(event);
      if (!deltaY || canScrollInside(event.target, deltaY)) return;

      const direction = Math.sign(deltaY);
      const now = performance.now();
      if (snapTargetY !== null || (now < snapCooldownUntil && direction === snapCooldownDirection)) {
        snapCooldownUntil = now + 120;
        event.preventDefault();
        return;
      }

      const nextSnapTarget = pageSnapTarget(deltaY);
      if (nextSnapTarget !== null) {
        event.preventDefault();
        lockNativeSmoothScroll();

        currentY = window.scrollY;
        targetY = clampScroll(nextSnapTarget);
        snapTargetY = targetY;
        snapCooldownDirection = direction;
        beginSmoothScroll();
        return;
      }

      event.preventDefault();
      lockNativeSmoothScroll();

      targetY = clampScroll(targetY + deltaY * 1.08);
      beginSmoothScroll();
    },
    { passive: false },
  );

  window.addEventListener(
    "scroll",
    () => {
      if (isProgrammaticScroll || frameId) return;
      targetY = window.scrollY;
      currentY = targetY;
    },
    { passive: true },
  );

  window.addEventListener("resize", () => {
    targetY = clampScroll(targetY);
    currentY = clampScroll(currentY);
  });
}

if (
  document.body.classList.contains("home-page") &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  window.matchMedia("(pointer: coarse)").matches
) {
  let touchSnapTimer = 0;
  let touchSnapping = false;
  let touchStartY = 0;
  let touchStartIndex = 0;
  let touchDirection = 0;

  function snapPoints() {
    return sections
      .map((section, index) => {
        if (index === 0) return 0;
        return Math.round(section.getBoundingClientRect().top + window.scrollY);
      })
      .filter((point, index, points) => index === 0 || point > points[index - 1] + 20);
  }

  function nearestSnapIndex(points, current) {
    return points.reduce((nearestIndex, point, index) => (
      Math.abs(point - current) < Math.abs(points[nearestIndex] - current) ? index : nearestIndex
    ), 0);
  }

  function snapTouchSections() {
    if (touchSnapping) return;

    const points = snapPoints();
    if (points.length < 2) return;

    const current = window.scrollY;
    const fallbackIndex = nearestSnapIndex(points, current);
    const targetIndex = touchDirection
      ? Math.max(0, Math.min(points.length - 1, touchStartIndex + touchDirection))
      : fallbackIndex;
    const target = points[targetIndex];

    if (Math.abs(target - current) < 10) return;

    touchSnapping = true;
    window.scrollTo({ top: target, behavior: "smooth" });
    window.setTimeout(() => {
      touchSnapping = false;
    }, 420);
  }

  function scheduleTouchSnap(delay = 120) {
    clearTimeout(touchSnapTimer);
    touchSnapTimer = window.setTimeout(snapTouchSections, delay);
  }

  window.addEventListener("touchstart", (event) => {
    clearTimeout(touchSnapTimer);
    const points = snapPoints();
    touchStartY = event.touches[0]?.clientY ?? 0;
    touchStartIndex = points.length ? nearestSnapIndex(points, window.scrollY) : 0;
    touchDirection = 0;
  }, { passive: true });
  window.addEventListener("touchmove", (event) => {
    const currentY = event.touches[0]?.clientY ?? touchStartY;
    const delta = touchStartY - currentY;
    if (Math.abs(delta) > 18) touchDirection = Math.sign(delta);
  }, { passive: true });
  window.addEventListener("touchend", () => scheduleTouchSnap(70), { passive: true });
  window.addEventListener("scroll", () => {
    if (!touchSnapping) scheduleTouchSnap();
  }, { passive: true });
}

if (heroCanvas) {
  const ctx = heroCanvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const landBlobs = [
    { lon: -102, lat: 45, rx: 34, ry: 18 },
    { lon: -72, lat: -10, rx: 18, ry: 28 },
    { lon: -44, lat: -18, rx: 12, ry: 18 },
    { lon: 12, lat: 48, rx: 34, ry: 14 },
    { lon: 24, lat: 5, rx: 18, ry: 26 },
    { lon: 72, lat: 36, rx: 42, ry: 20 },
    { lon: 104, lat: 18, rx: 24, ry: 16 },
    { lon: 134, lat: -24, rx: 18, ry: 12 },
    { lon: 44, lat: 58, rx: 30, ry: 10 },
  ];

  const mapParticles = Array.from({ length: 1450 }, (_, index) => {
    let lon = 0;
    let lat = 0;
    const blob = landBlobs[index % landBlobs.length];
    const angle = (index * 2.3999632297) % (Math.PI * 2);
    const radius = Math.sqrt((index * 0.61803398875) % 1);
    lon = blob.lon + Math.cos(angle) * blob.rx * radius + Math.sin(index * 0.91) * 4;
    lat = blob.lat + Math.sin(angle) * blob.ry * radius + Math.cos(index * 0.73) * 2.5;
    return {
      lon: Math.max(-175, Math.min(175, lon)),
      lat: Math.max(-58, Math.min(68, lat)),
      seed: index * 0.731,
      size: 0.35 + (index % 6) * 0.055,
    };
  });

  const networkNodes = Array.from({ length: 42 }, (_, index) => ({
    lon: -160 + ((index * 47) % 320),
    lat: -12 + ((index * 29) % 86),
    seed: index * 1.47,
    pulse: (index * 0.37) % 1,
  }));

  const flowPaths = Array.from({ length: 18 }, (_, index) => {
    const a = networkNodes[index % networkNodes.length];
    const b = networkNodes[(index * 5 + 11) % networkNodes.length];
    return { a, b, seed: index * 0.83, speed: 0.04 + (index % 5) * 0.012 };
  });

  function resizeHeroCanvas() {
    const rect = heroCanvas.getBoundingClientRect();
    heroCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
    heroCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  }

  function project(width, height, lon, lat, time = 0) {
    const globeX = width * 0.5;
    const globeY = height * 0.86;
    const radiusX = width * 0.47;
    const radiusY = height * 0.36;
    const driftLon = lon + Math.sin(time * 0.08) * 2.4;
    const x = globeX + (driftLon / 180) * radiusX;
    const latRad = (lat * Math.PI) / 180;
    const arch = Math.cos((driftLon / 180) * Math.PI * 0.5);
    const y = globeY - Math.sin(latRad) * radiusY * 0.72 - arch * radiusY * 0.3;
    return { x, y, arch };
  }

  function drawArcLine(a, b, width, height, time, alpha = 0.16) {
    const pa = project(width, height, a.lon, a.lat, time);
    const pb = project(width, height, b.lon, b.lat, time);
    const mx = (pa.x + pb.x) * 0.5;
    const my = (pa.y + pb.y) * 0.5 - Math.min(width, height) * 0.045;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
    ctx.strokeStyle = `rgba(238, 238, 238, ${alpha})`;
    ctx.lineWidth = 0.72 * dpr;
    ctx.stroke();
    return { pa, pb, mx, my };
  }

  function drawHeroFrame(time = 0) {
    const width = heroCanvas.width;
    const height = heroCanvas.height;
    const t = time * 0.001;

    ctx.clearRect(0, 0, width, height);

    const base = ctx.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "#020305");
    base.addColorStop(0.42, "#06080d");
    base.addColorStop(0.68, "#0d1119");
    base.addColorStop(1, "#020203");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    const topGlow = ctx.createRadialGradient(width * 0.5, height * 0.04, 0, width * 0.5, height * 0.04, width * 0.48);
    topGlow.addColorStop(0, "rgba(235, 235, 235, 0.13)");
    topGlow.addColorStop(0.42, "rgba(235, 235, 235, 0.055)");
    topGlow.addColorStop(1, "rgba(235, 235, 235, 0)");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, height);

    const horizon = ctx.createRadialGradient(width * 0.5, height * 0.86, width * 0.12, width * 0.5, height * 0.86, width * 0.52);
    horizon.addColorStop(0, "rgba(242, 242, 242, 0.12)");
    horizon.addColorStop(0.42, "rgba(242, 242, 242, 0.055)");
    horizon.addColorStop(1, "rgba(242, 242, 242, 0)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const globeX = width * 0.5;
    const globeY = height * 0.86;
    const radiusX = width * 0.47;
    const radiusY = height * 0.36;

    ctx.beginPath();
    ctx.ellipse(globeX, globeY, radiusX, radiusY, 0, Math.PI * 1.03, Math.PI * 1.97);
    ctx.strokeStyle = "rgba(245, 245, 245, 0.22)";
    ctx.lineWidth = 1.2 * dpr;
    ctx.shadowColor = "rgba(245, 245, 245, 0.22)";
    ctx.shadowBlur = 12 * dpr;
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (let i = 0; i < networkNodes.length; i += 1) {
      const a = networkNodes[i];
      for (let j = i + 1; j < Math.min(networkNodes.length, i + 5); j += 1) {
        const b = networkNodes[j];
        if (Math.abs(a.lon - b.lon) < 105) drawArcLine(a, b, width, height, t, 0.07);
      }
    }

    for (const path of flowPaths) {
      const curve = drawArcLine(path.a, path.b, width, height, t, 0.11);
      const p = (t * path.speed + path.seed) % 1;
      const q = 1 - p;
      const x = q * q * curve.pa.x + 2 * q * p * curve.mx + p * p * curve.pb.x;
      const y = q * q * curve.pa.y + 2 * q * p * curve.my + p * p * curve.pb.y;
      const spark = ctx.createRadialGradient(x, y, 0, x, y, 18 * dpr);
      spark.addColorStop(0, "rgba(255, 255, 255, 0.62)");
      spark.addColorStop(0.26, "rgba(240, 240, 240, 0.24)");
      spark.addColorStop(1, "rgba(240, 240, 240, 0)");
      ctx.fillStyle = spark;
      ctx.beginPath();
      ctx.arc(x, y, 18 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const dot of mapParticles) {
      const p = project(width, height, dot.lon, dot.lat, t);
      if (p.y > height * 0.25 && p.y < height * 0.92 && p.x > width * 0.04 && p.x < width * 0.96) {
        const twinkle = 0.5 + Math.sin(t * 1.4 + dot.seed) * 0.5;
        const alpha = 0.11 + twinkle * 0.16;
        ctx.fillStyle = `rgba(242, 242, 242, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, dot.size * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const node of networkNodes) {
      const p = project(width, height, node.lon, node.lat, t);
      const pulse = 0.5 + Math.sin(t * 1.7 + node.seed) * 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.28 + pulse * 0.34})`;
      ctx.shadowColor = "rgba(255, 255, 255, 0.38)";
      ctx.shadowBlur = (5 + pulse * 10) * dpr;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (1.1 + pulse * 0.7) * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const vignette = ctx.createLinearGradient(0, 0, width, height);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0.22)");
    vignette.addColorStop(0.48, "rgba(0, 0, 0, 0.02)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.76)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    requestAnimationFrame(drawHeroFrame);
  }

  resizeHeroCanvas();
  window.addEventListener("resize", resizeHeroCanvas);
  requestAnimationFrame(drawHeroFrame);
}

// 20260630 bilingual site toggle. Click "English" to switch the current page.
(() => {
  const langLinks = Array.from(document.querySelectorAll(".lang"));
  if (!langLinks.length) return;

  const zhToEn = new Map([
    ["首页", "Home"],
    ["关于顺世", "About"],
    ["核心业务", "Services"],
    ["顺势引擎", "SHUNSE Pulse"],
    ["联系我们", "Contact"],
    ["隐私政策", "Privacy"],
    ["首屏", "Hero"],
    ["品牌判断", "Judgement"],
    ["品牌线上认知", "Online Brand Cognition"],
    ["营销增长", "Marketing Growth"],
    ["出海表达", "Global Expression"],
    ["联系顺世", "Contact"],
    ["进入页面", "Enter"],
    ["微信公众号", "WeChat Official Account"],
    ["地址：待补充", "Address: To be updated"],
    ["电话：18127015520　邮箱：shunse001@sina.com", "Tel: 18127015520  Email: shunse001@sina.com"],
    ["合作联系：SHUNSE0-1", "Business contact: SHUNSE0-1"],
    ["备案信息：待补充", "ICP filing: To be updated"],
    ["为实业企业建立可持续的线上认知与增长系统。", "Building a sustainable online cognition and growth system for real-world businesses."],
    ["被看见，被理解，被信任，被选择", "Be Seen, Understood, Trusted and Chosen"],
    ["AI 让内容越来越多，也让真正有判断的品牌表达越来越稀缺。企业需要的不只是更多内容，而是一套能让真实产品力被准确看见、持续理解、建立信任并走向选择的线上认知系统。", "AI is making content abundant, while truly thoughtful brand expression becomes scarce. Businesses need more than more content. They need an online cognition system that makes real product strength visible, understandable, trusted and chosen."],
    ["把真实产品力转化为线上品牌认知。", "Turn Real Product Strength into Online Brand Cognition."],
    ["SHUNSE 顺世基于核心成员长期一线市场洞察，结合品牌内容构建、数字内容增长与 AI 工作流，帮助实业企业把真实产品力转化为线上品牌认知，并沉淀为企业专属的顺势引擎。", "Based on long-term frontline market insight, brand content systems, digital growth and AI workflows, SHUNSE helps real-world businesses turn product strength into online brand cognition and build their own reusable SHUNSE Pulse engine."],
    ["提供市场判断、消费人群洞察、品牌主张、产品价值主线、官网表达、内容方向、FAQ 与销售话术等服务，帮助企业把“内行懂”的实力翻译成“目标客户懂”的表达。", "We provide market judgement, audience insight, brand propositions, product value narratives, website messaging, content direction, FAQ and sales scripts, translating expert strength into language target customers understand."],
    ["围绕官网、公众号、视频号、抖音、小红书、直播、私域、搜索与 GEO / AEO 等触点，组织内容矩阵、发布包、线索承接与复盘机制。", "We build content matrices, publishing packages, lead handoff and review mechanisms across websites, WeChat, short video, Douyin, Xiaohongshu, livestreaming, private traffic, search and GEO / AEO touchpoints."],
    ["基于企业资料库、行业知识库、案例库、话术库、内容模板、复盘表与 AI 工作流，帮助企业把有效判断和经验沉淀为可持续调用的系统。", "Based on company data, industry knowledge, case libraries, scripts, templates, review sheets and AI workflows, we help businesses turn effective judgement and experience into reusable systems."],
    ["出海表达与国际化传播", "Global Expression and International Communication"],
    ["围绕目标国家、目标客户、海外信任路径与平台语境，重组企业介绍、独立站、LinkedIn、Google、海外社媒与询盘承接。", "We reorganize company profiles, independent sites, LinkedIn, Google, overseas social media and inquiry flows around target markets, customers, trust paths and platform contexts."],
    ["真实实力，不该被同质内容淹没。", "Real Strength Should Not Be Buried by Generic Content."],
    ["让产品被正确理解。", "Let products be understood correctly."],
    ["让品牌被建立信任。", "Let brands build trust."],
    ["让内容接上转化和复盘。", "Let content connect conversion and review."],
    ["让经验沉淀成企业自己的顺势引擎。", "Let experience become a company-owned SHUNSE Pulse engine."],
    ["预约线上认知诊断", "Book an Online Cognition Diagnosis"],
    ["发送企业资料给我们", "Send Company Materials"],
    ["让真实产品力，被目标客户正确理解。", "Let Real Product Strength Be Clearly Understood by Target Customers."],
    ["很多企业并不缺产品、经验、客户口碑和履约能力。真正的问题是：这些实力还没有被组织成线上市场能理解、能相信、能转化的表达系统。", "Many companies do not lack products, experience, customer reputation or delivery capability. The real issue is that these strengths have not yet been organized into an expression system that online markets can understand, trust and convert through."],
    ["SHUNSE 的品牌线上认知服务，围绕市场判断、消费人群、产品价值、品牌主张、内容证据和销售承接展开，帮助企业建立一套统一、可信、可复用的表达体系。", "SHUNSE's online brand cognition service centers on market judgement, audiences, product value, brand propositions, content proof and sales handoff, helping companies build a unified, credible and reusable expression system."],
    ["服务内容", "Service Scope"],
    ["市场与消费人群判。", "Market and audience judgement."],
    ["产品价值主线梳。", "Product value narrative structuring."],
    ["品牌主张与定。", "Brand proposition and positioning."],
    ["企业介绍与官网核心文。", "Company profile and website core copy."],
    ["视觉表达方向与内容审美标。", "Visual direction and content aesthetic standards."],
    ["预约品牌线上认知诊断", "Book a Brand Cognition Diagnosis"],
    ["内容不是越多越好，而是要接上转化与复盘。", "Content Is Not About More. It Must Connect Conversion and Review."],
    ["品牌真正需要的是能精准传达产品价值、匹配消费人群心理、符合平台语境、承接销售转化，并沉淀为长期品牌资产的高质量内容。", "Brands need high-quality content that precisely communicates product value, matches audience psychology, fits platform contexts, supports sales conversion and becomes long-term brand assets."],
    ["SHUNSE 帮助企业围绕官网、搜索、短视频、图文、直播、私域和销售承接，建立可持续运转的内容系统。", "SHUNSE helps companies build sustainable content systems around websites, search, short video, articles, livestreaming, private traffic and sales handoff."],
    ["内容主线与平台表达策。", "Content narrative and platform expression strategy."],
    ["GEO / AEO 内容资产", "GEO / AEO content assets."],
    ["线索记录、内容复盘表与月度优化建。", "Lead records, content review sheets and monthly optimization suggestions."],
    ["用 AI 提高效率，但由专业判断把控方向和质量", "Use AI to improve efficiency while professional judgement controls direction and quality."],
    ["咨询数字内容增长路径", "Consult Digital Content Growth Path"],
    ["让判断被复用，让内容有方向，让经验能生长。", "Make Judgement Reusable, Content Directional and Experience Scalable."],
    ["顺势引擎不是资料库，也不是 AI 工具本身。它的核心是 SHUNSE 对市场变化、消费心理、品牌内容和转化路径的专业判断；AI 负责把这些判断、方法和经验更高效地组织、调用、复制和更新。", "SHUNSE Pulse is not a database or an AI tool itself. Its core is SHUNSE's professional judgement on market change, consumer psychology, brand content and conversion paths; AI helps organize, call, replicate and update those judgements, methods and experiences more efficiently."],
    ["SHUNSE Pulse 让企业不再把经验散落在个人脑子、零散文件和临时聊天记录里，而是沉淀成可持续更新的企业专属系统。", "SHUNSE Pulse helps companies stop scattering experience across individual minds, fragmented files and temporary chats, and turn it into a continuously updated company-owned system."],
    ["系统构成", "System Structure"],
    ["企业资料库与行业知识。", "Company Data and Industry Knowledge."],
    ["整理企业资料、产品证据、行业语境与客户问题，让表达有稳定来源。", "Organize company materials, product proof, industry context and customer questions so expression has stable sources."],
    ["案例库、话术库与内容模。", "Case Library, Script Library and Content Templates."],
    ["把有效表达沉淀成可复用材料，减少每次从零开始的损耗。", "Turn effective expression into reusable materials and reduce the cost of starting from zero every time."],
    ["复盘表、线索记录与月度优化机制", "Review Sheets, Lead Records and Monthly Optimization."],
    ["让内容、线索和转化结果接上复盘，而不是停留在发布动作。", "Connect content, leads and conversion results to review, rather than stopping at publishing."],
    ["围绕企业场景搭建的 AI 工作流", "AI Workflows Built Around Business Scenarios."],
    ["用 AI 提升组织、调用和更新效率，由专业判断控制方向和质量。", "Use AI to improve organization, retrieval and updating efficiency, while professional judgement controls direction and quality."],
    ["最终形成的不是一套静态文件，而是一套能被团队持续调用、持续更新、持续复盘的线上认知系统。", "The final outcome is not a static set of files, but an online cognition system that teams can continuously call, update and review."],
    ["了解顺势引擎搭建方式", "Learn How to Build SHUNSE Pulse"],
    ["出海，不是把中文资料翻译出去。", "Going Global Is Not Translating Chinese Materials."],
    ["咨询出海表达诊断", "Consult Global Expression Diagnosis"]
  ]);

  const enToZh = new Map(Array.from(zhToEn, ([zh, en]) => [en, zh]));

  function replaceTextNodes(root, dictionary) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const raw = node.nodeValue;
      const match = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
      if (!match) return;
      const key = match[2].replace(/\s+/g, " ").trim();
      if (!dictionary.has(key)) return;
      node.nodeValue = `${match[1]}${dictionary.get(key)}${match[3]}`;
    });
  }

  function setLanguage(lang) {
    const toEnglish = lang === "en";
    replaceTextNodes(document.body, toEnglish ? zhToEn : enToZh);
    document.documentElement.lang = toEnglish ? "en" : "zh-CN";
    langLinks.forEach((link) => {
      link.textContent = toEnglish ? "中文" : "English";
      link.setAttribute("aria-label", toEnglish ? "Chinese version" : "English version");
    });
    localStorage.setItem("shunse-language", toEnglish ? "en" : "zh");
  }

  langLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const current = localStorage.getItem("shunse-language") === "en" ? "en" : "zh";
      setLanguage(current === "en" ? "zh" : "en");
    });
  });

  if (localStorage.getItem("shunse-language") === "en") {
    setLanguage("en");
  }
})();

// 20260630 subpage language supplement.
(() => {
  const langLinks = Array.from(document.querySelectorAll(".lang"));
  if (!langLinks.length) return;

  const extraZhToEn = new Map([
    ["不同国家的消费心理、信任路径、审美习惯、决策节奏和沟通方式不同。同一个产品，在国内客户眼里可能首先看品牌感、内容种草和即时体验；在海外客户眼里，可能更先看专业度、稳定交付、资质证据、合作流程和长期可信度。", "Consumer psychology, trust paths, aesthetic habits, decision rhythms and communication styles vary across markets. The same product may be judged by brand feeling and instant experience in China, while overseas customers may first look for professionalism, stable delivery, credentials, cooperation process and long-term trust."],
    ["SHUNSE 帮助企业围绕目标国家和目标客户，重组产品价值、品牌表达、案例证据、合作流程、独立站内容、LinkedIn / Google / 海外社媒表达和件。</ WhatsApp 询盘承接。", "SHUNSE helps companies reorganize product value, brand expression, case proof, cooperation processes, independent website content, LinkedIn / Google / overseas social media expression and WhatsApp inquiry handoff around target countries and customers."],
    ["目标国家与目标客户表达初。", "Initial expression for target countries and customers."],
    ["海外客户视角下的产品价值重。", "Product value restructuring from an overseas customer perspective."],
    ["英文 / 多语种企业介绍核心框。", "Core framework for English / multilingual company profiles."],
    ["独立站首页、产品页、案例页、FAQ 结构", "Independent website homepage, product page, case page and FAQ structure."],
    ["LinkedIn / Google / YouTube / TikTok / Instagram 内容方向", "LinkedIn / Google / YouTube / TikTok / Instagram content direction."],
    ["海外客户邮件 / WhatsApp 询盘承接话术", "Email / WhatsApp inquiry response scripts for overseas customers."],
    ["展会资料、合作流程、资质证据与案例证据结构", "Exhibition materials, cooperation process, credential proof and case proof structure."],
    ["创意、技术、内容与经营现场，必须连在一起。", "Creativity, Technology, Content and Real Business Operations Must Work Together."],
    ["团队能力模块", "Team Capability Modules"],
    ["SHUNSE 的团队不是单一文案、设计、代运营或 AI 工具服务商，而是一支围绕市场判断、品牌内容、视觉表达、流量承接、产品系统和 AI 工作流协同的小型复合团队。", "SHUNSE is not a single copywriting, design, operations or AI tool vendor. It is a compact multidisciplinary team built around market judgement, brand content, visual expression, traffic handoff, product systems and AI workflows."],
    ["品牌内容与全案策划", "Brand Content and Integrated Planning"],
    ["品牌内容、企业 IP、直播带货 0-1 搭建、全案营销策划。", "Brand content, company IP, livestream commerce from 0 to 1 and integrated marketing planning."],
    ["实体经营与流量落。", "Real Business Operations and Traffic Execution"],
    ["实体品牌连锁、活动策划、流量矩阵、落地执行。", "Physical brand chains, event planning, traffic matrices and execution."],
    ["视觉表达与 AI 创意", "Visual Expression and AI Creativity"],
    ["品牌视觉、社媒视觉、AI 创意设计、系列化视觉资产。", "Brand visuals, social media visuals, AI creative design and visual asset systems."],
    ["产品系统与 AI 工作流", "Product Systems and AI Workflows"],
    ["产品系统、AI 工作流、GEO / AEO、企业资料库、线索记录与复盘机制。", "Product systems, AI workflows, GEO / AEO, company data libraries, lead records and review mechanisms."],
    ["外部专家圈层", "External Expert Network"],
    ["根据项目需要补充商业、产业、品牌、渠道、空间、内容、技术等专业资源。", "Supplement business, industry, brand, channel, space, content and technology resources according to project needs."],
    ["件箱：shunse001@sina.com", "Email: shunse001@sina.com"]
  ]);

  const extraEnToZh = new Map(Array.from(extraZhToEn, ([zh, en]) => [en, zh]));

  function replaceTextNodes(root, dictionary) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const raw = node.nodeValue;
      const match = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
      if (!match) return;
      const key = match[2].replace(/\s+/g, " ").trim();
      if (dictionary.has(key)) node.nodeValue = `${match[1]}${dictionary.get(key)}${match[3]}`;
    });
  }

  function applySupplement() {
    replaceTextNodes(document.body, localStorage.getItem("shunse-language") === "en" ? extraZhToEn : extraEnToZh);
  }

  langLinks.forEach((link) => link.addEventListener("click", () => window.setTimeout(applySupplement, 0)));
  applySupplement();
})();
