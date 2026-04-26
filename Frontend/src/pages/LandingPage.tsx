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

/* ─── Stat ─── */
function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="landing-stat">
      <span className="landing-stat-value">{value}</span>
      <span className="landing-stat-label">{label}</span>
    </div>
  );
}

/* ─── Testimonial ─── */
function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="landing-testimonial">
      <p className="landing-testimonial-quote">"{quote}"</p>
      <div className="landing-testimonial-author">
        <div className="landing-testimonial-avatar">{name[0]}</div>
        <div>
          <p className="landing-testimonial-name">{name}</p>
          <p className="landing-testimonial-role">{role}</p>
        </div>
      </div>
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
            <a href="#testimonials">Community</a>
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
              Real-time Code Execution
            </div>
            <h1>
              Master Algorithms.<br />
              <span className="landing-gradient-text">One Problem at a Time.</span>
            </h1>
            <p className="landing-hero-sub">
              A production-grade competitive programming platform with an integrated code editor,
              automated judging, and real-time feedback. Sharpen your skills with 2400+ curated problems.
            </p>
            <div className="landing-hero-cta">
              <Link to="/signup" className="landing-btn-primary landing-btn-lg">
                Start Solving Now
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
              <Link to="/login" className="landing-btn-outline landing-btn-lg">
                Sign In
              </Link>
            </div>
            <div className="landing-hero-trust">
              <div className="landing-hero-avatars">
                {['A','R','S','M','K'].map((c,i)=>(
                  <div key={i} className="landing-hero-avatar" style={{ zIndex: 5 - i }}>{c}</div>
                ))}
              </div>
              <span>Join <strong>10,000+</strong> developers already practicing</span>
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
          <h2>Everything You Need to <span className="landing-gradient-text">Level Up</span></h2>
          <p>Professional-grade tools designed for serious competitive programmers.</p>
        </div>
        <div className="landing-features-grid">
          <FeatureCard icon="code" title="Monaco Code Editor" desc="Industry-standard editor with syntax highlighting, IntelliSense, and multiple language support." />
          <FeatureCard icon="gavel" title="Automated Judging" desc="Submit solutions and get instant verdicts with detailed test case results and execution times." />
          <FeatureCard icon="analytics" title="Performance Analytics" desc="Track your progress with detailed submission analytics, acceptance rates, and streak tracking." />
          <FeatureCard icon="leaderboard" title="Global Leaderboard" desc="Compete with developers worldwide. Climb the ranks and showcase your algorithmic skills." />
          <FeatureCard icon="category" title="2400+ Problems" desc="Curated problem set sourced from LeetCode covering arrays, DP, graphs, trees, and more." />
          <FeatureCard icon="lock_open" title="Google OAuth" desc="Sign in seamlessly with your Google account. Secure JWT-based authentication out of the box." />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="landing-section landing-section-alt">
        <div className="landing-section-header">
          <span className="landing-section-tag">How It Works</span>
          <h2>Three Steps to <span className="landing-gradient-text">Mastery</span></h2>
          <p>Get from zero to accepted in minutes.</p>
        </div>
        <div className="landing-steps-grid">
          <StepCard num={1} title="Pick a Problem" desc="Browse 2400+ curated problems filtered by difficulty, tags, and acceptance rate." />
          <StepCard num={2} title="Write Your Solution" desc="Code in JavaScript or Python using our integrated Monaco editor with full IntelliSense." />
          <StepCard num={3} title="Submit & Learn" desc="Get instant verdicts, view detailed test case results, and track your progress over time." />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="landing-stats-section">
        <StatItem value="2,400+" label="Curated Problems" />
        <StatItem value="10K+" label="Active Users" />
        <StatItem value="50K+" label="Submissions Daily" />
        <StatItem value="99.9%" label="Uptime" />
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">Community</span>
          <h2>Loved by <span className="landing-gradient-text">Developers</span></h2>
          <p>Hear from our community of competitive programmers.</p>
        </div>
        <div className="landing-testimonials-grid">
          <TestimonialCard quote="The Monaco editor integration is flawless. It feels like coding in VS Code but for competitive programming." name="Alex Chen" role="Software Engineer @ Google" />
          <TestimonialCard quote="Finally a platform that takes execution speed seriously. The automated judging is lightning fast." name="Priya Sharma" role="SDE Intern @ Amazon" />
          <TestimonialCard quote="The analytics dashboard helped me identify my weak areas. I improved my acceptance rate by 40% in 2 months." name="Marcus Kim" role="CS Student @ Stanford" />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="landing-cta-glow" />
        <h2>Ready to Start Your Journey?</h2>
        <p>Join thousands of developers mastering algorithms on Nexorithm.</p>
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
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">API Reference</a>
              <a href="#">Support</a>
            </div>
            <div>
              <h4>Connect</h4>
              <a href="https://github.com/rajatrsrivastav/Nexorithm" target="_blank" rel="noreferrer">GitHub</a>
              <a href="#">Discord</a>
              <a href="#">Twitter</a>
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
