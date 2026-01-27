export default function DashboardMagazineMockup() {
  const posts = [
    {
      status: "Published",
      title: "How AI-Generated Content Is Reshaping SEO in 2025",
      excerpt: "Search engines are evolving faster than ever. Here's what marketers need to know about ranking with AI-written content.",
      author: "Sara Mitchell",
      date: "Jan 22, 2025",
    },
    {
      status: "Published",
      title: "The Complete Guide to Headless CMS Architecture",
      excerpt: "Decoupling your frontend from your content layer unlocks speed, flexibility, and developer happiness.",
      author: "James Corbin",
      date: "Jan 18, 2025",
    },
    {
      status: "Draft",
      title: "7 Content Distribution Channels You're Probably Ignoring",
      excerpt: "Publishing is only half the battle. These underused channels can 3x your reach without extra budget.",
      author: "Sara Mitchell",
      date: "Jan 15, 2025",
    },
    {
      status: "Published",
      title: "Why Long-Form Blog Posts Still Outperform Short Content",
      excerpt: "Data from 12,000 articles shows that depth wins over brevity when it comes to organic traffic and engagement.",
      author: "Alex Park",
      date: "Jan 10, 2025",
    },
  ];

  const sidebarItems = [
    { label: "Posts", active: true },
    { label: "Topics", active: false },
    { label: "Images", active: false },
    { label: "Scheduler", active: false },
    { label: "Brand", active: false },
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: "#111111", background: "#FAFAF8", minHeight: "100vh" }}>

      {/* Nav Bar */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 64,
        background: "#FFFFFF",
        borderBottom: "1px solid #E0DED8",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia, serif", color: "#111111" }}>Vibeblogger</span>
          <span style={{ fontSize: 14, color: "#CCCCCC" }}>/</span>
          <span style={{ fontSize: 14, color: "#888888", fontWeight: 500 }}>Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a style={{ fontSize: 13, color: "#666666", textDecoration: "none", cursor: "pointer" }}>Docs</a>
          <a style={{ fontSize: 13, color: "#666666", textDecoration: "none", cursor: "pointer" }}>API</a>
          <a style={{ fontSize: 13, color: "#666666", textDecoration: "none", cursor: "pointer" }}>Settings</a>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#111111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 600,
          }}>SM</div>
        </div>
      </nav>

      {/* Page Body */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>

        {/* Sidebar */}
        <aside style={{
          width: 200,
          borderRight: "1px solid #E0DED8",
          padding: "32px 0",
          background: "#FAFAF8",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "10px 24px",
                  fontSize: 14,
                  color: item.active ? "#111111" : "#888888",
                  fontWeight: item.active ? 600 : 400,
                  borderLeft: item.active ? "2px solid #111111" : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: "40px 48px" }}>

          {/* Top Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 400, fontFamily: "Georgia, serif", margin: 0 }}>Posts</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="text"
                placeholder="Search posts..."
                readOnly
                style={{
                  fontSize: 13,
                  padding: "9px 16px",
                  border: "1px solid #E0DED8",
                  borderRadius: 8,
                  background: "#FFFFFF",
                  color: "#666666",
                  outline: "none",
                  width: 200,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <button
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  background: "#111111",
                  border: "none",
                  padding: "9px 24px",
                  borderRadius: 100,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                New Post
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
            <span style={{ fontSize: 13, color: "#888888" }}>23 Total</span>
            <span style={{ fontSize: 13, color: "#CCCCCC", margin: "0 12px" }}>&middot;</span>
            <span style={{ fontSize: 13, color: "#888888" }}>18 Published</span>
            <span style={{ fontSize: 13, color: "#CCCCCC", margin: "0 12px" }}>&middot;</span>
            <span style={{ fontSize: 13, color: "#888888" }}>5 Drafts</span>
          </div>

          {/* Card Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
            {posts.map((post, i) => (
              <div
                key={i}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0DED8",
                  borderRadius: 8,
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                {/* Image Placeholder */}
                <div style={{
                  aspectRatio: "16 / 9",
                  background: "#F0EEE8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {/* Newspaper icon SVG */}
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.25 }}>
                    <rect x="6" y="8" width="28" height="24" rx="2" stroke="#999999" strokeWidth="1.5" fill="none" />
                    <line x1="10" y1="14" x2="22" y2="14" stroke="#999999" strokeWidth="1.5" />
                    <line x1="10" y1="18" x2="22" y2="18" stroke="#999999" strokeWidth="1.5" />
                    <line x1="10" y1="22" x2="18" y2="22" stroke="#999999" strokeWidth="1.5" />
                    <rect x="24" y="14" width="6" height="8" rx="1" stroke="#999999" strokeWidth="1.5" fill="none" />
                    <line x1="10" y1="27" x2="30" y2="27" stroke="#999999" strokeWidth="1" />
                  </svg>
                </div>

                {/* Card Body */}
                <div style={{ padding: 20 }}>
                  {/* Status Badge */}
                  <span style={{
                    display: "inline-block",
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: post.status === "Published" ? "#4A8C6F" : "#B08A29",
                    background: post.status === "Published" ? "#EDF7F0" : "#FFF8E7",
                    padding: "3px 10px",
                    borderRadius: 100,
                    marginBottom: 12,
                  }}>
                    {post.status}
                  </span>

                  {/* Title */}
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 400,
                    fontFamily: "Georgia, serif",
                    color: "#111111",
                    lineHeight: 1.4,
                    margin: "0 0 8px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}>
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p style={{
                    fontSize: 13,
                    color: "#888888",
                    lineHeight: 1.6,
                    margin: "0 0 16px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}>
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div style={{ fontSize: 12, color: "#AAAAAA" }}>
                    {post.author}
                    <span style={{ margin: "0 8px" }}>&middot;</span>
                    {post.date}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Link */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <a style={{
              fontSize: 14,
              color: "#111111",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              cursor: "pointer",
            }}>
              View all 23 posts &rarr;
            </a>
          </div>

        </main>
      </div>

      {/* Bottom Label */}
      <div style={{
        textAlign: "center",
        padding: "24px 0 32px",
        fontSize: 12,
        color: "#AAAAAA",
        borderTop: "1px solid #E0DED8",
      }}>
        Dashboard Mockup B &mdash; Magazine Grid
      </div>
    </div>
  );
}
