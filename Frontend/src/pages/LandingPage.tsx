import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "@fontsource/newsreader/latin-600.css";
import "../styles/landing.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const codeLines = [
  "function twoSum(nums, target) {",
  "  const map = new Map();",
  "  for (let i = 0; i < nums.length; i++) {",
  "    const complement = target - nums[i];",
  "    if (map.has(complement)) {",
  "      return [map.get(complement), i];",
  "    }",
  "    map.set(nums[i], i);",
  "  }",
  "}",
];

const capabilities = [
  ["Monaco editor", "JavaScript and Python in the browser editor. Other languages are not wired up."],
  ["Queued judging", "Submit returns immediately. The page polls until a separate worker writes the verdict."],
  ["Your dashboard", "Solved count, acceptance, and streak are computed from your own saved submissions."],
  ["Submission history", "Review your past runs. There is no public leaderboard."],
  ["Seeded problems", "The repo ships a small built-in set. The list shows problems stored in the database, not a 2,400-problem catalog."],
  ["Sign-in", "Continue with Google, or create an account with email and password."],
] as const;

const steps = [
  ["Pick a problem", "Open a problem stored in the database. Filter the current list by difficulty, tag, or title."],
  ["Write a solution", "Use the Monaco editor. JavaScript and Python are the languages the judge accepts."],
  ["Submit and poll", "The API returns 202. This page asks for status until the worker records a verdict."],
] as const;

function JudgePreview() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(".landing-code-line, .landing-verdict", { clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(".landing-caret", { autoAlpha: 0 });
    });
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });
      timeline
        .from(".landing-code-line", {
          clipPath: "inset(0% 100% 0% 0%)",
          duration: 0.42,
          stagger: 0.09,
        })
        .to(".landing-caret", { autoAlpha: 0, duration: 0.12 }, ">")
        .from(".landing-verdict", {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.5,
        }, "<");
    });
  }, { scope: root });

  return (
    <div ref={root} className="landing-code-block">
      <div className="landing-code-bar">
        <span>two-sum.js</span>
        <span>javascript</span>
      </div>
      <pre className="landing-code-pre">
        {codeLines.map((line, index) => (
          <div key={line} className="landing-code-line">
            <span className="landing-line-num">{index + 1}</span>
            <span>{line}</span>
          </div>
        ))}
        <span className="landing-caret" aria-hidden="true" />
      </pre>
      <div className="landing-verdict">Accepted · 1 / 1 passed</div>
    </div>
  );
}

export function LandingPage() {
  const root = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useGSAP(() => {
    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".landing-progress", {
        scaleY: 0,
        transformOrigin: "center top",
        ease: "none",
        scrollTrigger: {
          trigger: ".landing-steps",
          start: "top 70%",
          end: "bottom 55%",
          scrub: 0.35,
        },
      });
    });
  }, { scope: root });

  return (
    <div ref={root} className="landing-root">
      <nav className={`landing-nav${scrolled ? " scrolled" : ""}`}>
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">
            <span className="landing-logo-icon">N</span>
            <span>Nexorithm</span>
          </Link>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-btn-ghost">Sign in</Link>
            <Link to="/signup" className="landing-btn-primary">Get started free</Link>
          </div>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-grid">
          <div className="landing-hero-text">
            <h1>
              Practice algorithms.
              <span>One problem at a time.</span>
            </h1>
            <p className="landing-hero-sub">
              Write JavaScript or Python in the browser. Submissions are queued
              and judged in a separate worker. This is a local coding judge, not a public contest site.
            </p>
            <div className="landing-hero-cta">
              <Link to="/signup" className="landing-btn-primary landing-btn-lg">
                Create an account
              </Link>
              <Link to="/login" className="landing-btn-outline landing-btn-lg">
                Sign in
              </Link>
            </div>
          </div>
          <JudgePreview />
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="landing-split">
          <div className="landing-section-copy">
            <h2>What this app actually does</h2>
            <p>Accounts, a code editor, and an asynchronous judge for your own submissions.</p>
          </div>
          <dl className="landing-facts">
            {capabilities.map(([title, desc]) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="how-it-works" className="landing-section landing-section-alt">
        <div className="landing-split">
          <div className="landing-section-copy">
            <h2>From the list to a stored verdict</h2>
          </div>
          <div className="landing-steps">
            <div className="landing-progress" aria-hidden="true" />
            <ol>
              {steps.map(([title, desc], index) => (
                <li key={title}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Create an account</h2>
        <p>Registration stores a user in MongoDB. It does not join a public community.</p>
        <Link to="/signup" className="landing-btn-primary landing-btn-lg">
          Create an account
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <Link to="/" className="landing-logo">
              <span className="landing-logo-icon">N</span>
              <span>Nexorithm</span>
            </Link>
            <p>Practice algorithms, one problem at a time.</p>
          </div>
          <div className="landing-footer-links">
            <div>
              <h2>Platform</h2>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <Link to="/login">Sign in</Link>
            </div>
            <div>
              <h2>Repository</h2>
              <a href="https://github.com/anand24mishra/Nexorithm" target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© 2026 Nexorithm</span>
        </div>
      </footer>
    </div>
  );
}
