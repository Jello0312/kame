import { View, Text } from 'react-native';

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-kame-navy">
      <Text className="text-2xl font-bold text-white">Profile</Text>
      <Text className="mt-2 text-kame-gray">Your measurements and preferences</Text>
    </View>
  );
}
