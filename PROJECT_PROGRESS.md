# Meditation Studio — Project Progress Plan

**版本**: v0.1
**日期**: 2026-04-27
**对应 PRD**: [PRD.md](/Users/huanglu/Documents/Code/25-meditation-studio/PRD.md) v0.3.1
**对应任务清单**: [MVP_TASK_LIST.md](/Users/huanglu/Documents/Code/25-meditation-studio/MVP_TASK_LIST.md)
**用途**: 作为当前项目执行基线，跟踪 PRD 落地进度、阻塞项和下一步安排

---

## 一、使用原则

- `PRD.md` 是产品需求唯一基线
- 本文档只记录执行状态，不单独定义新产品需求
- 如果后续出现新的产品需求或范围调整，先更新 `PRD.md`，再更新本文档和任务清单

本轮已先修正 PRD 范围冲突：
- `6.6 背景音乐` 现已明确：MVP 下载默认是原始 TTS 音频，服务端混音下载延至 `v1.1`
- `6.8 精选内容` 现已明确：8 首精选内容完整开放播放，不再限制为 60 秒试听
- 2026-04-27 已完成远端 Supabase 初始化：migration、seed、`audio-assets` bucket 和 `/api/curated` 读取链路均已验证

---

## 二、当前总状态

当前项目状态可以概括为：

- 核心 Web 产品已基本成型
- 主要页面、认证、支付、生成、播放、保存、精选内容接口已经落代码
- 代码级联调已经基本打通
- 剩余阻塞主要集中在外部配置、运营素材、埋点和少量 MVP 缺口

当前里程碑判断：

- Phase 0：基本完成
- Phase 1：代码层基本完成
- Phase 2：代码层大部分完成
- Phase 3：未开始，且部分能力已按 PRD 延后到 `v1.1`

一句话判断：
- 当前不是“从 0 到 1”阶段，而是“上线前收口阶段”

---

## 三、PRD 对齐状态

| PRD 章节 | 关键要求 | 对应任务 | 当前状态 | 说明 |
|----------|----------|----------|----------|------|
| 第五章 商业模式与用户权益 | 月付 / 年付订阅 + 生成积分、游客与订阅用户分层 | `BILL-01` `BILL-02` `BILL-03` `BILL-04` | `部分完成` | 订阅链路已实现；已改为积分制；真实 Stripe Product/Price 和 Portal 仍需后台配置 |
| 第五章 公平使用与成本控制 | 并发、分钟级、日级限制 | `SAFE-02` `GEN-05` | `已完成（基础版）` | 已做并发 1、1 分钟 2 次、1 日 20 次；月度 60 次人工审查未落地 |
| 第五章 声音克隆规则 | 声音克隆 | `SAFE-05` | `按 PRD 延后` | `voice_profiles` 表已建，但功能未开放，符合 `v1.1` 延期决定 |
| 第六章 6.2 三种生成模式 | Mood / Template / Custom | `GEN-01` `CREATE-02` `CREATE-03` `CREATE-04` | `已完成` | 三种模式前后端已接通 |
| 第六章 6.3 生成流程 | 文案 -> TTS -> 播放 -> 保存 | `GEN-02` `GEN-03` `GEN-04` `GEN-05` `CREATE-05` `CREATE-06` `CREATE-07` | `已完成（基础闭环）` | 已改为 async TTS 轮询链路；失败重试和断点续跑未完成 |
| 第六章 6.4 文案生成规范 | 温和语气、第二人称、安全边界 | `GEN-02` `GEN-07` | `部分完成` | 已有基础 system prompt 和危机过滤；场景化 prompt pack 还未正式接入生产生成逻辑 |
| 第六章 6.5 音频生成与拼接 | 分段 TTS、上下文传递、自然拼接 | `GEN-03` | `部分完成` | 分段、串行、`previous_text/next_text` 已实现；50ms fade 尚未实现 |
| 第六章 6.6 背景音乐 | 2-3 首音乐、双音轨播放 | `CREATE-08` `CUR-03` | `部分完成` | 双音轨播放与独立音量已实现；当前仅 1 首占位钢琴曲，正式音乐库未补齐 |
| 第六章 6.7 我的音频库 | 播放、下载、删除、20 首上限 | `SAVE-02` `SAVE-03` `LIB-01` `LIB-02` `LIB-03` `LIB-04` `LIB-05` | `已完成（基础版）` | 核心操作已实现，并补了基本一致性保护 |
| 第六章 6.8 精选内容 | 8 首精选完整播放 | `CUR-01` `CUR-02` `CUR-03` `CUR-04` | `已完成（基础版）` | 首页已开放完整播放；版权归档与封面未完成 |
| 第七章 页面需求 | `/` `/pricing` `/login` `/signup` `/create` `/library` `/account` | `WEB-*` `AUTH-*` `CREATE-*` `LIB-*` | `大部分完成` | 页面已齐；个别验收项如 SEO、完整 paywall 细化、账户页声音入口仍未完成 |
| 第八章 数据模型 | `users` `generations` `saved_tracks` `voice_profiles` `curated_tracks` | `DATA-01` `DATA-02` `DATA-03` `DATA-04` `DATA-05` | `已完成` | migration 已执行到远端 Supabase，`curated_tracks` seed 为 8 条，`audio-assets` bucket 已创建 |
| 第九章 技术方案 | Supabase / Stripe / OpenRouter / ElevenLabs / IndexedDB / ffmpeg / Vercel | `INF-*` `GEN-*` `SAVE-*` | `部分完成` | 主技术栈已接入；IndexedDB 未做；ffmpeg 混音按 PRD 已延期到 `v1.1` |
| 第十章 安全合规 | 非医疗边界、危机输入、版权可追溯 | `SAFE-01` `SAFE-03` `SAFE-04` | `部分完成` | 非医疗边界和危机输入已有基础实现；版权清单与正式音乐授权文件未归档 |
| 第十一章 MVP 必做 | 首页、支付、生成、播放、保存、精选、账户 | `INF/BILL/GEN/CREATE/LIB/CUR` | `大部分完成` | 当前最明显未完成项是本地缓存 |
| 第十一章 MVP 不做 | 声音克隆、中文预设声音、服务端下载混音 | — | `已对齐` | 当前实现没有越界，符合 PRD |
| 第十二章 里程碑建议 | Phase 0/1/2/3 | — | `执行中` | 当前实际处于 Phase 2 尾声到上线准备之间 |
| 第十三章 待确认事项 | 免费体验、价格、声音、版权、宣传口径 | `SAFE-04` `OPS-*` | `待决策` | 这些是上线前仍需产品拍板的事项 |

