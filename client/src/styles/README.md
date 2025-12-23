# UniSphere Design System

This folder contains the global design system for UniSphere.

## Files

- **theme.ts** - TypeScript theme configuration for use in React components
- **variables.css** - Extended CSS custom properties for global use

## Usage

### In CSS/SCSS files:
```css
.my-component {
  color: var(--text);
  background: var(--background);
  border-color: var(--primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}
```

### In TypeScript/React:
```tsx
import { theme, colors } from '@/styles/theme';

// Use in styled components or inline styles
const MyComponent = () => (
  <div style={{ 
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  }}>
    Content
  </div>
);
```

## Theme Colors

- **text**: `#020a06` - Primary text color
- **background**: `#f9fefc` - Page background
- **primary**: `#2fda90` - Primary actions (buttons, links)
- **secondary**: `#7ea6e8` - Secondary elements
- **accent**: `#6c64e3` - Accent highlights
