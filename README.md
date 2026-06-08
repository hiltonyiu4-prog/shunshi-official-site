# 顺世官网品牌诊断 MVP

这个仓库先打通一条不需要传统服务器、也不需要数据库的官网诊断链路：

```txt
官网首页 -> 品牌诊断页 -> Cloudflare Pages Function -> GitHub Issues 保存线索/报告 -> 官网展示报告 -> 浏览器下载 PDF
```

## 为什么不是纯 GitHub Pages

GitHub Pages 只能托管静态页面，不能安全保存问卷、调用 Agent，或者隐藏 API 密钥。所以这里采用：

- GitHub：代码仓库 + 线索/报告存储
- Cloudflare Pages：托管官网 + serverless API
- GitHub Issues：MVP 阶段代替数据库
- 浏览器端 PDF：先把报告渲染出来，再下载 PDF

## 本地预览

静态页面可以直接打开：

```txt
public/index.html
public/diagnosis.html
```

如果要本地跑 API，需要安装 Wrangler 后运行：

```bash
npx wrangler pages dev public
```

## Cloudflare Pages 部署

1. 把仓库推到 GitHub。
2. 在 Cloudflare Pages 新建项目，连接这个 GitHub 仓库。
3. 构建配置：
   - Build command 留空
   - Build output directory 填 `public`
4. 在 Cloudflare Pages 的环境变量里配置：

```txt
GITHUB_TOKEN=你的 GitHub fine-grained token
GITHUB_OWNER=你的 GitHub 用户名或组织名
GITHUB_REPO=这个仓库名
AGENT_WEBHOOK_URL=你的 Agent Webhook 地址，可选
AGENT_WEBHOOK_TOKEN=你的 Agent Webhook Token，可选
FEISHU_APP_ID=飞书应用 App ID，可选
FEISHU_APP_SECRET=飞书应用 App Secret，可选
FEISHU_DOC_TOKEN=飞书文档 token，可选
FEISHU_OPEN_BASE_URL=https://open.feishu.cn
```

GitHub token 权限建议只给这个仓库的 Issues 读写权限。

提交成功后，页面 URL 会带上 `?job=编号`。这个链接可以重新打开同一份报告；如果已经配置 GitHub 存储，会从 GitHub Issue 读取。

飞书同步是可选增强：配置 `FEISHU_APP_ID`、`FEISHU_APP_SECRET` 和 `FEISHU_DOC_TOKEN` 后，每次提交会把线索和报告摘要追加到飞书文档。当前已创建的记录文档：

```txt
https://tcn9yblk27ey.feishu.cn/docx/KdIydqVjIoRJwUxayescdZNPnTd
FEISHU_DOC_TOKEN=KdIydqVjIoRJwUxayescdZNPnTd
```

如果飞书写入失败，不会影响用户生成和下载报告。

## 推荐部署路径

1. 代码推到 GitHub 公网仓库。
2. Cloudflare Pages 连接该 GitHub 仓库。
3. Cloudflare 的构建输出目录填 `public`。
4. Cloudflare Pages 会自动识别 `functions/` 目录作为后端 API。
5. 在 Cloudflare Pages 的 Settings → Environment variables 添加上面的变量。

## 沙龙报告与 PDF 方案

当前报告生成方式适合 50 人左右沙龙 MVP：

- 后端同步生成结构化文字报告，避免长队列和复杂任务系统。
- 前端立即展示 HTML 报告，用户先看到结果。
- PDF 在用户点击下载时由浏览器本地生成，`html2pdf` 已自托管在 `public/vendor/`，避免依赖外部 CDN。
- 如果后续单场超过 200 人，或报告包含大量图片/复杂排版，再升级为队列 + 服务端 PDF 渲染。

正式诊断入口路径：

```txt
https://shunse.com/diagnosis
```

注意：`shunse.com` 已添加到 Cloudflare Pages 自定义域，但仍需要把域名 DNS 接入当前 Cloudflare 账号，否则会保持 `CNAME record not set`。

## 域名绑定

在 Cloudflare Pages 项目的 Custom domains 里添加你的域名，例如：

```txt
www.example.com
```

然后按 Cloudflare 提示添加 CNAME。根域名也可以接入 Cloudflare DNS 后绑定。

## Agent 接口约定

如果配置了 `AGENT_WEBHOOK_URL`，后端会向它发送：

```json
{
  "jobId": "uuid",
  "submission": {
    "companyName": "企业名称",
    "contactName": "联系人",
    "answers": {}
  }
}
```

Agent 返回推荐格式：

```json
{
  "title": "品牌管理初诊报告",
  "score": 72,
  "level": "需要系统化建设",
  "executiveSummary": "摘要",
  "findings": ["发现一", "发现二"],
  "recommendations": ["建议一", "建议二"],
  "nextSteps": ["下一步一", "下一步二"]
}
```

未配置 Agent 时，系统会返回 mock 报告，用于先验证完整链路。
