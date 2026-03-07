import { View, Text } from 'react-native';

export default function FavoritesScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-kame-navy">
      <Text className="text-2xl font-bold text-white">Favorites</Text>
      <Text className="mt-2 text-kame-gray">Your liked items will appear here</Text>
    </View>
  );
}
