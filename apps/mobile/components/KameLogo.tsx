import { Image, type ImageStyle } from 'react-native';

// Aspect ratio of the official KAME_logo.png asset (landscape ~3:1)
const LOGO_ASPECT_RATIO = 3;

interface KameLogoProps {
  /** Controls the logo height; width scales proportionally. Default: 48 */
  size?: number;
  style?: ImageStyle;
}

export function KameLogo({ size = 48, style }: KameLogoProps) {
  return (
    <Image
      source={require('../assets/KAME_logo.png')}
      style={[{ height: size, width: size * LOGO_ASPECT_RATIO }, style]}
      resizeMode="contain"
    />
  );
}
