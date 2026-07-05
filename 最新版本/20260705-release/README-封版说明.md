# 20260705-release 封版说明

封版日期：2026-07-05

这个目录是 SHUNSE 官网当前上线版本的封版归档。原则上不要在这里继续做功能修改；后续新改动请放到 `最新版本/20260730`。

## 归档内容

- 官网前端页面与样式：`index.html`、`styles.css`、`app.js`、`diagnosis/`
- 官网素材：`assets/`、`vendor/`
- Cloudflare Pages 部署目录：`public/`
- 后端接口与报告逻辑：`functions/`
- 测试与检查脚本：`scripts/`
- 测试记录与截图：`test-artifacts/`
- 部署配置：`wrangler.toml`、`package.json`

## 当前线上能力

- 首页正常展示，包括地球线条背景。
- 点击预约线上认知诊断可进入自测问卷。
- 问卷提交后生成诊断报告，并支持 PDF 下载。
- 提交记录写入飞书固定文档：
  - 总表格清单：https://tcn9yblk27ey.feishu.cn/docx/BlmHdZc9po2ahRxq894ctdItnHf
  - 详情记录文档：https://tcn9yblk27ey.feishu.cn/docx/EfMpdCM7JoM9GSxDth7c0DDUn4d

## GitHub 归档建议

这个版本建议在 GitHub 中保留一次提交，并打标签 `20260705-release`。标签用于未来回滚或查找当时上线版本。
