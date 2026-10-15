import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: 'linear-gradient(135deg, #121212 0%, #1d2a3a 100%)',
          color: '#e0e0e0',
        }}
      >
        <div style={{ display: 'flex', fontSize: 148, fontWeight: 800, color: '#90caf9', letterSpacing: -4 }}>
          {SITE_NAME}
        </div>
        <div style={{ display: 'flex', fontSize: 52, marginTop: 16, lineHeight: 1.25 }}>
          {SITE_TAGLINE}
        </div>
        <div style={{ display: 'flex', fontSize: 32, marginTop: 48, color: '#ce93d8' }}>
          German · English · Spanish · Portuguese · A1 to C2
        </div>
      </div>
    ),
    { ...size },
  );
}
