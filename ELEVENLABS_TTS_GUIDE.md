# ElevenLabs TTS Guide

更新日期：2026-04-09

## 目标

这份说明用来回答两个实际问题：

- 什么样的英文冥想文案更容易被 ElevenLabs 读得自然
- 哪些 voice settings 会明显影响“像真人”还是“像机器”

它不是理论说明，而是给当前项目和后续其他项目复用的调参手册。

## 一条核心判断

ElevenLabs 的自然度，通常由两部分共同决定：

1. 文案是否适合朗读
2. 声音参数是否和场景匹配

如果文案不适合朗读，再好的 voice 也会变僵。
如果文案写得对，但参数不对，结果也会发飘、发硬、过快或情绪失真。

## 什么最影响自然度

按影响力排序：

1. 句长
2. 停顿位置
3. 词汇复杂度
4. 场景和 voice 的匹配度
5. `stability`
6. `speed`
7. `similarity_boost`

结论：
- 先改文案，再调参数
- 不要反过来

## 适合 ElevenLabs 的冥想文案特征

### 1. 句子要短到能一口气读完

更好：

```text
Take a slow breath in.
And let it go gently.
Feel the surface beneath you.
```

较差：

```text
Take a slow breath in as you begin to notice the quiet support beneath your body, allowing yourself to soften into this moment with a sense of calm awareness.
```

影响结果：
- 句子越长，越容易出现气口奇怪、重音错位、尾句发飘

### 2. 一个句子只表达一个动作

更好：

```text
Notice your breath.
Then notice your shoulders.
Let them drop a little.
```

较差：

```text
Notice your breath, your shoulders, your jaw, and the subtle emotional tone of this moment, while allowing all of it to shift naturally.
```

影响结果：
- 多动作并列会让 TTS 节奏挤在一起

### 3. 用标点做停顿，不要堆特殊标记

建议：
- 逗号用于轻停顿
- 句号用于完整停顿
- 空行可以用于段落切换
- `[pause]` 只在确实需要时使用

影响结果：
- 标点自然时，TTS 会更像真人
- 标记过多时，音频会显得刻意和碎

### 4. 少用抽象词，多用身体感知词

更好：

```text
Feel the weight of your body.
Notice the cool air at the nose.
Let the exhale grow softer.
```

较差：

```text
Connect with your inner stillness.
Rest in the field of awareness.
Allow your consciousness to expand.
```

影响结果：
- 身体感知词更稳定，更像真实引导
- 抽象词容易让输出听起来“像模型在写”

## 最容易把声音弄僵的 prompt 写法

这些写法会明显伤害 ElevenLabs 输出：

- 长段落、长复句
- 过度诗化
- 过度 spiritual
- 口号式鼓励
- 过度解释“为什么这样做”
- 一句话里塞太多从句
- 频繁使用分号、破折号、括号
- 高频抽象词：presence, consciousness, transformation, healing energy

常见错误示例：

```text
You are now entering a profound space of transformation where each breath unlocks a deeper and more expansive awareness of your true inner wisdom.
```

问题：
- 太长
- 太虚
- 太像文案，不像真人引导

## 最容易改善自然度的 prompt 改动

优先做这几条：

1. 明确要求 `spoken English`
2. 明确要求 `TTS-friendly pacing`
3. 明确要求 `short, breathable sentences`
4. 限制“不要像 therapy / coaching / self-help hype”
5. 要求结尾 `soft closing`
6. 用场景模板而不是万能 prompt

这也是为什么当前 skill 里要把 `core + scenario references` 分开。

## 推荐的默认参数起点

以下不是官方最优值，而是适合“英文冥想音频”起步 A/B 测试的保守值。

### Sleep

- `stability: 0.72`
- `similarity_boost: 0.78`
- `speed: 0.92`

适合结果：
- 更稳
- 更慢
- 更少情绪跳动

风险：
- `stability` 太高会变平
- `speed` 太低会拖沓

### Anxiety Relief

- `stability: 0.66`
- `similarity_boost: 0.80`
- `speed: 0.95`

适合结果：
- 稳定但不过分机械
- 更像“陪伴式”说话

