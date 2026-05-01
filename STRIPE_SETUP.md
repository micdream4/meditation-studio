# Stripe Setup

## Current Pricing

- Monthly: `$19/month`, includes 30 generation credits.
- Yearly: `$159/year`, includes 300 generation credits.

## Automated Product And Price Setup

1. Put your Stripe secret key in `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
```

2. Run:

```bash
npm run stripe:setup
```

The script creates or reuses:

- Product: `Meditation Studio`
- Monthly recurring Price: `$19/month`
- Yearly recurring Price: `$159/year`

It writes these values back to `.env.local`:

```bash
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

## Manual Values Still Needed

Add the publishable key from Stripe dashboard:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

For local webhook testing, install/login Stripe CLI and run:

```bash
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

Then copy the printed signing secret:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

For production, create a Stripe webhook endpoint:

```text
https://your-domain.com/api/subscription/webhook
```

Events required:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Billing Portal

Enable Stripe Customer Portal in Dashboard:

```text
Settings -> Billing -> Customer portal
```

Allow customers to cancel subscriptions and update payment methods.
