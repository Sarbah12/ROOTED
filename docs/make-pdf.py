"""Generates the Rooted technical documentation PDF."""

import os
from datetime import date

from PIL import Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image as RLImage,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = os.path.expanduser("~/Developer/Rooted")
OUT = os.path.expanduser("~/Developer/Rooted/docs/Rooted-Documentation.pdf")
SCRATCH = os.path.dirname(os.path.abspath(__file__))

# Brand palette, matching constants/app-theme.ts
GREEN = colors.HexColor("#2E6A5C")
GREEN_DEEP = colors.HexColor("#1E4A3F")
CREAM = colors.HexColor("#F4F1EA")
SURFACE = colors.HexColor("#FEFDF9")
GOLD = colors.HexColor("#B98D49")
INK = colors.HexColor("#16211C")
MUTED = colors.HexColor("#5B6961")
BORDER = colors.HexColor("#D7E0DA")
CLAY = colors.HexColor("#C46A54")

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm

# ---------------------------------------------------------------- logo prep
logo_path = os.path.join(SCRATCH, "logo_doc.png")
src = Image.open(os.path.join(ROOT, "assets/images/rooted-logo.png")).convert("RGBA")
alpha = src.getchannel("A").point(lambda a: 255 if a > 160 else 0)
src = src.crop(alpha.getbbox())
canvas_img = Image.new("RGB", src.size, (244, 241, 234))
canvas_img.paste(src, (0, 0), src)
canvas_img.save(logo_path)
LOGO_W, LOGO_H = canvas_img.size

# ---------------------------------------------------------------- styles
ss = getSampleStyleSheet()


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.5, leading=14, textColor=INK)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "title": style("t", fontName="Times-Roman", fontSize=34, leading=40, textColor=GREEN_DEEP),
    "subtitle": style("st", fontSize=12, leading=17, textColor=MUTED),
    "h1": style("h1", fontName="Times-Roman", fontSize=21, leading=26, textColor=GREEN_DEEP,
                spaceBefore=2, spaceAfter=8),
    "h2": style("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=GREEN,
                spaceBefore=12, spaceAfter=5),
    "h3": style("h3", fontName="Helvetica-Bold", fontSize=9.8, leading=13, textColor=INK,
                spaceBefore=9, spaceAfter=3),
    "body": style("b", spaceAfter=6),
    "small": style("sm", fontSize=8.4, leading=12, textColor=MUTED),
    "code": style("c", fontName="Courier", fontSize=8.2, leading=11.5, textColor=GREEN_DEEP,
                  backColor=colors.HexColor("#EEF4EF"), borderPadding=5, spaceAfter=6),
    "cell": style("cl", fontSize=8.4, leading=11.5),
    "cellb": style("clb", fontName="Helvetica-Bold", fontSize=8.4, leading=11.5),
    "cellhead": style("ch", fontName="Helvetica-Bold", fontSize=8.2, leading=11,
                      textColor=colors.white),
    "note": style("n", fontSize=8.8, leading=13),
    "toc": style("toc", fontSize=10, leading=19),
}


def P(text, s="body"):
    return Paragraph(text, S[s])


def table(rows, widths, head=True, zebra=True):
    data = []
    for i, row in enumerate(rows):
        rendered = []
        for cell in row:
            st = "cellhead" if (head and i == 0) else "cell"
            rendered.append(Paragraph(str(cell), S[st]))
        data.append(rendered)

    t = Table(data, colWidths=widths, repeatRows=1 if head else 0)
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, BORDER),
        ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
    ]
    if head:
        cmds += [("BACKGROUND", (0, 0), (-1, 0), GREEN),
                 ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
                 ("TOPPADDING", (0, 0), (-1, 0), 7)]
    if zebra:
        start = 1 if head else 0
        for r in range(start, len(data)):
            if (r - start) % 2 == 1:
                cmds.append(("BACKGROUND", (0, r), (-1, r), colors.HexColor("#F7FAF8")))
    t.setStyle(TableStyle(cmds))
    return t


