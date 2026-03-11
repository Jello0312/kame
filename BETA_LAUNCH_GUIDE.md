# Kame Beta Launch Guide

> Written for a non-technical founder. Follow these steps in order.
> Estimated time: ~45 minutes total.

---

## What You Already Have (no action needed)

- **Database** (Supabase) — already set up and working
- **FASHN AI key** — already in your server .env
- **Google Form** for beta feedback — already created and wired into the app
- **Code pushed to GitHub** — already done (github.com/Jello0312/kame)

---

## What You Still Need to Set Up

| Service | What It Does | Cost | Required? |
|---------|-------------|------|-----------|
| **Railway** | Runs your server on the internet | Free trial ($5 credit) | YES |
| **Upstash** | Redis queue for try-on jobs | Free tier (10k commands/day) | YES for try-on |
| **AWS S3** | Stores user photos & try-on results | Free tier (5GB) | Recommended |
| **Expo** | Lets testers install the app on their phones | Free | YES |

> **Without Upstash Redis:** The app works (login, swipe, favorites) but virtual try-on won't generate. Users see product photos only.
>
> **Without AWS S3:** User photos are stored on the server's local disk. They get deleted every time the server restarts. Not ideal but functional for a short beta test.

---

## STEP 1: Set Up Upstash Redis (5 min)

This gives the try-on feature a job queue so it can process images in the background.

1. Go to **https://console.upstash.com** and create a free account (you can sign up with GitHub)
2. Click **"Create Database"**
3. Settings:
   - **Name:** `kame-redis`
   - **Region:** Pick `US-East-1` (closest to your Supabase database)
   - **Type:** Regional
   - **Eviction:** OFF
4. Click **Create**
5. On the database detail page, find **"REST URL"** — you DON'T need this
6. Instead, scroll to **"Connect to your database"** section and look for the **`redis://`** connection string
   - It looks like: `redis://default:AbCdEfG123@us1-xyz-12345.upstash.io:6379`
7. **Copy this URL and save it somewhere** — you'll paste it into Railway in Step 2

REDIS_URL="rediss://default:gQAAAAAAAQZ2AAIncDI1YTkxOGI3ZTA2N2Q0NDIxYTk4MTBiYjJkMWQ2YmMyYnAyNjcxOTA@precise-hawk-67190.upstash.io:6379"
---

## STEP 2: Deploy Server to Railway (15 min)

Railway runs your server on the internet so the app can talk to it from anywhere (not just your WiFi).

### 2a. Create a Railway Account

1. Go to **https://railway.com** and click **"Login"**
2. Sign in with your **GitHub** account (the same one that has the Kame repo)
3. You get a free trial with $5 credit — plenty for beta testing

### 2b. Create a New Project

1. On the Railway dashboard, click **"New Project"**
2. Choose **"Deploy from GitHub Repo"**
3. Select your **kame** repository (`Jello0312/kame`)
4. Railway will detect your code — but we need to configure it first

### 2c. Configure the Service

Railway may auto-detect the wrong folder. You need to point it to the server:

1. Click on the service that was created
2. Go to the **"Settings"** tab
3. Under **"Source"**:
   - **Root Directory:** type `apps/server`
   - This tells Railway "the server code is in the apps/server folder"
4. Under **"Build"** — Railway should auto-detect the `railway.json` file. If it asks, the build command is:
   ```
   pnpm install --frozen-lockfile && cd ../../packages/shared-types && pnpm run build && cd ../../apps/server && pnpm run build
   ```
5. Under **"Deploy"** — the start command is:
   ```
   pnpm run db:deploy && pnpm run start
   ```
6. Under **"Networking"**:
   - Click **"Generate Domain"** — this gives you a public URL like `kame-server-production.up.railway.app`
   - **Copy this URL** — you'll need it later for the mobile app

### 2d. Add Environment Variables

This is the most important step. Your server needs these secrets to function.

