// ═══════════════════════════════════════════════════════════════
// KAME THEME CONSTANTS
// ═══════════════════════════════════════════════════════════════
// Source of truth for all visual tokens in the Kame mobile app.
// Extracted from official Kame pitch deck and prototype mockups.
// Import this file instead of hardcoding hex values.
// ═══════════════════════════════════════════════════════════════

export const COLORS = {
  // ── Primary ──
  navy: '#112836',
  navyDeep: '#03213B',
  teal: '#1AA39C',
  tealBright: '#48E6CD',
  white: '#FFFFFF',
  offWhite: '#F7FFFF',

  // ── Accent ──
  coral: '#FA6869',
  coralDeep: '#CC4968',
  gold: '#F7C13D',
  green: '#289B62',
  red: '#E3393C',
  purple: '#744DA6',

  // ── Neutral ──
  gray100: '#F8F9FB',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',

  // ── Semantic ──
  background: '#112836',
  surface: '#03213B',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textOnLight: '#374151',
  textSecondaryOnLight: '#6B7280',
  price: '#FA6869',
  link: '#48E6CD',
  success: '#289B62',
  error: '#E3393C',
  inputBg: '#F8F9FB',
  inputBorder: '#E5E7EB',
  inputBorderFocus: '#48E6CD',
  divider: '#E5E7EB',

  // ── Logo ──
  logo: '#48E6CD', // "Kame" rendered in all teal-bright BoldItalic

  // ── Tab Bar ──
  tabActive: '#FA6869',   // Coral for active tab icon + label
  tabInactive: '#9CA3AF', // Gray for inactive tabs

  // ── CTA Buttons ──
  ctaCommerce: '#FA6869',   // Coral gradient for Buy Now, Checkout, commerce
  ctaNavigation: '#48E6CD', // Teal solid for Next, Save, Login, onboarding

  // ── Platform Badges ──
  amazon: '#FF9900',
  shein: '#000000',
} as const;

export const GRADIENTS = {
  cta: ['#CC4968', '#FA6869'] as const,
  ctaAngle: 135,
  cardOverlay: ['transparent', 'rgba(17,40,54,0.85)'] as const,
  premium: ['#744DA6', '#9B6BC7'] as const,
  tealGlow: ['#1AA39C', '#48E6CD'] as const,
  glowLike: ['rgba(40, 155, 98, 0.70)', 'transparent'] as const,
  glowDislike: ['rgba(227, 57, 60, 0.70)', 'transparent'] as const,
} as const;

export const FONTS = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  boldItalic: 'PlusJakartaSans-BoldItalic',
} as const;

export const TYPE = {
  headingXl: { fontSize: 28, fontFamily: FONTS.bold, lineHeight: 34 },
  headingLg: { fontSize: 22, fontFamily: FONTS.bold, lineHeight: 28 },
  headingMd: { fontSize: 18, fontFamily: FONTS.semiBold, lineHeight: 24 },
  bodyLg:    { fontSize: 16, fontFamily: FONTS.regular, lineHeight: 22 },
  bodyMd:    { fontSize: 14, fontFamily: FONTS.regular, lineHeight: 20 },
  bodySm:    { fontSize: 12, fontFamily: FONTS.medium, lineHeight: 16 },
  price:     { fontSize: 18, fontFamily: FONTS.bold, lineHeight: 22, color: COLORS.coral },
  priceSm:   { fontSize: 14, fontFamily: FONTS.semiBold, lineHeight: 18, color: COLORS.coral },
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
  buttonSm: 22,
  chip: 18,
  input: 12,
  badge: 8,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaButton: {
    shadowColor: COLORS.coralDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  tealButton: {
    shadowColor: COLORS.tealBright,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  likeButton: {
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  dislikeButton: {
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const SWIPE = {
  threshold: 120,
  rotationFactor: 0.08,
  springDamping: 15,
  springStiffness: 150,
  exitX: 500,
  stackScaleSecond: 0.95,
  stackScaleThird: 0.9,
  stackOffsetSecond: 10,
  stackOffsetThird: 20,
} as const;

export const COMPONENT = {
  buttonHeight: 52,
  buttonHeightSm: 44,
  chipHeight: 36,
  inputHeight: 52,
  tabBarHeight: 56,
  swipeButtonSize: 64,
  undoButtonSize: 48,
  iconSize: 24,
  iconSizeSm: 20,
  iconSizeLg: 28,
  screenPadding: 20,
} as const;
