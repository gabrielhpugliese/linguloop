import Link from 'next/link';
import { FEEDBACK_HREF, SITE_NAME } from '@/lib/site';

/** Site-wide footer (rendered by the root layout). Static server component. */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav aria-label="Footer">
        <Link href="/about/">About</Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy/">Privacy</Link>
        <span aria-hidden="true">·</span>
        <Link href="/contact/">Contact</Link>
        <span aria-hidden="true">·</span>
        <a href={FEEDBACK_HREF}>Feedback</a>
        <span aria-hidden="true">·</span>
        <span>© 2026 {SITE_NAME}</span>
      </nav>
    </footer>
  );
}
