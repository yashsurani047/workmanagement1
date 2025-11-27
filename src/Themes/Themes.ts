  // Theme/Themes.ts
const theme = {
  colors: {
    primary: "#008080", // teal
    secondary: "#00BFA5",
    background: "#FFFFFF",
    text: "#000000",
    textSecondary: "#6B7280", // 👈 Add this (standard gray for secondary text)
    tabInactive: "#777777",
    border: "#DDDDDD",
    shadow: "#000000",

    // Dashboard card colors
    project: "#008080",
    task: "#00BFA5",
    meeting: "#FF6B6B",
    event: "#FFA500",
    timesheet: "#6A5ACD",
    ticket: "#515795ff", // 

    // Status and utility colors
    success: "#2ECC71",
    error: "#E74C3C",
    white: "#FFFFFF",

    // Overlays
    overlay: "rgba(0,0,0,0.5)",
    overlayLight: "rgba(0,0,0,0.2)",

    // Soft backgrounds for cards/sections
    projectSoft: "#E6F7F5",
    taskSoft: "#E6FCF9",
    meetingSoft: "#FFF5F5",
    eventSoft: "#FFF8F0",
    sectionBg: "#EDF8F2FF",
    borderSubtle: "#e9ecef",
    borderMuted: "rgba(0,0,0,0.05)",

    // Additional semantic neutrals and success variants
    muted100: "#F3F4F6",
    muted200: "#E5E7EB",
    textMuted: "#64748B",
    thumbInactive: "#f4f3f4",
    successSoft: "#ECFDF5",
    successBorder: "#BBF7D0",
    successText: "#065F46",
  },
  fonts: {
    regular: "System",
    medium: "System",
    bold: "System",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 20,
  },
};

export default theme;