export default function DashboardEditorialMockup() {
  const posts = [
    {
      title: "How AI Is Reshaping Content Marketing in 2025",
      excerpt: "A deep dive into the tools, tactics, and trends that are transforming how brands create and distribute content at scale.",
      status: "Published",
      author: "Elena Marchetti",
      date: "Jan 22, 2025",
      thumb: "#C2D4E8",
    },
    {
      title: "The Beginner's Guide to Programmatic SEO",
      excerpt: "Everything you need to know about generating hundreds of optimized pages — without sacrificing quality or relevance.",
      status: "Published",
      author: "James Okubo",
      date: "Jan 18, 2025",
      thumb: "#D8CFC4",
    },
    {
      title: "Why Your Blog Isn't Ranking (And How to Fix It)",
      excerpt: "Common technical SEO mistakes, thin content issues, and internal linking gaps that are holding your organic traffic back.",
      status: "Draft",
      author: "Elena Marchetti",
      date: "Jan 15, 2025",
      thumb: "#E0D6CE",
    },
    {
      title: "Building a Headless Blog with Next.js and a CMS API",
      excerpt: "A step-by-step tutorial for developers who want full design control with structured content delivered via API.",
      status: "Published",
      author: "Sam Chandra",
      date: "Jan 11, 2025",
      thumb: "#C8D8C4",
    },
    {
      title: "Content Velocity: Publishing More Without Burning Out",
      excerpt: "How high-growth startups maintain a steady publishing cadence using AI writing tools and editorial workflows.",
      status: "Draft",
      author: "James Okubo",
      date: "Jan 8, 2025",
      thumb: "#D4C8DC",
    },
  ];

  const statusStyle = (status: string) =>
    status === "Published"
      ? { background: "#F0FDF4", color: "#166534", padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 500 as const, fontFamily: "'Inter', sans-serif", display: "inline-block" }
      : { background: "#FEFCE8", color: "#854D0E", padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 500 as const, fontFamily: "'Inter', sans-serif", display: "inline-block" };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: "#111111", background: "#FAFAF8", minHeight: "100vh" }}>
      {/* Nav bar */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "#FFFFFF",
        borderBottom: "1px solid #E0DED8",
        height: 64,
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia, serif", letterSpacing: "-0.01em" }}>Vibeblogger</span>
          <span style={{ color: "#CCCCCC", fontSize: 18, fontWeight: 300 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#444444" }}>Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <a style={{ fontSize: 13, color: "#666666", textDecoration: "none", cursor: "pointer" }}>Docs</a>
          <a style={{ fontSize: 13, color: "#666666", textDecoration: "none", cursor: "pointer" }}>API Keys</a>
          <a style={{ fontSize: 13, color: "#666666", textDecoration: "none", cursor: "pointer" }}>View Blog</a>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#E0DED8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            color: "#666666",
          }}>
            EM
          </div>
        </div>
      </nav>

      {/* Page area */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 32px 64px" }}>
        {/* Tab row */}
        <div style={{ display: "flex", gap: 32, marginBottom: 0 }}>
          {["Posts", "Topics", "Images", "Scheduler", "Brand"].map((tab, i) => (
            <span
              key={tab}
              style={{
                fontSize: 14,
                fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? "#111111" : "#888888",
                paddingBottom: 12,
                borderBottom: i === 0 ? "2px solid #111111" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {tab}
            </span>
          ))}
        </div>
        <div style={{ borderBottom: "1px solid #E0DED8", marginBottom: 24 }} />

        {/* Toolbar row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ position: "relative" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#AAAAAA"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search posts..."
              readOnly
              style={{
                width: 260,
                padding: "9px 12px 9px 36px",
                border: "1px solid #E0DED8",
                borderRadius: 8,
                fontSize: 13,
                color: "#111111",
                background: "#FFFFFF",
                outline: "none",
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <select
              style={{
                padding: "9px 32px 9px 14px",
                border: "1px solid #E0DED8",
                borderRadius: 8,
                fontSize: 13,
                color: "#444444",
                background: "#FFFFFF",
                fontFamily: "'Inter', sans-serif",
                cursor: "pointer",
                appearance: "none" as const,
                WebkitAppearance: "none" as const,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option>All Status</option>
            </select>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 20px",
                background: "#111111",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Post
            </button>
          </div>
        </div>

        {/* Posts table */}
        <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E0DED8", overflow: "hidden" }}>
          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 110px 140px 110px",
            alignItems: "center",
            padding: "14px 24px",
            borderBottom: "1px solid #E0DED8",
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#888888", textTransform: "uppercase" as const, letterSpacing: "0.15em" }}>Title</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#888888", textTransform: "uppercase" as const, letterSpacing: "0.15em" }}>Status</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#888888", textTransform: "uppercase" as const, letterSpacing: "0.15em" }}>Author</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#888888", textTransform: "uppercase" as const, letterSpacing: "0.15em", textAlign: "right" as const }}>Date</span>
          </div>

          {/* Rows */}
          {posts.map((post, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 140px 110px",
                alignItems: "center",
                padding: "16px 24px",
                borderBottom: i < posts.length - 1 ? "1px solid #F0EEE8" : "none",
                cursor: "pointer",
              }}
            >
              {/* Title cell with thumbnail */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  background: post.thumb,
                  flexShrink: 0,
                }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 400,
                    fontFamily: "Georgia, serif",
                    color: "#111111",
                    lineHeight: 1.3,
                    marginBottom: 3,
                    whiteSpace: "nowrap" as const,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {post.title}
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: "#888888",
                    lineHeight: 1.4,
                    whiteSpace: "nowrap" as const,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {post.excerpt}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <span style={statusStyle(post.status)}>{post.status}</span>
              </div>

              {/* Author */}
              <div style={{ fontSize: 13, color: "#444444" }}>
                {post.author}
              </div>

              {/* Date */}
              <div style={{ fontSize: 13, color: "#888888", textAlign: "right" as const }}>
                {post.date}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 20,
          padding: "0 4px",
        }}>
          <span style={{ fontSize: 13, color: "#888888" }}>
            Showing 1–5 of 23 posts
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E0DED8",
              borderRadius: 6,
              background: "#FFFFFF",
              color: "#CCCCCC",
              cursor: "default",
              fontSize: 14,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E0DED8",
              borderRadius: 6,
              background: "#FFFFFF",
              color: "#444444",
              cursor: "pointer",
              fontSize: 14,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom label */}
      <div style={{
        textAlign: "center" as const,
        padding: "0 32px 48px",
        fontSize: 12,
        color: "#AAAAAA",
        fontFamily: "'Inter', sans-serif",
      }}>
        Dashboard Mockup A — Editorial Table
      </div>
    </div>
  );
}
