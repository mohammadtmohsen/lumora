import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocation } from '../../src/hooks/useLocation';
import { useSunTimes } from '../../src/hooks/useSunTimes';
import { SunTimesDisplay } from '../../src/components/SunTimesDisplay';
import { COLORS } from '../../src/utils/constants';

export default function MainLayout() {
  const insets = useSafeAreaInsets();
  const { location, isLoading } = useLocation();
  const { todaySunTimes, isValid } = useSunTimes(location);

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
        header: ({ options, navigation, route }) => {
          const title = options.title ?? '';
          const canGoBack = navigation.canGoBack() && route.name !== 'index';

          return (
            <View style={{ backgroundColor: COLORS.background, paddingTop: insets.top }}>
              {/* Title bar */}
              <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                {canGoBack && (
                  <Pressable
                    onPress={() => navigation.goBack()}
                    hitSlop={8}
                    style={{ marginRight: 8 }}
                  >
                    <Text style={{ color: COLORS.primary, fontSize: 17 }}>{'‹ Back'}</Text>
                  </Pressable>
                )}
                <Text
                  style={{ color: COLORS.textPrimary, fontSize: 20, fontWeight: '700', flex: 1 }}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>

              {/* Sun times below title */}
              <View style={{ paddingBottom: 8 }}>
                <SunTimesDisplay sunTimes={todaySunTimes} isValid={isValid} isRefreshing={isLoading} />
              </View>
            </View>
          );
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Sunrise' }} />
      <Stack.Screen name="alarm/create" options={{ title: 'New Alarm' }} />
      <Stack.Screen name="alarm/[id]" options={{ title: 'Edit Alarm' }} />
    </Stack>
  );
}
