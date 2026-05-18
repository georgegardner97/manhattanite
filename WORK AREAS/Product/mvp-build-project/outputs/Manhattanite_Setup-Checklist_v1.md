# Manhattanite — Setup Checklist (Phase 0, pre-build)

Everything you need to do before Claude Code can start building. Each step is small. None of this is coding. You're just creating accounts and pointing things at each other.

Check items off as you go.

---

## Session 1 — Save what you've got, then take down the old stuff

### Step 1: Export the waitlist emails

**Why:** These people have already raised their hand. Some of them are probably part of your first 20 members.

- [ ] Log into wherever your current waitlist site is hosted (e.g., Mailchimp, Carrd, Substack, Squarespace, Webflow).
- [ ] Find the contacts / subscribers / form-submissions section.
- [ ] Export to CSV (a spreadsheet file).
- [ ] Save the CSV somewhere safe — recommended: Google Drive under "Manhattanite / Waitlist Export 2026-05-16.csv".

Tell Claude which platform you're on and we'll add the exact menu path here.

### Step 2: Take down the existing waitlist site

**Why:** You want manhattanite.com to point at the new product, not the old waitlist.

You don't have to delete the waitlist platform account yet — you can just stop it serving the domain.

- [ ] Log into your waitlist host.
- [ ] Disconnect manhattanite.com from it (look for "Domain settings" or "Custom domain" in the platform's settings).
- [ ] Optionally: cancel any paid subscription if you have one.

---

## Session 2 — Clean up GitHub

### Step 3: Delete the old `manhattanite` GitHub repo

**Why:** The old repo has nothing in it worth keeping. Cleaner to start fresh than have leftover waitlist code muddying the new build.

A "repo" is short for repository — it's the folder on GitHub where your project code lives.

- [ ] Go to github.com and log in.
- [ ] Open the existing `manhattanite` repository.
- [ ] Click **Settings** (top tab, on the right).
- [ ] Scroll all the way to the bottom — there's a red "Danger Zone" section.
- [ ] Click **Delete this repository**.
- [ ] Type the repo name to confirm. Repo gone.

### Step 4: Create a fresh `manhattanite` repo

- [ ] On github.com, click the green **New** button (top left) or visit github.com/new.
- [ ] **Repository name:** `manhattanite`
- [ ] **Description:** "Manhattanite — private NYC marketplace" (or leave blank)
- [ ] **Visibility:** Private. (You can always make it public later. Never the other way around safely.)
- [ ] **Initialize:** tick "Add a README file." Leave other boxes unchecked.
- [ ] Click **Create repository**.

Done. The new repo is empty and ready.

---

## Session 3 — Create the service accounts (one at a time, ~5 min each)

For every account: sign up with `info@manhattanite.com`. Use a password manager (1Password, Bitwarden, or just the browser's built-in one). Free tier on all of these.

### Step 5: Supabase

**What it is:** The backend. Stores accounts, listings, photos. Handles login. (Backend = the part of the website you don't see, that holds the data.)

- [ ] Go to supabase.com and click **Start your project**.
- [ ] Sign up with `info@manhattanite.com` (or sign in with GitHub if easier — same effect).
- [ ] Create a new project: name it `manhattanite`. Pick a region close to NYC (US East). Generate a strong database password and save it in your password manager.
- [ ] Done. Leave the dashboard open.

### Step 6: Resend

**What it is:** The service that sends email from your site (invites, application receipts, notifications). Without it, the site can't email anyone.

- [ ] Go to resend.com and click **Sign up**.
- [ ] Sign up with `info@manhattanite.com`.
- [ ] Skip any "add a domain" step for now — we'll come back to it in Session 4.

### Step 7: Plausible

**What it is:** Analytics. It tells you how many people visited the site. Privacy-friendly, no cookie banners, on-brand.

- [ ] Go to plausible.io and click **Try it for free**.
- [ ] Sign up with `info@manhattanite.com`.
- [ ] Skip the "add a website" step — we'll do it once the site is live.

### Step 8: Sentry

**What it is:** Catches bugs in the website automatically. If something breaks for a member, you find out before they email you.

- [ ] Go to sentry.io and click **Get Started**.
- [ ] Sign up with `info@manhattanite.com`.
- [ ] Pick the free "Developer" plan.
- [ ] You'll be asked to create a project — name it `manhattanite`, framework = Next.js.

---

## Session 4 — Point manhattanite.com at Vercel

### Step 9: Point the domain to Vercel

**What you're doing:** Right now, manhattanite.com points to your old waitlist host. You're going to repoint it so it points to Vercel instead. The technical name for this is **DNS** — the address book the internet uses to find websites.

Two ways to do this. We'll pick based on where your domain is registered.

- [ ] Log into wherever you bought / manage manhattanite.com (e.g., GoDaddy, Namecheap, Squarespace Domains, Google Domains).
- [ ] Tell Claude the name of the registrar so we can give you the exact menu path.
- [ ] In short: you'll add two DNS records that Vercel gives you. They look like `A` and `CNAME` records.

Don't worry about understanding this — Claude will walk you through the exact clicks once we know the registrar.

### Step 10: Set up email-from on Resend

**Why:** Without this step, emails from the site will go straight to spam. The DNS records prove to Gmail/Outlook/etc. that your emails actually come from manhattanite.com and aren't spoofed.

- [ ] In Resend, go to **Domains** → **Add Domain** → enter `manhattanite.com`.
- [ ] Resend will give you 3–4 DNS records. They look gnarly but you just copy-paste them.
- [ ] Add those records at the same place you did Step 9 (your domain registrar).
- [ ] Click **Verify** in Resend. It may take a few minutes to a few hours.
- [ ] Once verified, you can send email from `info@manhattanite.com` and `george@manhattanite.com` through Resend.

---

## Session 5 — Connect everything together

Claude will do most of this with you. You just confirm a few things.

### Step 11: Connect the new GitHub repo to Vercel

- [ ] Go to vercel.com and sign in.
- [ ] Click **Add New… → Project**.
- [ ] Vercel will ask to access your GitHub. Authorize it.
- [ ] Pick the `manhattanite` repo from the list.
- [ ] Pick "Next.js" as the framework (it'll likely auto-detect).
- [ ] Don't change any settings. Click **Deploy**.
- [ ] You'll get a Vercel URL like `manhattanite.vercel.app` — that's your preview.

### Step 12: Connect Vercel to your domain

- [ ] In Vercel, go to your project → **Settings → Domains**.
- [ ] Type `manhattanite.com` → click **Add**.
- [ ] Vercel will show you the DNS records you set up in Step 9. It should auto-verify.
- [ ] If it says "valid configuration" with a green tick — you're done. manhattanite.com now serves the site (currently just the empty starter page).

### Step 13: Confirm the deploy flow

**Plain English on what "preview-then-promote" means:**

Every time Claude (or anyone) writes new code and uploads it to GitHub, Vercel automatically builds a preview version. That preview lives at a unique URL — something like `manhattanite-abc123.vercel.app`. The real site at `manhattanite.com` doesn't change yet.

To make a change actually go live on manhattanite.com, you (or Claude) clicks a **Promote to Production** button in Vercel. That swap takes about 10 seconds.

**The benefit:** nothing accidentally ships. You always see it on a preview URL first, then decide.

**The cost:** one extra click each time. At seed phase that's fine. Later we'll automate it.

- [ ] In Vercel project settings, confirm: **Production Branch** = `main` (default).
- [ ] We'll set up the manual-promote rule once the first real code is in.

---

## When you're done

When all 13 steps are checked off, tell Claude. The MVP build can start.

Estimated total time, working in focused chunks: 2–3 hours, split across 2–3 days.

---

*Last updated: 2026-05-16.*
