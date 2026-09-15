export const glass = {
  sidebar: {
    background:
      "linear-gradient(180deg, rgba(5, 8, 22, 0.92) 0%, rgba(11, 16, 32, 0.88) 100%)",
    backdropFilter: "blur(24px) saturate(150%)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  panel: {
    background: "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(16px) saturate(140%)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  card: {
    background:
      "linear-gradient(145deg, rgba(15, 23, 42, 0.72) 0%, rgba(11, 16, 32, 0.88) 100%)",
    backdropFilter: "blur(18px) saturate(130%)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  topbar: {
    background: "rgba(5, 8, 22, 0.75)",
    backdropFilter: "blur(20px) saturate(140%)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
} as const;
