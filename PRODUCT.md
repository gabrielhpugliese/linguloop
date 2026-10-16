# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Language learners studying German, English, Spanish or Brazilian Portuguese who want real video input matched to their level and goal, without searching YouTube themselves.

Open decision: the primary user and their situation (self-study adult, course or exam student, teacher) are not yet established. Design for a learner who arrives, picks language, level and goal, and watches, without assuming one audience over another.

## Product Purpose

LinguLoop picks a YouTube video for the learner's language, CEFR level (A1–C2 or "All levels") and goal, and plays it on the page. Pressing "Next video" picks another one; videos already watched are skipped. It replaces the search, scrolling and deciding with a single choice of what to work on.

Success right now means:
- **Repeat sessions:** learners come back and press "Next video" many times per visit.
- **Feedback and growth:** learners write in, and their feedback decides which languages and goals come next.

## Positioning

The learner states their objective first (Grammar, Listening, Vocabulary, Pronunciation & speaking, Exam prep, or "Just watch something"), then gets one video at a time instead of a results list. Free, no account, and personal data stays in the browser.

## Operating Context

- A short loop: choose language → level → goal (plus optional single-choice refinements such as grammar topic, listening type and speed, vocabulary theme, exam) → "Next video" → watch → optionally take notes → next.
- Selections are remembered across visits (localStorage).
- Notes and watch history live in a Library (side panel on desktop, bottom sheet on phones).
- Under each video, a context line shows how it was found, e.g. `🇩🇪 B1 · Grammar · Dative case`.
- Supporting pages: About, Privacy Policy, Contact.

## Capabilities and Constraints

- Next.js (App Router) with **Material UI**, which stays the component library.
- **The interface stays in English**, whatever language is being learned. Labels add the target-language term in brackets where learners meet it in textbooks, e.g. "Dative case (Dativ)".
- Videos are public YouTube videos played in YouTube's own embedded player. LinguLoop does not host, copy or edit them, and matches are automatic, so a video's level fit is not guaranteed.
- No accounts and no sign-up. Notes, history and settings are stored only in the visitor's browser.
- Free and ad-supported through Google AdSense (top and sidebar slots, inactive until configured). Ads must not be mistaken for content.
- Filter catalog (languages, levels, goals, topics, exams) is defined in `src/lib/catalog.ts`. The goal-based filter design is specified in `docs/superpowers/specs/2026-10-14-goal-based-filters-design.md`.

## Brand Commitments

- Name: **LinguLoop**. Tagline: "Learn languages with videos picked for your level".
- Voice: plain, short, friendly and honest about limits ("If one is off, just press the button again"). No hype.
- Presented as an independent project run by one person. No personal name on the site.
- Contact: hello@linguloop.com.

## Evidence on Hand

- Real copy: About, Privacy and Contact pages under `src/app/(info)/`.
- Link-preview image: `src/app/opengraph-image.png` / `twitter-image.png`.
- No testimonials, user counts, reviews, press or partnerships exist. Do not invent them, and do not claim videos are hand-curated or level-verified.

## Product Principles

1. **One choice, then watch.** Every step should shorten the path from arriving to a playing video.
2. **Objective first.** The learner says what they want to work on; the product never makes them sort through results.
3. **Private by default.** No accounts; the learner's notes and history stay theirs, in their browser.
4. **Honest about automation.** Videos are found automatically; say so and make "next" cheap rather than overpromising.
5. **Listen and grow.** Feedback is easy to give and shapes which languages and goals come next.
