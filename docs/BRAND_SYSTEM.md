# Kame Brand Design System
## For Claude Code — Read Before Building ANY UI Screen

> Extracted from official Kame pitch deck and prototype mockups
> Last Updated: 2026-03-10
> Status: LOCKED — do not deviate from these specs

---

## 1. COLOR PALETTE

### Primary Colors
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `warm-white` | `#F5F0E8` | rgb(245, 240, 232) | Primary app background (all screens) |
| `teal-bright` | `#48E6CD` | rgb(72, 230, 205) | Wordmark, buttons, selected chips, links, active states |
| `teal` | `#1AA39C` | rgb(26, 163, 156) | Subtle teal accents, section highlights |
| `white` | `#FFFFFF` | rgb(255, 255, 255) | Card surfaces, modals on warmWhite bg |

### Accent Colors
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `coral` | `#FA6869` | rgb(250, 104, 105) | Price text, coral end of CTA gradient |
| `coral-deep` | `#CC4968` | rgb(204, 73, 104) | CTA gradient start (left/top), deeper accent |
| `gold` | `#F7C13D` | rgb(247, 193, 61) | Section heading accents ("See It", "Swipe It", "Own It") |
| `green` | `#289B62` | rgb(40, 155, 98) | Like/heart button, success, positive feedback |
| `red` | `#E3393C` | rgb(227, 57, 60) | Dislike/X button, errors, destructive actions |
| `purple` | `#744DA6` | rgb(116, 77, 166) | Premium/upgrade banner |

### Neutral Colors
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `gray-100` | `#F8F9FB` | rgb(248, 249, 251) | Input field backgrounds, card surfaces |
| `gray-200` | `#E5E7EB` | rgb(229, 231, 235) | Borders, dividers |
| `gray-400` | `#9CA3AF` | rgb(156, 163, 175) | Placeholder text, disabled states |
| `gray-500` | `#6B7280` | rgb(107, 114, 128) | Secondary text on light |
| `gray-700` | `#374151` | rgb(55, 65, 81) | Primary text on light surfaces |

### Gradient Definitions
```
CTA Button Gradient:   linear-gradient(135deg, #CC4968 0%, #FA6869 100%)
Card Overlay Gradient: linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)
Premium Banner:        linear-gradient(135deg, #744DA6 0%, #9B6BC7 100%)
Teal Glow (subtle):   linear-gradient(135deg, #1AA39C 0%, #48E6CD 100%)
```

---

## 2. TYPOGRAPHY

### Font Family
```
Primary (headings + body):  "Plus Jakarta Sans"
Fallback stack:             "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Logo font:                  Custom italic/stylized "K" — use "Plus Jakarta Sans" italic bold as approximation
```

**Why Plus Jakarta Sans:** It matches the pitch deck's rounded, modern geometric sans-serif. Clean enough for body text, distinctive enough for headings. Free on Google Fonts.

### Type Scale (Mobile — React Native)
| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `heading-xl` | 28px | 700 (Bold) | 34px | Screen titles ("Your Style Preferences") |
| `heading-lg` | 22px | 700 (Bold) | 28px | Section headers, card titles |
| `heading-md` | 18px | 600 (SemiBold) | 24px | Subsection headers, total price |
| `body-lg` | 16px | 400 (Regular) | 22px | Primary body text, product names |
| `body-md` | 14px | 400 (Regular) | 20px | Secondary info, descriptions |
| `body-sm` | 12px | 500 (Medium) | 16px | Labels, badges, captions |
| `price` | 18px | 700 (Bold) | 22px | Price display (uses coral color) |
| `price-sm` | 14px | 600 (SemiBold) | 18px | Price in lists/grids |

