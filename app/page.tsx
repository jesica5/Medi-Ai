import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>MediAI Emergency Triage System</h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Module M2: Health Assessment &amp; Medical History Prototype
      </p>
      <div style={{ marginTop: '1.5rem' }}>
        <Link
          href="/intake"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
          }}
        >
          Launch Patient Intake Flow &rarr;
        </Link>
      </div>
      <footer style={{ marginTop: '3rem', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        Decision-support prototype. Not a diagnosis. Clinical judgment required.
      </footer>
    </main>
  );
}
