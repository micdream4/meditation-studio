<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:meditation-studio-success-rules -->
# 产品成功目标

这个项目只有在满足下面条件时才算成功：付费用户可以稳定生成一段真正值得听完、保存、复听和下载的冥想音频。

不要把“代码能跑”或“生成了一个音频文件”当成最终质量标准。目标体验是：

- 生成出来的音频听起来像真实冥想老师在引导，而不是 AI 文案被朗读。
- 脚本、声音、停顿、语速、背景音乐要整体平静、自然、情绪安全、前后一致。
- 用户能清楚理解积分、生成状态、保存/下载行为和失败状态，不产生困惑。
- 支付、订阅权益、积分扣减、生成、保存、复听、下载要形成稳定的端到端闭环。
- 产品体验要明显好于“随便写一个 ChatGPT prompt 再丢给 TTS”的通用流程。

# 迭代规则

每做完一轮有意义的修改，都必须明确对照“产品成功目标”判断：这一轮让项目更接近目标、没有变化，还是变远了。

涉及生成质量时，不能只看脚本指标。只要条件允许，就要生成或检查真实音频样本，并评估：

- 用户是否愿意完整听完这一段？
- 用户是否愿意保存下来以后再听？
- 声音、停顿和语速是否符合所选场景？
- 修改是否提升了情绪安全性，并避免诊断、治疗承诺、夸张鸡汤或虚假安抚？
- 修改是否保持了付费产品闭环：积分、生成、保存、复听和下载？

持续用小步、可测试的方式迭代。每一轮都要尽量让产品可衡量地更接近这个目标。
<!-- END:meditation-studio-success-rules -->
