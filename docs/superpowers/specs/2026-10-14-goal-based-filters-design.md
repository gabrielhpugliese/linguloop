# Goal-based filters — design

Status: approved by the user (2026-10-14).

## Why

The old filters mixed two intents. Grammar topics describe *lessons*, while most formats describe *native content*, so combining them ("B1 Konjunktiv II street interview") returned poor or random results. Formats also mixed genre (vlog), length (Shorts), purpose (exam prep) and technique (shadowing). Multi-select options were joined into one long YouTube query that matched little. C1 and C2 lists were identical, German C1 contained "Phrasal Verbs", and topic naming was inconsistent across languages.

New principle: **the learner states their objective first**. Learners who know their weak spot pick it directly. Learners who don't pick "Just watch something".

## Filter panel (top to bottom)

1. **Language**: dropdown with flags, as today. German 🇩🇪, English 🇬🇧, Spanish 🇪🇸, Portuguese 🇧🇷 (Brazilian Portuguese).
2. **Level**: A1, A2, B1, B2, C1, C2 + "All levels" (renamed from "Any"). Each level has a hover tooltip with a one-line CEFR can-do description, e.g. "B1: you can follow clear speech on familiar topics".
3. **"What do you want to work on?"**: six goal tiles (icon + label), exactly one selected:
   - 🧩 Grammar
   - 🎧 Listening
   - 📚 Vocabulary
   - 🗣️ Pronunciation & speaking
   - 📝 Exam prep
   - 🎲 Just watch something (**default**)
4. **Goal options**: every option is optional and **single-choice**:
   - Grammar: topic chips for the selected level. With "All levels", chips are grouped under level headings.
   - Listening: content type, plus speed (**Learner-friendly** default / **Native speed**), plus a "Short videos only" switch.
   - Vocabulary: theme.
   - Pronunciation & speaking: Lessons / Shadowing practice.
   - Exam prep: the exams for the selected language.
   - Just watch something: no options.
5. **"Next video"** button.

### Behavior
- Language, level, goal and options are remembered across visits (localStorage, try/catch, read in an effect).
- Switching goal clears that goal's options but keeps language and level.
- Switching language clears language-specific options (grammar topic, exam). Level and goal stay.
- Changing level clears the grammar topic if it doesn't exist at the new level.
- Under the video, a context line shows how it was found, e.g. `🇩🇪 B1 · Grammar · Dative case`. With no option: `🇩🇪 B1 · Listening`. With all levels: `🇩🇪 All levels · Vocabulary · Food & cooking`.

## Content

### Naming
UI labels are in English, followed by the target-language term in brackets where learners meet it in textbooks, e.g. "Dative case (Dativ)". English topics are English only. Every item also has a hidden **search phrase** (usually in the target language) used to build the YouTube query.

### Shared across languages
- **Listening content types:** Vlogs · Podcasts · Street interviews · News · Music · Cartoons & stories · Movies & TV
- **Vocabulary themes:** Greetings & introductions · Food & cooking · Travel & directions · Work & jobs · Home & family · Health & body · Shopping & money · Feelings & opinions · Weather & nature · Hobbies & free time · Idioms & slang
- **Pronunciation:** Lessons · Shadowing practice

### Exams
- German: Goethe-Zertifikat · telc · TestDaF · DSH · ÖSD
- English: IELTS · TOEFL · Cambridge (B2 First, C1 Advanced) · PTE · Duolingo English Test
- Spanish: DELE · SIELE
- Portuguese: Celpe-Bras

### Grammar topics

**German**
- A1: Articles & gender (der/die/das) · Personal pronouns · Present tense (Präsens) · sein & haben · Verb-second word order · Questions (W-Fragen) · Negation (nicht/kein) · Accusative case (Akkusativ) · Modal verbs (Modalverben) · Separable verbs (trennbare Verben) · Imperative (Imperativ)
- A2: Perfect tense (Perfekt) · Dative case (Dativ) · Two-way prepositions (Wechselpräpositionen) · Reflexive verbs · Subordinate clauses (weil, dass, wenn) · Comparatives & superlatives · Adjective endings (Adjektivdeklination) · Past of sein/haben/modals (Präteritum)
- B1: Passive voice (Passiv) · Subjunctive II (Konjunktiv II) · Relative clauses (Relativsätze) · Infinitive with zu · Simple past (Präteritum) · Past perfect (Plusquamperfekt) · Genitive case (Genitiv) · Verbs with prepositions (da-/wo-Wörter) · Two-part connectors (entweder…oder) · n-declension (n-Deklination)
- B2: Subjunctive I & reported speech (Konjunktiv I) · Passive alternatives (sich lassen, sein + zu) · Participles as adjectives (Partizip I & II) · Noun-verb phrases (Nomen-Verb-Verbindungen) · Genitive prepositions (wegen, trotz) · Future II (Futur II) · Modal particles (doch, ja, mal)
- C1: Extended participle phrases (erweiterte Partizipialattribute) · Nominal style (Nominalstil) · Subjective modal verbs (soll/will as hearsay) · Advanced passive (Zustandspassiv) · Complex connectors
- C2: Emphasis & word order (Vorfeld) · Formal & academic register · Literary forms (Konjunktiv in literature) · Colloquial grammar (Umgangssprache)

