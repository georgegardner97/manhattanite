#!/usr/bin/env python3
"""Generate Founding-Members_Pitch-Cards_v2.pdf from the pitch-card content.

Re-run this script to rebuild the PDF after edits. Layout: US letter,
Manhattanite palette (cream/ink/gold), serif throughout.
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

# ---- palette ----
INK = HexColor("#1a1a1a")
CREAM = HexColor("#faf7f0")
PANEL = HexColor("#ffffff")
BORDER = HexColor("#e4ddd0")
MUTED = HexColor("#6b6459")
GOLD = HexColor("#8a6d1f")
RED = HexColor("#b5443c")

MOTIVE_COLORS = {
    "PAIN": HexColor("#b5443c"),
    "PRIDE": HexColor("#8a6d1f"),
    "SUPPLY": HexColor("#4a7c3a"),
    "MODEL": HexColor("#3d6b9e"),
}

# ---- styles ----
def st(name, **kw):
    base = dict(fontName="Times-Roman", fontSize=10.5, leading=14.5, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)

S = {
    "title": st("title", fontName="Times-Bold", fontSize=24, leading=28),
    "subtitle": st("subtitle", fontName="Times-Italic", fontSize=11, leading=15, textColor=MUTED),
    "h2": st("h2", fontName="Times-Bold", fontSize=15, leading=19, spaceBefore=6),
    "body": st("body"),
    "beat": st("beat", fontSize=11, leading=16),
    "quote": st("quote", fontName="Times-Italic", fontSize=11.5, leading=16),
    "cardname": st("cardname", fontName="Times-Bold", fontSize=12.5, leading=16),
    "cardbody": st("cardbody", fontSize=10, leading=13.5),
    "label": st("label", fontName="Helvetica-Bold", fontSize=7, leading=9, textColor=MUTED),
    "foot": st("foot", fontName="Times-Italic", fontSize=9, leading=12, textColor=MUTED, alignment=TA_CENTER),
    "motivehdr": st("motivehdr", fontName="Helvetica-Bold", fontSize=8.5, leading=11),
    "motivebody": st("motivebody", fontSize=9.5, leading=12.5),
}

def chip(motive):
    c = MOTIVE_COLORS[motive]
    return Paragraph(
        f'<font face="Helvetica-Bold" size="7" color="{c.hexval()[2:]}">'
        f"{motive}</font>",
        S["label"],
    )

# ---- content ----
SPINE = [
    ("1 · OPEN", "“It’s an invite-only listings site for New Yorkers. A member has to vouch for you to get in — and if you behave badly, they go too.”"),
    ("2 · SWAP", "The angle line for their type — the only beat that changes."),
    ("3 · PICTURE", "“Think about your group chat. Someone’s got a spare room going and you trust it straight away, because you know who you’re dealing with.”"),
    ("4 · CLOSE", "“Would you actually use this?” · “Who are the three Manhattanites you’d vouch for?”"),
]

MOTIVES = [
    ("PAIN", "Has suffered the alternative", "Movers, Newcomers", "Tell their story back to them."),
    ("PRIDE", "Their judgement about people carries weight", "Locals, Connectors, Tastemakers", "Their judgement is the asset, not their name."),
    ("SUPPLY", "Has, or hears about, the goods", "Landlords, Fixtures, Hospitality, Design, Creatives", "Their stuff finds a better room."),
    ("MODEL", "Wants to know why it works", "Finance, Tech, Media", "Trust built first, marketplace on top."),
]

CARDS = [
    ("Young professional / mover", "PAIN",
     "You know what it’s like trying to find anything here. Scams, flakes, people who don’t show. On this, whoever you’re dealing with was let in by someone who’s now answerable for them.",
     "What are they hunting for or offloading right now? That becomes their first search or first listing.",
     "They convert on their own story. Ask “what’s your worst marketplace story?” then land the opener on top of their answer."),
    ("Established local", "PRIDE",
     "The first ten members set the standard for everyone who comes after. I want people whose judgement about other people I’d trust.",
     "Lean on question 2. They know exactly who they’d vouch for, and their vouches carry.",
     "Don’t oversell. Confidence, not flattery. They join because it’s serious, not because you need them."),
    ("Newcomer to the city", "PAIN",
     "This is the network people spend ten years building, and you’d have it on day one — except everyone in it has somebody answering for them.",
     "What are they hunting for right now?",
     "They may feel they have nothing to offer. Tell them newcomers make the market. They’re the buyers and the renters."),
    ("Connector — knows everyone", "PRIDE",
     "You already make introductions for free. Here they count for something, and they cost you something too — which is exactly what makes them worth having.",
     "Skip question 1, go straight to question 2. They’ll offer ten names; take three.",
     "Say the liability part out loud to this type above all. A connector who vouches casually is the single biggest risk to the standard. Hold the ceiling even when they hand you a list."),
    ("Neighbourhood fixture — shop / café / staff", "SUPPLY",
     "You hear who’s moving before their landlord does. Here that’s worth something.",
     "Send the person, not the tip. When someone mentions moving out, that’s an invite moment.",
     "This pitch happens across a counter, not over email. Casual and short."),
    ("Apartment supply — landlord / buildings", "SUPPLY",
     "Every enquiry comes from someone a member let in and stays answerable for. Not anonymous strangers — you can see who brought them in.",
     "One vacancy or sublet as a first listing.",
     "Fair housing. The listing describes the apartment, never the wanted tenant. You approve or decline; you never rewrite. Never say “likeminded” or anything about the type of person — the standard is conduct, not who people are."),
    ("Tastemaker — has an audience", "PRIDE",
     "It’s small on purpose, and the first ten decide what it becomes. I’d rather you shaped it than heard about it later.",
     "Membership only. Do NOT ask them to post about it — seed phase is private.",
     "They can smell being wanted for reach. The pitch is being early, not being a channel."),
    ("Creative — artist / musician / designer", "SUPPLY",
     "Artists already run on word of mouth — sublets, gear, spaces. This is the same thing with a search bar.",
     "First listing: the amp, the flat file, the summer sublet.",
     "Price sensitivity. Lead with “free to join, free to browse” before they have to ask."),
    ("Design & interiors", "SUPPLY",
     "Somewhere the things for sale are actually good, and photographed like it matters. Your pieces deserve a better room.",
     "List one piece. Their photography sets the standard for the whole site.",
     "Business accounts are out of scope. Invite the person, not the studio. Client-offload pieces park until later."),
    ("Media / writer", "MODEL",
     "Tell the long spoken version, then the proof: there’s a French site called Gens de Confiance running on the same single rule. Two million members. Nothing like it here.",
     "“I’m not pitching coverage — that comes much later, if ever. I want you in it as a member.”",
     "Saying “no press yet” makes it more interesting to them, not less. The embargo is part of the pitch."),
    ("Finance / business", "MODEL",
     "It filters the way you already filter everything — through people who’ve put something of their own at risk on the recommendation.",
     "Question 2, hard. Their vouches tend to be fast and high quality.",
     "They’ll ask about the business model. One line: “Pay-per-post later. Membership free forever.” Then move on."),
    ("Tech / startup", "MODEL",
     "Every marketplace bolts trust on at the end — reviews, badges, dispute resolution. I built the trust first and the marketplace on top of it.",
     "Both questions work as written.",
     "“How does this scale?” is coming. The answer: “Slowly, on purpose.” The restraint is the model."),
    ("Other / unclassified", None,
     "Open, picture, two questions.",
     "If the conversation goes well you’ll know their motive by the end — retype them in the tracker.",
     "If you forget everything: opener, their motive, the two questions. That’s a complete pitch."),
]


def card_block(name, motive, angle, ask, watch):
    header_bits = f'<font face="Times-Bold" size="12">{name}</font>'
    if motive:
        c = MOTIVE_COLORS[motive]
        header_bits += (f' &nbsp;&nbsp;<font face="Helvetica-Bold" size="7.5" '
                        f'color="#{c.hexval()[2:]}">{motive}</font>')
    rows = [
        [Paragraph(header_bits, S["cardname"])],
        [Paragraph(f'<font color="#{MUTED.hexval()[2:]}" face="Helvetica-Bold" size="6.5">ANGLE</font>&nbsp;&nbsp;'
                   f'<i>“{angle}”</i>', S["cardbody"])],
        [Paragraph(f'<font color="#{MUTED.hexval()[2:]}" face="Helvetica-Bold" size="6.5">ASK</font>&nbsp;&nbsp;{ask}', S["cardbody"])],
        [Paragraph(f'<font color="#{RED.hexval()[2:]}" face="Helvetica-Bold" size="6.5">WATCH FOR</font>&nbsp;&nbsp;{watch}', S["cardbody"])],
    ]
    t = Table(rows, colWidths=[6.9 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LINEBELOW", (0, 0), (0, 0), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (0, 0), 7),
        ("BOTTOMPADDING", (0, -1), (0, -1), 8),
    ]))
    return KeepTogether([t, Spacer(1, 8)])


def bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, letter[0], letter[1], stroke=0, fill=1)
    canvas.setFont("Times-Italic", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.75 * inch, 0.45 * inch, "Manhattanite — founding members pitch cards (v2)")
    canvas.drawRightString(letter[0] - 0.75 * inch, 0.45 * inch, f"{canvas.getPageNumber()}")
    canvas.restoreState()


def build(path):
    doc = BaseDocTemplate(path, pagesize=letter,
                          leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                          topMargin=0.7 * inch, bottomMargin=0.7 * inch,
                          title="Manhattanite — Founding Members Pitch Cards v2",
                          author="George Gardner")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=bg)])

    e = []
    # ---- page 1: spine + motives + the two descriptions ----
    e.append(Paragraph("Founding members — pitch cards", S["title"]))
    e.append(Spacer(1, 3))
    e.append(Paragraph("Memorise one spine. Swap one line. Everything else is conversation.", S["subtitle"]))
    e.append(Spacer(1, 14))

    e.append(Paragraph("The spine — four beats, twenty seconds", S["h2"]))
    e.append(Spacer(1, 6))
    spine_rows = [[Paragraph(f'<font face="Helvetica-Bold" size="8" color="#{GOLD.hexval()[2:]}">{k}</font>', S["beat"]),
                   Paragraph(v, S["beat"])] for k, v in SPINE]
    t = Table(spine_rows, colWidths=[1.05 * inch, 5.85 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    e.append(t)
    e.append(Spacer(1, 16))

    e.append(Paragraph("The four motives — if you memorise only one thing", S["h2"]))
    e.append(Spacer(1, 6))
    mrows = [[Paragraph('<font face="Helvetica-Bold" size="7.5" color="#6b6459">MOTIVE</font>', S["label"]),
              Paragraph('<font face="Helvetica-Bold" size="7.5" color="#6b6459">THE PERSON</font>', S["label"]),
              Paragraph('<font face="Helvetica-Bold" size="7.5" color="#6b6459">TYPES</font>', S["label"]),
              Paragraph('<font face="Helvetica-Bold" size="7.5" color="#6b6459">THE MOVE</font>', S["label"])]]
    for m, person, types, move in MOTIVES:
        c = MOTIVE_COLORS[m]
        mrows.append([
            Paragraph(f'<font face="Helvetica-Bold" size="8.5" color="#{c.hexval()[2:]}">{m}</font>', S["motivehdr"]),
            Paragraph(person, S["motivebody"]),
            Paragraph(types, S["motivebody"]),
            Paragraph(f"<i>{move}</i>", S["motivebody"]),
        ])
    mt = Table(mrows, colWidths=[0.75 * inch, 1.7 * inch, 2.35 * inch, 2.1 * inch])
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#f5f0e6")),
        ("BACKGROUND", (0, 1), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    e.append(mt)
    e.append(Spacer(1, 16))

    desc_rows = [
        [Paragraph('<font face="Times-Bold" size="11">Spoken — short. The default. Memorise this one.</font><br/>'
                   '<font face="Times-Italic" size="12">“It’s an invite-only listings site for New Yorkers. '
                   'A member has to vouch for you to get in — and if you behave badly, they go too.”</font>',
                   S["cardbody"])],
        [Paragraph(f'<font color="#{MUTED.hexval()[2:]}" face="Helvetica-Bold" size="6.5">SPOKEN — LONG, ONLY IF THEY LEAN IN</font>&nbsp;&nbsp;'
                   '<i>“It’s an invite-only listings site for New Yorkers. Apartments, furniture, whatever you need. '
                   'A member has to vouch for you to get in, and they stay responsible for you: break the rules and '
                   'you’re both out. So people are careful about who they bring in. Think about your group chat. '
                   'Someone posts that they’ve got a spare room going, and you trust it straight away, because you know '
                   'exactly who you’re dealing with. That’s the feeling I’m building.”</i>', S["cardbody"])],
        [Paragraph(f'<font color="#{MUTED.hexval()[2:]}" face="Helvetica-Bold" size="6.5">WRITTEN — THE INVITATION</font>&nbsp;&nbsp;'
                   'Manhattanite is an invite-only listings site for New Yorkers. Apartments, furniture, things worth '
                   'passing on. The same stuff you’d find on any classifieds site. <b>The difference is who’s on it.</b> '
                   'A member has to vouch for you before you can join, and they stay responsible for you afterwards. '
                   'If you break the rules, you’re both removed. So people are careful and considered about who they '
                   'bring in. Think about your group chat. Someone mentions they’ve got a spare room going and you trust '
                   'it straight away, because you know exactly who you’re dealing with. That’s what I’m building, at the '
                   'scale of a city. It’s small on purpose. I’m choosing the first ten members by hand, and I’d like you '
                   'to be one of them.', S["cardbody"])],
        [Paragraph(f'<font color="#{RED.hexval()[2:]}" face="Helvetica-Bold" size="6.5">NEVER</font>&nbsp;&nbsp;'
                   'Never volunteer Craigslist, Raya or the word “startup” — let them make the comparison and agree warmly '
                   'when they do. Never name jobs or services; apartments and furniture are what’s live. Never say “your '
                   'voucher” in writing. Ten members, not twenty.', S["cardbody"])],
    ]
    rt = Table(desc_rows, colWidths=[6.9 * inch])
    rt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("BOX", (0, 0), (-1, -1), 1.0, INK),
        ("LINEBELOW", (0, 0), (0, 0), 0.5, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (0, 0), 8),
        ("BOTTOMPADDING", (0, -1), (0, -1), 8),
    ]))
    e.append(KeepTogether([Paragraph("The two descriptions", S["h2"]), Spacer(1, 6), rt]))

    # ---- cards ----
    e.append(Spacer(1, 20))
    e.append(Paragraph("The cards", S["h2"]))
    e.append(Spacer(1, 8))
    for name, motive, angle, ask, watch in CARDS:
        e.append(card_block(name, motive, angle, ask, watch))

    # ---- drill ----
    e.append(Spacer(1, 10))
    e.append(Paragraph("Practice drill — 10 minutes", S["h2"]))
    e.append(Spacer(1, 6))
    drill = [
        "1. Say the spine out loud three times, until beats 1, 3 and 4 are automatic.",
        "2. Shuffle: pick names off the tracker at random. Say the motive out loud, then the angle line.",
        "3. Before each coffee: 60 seconds. Motive, angle line, tailored ask. Nothing else.",
    ]
    for d in drill:
        e.append(Paragraph(d, S["beat"]))
        e.append(Spacer(1, 3))
    e.append(Spacer(1, 8))
    e.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    e.append(Spacer(1, 8))
    e.append(Paragraph("If you forget everything mid-conversation: opener, their motive, the two questions. That's a complete pitch.", S["quote"]))

    doc.build(e)
    print(f"Built {path}")


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "Founding-Members_Pitch-Cards_v2.pdf"
    build(out)
