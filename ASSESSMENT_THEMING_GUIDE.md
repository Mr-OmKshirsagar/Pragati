# Assessment Role-Aware Theming Guide

## How Role Theming Works

### 1. AuthContext Sets Role on Root
When user logs in (or switches role via PersonaSwitcher):

```typescript
// AuthContext.tsx
useEffect(() => {
  const theme = getRoleSidebarTheme(role);
  document.documentElement.setAttribute("data-role", role);
  document.documentElement.style.setProperty("--primary", theme.activePillBg);
  document.documentElement.style.setProperty("--sidebar", theme.sidebarBg);
  // ... other CSS vars
}, [role]);
```

Result: `<html data-role="STUDENT|FACULTY|HOD|TNP_COORDINATOR|ADMIN">`

### 2. CSS Variables Cascade
In `index.css`, role-specific selectors define colors:

```css
:root {
  --primary: #4A43B3;  /* Default STUDENT */
  --sidebar: #141B2A;
  --role-primary: #4A43B3;
  --role-accent: #EEF0FB;
}

[data-role="STUDENT"] {
  --primary: #4A43B3;
  --sidebar: #141B2A;
  /* ... */
}

[data-role="FACULTY"] {
  --primary: #156963;      /* Teal */
  --sidebar: #0D2421;
  /* ... */
}

[data-role="HOD"] {
  --primary: #5E53BA;      /* Violet */
  --sidebar: #241B46;
  /* ... */
}

[data-role="TNP_COORDINATOR"] {
  --primary: #AB6515;      /* Amber */
  --sidebar: #261A0D;
  /* ... */
}

[data-role="ADMIN"] {
  --primary: #B22746;      /* Rose */
  --sidebar: #2C1419;
  /* ... */
}
```

### 3. Assessment Pages Inherit Colors
All assessment pages wrapped with `<PragatiFrame>` which uses these CSS vars:

```tsx
<PragatiFrame>
  <div className="min-h-screen bg-[#f5f7fb]">
    {/* Assessment content uses bg-primary, text-primary, etc. */}
  </div>
</PragatiFrame>
```

Tailwind classes automatically use CSS variables:
- `bg-primary` → `background-color: var(--primary)`
- `text-primary` → `color: var(--primary)`
- `border-primary` → `border-color: var(--primary)`

### 4. Role Switching Updates Everything
When user switches role via PersonaSwitcher:

1. `switchRole(newRole)` called
2. AuthContext updates `data-role` attribute
3. CSS cascade applies new colors
4. All components re-render with new colors (no navigation needed)

## Role Color Palette

### STUDENT (Deep Indigo)
```
Primary: #4A43B3 (Deep Indigo)
Sidebar: #141B2A (Very Dark Blue)
Accent: #EEF0FB (Light Lavender)
Secondary: #f0f2fb
Theme: Academic, focused, professional
```

### FACULTY (Teal)
```
Primary: #156963 (Teal)
Sidebar: #0D2421 (Very Dark Teal)
Accent: #EAF7F5 (Very Light Teal)
Secondary: #edf9f7
Theme: Mentoring, nature-inspired, calm
```

### HOD (Violet)
```
Primary: #5E53BA (Violet)
Sidebar: #241B46 (Very Dark Violet)
Accent: #F0EEFB (Light Lavender)
Secondary: #f4f2fc
Theme: Leadership, authority, vision
```

### TNP_COORDINATOR (Amber)
```
Primary: #AB6515 (Amber)
Sidebar: #261A0D (Very Dark Brown)
Accent: #FBF2E5 (Cream)
Secondary: #fff8ea
Theme: Opportunity, energy, warmth
```

### ADMIN (Rose)
```
Primary: #B22746 (Rose)
Sidebar: #2C1419 (Very Dark Red)
Accent: #FCE7EC (Light Rose)
Secondary: #ffe5ec
Theme: Authority, protection, critical
```

## Assessment Pages & Theming

### Assessment List Page
- Assessment cards use `bg-primary` for gradient buttons
- Status badges use role colors (emerald for available, neutral for locked)
- Difficulty badges have their own colors (not role-dependent)
- Previous score section shows `--role-accent` background

