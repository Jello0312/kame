// ═══════════════════════════════════════════════════════════════
// CustomTabBar — Floating pill-style tab bar
// ═══════════════════════════════════════════════════════════════
// Replaces the default flat tab bar with a modern floating pill
// design. Active tab gets a colored pill background that slides
// between tabs with spring animation.
//
// Visual reference: white rounded container, shadow, icon+label
// side-by-side, uppercase text, red active state for Explore.
// ═══════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Flame, Heart, User } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { FONTS } from '../src/theme/constants';

// ── Tab Configuration ───────────────────────────────────────

interface TabConfig {
  name: string;
  label: string;
  icon: typeof Flame;
  activeColor: string;
  activeBg: string;
  inactiveColor: string;
}

const TAB_CONFIG: TabConfig[] = [
  {
    name: 'explore',
    label: 'EXPLORE',
    icon: Flame,
    activeColor: '#EF4444',
    activeBg: '#FEF2F2',
    inactiveColor: '#6B7280',
  },
  {
    name: 'favorites',
    label: 'FAVORITES',
    icon: Heart,
    activeColor: '#374151',
    activeBg: '#F3F4F6',
    inactiveColor: '#6B7280',
  },
  {
    name: 'profile',
    label: 'PROFILE',
    icon: User,
    activeColor: '#374151',
    activeBg: '#F3F4F6',
    inactiveColor: '#6B7280',
  },
];

// ── Spring Config (matches reference framer-motion config) ──

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 230,
  mass: 1.2,
};

// ── Component ───────────────────────────────────────────────

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeIndex = state.index;

  // Track tab widths and positions for the sliding indicator
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>([]);
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  // Update indicator position when tab changes or layouts are measured
  useEffect(() => {
    if (tabLayouts.length === TAB_CONFIG.length && tabLayouts[activeIndex]) {
      const layout = tabLayouts[activeIndex];
      indicatorX.value = withSpring(layout.x, SPRING_CONFIG);
      indicatorWidth.value = withSpring(layout.width, SPRING_CONFIG);
    }
  }, [activeIndex, tabLayouts, indicatorX, indicatorWidth]);

  const handleTabLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      setTabLayouts((prev) => {
        const next = [...prev];
        next[index] = { x, width };
        return next;
      });
    },
    [],
  );

  const handleTabPress = useCallback(
    (routeName: string, routeKey: string) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: routeKey,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    },
    [navigation],
  );

  // Animated pill indicator style
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  const activeConfig = TAB_CONFIG[activeIndex];

  return (
    <View style={[styles.outerContainer, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.barContainer}>
        {/* Animated pill indicator (behind tabs) */}
        {tabLayouts.length === TAB_CONFIG.length && (
          <Animated.View
            style={[
              styles.indicator,
              { backgroundColor: activeConfig?.activeBg ?? '#F3F4F6' },
              indicatorStyle,
            ]}
          />
        )}

        {/* Tab buttons */}
        {TAB_CONFIG.map((tab, index) => {
          const isActive = activeIndex === index;
          const route = state.routes[index];
          if (!route) return null;

          const IconComponent = tab.icon;
          const color = isActive ? tab.activeColor : tab.inactiveColor;

          return (
            <Pressable
              key={tab.name}
              onPress={() => handleTabPress(route.name, route.key)}
              onLayout={(e) => handleTabLayout(index, e)}
              style={styles.tab}
            >
              <IconComponent
                size={20}
                color={color}
                strokeWidth={isActive ? 2 : 1.5}
                fill={isActive && tab.name === 'explore' ? color : 'none'}
              />
              <Text
                style={[
                  styles.label,
                  { color },
                  isActive && styles.labelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    height: 60,
    paddingHorizontal: 6,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 30,
    zIndex: 0,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 30,
    zIndex: 1,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  labelActive: {
    fontFamily: FONTS.bold,
  },
});
