# First post — introduction carousel

Slides: `out/rooted-carousel-1.png` … `-8.png`, in order. 1080×1350 (4:5).

Arc: hello → where the name comes from → the problem → what we made → how it
is meant to be used → what we promise → come with us.

Style: bold colour-blocked slides alternating with light ones, heavy headlines
with the key word highlighted in gold, and the product carried in device frames
rather than photography. The app screens are drawn from the real palette and
real content — the verse on the phone is one the rotation actually serves, and
the highlighted John 3:16 is how marking a verse actually looks.

**If you want photography in it** (the reference style leans on it), the natural
slots are slide 3 and slide 6, behind the headline with a dark overlay. I cannot
produce photographs, so those slides carry product UI instead.

---

## Caption

> The first line is what shows before "more", so it carries the hook rather
> than the introduction.

Most Bible plans die in February.

Not for lack of wanting. You start in January, miss four days in a row, open
the app to a wall of red, and quietly stop. We have all done it.

Hello — we’re Rooted. This is the first thing we have ever posted, so it seems
right to start with why we are building this.

We wanted a Bible app you can actually keep up with:

📖 The whole Bible, offline and free to read, with no account needed
🌱 A different verse every morning that will not repeat for five and a half years
👥 Plans you follow alongside other people, so missing a Tuesday does not end the whole thing
✍️ Somewhere for Sunday’s sermon notes and your prayer list to live

The name comes from Colossians 2:7 — “Rooted and built up in him.” Roots do
their work out of sight, slowly, long before anything shows above ground. That
felt like the right picture for time spent in Scripture.

It is in testing on iOS now. Follow along and watch it grow.

Which book would you want a plan for first? 👇

---

## Shorter alternative

Most Bible plans die in February. We are building the one you can keep up with.

Hello — we’re Rooted. The whole Bible offline and free to read, a new verse
each morning that will not repeat for five and a half years, and plans you
follow with other people so a missed Tuesday does not end the whole thing.

Named for Colossians 2:7 — “Rooted and built up in him.”

In testing on iOS. Follow along 🌱

---

## Hashtags

Put these in the first comment rather than the caption, so the copy stays clean.

#BibleStudy #BibleApp #DailyVerse #VerseOfTheDay #Scripture #QuietTime
#BibleReadingPlan #Devotional #ChristianApp #FaithTech #Colossians27
#BibleInAYear #ChristianCreatives

---

## Before posting

- **Slide 8 says "Coming to iOS."** True today — Rooted is on TestFlight, not
  the App Store. Swap it for a real link once it ships, then re-run the build.
- **The numbers are real.** 66 books and 31,102 verses bundled, 2,011 in the
  verse pool, 5.5 years before a repeat. Do not round them up in the comments.
- **Nothing here is a real person's data.** The names on the plans slide (Ama,
  Kwesi, Nana) and the join code are invented for the post.
- The promises on slide 7 all describe how the app behaves today. If one stops
  being true, pull the slide rather than quietly reword it — a first post is
  the worst place to make a promise you have to walk back.
- The closing question is there to give the algorithm comments to work with.
  Answer every one in the first hour if you can.

---

## Rebuilding

```bash
node marketing/instagram/build-carousel.mjs
```

Edit the `slides` array to change copy; every slide re-renders.
