import type { Metadata } from 'next';
import Link from 'next/link';
import { FEEDBACK_HREF, pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'About',
  'LinguLoop picks YouTube videos for German, English, Spanish and Brazilian Portuguese learners, matched to your level and your goal. Free, with private notes kept in your browser.',
  '/about/',
);

export default function AboutPage() {
  return (
    <>
      <h1>About LinguLoop</h1>
      <p>
        LinguLoop is a free website that finds videos for people who are learning a language. You tell it which
        language you are learning, how well you already know it and what you want to practice, and it picks a
        video for you. No searching, no scrolling through endless results, no deciding what to watch next.
      </p>

      <h2>Why it exists</h2>
      <p>
        Watching real videos is one of the best ways to learn a language, but finding the right one is
        surprisingly hard. A video that is too fast or too advanced is frustrating, and one that is too easy
        teaches you little. LinguLoop takes that search off your hands, so you can spend your time actually
        listening, reading and learning.
      </p>

      <h2>How it works</h2>
      <ul>
        <li>
          <strong>Pick your language.</strong> Choose what you want to practice today.
        </li>
        <li>
          <strong>Pick your level.</strong> Levels follow the CEFR scale used by schools and exams, from A1
          (complete beginner) to C2 (near-native), or choose &quot;All levels&quot; if you just want to explore.
        </li>
        <li>
          <strong>Pick your goal.</strong> Tell LinguLoop what you want from the video, and where it applies,
          narrow it down further, for example to a grammar topic or an exam.
        </li>
        <li>
          <strong>Press &quot;Next video&quot;.</strong> LinguLoop picks a video that fits and plays it right
          on the page. Not feeling it? Press the button again for another one. Videos you have already
          watched are skipped, so you keep getting something new.
        </li>
        <li>
          <strong>Take notes.</strong> Write notes next to the video. Your notes and your watch history are
          saved in your own browser, not on our servers, and you can revisit them any time from the Library
          button.
        </li>
      </ul>

      <h2>Languages and goals</h2>
      <p>LinguLoop currently supports four languages:</p>
      <ul>
        <li>German</li>
        <li>English</li>
        <li>Spanish</li>
        <li>Brazilian Portuguese</li>
      </ul>
      <p>For each language you can choose one of these goals:</p>
      <ul>
        <li>
          <strong>Grammar:</strong> videos that explain a grammar topic.
        </li>
        <li>
          <strong>Listening:</strong> different kinds of listening material, at learner-friendly or native
          speed.
        </li>
        <li>
          <strong>Vocabulary:</strong> videos built around a theme such as food, travel or work.
        </li>
        <li>
          <strong>Pronunciation and speaking:</strong> videos to help you sound more natural.
        </li>
        <li>
          <strong>Exam prep:</strong> videos for common language exams.
        </li>
        <li>
          <strong>Just watch something:</strong> a surprise video in your language and at your level, with no
          specific lesson in mind.
        </li>
      </ul>

      <h2>Where the videos come from</h2>
      <p>
        The videos are public videos on YouTube, made by independent creators, and they play in YouTube&apos;s
        own player. LinguLoop does not host, copy or edit them. Because videos are found automatically, we
        cannot promise that every video matches your level perfectly. If one is off, just press the button
        again.
      </p>

      <h2>Free, and supported by ads</h2>
      <p>
        LinguLoop is free to use and does not need an account. To cover hosting and keep the project going, the
        site shows advertising. You can read how that works, and what data is involved, in the{' '}
        <Link href="/privacy/">Privacy Policy</Link>.
      </p>

      <h2>Who makes it</h2>
      <p>
        LinguLoop is built and run by Gabriel Pugliese, as an independent project for language learners.
      </p>

      <h2>Tell us what you think</h2>
      <p>
        LinguLoop is still growing, and feedback shapes what comes next. If you found a great video, a bad
        match, a bug or have an idea for a new language or goal, please{' '}
        <a href={FEEDBACK_HREF}>send us your feedback</a> or visit the <Link href="/contact/">contact page</Link>.
      </p>
    </>
  );
}
