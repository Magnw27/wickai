import Link from "next/link";
import { ArrowDownRight, ArrowRight, Braces, Command, Github, Terminal } from "lucide-react";

const capabilities = [
  ["01", "CHAT", "Fast streaming conversations built around your actual workflow."],
  ["02", "CODE", "Read, explain, refactor and build technical ideas with context."],
  ["03", "MODELS", "Move between configured Wick models without leaving the workspace."],
  ["04", "MEMORY", "Keep useful preferences and project context close at hand."],
];

export function WickAILanding() {
  return (
    <main className="wl-page">
      <header className="wl-nav">
        <Link href="/" className="wl-brand"><span className="wl-mark">W</span><span>WickAI</span></Link>
        <nav className="wl-nav-links" aria-label="Main navigation">
          <a href="#capabilities">Capabilities</a><a href="#manifesto">Manifesto</a><a href="#about">About</a>
        </nav>
        <Link href="/chat" className="wl-nav-cta">Open workspace <ArrowRight size={14}/></Link>
      </header>

      <section className="wl-hero">
        <div className="wl-hero-copy">
          <div className="wl-meta"><span>WICKAI / 2026</span><span>DEVELOPER AI WORKSPACE</span></div>
          <h1>AI without<br/><i>the noise.</i></h1>
          <p>WickAI is a focused workspace for thinking, coding and creating. No visual clutter. No unnecessary layers. Just a sharp interface between you and your models.</p>
          <div className="wl-actions"><Link href="/chat" className="wl-primary">Start building <ArrowRight size={16}/></Link><a href="#capabilities" className="wl-secondary">Scroll to explore <ArrowDownRight size={16}/></a></div>
        </div>
        <div className="wl-console" aria-label="WickAI workspace preview">
          <div className="wl-console-bar"><span>WICK / CONSOLE</span><span>ONLINE</span></div>
          <div className="wl-console-main">
            <div className="wl-console-index"><span>01</span><span>02</span><span>03</span><span>04</span></div>
            <div className="wl-console-copy"><p className="wl-console-question">Build something useful.</p><p className="wl-console-muted">Ask a question, paste code, or turn an idea into a plan.</p><div className="wl-console-input"><Terminal size={14}/><span>wick-fast</span><b></b></div></div>
          </div>
          <div className="wl-console-foot"><span>STREAM / READY</span><span>⌘ ↵</span></div>
        </div>
      </section>

      <div className="wl-marquee"><span>CHAT</span><span>CODE</span><span>RESEARCH</span><span>CREATE</span><span>OPEN</span><span>FOCUSED</span></div>

      <section className="wl-section" id="capabilities">
        <div className="wl-section-label"><b>01</b><span>Capabilities</span><small>WHAT WICKAI DOES</small></div>
        <div className="wl-cap-grid">{capabilities.map(([number,title,body])=><article key={number} className="wl-cap"><span>{number}</span><h2>{title}</h2><p>{body}</p><ArrowRight size={17}/></article>)}</div>
      </section>

      <section className="wl-manifesto" id="manifesto">
        <div className="wl-manifesto-label">02 / MANIFESTO</div>
        <div><h2>Make the interface<br/><em>disappear.</em></h2><p>The best developer tool does not compete for attention. WickAI uses hierarchy, typography, spacing and instant feedback to keep the work in front of you.</p></div>
      </section>

      <section className="wl-section wl-workflow" id="about">
        <div className="wl-section-label"><b>03</b><span>Workflow</span><small>FROM IDEA TO OUTPUT</small></div>
        <div className="wl-flow"><div><strong>01</strong><h3>Ask</h3><p>Start with a question or rough idea.</p></div><div><strong>02</strong><h3>Shape</h3><p>Use context, memory and the right model.</p></div><div><strong>03</strong><h3>Build</h3><p>Turn the response into something real.</p></div></div>
      </section>

      <footer className="wl-footer"><span>© 2026 WICKAI</span><span>MONOCHROME EDITORIAL DEVELOPER UI</span><a href="https://github.com/Magnw27/wickai" target="_blank" rel="noreferrer"><Github size={14}/> GitHub</a></footer>
    </main>
  );
}
