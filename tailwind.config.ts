import type { Config } from "tailwindcss";

function colorScale(name: string) {
  return {
    50: `var(--color-${name}-50)`,
    100: `var(--color-${name}-100)`,
    200: `var(--color-${name}-200)`,
    300: `var(--color-${name}-300)`,
    400: `var(--color-${name}-400)`,
    500: `var(--color-${name}-500)`,
    600: `var(--color-${name}-600)`,
    700: `var(--color-${name}-700)`,
    800: `var(--color-${name}-800)`,
    900: `var(--color-${name}-900)`,
  };
}

function semanticColor(name: string, cssName?: string) {
  const n = cssName ?? name;
  return {
    DEFAULT: `var(--color-${n})`,
    foreground: `var(--color-${n}-foreground)`,
    fg: `var(--color-${n}-fg)`,
    bg: `var(--color-${n}-bg)`,
    "bg-active": `var(--color-${n}-bg-active)`,
    hover: `var(--color-${n}-hover)`,
    active: `var(--color-${n}-active)`,
    ...colorScale(n),
  };
}

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        "4xl": "2rem",
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      fontSize: {
        "3xs": ["var(--text-3xs)", { lineHeight: "1" }] as [string, { lineHeight: string }],
        "2xs": ["var(--text-2xs)", { lineHeight: "1" }] as [string, { lineHeight: string }],
        xs: ["var(--text-xs)", { lineHeight: "1rem" }] as [string, { lineHeight: string }],
        sm: ["var(--text-sm)", { lineHeight: "1.25rem" }] as [string, { lineHeight: string }],
        base: ["var(--text-base)", { lineHeight: "1.5rem" }] as [string, { lineHeight: string }],
        md: ["var(--text-md)", { lineHeight: "1.5rem" }] as [string, { lineHeight: string }],
        lg: ["var(--text-lg)", { lineHeight: "1.75rem" }] as [string, { lineHeight: string }],
        xl: ["var(--text-xl)", { lineHeight: "1.75rem" }] as [string, { lineHeight: string }],
        "2xl": ["var(--text-2xl)", { lineHeight: "2rem" }] as [string, { lineHeight: string }],
        "3xl": ["var(--text-3xl)", { lineHeight: "2.25rem" }] as [string, { lineHeight: string }],
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        base: "var(--shadow-base)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        outline: "var(--shadow-outline)",
        inner: "var(--shadow-inner)",
        "dark-lg": "var(--shadow-dark-lg)",
      },
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        "inverse-text": "var(--color-inverse-text)",
        "body-bg": "var(--color-body-bg)",
        "body-text": "var(--color-body-text)",
        "subtle-bg": "var(--color-subtle-bg)",
        "subtle-text": "var(--color-subtle-text)",
        "placeholder-color": "var(--color-placeholder-color)",
        "border-color": "var(--color-border-color)",
        "border-color-a11y": "var(--color-border-color-a11y)",
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        popover: {
          DEFAULT: "var(--color-popover)",
          foreground: "var(--color-popover-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        // Semantic color tokens with scales
        primary: semanticColor("primary"),
        danger: semanticColor("danger"),
        destructive: semanticColor("danger"),
        success: semanticColor("success"),
        warning: semanticColor("warning"),
        info: semanticColor("info"),
        neutral: {
          DEFAULT: "var(--color-neutral)",
          fg: "var(--color-neutral-fg)",
          bg: "var(--color-neutral-bg)",
          "bg-active": "var(--color-neutral-bg-active)",
          hover: "var(--color-neutral-hover)",
          active: "var(--color-neutral-active)",
        },
        // Full color scales
        blue: colorScale("blue"),
        cyan: colorScale("cyan"),
        gray: colorScale("gray"),
        green: colorScale("green"),
        orange: colorScale("orange"),
        pink: colorScale("pink"),
        purple: colorScale("purple"),
        red: colorScale("red"),
        teal: colorScale("teal"),
        yellow: colorScale("yellow"),
        blackAlpha: {
          50: "var(--color-blackAlpha-50)",
          100: "var(--color-blackAlpha-100)",
          200: "var(--color-blackAlpha-200)",
          300: "var(--color-blackAlpha-300)",
          400: "var(--color-blackAlpha-400)",
          500: "var(--color-blackAlpha-500)",
          600: "var(--color-blackAlpha-600)",
          700: "var(--color-blackAlpha-700)",
          800: "var(--color-blackAlpha-800)",
          900: "var(--color-blackAlpha-900)",
        },
        whiteAlpha: {
          50: "var(--color-whiteAlpha-50)",
          100: "var(--color-whiteAlpha-100)",
          200: "var(--color-whiteAlpha-200)",
          300: "var(--color-whiteAlpha-300)",
          400: "var(--color-whiteAlpha-400)",
          500: "var(--color-whiteAlpha-500)",
          600: "var(--color-whiteAlpha-600)",
          700: "var(--color-whiteAlpha-700)",
          800: "var(--color-whiteAlpha-800)",
          900: "var(--color-whiteAlpha-900)",
        },
        chart: {
          "1": "var(--color-chart-1)",
          "2": "var(--color-chart-2)",
          "3": "var(--color-chart-3)",
          "4": "var(--color-chart-4)",
          "5": "var(--color-chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--color-sidebar)",
          foreground: "var(--color-sidebar-foreground)",
          primary: "var(--color-sidebar-primary)",
          "primary-foreground": "var(--color-sidebar-primary-foreground)",
          accent: "var(--color-sidebar-accent)",
          "accent-foreground": "var(--color-sidebar-accent-foreground)",
          border: "var(--color-sidebar-border)",
          ring: "var(--color-sidebar-ring)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
