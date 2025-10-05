# SynapseAI Admin Design System

## Overview
This document defines the complete design system for SynapseAI admin pages, ensuring consistent, accessible, and professional UI across all administrative interfaces.

---

## Color Palette

### Primary Brand Colors

#### SynapseSkyBlue: `#50B9E8`
**Tailwind Class:** `synapseSkyBlue`
**Usage:**
- Primary action buttons
- Links and interactive elements
- Brand accents and highlights
- Hover states for secondary elements

**Examples:**
```tsx
<button className="bg-synapseSkyBlue text-white">Primary Action</button>
<a className="text-synapseSkyBlue hover:text-synapseDarkBlue">Click here</a>
```

#### SynapseDarkBlue: `#0A4D8B`
**Tailwind Class:** `synapseDarkBlue`
**Usage:**
- Page headings and titles
- Primary button hover states
- Section headers
- Important text emphasis

**Examples:**
```tsx
<h1 className="text-synapseDarkBlue">Admin Dashboard</h1>
<button className="bg-synapseSkyBlue hover:bg-synapseDarkBlue">Hover Me</button>
```

---

### Neutral Gray Scale

#### Neutral Black: `#1A202C`
**Tailwind Class:** `neutralBlack`
**Usage:** Body text, primary content

#### Neutral Gray Spectrum
| Shade | Hex | Class | Usage |
|-------|-----|-------|-------|
| 50 | `#F7FAFC` | `neutralGray-50` | Very light backgrounds, subtle overlays |
| 100 | `#F5F7FA` | `neutralGray-100` | Light backgrounds, page backgrounds |
| 200 | `#E2E8F0` | `neutralGray-200` | Borders, dividers |
| 300 | `#CBD5E0` | `neutralGray-300` | Disabled elements, inactive borders |
| 400 | `#A0AEC0` | `neutralGray-400` | Placeholder text, less important text |
| 500 | `#718096` | `neutralGray-500` | Secondary text, captions |
| 600 | `#4A5568` | `neutralGray-600` | Labels, form labels |
| 700 | `#2D3748` | `neutralGray-700` | Body text, secondary headings |
| 800 | `#1A202C` | `neutralGray-800` | Primary headings, dark text |
| 900 | `#171923` | `neutralGray-900` | Darkest text, maximum emphasis |

**Examples:**
```tsx
<div className="bg-neutralGray-100 p-6">
  <h2 className="text-neutralGray-900">Section Title</h2>
  <p className="text-neutralGray-700">Body text with good contrast</p>
  <span className="text-neutralGray-600">Label text</span>
</div>
```

---

### Status/Semantic Colors

#### Success Green: `#38A169`
**Tailwind Class:** `successGreen`
**Usage:** Success states, positive actions, verified status

#### Warning Red: `#E53E3E`
**Tailwind Class:** `warningRed`
**Usage:** Error states, destructive actions, rejected status

#### Caution Yellow: `#D69E2E`
**Tailwind Class:** `cautionYellow`
**Usage:** Warning states, pending status, attention needed

**Examples:**
```tsx
<span className="bg-green-100 text-successGreen px-3 py-1 rounded-full">
  Verified
</span>
<span className="bg-red-100 text-warningRed px-3 py-1 rounded-full">
  Rejected
</span>
<span className="bg-yellow-100 text-cautionYellow px-3 py-1 rounded-full">
  Pending
</span>
```

---

## Button System

### Primary Button
**Use for:** Main call-to-action, most important actions

```tsx
<Button variant="primary" size="md">
  Primary Action
</Button>

// Manual styling:
<button className="bg-synapseSkyBlue text-white px-6 py-3 rounded-button shadow-button hover:bg-synapseDarkBlue transition-all">
  Primary Action
</button>
```

