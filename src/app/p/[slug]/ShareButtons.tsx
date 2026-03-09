"use client";

interface Props {
  title: string;
  slug: string;
  url: string; // full URL e.g. https://fieldnine.io/p/my-app
}

export function ShareButtons({ title, slug, url }: Props) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`${title} — Dalkak으로 만든 앱`);

  const shareLinks = [
    {
      label: "트위터",
      icon: "𝕏",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      label: "링크드인",
      icon: "in",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* silent */
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "#94a3b8" }}>공유:</span>
      {shareLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#1e293b",
            color: "#e2e8f0",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            border: "1px solid #334155",
          }}
          title={link.label}
        >
          {link.icon}
        </a>
      ))}
      <button
        onClick={copyLink}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 10px",
          borderRadius: 8,
          background: "#1e293b",
          color: "#94a3b8",
          border: "1px solid #334155",
          cursor: "pointer",
          fontSize: 12,
        }}
        title="링크 복사"
      >
        🔗 복사
      </button>
      {/* slug used for aria labeling */}
      <span style={{ display: "none" }}>{slug}</span>
    </div>
  );
}