---

## 四、当前已完成任务

以下按任务清单和实际代码状态整理。

### 4.1 已完成

- `INF-01` 初始化项目骨架
- `INF-02` 环境变量模板与校验脚本
- `INF-03` 第三方服务封装：Supabase / Stripe / OpenRouter / ElevenLabs
- `INF-05` 路由守卫与受保护路由
- `DATA-01` `DATA-02` `DATA-03` `DATA-04` `DATA-05` migration 与 bucket 方案
- `AUTH-01` Supabase Auth 接入
- `AUTH-02` `/login`
- `AUTH-03` `/signup`
- `AUTH-04` 忘记密码与重置密码页面
- `AUTH-05` `/account` 基础订阅信息区
- `BILL-02` Checkout 接口
- `BILL-03` Stripe Webhook 同步订阅状态
- `BILL-04` Customer Portal 接口
- `BILL-05` 订阅态接口与生成接口订阅校验
- `WEB-01` 首页
- `WEB-02` 定价页
- `WEB-03` 精选内容试听模块
- `WEB-04` 全站导航主路径
- `GEN-01` 生成协议
- `GEN-02` 文案生成服务
- `GEN-03` ElevenLabs 分段 TTS
- `GEN-04` generation 写库与状态流转
- `GEN-05` `/api/generate`
- `GEN-07` 基础输入安全与危机过滤
- `CREATE-01` 到 `CREATE-07`：创建页基础闭环
- `CREATE-08` 双音轨播放与独立音量控制
- `SAVE-02` 保存到库
- `SAVE-03` 20 首上限校验
- `LIB-01` 到 `LIB-05`：音频库列表、播放、下载、删除、空状态
- `CUR-01` 到 `CUR-04`：8 首内容、完整播放路径、接口、首页接入
- `SAFE-02` 生成接口基础频控
- `SAFE-03` 高风险输入拦截基础版

### 4.2 已完成但仍需外部执行

- `BILL-01` Stripe 产品和 Price 的“代码侧支持”已完成，但后台对象未创建
- `AUTH-01` Email / Google OAuth 代码已接好，但 Supabase Dashboard 仍需开启 provider

### 4.3 已完成的接管修复

- 修复 Stripe `returnUrl` 站外跳转风险
- 修复 OAuth callback 失败后仍假装登录成功的问题
- 修复 `/api/generate` 契约校验过弱的问题
- 修复 curated 静态资源依赖 `NEXT_PUBLIC_APP_URL` 的问题
- 修复 library save/delete 的基本一致性问题
- 完成远端 Supabase 初始化：5 张业务表、RLS 策略、`curated_tracks` 8 条 seed、`audio-assets` bucket
- 完成本地 `.env.local` 回填并清理 `.env.example` 中的真实密钥
- 验证 `/api/curated` 返回 `success=true` 和 8 条完整音频记录