def callout(title, body, accent=GOLD):
    inner = [[Paragraph(f"<b>{title}</b><br/>{body}", S["note"])]]
    t = Table(inner, colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FBF7EF")),
        ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


# ---------------------------------------------------------------- page frames
def cover_page(canv, doc):
    canv.saveState()
    canv.setFillColor(CREAM)
    canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canv.setFillColor(GREEN)
    canv.rect(0, PAGE_H - 12 * mm, PAGE_W, 12 * mm, stroke=0, fill=1)
    canv.setFillColor(GOLD)
    canv.rect(0, 0, PAGE_W, 6 * mm, stroke=0, fill=1)
    canv.restoreState()


def content_page(canv, doc):
    canv.saveState()
    canv.setFillColor(SURFACE)
    canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # header rule
    canv.setStrokeColor(BORDER)
    canv.setLineWidth(0.5)
    canv.line(MARGIN, PAGE_H - 14 * mm, PAGE_W - MARGIN, PAGE_H - 14 * mm)
    canv.setFont("Helvetica-Bold", 7.5)
    canv.setFillColor(GREEN)
    canv.drawString(MARGIN, PAGE_H - 12.4 * mm, "ROOTED")
    canv.setFont("Helvetica", 7.5)
    canv.setFillColor(MUTED)
    canv.drawRightString(PAGE_W - MARGIN, PAGE_H - 12.4 * mm, "Technical documentation")

    # footer
    canv.line(MARGIN, 14 * mm, PAGE_W - MARGIN, 14 * mm)
    canv.setFont("Helvetica", 7.5)
    canv.setFillColor(MUTED)
    canv.drawString(MARGIN, 10.4 * mm, date.today().strftime("%d %B %Y"))
    canv.drawRightString(PAGE_W - MARGIN, 10.4 * mm, str(canv.getPageNumber()))
    canv.restoreState()


doc = BaseDocTemplate(
    OUT, pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=22 * mm, bottomMargin=20 * mm,
    title="Rooted - Technical Documentation",
    author="Rooted",
    subject="Architecture, features, API and deployment",
)
frame = Frame(MARGIN, 20 * mm, PAGE_W - 2 * MARGIN, PAGE_H - 42 * mm, id="f")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[Frame(MARGIN, 30 * mm, PAGE_W - 2 * MARGIN,
                                           PAGE_H - 60 * mm, id="cf")], onPage=cover_page),
    PageTemplate(id="content", frames=[frame], onPage=content_page),
])

W = PAGE_W - 2 * MARGIN
story = []

# ============================================================ COVER
story.append(Spacer(1, 26 * mm))
logo_h = 34 * mm
story.append(RLImage(logo_path, width=logo_h * LOGO_W / LOGO_H, height=logo_h,
                     hAlign="CENTER"))
story.append(Spacer(1, 14 * mm))
story.append(Paragraph("Rooted", ParagraphStyle("cv", parent=S["title"], alignment=TA_CENTER)))
story.append(Spacer(1, 3 * mm))
story.append(Paragraph("Technical Documentation",
                       ParagraphStyle("cs", parent=S["subtitle"], alignment=TA_CENTER,
                                      fontSize=14, textColor=GREEN)))
story.append(Spacer(1, 2 * mm))
story.append(Paragraph(
    "A Bible study companion for iOS and Android &mdash; offline Scripture, "
    "a prayer journal, study and sermon notes, Scripture quizzes, and "
    "community study plans.",
    ParagraphStyle("cd", parent=S["subtitle"], alignment=TA_CENTER)))
story.append(Spacer(1, 16 * mm))

story.append(table([
    ["Version", "1.0.0 &nbsp;&middot;&nbsp; iOS build 10"],
    ["Bundle identifier", "com.rootedbible.app"],
    ["Platform", "Expo SDK 54 &nbsp;&middot;&nbsp; React Native 0.81"],
    ["Repository", "github.com/Sarbah12/ROOTED"],
    ["Apple team", "Accra Resource Center LBG (3FPZL5YV7Z)"],
    ["Generated", date.today().strftime("%d %B %Y")],
], [45 * mm, W - 45 * mm], head=False))

story.append(NextPageTemplate("content"))
story.append(PageBreak())

# ============================================================ CONTENTS
story.append(P("Contents", "h1"))
story.append(Spacer(1, 3 * mm))
toc = [
    "1.  Overview and status",
    "2.  Architecture",
    "3.  Bible",
    "4.  Notes, prayer and quiz",
    "5.  Community study plans",
    "6.  Moderation",
    "7.  Authentication",
    "8.  Data model",
    "9.  API reference",
    "10. Configuration",
    "11. iOS builds and release",
    "12. Design decisions",
    "13. Known gotchas",
    "14. Setup checklist",
]
for entry in toc:
    story.append(Paragraph(entry.replace("  ", "&nbsp;&nbsp;"), S["toc"]))

story.append(PageBreak())

# ============================================================ 1. OVERVIEW
story.append(P("1. Overview and status", "h1"))
story.append(P(
    "Rooted brings Bible reading, a prayer journal, study and sermon notes, Scripture "
    "quizzes and shared reading plans into one app. The complete King James Version "
    "ships inside the binary, so reading works with no network at all."))

story.append(P("By the numbers", "h2"))
story.append(table([
    ["Area", "Figure"],
    ["Bundled Scripture", "66 books &middot; 1,189 chapters &middot; 31,100 verses"],
    ["Translations available", "17 public domain, plus 3 licensed once configured"],
    ["Quiz bank", "75 questions across 16 books and 12 topics"],
    ["App screens", "17"],
    ["Data hooks", "10"],
    ["Database tables", "13"],
    ["Backend route groups", "17"],
    ["Commits", "25"],
], [55 * mm, W - 55 * mm]))

story.append(P("Maturity", "h2"))
story.append(P(
    "This section is deliberately blunt. A feature list that mixes <i>works</i> with "
    "<i>compiles</i> is how a project ends up surprised."))

