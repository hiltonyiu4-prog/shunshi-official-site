# SHUNSE 官网最新版包 20260705

本目录整合了 `20260704` 官网页面与当前线上认知自测页，作为 SHUNSE 官网最新全页面版本。

## 页面入口

- 首页：`index.html`
- 关于顺世：`about.html`
- 品牌线上认知：`brand-cognition.html`
- 营销增长：`marketing-growth.html`
- 顺势引擎：`shunse-pulse.html`
- 出海表达：`global-expression.html`
- 线上认知自测：`diagnosis/index.html`

## 集成内容

- 使用 `index-第二页插入版.html` 作为最新版首页。
- 保留 `20260704/assets/`、`styles.css`、`main.js` 等官网资源。
- 新增自测页 `/diagnosis/`，并使用 `diagnosis/diagnosis.css` 做 PC / 移动端适配。
- 新增 `app.js`、`vendor/html2pdf.bundle.min.js`，用于报告预览与 PDF 下载。
- 新增 `functions/`，用于 Cloudflare Pages Functions 的诊断 API、飞书同步和报告生成。

## 本地预览

直接打开 `index.html` 可以查看静态官网页面。

如果要测试自测表提交、报告生成、飞书同步或 PDF 链路，需要在本目录运行：

```bash
npm run dev
```

然后打开：

```txt
http://localhost:8788/diagnosis/
```

直接用 `file://` 打开自测页只能看样式，提交会因为没有本地 API 而失败。
