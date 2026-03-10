import { Text, type TextStyle } from 'react-native';
import { COLORS, FONTS } from '../src/theme/constants';

interface KameLogoProps {
  size?: number;
  style?: TextStyle;
}

export function KameLogo({ size = 28, style }: KameLogoProps) {
  return (
    <Text
      style={[
        {
          fontFamily: FONTS.boldItalic,
          fontSize: size,
          color: COLORS.logo,
        },
        style,
      ]}
    >
      Kame
    </Text>
  );
}
