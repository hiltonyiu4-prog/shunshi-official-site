# SHUNSE 诊断页公网测试报告

- 时间：2026-07-04T16:38:20.649Z - 2026-07-04T16:38:58.186Z
- 目标：https://shun-se.com
- 总结果：通过

## 检查项

### 通过 diagnosis_page_head

- 耗时：736 ms
- HTTP：200

### 通过 api_health

- 耗时：443 ms
- HTTP：200

### 通过 api_submit_single

- 耗时：8030 ms
- HTTP：200
- Job ID：1eaa0cb9-cf0a-4a6a-aa32-1cc4d197aef8
- 报告：单次公网测试企业 SHUNSE 企业线上认知自测报告
- 主诊断：内容主线断层
- 组合诊断：AI 放大混乱
- 建议进入：线上认知诊断
- LLM：{"optimized":true,"provider":"deepseek","model":"deepseek-v4-pro","optimizedAt":"2026-07-04T16:38:29.092Z"}
- 飞书：{"provider":"feishu-doc","saved":true,"mode":"docs-ai","documentId":"KdIydqVjIoRJwUxayescdZNPnTd"}

### 通过 browser_mobile_form_pdf

- 耗时：16676 ms
- HTTP：200
- Job ID：b094b056-eac4-4299-8068-da382219bceb
- PDF：浏览器公网测试企业 SHUNSE 企业线上认知自测报告-b094b056.pdf
- LLM：{"optimized":true,"provider":"deepseek","model":"deepseek-v4-pro","optimizedAt":"2026-07-04T16:38:44.317Z"}
- 飞书：{"provider":"feishu-doc","saved":true,"mode":"docs-ai","documentId":"KdIydqVjIoRJwUxayescdZNPnTd"}

### 通过 api_submit_10_concurrent

- 耗时：11651 ms
- 并发成功：10/10
- 并发总耗时：11651 ms
- 单请求 min/median/max：7701/9891/11647 ms

## 结论

公网诊断链路可用；当前 Cloudflare 未配置 DeepSeek API Key 时走规则报告终版回退。

