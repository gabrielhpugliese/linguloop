/**
 * Filter catalog: the single source of truth for the filter UI (client) and
 * the /api/videos validation and YouTube query building (server).
 *
 * Pure data and pure functions only (no React, no Node APIs, no imports), so it is
 * safe to import from both sides. See docs/superpowers/specs/2026-10-14-goal-based-filters-design.md.
 *
 * Every selectable item has a stable ascii `id` (used in the API and localStorage),
 * a UI `label` (English, target-language term in brackets) and a hidden search
 * `phrase`, usually in the target language, used to build the YouTube query.
 */

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------

export const LANGUAGE_IDS = ['German', 'English', 'Spanish', 'Portuguese'] as const;
export type LanguageId = (typeof LANGUAGE_IDS)[number];

export interface LanguageInfo {
  id: LanguageId;
  label: string;
  flag: string;
  /** YouTube `relevanceLanguage` (ISO 639-1). */
  relevanceLanguage: string;
}

export const LANGUAGES: readonly LanguageInfo[] = [
  { id: 'German', label: 'German', flag: '🇩🇪', relevanceLanguage: 'de' },
  { id: 'English', label: 'English', flag: '🇬🇧', relevanceLanguage: 'en' },
  { id: 'Spanish', label: 'Spanish', flag: '🇪🇸', relevanceLanguage: 'es' },
  { id: 'Portuguese', label: 'Portuguese (Brazilian)', flag: '🇧🇷', relevanceLanguage: 'pt' },
];

export function getLanguage(id: LanguageId): LanguageInfo {
  return LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
}

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];
export type LevelId = CefrLevel | 'all';

export interface LevelInfo {
  id: LevelId;
  label: string;
  /** One-line CEFR can-do description for the tooltip. */
  description: string;
}

export const LEVELS: readonly LevelInfo[] = [
  { id: 'all', label: 'All levels', description: 'All levels: any difficulty, no level filter' },
  { id: 'A1', label: 'A1', description: 'A1: you can use and understand very basic everyday phrases' },
  { id: 'A2', label: 'A2', description: 'A2: you can handle simple, routine exchanges on familiar matters' },
  { id: 'B1', label: 'B1', description: 'B1: you can follow clear speech on familiar topics' },
  { id: 'B2', label: 'B2', description: 'B2: you can follow most conversations and talks at normal speed' },
  { id: 'C1', label: 'C1', description: 'C1: you can follow fast, complex speech, even on abstract topics' },
  { id: 'C2', label: 'C2', description: 'C2: you can understand virtually everything you hear with ease' },
];