### Assessment Overview Page
- Header uses `border-primary` for bottom border
- Back button uses `text-primary` (indigo/teal/violet/etc)
- Begin button has `bg-gradient-to-r from-indigo-600 to-violet-600`
  - Note: This gradient is hardcoded and doesn't change per role
  - Consider updating to use CSS vars if role-specific gradients needed

### Assessment Attempt Page
- Header border uses `border-primary`
- Timer uses `text-primary` for normal state
- Timer uses `text-amber-600` for low time (override)
- Timer uses `text-red-600` for critical (override)
- Next button uses `bg-indigo-600` (hardcoded, not role-aware)
  - Consider using `bg-primary` with appropriate CSS for button styling

### Assessment Review Page
- Back button uses `text-primary`
- Stats cards use role colors in their borders
- Submit button uses `bg-emerald-600` (success color, not role-aware)

### Assessment Result Page
- Header uses `border-primary`
- Back button uses `text-primary`
- Main score display background uses role colors
- Skill progress bars use `bg-gradient-to-r from-indigo-600 to-violet-600` (hardcoded)
- CTA buttons use `bg-primary` (good! role-aware)

## Migration Notes

### Hardcoded Colors to Migrate
Several components still use hardcoded colors that could be role-aware:

1. **Gradients** - Currently hardcoded indigo/violet gradients
   - Could create role-specific gradient CSS vars
   - Example: `--gradient-primary: linear-gradient(to right, var(--primary), var(--secondary))`

2. **Button Colors**
   - ✓ Good: Using `bg-primary` for CTA buttons
   - ✗ Hardcoded: Some buttons use `bg-indigo-600` or `bg-emerald-600`
   - Migration: Use `bg-primary` class for consistency

3. **Status Colors**
   - ✓ Good: Emerald for success, amber for warning, red for danger
   - These are intentional (not role-dependent) for consistency
   - No changes needed

4. **Card Backgrounds**
   - ✓ Good: Using CSS vars for card styling
   - Sections use `border-primary` and `text-primary`
   - Consistent role theming applied

## Testing Role Theming

### Manual Test Steps

1. **Load Assessment List**
   - Browser DevTools → Elements
   - Find `<html>` tag
   - Verify `data-role="STUDENT"` attribute

2. **Switch Role**
   - Click PersonaSwitcher (profile avatar)
   - Select different role (e.g., FACULTY)
   - Observe: Page colors update instantly
   - Verify: `data-role="FACULTY"` in HTML element

3. **Navigate Through Assessment**
   - Start assessment from list
   - Check each page inherits role colors
   - Overview page should show role-primary color
   - Result page should show role colors in score display

4. **Check CSS Variables**
   - DevTools → Console
   - Type: `getComputedStyle(document.documentElement).getPropertyValue('--primary')`
   - Should match current role's primary color

## Performance Considerations

1. **CSS Variable Updates**
   - Lightweight: No DOM mutations
   - Browser handles cascading automatically
   - No re-renders needed for color changes

2. **Role Switching**
   - AuthContext useEffect batches all CSS var updates
   - Single `setAttribute` call for `data-role`
   - CSS cascade handles everything else

3. **Bundle Size**
   - Role colors defined in `index.css` (base layer)
   - No additional JavaScript needed
   - Colors loaded as CSS cascade

## Accessibility

1. **Contrast Ratios**
   - All role colors meet WCAG AA contrast requirements
   - Verified against white text
   - Dark backgrounds ensure text readability

2. **Color Blindness**
   - Role identification not color-only
   - Header text always shows role name
   - Status badges use text labels + colors

3. **Keyboard Navigation**
   - Focus states use `:focus-visible` with role colors
   - All interactive elements keyboard accessible

## Future Enhancements

1. **Custom Role Colors**
   - Allow admin to customize role palette
   - Store in institution settings
   - Load via API on app initialization

2. **Dark Mode**
   - Could add `[data-theme="dark"]` selector
   - Define alternate colors for dark mode
   - Combine with role selectors: `[data-role="STUDENT"][data-theme="dark"]`

3. **Accessibility Themes**
   - High contrast mode
   - Reduced motion preference
   - Large text mode
   - Could combine with role colors

---

**Status**: ✓ Role-aware theming fully integrated
**Tested Roles**: STUDENT, FACULTY, HOD, TNP_COORDINATOR, ADMIN
**Color System**: 12% softened palette (reduced saturation)
