# 🚀 K-UNIVERSAL: Environment Setup Quick Guide

**보스, API 키 입력 가이드입니다!**  
**예상 소요 시간**: 10-15분

---

## 📍 **WHERE TO EDIT**

```
File: .env.production
Location: C:\Users\polor\field-nine-solutions\.env.production
Editor: Any text editor (VS Code, Notepad, etc.)
```

**Open command:**
```powershell
code .env.production
# or
notepad .env.production
```

---

## 🔑 **STEP-BY-STEP: Fill in Each Key**

### **1️⃣ Supabase Keys** (REQUIRED)

**Where to get:**
1. Go to: https://app.supabase.com
2. Select your project
3. Click: Settings (⚙️) → API

**What to copy:**

```env
# From "Project URL" section:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# From "Project API keys" → "anon public":
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...

# From "Project API keys" → "service_role" (⚠️ Secret!):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNl...
```

**✅ Done? Check:**
- [ ] All 3 keys start with correct format
- [ ] No spaces before/after the `=`
- [ ] No quotes around values

---

### **2️⃣ Stripe Keys** (REQUIRED)

**Where to get:**
1. Go to: https://dashboard.stripe.com/test/apikeys
2. (For production: https://dashboard.stripe.com/apikeys)

**What to copy:**

```env
# Secret key (starts with sk_test_ or sk_live_):
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_KEY_HERE

# Publishable key (starts with pk_test_ or pk_live_):
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_KEY_HERE
```

**⚠️ Test vs Live:**
- Start with **TEST** keys (`sk_test_`, `pk_test_`)
- Switch to **LIVE** keys when ready for real payments

**✅ Done? Check:**
- [ ] Secret key starts with `sk_test_` or `sk_live_`
- [ ] Publishable key starts with `pk_test_` or `pk_live_`
- [ ] Both from same mode (both test OR both live)

---

### **3️⃣ OpenAI Key** (REQUIRED for OCR)

**Where to get:**
1. Go to: https://platform.openai.com/api-keys
2. Click: "Create new secret key"
3. Name it: "K-Universal Production"
4. Copy immediately (you can't see it again!)

**What to copy:**

```env
# Starts with sk-proj- (new format) or sk- (old format):
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**💡 Billing:**
- Make sure you have credits: https://platform.openai.com/account/billing
- GPT-4 Vision API usage: ~$0.01 per passport scan

**✅ Done? Check:**
- [ ] Key starts with `sk-proj-` or `sk-`
- [ ] You have billing enabled
- [ ] You can see the key in OpenAI dashboard

---

### **4️⃣ Google Maps Key** (REQUIRED for Dashboard)

**Where to get:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select project or create new one
3. Click: "Create Credentials" → "API Key"
4. Copy the key
5. Click "Edit API key" (restrict it for security)

**What to copy:**

```env
# Starts with AIzaSy:
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ Enable Required APIs:**

Go to: https://console.cloud.google.com/apis/library

Enable these 3 APIs:
```
1. Maps JavaScript API
2. Places API
3. Geocoding API
```

**🔒 Security (Recommended):**

Edit API key restrictions:
```
Application restrictions:
- HTTP referrers (web sites)
- Add: https://fieldnine.io/*
- Add: http://localhost:3000/* (for testing)

API restrictions:
- Restrict key
- Select: Maps JavaScript API, Places API, Geocoding API
```

**✅ Done? Check:**
- [ ] Key starts with `AIzaSy`
- [ ] All 3 APIs enabled
- [ ] Key works (test at localhost later)

---

### **5️⃣ Encryption Key** (REQUIRED for Security)

**This one is EASY - we'll generate it!**

**Run this command:**

```powershell
# In PowerShell (project directory):
node scripts/generate-encryption-key.js
```

**Expected output:**

```
🔐 K-Universal Encryption Key Generator
============================================================

✅ Key Generated Successfully!

📝 Copy this value to your .env.production file:
────────────────────────────────────────────────────────────
AES_ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
────────────────────────────────────────────────────────────

⚠️  SECURITY NOTICE:
   - Keep this key SECRET
   - Never commit to Git
   - Changing this key will invalidate existing encrypted data
```

**Copy the entire line** and paste into `.env.production`

**✅ Done? Check:**
- [ ] Key is exactly 64 characters long
- [ ] Only contains letters (a-f) and numbers (0-9)
- [ ] Saved securely (password manager recommended)

---

### **6️⃣ Monitoring Keys** (OPTIONAL - Skip for now)

**You can add these later without rebuilding:**

```env
# Leave as-is for now:
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
NEXT_PUBLIC_GA4_MEASUREMENT_ID=your_ga4_measurement_id_here
```

**To add later:**
- Sentry: https://sentry.io/settings/account/api/auth-tokens/
- GA4: https://analytics.google.com/analytics/web/

---

## ✅ **VERIFICATION CHECKLIST**

**Before saving .env.production:**

```
[✅] Supabase URL filled in
[✅] Supabase Anon Key filled in  
[✅] Supabase Service Role Key filled in
[✅] Stripe Secret Key filled in
[✅] Stripe Publishable Key filled in
[✅] OpenAI API Key filled in
[✅] Google Maps API Key filled in
[✅] AES Encryption Key generated & filled in
[⏸️] Sentry/GA4 left as-is (optional)
```

**Format check:**

```
[✅] No placeholder text left (no "your_xxx_here")
[✅] No extra spaces around = signs
[✅] No quotes around values
[✅] Each key on its own line
[✅] No empty lines between keys (OK if there are comments)
```

---

## 🧪 **TEST YOUR SETUP**

**After filling in all keys:**

### **Test 1: Local Development**

```powershell
# Terminal:
npm run dev
```

**Expected output:**
```
✓ Ready in 3.2s
○ Local:    http://localhost:3000
○ Network:  use --host to expose
```

**Open browser:**
```
✅ http://localhost:3000
   → Should show landing page (not error)

✅ http://localhost:3000/api/health
   → Should show: {"status":"ok","timestamp":"..."}
```

**If you see errors:**
```
Common: "Invalid Supabase URL"
Fix: Check NEXT_PUBLIC_SUPABASE_URL format

Common: "Stripe key not found"
Fix: Check STRIPE_SECRET_KEY is filled in

Common: "Google Maps failed to load"
Fix: Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
     Enable Maps JavaScript API
```

### **Test 2: Build**

```powershell
# Stop dev server (Ctrl+C)
npm run build
```

**Expected output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (19/19)
✓ Finalizing page optimization

Route (app)                              Size
┌ ○ /                                    142 B
├ ○ /dashboard                           ...
...
○  (Static)  prerendered as static content
```

**If build succeeds:**
```
✅ All environment variables are valid
✅ Ready for Docker production build
```

---

## 🐳 **NEXT: Docker Production**

**Only proceed if local tests pass!**

```powershell
# Build Docker image:
docker-compose -f docker-compose.prod.yml build

# Start container:
docker-compose -f docker-compose.prod.yml up -d

# Verify:
.\scripts\verify-deployment.ps1
```

---

## 📞 **QUICK REFERENCE**

### **All Keys Summary**

```
1. Supabase (3 keys)
   → https://app.supabase.com/project/_/settings/api

2. Stripe (2 keys)
   → https://dashboard.stripe.com/test/apikeys

3. OpenAI (1 key)
   → https://platform.openai.com/api-keys

4. Google Maps (1 key)
   → https://console.cloud.google.com/apis/credentials

5. Encryption (1 key)
   → Run: node scripts/generate-encryption-key.js

Total: 8 keys required
Time: ~10-15 minutes
```

### **File Location**

```
C:\Users\polor\field-nine-solutions\.env.production
```

### **Open Commands**

```powershell
# VS Code:
code .env.production

# Notepad:
notepad .env.production

# PowerShell ISE:
powershell_ise .env.production
```

---

## 🎯 **FINAL CHECKLIST**

```
Setup Phase:
[✅] .env.production file exists
[⏳] All 8 keys filled in
[⏳] No "your_xxx_here" placeholders
[⏳] Format verified (no spaces, no quotes)

Testing Phase:
[⏳] npm run dev works
[⏳] localhost:3000 loads
[⏳] /api/health returns OK
[⏳] npm run build succeeds

Production Phase:
[⏳] Docker build successful
[⏳] Docker container running
[⏳] All 10 verification tests pass
```

---

## 💡 **PRO TIPS**

### **Save Keys Securely**

```
✅ Use a password manager (1Password, LastPass, Bitwarden)
✅ Create entry: "K-Universal Production Keys"
✅ Store all keys there
✅ Never commit .env.production to Git (already in .gitignore)
```

### **Test vs Production**

```
Development:   .env.local (test keys)
Production:    .env.production (live keys)

Start with test keys → verify everything works → switch to live
```

### **Key Rotation**

```
Supabase:   Can't rotate (project keys)
Stripe:     Rotate in dashboard → update .env
OpenAI:     Rotate in dashboard → update .env
Google:     Create new key → update .env → delete old
Encryption: DON'T rotate (data will be lost)
```

---

**보스, 이 가이드를 따라하시면 10분 만에 완료됩니다!** 🚀

**Start here**: Open `.env.production` and fill in keys one by one.

---

*Quick Setup Guide by CTO Jarvis*  
*Estimated Time: 10-15 minutes*  
*Difficulty: Easy 🟢*
