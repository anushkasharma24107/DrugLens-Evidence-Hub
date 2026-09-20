/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#10243e',
    tint: '#087f8c',

    // Core surfaces
    background: '#f7fafb',
    foreground: '#10243e',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#10243e',

    // Primary action color (buttons, links, active states)
    primary: '#087f8c',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#e8f3f4',
    secondaryForeground: '#10243e',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#edf2f4',
    mutedForeground: '#607286',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#e4f4ed',
    accentForeground: '#146b4c',

    // Destructive actions (delete, error states)
    destructive: '#c94d4d',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#d8e2e6',
    input: '#c7d6dc',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
