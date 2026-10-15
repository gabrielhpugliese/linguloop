import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';

/** Shared frame for the text pages (about, privacy, contact): wordmark header + readable column. */
export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="subpage-header">
        <Link href="/" aria-label={`${SITE_NAME} home`}>
          {SITE_NAME}
        </Link>
      </header>
      <article className="prose">{children}</article>
    </>
  );
}