风险：
- 太慢会让焦虑用户更不耐烦

### Focus Reset

- `stability: 0.60`
- `similarity_boost: 0.76`
- `speed: 0.98`

适合结果：
- 清晰
- 不催眠
- 节奏更干净

风险：
- 如果 `speed >= 1.0`，容易失去冥想感

### Loving-Kindness

- `stability: 0.64`
- `similarity_boost: 0.82`
- `speed: 0.94`

适合结果：
- 情绪温度更高
- 仍然保持清晰

风险：
- `similarity_boost` 太高时，有些 voice 会显得用力过度

## 参数分别影响什么

### `stability`

大致作用：
- 越高，输出越稳、越一致
- 越低，输出越灵活、越有起伏

实际表现：
- 太低：可能更像真人，但也更容易飘
- 太高：更可控，但可能变平、变木

调参建议：
- 冥想场景通常先从 `0.60 - 0.72` 开始

### `similarity_boost`

大致作用：
- 越高，越贴近该 voice 的原始特征

实际表现：
- 太低：声音可能失去个性
- 太高：有时会带来不自然的强调和挤压感

调参建议：
- 多数冥想 voice 先从 `0.76 - 0.82` 开始

### `speed`

大致作用：
- 直接影响语速和听感压力

实际表现：
- 太快：像播报
- 太慢：像拖长字音，不自然

调参建议：
- 冥想场景通常从 `0.92 - 0.98` 开始

## 文案结构对 TTS 的具体影响

### 开头

影响最大的是“是否让听者能顺利进入”。

建议：
- 先安顿
- 不要一上来就讲哲理
- 不要一上来就命令深呼吸很多次

更好：

```text
Take a moment to arrive.
You do not need to change anything right away.
Just notice that you are here.
```

### 中段

影响最大的是“是否有单一主线”。

建议：
- 一次只带一个注意力锚点
- 不要在 breath、body、memory、visualization 之间频繁切换

### 结尾

影响最大的是“落地感”。

建议：
- gently close
- 不要突然结束
- 不要加宣传式总结

更好：

```text
Let this steadiness stay with you for a little longer.
And when you are ready, allow your attention to widen again.
```

## 推荐的测试方法

不要一上来就用很多变量一起测。最稳的方式是：

1. 固定一篇 2 分钟英文冥想文案
2. 固定一个 voice
3. 只改一项参数
4. 听 3 个版本
5. 记录主观结果

建议每次只测：
- `speed`
- 或 `stability`
- 或 prompt 结构

不要三项一起改，不然听感变化没法归因。

## 推荐的 A/B 组合

### Sleep

- A: `stability 0.72 / similarity 0.78 / speed 0.92`
- B: `stability 0.68 / similarity 0.80 / speed 0.93`

### Anxiety

- A: `stability 0.66 / similarity 0.80 / speed 0.95`
- B: `stability 0.62 / similarity 0.78 / speed 0.96`

### Focus

- A: `stability 0.60 / similarity 0.76 / speed 0.98`
- B: `stability 0.64 / similarity 0.76 / speed 0.97`

## 快速判断准则

如果你听到以下问题，通常说明这里要改：

- “像朗读，不像引导”
  - 先改文案句长和停顿
- “像 AI 在播，不像真人”
  - 降低抽象词和宣传感
  - 轻调 `stability`
- “太平，没有情绪”
  - 降一点 `stability`
- “太飘，不稳”
  - 升一点 `stability`
- “太快，听着累”
  - 降 `speed`
- “太慢，像拖字”
  - 升 `speed`

## 对当前 skill 的直接启发

当前的 `/Users/huanglu/.codex/skills/meditation-script-writer` 已经把最关键的文案层规则固定下来了，但它目前还不包含 voice settings。

如果下一步继续收口，最值得做的是：

1. 在项目里增加 scenario -> voice settings 的映射
2. 给 sleep / anxiety / focus 各准备 2 组默认参数
3. 做一个内部试听页，固定同一脚本批量试听

这样你后面不只是“能生成”，而是能稳定找到更自然的声音组合。