**English**
- A1: To be · Present simple · Pronouns & possessives · Articles (a/an/the) · Plurals · There is / there are · Can / can't · Question words
- A2: Past simple · Present continuous · Future (will / going to) · Comparatives & superlatives · Countable & uncountable · Adverbs of frequency · Should / must / have to
- B1: Present perfect · Present perfect vs past simple · First & second conditionals · Passive voice · Relative clauses · Used to · Gerunds & infinitives
- B2: Third conditional & wishes · Past perfect · Reported speech · Modals of deduction (must have, might have) · Phrasal verbs · Future continuous & perfect
- C1: Mixed conditionals · Inversion (Never have I…) · Cleft sentences (What I need is…) · Participle clauses · Advanced passives (It is said that…) · Subjunctive (I suggest he go)
- C2: Ellipsis & substitution · Fronting & emphasis · Nuanced modals (needn't have, had better) · Register & discourse markers

**Spanish**
- A1: Ser vs estar · Present tense (presente) · Gender & articles · Gustar · Reflexive verbs · Hay vs estar · Near future (ir a + infinitivo)
- A2: Preterite (pretérito indefinido) · Imperfect (imperfecto) · Preterite vs imperfect · Present perfect (pretérito perfecto) · Object pronouns · Imperative (imperativo) · Present progressive (estar + gerundio)
- B1: Present subjunctive (presente de subjuntivo) · Future & conditional · Por vs para · Relative pronouns · Past perfect (pluscuamperfecto) · Commands with pronouns
- B2: Imperfect subjunctive (imperfecto de subjuntivo) · If-clauses (oraciones condicionales) · Reported speech (estilo indirecto) · Passive & impersonal se · Subjunctive with time words (cuando, hasta que)
- C1: Perfect & pluperfect subjunctive · Verbal periphrases (perífrasis verbales) · Verbs of change (ponerse, volverse, hacerse) · Complex connectors
- C2: Subtle mood choice (indicativo vs subjuntivo) · Future subjunctive (formal/legal) · Register & style · Regional variation (vosotros, voseo)

**Portuguese (Brazilian)**
- A1: Ser vs estar · Present tense (presente do indicativo) · Ter & haver · Articles & contractions (no, na, do, da) · Possessives · Near future (ir + infinitivo)
- A2: Preterite (pretérito perfeito) · Imperfect (pretérito imperfeito) · Preterite vs imperfect · Object pronouns · Imperative (imperativo) · Present progressive (estar + gerúndio)
- B1: Present subjunctive (presente do subjuntivo) · Future subjunctive (futuro do subjuntivo) · Conditional (futuro do pretérito) · Present perfect (pretérito perfeito composto) · Relative pronouns · Passive voice
- B2: Imperfect subjunctive (pretérito imperfeito do subjuntivo) · Personal infinitive (infinitivo pessoal) · If-clauses · Reported speech (discurso indireto) · Pluperfect (mais-que-perfeito)
- C1: Compound subjunctive tenses · Pronoun placement (colocação pronominal) · Verbal periphrases · Advanced connectors
- C2: Formal pronoun placement & mesoclisis (mesóclise) · Literary tenses · Register (writing vs speech) · Brazilian vs European differences

## Technical shape

- **One shared catalog module** (e.g. `src/lib/catalog.ts`) is the single source of truth for both client and server: languages (+ flag, YouTube `relevanceLanguage` code), levels (+ descriptions), goals, and per-goal options with stable ids, labels and search phrases.
- **API (`/api/videos`)** accepts `language`, `level`, `goal`, `option`, `speed`, `short` as ids. Unknown values get `400`. This replaces the old `cefr`/`grammar`/`format` params and closes the cache-busting hole found during the caching work.
- The query is built from catalog search phrases. Level adds a level hint unless "All levels".
- YouTube search params: `videoEmbeddable=true` (non-embeddable results break the player), `relevanceLanguage` per language, `safeSearch=moderate` (brand safety for ads). "Short videos only" uses `videoDuration=short`, not `#shorts`.
- "Just watch something": the server picks a random learner-friendly listening content type for the level, so variety comes from several cached queries.
- Caching stays as built (`src/lib/youtube-search.ts`, `unstable_cache`, ~24h). The cache key is built from the validated ids.
- The response includes the context line data (`goal`, `option`, display `summary`) and keeps `language` and `cefr` for library compatibility.

## Out of scope
Feedback button, shareable links/SEO pages, real ads, replacing the `alert()` on fetch errors.
