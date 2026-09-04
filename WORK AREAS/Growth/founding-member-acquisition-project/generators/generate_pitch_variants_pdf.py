#!/usr/bin/env python3
"""Generate Manhattanite_Pitch-Variants_v2.pdf — the working pitch sheet.

Companion to generate_pitch_cards_pdf.py; same palette and page furniture.
Re-run this script to rebuild the PDF after edits. Source of truth for the
wording is outputs/Manhattanite_Pitch-Variants_v2.md — keep them in step.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer,
    Table, TableStyle, KeepTogether, HRFlowable,
)

# ---- palette (matches the pitch cards) ----
INK = HexColor("#1a1a1a")
CREAM = HexColor("#faf7f0")
PANEL = HexColor("#ffffff")
BORDER = HexColor("#e4ddd0")
MUTED = HexColor("#6b6459")
GOLD = HexColor("#8a6d1f")
RED = HexColor("#b5443c")
HEADBG = HexColor("#f5f0e6")

W = 6.9 * inch


def st(name, **kw):
    base = dict(fontName="Times-Roman", fontSize=10.5, leading=14.5, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "title": st("title", fontName="Times-Bold", fontSize=24, leading=28),
    "subtitle": st("subtitle", fontName="Times-Italic", fontSize=11, leading=15, textColor=MUTED),
    "h2": st("h2", fontName="Times-Bold", fontSize=15, leading=19),
    "kicker": st("kicker", fontName="Times-Italic", fontSize=10, leading=13.5, textColor=MUTED),
    "name": st("name", fontName="Times-Bold", fontSize=11.5, leading=15),
    "quote": st("quote", fontName="Times-Italic", fontSize=11, leading=15.5),
    "body": st("body", fontSize=9.5, leading=13),
    "hero": st("hero", fontName="Times-Italic", fontSize=13, leading=18),
    "foot": st("foot", fontName="Times-Italic", fontSize=9.5, leading=13, textColor=MUTED),
    "footc": st("footc", fontName="Times-Italic", fontSize=9, leading=12, textColor=MUTED, alignment=TA_CENTER),
}


def tag(text, color=MUTED, size="6.5"):
    return (f'<font color="#{color.hexval()[2:]}" face="Helvetica-Bold" '
            f'size="{size}">{text}</font>&nbsp;&nbsp;')


def block(name, quote, note=None, accent=BORDER, quote_style="quote"):
    rows = [[Paragraph(name, S["name"])],
            [Paragraph(f"“{quote}”" if quote_style == "quote" else quote, S[quote_style])]]
    if note:
        rows.append([Paragraph(tag("NOTE") + note, S["body"])])
    t = Table(rows, colWidths=[W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 0.75, accent),
        ("LINEBELOW", (0, 0), (0, 0), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (0, 0), 7),
        ("BOTTOMPADDING", (0, -1), (0, -1), 8),
    ]))
    return KeepTogether([t, Spacer(1, 8)])


# ---- content ----
BASE = ("It’s an invite-only listings site for New Yorkers. Apartments, furniture, whatever you need. "
        "A member has to vouch for you to get in, and they stay responsible for you: break the rules and "
        "you’re both out. So people are careful about who they bring in.<br/><br/>"
        "Think about your group chat. Someone posts that they’ve got a spare room going, and you trust it "
        "straight away, because you know exactly who you’re dealing with. That’s the feeling I’m building.")

SHORT = ("It’s an invite-only listings site for New Yorkers. A member has to vouch for you to get in — "
         "and if you behave badly, they go too.")

BEATS = [
    ("1 · DEFINE", "What it is, in one sentence."),
    ("2 · MECHANISM", "A member vouches you in, and stays answerable for you."),
    ("3 · CONSEQUENCE", "Break the rules and you’re both out — so people are careful."),
    ("4 · PICTURE", "The group chat, the spare room, the instant trust."),
    ("5 · CLOSE", "“Would you actually use this?” · “Who are the three Manhattanites you’d vouch for?”"),
]

SCENARIOS = [
    ("1. Coffee, dinner, a drink — they asked properly",
     BASE,
     "The base version, unchanged. Beats in order, no rearranging. This is the one to have by heart."),
    ("2. On the phone, or a voice note",
     "You know how if someone in your group chat says they’ve got a spare room going, you just trust it? "
     "You’re not wondering whether it’s real or whether they’ll ghost you, because you know who they are."
     "<br/><br/>That’s the thing I’ve built, as a site. Invite-only, New Yorkers. Apartments, furniture, "
     "whatever people need. A member has to vouch for you to get in, and they stay answerable for you "
     "afterwards — if you break the rules, you’re both out. So nobody brings in someone they’re not sure "
     "about. I’m putting the first ten members together now.",
     "They can’t see your face, so the picture goes first — it buys their attention before you’ve defined "
     "anything. Beats 4, 1, 2, 3."),
    ("3. Straight after they’ve told you their own bad story",
     "That’s exactly it. Nobody really uses those sites any more, they just ask their friends. So I’ve "
     "built the friends version, properly.<br/><br/>It’s an invite-only listings site for New Yorkers — "
     "apartments, furniture, whatever you need. A member has to vouch for you to get in, and they stay "
     "responsible for you: break the rules and you’re both removed. Which means nobody could do to you "
     "what that guy did, because they’d be taking whoever vouched for them down too.",
     "The most valuable version you own, and the one you’ll use most. Don’t pitch — agree, then attach the "
     "mechanism to the thing that just happened to them."),
    ("4. Handed over by a friend who’s already primed them",
     "So [Friend] has probably given you the short version. It’s an invite-only listings site for New "
     "Yorkers — apartments, furniture, whatever people need.<br/><br/>The bit that makes it work is that a "
     "member has to vouch for you to get in, and they stay responsible for you afterwards. If you break the "
     "rules, you both go. So nobody vouches casually. [Friend] would be putting himself on the line for you, "
     "which is the real compliment in this conversation, not me asking.",
     "They’ve heard a version. Don’t repeat it — go to the mechanism, and make the friend’s vouch the "
     "compliment."),
    ("5. Walking somewhere together, or in a car",
     "It’s an invite-only listings site for New Yorkers. Apartments, furniture, whatever you need — the "
     "same things you’d look for anywhere else.<br/><br/>The difference is that a member has to vouch for "
     "you before you can join, and they stay answerable for you afterwards. Break the rules and you’re both "
     "removed. So people are careful and considered about who they bring in.<br/><br/>Think about your group "
     "chat — someone’s got a spare room going and you trust it straight away, because you know exactly who "
     "you’re dealing with. That’s the feeling, at the scale of a city. It’s small on purpose: I’m choosing "
     "the first ten members by hand.",
     "No eye contact and no rush, which is the best possible room for the long version. All five beats, and "
     "take your time."),
]

PEOPLE = [
    ("The sceptic, the businessman",
     "Here’s the thing nobody says out loud: Craigslist and Marketplace are effectively dead in New York. "
     "People don’t browse them, they ask their group chats — anyone know a flat, anyone selling a sofa. The "
     "trust moved into the social graph and the marketplaces never followed it.<br/><br/>So I built the "
     "group-chat version and made it enforceable. Invite-only, New Yorkers only. A member vouches you in and "
     "stays answerable for you: break the rules and you’re both removed. That one rule does the work that "
     "reviews and verification badges never have.<br/><br/>There’s a French site running on exactly that "
     "with two million members. Nothing like it exists here. Mine’s live, and I’m choosing the first ten "
     "members by hand.",
     "The Marwan case. TWO SENTENCES OF PAIN before you mention the product — lead with the product and he "
     "starts valuing a startup instead of hearing a problem."),
    ("The practical New Yorker — renting, moving, hunting",
     "It’s an invite-only listings site for New Yorkers — apartments, furniture, whatever you’re after. "
     "Everything on it comes from someone another member vouched in, and that member stays answerable for "
     "them: if they behave badly, they’re both removed.<br/><br/>So the scam risk isn’t really there, "
     "because pulling one would cost two people their membership rather than one throwaway account. I’m "
     "picking the first ten members by hand and I want people who’d actually use it.",
     "Lead with what they get. The mechanism is the guarantee, not the idea."),
    ("The socially connected one",
     "It’s an invite-only listings site for New Yorkers. Apartments, furniture, whatever people need."
     "<br/><br/>Getting in means a member vouches for you and stakes their own membership on you, because if "
     "you break the rules they go too. Turns out that’s the only thing that reliably makes people behave."
     "<br/><br/>It’s small on purpose — the first ten set the standard for everyone after — and I’d rather "
     "you were shaping it than hearing about it in six months.",
     "The interesting part here is the stake, not the door. Never reach for velvet-rope language; it invites "
     "the exclusive-because-cool reading you rejected."),
    ("The older, settled local",
     "It’s a private listings site for New Yorkers — apartments, furniture, the useful things. Members only."
     "<br/><br/>Each member is vouched in by another member, and that member stays answerable for whoever "
     "they bring in. If someone behaves badly, they’re both off it. It’s the principle of a club register, "
     "applied to a marketplace.<br/><br/>I’m choosing the first ten by hand, and those ten set the standard "
     "for everyone who follows.",
     "Slower and plainer. Lead with the standard, not the novelty, and give them a frame they already "
     "respect."),
    ("The supply side — landlord, buildings, shop",
     "It’s an invite-only listings site for New Yorkers. If you put a place on it, every enquiry you get "
     "comes from someone a member vouched in and stays answerable for — you can see who brought them, and "
     "that person loses their membership too if it goes wrong.<br/><br/>It’s the opposite of an anonymous "
     "inbox. One vacancy would make a good first listing.",
     "NEVER describe the membership by the type of person in this conversation. Conduct, not type. "
     "(Fair-Housing_Research_v1.md)"),
    ("The one who wants to know why it works",
     "Every marketplace bolts trust on at the end — reviews, badges, dispute resolution — and none of it "
     "really works, because the cost of behaving badly is one throwaway account.<br/><br/>So I built the "
     "trust first. A member vouches you in and carries the risk of you: break the rules and you’re both "
     "removed. The cost of bad behaviour lands on two people who know each other, which is the only thing "
     "that actually changes it.<br/><br/>There’s a French site running on that single rule with two million "
     "members. Nothing like it here.",
     "Finance, tech, media. The design flaw first, then your fix, then the proof."),
]

WRITTEN = [
    ("The invitation — the decided version",
     "Manhattanite is an invite-only listings site for New Yorkers. Apartments, furniture, things worth "
     "passing on. The same stuff you’d find on any classifieds site.<br/><br/>"
     "<b>The difference is who’s on it.</b> A member has to vouch for you before you can join, and they "
     "stay responsible for you afterwards. If you break the rules, you’re both removed. So people are "
     "careful and considered about who they bring in.<br/><br/>"
     "Think about your group chat. Someone mentions they’ve got a spare room going and you trust it "
     "straight away, because you know exactly who you’re dealing with. That’s what I’m building, at the "
     "scale of a city.<br/><br/>"
     "It’s small on purpose. I’m choosing the first ten members by hand, and I’d like you to be one of them."),
    ("Text or WhatsApp",
     "Been building something — an invite-only listings site for New Yorkers. Apartments, furniture, that "
     "sort of thing, except you can only join if a member vouches for you, and they stay answerable for "
     "you afterwards.<br/><br/>"
     "I’m picking the first ten by hand and I want you in. Free, takes a minute. Can I send you the link?"),
    ("Someone who’s already heard about it from a friend",
     "Short version: it’s an invite-only listings site for New Yorkers — apartments, furniture, whatever "
     "people need. You can only join if a member vouches for you, and if you break the rules you’re both "
     "removed, so people are careful about who they bring in.<br/><br/>"
     "[Friend] can vouch for you if you want in. There are ten of us to start with."),
    ("Writing to a friend of a member (second degree)",
     "[Member] suggested I get in touch. I’ve built a private listings site for New Yorkers — apartments, "
     "furniture, things worth passing on — where every member is vouched in by another member who stays "
     "answerable for them.<br/><br/>"
     "He’s offered to vouch for you, which is the only way in. It’s small on purpose: ten members to "
     "begin with. Worth a look?"),
    ("For someone who’ll read it properly — the long written version",
     "<i>For the sceptic, or anyone who asked you to send something rather than tell them.</i><br/><br/>"
     "Manhattanite is an invite-only listings site for New Yorkers. Apartments, furniture, things worth "
     "passing on.<br/><br/>"
     "The premise is that Craigslist and Marketplace are effectively dead here. People don’t browse them "
     "any more, they ask their group chats — anyone know a flat, anyone selling a sofa. The trust moved "
     "into the social graph years ago and the marketplaces never followed it.<br/><br/>"
     "So this is the group-chat version, made enforceable. A member has to vouch for you before you can "
     "join, and they stay responsible for you afterwards: if you break the rules, you’re both removed. "
     "That single rule does the work that reviews and verification badges never have, because the cost of "
     "behaving badly lands on two people who know each other rather than on one throwaway account."
     "<br/><br/>"
     "It isn’t a startup in the way you’re probably imagining. It costs about ten dollars a month to run, "
     "there’s no investor, and I’m choosing the first ten members by hand. A French site called Gens de "
     "Confiance has been running on the same single rule for a decade and has two million members. Nothing "
     "like it exists in New York.<br/><br/>"
     "It’s live. I’d like you to be one of the first ten."),
]

DROPBACK = [
    "They asked to be polite, not because they want to know.",
    "You’re standing up, or one of you is leaving.",
    "It’s noisy, or there are more than three of you.",
    "It’s the fourth time today and you can hear yourself performing it.",
    "They’ve already started talking about something else.",
]

QA = [
    ("“Is it free?”",
     "“Free to join, free to browse. Paying to post comes much later, and membership stays free.”"),
    ("“How many people are on it?”",
     "“Ten, to start with, picked by hand. That’s the point rather than the problem.”"),
    ("“Who else is on it?”",
     "“I’ll ask them before I start using their names — same courtesy you’d get.”"),
    ("“What if someone I vouch for behaves badly?”",
     "“We’d both be off it. Which is exactly why I’m asking you and not everyone.”"),
    ("“Can I invite people?”",
     "“That’s the whole engine. Three names is what I usually ask for.”"),
    ("“Is it just Manhattan?”",
     "“Manhattan first. I’d rather it were dense than big.”"),
    ("“Is this a startup?”",
     "“It’s not a startup-startup. It costs about ten dollars a month to run, there’s no investor, and "
     "I’m picking the first ten members by hand. Closer to a members’ club than a company.”"),
    ("“So it’s Craigslist?”",
     "Agree, then turn — never resist the comparison. “Exactly, except you can’t get on it unless "
     "someone puts themselves on the line for you.”"),
    ("They’ve gone blank",
     "Drop everything else and give them beat 4. “Think about your group chat. Someone’s got a spare "
     "room going and you trust it straight away, because you know who you’re dealing with.”"),
    ("They ask something you don’t know",
     "“I don’t know yet. I’ll find out and tell you.” That answer is on-brand. Making one up is not."),
]


def bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, letter[0], letter[1], stroke=0, fill=1)
    canvas.setFont("Times-Italic", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.75 * inch, 0.45 * inch, "Manhattanite — the pitch, variants (v2, long form)")
    canvas.drawRightString(letter[0] - 0.75 * inch, 0.45 * inch, f"{canvas.getPageNumber()}")
    canvas.restoreState()


def heading(text, kicker=None):
    bits = [Paragraph(text, S["h2"]), Spacer(1, 4)]
    if kicker:
        bits += [Paragraph(kicker, S["kicker"]), Spacer(1, 6)]
    else:
        bits += [Spacer(1, 4)]
    return bits


def build(path):
    doc = BaseDocTemplate(path, pagesize=letter,
                          leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                          topMargin=0.7 * inch, bottomMargin=0.7 * inch,
                          title="Manhattanite — The Pitch, Variants v2",
                          author="George Gardner")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=bg)])

    e = [Paragraph("The pitch — variants", S["title"]), Spacer(1, 3),
         Paragraph("The long pitch, bent to fit the room. Learn the five beats, not the sentences.", S["subtitle"]),
         Spacer(1, 14)]

    hero = Table([
        [Paragraph(tag("THE BASE VERSION", GOLD, "7") + f"<br/>“{BASE}”", S["hero"])],
        [Paragraph(tag("IF YOU LOSE THE THREAD", MUTED) +
                   "Go to beat 4. The picture rescues any version.", S["body"])],
        [Paragraph(tag("THE ESCAPE HATCH", RED) + f"“{SHORT}” — then stop.", S["body"])],
    ], colWidths=[W])
    hero.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 1.0, INK),
        ("LINEBELOW", (0, 0), (0, 0), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (0, 0), 10),
        ("BOTTOMPADDING", (0, -1), (0, -1), 10),
    ]))
    e.append(hero)
    e.append(Spacer(1, 18))

    e += heading("The five beats",
                 "Every version below is these five, reordered or reweighted. Learn the beats, not the "
                 "sentences — then you can’t lose your place.")
    beat_rows = [[Paragraph(f'<font face="Helvetica-Bold" size="8" color="#{GOLD.hexval()[2:]}">{k}</font>',
                            S["body"]),
                  Paragraph(v, S["body"])] for k, v in BEATS]
    bt = Table(beat_rows, colWidths=[1.25 * inch, 5.65 * inch])
    bt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    e.append(KeepTogether(bt))
    e.append(Spacer(1, 18))

    e += heading("Part 1 — by scenario",
                 "Every version here assumes you have their attention. If you don’t, see the drop-back "
                 "panel near the end.")
    for name, quote, note in SCENARIOS:
        e.append(block(name, quote, note))

    e.append(Spacer(1, 10))
    e += heading("Part 2 — by person",
                 "The same five beats, weighted differently. The pitch cards hold the twelve tracker types "
                 "and their angle lines; this is the opener at full length, for someone you haven’t typed yet.")
    for name, quote, note in PEOPLE:
        e.append(block(name, quote, note))

    e.append(Spacer(1, 10))
    e += heading("Part 3 — written variants", "Same content, different room. Nothing here is a template to send unread.")
    for name, text in WRITTEN:
        e.append(block(name, text, None, quote_style="body"))

    e.append(Spacer(1, 10))
    drop = Table([[Paragraph(
        tag("WHEN TO DROP BACK TO THE SHORT LINE", RED, "7") +
        "<br/>The long version in the wrong room is worse than no pitch at all — it reads as needing "
        "something from them. Use the short line when: " + " &nbsp;·&nbsp; ".join(DROPBACK) +
        "<br/><br/><i>“" + SHORT + "”</i> Then stop. If they want the long version they’ll ask, and that "
        "question is worth more than anything you’d have said unprompted.", S["foot"])]], colWidths=[W])
    drop.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 1.0, RED),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    e.append(KeepTogether(drop))
    e.append(Spacer(1, 16))

    e += heading("Part 4 — the questions that actually come back",
                 "The pitch is rarely the hard part. These are.")
    qa_rows = []
    for q, a in QA:
        qa_rows.append([Paragraph(f"<b>{q}</b>", S["body"]), Paragraph(a, S["body"])])
    qt = Table(qa_rows, colWidths=[2.2 * inch, 4.7 * inch])
    qt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, BORDER),
        ("LINEAFTER", (0, 0), (0, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    e.append(qt)

    e.append(Spacer(1, 16))
    walk = Table([[Paragraph(
        tag("BEFORE YOU WALK IN — SIXTY SECONDS, NO MORE", GOLD, "7") +
        "<br/>1. Do I have their attention, or am I hoping for it? That picks long or short. &nbsp; "
        "2. Which scenario, which person. &nbsp; 3. Say the first beat once, under your breath — the rest "
        "follows. &nbsp; 4. Decide the tailored ask. &nbsp; 5. Remember the close. Both questions, every "
        "time.", S["foot"])]], colWidths=[W])
    walk.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HEADBG),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    e.append(KeepTogether(walk))
    e.append(Spacer(1, 10))
    e.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    e.append(Spacer(1, 6))
    e.append(Paragraph("The decision this is built on lives in Manhattanite_One-Line-Pitch_v2.md. "
                       "Next revision after the first five conversations.", S["footc"]))

    doc.build(e)
    print(f"Built {path}")


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "Manhattanite_Pitch-Variants_v2.pdf"
    build(out)
