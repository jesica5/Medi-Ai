import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <div className={styles.badge}>Emergency Triage System</div>
        <h1 className={styles.title}>MediAI</h1>
        <p className={styles.subtitle}>
          Smart Patient Triage &amp; Emergency Risk Prediction
        </p>
        <p className={styles.description}>
          A clinical decision-support platform for structured patient intake,
          vital-sign capture, and AI-assisted risk assessment.
        </p>
        <div className={styles.actions}>
          <Link href="/intake" className={styles.primaryButton}>
            Begin Health Assessment →
          </Link>
        </div>
      </div>

      <div className={styles.featureGrid}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🩺</div>
          <h2>Patient Intake</h2>
          <p>Structured symptom collection across 12 clinical domains with bilingual support.</p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>📊</div>
          <h2>Vital Signs</h2>
          <p>Validated vital-sign capture with range checks and clinical warnings.</p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🔒</div>
          <h2>Secure Records</h2>
          <p>Patient data secured by role-based access control and Firestore Security Rules.</p>
        </div>
      </div>

      <footer className={styles.footer}>
        Decision-support prototype. Not a diagnosis. Clinical judgment required.
      </footer>
    </main>
  );
}
