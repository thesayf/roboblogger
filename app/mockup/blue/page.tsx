export default function BlueMockup() {
  const accent = "#182D71";
  const accentLight = "#EEF0F7";
  const gradientFrom = "#182D71";
  const gradientTo = "#2B4AAD";

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "#1A1A1A", background: "#FFFFFF" }}>
      {/* Nav */}
      <nav style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }} />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>vibeblogger</span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <a style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Features</a>
          <a style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Pricing</a>
          <a style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Docs</a>
          <a style={{ fontSize: 14, color: "#6B7280", textDecoration: "none" }}>Sign in</a>
          <a style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", background: accent, padding: "8px 20px", borderRadius: 8, textDecoration: "none" }}>Get Started</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: accent, background: accentLight, padding: "6px 14px", borderRadius: 20, marginBottom: 24 }}>
          Blog posts that rank. Zero effort.
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
          Stop writing blogs.<br />
          <span style={{ color: accent }}>Start publishing them.</span>
        </h1>
        <p style={{ fontSize: 20, color: "#6B7280", lineHeight: 1.6, maxWidth: 560, margin: "0 auto 40px" }}>
          AI that researches trending topics, writes SEO-optimized content, and publishes beautiful blog posts — all in minutes.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <a style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`, padding: "14px 32px", borderRadius: 10, textDecoration: "none", boxShadow: `0 4px 14px ${accent}40` }}>
            Create your first post →
          </a>
          <a style={{ fontSize: 16, fontWeight: 500, color: "#1A1A1A", background: "#FFFFFF", border: "1px solid #E5E7EB", padding: "14px 32px", borderRadius: 10, textDecoration: "none" }}>
            See how it works
          </a>
        </div>
      </section>

      {/* Browser Mockup */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", background: "#F9FAFB" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E7EB", display: "flex", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#E5E7EB" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#E5E7EB" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#E5E7EB" }} />
          </div>
          <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
              <span style={{ fontSize: 13, color: "#6B7280" }}>Researching keywords for &quot;home fitness&quot;...</span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
              <span style={{ fontSize: 13, color: "#6B7280" }}>Analyzing competitor content gaps...</span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
              <span style={{ fontSize: 13, color: "#6B7280" }}>Writing SEO-optimized article...</span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent }} />
              <span style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500 }}>Generating hero image with AI...</span>
            </div>
            <div style={{ marginTop: 12, padding: 20, background: "#FFFFFF", borderRadius: 10, border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>10 Home Workouts That Actually Build Muscle (No Gym Needed)</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>Primary keyword: home workouts • Search volume: 33,100/mo • Difficulty: Medium</div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, background: accentLight, color: accent, padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>SEO Score: 94</span>
                <span style={{ fontSize: 11, background: "#F0FDF4", color: "#16A34A", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>2,400 words</span>
                <span style={{ fontSize: 11, background: "#EFF6FF", color: "#2563EB", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>8 components</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: "#F9FAFB", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>How it works</h2>
          <p style={{ fontSize: 16, color: "#6B7280", marginBottom: 60 }}>From idea to published post in three steps.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
            {[
              { step: "1", title: "Describe your niche", desc: "Tell us about your business, audience, and goals. Our AI researches trending topics and SEO opportunities." },
              { step: "2", title: "AI creates content", desc: "We research keywords, write the article, generate images, and optimize everything for search engines." },
              { step: "3", title: "Publish via API", desc: "Beautiful, component-based blog posts delivered through our headless API. Integrate with any frontend." }
            ].map((item) => (
              <div key={item.step} style={{ textAlign: "left", padding: 28, background: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: accentLight, color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>Everything you need</h2>
          <p style={{ fontSize: 16, color: "#6B7280" }}>Built for developers and founders who want results, not busywork.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            { title: "SEO Research", desc: "AI researches keywords, trends, and competitors to find topics that will actually rank." },
            { title: "AI Writing", desc: "Claude generates well-structured, engaging articles optimized for your target keywords." },
            { title: "Beautiful Components", desc: "15+ content components — callouts, comparisons, CTAs, quotes — auto-generated." },
            { title: "Headless API", desc: "JSON API delivers structured content. Build your frontend however you want." },
            { title: "AI Images", desc: "DALL-E generated images that match your content and brand style." },
            { title: "Auto-publish", desc: "Schedule and auto-publish. Set your cadence and let the content flow." },
          ].map((feature) => (
            <div key={feature.title} style={{ padding: 24, borderRadius: 12, border: "1px solid #E5E7EB" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{feature.title}</h3>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>Ready to start vibing?</h2>
          <p style={{ fontSize: 16, color: "#6B7280", marginBottom: 32 }}>Create your first SEO-optimized blog post in minutes.</p>
          <a style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`, padding: "14px 32px", borderRadius: 10, textDecoration: "none", boxShadow: `0 4px 14px ${accent}40` }}>
            Get started free →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #E5E7EB", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>vibeblogger.io — Blog posts that rank. Zero effort.</p>
      </footer>
    </div>
  );
}
