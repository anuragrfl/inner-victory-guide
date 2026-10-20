# Inner Victory Guide on WhatsApp: setup

People message a WhatsApp number and get answers about the 9 Devis and chakras, the 8 Siddhis, the 9 Nidhis and Ravan's 10 heads, in English, Hindi or Hinglish.

How it works:

```
Person on WhatsApp ──► Meta WhatsApp Cloud API ──► your Netlify site (/whatsapp)
                                                        │  asks Claude with the guide's knowledge
Person on WhatsApp ◄── Meta WhatsApp Cloud API ◄────────┘  sends the reply back
```

You need about an hour, plus Meta's verification time.

---

## What you need before starting

- A **Facebook account** and a **Meta Business portfolio** (business.facebook.com).
- A **phone number** for the bot that is **not** on WhatsApp or WhatsApp Business right now. A new SIM works well. It must receive an SMS or call for verification.
- A **Netlify account** (you already have one).
- A **Claude API account** at console.anthropic.com with a payment method and some credit.

---

## Step 1. Get a Claude API key

1. Go to **console.anthropic.com** → **API Keys** → **Create Key**. Name it `inner-victory-whatsapp`.
2. Copy the key (starts with `sk-ant-`). You'll paste it into Netlify in Step 4.
3. Under **Billing**, add credit. Replies use the fast Haiku model, so each answer costs very little.

## Step 2. Create the Meta app and WhatsApp number

1. Go to **developers.facebook.com** → **My Apps** → **Create App**.
2. Choose the use case **Connect with customers through WhatsApp** (type: Business). Link it to your Business portfolio.
3. In the app, open **WhatsApp → API Setup**. Meta gives you a **test number** first. Note the **Phone number ID** shown there.
4. Add your own phone under **To** as a test recipient and confirm the code. During testing, only numbers you add here can chat with the bot (up to 5).
5. Later, to go live for everyone: **WhatsApp → API Setup → Add phone number**, add the bot's real number, set its **display name** (e.g. "Inner Victory Guide"), and verify it by SMS or call. Meta reviews the display name.

## Step 3. Make a permanent access token

The token on the API Setup page expires in 24 hours. Make a permanent one:

1. **business.facebook.com** → **Settings** → **Users → System users** → **Add**. Name it `whatsapp-bot`, role **Admin**.
2. **Assign assets**: add your app (full control) and your WhatsApp account (full control).
3. **Generate new token** → choose your app → expiry **Never** → tick `whatsapp_business_messaging` and `whatsapp_business_management`.
4. Copy the token. This is `WHATSAPP_TOKEN`.

Also copy the **App secret**: developers.facebook.com → your app → **App settings → Basic → App secret → Show**. This is `META_APP_SECRET`.

## Step 4. Put the bot online on Netlify

**Option A: Claude deploys it for you.** Tell Claude "deploy the WhatsApp bot" and it creates the Netlify site.

**Option B: you deploy it.**
1. Put this folder in a GitHub repository.
2. Netlify → **Add new site → Import an existing project** → pick the repo. Leave the build settings as they are (the `netlify.toml` file sets them).

Then add the keys: Netlify → your site → **Site configuration → Environment variables → Add a variable**. Scope each to **Functions**:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Claude key from Step 1 |
| `WHATSAPP_TOKEN` | Permanent token from Step 3 |
| `META_APP_SECRET` | App secret from Step 3 |
| `WHATSAPP_VERIFY_TOKEN` | Any phrase you invent, e.g. `jai-mata-di-2026` |

After adding them, **redeploy** (Deploys → Trigger deploy) so the function picks them up.

Your webhook address is: `https://YOUR-SITE.netlify.app/whatsapp`

## Step 5. Connect WhatsApp to the bot

1. developers.facebook.com → your app → **WhatsApp → Configuration** → **Webhook → Edit**.
2. **Callback URL**: `https://YOUR-SITE.netlify.app/whatsapp`
3. **Verify token**: the same phrase you set as `WHATSAPP_VERIFY_TOKEN`.
4. Click **Verify and save**. If it fails, check the phrase matches exactly and that you redeployed after adding variables.
5. Under **Webhook fields**, click **Subscribe** next to **messages**.

## Step 6. Test

From your phone, send **"Namaste"** to the test number (or your real number once added). The bot introduces itself and suggests questions. Try:

- *Shailputri and Muladhar*
- *Krodh pe vijay kaise paayein?*
- *What is Padma Nidhi?*

Type **reset** any time to start a fresh conversation.

If nothing comes back: Netlify → your site → **Logs → Functions → whatsapp** shows what happened.

## Step 7. Share it with people

- Your WhatsApp chat link: `https://wa.me/91XXXXXXXXXX?text=Namaste` (your number with country code, no + or spaces). Put it in WhatsApp groups, Instagram bio or a poster.
- You can also make a QR code of that link.

---

## Costs and rules to know (checked October 2026)

- **WhatsApp:** Since 1 October 2026 Meta charges per message again for replies sent inside the 24-hour window, after **1,000 free service messages per number per month**. A payment method must be on file in Meta Business settings or delivery can stop.
- **Claude:** pay-as-you-go on your API key. Set a monthly spend limit in the console.
- **Netlify:** the free plan is enough at small scale.
- **Meta's AI policy:** since 15 January 2026, WhatsApp's business terms bar general-purpose AI assistants whose main product is the AI itself, at Meta's discretion. Businesses using AI to serve their own community are allowed. Keep this bot clearly about its topic (it already refuses to drift into other subjects), and run it under a real business or organisation name with a matching display name and profile. Read Meta's current WhatsApp Business Solution Terms before launching widely.

## Changing what the bot knows

Edit `lib/knowledge.mjs` (the knowledge and the answering rules), then redeploy. Everything else stays the same.

## Files

- `netlify/functions/whatsapp.mjs` – receives messages, checks they really come from Meta, asks Claude, replies, remembers the last few messages per person for 6 hours, and ignores duplicate deliveries.
- `lib/knowledge.mjs` – the guide's knowledge and answering rules.
- `public/index.html` – a simple page at the site's address.
- `netlify.toml`, `package.json` – Netlify settings.