story.append(P("Verified by running", "h3"))
story.append(table([
    ["What", "Evidence"],
    ["TypeScript", "<font face='Courier'>tsc --noEmit</font> passes with 0 errors"],
    ["iOS build and upload", "EAS build 10, signed, accepted by App Store Connect"],
    ["Bible reader", "John 3 rendered from the bundle in a running app"],
    ["Bundled text integrity", "Genesis, Psalms, Revelation, Malachi, 3 John, Obadiah checked"],
    ["Sign-in identifier detection", "Username, phone and email each classified correctly"],
    ["Sermon note fields", "Preacher fields appear only in sermon mode"],
    ["Translation picker", "8 language groups, NT-only versions badged"],
], [50 * mm, W - 50 * mm]))

story.append(Spacer(1, 3 * mm))
story.append(P("Built but never executed", "h3"))
story.append(P(
    "None of the following has run against a live system, because the backend has no "
    "database or Firebase credentials yet. Expect adjustments on first contact.", "small"))
story.append(table([
    ["Area", "Blocked by"],
    ["Password sign-in, sign-up, reset", "Firebase Email/Password provider not enabled"],
    ["Everything touching Postgres", "No database provisioned; schema never applied"],
    ["Transactional email", "No message sent; sender domain unverified"],
    ["Study plans, streaks, reflections", "Whole API surface untested"],
    ["Notes and prayer sync", "Offline half works; sync half has not reached a server"],
    ["Sign in with Apple", "Entitlement correct, flow never exercised"],
], [62 * mm, W - 62 * mm]))

story.append(Spacer(1, 4 * mm))
story.append(callout(
    "The honest summary",
    "The app works offline today: reading, quizzes, notes, prayers and settings all "
    "persist on device. Everything that crosses the network is written, typechecked "
    "and reviewed, but unproven.", GOLD))

story.append(PageBreak())

# ============================================================ 2. ARCHITECTURE
story.append(P("2. Architecture", "h1"))
story.append(P(
    "A React Native client with an offline-first data layer, talking to a small Node "
    "API over Postgres. Authentication is delegated to Firebase; the database stores "
    "only application data, keyed by the Firebase user id."))

story.append(P("Repository layout", "h2"))
story.append(table([
    ["Path", "Contents"],
    ["<font face='Courier'>app/</font>", "Screens, file-based routing via expo-router"],
    ["<font face='Courier'>app/(tabs)/</font>", "Home, Bible, Notes, Prayer, Quiz"],
    ["<font face='Courier'>app/plans/</font>", "Study plan browse, create, detail and day screens"],
    ["<font face='Courier'>constants/</font>", "Theme, Bible metadata, quiz bank, identity mapping"],
    ["<font face='Courier'>assets/bible/kjv/</font>", "Bundled Scripture, one JSON file per book"],
    ["<font face='Courier'>hooks/</font>", "Data access: notes, prayers, plans, chapters, quiz"],
    ["<font face='Courier'>context/</font>", "Auth and settings providers"],
    ["<font face='Courier'>backend/</font>", "Node API, with its own package.json"],
    ["<font face='Courier'>scripts/build-bible.mjs</font>", "Regenerates the offline Bible bundle"],
    ["<font face='Courier'>Rooted/</font>", "Legacy snapshot. Ignore; excluded from tsconfig"],
], [46 * mm, W - 46 * mm]))

story.append(P("Offline-first data layer", "h2"))
story.append(P(
    "Notes and prayers share one implementation, <font face='Courier'>hooks/"
    "use-synced-collection.ts</font>. The device is the source of truth: every edit "
    "writes to AsyncStorage immediately and the interface never waits on a request. "
    "When the user is signed in and the backend is reachable, pending work is pushed "
    "and remote records pulled."))
story.append(P(
    "Records carry a pending flag of create, update or delete. Local edits win over "
    "server state, and deletions are held as tombstones until the server confirms. "
    "A journal entry must not vanish because a request failed."))

story.append(P("Backend has its own dependency tree", "h2"))
story.append(P(
    "<font face='Courier'>backend/package.json</font> is separate by necessity. The app "
    "keeps <font face='Courier'>firebase-admin</font> in devDependencies, so a production "
    "install of the backend from the app manifest would silently omit it."))

story.append(PageBreak())

# ============================================================ 3. BIBLE
story.append(P("3. Bible", "h1"))
story.append(P(
    "The complete King James Version ships with the app: 66 books, 1,189 chapters, "
    "31,100 verses, under <font face='Courier'>assets/bible/kjv/</font>. Reading needs "
    "no network."))
story.append(P(
    "Generated files &mdash; <font face='Courier'>constants/bible-books.ts</font> and "
    "<font face='Courier'>constants/bible-offline.ts</font> &mdash; must not be edited by "
    "hand. Regenerate with:"))
story.append(P("npm run build:bible", "code"))
story.append(P(
    "The loader map is lazy, so opening one book does not parse all 66.", "small"))

