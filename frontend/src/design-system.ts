export const color = {
  bg: {
    primary: "var(--ds-bg-primary)",
    secondary: "var(--ds-bg-secondary)",
    tertiary: "var(--ds-bg-tertiary)",
    surface: "var(--ds-bg-surface)",
    inverse: "var(--ds-bg-inverse)",
  },
  text: {
    primary: "var(--ds-text-primary)",
    secondary: "var(--ds-text-secondary)",
    muted: "var(--ds-text-muted)",
    accent: "var(--ds-text-accent)",
    inverse: "var(--ds-text-inverse)",
  },
  accent: {
    primary: "var(--ds-accent-primary)",
    secondary: "var(--ds-accent-secondary)",
    gradient: "var(--ds-accent-gradient)",
  },
  border: {
    default: "var(--ds-border-default)",
    strong: "var(--ds-border-strong)",
    accent: "var(--ds-border-accent)",
  },
  feedback: {
    success: "var(--ds-feedback-success)",
    error: "var(--ds-feedback-error)",
    warning: "var(--ds-feedback-warning)",
  },
} as const;
