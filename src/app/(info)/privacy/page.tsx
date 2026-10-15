import type { Metadata } from 'next';
import { CONTACT_EMAIL, PRIVACY_LAST_UPDATED, pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata(
  'Privacy Policy',
  'How LinguLoop handles data: no accounts, notes and history stay in your browser, and how YouTube and Google AdSense are involved.',
  '/privacy/',
);

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="meta">Last updated: {PRIVACY_LAST_UPDATED}</p>

      <p>
        This policy explains what happens to your data when you use LinguLoop at linguloop.com. We keep it as
        short and plain as we can. You can reach us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>There are no accounts, and we do not ask for your name or email address.</li>
        <li>Your notes, watch history and settings stay in your own browser.</li>
        <li>
          Videos are played by YouTube (Google), and the site shows ads through Google AdSense. Those Google
          services have their own data practices, described below.
        </li>
      </ul>

      <h2>Data stored in your browser</h2>
      <p>
        LinguLoop saves the following in your browser&apos;s local storage (localStorage) on your device:
      </p>
      <ul>
        <li>your notes on videos,</li>
        <li>your watch history (the videos you were shown, with their title, language, level and goal),</li>
        <li>your filter choices (language, level, goal and related options), and</li>
        <li>the state of the Library panel (whether it is open and which tab you last used).</li>
      </ul>
      <p>
        This data is never sent to us and never leaves your device. Your notes are not uploaded anywhere. Two
        things are sent to our server when you ask for a video: your current filter choices (language, level,
        goal and related options), so we can find a matching video, and the IDs of videos you have already
        watched, so you do not get repeats. We use these only to answer that request and do not store them.
      </p>
      <p>
        LinguLoop itself does not set cookies. Because this data lives only in your browser, we cannot see it
        or recover it for you. If you clear your browser data or switch to another browser or device, it will
        not be there.
      </p>

      <h2>Data our server and hosting provider see</h2>
      <p>
        Like any website, our server receives your IP address and basic technical details (such as your
        browser type) with each request. We use your IP address only to limit how many videos can be
        requested in a short time, which protects the site from abuse and keeps us within our YouTube quota.
        The address is held temporarily in the server&apos;s memory for this purpose. We do not write it into
        a database or into our own logs.
      </p>
      <p>
        LinguLoop is hosted on Vercel. Vercel processes standard server and request logs to deliver and secure
        the site; these logs can include the address of each request, and for a video request that address contains the filter choices and watched video IDs described above. See the{' '}
        <a href="https://vercel.com/legal/privacy-policy" rel="noopener noreferrer">
          Vercel Privacy Policy
        </a>{' '}
        for details.
      </p>
      <p>
        To find videos, our server sends search requests to the YouTube Data API. These searches are built
        from the filter options you chose (for example, a language, level and topic) and do not include your
        IP address or any other information about you. We keep the search results (video IDs and titles) in a
        cache for no more than seven days.
      </p>

      <h2>Analytics</h2>
      <p>
        We use Vercel Web Analytics to understand, in aggregate, how the site is used. It does not use cookies
        and does not track you across different websites. It records anonymous page-view data, such as the
        page address, the referring page, your browser, operating system and device type, and your country.
        We do not combine this with your notes, history or filter choices. See Vercel&apos;s{' '}
        <a href="https://vercel.com/docs/analytics/privacy-policy" rel="noopener noreferrer">
          Web Analytics privacy documentation
        </a>{' '}
        for details.
      </p>

      <h2>YouTube</h2>
      <p>
        Videos are shown with an embedded YouTube player, which is provided by Google. We use YouTube&apos;s
        privacy-enhanced mode (youtube-nocookie.com), which asks YouTube not to store information about
        visitors to our site unless they play the video. A video is loaded as soon as it is selected, so your
        browser connects to Google&apos;s servers, which receive your IP address and device information,
        even before you press play. If you play a video, YouTube may set cookies or collect data according
        to its own policies. LinguLoop uses YouTube API Services, and by using LinguLoop you agree to be
        bound by the{' '}
        <a href="https://www.youtube.com/t/terms" rel="noopener noreferrer">
          YouTube Terms of Service
        </a>
        . See also the{' '}
        <a href="https://policies.google.com/privacy" rel="noopener noreferrer">
          Google Privacy Policy
        </a>
        .
      </p>

      <h2>Advertising</h2>
      <p>
        LinguLoop is free and supported by advertising. We use Google AdSense to show ads. Google and its
        advertising partners use cookies and similar identifiers to serve and measure ads, and they may use
        them to show ads based on your interests (personalized ads), depending on your settings and where you
        live. Google may collect and use data such as your IP address, device and browser details and
        information about the pages you view and the ads you interact with. We do not give advertisers or
        Google any notes, history or other data from your browser&apos;s local storage.
      </p>
      <p>
        If you are in the European Economic Area, the United Kingdom or Switzerland, you will be asked for
        your consent through a consent message provided by Google before personalized ads or non-essential
        cookies are used. You can change your choice later where that message offers it.
      </p>
      <p>You can learn more and control ads here:</p>
      <ul>
        <li>
          <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer">
            How Google uses information from sites or apps that use our services
          </a>
        </li>
        <li>
          <a href="https://adssettings.google.com" rel="noopener noreferrer">
            Google Ad Settings
          </a>{' '}
          (to turn off or adjust personalized ads)
        </li>
      </ul>

      <h2>Your rights</h2>
      <p>
        LinguLoop does not keep an account or profile about you, so there is very little personal data on our
        side. If you are in the EEA, the UK or Switzerland, you have the right to ask for access to your
        personal data, to have it corrected or deleted, to object to or restrict how it is processed, and to
        withdraw consent you have given. You also have the right to complain to your local data protection
        authority. To make a request, write to{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. For data held by Google or Vercel, you can
        also use the controls those companies provide.
      </p>
      <p>
        We process data to run and protect the site (our legitimate interest) and, where the law requires it,
        for advertising based on your consent.
      </p>

      <h2>Deleting your local data</h2>
      <p>
        You are in control of what is stored in your browser. To remove your notes, history and settings,
        clear the site data for linguloop.com in your browser&apos;s settings (look for &quot;clear site
        data&quot;, &quot;cookies and site data&quot; or &quot;clear browsing data&quot;). You can also
        delete individual notes and history entries from the Library panel in the app.
      </p>

      <h2>Children</h2>
      <p>
        LinguLoop is not directed at children under 13, and we do not knowingly collect personal information
        from children. If you believe a child has given us personal information, please contact us and we
        will help.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time, for example if we add features or change how ads work.
        The &quot;Last updated&quot; date at the top shows when it last changed. Please check back now and
        then.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