story.append(P("Translations", "h2"))
story.append(table([
    ["Group", "Versions"],
    ["Bundled", "KJV"],
    ["English, full Bible", "WEB, WEBBE, ASV, Douay-Rheims 1899, Darby, BBE"],
    ["English, New Testament only", "Young's Literal, Open English Bible (US and Commonwealth)"],
    ["Other languages, full", "Latin Vulgate, Portuguese (Almeida), Romanian, Czech"],
    ["Other languages, NT only", "Russian Synodal, Chinese Union, Cherokee"],
    ["Licensed, pending a key", "NKJV, NLT, AMP"],
], [46 * mm, W - 46 * mm]))

story.append(Spacer(1, 3 * mm))
story.append(callout(
    "Coverage is verified, not assumed",
    "Each translation was checked by requesting Genesis 1. Six carry only the New "
    "Testament. They are badged accordingly, and requesting an Old Testament book "
    "falls back to the bundled KJV with an explanation rather than failing with a "
    "bare 'not found'. Note that Young's Literal shipped unlabelled before this "
    "check.", GOLD))

story.append(Spacer(1, 3 * mm))
story.append(P("Licensing", "h2"))
story.append(P(
    "Every bundled and freely fetched translation is public domain, so none needs a "
    "licence. This was a deliberate correction: the app originally shipped NIV-worded "
    "sample text, which is copyrighted by Biblica and would have required an agreement "
    "for App Store distribution."))
story.append(P(
    "NKJV, NLT and AMP are copyrighted and are licensed through API.Bible. The "
    "integration is built and inert until a key exists. The API key is a licensing "
    "credential and is proxied by the backend &mdash; embedded in the app bundle, anyone "
    "could extract it, and misuse bills to the account."))
story.append(table([
    ["Plan", "Cost", "Terms"],
    ["Starter", "Free", "Three copyrighted Bibles, 5,000 calls/month, strictly non-commercial"],
    ["Pro", "$29+/month", "Copyrighted Bibles, 150,000 calls/month"],
], [26 * mm, 26 * mm, W - 52 * mm]))
story.append(P(
    "Ads, fees or upsells disqualify the free tier. NIV commercial use is not offered "
    "at any price.", "small"))

story.append(PageBreak())

# ============================================================ 4. NOTES ETC
story.append(P("4. Notes, prayer and quiz", "h1"))

story.append(P("Notes and sermon notes", "h2"))
story.append(P(
    "A note is either a study note or a sermon. Selecting Sermon reveals preacher, "
    "church or event, series and the date preached; a plain study note stays plain. "
    "The list filters by All, Study or Sermons, and search reaches the preacher, "
    "church and series as well as the title and body &mdash; so a preacher's name finds "
    "every sermon of theirs."))

story.append(P("Prayer journal", "h2"))
story.append(P(
    "Requests are tracked by category with a status of unanswered, ongoing or "
    "answered, and can be tied to Scripture. Same offline-first machinery as notes."))

story.append(P("Quiz", "h2"))
story.append(P(
    "Questions carry both a book and one or more topics, so a single bank of 75 "
    "questions feeds two browsing modes: study John then quiz on John, or study the "
    "parables across the gospels then quiz on Parables. Questions shuffle per attempt; "
    "best score and attempts are stored per subject."))
story.append(table([
    ["Mode", "Subjects"],
    ["By book", "16 books with enough questions to be worthwhile"],
    ["By topic", "Creation, Faith, Prayer, Parables, Miracles, The Cross, The Law, "
                 "Wisdom, Prophecy, The Early Church, Salvation, Spiritual Warfare"],
], [30 * mm, W - 30 * mm]))

story.append(P("Real data only", "h2"))
story.append(P(
    "No screen shows a fabricated figure. Counts come from the user's own records, "
    "plan progress is days completed over plan length as reported by the server, and "
    "streaks are computed from actual completion dates."))
story.append(callout(
    "Zero, never a placeholder",
    "When data cannot be loaded, screens show zero or an empty state. Cached values "
    "are kept on failure because they were real once; a guess is never substituted. "
    "Earlier revisions hardcoded reading plans at 23%, 58% and 12% complete and "
    "pre-highlighted John 3:16 as though the reader had marked it.", CLAY))

story.append(PageBreak())

# ============================================================ 5. PLANS
story.append(P("5. Community study plans", "h1"))
story.append(P(
    "A user authors a plan with a passage for each day, then shares it. Members mark "
    "days complete, see one another's progress, and write what they learnt that day."))

story.append(P("Visibility", "h2"))
story.append(table([
    ["Setting", "Who can reach it"],
    ["Private", "The owner only"],
    ["Link", "Anyone holding the six-character join code"],
    ["Public", "Listed in the directory for anyone to find"],
], [30 * mm, W - 30 * mm]))
story.append(P(
    "Enforced in one place, <font face='Courier'>getPlan()</font>, rather than repeated "
    "at each route.", "small"))

