# Stripe Live Mode Activation Checklist

## Phase 55: Financial Integrity

---

## 1. Stripe Dashboard Setup

### 1.1 Account Verification
- [ ] Business information verified
- [ ] Bank account connected
- [ ] Identity verification complete
- [ ] Tax information submitted (사업자등록번호: 361-17-01991)

### 1.2 Live API Keys (Stripe Dashboard > Developers > API Keys)
```
Publishable Key: pk_live_...
Secret Key: sk_live_...
```

### 1.3 Webhook Configuration
- [ ] Create webhook endpoint: `https://m.fieldnine.io/api/vrd/webhook`
- [ ] Events to subscribe:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `customer.subscription.created`
  - `customer.subscription.deleted`
- [ ] Copy Webhook Signing Secret: `whsec_...`

---

## 2. Vercel Environment Variables

### 2.1 Required Variables (Production)
```bash
# Run these commands:
vercel env add STRIPE_SECRET_KEY production
# Enter: sk_live_...

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Enter: pk_live_...

vercel env add STRIPE_VRD_WEBHOOK_SECRET production
# Enter: whsec_...
```

### 2.2 Verify Configuration
```bash
vercel env ls | grep -i stripe
```

---

## 3. Code Verification

### 3.1 Payment Route Check
- [x] `app/api/vrd/payment/route.ts` - Stripe integration
- [x] `app/api/vrd/webhook/route.ts` - Webhook handler
- [x] `components/vrd/VRDCheckout.tsx` - Stripe Elements

### 3.2 Environment Fallbacks
```typescript
// CORRECT - Production safe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// NEVER use hardcoded keys
```

---

## 4. Testing Protocol

### 4.1 Pre-Live Testing
```bash
# Test payment API (with test keys first)
curl -X POST https://m.fieldnine.io/api/vrd/payment \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "vrd-armor-leggings", "color": "Obsidian", "size": "M", "quantity": 1}],
    "currency": "KRW",
    "customer": {
      "email": "test@fieldnine.io",
      "name": "Test User",
      "phone": "010-1234-5678",
      "address": {
        "line1": "서울시 강남구 테헤란로 123",
        "city": "서울",
        "postal_code": "06234",
        "country": "KR"
      }
    },
    "shippingMethod": "standard"
  }'
```

### 4.2 Webhook Testing
```bash
# Stripe CLI (local testing)
stripe listen --forward-to localhost:3000/api/vrd/webhook
```

---

## 5. Go-Live Checklist

### Final Verification
- [ ] All test payments successful
- [ ] Webhook events receiving correctly
- [ ] Order confirmation emails sending
- [ ] Database orders recording properly
- [ ] Refund flow working

### Deploy Command
```bash
vercel --prod
```

---

## 6. Post-Launch Monitoring

### Stripe Dashboard
- Monitor successful payments
- Check for failed payments
- Review dispute/chargeback alerts

### Supabase Dashboard
- `vrd_orders` table populating
- `vrd_payment_logs` recording events

---

## Critical Reminders

1. **NEVER commit API keys** to git
2. **ALWAYS use environment variables**
3. **Test with small amounts first** (₩1,000)
4. **Monitor first 24 hours closely**

---

**Status: READY FOR ACTIVATION**
**Date: 2026-01-27**
**Signed: Field Nine AI System**
