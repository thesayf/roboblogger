export default function EditorialMockup() {
  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "#111111", background: "#FAFAF8" }}>
      {/* Nav */}
      <nav style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", fontFamily: "Georgia, serif" }}>Vibeblogger</span>
        <div style={{ display: "flex", gap: 32, alignItems: "center", fontFamily: "'Inter', -apple-system, sans-serif" }}>
          <a style={{ fontSize: 14, color: "#666666", textDecoration: "none" }}>Features</a>
          <a style={{ fontSize: 14, color: "#666666", textDecoration: "none" }}>Pricing</a>
          <a style={{ fontSize: 14, color: "#666666", textDecoration: "none" }}>Docs</a>
          <a style={{ fontSize: 14, color: "#666666", textDecoration: "none" }}>Sign in</a>
          <a style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", background: "#111111", padding: "10px 24px", borderRadius: 100, textDecoration: "none" }}>Get Started</a>
        </div>
      </nav>

      <div style={{ borderBottom: "1px solid #E0DED8", margin: "0 32px" }} />

      {/* Hero */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "120px 32px 80px", textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#888888", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 32, fontFamily: "'Inter', sans-serif" }}>
          The AI-powered blog engine
        </p>
        <h1 style={{ fontSize: 64, fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 28px", fontFamily: "Georgia, serif" }}>
          Write less.<br />
          Publish more.<br />
          <em style={{ fontStyle: "italic" }}>Rank higher.</em>
        </h1>
        <p style={{ fontSize: 18, color: "#666666", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 48px", fontFamily: "'Inter', sans-serif" }}>
          Vibeblogger researches, writes, and publishes SEO-optimized blog posts for your app. Headless. Automated. Beautiful.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
          <a style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF", background: "#111111", padding: "14px 36px", borderRadius: 100, textDecoration: "none" }}>
            Start publishing →
          </a>
          <a style={{ fontSize: 15, fontWeight: 500, color: "#111111", background: "transparent", border: "1px solid #CCCCCC", padding: "14px 36px", borderRadius: 100, textDecoration: "none" }}>
            See examples
          </a>
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 120, margin: "0 auto", borderBottom: "2px solid #111111" }} />

      {/* How It Works */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 32px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, color: "#888888", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 60, fontFamily: "'Inter', sans-serif" }}>
          How it works
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 48 }}>
          {[
            { num: "01", title: "Describe your niche", desc: "Tell us your industry, audience, and competitors. Our AI handles the keyword and topic research." },
            { num: "02", title: "AI creates everything", desc: "Research, writing, images, SEO metadata — all generated automatically with your brand voice." },
            { num: "03", title: "Fetch via API", desc: "Structured JSON content delivered through our headless API. Plug into any frontend you're building." }
          ].map((item) => (
            <div key={item.num}>
              <div style={{ fontSize: 13, color: "#AAAAAA", fontFamily: "'Inter', sans-serif", marginBottom: 12 }}>{item.num}</div>
              <h3 style={{ fontSize: 22, fontWeight: 400, marginBottom: 12, fontFamily: "Georgia, serif" }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "#666666", lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderBottom: "1px solid #E0DED8", margin: "0 32px" }} />

      {/* Content Preview */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 36, fontWeight: 400, lineHeight: 1.3, marginBottom: 20, fontFamily: "Georgia, serif" }}>
              Content that reads like<br />a <em>human</em> wrote it
            </h2>
            <p style={{ fontSize: 15, color: "#666666", lineHeight: 1.8, marginBottom: 24, fontFamily: "'Inter', sans-serif" }}>
              No generic AI slop. Every post is researched with real data, structured with 15+ component types, and optimized for the keywords your audience is actually searching for.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "'Inter', sans-serif" }}>
              {["SEO keyword research & gap analysis", "15+ content components (callouts, tables, CTAs)", "AI-generated images matching your brand", "Automatic meta tags & Open Graph data"].map((item) => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#111111", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "#444444" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid #E0DED8", borderRadius: 4, padding: 32 }}>
            <div style={{ fontSize: 11, color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>Generated post preview</div>
            <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 12, fontFamily: "Georgia, serif" }}>10 Home Workouts That Build Muscle Without Equipment</div>
            <div style={{ fontSize: 13, color: "#999999", marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>
              home workouts · 33,100 searches/mo · Medium difficulty
            </div>
            <div style={{ borderTop: "1px solid #E0DED8", paddingTop: 16, display: "flex", gap: 16, fontFamily: "'Inter', sans-serif" }}>
              <span style={{ fontSize: 12, color: "#666666" }}>2,400 words</span>
              <span style={{ fontSize: 12, color: "#666666" }}>8 components</span>
              <span style={{ fontSize: 12, color: "#666666" }}>SEO: 94/100</span>
            </div>
          </div>
        </div>
      </section>

      <div style={{ borderBottom: "1px solid #E0DED8", margin: "0 32px" }} />

      {/* Features Grid */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 32px" }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, color: "#888888", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 60, fontFamily: "'Inter', sans-serif" }}>
          Everything included
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
          {[
            { title: "SEO Research", desc: "Keywords, trends, competitor analysis — all automated." },
            { title: "AI Writing", desc: "Long-form articles that read naturally, not like ChatGPT." },
            { title: "Visual Components", desc: "Callouts, tables, comparisons, CTAs — auto-structured." },
            { title: "Headless API", desc: "JSON responses. Build your frontend however you want." },
            { title: "AI Images", desc: "DALL-E images generated to match your content." },
            { title: "Auto-publish", desc: "Set your schedule. Content flows automatically." },
          ].map((feature) => (
            <div key={feature.title} style={{ paddingBottom: 24, borderBottom: "1px solid #E0DED8" }}>
              <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 8, fontFamily: "Georgia, serif" }}>{feature.title}</h3>
              <p style={{ fontSize: 13, color: "#666666", lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#111111", color: "#FFFFFF" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "100px 32px", textAlign: "center" }}>
          <h2 style={{ fontSize: 40, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 16, fontFamily: "Georgia, serif" }}>Ready to start?</h2>
          <p style={{ fontSize: 16, color: "#999999", marginBottom: 36, fontFamily: "'Inter', sans-serif" }}>Your first blog post is free. No credit card required.</p>
          <a style={{ fontSize: 15, fontWeight: 600, color: "#111111", background: "#FFFFFF", padding: "14px 36px", borderRadius: 100, textDecoration: "none", fontFamily: "'Inter', sans-serif" }}>
            Create your first post →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#AAAAAA", fontFamily: "'Inter', sans-serif" }}>vibeblogger.io</p>
      </footer>
    </div>
  );
}