story.append(P("Progress and streaks", "h2"))
story.append(P(
    "<b>Consecutive days.</b> A member's position is the furthest <i>unbroken</i> run of "
    "days finished. Someone who jumps to day 20 without doing 2 to 19 still shows as "
    "day 1; otherwise the member list would mislead."))
story.append(P(
    "<b>Calendar days.</b> A streak counts distinct dates across every plan and survives "
    "if the reader was there today or yesterday. Three plans in one day is one day of "
    "streak, and a late-night reading does not break it."))

story.append(P("Screens", "h2"))
story.append(table([
    ["Screen", "Purpose"],
    ["Browse", "My plans and a public directory, plus join by code"],
    ["Create", "Title, visibility, and a day-by-day passage list"],
    ["Plan detail", "Progress, day checklist, invite code, member positions"],
    ["Day", "The passage from the bundled KJV, the prompt, the reflection feed"],
], [30 * mm, W - 30 * mm]))
story.append(P(
    "Creating a plan offers auto-fill, which walks consecutive chapters from the first "
    "entry and stops at the real end of the book rather than inventing chapters that do "
    "not exist. Ticking a day updates immediately and rolls back if the request fails, "
    "so the interface never claims something saved when it did not.", "small"))

story.append(PageBreak())

# ============================================================ 6. MODERATION
story.append(P("6. Moderation", "h1"))
story.append(P(
    "Reflections are visible to everyone on a plan, which makes Rooted a "
    "user-generated-content app. App Store Review Guideline 1.2 requires such apps to "
    "provide a way to report objectionable content and to block abusive users. Apps "
    "are rejected without it, so this is not optional."))

story.append(table([
    ["Control", "Behaviour"],
    ["Report", "Offensive, spam or off-topic, from a menu on every reflection"],
    ["Auto-hide", "A reflection hides once three distinct people report it"],
    ["Block", "The blocked user disappears from every feed, member list and the directory"],
    ["Delete", "Authors can remove their own reflections"],
], [30 * mm, W - 30 * mm]))

story.append(Spacer(1, 3 * mm))
story.append(P(
    "Auto-hiding at three independent reports means obvious abuse disappears before a "
    "human reviews it, while a single disgruntled reader cannot silence anyone."))

story.append(Spacer(1, 2 * mm))
story.append(callout(
    "Still required before review",
    "A published privacy policy URL and a support contact are also conditions of "
    "approval for a UGC app. Neither exists yet.", CLAY))

# ============================================================ 7. AUTH
story.append(P("7. Authentication", "h1"))
story.append(P(
    "Sign-in accepts an email, a username or a phone number, each with a password, or "
    "Sign in with Apple."))
story.append(P(
    "Firebase provides no phone-and-password or username-and-password provider, so "
    "<font face='Courier'>constants/identity.ts</font> maps the latter two onto synthetic "
    "addresses on domains we own:"))
story.append(P(
    "ada@example.com    &rarr;  ada@example.com                        (used as-is)<br/>"
    "adalovelace       &rarr;  adalovelace@users.rootedbible.app<br/>"
    "+233 20 123 4567  &rarr;  233201234567@phone.rootedbible.app", "code"))
story.append(P(
    "A useful consequence: Firebase already enforces one account per email address, so "
    "usernames and phone numbers inherit that uniqueness with no separate collision "
    "check."))

story.append(P("Deliberate choices", "h2"))
story.append(table([
    ["Choice", "Reason"],
    ["One vague failure message",
     "A specific error would reveal whether an account exists. The reset screen "
     "reports success even for unknown addresses for the same reason."],
    ["Recovery email at sign-up",
     "Requested when the identifier is a username or phone, since neither is a real "
     "inbox and a forgotten password would otherwise be unrecoverable."],
    ["Branded reset email",
     "The backend asks Firebase Admin for the reset link and delivers it through "
     "Resend, rather than sending Firebase's own template from a firebaseapp.com "
     "sender."],
], [42 * mm, W - 42 * mm]))

story.append(Spacer(1, 3 * mm))
story.append(callout(
    "Console step required",
    "Firebase &rarr; Authentication &rarr; Sign-in method &rarr; enable Email/Password. "
    "Until then every sign-up fails with auth/operation-not-allowed.", CLAY))

story.append(PageBreak())

# ============================================================ 8. DATA MODEL
story.append(P("8. Data model", "h1"))
story.append(P(
    "Postgres, hosted on Supabase. <font face='Courier'>backend/schema.sql</font> is "
    "idempotent and doubles as the migration."))
story.append(P("cd backend &amp;&amp; npm install &amp;&amp; npm run migrate", "code"))

