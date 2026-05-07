# Meditation Studio Pricing and Cost Model

Updated: 2026-05-06

This document summarizes the current credit rule and the first public three-tier pricing structure:

- Basic: `$9.90/month` with `30 credits`
- Plus: `$19.90/month` with `75 credits`
- Pro: `$29.90/month` with `120 credits`

The editable Excel model is here: [pricing-cost-model.xlsx](./pricing-cost-model.xlsx)

## Current Product Rule

The app currently treats one product credit as one generated audio minute.

Code references:

- `src/lib/credits.ts`: `getGenerationCreditCost(input)` returns `input.durationMinutes`.
- `src/lib/credits.ts`: Basic grants `30` credits, Plus grants `75` credits, and Pro grants `120` credits.
- `src/lib/generation.ts`: credits are consumed after audio generation succeeds.
- `src/app/pricing/page.tsx`: public prices default to `$9.90`, `$19.90`, and `$29.90` unless env vars override them.

Practical examples:

| Selected duration | Credits consumed |
|---:|---:|
| 5 minutes | 5 credits |
| 10 minutes | 10 credits |
| 15 minutes | 15 credits |
| 20 minutes | 20 credits |

Voice regeneration also consumes credits again because it creates a new generated audio result.

## Source Pricing Assumptions

The spreadsheet keeps these as editable inputs.

| Cost item | Assumption used | Source / note |
|---|---:|---|
| Creem payment fee | `3.9% + $0.40` per successful transaction | Creem pricing page |
| ElevenLabs Multilingual v2/v3 TTS | `$0.10 / 1K characters` | ElevenLabs API pricing |
| ElevenLabs Music generation | `$0.30 / minute` | Only relevant if we generate music dynamically. Current model defaults this to `$0`. |
| OpenRouter `qwen/qwen3.6-flash` | `$0.25 / 1M input tokens`, `$1.50 / 1M output tokens` | Current default script model in code |
| Other variable reserve | `$0.50 / subscriber` | Adjustable reserve for storage, bandwidth, retries, support, small failed-generation waste |
| Refund / chargeback reserve | `1%` of payment | Adjustable operating reserve |
| Tax reserve | `0%` by default | Creem is Merchant of Record, but tax-inclusive settlement should be reconciled against Creem reports after real orders |

Important modeling assumption: the calculations below assume the user consumes all included credits. Real margins improve if users leave unused credits.

## Character and Token Assumptions

The main cost driver is ElevenLabs TTS characters, not OpenRouter.

Default model assumptions:

- `750 characters / generated minute`
- `1,000 input tokens / generation request`
- `140 output tokens / generated minute`
- `10 credits` average session length

Approximate TTS cost per generated minute:

```text
750 chars / minute / 1,000 * $0.10 = $0.075 per generated minute
```

Approximate OpenRouter cost per generated minute is below one tenth of one cent in normal usage, so it is included in the model but not a pricing driver.

## Scenario Comparison

Default model includes Creem fee, 1% refund reserve, TTS, OpenRouter, and `$0.50` other variable reserve.

| Scenario | Price | Credits | Revenue / credit | Net after Creem + reserves | Variable cost | Gross profit | Gross margin | Profit / credit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Basic | `$9.90` | `30` | `$0.33` | `$9.01` | `$2.76` | `$6.26` | `63.2%` | `$0.21` |
| Plus | `$19.90` | `75` | `$0.27` | `$18.52` | `$6.14` | `$12.38` | `62.2%` | `$0.17` |
| Pro | `$29.90` | `120` | `$0.25` | `$28.03` | `$9.53` | `$18.51` | `61.9%` | `$0.15` |

## Detailed Formula

For each scenario:

```text
Creem fee = price * 3.9% + $0.40
Refund reserve = price * 1%
Net after platform/reserves = price - Creem fee - tax reserve - refund reserve

Estimated sessions = credits / average session length

TTS cost = credits * characters per credit / 1,000 * ElevenLabs TTS price
OpenRouter cost =
  estimated sessions * input tokens per session / 1,000,000 * input token price
  + credits * output tokens per credit / 1,000,000 * output token price
Generated music cost = credits * music generation price per minute

Total variable cost = TTS cost + OpenRouter cost + generated music cost + other variable reserve
Gross profit = net after platform/reserves - total variable cost
Gross margin = gross profit / price
Profit per credit = gross profit / credits
```

## Interpretation

Basic is a low-friction entry plan. It lets a user create about three 10-minute sessions or two 15-minute sessions per month. It has enough margin for organic users, but it is not ideal for paid acquisition because absolute profit per subscriber is only about `$6.26` under full-credit usage.

Plus should be the recommended default. It improves perceived value compared with the original `$19 / 30 credits` idea, while keeping a healthy full-use gross margin around `62%`. It gives a user roughly seven 10-minute sessions or five 15-minute sessions per month.

Pro gives frequent users more room without collapsing margin. It supports about twelve 10-minute sessions, eight 15-minute sessions, or six 20-minute sessions per month. Profit per credit is lower than Basic, but absolute profit per subscriber is the strongest of the three.

## Recommended Use of the Excel Model

Use the `Inputs` sheet to adjust:

- plan price
- credits included
- characters per generated minute
- average session length
- ElevenLabs TTS price
- optional music generation cost
- refund reserve
- tax reserve
- other variable cost

Then review:

- `Dashboard`: side-by-side summary
- `Scenario Model`: full formula breakdown
- `Sources`: assumptions and source links

The fastest way to test pricing is to edit the scenario rows in `Scenario Model`, then compare `Gross profit`, `Gross margin`, and `Profit / credit`.

## Recommendation for Now

Launch with:

```text
Basic  $9.90/month   30 credits
Plus   $19.90/month  75 credits
Pro    $29.90/month  120 credits
```

Make Plus the visually recommended plan.

After collecting actual data for:

- average credits consumed per subscriber
- average generated characters per minute
- retry / failed-generation rate
- refund rate
- Creem settlement after tax-inclusive purchases

then revisit whether Plus should become `$19.90 / 90 credits` or whether Basic should remain the main entry plan.
