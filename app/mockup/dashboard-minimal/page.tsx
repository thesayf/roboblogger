export default function DashboardMinimalMockup() {
  const posts = [
    { title: "Why Every Founder Should Write in Public", author: "Elena Voss", date: "Jan 24, 2026", status: "published" },
    { title: "The Case for Slower Content Marketing", author: "Marcus Chen", date: "Jan 22, 2026", status: "published" },
    { title: "How We Grew Our Newsletter to 50K Subscribers", author: "Elena Voss", date: "Jan 20, 2026", status: "published" },
    { title: "Drafting a Voice Guide for Your Brand", author: "Ines Moreau", date: "Jan 19, 2026", status: "draft" },
    { title: "SEO Is Dead. Long Live SEO.", author: "Marcus Chen", date: "Jan 17, 2026", status: "published" },
    { title: "Building a Content Engine with a Two-Person Team", author: "Elena Voss", date: "Jan 15, 2026", status: "draft" },
    { title: "What Happened When We Stopped Posting Daily", author: "Ines Moreau", date: "Jan 12, 2026", status: "published" },
    { title: "The Quiet Power of Long-Form Writing", author: "Marcus Chen", date: "Jan 10, 2026", status: "published" },
  ];

  const tabs = [
    { label: "Posts", active: true },
    { label: "Topics", active: false },
    { label: "Images", active: false },
    { label: "Scheduler", active: false },
    { label: "Brand", active: false },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", fontFamily: "Inter, -apple-system, sans-serif", color: "#111111" }}>
      {/* Nav bar */}
      <nav
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: "#111111" }}>
            Vibeblogger
          </span>
          <span style={{ color: "#DDDDDD", fontSize: 17, fontWeight: 300 }}>/</span>
          <span style={{ fontSize: 14, color: "#888888", fontWeight: 500 }}>Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <span style={{ fontSize: 13, color: "#888888", letterSpacing: "0.01em" }}>Docs</span>
          <span style={{ fontSize: 13, color: "#888888", letterSpacing: "0.01em" }}>Settings</span>
          <span style={{ fontSize: 13, color: "#888888", letterSpacing: "0.01em" }}>Help</span>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              backgroundColor: "#F5F4F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "#888888",
            }}
          >
            EV
          </div>
        </div>
      </nav>

      {/* Page area */}
      <div style={{ padding: "28px 32px 0 32px" }}>
        {/* Compact tab pills */}
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((tab) => (
            <span
              key={tab.label}
              style={{
                fontSize: 13,
                fontWeight: 500,
                padding: "6px 16px",
                borderRadius: 100,
                backgroundColor: tab.active ? "#111111" : "transparent",
                color: tab.active ? "#FFFFFF" : "#888888",
                cursor: "default",
              }}
            >
              {tab.label}
            </span>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 32px 64px 32px" }}>
        {/* Action bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#111111",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 100,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "Inter, -apple-system, sans-serif",
              cursor: "default",
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>+</span>
            New Post
          </button>
        </div>

        {/* Post list */}
        <div>
          {posts.map((post, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: i < posts.length - 1 ? "1px solid #F0EEE8" : "none",
                gap: 12,
              }}
            >
              {/* Status indicator */}
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: post.status === "published" ? "#166534" : "#854D0E",
                  flexShrink: 0,
                }}
              />

              {/* Title */}
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#111111",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  minWidth: 0,
                }}
              >
                {post.title}
              </span>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Author */}
              <span
                style={{
                  fontSize: 13,
                  color: "#888888",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {post.author}
              </span>

              {/* Date */}
              <span
                style={{
                  fontSize: 13,
                  color: "#AAAAAA",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  minWidth: 90,
                  textAlign: "right",
                }}
              >
                {post.date}
              </span>

              {/* Overflow menu */}
              <span
                style={{
                  fontSize: 16,
                  color: "#CCCCCC",
                  letterSpacing: 1,
                  flexShrink: 0,
                  lineHeight: 1,
                  cursor: "default",
                }}
              >
                ...
              </span>
            </div>
          ))}
        </div>

        {/* Post count */}
        <div style={{ marginTop: 20 }}>
          <span style={{ fontSize: 12, color: "#AAAAAA" }}>23 posts</span>
        </div>
      </div>

      {/* Footer label */}
      <div style={{ textAlign: "center", padding: "0 32px 48px 32px" }}>
        <span style={{ fontSize: 12, color: "#AAAAAA" }}>
          Dashboard Mockup C — Ultra Minimal
        </span>
      </div>
    </div>
  );
}