### Text Color Rules
- On warm-white background: `gray-700` (#374151) for primary, `gray-500` (#6B7280) for secondary
- On white/light card surfaces: `gray-700` for primary, `gray-500` for secondary
- Teal accent (`teal-bright` #48E6CD) for headings, labels, and interactive text
- Prices: always `coral` (#FA6869)
- Links/interactive: `teal-bright` (#48E6CD)
- Gold accent only for special headings (onboarding step labels, section titles in marketing)

---

## 3. COMPONENT PATTERNS

### Buttons

**PRIMARY CTA — Commerce Actions (Buy Now, Proceed to Checkout, Generate My Styles):**
```
Background:    linear-gradient(135deg, #CC4968 0%, #FA6869 100%)
Text:          white, 16px, SemiBold
Height:        52px
Border Radius: 26px (fully rounded)
Shadow:        0 4px 12px rgba(204, 73, 104, 0.3)
Pressed:       opacity 0.85, scale 0.98
USE FOR:       Buy Now, Checkout, Premium upgrade, any money/commerce action
```

**PRIMARY CTA — Navigation/Onboarding (Next, Save, Continue, Log In, Sign Up):**
```
Background:    #48E6CD solid
Text:          #FFFFFF, 16px, SemiBold
Height:        52px
Border Radius: 26px (fully rounded)
Shadow:        0 4px 12px rgba(72, 230, 205, 0.25)
Pressed:       opacity 0.85, scale 0.98
USE FOR:       Next step, Save profile, Continue, Login, Register, all non-commerce CTAs
```

**Ghost/Outline Button:**
```
Background:    transparent
Border:        1.5px solid #48E6CD
Text:          #48E6CD, 14px, Medium
Height:        44px
Border Radius: 22px
```

**Text Link:**
```
Color:         #48E6CD
Font:          14px, Medium
Decoration:    none (underline on press)
```

### Swipe Action Buttons
```
Like (Heart):
  Size:        64px circle
  Background:  #289B62
  Icon:        white heart, 28px
  Shadow:      0 4px 16px rgba(40, 155, 98, 0.35)

Dislike (X):
  Size:        64px circle
  Background:  #E3393C
  Icon:        white X, 28px
  Shadow:      0 4px 16px rgba(227, 57, 60, 0.35)

Undo (↺):
  Size:        48px circle
  Background:  transparent
  Border:      1.5px solid #9CA3AF
  Icon:        gray-400 ↺, 22px
```

### Chips / Tags

**Unselected:**
```
Background:    transparent
Border:        1.5px solid #E5E7EB
Text:          #6B7280, 14px, Medium
Height:        36px
Border Radius: 18px
Padding:       0 16px
```

**Selected:**
```
Background:    #48E6CD
Border:        1.5px solid #48E6CD
Text:          #FFFFFF, 14px, SemiBold
Height:        36px
Border Radius: 18px
```

**Platform Badge (on cards):**
```
Amazon:   Background #FF9900, text white, 10px bold, rounded 8px
SHEIN:    Background #000000, text white, 10px bold, rounded 8px
```

### Cards

**Swipe Card (full-screen feed):**
```
Border Radius: 20px
Overflow:      hidden
Background:    #000000 as fallback (neutral dark behind image)
Image:         resizeMode cover, fills entire card
Overlay:       CardOverlayGradient at bottom (40% height)
Product info:  white text on overlay
Price:         coral (#FA6869), bold
Platform badge: top-right corner, 8px margin
```

**Product Grid Card (favorites):**
```
Border Radius: 16px
Background:    white
Shadow:        0 2px 8px rgba(0, 0, 0, 0.08)
Image:         aspect ratio 3:4, rounded top corners
Product name:  gray-700, 14px, medium, max 2 lines
Price:         coral (#FA6869), 16px, bold
Platform:      badge below price
Padding:       12px
```

### Input Fields

**Text Input:**
```
Height:        52px
Background:    #F8F9FB (gray-100)
Border:        1.5px solid #E5E7EB (gray-200)
Border Focus:  1.5px solid #48E6CD (teal-bright)
Border Radius: 12px
Text:          16px, gray-700
Placeholder:   gray-400
Padding:       0 16px
Label:         12px, Medium, gray-500, 6px margin bottom
```

### Tab Bar
```
Background:    white
Height:        56px + safe area bottom
Border Top:    0.5px solid #E5E7EB
Active Icon:   #FA6869 (coral) — tab navigation uses coral
Active Label:  #FA6869, 10px, SemiBold
Inactive Icon: #9CA3AF (gray-400)
Inactive Label:#9CA3AF, 10px, Regular
Icons:         24px, outline style (Lucide or similar)
Tabs:          Explore (compass), Favorites (heart), Profile (user)

NOTE: Tab bar uses coral for active state. All OTHER interactive elements
inside screens (buttons, links, chips, toggles) use teal-bright #48E6CD.
This creates a clear visual separation between navigation and content.
```

### Navigation / Headers
```
Background:    #48E6CD (teal) or transparent over content
Title:         white, 18px, Bold
Back Arrow:    white, 24px
Status Bar:    dark-content (dark text on light bg)
```

### Premium Upgrade Banner
```
Background:    linear-gradient(135deg, #744DA6 0%, #9B6BC7 100%)
Border Radius: 16px
Icon:          shopping cart emoji or crown, left side
Text:          white, 14px, "Upgrade to Premium for unlimited swipes"
Height:        56px
Padding:       0 20px
Margin:        16px horizontal
```

---

## 4. SPACING & LAYOUT

### Spacing Scale (multiples of 4)
```
xs:   4px
sm:   8px
md:   12px
lg:   16px
xl:   20px
2xl:  24px
3xl:  32px
4xl:  40px
```

### Screen Padding
```
Horizontal padding: 20px (matching pitch deck mockups)
Section gap:        24px
Card content pad:   16px
```

### Safe Areas
```
Top:    status bar height + 8px
Bottom: home indicator height + tab bar (56px)
```

---

## 5. ICONOGRAPHY

```
Style:     Outline (not filled), 1.5px stroke
Library:   Lucide React Native (lucide-react-native)
Size:      24px default, 20px in compact spaces, 28px for swipe buttons
Color:     Inherits from context (white on dark, gray-500 on light)

Key icons:
  Explore tab:    Compass
  Favorites tab:  Heart
  Profile tab:    User
  Like button:    Heart (filled white on green circle)
  Dislike button: X (white on red circle)
  Undo button:    RotateCcw
  Buy Now:        ExternalLink or ShoppingBag
  Back:           ChevronLeft
  Close:          X
  Camera:         Camera
  Gallery:        Image
  Settings:       Settings
  Logout:         LogOut
```

---

## 6. MOTION & ANIMATION

### Swipe Physics
```
Spring config:     damping: 15, stiffness: 150, mass: 1
Swipe threshold:   120px horizontal displacement
Card rotation:     translationX * 0.08 degrees (subtle tilt)
Exit animation:    spring to x: ±500, opacity: 0, duration ~300ms
Stack scale:       top=1.0, second=0.95 (scale up on promote)
```

### Transitions
```
Screen transitions: slide from right (default expo-router)
Modal:              slide from bottom, spring damping 20
Chip select:        scale 0.95 → 1.0, 150ms ease-out
Button press:       scale 0.98, opacity 0.85, 100ms
Loading shimmer:    teal → teal-bright → teal, 1.5s loop
```

### Loading States
```
Skeleton cards:  gray-100 (#F8F9FB) rectangles with shimmer
Spinner:         teal-bright (#48E6CD), native ActivityIndicator
Progress text:   "Generating outfit 3 of 20..." in teal-bright
```

---

## 7. WARM-WHITE-FIRST DESIGN PRINCIPLE

Kame is a **warm-white-first** app. The `#F5F0E8` (warmWhite) background is the dominant surface across all screens. Teal `#48E6CD` drives the brand identity through text, buttons, and interactive elements. White `#FFFFFF` surfaces appear inside cards and modals.

```
Primary screens (Explore, Feed):     Warm white background (#F5F0E8)
Onboarding form cards:               White card on warm-white bg
Modals (Product Detail):             White card on scrim overlay
Favorites grid:                      Warm white background, white product cards
Profile:                             Warm white background
Auth screens (Login/Register):       Warm white background
```

---

## 8. LOGO USAGE

### Official Logo Spec
- **Wordmark**: "Kame" — Plus Jakarta Sans Bold Italic, teal-bright `#48E6CD`
- **Subtext**: "AI FASHION" — Plus Jakarta Sans Regular, small caps, letter-spaced, gray-400 `#9CA3AF`
- **Primary expression**: warm-white background with teal wordmark

### Implementation
Use the `<KameLogo>` component (`components/KameLogo.tsx`) everywhere. Do not rebuild inline.

```jsx
// Default (28px) — profile header
<KameLogo />

// Large (48px) — auth screens
<KameLogo size={48} />

// Medium (32px) — onboarding wizard
<KameLogo size={32} />
```

The component renders "Kame" + "AI FASHION" subtext proportionally at any size.

---

## 9. IMPLEMENTATION FILES

### NativeWind / Tailwind Config (tailwind.config.js)
These tokens should be added to the project's Tailwind config so all screens use consistent values:
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        warmWhite: '#F5F0E8',
        teal: {
          DEFAULT: '#1AA39C',
          bright: '#48E6CD',
        },
        coral: {
          DEFAULT: '#FA6869',
          deep: '#CC4968',
        },
        gold: '#F7C13D',
        kame: {
          green: '#289B62',
          red: '#E3393C',
          purple: '#744DA6',
        },
      },
      fontFamily: {
        'heading': ['PlusJakartaSans-Bold'],
        'heading-semi': ['PlusJakartaSans-SemiBold'],
        'body': ['PlusJakartaSans-Regular'],
        'body-medium': ['PlusJakartaSans-Medium'],
      },
      borderRadius: {
        'card': '20px',
        'card-sm': '16px',
        'button': '26px',
        'chip': '18px',
        'input': '12px',
      },
    },
  },
};
```

### Expo Font Loading (app/_layout.tsx)
```js
import { useFonts } from 'expo-font';

