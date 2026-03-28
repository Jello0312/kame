# Kame Brand Design System

## For Claude Code — Read Before Building ANY UI Screen

> Single source of truth for all design, marketing, and development work.
> Synced from live landing page (kame-ai.com) + Kame Brand Kit — Brand Audit March 23, 2026.
> Last Updated: 2026-03-23
> Status: LOCKED — do not deviate from these specs

---

## 1. COLOR PALETTE

### Active Palette

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `teal` | `#48E6CD` | 72, 230, 205 | Brand primary — headlines, logo, tags, icons, interactive elements, CTA buttons |
| `coral` | `#FA6869` | 250, 104, 105 | Prices, commerce CTAs, highlights, emphasis |
| `warmWhite` | `#FAF9F7` | 250, 249, 247 | Primary app background (screens, splash) |
| `white` | `#FFFFFF` | 255, 255, 255 | Card surfaces, modals, input backgrounds |
| `body` | `#444842` | 68, 72, 66 | Body/paragraph text — warm green-gray |
| `body-light` | `#6E726C` | 110, 114, 108 | Captions, placeholders, secondary text |
| `text-primary` | `#1A1C1B` | 26, 28, 27 | Near-black emphasis text (optional) |
| `bg-section` | `#F4F3F1` | 244, 243, 241 | Section backgrounds |

### Additional Accent Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `coral-deep` | `#CC4968` | 204, 73, 104 | CTA gradient start (legacy), deeper accent |
| `gold` | `#F7C13D` | 247, 193, 61 | Section heading accents ("See It", "Swipe It", "Own It") |
| `green` | `#289B62` | 40, 155, 98 | Like/heart button, success, positive feedback |
| `red` | `#E3393C` | 227, 57, 60 | Dislike/X button, errors, destructive actions |
| `purple` | `#744DA6` | 116, 77, 166 | Premium/upgrade banner |

### Neutral / UI Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `input-bg` | `#E9E8E6` | 233, 232, 230 | Input field backgrounds |
| `divider` | `#C4C8C0` | 196, 200, 192 | Dividers, separators |
| `border-light` | `#E5E7EB` | 229, 231, 235 | Card borders, input borders |
| `gray-400` | `#9CA3AF` | 156, 163, 175 | Disabled states, inactive tab icons |
| `gray-500` | `#6B7280` | 107, 114, 128 | Legacy secondary text (prefer `body` #444842) |
| `gray-700` | `#374151` | 55, 65, 81 | Legacy primary text |
| `phone-black` | `#171717` | 23, 23, 23 | Phone mockup frames |
| `error` | `#AD3035` | 173, 48, 53 | Form errors, deep coral |

### Decorative Fills (Blobs & Backgrounds)

| Token | Value | Usage |
|-------|-------|-------|
| Teal blob (strong) | `rgba(72, 230, 205, 0.12)` | App background decorative blob |
| Teal blob (soft) | `rgba(72, 230, 205, 0.07)` | Secondary teal blob, softer |
| Coral blob | `rgba(250, 104, 105, 0.06)` | Subtle coral circle decorations |
| Teal tint | `rgba(72, 230, 205, 0.12)` | Icon circle backgrounds, ghost tags |
| Coral tint | `rgba(250, 104, 105, 0.10)` | Coral icon circle backgrounds |
| Deco circle | `1px solid rgba(72, 230, 205, 0.08)` | 400px outline circle, background accent |
| Deco line | `rgba(200, 196, 192, 0.15)` | Thin horizontal accent line |

### Gradient Definitions

```
CTA Button Gradient:   linear-gradient(135deg, #CC4968 0%, #FA6869 100%)  ← legacy, see §5 for current CTA spec
Card Overlay Gradient: linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)
Premium Banner:        linear-gradient(135deg, #744DA6 0%, #9B6BC7 100%)
```

### Retired Colors — DO NOT USE

```
#1C1C1C  #112836  #1A2B3D  #00BFA5  #FF4D6A  #1AA39C  #F7F5F1
#F5F0E8  #5A5A58  #7A7A78
```

> **Important:** `#1AA39C` (old teal) is fully retired. Use only `#48E6CD` for all teal usage.
> `#F5F0E8` (old warmWhite/bone) retired — use `#FAF9F7`. `#5A5A58` / `#7A7A78` (old body text) retired — use `#444842` / `#6E726C`.

---

## 2. TYPOGRAPHY

### Font Family

**Plus Jakarta Sans** — the primary font across all Kame materials.

**Noto Serif** (400 Regular) — secondary font, used for card step numbers on the landing page only.

Weights in use: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold).

