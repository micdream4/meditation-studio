# Pricing Strategy

## Current Decision

Use a credit-based subscription instead of unlimited generation.

| Plan | Price | Included credits | Practical allowance |
| --- | ---: | ---: | --- |
| Basic | $9.90 / month | 30 credits | About 30 generated audio minutes |
| Plus | $19.90 / month | 75 credits | About 75 generated audio minutes |
| Pro | $29.90 / month | 120 credits | About 120 generated audio minutes |

One credit is treated as roughly one minute of generated TTS audio. Regenerating the same script with another voice consumes credits again, because it calls ElevenLabs again.

## Cost Basis

- ElevenLabs is the primary variable cost. Current API pricing shows Text to Speech charged per 1K characters, with cheaper Flash models and higher-quality Multilingual/v3 models at higher rates.
- OpenRouter script generation is much cheaper than TTS for this use case and should be treated as secondary cost.
- The product target is roughly 8-10x gross revenue over expected model/TTS cost before payment fees, hosting, storage, retries, and failed experiments.

References checked on 2026-04-29:
- ElevenLabs API pricing: https://elevenlabs.io/pricing/api/
- OpenRouter Qwen3.6 Flash pricing: https://openrouter.ai/qwen/qwen3.6-flash

## Implementation Notes

- `basic` includes 30 generation credits per billing period.
- `plus` includes 75 generation credits per billing period.
- `pro` includes 120 generation credits per billing period.
- Credits reset when the Creem subscription period changes.
- Credits are deducted only after audio is successfully generated and uploaded.
- Failed script generation or failed TTS does not deduct credits.
- Voice regeneration uses the existing script but still deducts credits based on duration.

## Creem Setup

Create three recurring products:

- Basic: `$9.90`, recurring monthly, env `CREEM_BASIC_PRODUCT_ID`
- Plus: `$19.90`, recurring monthly, env `CREEM_PLUS_PRODUCT_ID`
- Pro: `$29.90`, recurring monthly, env `CREEM_PRO_PRODUCT_ID`

The product entitlement is credit-limited rather than unlimited.