export function getLevelLabel(id: LevelId): string {
  return LEVELS.find((l) => l.id === id)?.label ?? 'All levels';
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export const GOAL_IDS = ['grammar', 'listening', 'vocabulary', 'pronunciation', 'exam', 'watch'] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export interface GoalInfo {
  id: GoalId;
  label: string;
  icon: string;
  /** Heading above the option chips; undefined when the goal has no options. */
  optionsLabel?: string;
}

export const GOALS: readonly GoalInfo[] = [
  { id: 'grammar', label: 'Grammar', icon: '🧩', optionsLabel: 'Topic' },
  { id: 'listening', label: 'Listening', icon: '🎧', optionsLabel: 'Content type' },
  { id: 'vocabulary', label: 'Vocabulary', icon: '📚', optionsLabel: 'Theme' },
  { id: 'pronunciation', label: 'Pronunciation & speaking', icon: '🗣️', optionsLabel: 'Practice type' },
  { id: 'exam', label: 'Exam prep', icon: '📝', optionsLabel: 'Exam' },
  { id: 'watch', label: 'Just watch something', icon: '🎲' },
];

export const DEFAULT_GOAL: GoalId = 'watch';

export function getGoal(id: GoalId): GoalInfo {
  return GOALS.find((g) => g.id === id) ?? GOALS[GOALS.length - 1];
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface Option {
  id: string;
  label: string;
  /** Hidden search phrase (usually in the target language). */
  phrase: string;
  /** Search phrase for native-speed listening; only listening content types have one. */
  nativePhrase?: string;
  /** Whether the level code is appended to the query when a level is set. Default true. */
  levelHint: boolean;
}

export interface OptionGroup {
  /** Shown above the group; only set for grammar with "All levels" (the CEFR level). */
  heading?: string;
  options: Option[];
}

export type Speed = 'learner' | 'native';
export const SPEEDS: readonly { id: Speed; label: string }[] = [
  { id: 'learner', label: 'Learner-friendly' },
  { id: 'native', label: 'Native speed' },
];

// -- Shared across languages (ids and labels) --------------------------------

const LISTENING_TYPES = [
  ['vlogs', 'Vlogs'],
  ['podcasts', 'Podcasts'],
  ['street-interviews', 'Street interviews'],
  ['news', 'News'],
  ['music', 'Music'],
  ['cartoons-stories', 'Cartoons & stories'],
  ['movies-tv', 'Movies & TV'],
] as const;
type ListeningTypeId = (typeof LISTENING_TYPES)[number][0];

const VOCABULARY_THEMES = [
  ['greetings', 'Greetings & introductions'],
  ['food', 'Food & cooking'],
  ['travel', 'Travel & directions'],
  ['work', 'Work & jobs'],
  ['home-family', 'Home & family'],
  ['health', 'Health & body'],
  ['shopping', 'Shopping & money'],
  ['feelings', 'Feelings & opinions'],
  ['weather', 'Weather & nature'],
  ['hobbies', 'Hobbies & free time'],
  ['idioms', 'Idioms & slang'],
] as const;
type VocabularyThemeId = (typeof VOCABULARY_THEMES)[number][0];

const PRONUNCIATION_TYPES = [
  ['lessons', 'Lessons'],
  ['shadowing', 'Shadowing practice'],
] as const;
type PronunciationTypeId = (typeof PRONUNCIATION_TYPES)[number][0];

// -- Per-language content ----------------------------------------------------

/** [id, label, search term]. */
type GrammarEntry = readonly [id: string, label: string, term: string];
/** [id, label, search phrase, levelHint]. */
type ExamEntry = readonly [id: string, label: string, phrase: string, levelHint: boolean];

interface LanguageContent {
  /** Wraps a grammar term into a query that finds lessons (not native content). */
  grammarQuery: (term: string) => string;
  /** Used when the goal has no option selected. */
  grammarDefault: string;
  grammar: Record<CefrLevel, readonly GrammarEntry[]>;
  /** [learner-friendly phrase, native-speed phrase] per content type. */
  listening: Record<ListeningTypeId, readonly [learner: string, native: string]>;
  listeningDefault: readonly [learner: string, native: string];
  vocabulary: Record<VocabularyThemeId, string>;
  vocabularyDefault: string;
  pronunciation: Record<PronunciationTypeId, string>;
  pronunciationDefault: string;
  exams: readonly ExamEntry[];
  examDefault: string;
}

const CONTENT: Record<LanguageId, LanguageContent> = {
  German: {
    grammarQuery: (term) => `${term} einfach erklärt`,
    grammarDefault: 'deutsche Grammatik einfach erklärt',
    grammar: {
      A1: [
        ['articles-gender', 'Articles & gender (der/die/das)', 'Artikel der die das'],
        ['personal-pronouns', 'Personal pronouns', 'Personalpronomen'],
        ['present-tense', 'Present tense (Präsens)', 'Präsens'],
        ['sein-haben', 'sein & haben', 'sein und haben'],
        ['verb-second', 'Verb-second word order', 'Satzstellung Verb Position 2'],
        ['w-fragen', 'Questions (W-Fragen)', 'W-Fragen'],
        ['negation', 'Negation (nicht/kein)', 'Negation nicht kein'],
        ['accusative', 'Accusative case (Akkusativ)', 'Akkusativ'],
        ['modal-verbs', 'Modal verbs (Modalverben)', 'Modalverben'],
        ['separable-verbs', 'Separable verbs (trennbare Verben)', 'trennbare Verben'],
        ['imperative', 'Imperative (Imperativ)', 'Imperativ'],
      ],
      A2: [
        ['perfekt', 'Perfect tense (Perfekt)', 'Perfekt'],
        ['dative', 'Dative case (Dativ)', 'Dativ'],
        ['two-way-prepositions', 'Two-way prepositions (Wechselpräpositionen)', 'Wechselpräpositionen'],
        ['reflexive-verbs', 'Reflexive verbs', 'reflexive Verben'],
        ['subordinate-clauses', 'Subordinate clauses (weil, dass, wenn)', 'Nebensätze weil dass wenn'],
        ['comparatives', 'Comparatives & superlatives', 'Komparativ und Superlativ'],
        ['adjective-endings', 'Adjective endings (Adjektivdeklination)', 'Adjektivdeklination'],
        ['praeteritum-sein-haben', 'Past of sein/haben/modals (Präteritum)', 'Präteritum sein haben Modalverben'],
      ],
      B1: [
        ['passive', 'Passive voice (Passiv)', 'Passiv'],
        ['konjunktiv-2', 'Subjunctive II (Konjunktiv II)', 'Konjunktiv II'],
        ['relative-clauses', 'Relative clauses (Relativsätze)', 'Relativsätze'],
        ['infinitive-zu', 'Infinitive with zu', 'Infinitiv mit zu'],
        ['praeteritum', 'Simple past (Präteritum)', 'Präteritum'],
        ['plusquamperfekt', 'Past perfect (Plusquamperfekt)', 'Plusquamperfekt'],
        ['genitive', 'Genitive case (Genitiv)', 'Genitiv'],
        ['da-wo-compounds', 'Verbs with prepositions (da-/wo-Wörter)', 'Verben mit Präpositionen da wo Wörter'],
        ['two-part-connectors', 'Two-part connectors (entweder…oder)', 'zweiteilige Konnektoren entweder oder'],
        ['n-declension', 'n-declension (n-Deklination)', 'n-Deklination'],
      ],
      B2: [
        ['konjunktiv-1', 'Subjunctive I & reported speech (Konjunktiv I)', 'Konjunktiv I indirekte Rede'],
        ['passive-alternatives', 'Passive alternatives (sich lassen, sein + zu)', 'Passiversatzformen sich lassen sein zu'],
        ['participles-adjectives', 'Participles as adjectives (Partizip I & II)', 'Partizip I und II als Adjektiv'],
        ['noun-verb-phrases', 'Noun-verb phrases (Nomen-Verb-Verbindungen)', 'Nomen-Verb-Verbindungen'],
        ['genitive-prepositions', 'Genitive prepositions (wegen, trotz)', 'Präpositionen mit Genitiv wegen trotz'],
        ['futur-2', 'Future II (Futur II)', 'Futur II'],
        ['modal-particles', 'Modal particles (doch, ja, mal)', 'Modalpartikeln doch ja mal'],
      ],
      C1: [
        ['extended-participles', 'Extended participle phrases (erweiterte Partizipialattribute)', 'erweiterte Partizipialattribute'],
        ['nominal-style', 'Nominal style (Nominalstil)', 'Nominalstil'],
        ['subjective-modals', 'Subjective modal verbs (soll/will as hearsay)', 'subjektiver Gebrauch Modalverben'],
        ['zustandspassiv', 'Advanced passive (Zustandspassiv)', 'Zustandspassiv'],
        ['complex-connectors', 'Complex connectors', 'komplexe Konnektoren'],
      ],
      C2: [
        ['emphasis-vorfeld', 'Emphasis & word order (Vorfeld)', 'Vorfeld Wortstellung Betonung'],
        ['formal-academic', 'Formal & academic register', 'Bildungssprache akademisches Deutsch'],
        ['literary-konjunktiv', 'Literary forms (Konjunktiv in literature)', 'Konjunktiv in der Literatur'],
        ['colloquial', 'Colloquial grammar (Umgangssprache)', 'Umgangssprache Grammatik'],
      ],
    },
    listening: {
      vlogs: ['Deutsch lernen Vlog langsam', 'Vlog Deutsch Alltag'],
      podcasts: ['slow German podcast', 'Podcast auf Deutsch'],
      'street-interviews': ['Straßeninterview Deutsch lernen', 'Straßenumfrage Deutsch'],
      news: ['langsame Nachrichten Deutsch lernen', 'Nachrichten Deutsch aktuell'],
      music: ['deutsche Lieder Text Deutsch lernen', 'deutsche Musik Songtext'],
      'cartoons-stories': ['Geschichten Deutsch lernen einfach', 'Zeichentrick Deutsch'],
      'movies-tv': ['Deutsch lernen mit Filmen und Serien', 'Filmszene Deutsch Serie'],
    },
    listeningDefault: ['Deutsch Hörverstehen üben', 'Doku Deutsch'],
    vocabulary: {
      greetings: 'Begrüßung und Vorstellung Deutsch lernen',
      food: 'Essen und Kochen Wortschatz Deutsch',
      travel: 'Reisen und Wegbeschreibung Deutsch lernen',
      work: 'Beruf und Arbeit Wortschatz Deutsch',
      'home-family': 'Familie und Wohnung Wortschatz Deutsch',
      health: 'Körper und Gesundheit Wortschatz Deutsch',
      shopping: 'Einkaufen und Geld Wortschatz Deutsch',
      feelings: 'Gefühle und Meinung äußern Deutsch lernen',
      weather: 'Wetter und Natur Wortschatz Deutsch',
      hobbies: 'Hobbys und Freizeit Wortschatz Deutsch',
      idioms: 'deutsche Redewendungen und Umgangssprache',
    },
    vocabularyDefault: 'Wortschatz Deutsch lernen',
    pronunciation: {
      lessons: 'deutsche Aussprache lernen Übungen',
      shadowing: 'Deutsch Shadowing Übung',
    },
    pronunciationDefault: 'deutsche Aussprache sprechen üben',
    exams: [
      ['goethe', 'Goethe-Zertifikat', 'Goethe-Zertifikat Prüfung Vorbereitung', true],
      ['telc', 'telc', 'telc Deutsch Prüfung Vorbereitung', true],
      ['testdaf', 'TestDaF', 'TestDaF Vorbereitung', false],
      ['dsh', 'DSH', 'DSH Prüfung Vorbereitung', false],
      ['osd', 'ÖSD', 'ÖSD Prüfung Vorbereitung', true],
    ],
    examDefault: 'Deutsch Prüfung Vorbereitung',
  },

  English: {
    grammarQuery: (term) => `${term} grammar lesson`,
    grammarDefault: 'English grammar lesson',
    grammar: {
      A1: [
        ['to-be', 'To be', 'verb to be'],
        ['present-simple', 'Present simple', 'present simple'],
        ['pronouns-possessives', 'Pronouns & possessives', 'pronouns and possessives'],
        ['articles', 'Articles (a/an/the)', 'articles a an the'],
        ['plurals', 'Plurals', 'plural nouns'],
        ['there-is-are', 'There is / there are', 'there is there are'],
        ['can-cant', "Can / can't", "can and can't"],
        ['question-words', 'Question words', 'question words'],
      ],
      A2: [
        ['past-simple', 'Past simple', 'past simple'],
        ['present-continuous', 'Present continuous', 'present continuous'],
        ['future-will-going-to', 'Future (will / going to)', 'will vs going to'],
        ['comparatives', 'Comparatives & superlatives', 'comparatives and superlatives'],
        ['countable-uncountable', 'Countable & uncountable', 'countable and uncountable nouns'],
        ['adverbs-of-frequency', 'Adverbs of frequency', 'adverbs of frequency'],
        ['should-must-have-to', 'Should / must / have to', 'should must have to'],
      ],
      B1: [
        ['present-perfect', 'Present perfect', 'present perfect'],
        ['present-perfect-vs-past-simple', 'Present perfect vs past simple', 'present perfect vs past simple'],
        ['first-second-conditionals', 'First & second conditionals', 'first and second conditionals'],
        ['passive', 'Passive voice', 'passive voice'],
        ['relative-clauses', 'Relative clauses', 'relative clauses'],
        ['used-to', 'Used to', 'used to'],
        ['gerunds-infinitives', 'Gerunds & infinitives', 'gerunds and infinitives'],
      ],
      B2: [
        ['third-conditional-wishes', 'Third conditional & wishes', 'third conditional and wishes'],
        ['past-perfect', 'Past perfect', 'past perfect'],
        ['reported-speech', 'Reported speech', 'reported speech'],
        ['modals-of-deduction', 'Modals of deduction (must have, might have)', 'modals of deduction must have might have'],
        ['phrasal-verbs', 'Phrasal verbs', 'phrasal verbs'],
        ['future-continuous-perfect', 'Future continuous & perfect', 'future continuous and future perfect'],
      ],
      C1: [
        ['mixed-conditionals', 'Mixed conditionals', 'mixed conditionals'],
        ['inversion', 'Inversion (Never have I…)', 'inversion negative adverbials'],
        ['cleft-sentences', 'Cleft sentences (What I need is…)', 'cleft sentences'],
        ['participle-clauses', 'Participle clauses', 'participle clauses'],
        ['advanced-passives', 'Advanced passives (It is said that…)', 'impersonal passive it is said that'],
        ['subjunctive', 'Subjunctive (I suggest he go)', 'English subjunctive mood'],
      ],
      C2: [
        ['ellipsis-substitution', 'Ellipsis & substitution', 'ellipsis and substitution'],
        ['fronting-emphasis', 'Fronting & emphasis', 'fronting and emphasis'],
        ['nuanced-modals', "Nuanced modals (needn't have, had better)", "modals needn't have had better"],
        ['register-discourse-markers', 'Register & discourse markers', 'register and discourse markers'],
      ],
    },
    listening: {
      vlogs: ['slow English vlog for learners', 'day in my life vlog'],
      podcasts: ['slow English podcast', 'podcast conversation'],
      'street-interviews': ['street interviews learn English', 'street interview'],
      news: ['slow English news for learners', 'news broadcast'],
      music: ['English songs lyrics learn English', 'song lyrics video'],
      'cartoons-stories': ['English stories for learners', 'cartoon episode'],
      'movies-tv': ['learn English with movies', 'movie scene clip'],
    },
    listeningDefault: ['English listening practice', 'native English conversation'],
    vocabulary: {
      greetings: 'greetings and introductions English lesson',
      food: 'food and cooking vocabulary English',
      travel: 'travel and directions English vocabulary',
      work: 'work and jobs vocabulary English',
      'home-family': 'home and family vocabulary English',
      health: 'health and body vocabulary English',
      shopping: 'shopping and money vocabulary English',
      feelings: 'feelings and opinions vocabulary English',
      weather: 'weather and nature vocabulary English',
      hobbies: 'hobbies and free time vocabulary English',
      idioms: 'English idioms and slang',
    },
    vocabularyDefault: 'English vocabulary lesson',
    pronunciation: {
      lessons: 'English pronunciation lesson',
      shadowing: 'English shadowing practice',
    },
    pronunciationDefault: 'English speaking practice',
    exams: [
      ['ielts', 'IELTS', 'IELTS preparation', false],
      ['toefl', 'TOEFL', 'TOEFL preparation', false],
      ['cambridge', 'Cambridge (B2 First, C1 Advanced)', 'Cambridge B2 First C1 Advanced preparation', false],
      ['pte', 'PTE', 'PTE Academic preparation', false],
      ['duolingo', 'Duolingo English Test', 'Duolingo English Test preparation', false],
    ],
    examDefault: 'English exam preparation',
  },

  Spanish: {
    grammarQuery: (term) => `${term} explicación español`,
    grammarDefault: 'gramática española explicación',
    grammar: {
      A1: [
        ['ser-estar', 'Ser vs estar', 'ser vs estar'],
        ['present-tense', 'Present tense (presente)', 'presente de indicativo'],
        ['gender-articles', 'Gender & articles', 'género y artículos'],
        ['gustar', 'Gustar', 'verbo gustar'],
        ['reflexive-verbs', 'Reflexive verbs', 'verbos reflexivos'],
        ['hay-estar', 'Hay vs estar', 'hay vs estar'],
        ['near-future', 'Near future (ir a + infinitivo)', 'futuro próximo ir a'],
      ],
      A2: [
        ['preterite', 'Preterite (pretérito indefinido)', 'pretérito indefinido'],
        ['imperfect', 'Imperfect (imperfecto)', 'pretérito imperfecto'],
        ['preterite-vs-imperfect', 'Preterite vs imperfect', 'indefinido vs imperfecto'],
        ['present-perfect', 'Present perfect (pretérito perfecto)', 'pretérito perfecto'],
        ['object-pronouns', 'Object pronouns', 'pronombres de objeto directo e indirecto'],
        ['imperative', 'Imperative (imperativo)', 'imperativo'],
        ['present-progressive', 'Present progressive (estar + gerundio)', 'estar + gerundio'],
      ],
      B1: [
        ['present-subjunctive', 'Present subjunctive (presente de subjuntivo)', 'presente de subjuntivo'],
        ['future-conditional', 'Future & conditional', 'futuro y condicional'],
        ['por-para', 'Por vs para', 'por y para'],
        ['relative-pronouns', 'Relative pronouns', 'pronombres relativos'],
        ['past-perfect', 'Past perfect (pluscuamperfecto)', 'pretérito pluscuamperfecto'],
        ['commands-pronouns', 'Commands with pronouns', 'imperativo con pronombres'],
      ],
      B2: [
        ['imperfect-subjunctive', 'Imperfect subjunctive (imperfecto de subjuntivo)', 'imperfecto de subjuntivo'],
        ['if-clauses', 'If-clauses (oraciones condicionales)', 'oraciones condicionales'],
        ['reported-speech', 'Reported speech (estilo indirecto)', 'estilo indirecto'],
        ['passive-impersonal-se', 'Passive & impersonal se', 'pasiva refleja y se impersonal'],
        ['subjunctive-time-words', 'Subjunctive with time words (cuando, hasta que)', 'subjuntivo con cuando hasta que'],
      ],
      C1: [
        ['perfect-pluperfect-subjunctive', 'Perfect & pluperfect subjunctive', 'pretérito perfecto y pluscuamperfecto de subjuntivo'],
        ['verbal-periphrases', 'Verbal periphrases (perífrasis verbales)', 'perífrasis verbales'],
        ['verbs-of-change', 'Verbs of change (ponerse, volverse, hacerse)', 'verbos de cambio ponerse volverse hacerse'],
        ['complex-connectors', 'Complex connectors', 'conectores complejos'],
      ],
      C2: [
        ['mood-choice', 'Subtle mood choice (indicativo vs subjuntivo)', 'indicativo vs subjuntivo matices'],
        ['future-subjunctive', 'Future subjunctive (formal/legal)', 'futuro de subjuntivo'],
        ['register-style', 'Register & style', 'registro y estilo formal e informal'],
        ['regional-variation', 'Regional variation (vosotros, voseo)', 'voseo vosotros variación regional'],
      ],
    },
    listening: {
      vlogs: ['español lento vlog', 'vlog en español'],
      podcasts: ['podcast español lento para estudiantes', 'podcast en español'],
      'street-interviews': ['entrevistas en la calle español aprender', 'entrevista callejera en español'],
      news: ['noticias en español lento', 'noticias en español'],
      music: ['canciones en español letra aprender español', 'canción en español letra'],
      'cartoons-stories': ['cuentos en español fácil', 'dibujos animados en español'],
      'movies-tv': ['aprender español con películas', 'escena película en español'],
    },
    listeningDefault: ['comprensión auditiva español', 'conversación en español nativo'],
    vocabulary: {
      greetings: 'saludos y presentaciones español',
      food: 'vocabulario comida y cocina español',
      travel: 'vocabulario viajes y direcciones español',
      work: 'vocabulario trabajo y profesiones español',
      'home-family': 'vocabulario casa y familia español',
      health: 'vocabulario cuerpo y salud español',
      shopping: 'vocabulario compras y dinero español',
      feelings: 'sentimientos y opiniones en español',
      weather: 'vocabulario clima y naturaleza español',
      hobbies: 'vocabulario pasatiempos y tiempo libre español',
      idioms: 'modismos y jerga en español',
    },
    vocabularyDefault: 'vocabulario español para aprender',
    pronunciation: {
      lessons: 'pronunciación en español lección',
      shadowing: 'shadowing español práctica',
    },
    pronunciationDefault: 'pronunciación y conversación español',
    exams: [
      ['dele', 'DELE', 'DELE examen preparación', true],
      ['siele', 'SIELE', 'SIELE examen preparación', false],
    ],
    examDefault: 'examen de español preparación',
  },

  Portuguese: {
    grammarQuery: (term) => `${term} aula português`,
    grammarDefault: 'gramática português aula',
    grammar: {
      A1: [
        ['ser-estar', 'Ser vs estar', 'ser e estar'],
        ['present-tense', 'Present tense (presente do indicativo)', 'presente do indicativo'],
        ['ter-haver', 'Ter & haver', 'verbos ter e haver'],
        ['contractions', 'Articles & contractions (no, na, do, da)', 'artigos e contrações no na do da'],
        ['possessives', 'Possessives', 'pronomes possessivos'],
        ['near-future', 'Near future (ir + infinitivo)', 'futuro com verbo ir'],
      ],
      A2: [
        ['preterite', 'Preterite (pretérito perfeito)', 'pretérito perfeito'],
        ['imperfect', 'Imperfect (pretérito imperfeito)', 'pretérito imperfeito'],
        ['preterite-vs-imperfect', 'Preterite vs imperfect', 'perfeito vs imperfeito'],
        ['object-pronouns', 'Object pronouns', 'pronomes oblíquos'],
        ['imperative', 'Imperative (imperativo)', 'imperativo'],
        ['present-progressive', 'Present progressive (estar + gerúndio)', 'estar + gerúndio'],
      ],
      B1: [
        ['present-subjunctive', 'Present subjunctive (presente do subjuntivo)', 'presente do subjuntivo'],
        ['future-subjunctive', 'Future subjunctive (futuro do subjuntivo)', 'futuro do subjuntivo'],
        ['conditional', 'Conditional (futuro do pretérito)', 'futuro do pretérito'],
        ['present-perfect', 'Present perfect (pretérito perfeito composto)', 'pretérito perfeito composto'],
        ['relative-pronouns', 'Relative pronouns', 'pronomes relativos'],
        ['passive', 'Passive voice', 'voz passiva'],
      ],
      B2: [
        ['imperfect-subjunctive', 'Imperfect subjunctive (pretérito imperfeito do subjuntivo)', 'pretérito imperfeito do subjuntivo'],
        ['personal-infinitive', 'Personal infinitive (infinitivo pessoal)', 'infinitivo pessoal'],
        ['if-clauses', 'If-clauses', 'orações condicionais com se'],
        ['reported-speech', 'Reported speech (discurso indireto)', 'discurso indireto'],
        ['pluperfect', 'Pluperfect (mais-que-perfeito)', 'mais-que-perfeito'],
      ],
      C1: [
        ['compound-subjunctive', 'Compound subjunctive tenses', 'tempos compostos do subjuntivo'],
        ['pronoun-placement', 'Pronoun placement (colocação pronominal)', 'colocação pronominal'],
        ['verbal-periphrases', 'Verbal periphrases', 'perífrases verbais'],
        ['advanced-connectors', 'Advanced connectors', 'conectivos avançados'],
      ],
      C2: [
        ['mesoclisis', 'Formal pronoun placement & mesoclisis (mesóclise)', 'mesóclise ênclise próclise'],
        ['literary-tenses', 'Literary tenses', 'tempos verbais literários'],
        ['register', 'Register (writing vs speech)', 'língua escrita vs língua falada registro'],
        ['brazilian-vs-european', 'Brazilian vs European differences', 'português brasileiro vs europeu diferenças'],
      ],
    },
    listening: {
      vlogs: ['português brasileiro lento vlog', 'vlog brasileiro'],
      podcasts: ['podcast português brasileiro para estrangeiros', 'podcast em português'],
      'street-interviews': ['entrevistas na rua português brasileiro', 'entrevista na rua Brasil'],
      news: ['notícias em português fácil', 'jornal notícias Brasil'],
      music: ['músicas brasileiras letra aprender português', 'música brasileira letra'],
      'cartoons-stories': ['histórias em português para estrangeiros', 'desenho animado em português'],
      'movies-tv': ['aprender português com filmes', 'cena de filme brasileiro'],
    },
    listeningDefault: ['compreensão auditiva português brasileiro', 'conversa em português brasileiro'],
    vocabulary: {
      greetings: 'cumprimentos e apresentações português',
      food: 'vocabulário comida e culinária português',
      travel: 'vocabulário viagem e direções português',
      work: 'vocabulário trabalho e profissões português',
      'home-family': 'vocabulário casa e família português',
      health: 'vocabulário corpo e saúde português',
      shopping: 'vocabulário compras e dinheiro português',
      feelings: 'sentimentos e opiniões em português',
      weather: 'vocabulário clima e natureza português',
      hobbies: 'vocabulário hobbies e tempo livre português',
      idioms: 'gírias e expressões idiomáticas português brasileiro',
    },
    vocabularyDefault: 'vocabulário português brasileiro',
    pronunciation: {
      lessons: 'pronúncia português brasileiro aula',
      shadowing: 'shadowing português brasileiro prática',
    },
    pronunciationDefault: 'pronúncia português brasileiro',
    exams: [['celpe-bras', 'Celpe-Bras', 'Celpe-Bras preparação', false]],
    examDefault: 'exame de proficiência português preparação',
  },
};

// -- Option lookup -----------------------------------------------------------

const opt = (id: string, label: string, phrase: string, levelHint = true, nativePhrase?: string): Option => ({
  id,
  label,
  phrase,
  levelHint,
  ...(nativePhrase !== undefined ? { nativePhrase } : {}),
});

function grammarOptions(language: LanguageId, level: CefrLevel): Option[] {
  const content = CONTENT[language];
  return content.grammar[level].map(([id, label, term]) => opt(id, label, content.grammarQuery(term)));
}

/**
 * The option groups shown (and accepted by the API) for a goal.
 * Only grammar with "All levels" has several groups, one per CEFR level, with headings.
 */
export function getOptionGroups(goal: GoalId, language: LanguageId, level: LevelId): OptionGroup[] {
  const content = CONTENT[language];
  switch (goal) {
    case 'grammar':
      if (level === 'all') {
        return CEFR_LEVELS.map((l) => ({ heading: l, options: grammarOptions(language, l) }));
      }
      return [{ options: grammarOptions(language, level) }];
    case 'listening':
      return [
        {
          options: LISTENING_TYPES.map(([id, label]) =>
            opt(id, label, content.listening[id][0], true, content.listening[id][1]),
          ),
        },
      ];
    case 'vocabulary':
      return [{ options: VOCABULARY_THEMES.map(([id, label]) => opt(id, label, content.vocabulary[id])) }];
    case 'pronunciation':
      return [{ options: PRONUNCIATION_TYPES.map(([id, label]) => opt(id, label, content.pronunciation[id])) }];
    case 'exam':
      return [{ options: content.exams.map(([id, label, phrase, hint]) => opt(id, label, phrase, hint)) }];
    case 'watch':
      return [];
  }
}

function findOption(sel: Selection): Option | undefined {
  if (!sel.option) return undefined;
  return getOptionGroups(sel.goal, sel.language, sel.level)
    .flatMap((g) => g.options)
    .find((o) => o.id === sel.option);
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

export interface Selection {
  language: LanguageId;
  level: LevelId;
  goal: GoalId;
  /** Option id, '' for none. Always '' for "watch". */
  option: string;
  /** Listening only; 'learner' otherwise. */
  speed: Speed;
  /** Listening only; false otherwise. */
  short: boolean;
}

export const DEFAULT_SELECTION: Selection = {
  language: 'German',
  level: 'all',
  goal: DEFAULT_GOAL,
  option: '',
  speed: 'learner',
  short: false,
};

const includes = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value);

/** Null when `sel.option` is valid for the goal, language and level; otherwise a message. */
function optionError(sel: Selection): string | null {
  if (!sel.option) return null;
  if (sel.goal === 'watch') return `goal "watch" takes no option`;
  if (!findOption(sel)) {
    return `Unknown option "${sel.option}" for goal "${sel.goal}", language "${sel.language}", level "${sel.level}"`;
  }
  return null;
}

/** Drops state that does not apply to the goal (speed/short are listening-only). */
function tidy(sel: Selection): Selection {
  const next = { ...sel };
  if (next.goal !== 'listening') {
    next.speed = 'learner';
    next.short = false;
  }
  if (optionError(next)) next.option = '';
  return next;
}

/** Switching language keeps level and goal, clears language-specific options (grammar topic, exam). */
export function withLanguage(sel: Selection, language: LanguageId): Selection {
  const specific = sel.goal === 'grammar' || sel.goal === 'exam';
  return tidy({ ...sel, language, option: specific ? '' : sel.option });
}

/** Changing level clears the grammar topic if it does not exist at the new level. */
export function withLevel(sel: Selection, level: LevelId): Selection {
  return tidy({ ...sel, level });
}

/** Switching goal clears the previous goal's options but keeps language and level. */
export function withGoal(sel: Selection, goal: GoalId): Selection {
  return { ...sel, goal, option: '', speed: 'learner', short: false };
}

/** Sanitizes untrusted data (localStorage): unknown or stale values fall back to defaults. */
export function sanitizeSelection(raw: unknown): Selection {
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return tidy({
    language: includes(LANGUAGE_IDS, r.language) ? r.language : DEFAULT_SELECTION.language,
    level: includes(['all', ...CEFR_LEVELS] as const, r.level) ? r.level : DEFAULT_SELECTION.level,
    goal: includes(GOAL_IDS, r.goal) ? r.goal : DEFAULT_SELECTION.goal,
    option: typeof r.option === 'string' ? r.option : '',
    speed: r.speed === 'native' ? 'native' : 'learner',
    short: r.short === true,
  });
}

// ---------------------------------------------------------------------------
// API params
// ---------------------------------------------------------------------------

/** Serializes a selection into /api/videos query params. */
export function selectionToParams(sel: Selection): URLSearchParams {
  const params = new URLSearchParams();
  params.set('language', sel.language);
  if (sel.level !== 'all') params.set('level', sel.level);
  params.set('goal', sel.goal);
  if (sel.option) params.set('option', sel.option);
  if (sel.goal === 'listening') {
    if (sel.speed === 'native') params.set('speed', 'native');
    if (sel.short) params.set('short', '1');
  }
  return params;
}

export type ParseResult = { ok: true; selection: Selection } | { ok: false; error: string };

const TRUE_VALUES = ['1', 'true'] as const;
const FALSE_VALUES = ['0', 'false'] as const;

/**
 * Validates /api/videos query params against the catalog. Missing params fall back to
 * defaults (German, all levels, "watch"); any unknown value is an error. `speed` and
 * `short` are validated everywhere but only kept for the listening goal, so they can
 * never create extra cache entries for other goals.
 */
export function parseSelectionParams(params: URLSearchParams): ParseResult {
  const read = (name: string): string => params.get(name)?.trim() ?? '';
  const fail = (message: string): ParseResult => ({ ok: false, error: message });

  const language = read('language') || DEFAULT_SELECTION.language;
  if (!includes(LANGUAGE_IDS, language)) {
    return fail(`Unknown language "${language}". Expected one of: ${LANGUAGE_IDS.join(', ')}`);
  }

  const level = read('level') || 'all';
  if (!includes(['all', ...CEFR_LEVELS] as const, level)) {
    return fail(`Unknown level "${level}". Expected one of: all, ${CEFR_LEVELS.join(', ')}`);
  }

  const goal = read('goal') || DEFAULT_GOAL;
  if (!includes(GOAL_IDS, goal)) {
    return fail(`Unknown goal "${goal}". Expected one of: ${GOAL_IDS.join(', ')}`);
  }

  const speed = read('speed') || 'learner';
  if (!includes(['learner', 'native'] as const, speed)) {
    return fail(`Unknown speed "${speed}". Expected one of: learner, native`);
  }

  const shortParam = read('short') || '0';
  const isShort = includes(TRUE_VALUES, shortParam);
  if (!isShort && !includes(FALSE_VALUES, shortParam)) {
    return fail(`Invalid short "${shortParam}". Expected one of: 1, 0, true, false`);
  }

  const candidate: Selection = { language, level, goal, option: read('option'), speed, short: isShort };
  const error = optionError(candidate);
  if (error) return fail(error);

  return { ok: true, selection: tidy(candidate) };
}

// ---------------------------------------------------------------------------
// Query building
// ---------------------------------------------------------------------------

export interface SearchRequest {
  query: string;
  /** YouTube `relevanceLanguage`. */
  relevanceLanguage: string;
  /** Sets `videoDuration=short` (under 4 minutes). */
  shortOnly: boolean;
}

/** "Just watch something" never picks cartoons & stories for these levels (too childish). */
const WATCH_EXCLUDED: Partial<Record<LevelId, readonly ListeningTypeId[]>> = {
  C1: ['cartoons-stories'],
  C2: ['cartoons-stories'],
};

/**
 * Builds the YouTube request for a validated selection. The only randomness is the
 * "Just watch something" goal, which picks a learner-friendly listening content type
 * for the level (so variety comes from several cached queries). `random` is injectable
 * for tests.
 */
export function toSearchRequest(sel: Selection, random: () => number = Math.random): SearchRequest {
  const content = CONTENT[sel.language];
  let s = sel;
  if (sel.goal === 'watch') {
    const excluded = WATCH_EXCLUDED[sel.level] ?? [];
    const types = LISTENING_TYPES.filter(([id]) => !excluded.includes(id));
    const pick = types[Math.min(types.length - 1, Math.floor(random() * types.length))][0];
    s = { ...sel, goal: 'listening', option: pick, speed: 'learner', short: false };
  }

  const option = findOption(s);
  let phrase: string;
  let levelHint = true;
  switch (s.goal) {
    case 'grammar':
      phrase = option?.phrase ?? content.grammarDefault;
      break;
    case 'listening': {
      // Native-speed content is not graded, so a level code would only pull in learner videos.
      const native = s.speed === 'native';
      phrase = (native ? option?.nativePhrase : option?.phrase) ?? content.listeningDefault[native ? 1 : 0];
      if (native) levelHint = false;
      break;
    }
    case 'vocabulary':
      phrase = option?.phrase ?? content.vocabularyDefault;
      break;
    case 'pronunciation':
      phrase = option?.phrase ?? content.pronunciationDefault;
      break;
    case 'exam':
      phrase = option?.phrase ?? content.examDefault;
      break;
    default:
      phrase = content.listeningDefault[0];
  }
  if (option && !option.levelHint) levelHint = false;
  if (levelHint && s.level !== 'all') phrase = `${phrase} ${s.level}`;

  return {
    query: phrase.replace(/\s+/g, ' ').trim(),
    relevanceLanguage: getLanguage(s.language).relevanceLanguage,
    shortOnly: s.goal === 'listening' && s.short,
  };
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

/** Label without the trailing bracketed target-language term: "Dative case (Dativ)" -> "Dative case". */
export function shortOptionLabel(label: string): string {
  return label.replace(/\s*\([^()]*\)\s*$/, '').trim() || label;
}

/** Context line, e.g. "🇩🇪 B1 · Grammar · Dative case" or "🇩🇪 All levels · Vocabulary · Food & cooking". */
export function buildSummary(sel: Selection): string {
  const parts = [`${getLanguage(sel.language).flag} ${getLevelLabel(sel.level)}`, getGoal(sel.goal).label];
  const option = findOption(sel);
  if (option) parts.push(shortOptionLabel(option.label));
  return parts.join(' · ');
}
