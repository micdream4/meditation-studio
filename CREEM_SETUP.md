# Creem Setup

## Current Pricing

- Monthly: `$19/month`, includes 30 generation credits.
- Yearly: `$159/year`, includes 300 generation credits.

## Environment Variables

Add these values to `.env.local`:

```bash
CREEM_MODE=test
CREEM_TEST_API_KEY=creem_test_...
CREEM_TEST_WEBHOOK_SECRET=...
CREEM_TEST_PRODUCT_ID=prod_...
CREEM_LIVE_API_KEY=creem_live_...
CREEM_LIVE_WEBHOOK_SECRET=...
CREEM_MONTHLY_PRODUCT_ID=prod_...
CREEM_YEARLY_PRODUCT_ID=prod_...
```

`CREEM_MODE` controls both the checkout API endpoint and the pricing UI. Use `CREEM_MODE=test` for the sandbox API and `CREEM_MODE=live` for production.

## Creem Dashboard

For test mode, create one low-risk subscription product:

- Test checkout: `$1`, recurring monthly

Copy its Product ID into:

```bash
CREEM_TEST_PRODUCT_ID=
```

In test mode, both monthly and yearly buttons intentionally use this one `$1` test product. The selected plan is still sent in metadata so webhook sync can test both app states without risking a large charge.

For live mode, create at least one subscription product:

- Monthly: `$19/month`
- Yearly: `$159/year` (optional; leave it unset until the annual plan is ready)

Copy the Product IDs into:

```bash
CREEM_MONTHLY_PRODUCT_ID=
CREEM_YEARLY_PRODUCT_ID= # optional
```

## Webhook

Set the webhook endpoint to:

```text
https://your-domain.com/api/subscription/webhook
```

For local development, use a tunnel such as Cloudflare Tunnel or ngrok:

```bash
cloudflared tunnel --url http://localhost:3000
```

Then use the generated HTTPS URL:

```text
https://<tunnel-host>/api/subscription/webhook
```

Required events:

- `checkout.completed`
- `subscription.active`
- `subscription.paid`
- `subscription.canceled`
- `subscription.scheduled_cancel`
- `subscription.past_due`
- `subscription.expired`
- `subscription.update`
- `subscription.trialing`
- `subscription.paused`

## Production Go-Live

Creem test mode and production are separate environments. When switching to live mode:

1. Turn off Test Mode in the Creem dashboard.
2. Create live recurring products:
   - `Meditation Studio Monthly`: `$19/month`
   - `Meditation Studio Yearly`: `$159/year` (optional)
3. Copy the live product IDs into Vercel:

```bash
CREEM_MODE=live
CREEM_LIVE_API_KEY=creem_live_...
CREEM_LIVE_WEBHOOK_SECRET=...
CREEM_MONTHLY_PRODUCT_ID=prod_live_monthly...
CREEM_YEARLY_PRODUCT_ID=prod_live_yearly... # optional
```

Keep `CREEM_TEST_PRODUCT_ID` if you still want local test mode, but production does not use it. If `CREEM_YEARLY_PRODUCT_ID` is missing, the yearly price toggle stays hidden and only monthly checkout is available.

4. In the live Creem dashboard, create a live webhook:

```text
https://meditation-studio-ashy.vercel.app/api/subscription/webhook
```

5. Redeploy Vercel after updating environment variables.
6. Open `/pricing` and confirm it shows `$19/month` and `$159/year`, not the `$1` test checkout.
7. Complete one low-risk live checkout and confirm `/account` shows `Active`.

Do not use `creem_test_...` API keys or test webhook secrets with `CREEM_MODE=live`. If both test and live values are present, `CREEM_MODE` selects which pair is used.

## Validation

Run:

```bash
npm run creem:doctor
npm run validate:creem
```

Then test:

1. Sign in.
2. Open `/pricing`.
3. Start monthly checkout.
4. Complete Creem checkout.
5. Confirm webhook updates `/account`.
6. Generate a 1-minute session in dev mode and confirm credit deduction.
