import styles from './WelcomePage.module.css';

export function WelcomePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Welcome</h1>
      <p className={styles.subtitle}>Your novel-writing companion.</p>
    </main>
  );
}
