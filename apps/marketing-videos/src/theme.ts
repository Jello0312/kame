/**
 * Kame Brand System for Remotion videos.
 * Mirrors apps/mobile/src/theme/constants.ts — single source of truth.
 */

export const COLORS = {
  warmWhite: '#FAF9F7',
  tealBright: '#48E6CD',
  white: '#FFFFFF',
  coral: '#FA6869',
  coralDeep: '#CC4968',
  gold: '#F7C13D',
  green: '#289B62',
  red: '#E3393C',
  purple: '#744DA6',
  body: '#444842',
  bodyLight: '#6E726C',
  textPrimaryDark: '#1A1C1B',
  bgSection: '#F4F3F1',
  gray400: '#9CA3AF',
  divider: '#C4C8C0',
} as const;

export const FONTS = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  boldItalic: 'PlusJakartaSans-BoldItalic',
  extraBold: 'PlusJakartaSans-ExtraBold',
} as const;

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;