1. Go to the **"Variables"** tab in your Railway service
2. Click **"New Variable"** and add each of these ONE BY ONE:

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `DATABASE_URL` | Your Supabase connection string | Already in your server .env file (the long `postgresql://...` string with `pgbouncer=true`) |
| `DIRECT_URL` | Your Supabase direct connection | Already in your server .env file (the other `postgresql://...` string) |
| `JWT_SECRET` | `96f7a2d11539e304bad552131f695a1d58c130fd76528ed5de6c8b01b295e07f` | I generated this for you (a random 64-character hex string). Use this exact value |
| `JWT_EXPIRES_IN` | `7d` | Just type this — means tokens last 7 days |
| `FASHN_API_KEY` | Your FASHN key | Already in your server .env file (starts with `fa-`) |
| `REDIS_URL` | Your Upstash Redis URL | From Step 1 (starts with `redis://`) |
| `PORT` | `3001` | Just type this |
| `NODE_ENV` | `production` | Just type this |

**Optional (for photo storage — recommended):**

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `AWS_ACCESS_KEY_ID` | Your AWS key | See Step 3 below |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret | See Step 3 below |
| `AWS_S3_BUCKET` | `kame-uploads` | Just type this |
| `AWS_REGION` | `us-east-1` | Just type this |

3. After adding all variables, Railway will automatically redeploy

### 2e. Verify It's Working

1. Wait 2-3 minutes for the deploy to finish (watch the "Deployments" tab — it should say "Success")
2. Open your browser and go to: `https://YOUR-RAILWAY-DOMAIN/health`
   - Replace `YOUR-RAILWAY-DOMAIN` with the domain Railway gave you in step 2c
   - You should see: `{"status":"ok","service":"kame-server",...}`

https://kameserver-production.up.railway.app/health


3. If you see that, your server is live!

**If the deploy fails:**
- Click on the failed deployment to see logs
- Common issues:
  - "Missing required environment variable" — you forgot one of the variables above
  - "Can't reach database" — double-check your DATABASE_URL was copied correctly
  - Let me know the error and I can help debug

---

## STEP 3: Set Up AWS S3 (Optional, 10 min)

S3 stores user photos and try-on results permanently. Without it, photos are stored on Railway's local disk and get deleted on every redeploy.

> **Skip this step if you want a quick test.** The app will work without S3 — photos just won't survive server restarts. You can add S3 later.

### If you want to set up S3:

1. Go to **https://aws.amazon.com** and create a free account (requires a credit card but won't charge for free tier)
2. Go to **S3** in the AWS console
3. Click **"Create bucket"**
   - **Name:** `kame-uploads`
   - **Region:** `US East (N. Virginia)` us-east-1
   - Uncheck "Block all public access" (needed so the app can view images)
   - Click **Create bucket**
4. Go to **IAM** → **Users** → **Create user**
   - **Name:** `kame-server`
   - Attach policy: `AmazonS3FullAccess`
   - Create the user → go to **Security credentials** → **Create access key**
   - Copy the **Access Key ID** and **Secret Access Key**
5. Go back to Railway → **Variables** tab → add the 4 AWS variables from the table above

---

## STEP 4: Update Mobile App to Talk to Your Server (2 min)

Right now the mobile app tries to talk to your laptop (`192.168.68.52:3001`). We need to point it to Railway.

