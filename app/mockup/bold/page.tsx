export default function BoldMockup() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "#FFFFFF", background: "#0A0A0A" }}>
      {/* Nav */}
      <nav style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1F1F1F" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #3B82F6, #60A5FA)" }} />
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>vibeblogger</span>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a style={{ fontSize: 14, color: "#888888", textDecoration: "none" }}>Features</a>
          <a style={{ fontSize: 14, color: "#888888", textDecoration: "none" }}>Pricing</a>
          <a style={{ fontSize: 14, color: "#888888", textDecoration: "none" }}>Docs</a>
          <a style={{ fontSize: 14, color: "#888888", textDecoration: "none" }}>Sign in</a>
          <a style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A", background: "#FFFFFF", padding: "8px 20px", borderRadius: 8, textDecoration: "none" }}>Get Started</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 850, margin: "0 auto", padding: "120px 24px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#3B82F6", background: "#3B82F614", border: "1px solid #3B82F630", padding: "6px 16px", borderRadius: 100, marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6" }} />
          Now with AI-powered SEO research
        </div>
        <h1 style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.04em", margin: "0 0 24px" }}>
          Ship your blog.<br />
          <span style={{ background: "linear-gradient(135deg, #3B82F6, #60A5FA, #93C5FD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Not your time.</span>
        </h1>
        <p style={{ fontSize: 18, color: "#888888", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 48px" }}>
          AI researches, writes, and publishes SEO-optimized blog posts for your app. Headless API. Beautiful components. Zero effort.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <a style={{ fontSize: 15, fontWeight: 600, color: "#0A0A0A", background: "#FFFFFF", padding: "14px 32px", borderRadius: 10, textDecoration: "none" }}>
            Start building →
          </a>
          <a style={{ fontSize: 15, fontWeight: 500, color: "#CCCCCC", background: "transparent", border: "1px solid #333333", padding: "14px 32px", borderRadius: 10, textDecoration: "none" }}>
            View demo
          </a>
        </div>
      </section>

      {/* Terminal Mockup */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 100px" }}>
        <div style={{ border: "1px solid #1F1F1F", borderRadius: 12, overflow: "hidden", background: "#111111" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1F1F1F", display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#333333" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#333333" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#333333" }} />
            <span style={{ fontSize: 12, color: "#555555", marginLeft: 12, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>vibeblogger generate</span>
          </div>
          <div style={{ padding: "24px 24px", fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", fontSize: 13, lineHeight: 2.2 }}>
            <div><span style={{ color: "#555555" }}>$</span> <span style={{ color: "#888888" }}>vibeblogger generate --niche &quot;home fitness&quot;</span></div>
            <div style={{ color: "#3B82F6" }}>→ Researching keywords...</div>
            <div style={{ color: "#3B82F6" }}>→ Found 47 keyword opportunities</div>
            <div style={{ color: "#3B82F6" }}>→ Analyzing competitor gaps...</div>
            <div style={{ color: "#3B82F6" }}>→ Writing article (2,400 words)...</div>
            <div style={{ color: "#3B82F6" }}>→ Generating hero image...</div>
            <div style={{ color: "#22C55E" }}>✓ Published: &quot;10 Home Workouts That Build Muscle&quot;</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ color: "#555555" }}>  SEO Score:</span> <span style={{ color: "#22C55E" }}>94/100</span>
              <span style={{ color: "#555555", marginLeft: 16 }}>Keywords:</span> <span style={{ color: "#888888" }}>home workouts (33.1k/mo)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ borderTop: "1px solid #1F1F1F" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>Built for builders</h2>
            <p style={{ fontSize: 16, color: "#666666" }}>Everything you need to go from zero to ranking.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[
              { title: "SEO Research", desc: "AI researches keywords, trends, and competitors to find topics that rank.", icon: "🔍" },
              { title: "AI Writing", desc: "Claude writes long-form, well-structured articles in your brand voice.", icon: "✍️" },
              { title: "15+ Components", desc: "Callouts, tables, CTAs, comparisons — all auto-generated.", icon: "🧱" },
              { title: "Headless API", desc: "JSON responses. Next.js, Remix, Astro — works with anything.", icon: "⚡" },
              { title: "AI Images", desc: "DALL-E images generated to match your content and brand.", icon: "🎨" },
              { title: "Auto-publish", desc: "Set your cadence. Posts publish on schedule, automatically.", icon: "📅" },
            ].map((feature) => (
              <div key={feature.title} style={{ padding: 24, borderRadius: 12, border: "1px solid #1F1F1F", background: "#111111" }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{feature.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ fontSize: 13, color: "#888888", lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ borderTop: "1px solid #1F1F1F" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 60 }}>Three steps. That&apos;s it.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40 }}>
            {[
              { num: "01", title: "Describe", desc: "Your niche, audience, and what you want to rank for." },
              { num: "02", title: "Generate", desc: "AI researches, writes, and optimizes your content." },
              { num: "03", title: "Publish", desc: "Fetch via API. Render in your app. Done." },
            ].map((item) => (
              <div key={item.num}>
                <div style={{ fontSize: 48, fontWeight: 800, color: "#1F1F1F", marginBottom: 16 }}>{item.num}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: "#666666", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: "1px solid #1F1F1F" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Ship content.<br />
            <span style={{ background: "linear-gradient(135deg, #3B82F6, #60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ship faster.</span>
          </h2>
          <p style={{ fontSize: 16, color: "#666666", marginBottom: 36 }}>Your first post is free. No credit card needed.</p>
          <a style={{ fontSize: 15, fontWeight: 600, color: "#0A0A0A", background: "#FFFFFF", padding: "14px 36px", borderRadius: 10, textDecoration: "none" }}>
            Get started free →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1F1F1F", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#444444" }}>vibeblogger.io — Blog posts that rank. Zero effort.</p>
      </footer>
    </div>
  );
}