story.append(table([
    ["Table", "Holds"],
    ["users", "Profile keyed by Firebase uid, plus username and recovery email"],
    ["user_settings", "Theme, reminders, reminder time, font size"],
    ["notes", "Study and sermon notes, with preacher, church, series, date"],
    ["prayers", "Requests with category, status and verse"],
    ["reading_progress", "Position within a reading plan"],
    ["quiz_results", "Best score and attempts per subject"],
    ["study_plans", "Authored plans with visibility and join code"],
    ["study_plan_days", "The passage and prompt for each day"],
    ["plan_members", "Membership and furthest consecutive day"],
    ["plan_completions", "One row per day finished, dated for streaks"],
    ["plan_reflections", "What a member learnt on a given day"],
    ["content_reports", "Moderation reports"],
    ["user_blocks", "Who has blocked whom"],
], [38 * mm, W - 38 * mm]))

story.append(Spacer(1, 3 * mm))
story.append(callout(
    "Per-user isolation was a fix, not a given",
    "The original store kept one global notes and prayers array in a single JSON file, "
    "so every signed-in account read and wrote the same rows. Every query now filters "
    "on the Firebase uid.", CLAY))

story.append(Spacer(1, 3 * mm))
story.append(P("Row Level Security", "h2"))
story.append(P(
    "RLS is enabled on every table with no permissive policies. The backend connects as "
    "the postgres role and enforces access itself, so RLS is not what gates these "
    "tables &mdash; but anything reaching the database through Supabase's public anon key "
    "reads nothing."))

story.append(PageBreak())

# ============================================================ 9. API
story.append(P("9. API reference", "h1"))
story.append(P(
    "All routes except health require a Firebase ID token in "
    "<font face='Courier'>Authorization: Bearer &lt;token&gt;</font>."))

story.append(P("Authentication and profile", "h2"))
story.append(table([
    ["Method", "Path", "Notes"],
    ["POST", "/v1/auth/login", "Firebase idToken, returns the profile"],
    ["POST", "/v1/auth/logout", "Revokes refresh tokens"],
    ["POST", "/v1/auth/password-reset", "Always answers 200 &mdash; see below"],
    ["POST", "/v1/auth/welcome", "Welcome email"],
    ["GET", "/v1/me", "Profile and settings"],
    ["GET PUT PATCH", "/v1/me/settings", ""],
    ["GET", "/v1/me/streak", "Current and longest"],
], [24 * mm, 46 * mm, W - 70 * mm]))

story.append(P("Content", "h2"))
story.append(table([
    ["Method", "Path", "Notes"],
    ["GET POST", "/v1/notes", ""],
    ["PATCH DELETE", "/v1/notes/:id", ""],
    ["GET POST", "/v1/prayers", ""],
    ["PATCH DELETE", "/v1/prayers/:id", ""],
    ["GET POST", "/v1/quiz/results", ""],
    ["GET PATCH", "/v1/reading-plans", ""],
    ["GET", "/v1/bible/versions", "Licensed versions this key allows"],
    ["GET", "/v1/bible/:bibleId/:book/:chapter", "Proxied licensed text"],
], [24 * mm, 52 * mm, W - 76 * mm]))

story.append(P("Study plans and moderation", "h2"))
story.append(table([
    ["Method", "Path", "Notes"],
    ["GET POST", "/v1/plans", "?scope=mine|public, ?code=ABC123"],
    ["GET DELETE", "/v1/plans/:id", "Delete archives"],
    ["POST", "/v1/plans/:id/join &middot; /leave", ""],
    ["GET", "/v1/plans/:id/members", "Every member's position"],
    ["POST DELETE", "/v1/plans/:id/days/:day/complete", ""],
    ["GET POST", "/v1/plans/:id/days/:day/reflections", ""],
    ["PATCH DELETE", "/v1/reflections/:id", ""],
    ["POST", "/v1/reports", "Report content"],
    ["GET POST", "/v1/blocks", "List or add"],
    ["DELETE", "/v1/blocks/:userId", "Unblock"],
    ["GET", "/v1/health", "Reports database reachability"],
], [24 * mm, 56 * mm, W - 80 * mm]))

story.append(Spacer(1, 3 * mm))
story.append(callout(
    "Why password reset always returns 200",
    "Answering differently for a registered address would turn the endpoint into an "
    "account-existence oracle. The app treats any response other than 503 as success "
    "for the same reason.", GOLD))

story.append(PageBreak())

# ============================================================ 10. CONFIG
story.append(P("10. Configuration", "h1"))
story.append(P(
    "Copy <font face='Courier'>.env.example</font> to <font face='Courier'>.env</font>. "
    "Secrets never enter the repository; <font face='Courier'>.gitignore</font> covers "
    "<font face='Courier'>.env</font>, <font face='Courier'>*.p8</font>, "
    "<font face='Courier'>*.p12</font>, <font face='Courier'>*.mobileprovision</font> and "
    "<font face='Courier'>credentials.json</font>."))

