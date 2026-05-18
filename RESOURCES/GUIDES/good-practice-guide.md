# Good practice guide

Practical wisdom for getting the most from CoWork OS. This isn't about prompts (that's the Cookbook) or features (that's the START HERE - CoWork OS Getting Started PDF at the top of your folder). This is about how to work well with the system over time — the kind of things you only learn through experience.

---

## Sessions: when to start fresh vs continue

CoWork reads your About Me files and memory at the start of every session. That's its "morning briefing." The longer a session runs, the more context accumulates — which can be useful, but it also means Claude's attention gets spread across more information.

**Start a new session when:** you're switching to a completely different task, the current session feels sluggish or unfocused, you've just updated your About Me files or global instructions (changes only take effect on new sessions), or you've finished a major piece of work and want a clean slate.

**Continue the current session when:** you're iterating on something Claude just produced, you need context from earlier in the conversation, or you're in the middle of a multi-step task.

A good rule of thumb: new task, new session. The memory system exists so you don't lose context between sessions — Claude will pick up where you left off because it reads the memory file first.

---

## Structuring complex requests

Claude does better work when it understands the full picture before it starts acting. For anything beyond a quick question, give Claude three things:

1. **What you want** — the actual deliverable. "Write a client proposal" is better than "help me with a proposal." "Draft three email subject lines for the launch announcement" is better still.

2. **Why it matters** — the context that shapes the approach. "This client is price-sensitive" or "this is the first email in a three-part sequence" changes what Claude produces.

3. **What good looks like** — your standards. "Keep it under 200 words," "match the tone of the last newsletter," or "use the client proposal template in RESOURCES/TEMPLATES/."

If the task is big enough to take more than a few minutes, ask Claude to make a plan first: "Before you start, outline the steps you'd take and check if you need anything from me." This catches misunderstandings before Claude produces a 2,000-word document that misses the point.

---

## Memory: the system's secret weapon

Memory is what makes CoWork OS a living system instead of a static template. Here's how to get the most from it.

**What makes a good memory entry:** Decisions ("we decided to use informal tone for client emails"), discovered preferences ("Simon prefers two pricing tiers over three"), system changes ("installed the marketing plugin"), and important context ("course launch target is September 2026"). Good entries are specific enough that a future session can act on them without needing more context.

**What doesn't need logging:** Routine task completions, minor formatting tweaks, or anything that won't matter next week. If nothing significant happened, no entry needed — that's built into the instructions.

**When memory gets stale:** Over time, some entries stop being relevant. The System Review catches this — it reads your memory and flags entries that might need updating or archiving. But if you notice something obviously wrong ("we decided to use Mailchimp" when you've since switched to ConvertKit), just tell Claude to update it.

**The feedback loop:** Every correction you make to Claude's output is a potential memory entry. If you keep fixing the same thing — Claude's email tone is too formal, or it keeps forgetting which Notion database to check — that's a pattern worth logging. One correction + one memory entry = permanent improvement.

**Prompt Claude to update memory after big sessions.** Claude is instructed to log significant decisions and context automatically, but after a particularly important session — a strategy call, a major project decision, a shift in how you work — it's good practice to explicitly ask: "Have you updated the memory files with what we just did?" This makes sure nothing important slips through the cracks. Think of it as a quick debrief before you close the session.

---

## The art of feedback

The fastest way to improve your system is to correct Claude specifically. Vague feedback ("this doesn't sound right") helps a little. Specific feedback ("this sounds too formal — I'd never say 'I trust this finds you well,' use 'Hey' and jump straight to the point") helps a lot.

When you give a specific correction, Claude should log it. Next session, it reads the memory, applies the correction automatically, and you never have to mention it again. One well-phrased correction can permanently change how Claude writes for you.

If you find yourself making the same correction more than twice, it probably belongs in your writing rules or voice profile rather than just in memory. Tell Claude: "Add this to my writing rules" — that way it's enforced from the start of every session, not just remembered.

---

## Working with skills and plugins

**Installing skills:** When Claude presents a .skill file in the chat, you'll see a card with a "Copy to your skills" button. Click it and the skill is installed — one click, done. You can also find .skill files in your `RESOURCES/MY SKILLS/` folder and drag them into the chat to install them manually. CoWork OS ships with three skills pre-loaded: the Onboarding Coach, the System Review, and the First Week Guide.

**Triggering skills reliably:** Skills activate based on keywords in what you say. "Set up my system" triggers the onboarding coach. "Review my system" triggers the System Review. "First week guide" triggers the First Week Guide. If the wrong skill fires, just tell Claude which one you actually want.

**Skills vs plugins:** Skills handle specific tasks. Plugins handle entire domains with deep knowledge. If you need a spreadsheet, that's a skill. If you need marketing strategy that understands your audience, positioning, and funnel — that's a plugin. Over time, you'll develop instincts for which is which.

**Installing plugins:** CoWork OS plugins install from the Better Creating marketplace. Go to Customise (sliders icon) > Plugins > find the Better Creating marketplace, and install the plugins you want. If you build your own specialist with the Sub-Agent Builder, it saves a .plugin file to `RESOURCES/PLUGINS/` — install that from Customise > Personal Plugins > + button.

**Building your own:** The Specialist Sub-Agent Builder helps you create custom specialists for any domain. The best time to build one is when you notice yourself repeatedly explaining the same domain context to Claude. If you keep saying "remember, my audience is non-technical" or "use the CASA framework" — that domain knowledge belongs in a specialist, not repeated in every prompt.

---

## Admin-PA: your personal assistant area

Every CoWork OS has an Admin-PA area inside WORK AREAS/. It's the catch-all for quick tasks, system reviews, and general admin — anything that doesn't belong to a specific area of your work.

System Review reports land here automatically. First Week Guide outputs go here. One-off tasks Claude does for you end up here too.

The interesting part is what it becomes over time. Admin-PA is designed as the home for an optional Personal Assistant plugin — a second brain layer that handles daily briefings, task tracking, contact management, and life area planning through conversation. Think of it as going from a filing drawer to a dedicated assistant who knows your schedule and proactively helps you stay on top of things. The plugin is available in the Better Creating marketplace (Customise > Plugins) — install it when you're ready, and it slots in naturally because the infrastructure is already waiting.

Even before the PA plugin, Admin-PA is worth keeping tidy. Projects inside it follow the same structure as everywhere else — a project folder with brief, memory, and outputs/. If it gets cluttered, archive completed project folders to `_archive/` inside Admin-PA.

---

## File hygiene

**About Me files:** Update them when something meaningful changes — a new tool, a shift in your business, a refined writing preference. Don't update them for every small thing; that's what memory is for. The System Review will flag when files are getting stale.

**CLAUDE.md:** Keep it lean. Every instruction competes for Claude's attention. If something can live in an About Me file instead, put it there. The global instructions should be structural rules and behavioural preferences, not detailed content.

**Work areas:** Add new areas when you take on a genuinely distinct responsibility. Don't create an area for every small category — start broad and split later if needed. Five areas is a good starting point for most people.

**Projects:** When a project is done, move its folder to `_archive/` inside the work area. The memory log is valuable context for future work — if a similar project comes up later, Claude can learn from what worked and what didn't.

**Templates:** When you find yourself creating the same type of document repeatedly, make a template. Drop it in `RESOURCES/TEMPLATES/` and Claude will use it automatically next time. Even a rough structure is better than starting from scratch.

---

## When Claude gets stuck

Sometimes Claude loops, produces generic output, or seems confused. Here's what usually fixes it:

**Rephrase the request.** If Claude misunderstood, saying the same thing louder won't help. Try coming at it from a different angle: instead of "make it better," try "the tone is too formal — rewrite the opening paragraph as if you're texting a colleague."

**Break it down.** Big, vague requests produce big, vague results. "Write my entire website copy" will struggle. "Write the hero section headline and subhead for the homepage — here's what we do and who it's for" will work.

**Start a fresh session.** If a session has gone on for a while and Claude seems unfocused, a new session reloads everything cleanly. The memory system means you won't lose context.

**Give more context, not less.** When Claude produces generic output, it usually means it doesn't have enough information to be specific. Share an example of what you want, point it to a relevant file, or explain the background it's missing.

**Check the basics.** If Claude isn't reading your About Me files or following your rules, the most likely issue is that the global instructions aren't pasted correctly. Start a new session and ask Claude: "Do a system health check — read all my About Me files and tell me what you know about me."

---

## Why we use one folder, not CoWork Projects

CoWork has a native Projects feature in the sidebar — separate workspaces, each linked to a folder on your computer, with their own instructions and automatic memory. You might wonder whether to create a Project for each of your projects instead of using this folder structure.

We'd recommend against it. Here's why.

When you link a CoWork Project to a specific folder, Claude can only see files inside that folder. Your global instructions (the ones in CoWork settings) still apply — but if those instructions tell Claude to read your About Me files, voice profile, or writing rules, and those files aren't inside the project folder, Claude can't reach them. The instruction travels everywhere. The file access doesn't.

CoWork OS works because everything lives under one roof. Your voice, your writing rules, your project briefs, your templates, your memory — all accessible from any conversation. If you split each project into its own CoWork Project, you'd lose the shared context that makes the system useful. Claude wouldn't know your voice or your writing rules unless you copied those files into every project folder. That gets messy fast, and any time you update a file you'd need to update every copy.

**When native Projects do make sense:** If you genuinely need separate settings for completely different workstreams — different instructions, different tone, different rules — native Projects give you that isolation. A freelancer doing very different work for different clients might want that separation. But for most people, the shared context is more valuable than the isolation.

**What CoWork OS gives you instead:** One shared context layer across all your work. Claude reads the same About Me files, follows the same writing rules, and can reference any project's memory from any conversation. The `WORK AREAS/` structure gives you per-project organisation — separate briefs, separate memory logs, separate outputs — grouped by area of responsibility, without losing the shared foundation. You get project separation and shared context at the same time.

**The recommendation:** Select your entire CoWork OS folder as your workspace. Use the `WORK AREAS/` structure for organising individual pieces of work. You keep full shared context, structured memory you can review and edit, and a system that gets smarter across everything you do — not just within one silo.

---

## Making it yours

CoWork OS is a starting point, not a finished product. The people who get the most from it treat it like a living workspace:

They update their About Me files as they learn what Claude needs to know. They build templates when they spot repeating patterns. They create specialists when they find themselves explaining the same domain over and over. They run the System Review monthly and actually apply the suggestions.

The system rewards investment. A shallow setup produces generic results. A well-maintained system with rich About Me files, good memory entries, and relevant specialists produces work that genuinely sounds like you and saves real time.

That's the whole point — not a one-time setup, but a system that compounds.

---

## How CoWork OS works day to day

When you start a session, Claude reads your global instructions, all About Me files, and the work areas guide. It knows who you are, how you write, what tools you use, and what you've been working on.

When you start new work, Claude checks for an existing project folder in your work areas. If there isn't one, it creates a project folder (with brief, memory log, and outputs/) in the right work area automatically.

When you ask something that matches a specialist plugin's domain, that plugin activates automatically.

When a session ends, Claude logs important decisions and context to the relevant memory file. Next time, it picks up where you left off.

---

## Troubleshooting

**Claude doesn't seem to know who I am.** Check that CLAUDE.md is pasted into CoWork settings (gear icon → Global Instructions). Start a new session — mid-session changes don't take effect.

**Claude isn't following my writing rules.** Make sure `ABOUT ME/writing-rules.md` has the "Your voice" section filled in. The anti-AI patterns are pre-loaded, but the personal voice section needs your input.

**A plugin isn't activating.** Check `ABOUT ME/specialist-routing.md` to see if it's listed. If it's installed but not triggering, the task phrasing might not match the plugin's description. Try rephrasing.

**Claude created a file in the wrong place.** All project work goes in the project's `outputs/` folder inside `WORK AREAS/`. If Claude puts something elsewhere, tell it where it should go — it'll learn from the correction.

**Something feels broken.** Ask Claude: "Do a system health check." It will read all your files and report what it can see. If the summary is wrong, the issue is in your files. If Claude doesn't try to read the files, the issue is in your global instructions.

---

## What CoWork OS can and can't do

Three things worth knowing upfront so you don't hit them by surprise.

**Claude creates drafts, not sends.** When Claude writes an email, it creates a draft in your inbox — it doesn't send it. Same with Slack messages, calendar events, and anything that goes out to other people. You always review and approve before anything leaves your account. This is by design: the ground rules in the START HERE PDF cover this, but it's worth repeating.

**Scheduled tasks need the Claude app running.** Scheduled tasks run on your computer through the Claude desktop app. If the app isn't open, tasks don't fire — they'll run the next time it is. You don't need to be actively using Claude, but the app needs to be running in the background. If a Monday morning briefing didn't arrive, check that the app was open. As a safety net, CoWork OS also checks at the start of each session whether your System Review is overdue — so even if a scheduled review gets missed, you'll be prompted next time you use the system.

**Keeping your computer always on.** There's a toggle in CoWork settings that helps keep your computer awake while the app is running — useful if you rely on scheduled tasks throughout the day. If you're getting serious about using CoWork as a daily operating system — especially with Dispatch, which lets you remotely control CoWork from your phone — it's worth considering a dedicated desk setup: a computer that stays on and stays home, even when you don't. That way your scheduled tasks run reliably, and you can trigger work from your mobile wherever you are.

**Claude works within your selected folder.** Claude can read and write files inside the folder you selected when you set up CoWork. It can't see files elsewhere on your computer unless you give it access. If you ask Claude to find something and it can't, the file might be outside the workspace folder.

---

*CoWork OS is part of the Agentic Business ecosystem from Better Creating. Visit bettercreating.com to learn more.*
