# a-udf

This project was bootstrapped with Fastify-CLI.

![截图](https://github.com/xiaopc/a-udf/blob/main/docs/readme-screenshot.png)

## 简介

适用于 Tradingview `charting_library` 的国内数据源 UDF 接口

**本仓库不提供图表库 `charting_library` 本体，可自行申请获取，或搜索其他人提供**

可参考 [TradingView 中文开发文档](https://zlq4863947.gitbook.io/tradingview/) 等资料

## 功能

接入的数据源：

- [x] 搜索建议：东方财富
- [x] A 股、主要指数：东方财富（日 K、近期分时 K）
- [ ] 中证指数、国证指数等
- [ ] 港股
- [ ] 其他

实现的接口：

- [x] `/time` 服务器时间
- [x] `/config` 图表库配置
- [x] `/symbols` 「商品代码」之配置
- [ ] `/symbol_info` 「商品代码」集合
- [x] `/search` 搜索建议
- [x] `/history` K 线数据
- [x] `/marks` K 线上方标记（目前有：龙虎榜，建议前端配合 `onMarkClick`）
- [ ] `/timescale_marks` 时间轴上标记

以下为绘图存储接口（[官方实现 demo](https://github.com/tradingview/saveload_backend)）：

- [ ] `/charts`
- [ ] `/study_templates` 
- [ ] `/drawing_templates`

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://www.fastify.io/docs/latest/).
