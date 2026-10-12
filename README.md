# BigScreen
Display crypto code data and weather data of beijing

## 微信小程序

用微信开发者工具打开本仓库根目录（已包含 `project.config.json`）。

- 小程序代码在 `miniprogram/`，云函数在 `cloudfunctions/crypto`。
- 未开通云开发时，界面使用 `miniprogram/data/dashboard.json` 里的本地样例，天气也是样例。
- 换成云数据库：登录开发者工具，把 `project.config.json` 里的 `touristappid` 改成你的小程序 AppID，开通云开发，对 `cloudfunctions/crypto` 选择「上传并部署：云端安装依赖」，再在总览页下拉刷新。首次读取会把样例写入云数据库集合 `cities`、`series`、`events`、`details`。