const [fontsLoaded] = useFonts({
  'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
  'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
  'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
  'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
  'PlusJakartaSans-BoldItalic': require('../assets/fonts/PlusJakartaSans-BoldItalic.ttf'),
});
```

### Theme Constants File (src/theme/constants.ts)
```ts
export const COLORS = {
  warmWhite: '#F5F0E8', // Primary background
  teal: '#1AA39C',
  tealBright: '#48E6CD', // Brand primary: buttons, text, interactive
  // navy / navyDeep kept as @deprecated aliases until UI brand update sprint
  coral: '#FA6869',
  coralDeep: '#CC4968',
  gold: '#F7C13D',
  green: '#289B62',
  red: '#E3393C',
  purple: '#744DA6',
  white: '#FFFFFF',
  gray100: '#F8F9FB',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
} as const;

export const GRADIENTS = {
  cta: ['#CC4968', '#FA6869'],
  cardOverlay: ['transparent', 'rgba(0,0,0,0.45)'],
  premium: ['#744DA6', '#9B6BC7'],
  tealGlow: ['#1AA39C', '#48E6CD'],
} as const;

export const FONTS = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  boldItalic: 'PlusJakartaSans-BoldItalic',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const RADIUS = {
  card: 20,
  cardSm: 16,
  button: 26,
  chip: 18,
  input: 12,
} as const;

export const TYPE = {
  headingXl: { fontSize: 28, fontFamily: 'PlusJakartaSans-Bold', lineHeight: 34 },
  headingLg: { fontSize: 22, fontFamily: 'PlusJakartaSans-Bold', lineHeight: 28 },
  headingMd: { fontSize: 18, fontFamily: 'PlusJakartaSans-SemiBold', lineHeight: 24 },
  bodyLg:    { fontSize: 16, fontFamily: 'PlusJakartaSans-Regular', lineHeight: 22 },
  bodyMd:    { fontSize: 14, fontFamily: 'PlusJakartaSans-Regular', lineHeight: 20 },
  bodySm:    { fontSize: 12, fontFamily: 'PlusJakartaSans-Medium', lineHeight: 16 },
  price:     { fontSize: 18, fontFamily: 'PlusJakartaSans-Bold', lineHeight: 22, color: '#FA6869' },
  priceSm:   { fontSize: 14, fontFamily: 'PlusJakartaSans-SemiBold', lineHeight: 18, color: '#FA6869' },
} as const;
```