Google Fonts import:
```
https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,600;1,700;1,800
```

### Type Scale (Marketing / Web — at 320px reference card)

| Element | Class | Weight | Size* | Line-height | Letter-spacing | Color |
|---------|-------|--------|-------|-------------|---------------|-------|
| Hero headline | `.hx` | 800 ExtraBold | 27-42px | 1.06 | -1.5px | Teal |
| Section headline | `.h1` | 700 Bold | 17-22px | 1.14 | -0.8px | Teal |
| Subheadline | `.hm` | 700 Bold | 13-17px | 1.20 | -0.3px | Teal |
| Body text | `.bd` | 400 Regular | 11-13px | 1.55 | 0 | Body (#444842) |
| Tag / chip label | `.tag` | 700 Bold | 8-9px | — | 1.2px | Uppercase |
| Logo "Kame" | — | 700 Bold Italic | 50px | — | -1px | Teal |
| Logo subtitle | `.logo-s` | 600 SemiBold | 8px | — | 4px | Teal @ 50% opacity |

*Sizes at 320px reference card. Scale proportionally for other output sizes.*

### Type Scale (Mobile — React Native)

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `heading-xl` | 28px | 700 (Bold) | 34px | Screen titles |
| `heading-lg` | 22px | 700 (Bold) | 28px | Section headers, card titles |
| `heading-md` | 18px | 600 (SemiBold) | 24px | Subsection headers, total price |
| `body-lg` | 16px | 400 (Regular) | 22px | Primary body text, product names |
| `body-md` | 14px | 400 (Regular) | 20px | Secondary info, descriptions |
| `body-sm` | 12px | 500 (Medium) | 16px | Labels, badges, captions |
| `price` | 18px | 700 (Bold) | 22px | Price display (uses coral color) |
| `price-sm` | 14px | 600 (SemiBold) | 18px | Price in lists/grids |

### Text Color Rules

- Body/paragraph text: `body` (#444842) — warm green-gray
- Captions, placeholders, secondary: `body-light` (#6E726C)
- Headlines, labels, interactive: `teal` (#48E6CD)
- Prices: always `coral` (#FA6869)
- Text on teal/coral surfaces: `white` (#FFFFFF)

### Accent Color in Text

- **Coral `.ac` class**: Used to highlight key words within teal headlines (e.g., "is **broken.**")
- **Teal bold**: Used to emphasize words in body text (e.g., "on **your** body")

---

## 3. LOGO

### Primary Logo

**"Kame"** in Plus Jakarta Sans **Bold Italic**, color `#48E6CD` (teal).

Below it: **"FASHION AI"** in Plus Jakarta Sans **SemiBold**, small caps, letter-spacing 4px, teal at **50% opacity**.

### Rules

- Logo is always a single teal color — never split, never outlined, never gradient
- Minimum clear space: 1× the height of the "K" on all sides
- On dark backgrounds: use white `#FFFFFF` instead of teal
- Watermark usage: bottom-left of slides, 30% opacity, 10-12px

### Logo Files

- `KAME_logo.png` — primary logo on transparent background
- SVG text rendering in HTML: use the `.logo` CSS class

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

The component renders the official `KAME_logo.png` asset proportionally at any size.

---

## 4. DESIGN ELEMENTS

### Blobs (Decorative Circles)

- Simple filled circles — **no borders, no strokes**
- Teal blob: `background: rgba(72, 230, 205, 0.07)` — very soft, barely visible
- Coral blob: `background: rgba(250, 104, 105, 0.05)` — even softer
- Always **bleed off slide edges** (partially cut off)
- Maximum 2 blobs per slide

### Rings (Outline Circles)

- Very subtle teal outline: `border: 1.5px solid rgba(72, 230, 205, 0.1)`
- Transparent fill
- Maximum 1-2 per slide, usually paired with a blob

### Dots (Micro Decorations)

- Tiny circles: 4-5px diameter
- Teal or coral at 15-20% opacity
- Maximum 2 per slide
- Placed asymmetrically for visual interest

### Dividers — Kame Signature

The double-line divider is a distinctive Kame design element:

```
[── teal bar ──] [─ coral accent ─]
```

- Teal bar: `height: 1.5px; background: var(--teal); opacity: 0.3` — width 16-36px
- Coral accent: `height: 1.5px; background: var(--coral); opacity: 0.35` — width 6-14px
- 4px gap between the two bars
- **Never use a single line divider**

---

## 5. COMPONENT PATTERNS

### Tags / Chips

| Variant | Background | Text Color | Border |
|---------|-----------|------------|--------|
| `tag-teal` | `#48E6CD` solid | `#FFFFFF` white | None |
| `tag-coral` | `#FA6869` solid | `#FFFFFF` white | None |
| `tag-ghost` | `rgba(72, 230, 205, 0.1)` | `#48E6CD` teal | None |

All tags: `border-radius: 14px; padding: 5px 14px; font-size: 9px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase`

### CTA Buttons (Marketing / Brand Kit)

```
Fill:           #FA6869 coral
Text:           #FFFFFF white, 700 bold
Border-radius:  26px (fully rounded pill)
Shadow:         0 4px 18px rgba(250, 104, 105, 0.22)
Always includes arrow → icon
Padding:        13px 28px
Font size:      13-14px
```

### Mobile App CTA Buttons

**PRIMARY CTA — Commerce Actions (Buy Now, Proceed to Checkout, Generate My Styles):**
```
Background:    linear-gradient(135deg, #CC4968 0%, #FA6869 100%)
Text:          #FFFFFF (white), 16px, SemiBold
Height:        52px
Border Radius: 26px (fully rounded)
Shadow:        0 4px 12px rgba(204, 73, 104, 0.3)
Pressed:       opacity 0.85, scale 0.98
```

**PRIMARY CTA — Navigation/Onboarding (Next, Save, Continue, Log In, Sign Up):**
```
Background:    #48E6CD solid
Text:          #FFFFFF (white), 16px, SemiBold
Height:        52px
Border Radius: 26px (fully rounded)
Shadow:        0 4px 12px rgba(72, 230, 205, 0.25)
Pressed:       opacity 0.85, scale 0.98
```

**Ghost/Outline Button:**
```
Background:    transparent
Border:        1.5px solid #48E6CD
Text:          #48E6CD, 14px, Medium
Height:        44px
Border Radius: 22px
```

### Step Numbers

- Steps 01, 02: Teal circle `#48E6CD`, bone text
- Final step 03: Coral circle `#FA6869`, bone text
- Circle size: 32px diameter
- Font: 12px, 800 ExtraBold

### Icon Circles

- Teal: `background: rgba(72, 230, 205, 0.12)` — size 34px
- Coral: `background: rgba(250, 104, 105, 0.1)` — size 34px
- SVG icons inside: 15px, stroke style (not filled), 2px stroke width

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

### Phone Mockups (Marketing Slides)
```
Body:          white #FFFFFF, rounded corners 12-16px
Border:        2px solid rgba(72, 230, 205, 0.18)
Shadow:        0 3px 14px rgba(0, 0, 0, 0.05)
Notch bar:     small rounded rectangle, teal at 12% opacity
Screen area:   dashed border rgba(72, 230, 205, 0.15), teal tint fill
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
Product name:  body (#444842), 14px, medium, max 2 lines
Price:         coral (#FA6869), 16px, bold
Platform:      badge below price
Padding:       12px
```

### Input Fields
```
Height:        52px
Background:    #E9E8E6 (input-bg)
Border:        1.5px solid #E5E7EB (border-light)
Border Focus:  1.5px solid #48E6CD (teal)
Border Radius: 12px
Text:          16px, body (#444842)
Placeholder:   body-light (#6E726C)
Padding:       0 16px
Label:         12px, Medium, body-light (#6E726C), 6px margin bottom
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
inside screens (buttons, links, chips, toggles) use teal #48E6CD.
This creates a clear visual separation between navigation and content.
```

### Platform Badges
```
Amazon:   Background #FF9900, text white, 10px bold, rounded 8px
SHEIN:    Background #000000, text white, 10px bold, rounded 8px
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

## 6. LAYOUT RULES

### General Principles

- Clean, minimal, editorial — generous whitespace
- Left-aligned for content slides (icon list, how it works, feature+phone)
- Center-aligned for impact slides (brand identity, big stat, question, CTA)
- No clutter — every element earns its place

### Slide Structure

- **Watermark**: "Kame" italic, bottom-left, 30% opacity — on every slide
- **Swipe hint**: "Swipe →" bottom-right, teal, 30% opacity — carousel slides only
- **Padding**: 36-52px from edges (at 320px reference)
- **Background**: Pure white `#FFFFFF`

### Photography Placeholders

- Teal variant: `background: rgba(72, 230, 205, 0.07); border: 1.5px dashed rgba(72, 230, 205, 0.15)`
- Coral variant: `background: rgba(250, 104, 105, 0.05); border: 1.5px dashed rgba(250, 104, 105, 0.12)`
- Always include a subtle SVG icon + label text inside

---

## 7. SPACING & LAYOUT (Mobile App)

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

## 8. ICONOGRAPHY

```
Style:     Outline (not filled), 1.5px stroke
Library:   Lucide React Native (lucide-react-native)
Size:      24px default, 20px in compact spaces, 28px for swipe buttons
Color:     Inherits from context (white on dark, body #444842 on light)

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

## 9. MOTION & ANIMATION

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
Loading shimmer:    teal → teal → teal, 1.5s loop
```

### Loading States
```
Skeleton cards:  gray-100 (#F8F9FB) rectangles with shimmer
Spinner:         teal (#48E6CD), native ActivityIndicator
Progress text:   "Generating outfit 3 of 20..." in teal
```

---

## 10. WARM-WHITE-FIRST DESIGN PRINCIPLE

Kame is a **warm-white-first** app. The `#FAF9F7` (warmWhite) background is the dominant surface across all screens, with subtle decorative blobs, circles, and lines via the `<AppBackground>` component. Teal `#48E6CD` drives the brand identity through headlines, buttons, and interactive elements. White `#FFFFFF` surfaces appear inside cards and modals.

```
Primary screens (Explore, Feed):     Warm white background (#FAF9F7) + AppBackground decorations
Onboarding form cards:               White card on warm-white bg
Modals (Product Detail):             White card on scrim overlay
Favorites grid:                      Warm white background (#FAF9F7) + AppBackground decorations
Profile:                             Warm white background (#FAF9F7) + AppBackground decorations
Auth screens (Login/Register):       AuthBackground (gradient + animated blobs)
```

### Decorative Background Elements (AppBackground)

Tab screens (Explore, Favorites, Profile) use the `<AppBackground>` component which renders:
- 2 teal blobs: `rgba(72, 230, 205, 0.12)` and `rgba(72, 230, 205, 0.07)` — slow drift animation
- 1 coral blob: `rgba(250, 104, 105, 0.06)` — very subtle
- 1 decorative circle: 400px, `border: 1px solid rgba(72, 230, 205, 0.08)`
- 1 accent line: thin horizontal `rgba(200, 196, 192, 0.15)`

Auth screens keep `<AuthBackground>` (stronger gradient + more prominent blobs).

---

## 11. IMPLEMENTATION FILES

### NativeWind / Tailwind Config (tailwind.config.js)
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        warmWhite: '#FAF9F7',  // Updated from #F5F0E8 per brand audit
        teal: {
          DEFAULT: '#48E6CD',  // Bright teal — headlines, CTAs, interactive
          bright: '#48E6CD',   // kept for backward compat
        },
        coral: {
          DEFAULT: '#FA6869',
          deep: '#CC4968',     // CTA gradient — keep unchanged
        },
        body: {
          DEFAULT: '#444842',  // Updated from #5A5A58
          light: '#6E726C',    // Updated from #7A7A78
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
        'heading-extra': ['PlusJakartaSans-ExtraBold'],
        'body': ['PlusJakartaSans-Regular'],
        'body-medium': ['PlusJakartaSans-Medium'],
      },
      borderRadius: {
        'card': '20px',
        'card-sm': '16px',
        'button': '26px',
        'chip': '14px',       // updated from 18px per brand kit
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
  'PlusJakartaSans-ExtraBold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
});
```

### Theme Constants File (src/theme/constants.ts)
```ts
export const COLORS = {
  warmWhite: '#FAF9F7',   // Primary background (updated from #F5F0E8)
  tealBright: '#48E6CD',  // Brand primary: headlines, buttons, interactive
  coral: '#FA6869',
  coralDeep: '#CC4968',   // CTA gradient — keep for button styling
  body: '#444842',        // Body text — warm green-gray (updated from #5A5A58)
  bodyLight: '#6E726C',   // Captions, secondary text (updated from #7A7A78)
  bgSection: '#F4F3F1',   // Section backgrounds
  textPrimaryDark: '#1A1C1B', // Near-black emphasis text
  error: '#AD3035',       // Form errors (updated from #E3393C)
  inputBg: '#E9E8E6',    // Input backgrounds (updated from #F8F9FB)
  divider: '#C4C8C0',    // Dividers (updated from #E5E7EB)
  // ... gold, green, red, purple, grays unchanged
} as const;

export const GRADIENTS = {
  cta: ['#CC4968', '#FA6869'],  // CTA gradient — unchanged
  cardOverlay: ['transparent', 'rgba(0,0,0,0.45)'],
  premium: ['#744DA6', '#9B6BC7'],
} as const;

export const FONTS = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  boldItalic: 'PlusJakartaSans-BoldItalic',
  extraBold: 'PlusJakartaSans-ExtraBold',
} as const;
```