---

## 五、当前待完成任务

### 5.1 P0：上线阻塞

- `BILL-01` 在 Stripe 后台创建 Product、Monthly Price、Yearly Price
  - Monthly Price: `$19/month`, includes 30 generation credits
  - Yearly Price: `$159/year`, includes 300 generation credits
- 配置线上环境变量
- 在 Supabase 开启 Email Auth 和 Google OAuth
- 配置真实 ElevenLabs voice ID
- 用真实密钥跑通一次完整链路：
  - `/pricing -> checkout -> webhook -> /create -> /library`

### 5.2 P1：强烈建议上线前完成

- `INF-04` 统一日志和错误码治理仍不够完整
- `GEN-06` 文案 / TTS 失败重试机制
- `WEB-05` SEO / OG 元信息
- `SAVE-01` IndexedDB 本地缓存
- `SAFE-01` 全站非医疗边界文案核查
- `SAFE-04` 精选内容与背景音乐版权归档
- `OPS-01` 核心埋点事件
- `OPS-02` 基础数据看板
- `OPS-03` 上线检查清单
- `OPS-04` 游客 / 订阅 / 过期用户回归脚本

### 5.3 P1：内容质量与体验优化

- 把 meditation skill 的 prompt pack 接入生成服务
- 增加 `scenario -> voice settings` 映射
- 做内部试听 / A-B 测试页
- 增加 2-3 首正式授权背景音乐，替换当前占位素材
- 为精选内容补封面、标题规范和来源清单

### 5.4 已按 PRD 延后到 v1.1

- 声音克隆功能
- 中文预设声音
- 服务端混音下载 MP3

---

## 六、当前阻塞项

### 6.1 外部系统阻塞

- 缺真实密钥和 Price ID，无法完成支付实测
- Supabase 数据库、seed 和 Storage bucket 已完成；OAuth provider 仍需 Google Client ID / Secret
- 缺正式音乐授权文件，不能按 PRD 视为可上线素材

### 6.2 产品决策阻塞

以下仍应回到 PRD 第十三章确认：

- 是否坚持“无免费完整生成”
- 对外不使用 “Unlimited generation”，改为 credit-based pricing
- 默认开放哪些预设声音
- 背景音乐最终来源与授权文件
- 当前价格策略：`$19/month = 30 credits`，`$159/year = 300 credits`

---

## 七、下一步执行顺序

建议按这个顺序推进：

1. 补齐外部配置：Stripe / ElevenLabs / Google OAuth / 线上 Env
2. 跑完整链路联调
3. 接入 prompt pack 和 voice settings
4. 做本地缓存与埋点
5. 整理版权与上线检查项
6. 进入预发布测试

---

## 八、关键文件入口

- 产品基线：[PRD.md](/Users/huanglu/Documents/Code/25-meditation-studio/PRD.md)
- 执行计划：[PROJECT_PROGRESS.md](/Users/huanglu/Documents/Code/25-meditation-studio/PROJECT_PROGRESS.md)
- 任务清单：[MVP_TASK_LIST.md](/Users/huanglu/Documents/Code/25-meditation-studio/MVP_TASK_LIST.md)
- 生成接口：[src/app/api/generate/route.ts](/Users/huanglu/Documents/Code/25-meditation-studio/src/app/api/generate/route.ts)
- 生成核心：[src/lib/generation.ts](/Users/huanglu/Documents/Code/25-meditation-studio/src/lib/generation.ts)
- 文案生成：[src/lib/openrouter.ts](/Users/huanglu/Documents/Code/25-meditation-studio/src/lib/openrouter.ts)
- TTS：[src/lib/elevenlabs.ts](/Users/huanglu/Documents/Code/25-meditation-studio/src/lib/elevenlabs.ts)
- 支付：[src/lib/stripe.ts](/Users/huanglu/Documents/Code/25-meditation-studio/src/lib/stripe.ts)
- Supabase：[src/lib/supabase.ts](/Users/huanglu/Documents/Code/25-meditation-studio/src/lib/supabase.ts)
- 安全 URL 工具：[src/lib/urls.ts](/Users/huanglu/Documents/Code/25-meditation-studio/src/lib/urls.ts)
- 数据迁移：[supabase/migrations/20260409_initial_schema.sql](/Users/huanglu/Documents/Code/25-meditation-studio/supabase/migrations/20260409_initial_schema.sql)
- Seed：[supabase/seed.sql](/Users/huanglu/Documents/Code/25-meditation-studio/supabase/seed.sql)