**Style Specifications:**
- Background: `synapseSkyBlue` (#50B9E8)
- Text: `white` (#FFFFFF)
- Hover: `synapseDarkBlue` (#0A4D8B)
- Border Radius: `8px`
- Shadow: `0 2px 4px rgba(0, 0, 0, 0.1)`

---

### Secondary Button
**Use for:** Alternative actions, cancel buttons

```tsx
<Button variant="secondary" size="md">
  Secondary Action
</Button>

// Manual styling:
<button className="bg-transparent text-synapseDarkBlue border-2 border-synapseSkyBlue px-6 py-3 rounded-button hover:bg-synapseSkyBlue/10 transition-all">
  Secondary Action
</button>
```

**Style Specifications:**
- Background: `transparent`
- Text: `synapseDarkBlue` (#0A4D8B)
- Border: `2px solid synapseSkyBlue`
- Hover Background: `synapseSkyBlue` with 10% opacity

---

### Tertiary/Ghost Button
**Use for:** Less prominent actions, icon buttons

```tsx
<Button variant="tertiary" size="sm">
  <Eye className="w-4 h-4" />
  View
</Button>

// Manual styling:
<button className="bg-transparent text-synapseDarkBlue px-4 py-2 hover:text-synapseSkyBlue transition-colors">
  Tertiary Action
</button>
```

---

### Danger/Destructive Button
**Use for:** Delete, reject, remove actions

```tsx
<button className="bg-red-600 text-white px-4 py-2 rounded-button hover:bg-red-700 transition-all">
  Delete
</button>
```

---

## Badge/Status Indicators

### Success Badge (Verified)
```tsx
<span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold">
  ✅ Verified
</span>
```

### Warning Badge (Pending)
```tsx
<span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
  ⏳ Pending
</span>
```

### Danger Badge (Rejected)
```tsx
<span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold">
  ❌ Rejected
</span>
```

### Info Badge
```tsx
<span className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
  ℹ️ Info
</span>
```

---

## Typography System

### Headings

#### Page Title (H1)
```tsx
<h1 className="text-3xl font-heading font-bold text-synapseDarkBlue mb-2">
  Admin Dashboard
</h1>
```

#### Section Title (H2)
```tsx
<h2 className="text-2xl font-heading font-semibold text-synapseDarkBlue mb-4">
  Doctor Applications
</h2>
```

#### Card Title (H3)
```tsx
<h3 className="text-xl font-heading font-semibold text-synapseDarkBlue mb-2">
  Application Details
</h3>
```

### Body Text
```tsx
<p className="text-body text-neutralGray-700 leading-relaxed">
  This is body text with proper contrast and readability.
</p>
```

### Labels
```tsx
<label className="text-sm font-medium text-neutralGray-700 mb-2 block">
  Email Address
</label>
```

### Captions/Small Text
```tsx
<span className="text-xs text-neutralGray-600">
  Applied on: Jan 15, 2024
</span>
```

---

## Form Elements

### Input Fields
```tsx
<input
  type="text"
  className="w-full border border-neutralGray-300 rounded-input px-3 py-2 text-neutralGray-900 placeholder:text-neutralGray-400 focus:border-synapseSkyBlue focus:ring-2 focus:ring-synapseSkyBlue/20"
  placeholder="Enter value"
/>
```

### Textarea
```tsx
<textarea
  className="w-full border border-neutralGray-300 rounded-input px-3 py-2 text-neutralGray-900 placeholder:text-neutralGray-400 bg-white focus:border-synapseSkyBlue focus:ring-2 focus:ring-synapseSkyBlue/20"
  placeholder="Enter message"
  rows={4}
/>
```

### Select Dropdown
```tsx
<select className="w-full border border-neutralGray-300 rounded-input px-3 py-2 text-neutralGray-900 focus:border-synapseSkyBlue focus:ring-2 focus:ring-synapseSkyBlue/20">
  <option>Select option</option>
</select>
```

---

## Tables

### Table Header
```tsx
<thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
      Name
    </th>
  </tr>
</thead>
```

### Table Body
```tsx
<tbody className="bg-white divide-y divide-gray-200">
  <tr className="hover:bg-blue-50 transition-colors">
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
      John Doe
    </td>
  </tr>
</tbody>
```

---

## Cards

### Standard Card
```tsx
<div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
  <h3 className="text-xl font-heading font-semibold text-synapseDarkBlue mb-4">
    Card Title
  </h3>
  <p className="text-neutralGray-700">Card content goes here</p>
</div>
```

### Stats Card
```tsx
<div className="bg-white rounded-xl shadow-md p-6">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 bg-synapseSkyBlue/10 rounded-card flex items-center justify-center">
      <Users className="w-6 h-6 text-synapseSkyBlue" />
    </div>
    <div>
      <p className="text-2xl font-heading font-bold text-synapseDarkBlue">
        1,234
      </p>
      <p className="text-sm text-neutralGray-700">Total Users</p>
    </div>
  </div>
</div>
```

---

## Accessibility Guidelines

### Contrast Ratios (WCAG AA Compliance)

#### Text on Light Backgrounds
✅ **SAFE COMBINATIONS:**
- `text-gray-900` on `bg-white` (Ratio: 17.5:1)
- `text-gray-800` on `bg-white` (Ratio: 12.5:1)
- `text-gray-700` on `bg-white` (Ratio: 8.5:1)
- `text-neutralGray-700` on `bg-white` (Ratio: 9.2:1)
- `text-synapseDarkBlue` on `bg-white` (Ratio: 8.7:1)

❌ **FORBIDDEN COMBINATIONS:**
- `text-white` on `bg-white` (Ratio: 1:1) ⛔
- `text-gray-300` on `bg-white` (Ratio: 2.1:1) ⛔
- `text-gray-400` on `bg-white` (Ratio: 3.2:1) ⛔

#### Text on Dark Backgrounds
✅ **SAFE:**
- `text-white` on `bg-synapseDarkBlue` (Ratio: 8.7:1)
- `text-white` on `bg-gray-800` (Ratio: 12.5:1)

#### Button Contrast
✅ **SAFE:**
- White text on `bg-synapseSkyBlue` (Ratio: 3.8:1) - Meets AA for large text
- White text on `bg-synapseDarkBlue` (Ratio: 8.7:1) - Meets AAA

### Focus States
All interactive elements MUST have visible focus indicators:

```tsx
<button className="focus:ring-2 focus:ring-synapseSkyBlue focus:ring-offset-2">
  Accessible Button
</button>
```

### ARIA Labels
All icon-only buttons MUST have aria labels:

```tsx
<button aria-label="Delete application">
  <TrashIcon className="w-5 h-5" />
</button>
```

---

## Common Patterns

### Filter Tabs
```tsx
<div className="flex gap-2">
  {['all', 'pending', 'verified'].map((status) => (
    <button
      key={status}
      className={`
        px-4 py-2 rounded-lg font-medium text-sm transition-all
        ${activeStatus === status
          ? 'bg-synapseSkyBlue text-white shadow-md'
          : 'bg-neutralGray-100 text-neutralGray-700 hover:bg-neutralGray-300'
        }
      `}
    >
      {status}
    </button>
  ))}
</div>
```

### Icon Buttons with Tooltips
```tsx
<button
  className="p-2 text-synapseSkyBlue hover:bg-blue-50 rounded-lg transition-all"
  title="View details"
  aria-label="View details"
>
  <Eye className="w-4 h-4" />
</button>
```

### Loading States
```tsx
<button
  disabled
  className="bg-synapseSkyBlue text-white px-4 py-2 rounded-button disabled:opacity-50 disabled:cursor-not-allowed"
>
  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
  Loading...
</button>
```

---

## Development Checklist

Before committing ANY admin page code:

- [ ] All text has minimum 4.5:1 contrast ratio
- [ ] No white text on white/light backgrounds
- [ ] All buttons use proper variant classes
- [ ] All icon-only buttons have `aria-label`
- [ ] All interactive elements have focus states
- [ ] All form inputs have labels
- [ ] All status badges use semantic colors
- [ ] Hover states provide visual feedback
- [ ] Loading states are handled gracefully
- [ ] Mobile responsiveness is tested

---

## Quick Reference

### Text Colors
```tsx
// Headings: Always use dark colors
className="text-synapseDarkBlue"
className="text-neutralGray-900"

// Body text: Use medium-dark gray
className="text-neutralGray-700"
className="text-gray-700"

// Labels: Use medium gray
className="text-neutralGray-600"
className="text-gray-600"

// Links: Use brand colors
className="text-synapseSkyBlue hover:text-synapseDarkBlue"
```

### Background Colors
```tsx
// Page backgrounds
className="bg-neutralGray-100"

// Card backgrounds
className="bg-white"

// Hover states
className="hover:bg-gray-50"
className="hover:bg-blue-50"
```

### Status Colors
```tsx
// Success/Verified
className="bg-green-100 text-green-800"

// Warning/Pending
className="bg-amber-100 text-amber-800"

// Error/Rejected
className="bg-red-100 text-red-800"
```

---

## Testing Tools

### Browser DevTools
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Run Accessibility audit
4. Fix all contrast issues

### Manual Testing
1. View page on mobile (375px width)
2. Test all interactive elements
3. Tab through page with keyboard
4. Verify all focus indicators are visible

---

## Support

For questions about the design system:
- Check this documentation first
- Review existing admin components
- Follow the patterns in `ApplicationCard.tsx` and `ApplicationTable.tsx`

**Last Updated:** October 5, 2025
**Version:** 1.0.0
