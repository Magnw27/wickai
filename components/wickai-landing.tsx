import Link from "next/link";
import { ArrowRight, Braces, Command, Cpu, Github, MessageSquare, Terminal } from "lucide-react";

const principles = [
  ["01", "Direct", "A focused interface that gets out of the way."],
  ["02", "Fast", "Streaming responses with a workspace built for flow."],
  ["03", "Developer-first", "Models, prompts and conversations in one place."],
];

export function WickAILanding() {
  return (
    <main className="wl-page">
      <nav className="wl-nav">
        <Link href="/" className="wl-brand" aria-label="WickAI home">
          <span className="wl-mark">W</span>
          <span>WickAI</span>
        </Link>
        <div className="wl-nav-links">
          <a href="#principles">Principles</a>
          <a href="#workspace">Workspace</a>
          <a href="#about">About</a>
        </div>
        <Link href="/chat" className="wl-nav-cta">Open app <ArrowRight size={15} /></Link>
      </nav>

      <section className="wl-hero" id="workspace">
        <div className="wl-hero-copy">
          <div className="wl-eyebrow"><span>WICKAI / 2026</span><span>AI WORKSPACE</span></div>
          <h1>Think clearly.<br /><em>Build better.</em></h1>
          <p>WickAI is a minimal AI workspace for developers, makers and curious minds. One clean place to think, code, research and create.</p>
          <div className="wl-actions">
            <Link href="/chat" className="wl-primary">Start a conversation <ArrowRight size={17} /></Link>
            <a href="#principles" className="wl-secondary">Explore WickAI <span>↓</span></a>
          </div>
        </div>
        <div className="wl-hero-specimen" aria-label="WickAI interface preview">
          <div className="wl-specimen-head"><span>WICK / CHAT</span><span>READY</span></div>
          <div className="wl-specimen-body">
            <div className="wl-specimen-line"><span className="wl-num">01</span><span>How can I help you build today?</span></div>
            <div className="wl-specimen-line wl-muted"><span className="wl-num">02</span><span>Ask a question, paste code, or start with an idea.</span></div>
            <div className="wl-terminal"><Terminal size={14} /><span>wick-fast</span><span className="wl-terminal-cursor" /></div>
          </div>
          <div className="wl-specimen-foot"><span>STREAMING ENABLED</span><span>ENTER ↵</span></div>
        </div>
      </section>

      <section className="wl-strip">
        <span>BUILT FOR THE NEXT THING</span>
        <span>CHAT / CODE / RESEARCH / CREATE</span>
        <span>MONOCHROME / OPEN / FOCUSED</span>
      </section>

      <section className="wl-principles" id="principles">
        <div className="wl-section-label"><span>01</span><span>Design principles</span></div>
        <div className="wl-principle-grid">
          {principles.map(([number, title, body]) => (
            <article className="wl-principle" key={number}>
              <span className="wl-principle-number">{number}</span>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wl-toolkit">
        <div className="wl-section-label"><span>02</span><span>The workspace</span></div>
        <div className="wl-toolkit-grid">
          <div className="wl-toolkit-intro">
            <p className="wl-display">A serious tool<br />for <span>serious ideas.</span></p>
            <p>Choose a model, keep your conversations organized, preserve useful memory and let WickAI stay out of your way.</p>
          </div>
          <div className="wl-feature-list">
            <div><MessageSquare size={19} /><span><b>Conversation-first</b><small>Clean threads with streaming output.</small></span></div>
            <div><Cpu size={19} /><span><b>Model control</b><small>Switch between configured Wick models.</small></span></div>
            <div><Braces size={19} /><span><b>Developer ready</b><small>Markdown, code, tables and technical workflows.</small></span></div>
            <div><Command size={19} /><span><b>Keyboard friendly</b><small>Fast actions without hunting through menus.</small></span></div>
          </div>
        </div>
      </section>

      <section className="wl-about" id="about">
        <div className="wl-about-big">NO<br />NOISE.</div>
        <div className="wl-about-copy"><p>WickAI is deliberately simple: strong typography, sharp hierarchy, solid surfaces and interactions that feel immediate.</p><Link href="/chat">Enter the workspace <ArrowRight size={15} /></Link></div>
      </section>

      <footer className="wl-footer">
        <span>© 2026 WickAI</span>
        <span>MONOCHROME EDITORIAL DEVELOPER UI</span>
        <a href="https://github.com/Magnw27/wickai" target="_blank" rel="noreferrer"><Github size={14} /> GitHub</a>
      </footer>
    </main>
  );
}
