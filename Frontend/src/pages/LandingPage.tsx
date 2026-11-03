import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/landing.css";

/* ─── Animated Code Block ─── */
const codeLines = [
  { indent: 0, text: 'function twoSum(nums, target) {', color: '#ffc78b' },
  { indent: 1, text: 'const map = new Map();', color: '#e5e2e1' },
  { indent: 1, text: 'for (let i = 0; i < nums.length; i++) {', color: '#ffc78b' },
  { indent: 2, text: 'const complement = target - nums[i];', color: '#e5e2e1' },
  { indent: 2, text: 'if (map.has(complement)) {', color: '#5edf81' },
  { indent: 3, text: 'return [map.get(complement), i];', color: '#ffa116' },
  { indent: 2, text: '}', color: '#5edf81' },
  { indent: 2, text: 'map.set(nums[i], i);', color: '#e5e2e1' },
  { indent: 1, text: '}', color: '#ffc78b' },
  { indent: 0, text: '}', color: '#ffc78b' },
];

function AnimatedCode() {
  const [visibleLines, setVisibleLines] = useState(0);
  useEffect(() => {
    if (visibleLines < codeLines.length) {
      const t = setTimeout(() => setVisibleLines(v => v + 1), 180);
      return () => clearTimeout(t);
    }
  }, [visibleLines]);

  return (
    <div className="landing-code-block">
      <div className="landing-code-dots">
        <span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" />
        <span className="landing-code-filename">solution.js</span>
      </div>
      <pre className="landing-code-pre">
        {codeLines.slice(0, visibleLines).map((l, i) => (
          <div key={i} className="landing-code-line" style={{ paddingLeft: l.indent * 20 }}>
            <span className="landing-line-num">{i + 1}</span>
            <span style={{ color: l.color }}>{l.text}</span>
          </div>
        ))}
        {visibleLines < codeLines.length && <span className="landing-cursor">|</span>}
      </pre>
      {visibleLines >= codeLines.length && (
        <div className="landing-verdict">
          <span className="material-symbols-outlined" style={{ color: '#5edf81', fontSize: 16 }}>check_circle</span>
          <span>All test cases passed</span>
        </div>
      )}
    </div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="landing-feature-card">
      <div className="landing-feature-icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

/* ─── Step Card ─── */
function StepCard({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="landing-step-card">
      <div className="landing-step-num">{num}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════ */
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing-root">
      {/* ── Navbar ── */}
      <nav className={`landing-nav${scrolled ? " scrolled" : ""}`}>
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">
            <div className="landing-logo-icon">N</div>
            <span>Nexorithm</span>
          </Link>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-btn-ghost">Sign In</Link>
            <Link to="/signup" className="landing-btn-primary">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />
        <div className="landing-hero-grid">
          <div className="landing-hero-text">
            <div className="landing-hero-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bolt</span>
              Asynchronous judging
            </div>
            <h1>
              Practice algorithms.<br />
              <span className="landing-gradient-text">One problem at a time.</span>
            </h1>
            <p className="landing-hero-sub">
              Write JavaScript or Python in the browser. Submissions are queued
              and judged in a separate worker. This is a local coding judge, not a public contest site.
            </p>
            <div className="landing-hero-cta">
              <Link to="/signup" className="landing-btn-primary landing-btn-lg">
                Create an account
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
              <Link to="/login" className="landing-btn-outline landing-btn-lg">
                Sign In
              </Link>
            </div>
          </div>
          <div className="landing-hero-visual">
            <AnimatedCode />
          </div>
        </div>
      </section>

      {/* ── Logos / Tech ── */}
      <section className="landing-logos">
        <p>Built with industry-standard technologies</p>
        <div className="landing-logos-row">
          {['React', 'TypeScript', 'Node.js', 'MongoDB', 'Docker', 'Monaco'].map(t => (
            <span key={t} className="landing-logo-pill">{t}</span>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">Features</span>
          <h2>What this app <span className="landing-gradient-text">actually does</span></h2>
          <p>Accounts, a code editor, and an asynchronous judge for your own submissions.</p>
        </div>
        <div className="landing-features-grid">
          <FeatureCard icon="code" title="Monaco editor" desc="JavaScript and Python in the browser editor. Other languages are not wired up." />
          <FeatureCard icon="gavel" title="Queued judging" desc="Submit returns immediately. The page polls until a separate worker writes the verdict." />
          <FeatureCard icon="analytics" title="Your dashboard" desc="Solved count, acceptance, and streak are computed from your own saved submissions." />
          <FeatureCard icon="history" title="Submission history" desc="Review your past runs. There is no public leaderboard." />
          <FeatureCard icon="category" title="Seeded problems" desc="The repo ships a small built-in set. The list shows problems stored in the database, not a 2,400-problem catalog." />
          <FeatureCard icon="lock_open" title="Sign-in" desc="Continue with Google, or create an account with email and password." />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="landing-section landing-section-alt">
        <div className="landing-section-header">
          <span className="landing-section-tag">How It Works</span>
          <h2>Three steps</h2>
          <p>From the problem list to a stored verdict.</p>
        </div>
        <div className="landing-steps-grid">
          <StepCard num={1} title="Pick a problem" desc="Open a problem stored in the database. Filter the current list by difficulty, tag, or title." />
          <StepCard num={2} title="Write a solution" desc="Use the Monaco editor. JavaScript and Python are the languages the judge accepts." />
          <StepCard num={3} title="Submit and poll" desc="The API returns 202. This page asks for status until the worker records a verdict." />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="landing-cta-glow" />
        <h2>Create an account</h2>
        <p>Registration stores a user in MongoDB. It does not join a public community.</p>
        <Link to="/signup" className="landing-btn-primary landing-btn-lg">
          Create Free Account
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <Link to="/" className="landing-logo">
              <div className="landing-logo-icon">N</div>
              <span>Nexorithm</span>
            </Link>
            <p>Master algorithms, one problem at a time.</p>
          </div>
          <div className="landing-footer-links">
            <div>
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <Link to="/login">Sign In</Link>
            </div>
            <div>
              <h4>Repository</h4>
              <a href="https://github.com/anand24mishra/Nexorithm" target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© 2026 Nexorithm. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
