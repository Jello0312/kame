import { Text, View, type ViewStyle } from 'react-native';
import { COLORS, FONTS } from '../src/theme/constants';

interface KameLogoProps {
  size?: number;
  style?: ViewStyle;
}

export function KameLogo({ size = 28, style }: KameLogoProps) {
  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <Text
        style={{
          fontFamily: FONTS.boldItalic,
          fontSize: size,
          color: COLORS.logo,
        }}
      >
        Kame
      </Text>
      <Text
        style={{
          fontFamily: FONTS.regular,
          fontSize: Math.max(8, Math.round(size * 0.3)),
          color: COLORS.gray400,
          letterSpacing: 4,
          marginTop: 2,
        }}
      >
        AI FASHION
      </Text>
    </View>
  );
}
