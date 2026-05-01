# Pricing Strategy

## Current Decision

Use a credit-based subscription instead of unlimited generation.

| Plan | Price | Included credits | Practical allowance |
| --- | ---: | ---: | --- |
| Monthly | $19 / month | 30 credits | About 30 generated audio minutes |
| Yearly | $159 / year | 300 credits | About 300 generated audio minutes |

One credit is treated as roughly one minute of generated TTS audio. Regenerating the same script with another voice consumes credits again, because it calls ElevenLabs again.

## Cost Basis

- ElevenLabs is the primary variable cost. Current API pricing shows Text to Speech charged per 1K characters, with cheaper Flash models and higher-quality Multilingual/v3 models at higher rates.
- OpenRouter script generation is much cheaper than TTS for this use case and should be treated as secondary cost.
- The product target is 8-10x gross revenue over expected model/TTS cost before Stripe fees, hosting, storage, retries, and failed experiments.

References checked on 2026-04-29:
- ElevenLabs API pricing: https://elevenlabs.io/pricing/api/
- OpenRouter Qwen3.6 Flash pricing: https://openrouter.ai/qwen/qwen3.6-flash

## Implementation Notes

- `monthly` includes 30 generation credits per billing period.
- `yearly` includes 300 generation credits per billing period.
- Credits reset when Stripe subscription period changes.
- Credits are deducted only after audio is successfully generated and uploaded.
- Failed script generation or failed TTS does not deduct credits.
- Voice regeneration uses the existing script but still deducts credits based on duration.

## Stripe Setup

Create two recurring Prices:

- Monthly: `$19`, recurring monthly, env `STRIPE_MONTHLY_PRICE_ID`
- Yearly: `$159`, recurring yearly, env `STRIPE_YEARLY_PRICE_ID`

The code still uses Stripe subscriptions, but the product entitlement is now credit-limited rather than unlimited.
