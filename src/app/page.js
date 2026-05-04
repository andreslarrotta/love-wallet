import styles from "./page.module.css";

export const metadata = {
  title: "Hello World App",
  description: "A beautiful Hello World created with Next.js",
};

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <h1 className={styles.title}>Hello, World!</h1>
        <p className={styles.subtitle}>Welcome to your new Next.js project.</p>
        <button className={styles.button}>Get Started</button>
      </main>
    </div>
  );
}
