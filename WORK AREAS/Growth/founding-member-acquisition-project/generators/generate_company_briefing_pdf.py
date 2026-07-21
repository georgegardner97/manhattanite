#!/usr/bin/env python3
"""Generate Manhattanite_Company-Briefing_v1.pdf — the founder's briefing.

Everything George needs to talk about the company with confidence:
the model, current state, the plan, the finances, legal position, and
answers to the hard questions. Sources: COMPANY/ files as of 2026-07-13.

Re-run this script to rebuild the PDF after edits.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer,
    Table, TableStyle, KeepTogether, HRFlowable, PageBreak,
)

INK = HexColor("#1a1a1a")
CREAM = HexColor("#faf7f0")
PANEL = HexColor("#ffffff")
PANEL2 = HexColor("#f5f0e6")
BORDER = HexColor("#e4ddd0")
MUTED = HexColor("#6b6459")
GOLD = HexColor("#8a6d1f")
RED = HexColor("#b5443c")
GREEN = HexColor("#4a7c3a")
BLUE = HexColor("#3d6b9e")


def st(name, **kw):
    base = dict(fontName="Times-Roman", fontSize=10.5, leading=14.5, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "title": st("title", fontName="Times-Bold", fontSize=24, leading=28),
    "subtitle": st("subtitle", fontName="Times-Italic", fontSize=11, leading=15, textColor=MUTED),
    "h2": st("h2", fontName="Times-Bold", fontSize=15.5, leading=19, spaceBefore=4),
    "body": st("body"),
    "quote": st("quote", fontName="Times-Italic", fontSize=11.5, leading=16),
    "cell": st("cell", fontSize=9.5, leading=12.5),
    "cellb": st("cellb", fontName="Times-Bold", fontSize=9.5, leading=12.5),
    "hdr": st("hdr", fontName="Helvetica-Bold", fontSize=7, leading=9, textColor=MUTED),
    "qa_q": st("qa_q", fontName="Times-Bold", fontSize=11, leading=14),
    "qa_a": st("qa_a", fontSize=10, leading=13.5),
    "num": st("num", fontName="Times-Bold", fontSize=15, leading=17),
    "numlbl": st("numlbl", fontName="Helvetica-Bold", fontSize=6.5, leading=8.5, textColor=MUTED),
}


def hdr_cell(text):
    return Paragraph(f'<font face="Helvetica-Bold" size="7" color="#6b6459">{text}</font>', S["hdr"])


def styled_table(rows, widths, header=True, box_color=BORDER, box_w=0.75):
    t = Table(rows, colWidths=widths)
    style = [
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), box_w, box_color),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    if header:
        style.append(("BACKGROUND", (0, 0), (-1, 0), PANEL2))
    t.setStyle(TableStyle(style))
    return t


def section(elements, title):
    elements.append(Spacer(1, 14))
    elements.append(Paragraph(title, S["h2"]))
    elements.append(Spacer(1, 6))


def qa_card(q, a):
    rows = [
        [Paragraph(f"“{q}”", S["qa_q"])],
        [Paragraph(a, S["qa_a"])],
    ]
    t = Table(rows, colWidths=[6.9 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LINEBELOW", (0, 0), (0, 0), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (0, 0), 7),
        ("BOTTOMPADDING", (0, 0), (0, 0), 5),
        ("TOPPADDING", (0, 1), (0, 1), 5),
        ("BOTTOMPADDING", (0, 1), (0, 1), 8),
    ]))
    return KeepTogether([t, Spacer(1, 8)])


def bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, letter[0], letter[1], stroke=0, fill=1)
    canvas.setFont("Times-Italic", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.75 * inch, 0.45 * inch,
                      "Manhattanite — company briefing (v1) · private, for George · July 2026")
    canvas.drawRightString(letter[0] - 0.75 * inch, 0.45 * inch, f"{canvas.getPageNumber()}")
    canvas.restoreState()


def build(path):
    doc = BaseDocTemplate(path, pagesize=letter,
                          leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                          topMargin=0.7 * inch, bottomMargin=0.7 * inch,
                          title="Manhattanite — Company Briefing v1",
                          author="George Gardner")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=bg)])
    e = []

    # ============ PAGE 1 — story + key numbers + the model ============
    e.append(Paragraph("Manhattanite — company briefing", S["title"]))
    e.append(Spacer(1, 3))
    e.append(Paragraph("The nitty-gritty, memorized. How it works, the plan, the money, and the hard questions.", S["subtitle"]))
    e.append(Spacer(1, 12))

    e.append(Paragraph(
        "<b>The story in one paragraph.</b> Craigslist and Facebook Marketplace are the default way to "
        "transact locally, and both are broken the same way: anonymity creates bad behavior. In France, "
        "Gens de Confiance (“people of trust,” founded 2014, millions of members) proved the fix — don't "
        "police trust after the fact, require it at the door. Every member is vouched for by existing "
        "members, so the network polices itself. Nothing like it exists in New York, a city that already "
        "runs on word of mouth. Manhattanite is that model, built native to Manhattan: a private "
        "marketplace where every member is sponsored by name, every listing is reviewed by a person, and "
        "the network is small on purpose. Apartments and furniture first. Live now, recruiting the first "
        "20 members by hand.", S["body"]))
    e.append(Spacer(1, 6))

    section(e, "Key numbers — memorize this row")
    nums = [
        ("2", "TIERS"), ("2", "FOCUS<br/>CATEGORIES"), ("20", "FIRST MEMBERS<br/>(8 / 8 / 4)"),
        ("5", "MAX INVITES<br/>/ WEEK"), ("200", "PLAYBOOK<br/>HORIZON"),
        ("~$10", "MONTHLY<br/>COST"), ("$0", "REVENUE,<br/>BY DESIGN"), ("0", "INVESTORS"),
    ]
    row_nums = [Paragraph(n, S["num"]) for n, _ in nums]
    row_lbls = [Paragraph(f'<font face="Helvetica-Bold" size="6.5" color="#6b6459">{l}</font>', S["numlbl"]) for _, l in nums]
    nt = Table([row_nums, row_lbls], colWidths=[6.9 * inch / 8] * 8)
    nt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LINEAFTER", (0, 0), (-2, -1), 0.5, BORDER),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
    ]))
    e.append(nt)

    section(e, "How the model works")
    model_rows = [
        [hdr_cell(""), hdr_cell("ACCOUNT (TIER 1)"), hdr_cell("MEMBER (TIER 2)")],
        [Paragraph("Getting in", S["cellb"]),
         Paragraph("Anyone with an email. Free, no review.", S["cell"]),
         Paragraph("Application + personal review + approval. A sponsor vouches, and their name is public on your profile.", S["cell"])],
        [Paragraph("Can do", S["cellb"]),
         Paragraph("Browse every listing. Apply for membership. Nothing else.", S["cell"]),
         Paragraph("Post listings, contact posters, sponsor new members. Membership itself is free.", S["cell"])],
        [Paragraph("The point", S["cellb"]),
         Paragraph("See the value. Aspiration builds here.", S["cell"]),
         Paragraph("Capture the value. Trust is enforced here — at the action layer, not the viewing layer.", S["cell"])],
    ]
    e.append(styled_table(model_rows, [0.9 * inch, 2.7 * inch, 3.3 * inch]))
    e.append(Spacer(1, 10))

    mech = [
        "<b>Sponsorship is public and plural.</b> Every member's sponsor is named on their profile (“Brought in by Anna”). A member can have several sponsors; the floor is one now, moving to two. Public vouching is the accountability engine: your name travels with the people you bring in.",
        "<b>Every listing is reviewed before it goes live.</b> Pre-moderation, by a person. Approve, decline, or send back with feedback — if it's not up to scratch, the poster is asked to rewrite it. The bar is taste, not category rules.",
        "<b>Contact is a form, not a chat.</b> Messaging a poster sends an email through the site; every contact is logged. No inbox until v2 — less surface, less abuse.",
        "<b>The wall is enforced in the database, not just the design.</b> Row-level security (the database itself refusing to serve members-only data to non-members) means the tier wall can't be bypassed by a clever user. Non-negotiable.",
        "<b>Categories:</b> the focus is apartments + furniture, but the door is open to any listing that's right, from day one. Jobs get first-class treatment in v1.5, services later.",
    ]
    for m in mech:
        e.append(Paragraph(m, S["body"]))
        e.append(Spacer(1, 5))

    e.append(PageBreak())

    # ============ PAGE 2 — status + the plan ============
    section(e, "Where it is today (July 2026)")
    e.append(Paragraph(
        "The product is <b>built and live</b> at manhattanite.com — not a deck, not a waitlist. The full loop "
        "works end to end and has passed QA: visit → account → browse → apply → approve → post → moderate → "
        "contact. Admin console, listing moderation queue, image uploads, seed listings with real photos, "
        "terms and privacy pages. Built in a 14-week plan starting mid-May; shipped ahead of it. Now in the "
        "<b>seed phase</b>: recruiting the first 20 members by hand from a tracked list of 38 candidates.", S["body"]))

    section(e, "The plan — three phases to 200")
    plan_rows = [
        [hdr_cell("PHASE"), hdr_cell("MEMBERS"), hdr_cell("HOW GROWTH WORKS"), hdr_cell("MOVES ON WHEN")],
        [Paragraph("Seed", S["cellb"]), Paragraph("0–20", S["cell"]),
         Paragraph("Founder-led. Personal invites, coffees, manual approval. Composition target: 8 movers, 8 locals, 4 newcomers. Max 5 invites/week.", S["cell"]),
         Paragraph("All 20 using the site weekly.", S["cell"])],
        [Paragraph("Cohort 1", S["cellb"]), Paragraph("20–80", S["cell"]),
         Paragraph("Sponsor-led. Each founding member brings 3–5 people. Sponsorship is the acquisition channel — public, counted, never rewarded with perks.", S["cell"]),
         Paragraph("Real listings outnumber example listings.", S["cell"])],
        [Paragraph("Cohort 2", S["cellb"]), Paragraph("80–200", S["cell"]),
         Paragraph("Network-led. First public surface (marketing site), selective press (Curbed, The Cut, Air Mail — never TechCrunch). Monetization begins at the end of this phase.", S["cell"]),
         Paragraph("5+ listings/week sustained, sub-48h application response.", S["cell"])],
    ]
    e.append(styled_table(plan_rows, [0.7 * inch, 0.8 * inch, 3.55 * inch, 1.85 * inch]))
    e.append(Spacer(1, 10))

    e.append(Paragraph("<b>Rules that don't break:</b>", S["body"]))
    e.append(Spacer(1, 4))
    for r in [
        "No paid ads while the network seeds — growth is composition, not volume. Open to revisiting once there's a member bar to measure a channel against.",
        "No press until cohort 2. Seed is private on purpose.",
        "Manual review is the moat. It never gets loosened to chase growth.",
        "If a week slips, scope is cut from later phases — never from the trust layer.",
    ]:
        e.append(Paragraph(f"·&nbsp;&nbsp;{r}", S["body"]))
        e.append(Spacer(1, 3))
    e.append(Spacer(1, 8))

    e.append(Paragraph("<b>Product roadmap:</b>", S["body"]))
    e.append(Spacer(1, 4))
    road_rows = [
        [hdr_cell("RELEASE"), hdr_cell("WHAT'S ADDED"), hdr_cell("WHEN")],
        [Paragraph("v1.1", S["cellb"]), Paragraph("Founding cohort onboarded (10–20 members)", S["cell"]), Paragraph("Now — Sept 2026", S["cell"])],
        [Paragraph("v1.5", S["cellb"]), Paragraph("Jobs category, search filters, saved listings", S["cell"]), Paragraph("Q4 2026", S["cell"])],
        [Paragraph("v2", S["cellb"]), Paragraph("In-product messaging, sponsorship requests, pay-per-post (Stripe)", S["cell"]), Paragraph("2027", S["cell"])],
        [Paragraph("v3", S["cellb"]), Paragraph("Services category, mobile-native, graded trust score (Explorer → Connector)", S["cell"]), Paragraph("2027+", S["cell"])],
    ]
    e.append(styled_table(road_rows, [0.7 * inch, 4.4 * inch, 1.8 * inch]))
    e.append(Spacer(1, 8))
    e.append(Paragraph(
        "Longer-term direction: the binary account/member wall evolves into a graded trust score — "
        "verification, referral count, successful transactions, responsiveness — shown openly on profiles. "
        "Binary now because it ships; graded later because it scales.", S["body"]))

    e.append(PageBreak())

    # ============ PAGE 3 — finances + legal ============
    section(e, "The finances")
    e.append(Paragraph(
        "<b>Costs.</b> The whole company runs on about <b>$10 a month</b>: hosting (Vercel), database and "
        "login (Supabase), and email (Resend) are free at this scale; analytics (~$9) and the domain (~$1 "
        "amortized) are the only bills. First planned increase: ~$25/month for database backups when real "
        "members arrive — call it $35/month through cohort 1. No office, no salaries, no agencies. One "
        "founder plus AI tooling built and runs the product.", S["body"]))
    e.append(Spacer(1, 6))
    e.append(Paragraph(
        "<b>Revenue.</b> $0 today, by design. Monetization starts at the end of cohort 2 (~200 members): "
        "<b>pay-per-post</b>. Members keep a free listing allowance (e.g., one a month); additional listings "
        "cost a small fee (~$25); featured placement costs more. Membership, browsing, and sponsoring stay "
        "free forever. Never ads, never selling data — both would corrode the trust the product is made of. "
        "An alternative on the table for later: club-style annual dues. Decision deferred until the network "
        "has density.", S["body"]))
    e.append(Spacer(1, 6))
    e.append(Paragraph(
        "<b>Funding.</b> Bootstrapped, no investors, no raise planned. The honest reason: money can't buy "
        "the constraint. The bottleneck is the quality of the first 200 members, and that's earned one "
        "coffee at a time. At $10 a month, runway is effectively infinite.", S["body"]))
    e.append(Spacer(1, 6))
    e.append(Paragraph(
        "<b>Known future costs.</b> Forming the company: NY LLC plus Manhattan's newspaper-publication "
        "requirement, roughly $1,200–2,000 one-time, plus attorney review of terms, privacy, and "
        "fair-housing language. Both triggered by the events below — not before.", S["body"]))

    section(e, "Legal position")
    e.append(Paragraph(
        "<b>No entity yet — deliberately.</b> No money changes hands, so there's nothing to shield. The "
        "trigger to incorporate (default: NY LLC): the first dollar of revenue, ~50 members, or members "
        "George doesn't personally know — whichever comes first. Terms of service and privacy policy are "
        "already written and live on the site (attorney review lands at the same trigger).", S["body"]))
    e.append(Spacer(1, 6))
    e.append(Paragraph(
        "<b>Fair housing is the one guardrail that never waits.</b> Researched and in force now: the listing "
        "form never asks about tenant preferences, and apartment listings describe the apartment, never the "
        "wanted tenant. Moderation can absolutely send a listing back and ask the poster to rewrite it — but "
        "we don't rewrite it for them. That distinction keeps the platform inside the federal shield for "
        "user-posted content (Section 230 — the law that protects platforms for what users post, as long as "
        "the platform doesn't author it). George's own listings get no shield, so they're held to the "
        "strictest standard.", S["body"]))

    e.append(PageBreak())

    # ============ PAGE 3+ — hard questions ============
    section(e, "The hard questions — answers to have ready")
    QA = [
        ("How do you make money?",
         "We don't yet — on purpose. Membership is free and stays free. Around 200 members we introduce "
         "pay-per-post: a free listing allowance, then roughly $25 a listing, more for featured placement. "
         "Browsing, membership, and sponsoring never cost anything. And never ads — ads are what broke the "
         "incumbents."),
        ("What does it cost to run?",
         "About $10 a month, all in. Modern infrastructure is free at this scale, and one founder plus AI "
         "tooling built and operates the whole thing. That's also why we don't need investors."),
        ("Are you raising?",
         "No. Money can't buy the constraint. The bottleneck is the quality of the first 200 members, and "
         "that's earned one coffee at a time. At $10 a month I have infinite runway."),
        ("How does this scale?",
         "Slowly, on purpose — five invites a week, maximum. The wrong 200 members make the next 200 worse; "
         "the right 200 make them inevitable. The precedent scaled fine: Gens de Confiance runs the same "
         "model with millions of members in France."),
        ("Isn't this just a velvet rope?",
         "The door isn't the product — what's behind it is. Every listing reviewed by a person, every member "
         "accountable by name. Exclusivity is a byproduct of curation, not the pitch. Invite-worthy because "
         "useful, not invite-only because cool."),
        ("Why would New Yorkers vouch for each other?",
         "They already do — in group chats, Instagram stories, and 'my friend is leaving her place' texts. "
         "The signal lives in the social graph; nobody's built the venue. France requires three sponsors; "
         "New York's social graph is wider but looser, so we start at one sponsor moving to two, and we make "
         "sponsorship public — which turns vouching into status."),
        ("What happens when someone scams or flakes?",
         "Structurally, they mostly can't get in — no anonymous accounts, every member vouched for by name, "
         "every listing reviewed before it goes live. If someone does cross the line, there's an "
         "accountability chain: their sponsor is named, and repeat problems cost the sponsor too. That's the "
         "difference between policing trust and designing it."),
        ("What about Facebook groups, Listings Project, StreetEasy?",
         "They prove the demand. Listings Project shows people pay attention to curation; the group chats "
         "show trust is what people actually route around. Nobody has built the trust layer as the product "
         "in New York. We're not competing with StreetEasy's inventory — we're formalizing the "
         "friend-of-a-friend channel that already beats it."),
        ("Who's building this? Do you have a team?",
         "Solo founder. The product is live — built in fourteen weeks on a modern stack. One person can run "
         "this now, which is the point: costs stay near zero while the network compounds."),
        ("Why isn't there an LLC?",
         "Nothing to protect yet — no money changes hands. It forms before the first dollar, at about 50 "
         "members, or when strangers start joining, whichever comes first. The legal groundwork that "
         "actually matters now — terms, privacy, fair-housing rules — is already written and live."),
        ("What about fair housing law?",
         "Taken seriously and researched. The listing form never asks about tenant preferences, and listings "
         "describe the apartment, never the wanted tenant. We'll send a listing back and ask the poster to "
         "revise it, but we don't rewrite it ourselves — content we author loses the federal protections "
         "that cover what users post."),
        ("What's the moat?",
         "The composition of the network and the trust architecture under it. A feature can be copied in a "
         "weekend; the right 200 Manhattanites vouching for each other can't. In an age of AI-generated "
         "everything, taste is the one thing that doesn't commoditize."),
    ]
    for q, a in QA:
        e.append(qa_card(q, a))

    e.append(Spacer(1, 6))
    e.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    e.append(Spacer(1, 8))
    e.append(Paragraph(
        "If a question isn't here: answer from the principle. Trust is the product, taste is the moat, and "
        "every growth decision is a quality decision.", S["quote"]))

    doc.build(e)
    print(f"Built {path}")


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "Manhattanite_Company-Briefing_v1.pdf"
    build(out)
