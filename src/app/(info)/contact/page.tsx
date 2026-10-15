import type { Metadata } from 'next';
import Link from 'next/link';
import { CONTACT_EMAIL, pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Contact',
  'Get in touch with LinguLoop: feedback, bug reports, content suggestions and privacy requests.',
  '/contact/',
);

export default function ContactPage() {
  return (
    <>
      <h1>Contact</h1>
      <p>
        The best way to reach LinguLoop is by email:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p>LinguLoop is run by one person, so replies can take a few days, but every message gets read.</p>

      <h2>What to write to us about</h2>
      <ul>
        <li>
          <strong>Feedback:</strong> what you like, what is confusing, what you would change.
        </li>
        <li>
          <strong>Bugs:</strong> something that does not work. It helps to tell us your browser, your device,
          and the language, level and goal you had selected.
        </li>
        <li>
          <strong>Content suggestions:</strong> a new language, a new goal or topic, or a video that does not
          fit your level.
        </li>
        <li>
          <strong>Privacy requests:</strong> questions about your data or the{' '}
          <Link href="/privacy/">Privacy Policy</Link>.
        </li>
      </ul>

      <h2>A note on videos</h2>
      <p>
        The videos shown on LinguLoop belong to their creators and are played from YouTube. If you want a
        video removed from YouTube, please contact the creator or report it to YouTube directly.
      </p>
    </>
  );
}