story.append(table([
    ["Variable", "Purpose", "Required"],
    ["DATABASE_URL", "Supabase connection string", "Yes"],
    ["FIREBASE_PROJECT_ID", "Token verification", "Yes"],
    ["FIREBASE_CLIENT_EMAIL", "From the service account JSON", "Yes"],
    ["FIREBASE_PRIVATE_KEY", "From the service account JSON", "Yes"],
    ["EXPO_PUBLIC_BACKEND_API_BASE_URL", "Where the app looks for the API", "Yes"],
    ["RESEND_API_KEY", "Transactional email", "For email"],
    ["RESEND_FROM", "Verified sender address", "For email"],
    ["API_BIBLE_KEY", "Licensed translations", "Optional"],
    ["CORS_ORIGINS", "Comma-separated allowlist", "Optional"],
], [56 * mm, W - 82 * mm, 26 * mm]))

story.append(Spacer(1, 3 * mm))
story.append(callout(
    "Without the Firebase values, every authenticated endpoint returns 503",
    "Confirmed by calling /v1/me directly: 'Firebase config is missing'. This is the "
    "single largest blocker to anything server-side functioning.", CLAY))

story.append(Spacer(1, 3 * mm))
story.append(P("Deployment", "h2"))
story.append(P(
    "<font face='Courier'>backend/render.yaml</font> is a Render blueprint; every secret "
    "is marked <font face='Courier'>sync: false</font> and must be set in the dashboard. "
    "iOS blocks plaintext HTTP, so a device build needs an HTTPS backend URL in the "
    "production profile of <font face='Courier'>eas.json</font>."))

story.append(PageBreak())

# ============================================================ 11. IOS
story.append(P("11. iOS builds and release", "h1"))
story.append(P("npx eas build --platform ios --profile production<br/>"
               "npx eas submit --platform ios --latest", "code"))

story.append(table([
    ["Profile", "Target", "Credentials"],
    ["development", "Dev client, simulator", "Required"],
    ["preview", "Simulator, unsigned", "None needed"],
    ["preview:device", "Real device", "Required"],
    ["production", "App Store and TestFlight", "Required"],
], [32 * mm, W - 74 * mm, 32 * mm]))

story.append(Spacer(1, 3 * mm))
story.append(P("Identifiers", "h2"))
story.append(table([
    ["Bundle identifier", "com.rootedbible.app"],
    ["Apple team", "Accra Resource Center LBG (3FPZL5YV7Z)"],
    ["App Store ID", "6798345216"],
    ["EAS project owner", "accra-resource-center"],
], [42 * mm, W - 42 * mm], head=False))
story.append(P(
    "com.rooted.app was already taken in Apple's global namespace, hence the change.",
    "small"))

story.append(P("Version numbering", "h2"))
story.append(P(
    "<font face='Courier'>appVersionSource</font> is remote, so EAS owns the build "
    "number and auto-increments it. Do not set <font face='Courier'>ios.buildNumber</font> "
    "in <font face='Courier'>app.json</font>; it is ignored and EAS warns about it."))

story.append(P("Credential creation cannot be automated", "h2"))
story.append(P(
    "EAS refuses to generate a distribution certificate in non-interactive mode, by "
    "design. The first build must be run by a person answering the prompts. Once "
    "certificates exist, or a local <font face='Courier'>credentials.json</font> points "
    "at them, later builds run unattended."))

story.append(P("App Store readiness", "h2"))
story.append(table([
    ["Requirement", "State"],
    ["Bundle ID registered", "Done"],
    ["Sign in with Apple capability", "Done"],
    ["Encryption declaration", "Done &mdash; ITSAppUsesNonExemptEncryption false"],
    ["App icon and splash", "Done, generated from the Rooted mark"],
    ["Report and block controls", "Done"],
    ["Category", "Not set &mdash; Reference and Education suggested"],
    ["Content rights", "Not set &mdash; answer 'no third-party content'"],
    ["Age rating", "Not set &mdash; answering none throughout gives 4+"],
    ["Privacy policy URL", "Not written &mdash; required"],
    ["macOS platform entry", "Should be removed; this is an iOS app"],
], [58 * mm, W - 58 * mm]))

story.append(PageBreak())

# ============================================================ 12. DECISIONS
story.append(P("12. Design decisions", "h1"))
story.append(P("The reasoning behind choices that are not obvious from the code.", "small"))
story.append(Spacer(1, 2 * mm))

decisions = [
    ("Public-domain translations only",
     "The original sample text was NIV-worded, which is copyrighted by Biblica. Every "
     "translation shipped or fetched is now public domain, so no licence is needed and "
     "App Store distribution carries no rights exposure."),
    ("Identifiers map onto synthetic emails",
     "Firebase offers no phone-and-password or username-and-password provider. Mapping "
     "both onto addresses at domains we own gets uniqueness enforcement for free."),
    ("Consecutive-day progress",
     "Counting the furthest unbroken run, rather than total days done, stops someone "
     "who skips ahead from appearing further along than they are."),
    ("Zero, never a placeholder",
     "Any figure that cannot be loaded renders as zero or an empty state. Cached values "
     "are kept on failure because they were real once; a guess is never substituted."),
    ("Licensed Bible keys stay server-side",
     "An API key in the app bundle can be extracted by anyone who unzips the archive, "
     "and misuse is billed to the account. Public-domain text still goes straight from "
     "the device, since there is nothing there to protect."),
    ("Moderation built alongside the feature",
     "Shared reflections make this a UGC app under Guideline 1.2. Reporting and blocking "
     "were built with the feed rather than retrofitted after a rejection."),
    ("reCAPTCHA vendored, then deleted",
     "expo-firebase-recaptcha was unmaintained and pulled in expo-firebase-core, which "
     "uses pre-SDK-44 autolinking that no longer works. It was vendored to remove the "
     "native dependency, then deleted entirely when phone OTP gave way to passwords."),
]
for title, body in decisions:
    story.append(KeepTogether([P(title, "h3"), P(body)]))

