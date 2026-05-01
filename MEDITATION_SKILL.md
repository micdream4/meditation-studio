# Meditation Script Skill

更新日期：2026-04-09

## 目标

这是一套可复用的英文冥想文案 skill，用来稳定生成适合 spoken audio / TTS 的冥想脚本，不只服务当前项目，也可以在其他内容工作流里复用。

它解决的核心问题：
- 普通大模型容易把冥想文案写成鸡汤、说教、治疗建议或过度诗化文本
- ElevenLabs 这类 TTS 对句长、停顿、节奏非常敏感
- 同一个场景需要稳定风格，不能每次都靠临时 prompt 手调

## Skill 位置

- Skill 根目录：`/Users/huanglu/.codex/skills/meditation-script-writer`
- 主说明文件：`/Users/huanglu/.codex/skills/meditation-script-writer/SKILL.md`
- Agent 配置：`/Users/huanglu/.codex/skills/meditation-script-writer/agents/openai.yaml`

## 已包含的能力

- 通用英文冥想文案规则
- TTS 友好的句式和节奏约束
- 安全边界：避免治疗、诊断、危机处理类输出
- 4 个细分场景模板：
  - sleep
  - anxiety relief
  - focus reset
  - loving-kindness

参考文件：
- `/Users/huanglu/.codex/skills/meditation-script-writer/references/core.md`
- `/Users/huanglu/.codex/skills/meditation-script-writer/references/sleep.md`
- `/Users/huanglu/.codex/skills/meditation-script-writer/references/anxiety.md`
- `/Users/huanglu/.codex/skills/meditation-script-writer/references/focus.md`
- `/Users/huanglu/.codex/skills/meditation-script-writer/references/loving-kindness.md`

## 使用方式

在后续对话里直接点名这个 skill：

```text
Use $meditation-script-writer to draft a 10-minute English sleep meditation for spoken audio.
```

也可以带更具体的约束：

```text
Use $meditation-script-writer to write a 5-minute English anxiety relief meditation.
Keep it gentle, grounded, and suitable for ElevenLabs narration.
Avoid mystical language.
```

如果你只是想让模型重写已有稿子，也可以：

```text
Use $meditation-script-writer to rewrite this script for calmer pacing and better TTS rhythm.
```

## 设计原则

这套 skill 当前固定了几条关键规则：
- 只写适合朗读的英文，不写“屏幕阅读型”文案
- 统一使用第二人称
- 优先短句和中短句，减少复杂从句
- 用标点制造停顿，只在必要时使用 `[pause]`
- 不输出医学承诺、心理治疗语言、危机误导内容
- 结尾必须柔和落地，适合音频收束

## 时长控制

默认词数目标：
- 5 分钟：450-650 词
- 10 分钟：900-1,200 词
- 15 分钟：1,300-1,700 词
- 20 分钟：1,700-2,200 词

这只是初始目标。真正上线时，还应结合 ElevenLabs 的真实语速继续微调。

## 校验结果

Skill 已创建并通过基础校验。

本机校验命令：

```bash
/opt/anaconda3/bin/python3 /Users/huanglu/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/huanglu/.codex/skills/meditation-script-writer
```

说明：
- `quick_validate.py` 的 shebang 在当前机器上会走到没有 `yaml` 依赖的 Python 环境
- 所以这里显式指定了可用解释器 `/opt/anaconda3/bin/python3`
- 这属于本机 Python 环境差异，不是 skill 本身的问题

## 与项目的关系

当前 skill 已经可独立复用，但项目里的 `src/lib/openrouter.ts` 还没有完全改成“直接吃这套 skill prompt pack”的结构。

如果后面要进一步收口，建议做两件事：
- 把 skill 的核心 prompt 复制一份到项目内的 prompt module
- 让 `/api/generate` 按场景自动选择对应模板，而不是只用单一 prompt

## 下一步建议

如果继续做，我建议按这个顺序：

1. 把 skill prompt pack 映射到项目代码里的 scenario router
2. 选 2 到 3 个 ElevenLabs 声音做横向试听
3. 调一版 sleep / anxiety / focus 的默认 voice settings
4. 做一个内部测试页，批量比较不同声音和不同 prompt 的输出效果
