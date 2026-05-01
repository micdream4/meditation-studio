# Creem Setup

## Current Pricing

- Monthly: `$19/month`, includes 30 generation credits.
- Yearly: `$159/year`, includes 300 generation credits.

## Environment Variables

Add these values to `.env.local`:

```bash
CREEM_MODE=test
NEXT_PUBLIC_CREEM_MODE=test
CREEM_API_KEY=creem_test_...
CREEM_WEBHOOK_SECRET=...
CREEM_TEST_PRODUCT_ID=prod_...
CREEM_MONTHLY_PRODUCT_ID=prod_...
CREEM_YEARLY_PRODUCT_ID=prod_...
```

Use `CREEM_MODE=live` only after the full test flow passes.

## Creem Dashboard

For test mode, create one low-risk subscription product:

- Test checkout: `$1`, recurring monthly

Copy its Product ID into:

```bash
CREEM_TEST_PRODUCT_ID=
```

In test mode, both monthly and yearly buttons intentionally use this one `$1` test product. The selected plan is still sent in metadata so webhook sync can test both app states without risking a large charge.

For live mode, create two subscription products:

- Monthly: `$19/month`
- Yearly: `$159/year`

Copy their Product IDs into:

```bash
CREEM_MONTHLY_PRODUCT_ID=
CREEM_YEARLY_PRODUCT_ID=
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
- `subscription.trialing`
- `subscription.paused`

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