story.append(PageBreak())

# ============================================================ 13. GOTCHAS
story.append(P("13. Known gotchas", "h1"))

story.append(P("Keep the project out of iCloud", "h2"))
story.append(P(
    "This one cost hours. <font face='Courier'>~/Desktop</font> and "
    "<font face='Courier'>~/Documents</font> are iCloud-synced, and syncing a "
    "node_modules tree makes ordinary operations unusable. Measured on the same machine "
    "on the same day:"))
story.append(table([
    ["Operation", "In ~/Desktop (iCloud)", "In ~/Developer"],
    ["git clone", "10 min, timed out", "4 seconds"],
    ["npm install", "26 minutes", "21 seconds"],
    ["git status", "6+ min, timed out", "1 second"],
    ["tsc --noEmit", "killed six times", "3 seconds"],
    ["eas build", "hung twice, never uploaded", "succeeded"],
], [44 * mm, (W - 44 * mm) / 2, (W - 44 * mm) / 2]))
story.append(P(
    "The project now lives in <font face='Courier'>~/Developer/Rooted</font>.", "small"))

story.append(P("tsconfig excludes the legacy snapshot", "h2"))
story.append(P(
    "<font face='Courier'>Rooted/</font> is a second, older React Native app with its own "
    "node_modules. Without the exclusion every typecheck pulls it in and reports around "
    "seventy irrelevant errors."))

story.append(P("Storage keys are versioned", "h2"))
story.append(P(
    "Note records changed shape when sermon fields were added, so the AsyncStorage key "
    "moved from <font face='Courier'>rooted:notes:v1</font> to "
    "<font face='Courier'>:v2</font>. Bump the suffix whenever a stored shape changes."))

story.append(P("Credential hygiene", "h2"))
story.append(P(
    "Two live credentials &mdash; an App Store Connect key and a Resend API key &mdash; "
    "were pasted into a chat transcript during development and should be rotated. "
    "Neither is in the repository; the exposure was the transcript. Local signing "
    "material lives in <font face='Courier'>~/Developer/rooted-credentials/</font> with "
    "0700 permissions, outside the project directory."))

story.append(PageBreak())

# ============================================================ 14. CHECKLIST
story.append(P("14. Setup checklist", "h1"))
story.append(P(
    "In order. The first three block everything server-side; nothing that crosses the "
    "network functions until they are done."))
story.append(Spacer(1, 3 * mm))

story.append(table([
    ["#", "Step", "Where"],
    ["1", "Enable the Email/Password sign-in provider",
     "Firebase &rarr; Authentication &rarr; Sign-in method"],
    ["2", "Download the service account JSON, set the three FIREBASE_ variables",
     "Firebase &rarr; Project settings &rarr; Service accounts"],
    ["3", "Copy the connection string into DATABASE_URL, then run the migration",
     "Supabase &rarr; Connect &rarr; Direct connection"],
    ["4", "Verify a sending domain, or use the sandbox sender",
     "Resend &rarr; Domains"],
    ["5", "Deploy the backend and set the production URL in eas.json",
     "Render, or any HTTPS host"],
    ["6", "Set Category, Content Rights and Age Rating",
     "App Store Connect &rarr; App Information"],
    ["7", "Publish a privacy policy and add its URL",
     "Required for a UGC app"],
    ["8", "Rotate the two exposed credentials",
     "App Store Connect and Resend"],
    ["9", "Optionally add an API.Bible key for NKJV, NLT and AMP",
     "scripture.api.bible"],
], [10 * mm, (W - 10 * mm) * 0.52, (W - 10 * mm) * 0.48]))

story.append(Spacer(1, 6 * mm))
story.append(callout(
    "One command once configured",
    "cd backend &amp;&amp; npm install &amp;&amp; npm run migrate &mdash; the schema is "
    "idempotent, so it is safe to re-run after every change to schema.sql.", GOLD))

story.append(Spacer(1, 10 * mm))
story.append(Paragraph(
    "<i>Rooted &mdash; growing deep in the Word.</i>",
    ParagraphStyle("end", parent=S["small"], alignment=TA_CENTER, fontSize=10,
                   textColor=GREEN)))

doc.build(story)
print("wrote", OUT, os.path.getsize(OUT), "bytes")
