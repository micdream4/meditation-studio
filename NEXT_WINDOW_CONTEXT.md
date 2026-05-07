# Next Window Context

## Current Repo State

- Workspace: `/Users/huanglu/Documents/Code/25-meditation-studio`
- GitHub repo: `https://github.com/micdream4/meditation-studio`
- Current branch: `main`
- Latest pushed commit before the current uncommitted work: `865ceca Add three-tier Creem pricing`
- Remote uses SSH over 443:

```bash
ssh://git@ssh.github.com:443/micdream4/meditation-studio.git
```

## Payment / Domain Status

- Stripe has been abandoned for this project. Payment is now Creem.
- Creem live onboarding and payout setup reached review/compliance stage, then passed enough for live checkout testing.
- Domain is connected and working:
  - `https://meditationstudio.live`
  - `https://www.meditationstudio.live`
- Supabase Google login redirect issue was caused by auth/site URL settings pointing back to `localhost:3000`; production should point to `https://www.meditationstudio.live`.
- Creem live checkout was tested with a temporary `$1` live product and card charge succeeded. The app returned to `/create?checkout=success...` and showed subscription active.

## Current Pricing Model

The app has moved from one monthly plan to three subscription tiers:

- Basic: `$9.90/month`, `30 credits`
- Plus: `$19.90/month`, `75 credits`, recommended
- Pro: `$29.90/month`, `120 credits`

1 credit is treated as roughly 1 generated audio minute. Re-voicing an existing script also consumes credits because it runs TTS again.

Relevant files:

- `src/app/pricing/page.tsx`
- `src/app/pricing/PricingClient.tsx`
- `src/lib/creem.ts`
- `src/lib/credits.ts`
- `supabase/migrations/20260506_basic_plus_pro_plans.sql`
- `docs/pricing-cost-model.md`
- `docs/pricing-cost-model.csv`
- `docs/pricing-cost-model.xlsx`

## Creem Environment Variables

Production Vercel should use:

```env
CREEM_MODE=live
NEXT_PUBLIC_APP_URL=https://www.meditationstudio.live
CREEM_WEBHOOK_URL=https://www.meditationstudio.live/api/subscription/webhook
CREEM_LIVE_API_KEY=...
CREEM_LIVE_WEBHOOK_SECRET=...
CREEM_BASIC_PRODUCT_ID=...
CREEM_PLUS_PRODUCT_ID=...
CREEM_PRO_PRODUCT_ID=...
```

Test mode can still be kept separately:

```env
CREEM_TEST_API_KEY=...
CREEM_TEST_WEBHOOK_SECRET=...
CREEM_TEST_PRODUCT_ID=...
```

To switch production between test/live, set `CREEM_MODE` to `test` or `live`, then redeploy.

## Already Implemented

- Supabase auth and protected routes.
- OpenRouter script generation.
- ElevenLabs voice list, preview, TTS, and voice regeneration.
- Async TTS continuation and polling endpoint.
- Mood / theme / custom session creation.
- Background music selection and preview.
- Client-side mixed playback of voice + background music.
- Server-side mixed export foundation for downloads.
- Library page with custom compact player.
- Credit deduction for generation and re-voicing.
- Creem checkout, webhook sync, portal link, and three-tier product mapping.
- Legal pages: Privacy and Terms.
- Cost model docs and spreadsheet.

## Current Uncommitted Work In Progress

These changes are in progress and should be completed, verified, then committed/pushed:

- Direct download responses for generated/library audio instead of redirecting to a standalone audio page.
- Mixed background music export as downloadable WAV when a background track is selected.
- UI copy changed from “MP3 download” to “audio download”.
- Pricing display fixed so `$9.90`, `$19.90`, `$29.90` keep two decimals.
- Create page now starts to show remaining credits beside duration and after generation.
- TTS pacing made slower:
  - lower ElevenLabs speed defaults
  - longer punctuation pause cues
  - sparser OpenRouter word-count targets
  - stronger “studio-style slow spoken audio” system prompt
- SEO additions:
  - richer root metadata
  - `sitemap.xml`
  - `robots.txt`
- Lightweight analytics endpoint/helper was added but still needs usage events wired into key UI actions.

## Immediate Next Steps

1. Finish current code edits:
   - wire analytics events in pricing/create/library flows
   - finish subscription credit UI polish
   - make sure download route filenames/content types are correct
2. Run verification:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run build`
   - `npm run validate:supabase`
   - `npm run validate:creem`
3. Fix any type/lint/build errors.
4. Commit and push the completed work.
5. Redeploy Vercel.

## Product Work Still Worth Doing After This Pass

- Higher-quality voice tuning:
  - compare generated output against the eight homepage curated audios
  - possibly curate/clone a more natural meditation voice if licensing allows
- Background music:
  - continue replacing/curating better royalty-free meditation loops
  - verify saved library downloads include mixed background audio
- Subscription/account polish:
  - show plan name and correct monthly credit allowance after Basic/Plus/Pro purchases
  - confirm webhook events for all three Creem products
  - add clearer “credits remaining” and “insufficient credits” messaging
- Production readiness:
  - confirm `NEXT_PUBLIC_APP_URL` is set to `https://www.meditationstudio.live`
  - confirm Creem live webhook URL uses `/api/subscription/webhook`
  - remove or archive the temporary `$1` live test product once no longer needed
  - keep the old `$19/month` product inactive or unused to avoid confusion
