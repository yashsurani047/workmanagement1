// Theme/Themes.ts
// This is the STATIC default theme used for backward compatibility.
// Components that haven't migrated to useTheme() will still work.
// For dynamic theming, use: import { useTheme } from '../Themes/ThemeContext';

import { buildTheme } from './ThemeContext';

const theme = buildTheme('light', '#008080');

export default theme;