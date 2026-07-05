# SHUNSE 诊断页公网测试报告

- 时间：2026-06-08T17:43:14.173Z - 2026-06-08T17:43:25.259Z
- 目标：https://shun-se.com
- 总结果：通过

## 检查项

### 通过 diagnosis_page_head

- 耗时：312 ms
- HTTP：200

### 通过 api_health

- 耗时：291 ms
- HTTP：200

### 通过 api_submit_single

- 耗时：798 ms
- HTTP：200
- Job ID：8430257e-8707-4fe0-9f80-f2530fcfed10
- 报告：单次公网测试企业 SHUNSE 企业线上认知自测报告
- 主诊断：内容主线断层
- 组合诊断：AI 放大混乱
- 建议进入：线上认知诊断
- LLM：{"optimized":false,"skipped":true,"reason":"missing DEEPSEEK_API_KEY or REPORT_LLM_API_KEY"}
- 飞书：{"provider":"feishu-doc","saved":true,"mode":"docs-ai","documentId":"KdIydqVjIoRJwUxayescdZNPnTd"}

### 通过 browser_mobile_form_pdf

- 耗时：7922 ms
- HTTP：200
- Job ID：2ed5fe26-b6c2-40c9-9cc4-7c9724df4b05
- PDF：浏览器公网测试企业 SHUNSE 企业线上认知自测报告-2ed5fe26.pdf
- LLM：{"optimized":false,"skipped":true,"reason":"missing DEEPSEEK_API_KEY or REPORT_LLM_API_KEY"}
- 飞书：{"provider":"feishu-doc","saved":true,"mode":"docs-ai","documentId":"KdIydqVjIoRJwUxayescdZNPnTd"}

### 通过 api_submit_10_concurrent

- 耗时：1762 ms
- 并发成功：10/10
- 并发总耗时：1762 ms
- 单请求 min/median/max：766/1240/1761 ms

## 结论

公网诊断链路可用；当前 Cloudflare 未配置 DeepSeek API Key 时走规则报告终版回退。