1. Open the file: `apps/mobile/.env`
2. Change this line:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.68.52:3001
   ```
   to:
   ```
   EXPO_PUBLIC_API_URL=https://YOUR-RAILWAY-DOMAIN
   ```
   Replace `YOUR-RAILWAY-DOMAIN` with the domain Railway gave you (from Step 2c).

> **Tell me your Railway domain** and I'll make this change for you!

---

## STEP 5: Set Up Expo & Test on Your Phone (10 min)

Expo lets you run the app on a real phone without publishing to the App Store.

### 5a. Create an Expo Account

1. Go to **https://expo.dev** and create a free account

### 5b. Install Expo Go on Your Phone

- **iPhone:** Search "Expo Go" in the App Store and install it
- **Android:** Search "Expo Go" in the Google Play Store and install it

### 5c. Run the App

1. Open a terminal/command prompt on your laptop
2. Navigate to the Kame folder:
   ```
   cd "C:\Users\Ho Jolene\OneDrive - The Boston Consulting Group, Inc\Desktop\Claude\KAME"
   ```
3. Start the mobile dev server:
   ```
   pnpm dev:mobile
   ```
4. You'll see a QR code in the terminal
5. **iPhone:** Open your Camera app and point it at the QR code → tap the banner that appears
6. **Android:** Open Expo Go app → tap "Scan QR Code" → scan it
7. The Kame app should open on your phone!

### 5d. Test the Full Flow

Go through this checklist on your phone:

- [ ] Register screen loads, you can create an account
- [ ] Onboarding: select gender, body shape, measurements
- [ ] Onboarding: upload a face photo + body photo
- [ ] Onboarding: select budget, styles, platforms
- [ ] Generating screen shows progress
- [ ] Explore tab: swipe cards appear with product images
- [ ] Swipe right (like) and left (dislike) work
- [ ] Favorites tab: liked items appear in a grid
- [ ] Tap a favorite → product detail modal opens
- [ ] "Buy Now" button opens the retailer's website
- [ ] Profile tab: your info displays correctly
- [ ] "Give Feedback" button opens the Google Form
- [ ] Footer shows "Kame v0.1.0-beta"
- [ ] Log out button works, returns to login screen

---

## STEP 6: Share with Beta Testers (5 min)

### Option A: Same WiFi (simplest)

If testers are near you:
1. Have them install **Expo Go** on their phone
2. While your dev server is running (`pnpm dev:mobile`), they scan the same QR code
3. They need to be on the same WiFi network as your laptop

### Option B: Expo Tunnel (testers anywhere)

If testers are remote:
1. Stop the dev server if running (Ctrl+C)
2. Start with tunnel mode:
   ```
   cd apps/mobile && npx expo start --tunnel
   ```
3. This creates a public URL — share the QR code via screenshot or messaging app
4. Testers install Expo Go → scan the QR code → app loads
5. **Note:** Your laptop needs to stay on and running for this to work

### Option C: EAS Build (most professional, testers don't need Expo Go)

This creates a standalone app file. More work to set up but testers don't need Expo Go:
1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Build for Android: `eas build --platform android --profile preview`
4. Build for iOS: `eas build --platform ios --profile preview` (needs Apple Developer account, $99/year)
5. EAS gives you a download link to share with testers

> **For a first beta with 10-20 friends, Option B (tunnel) is recommended.** It's free, easy, and works immediately.

---

## What to Send Testers

Here's a message you can copy-paste and send to your testers:

---

**Hey! I'm beta testing my fashion app Kame and would love your feedback.**

Here's how to try it:
1. Install "Expo Go" from your phone's app store
2. Scan this QR code: [attach screenshot of QR code]
3. Create an account and go through the quick setup
4. Swipe through outfits and let me know what you think!

After trying it, please fill out this 1-minute survey:
https://docs.google.com/forms/d/1s5PfWv4gw-jMEFfzG9KWdt1Cl_EGPIrev4Ua8MX-4Vw/viewform

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Network request failed" on phone | Your `EXPO_PUBLIC_API_URL` is wrong, or Railway server isn't running. Check the /health URL in browser |
| App shows blank white screen | Close and reopen Expo Go, or shake phone → "Reload" |
| "Expo Go" can't find the server | Make sure `pnpm dev:mobile` is running on your laptop |
| Swipe deck is empty | The database might not have products. Run `pnpm db:seed` on the server |
| Try-on images never generate | Check that REDIS_URL and FASHN_API_KEY are set in Railway variables |
| Photos disappear after redeploy | You need to set up S3 (Step 3) for permanent photo storage |

---

## Summary Checklist

- [ ] Step 1: Upstash Redis created, got `redis://` URL
- [ ] Step 2: Railway deployed, all env vars set, /health returns OK
- [ ] Step 3: (Optional) AWS S3 bucket created
- [ ] Step 4: Mobile .env updated to Railway URL
- [ ] Step 5: Tested full flow on your phone via Expo Go
- [ ] Step 6: Shared QR code + feedback link with testers
