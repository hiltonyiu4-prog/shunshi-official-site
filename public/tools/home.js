export function homeView({ groups, state, cards, escape: esc }) {
  const featured = [
    {id:'copy', n:'01', name:'电商文案', desc:'把产品卖点，写成购买理由。', label:'生成商品文案', preview:'把轻装出行，装进每一天。', sub:'轻量随行 · 随手收纳 · 日常通勤', tag:'模拟示例', type:'文案生成'},
    {id:'social', n:'02', name:'社群贴文', desc:'找到适合平台的表达。', label:'生成社群贴文', preview:'今天，给通勤减一点负担。', sub:'一段开场、一组卖点、一个行动邀请。', tag:'模拟示例', type:'内容传播'},
    {id:'roas', n:'03', name:'ROAS 试算', desc:'投放回报，先算清楚。', label:'开始试算', preview:'3.00', sub:'花费 ¥30,000 · 归因营收 ¥90,000', tag:'示例计算 · 非利润', type:'真实计算'},
  ];
  return `<section class="brand-intro"><div class="intro-copy"><div class="eyebrow">SHUNSE / MARKETING TOOLS</div><h1>营销的下一步，<br class="mobile-break">从这里开始。</h1><p>写文案、算投放、看会员。</p></div><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" aria-label="搜索工具" placeholder="你想解决什么？" value="${esc(state.query)}"></label></section>
  <section class="featured-section" aria-labelledby="featured-title"><div class="section-head"><h2 id="featured-title">先试试这三个</h2><span class="section-note">精选工具</span></div><div class="featured-grid">${featured.map((t,i)=>`<article class="featured-card ${i===0?'featured-main':''}"><div class="feature-meta"><span>${i===0?'🔥 重点推荐':t.type}</span><span>${t.n}</span></div><h3>${t.name}</h3><p>${t.desc}</p><div class="feature-preview ${t.id==='roas'?'number-preview':''}"><small>${t.tag}</small><strong>${t.preview}</strong><span>${t.sub}</span></div><a class="button ${i===0?'primary':''}" href="#${t.id}">${t.label}<span aria-hidden="true">↗</span></a></article>`).join('')}</div></section>
  <div class="trust-strip"><span><b>15</b> 个工具</span><span><b>5</b> 类场景</span></div>
  <section class="catalog-section" id="all-tools"><div class="section-head"><h2>找到你的工具</h2><span class="section-note">按任务选择</span></div><div class="filters" aria-label="工具分类">${['全部',...groups].map((g,i)=>`<button data-filter="${i-1}" aria-pressed="${state.group===i-1}" class="${state.group===i-1?'active':''}">${g}</button>`).join('')}</div><div class="tool-grid" id="cards">${cards()}</div></section>
  <section class="consult"><div><span class="eyebrow">LET'S TALK</span><h2>工具之外，一起找到增长方向。</h2><p>从你的业务出发，聊聊下一步。</p></div><a class="button" href="https://shun-se.com/diagnosis/" target="_blank" rel="noopener">预约线上认知诊断 ↗</a></section>`;
}
