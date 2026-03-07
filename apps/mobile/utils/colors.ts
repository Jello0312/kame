export const colors = {
  navy: '#1A2B3D',
  teal: '#00BFA5',
  coral: '#FF4D6A',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type KameColor = keyof typeof colors;
