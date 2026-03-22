import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useLocation } from '../../src/hooks/useLocation';
import { useSunTimes } from '../../src/hooks/useSunTimes';
import { SunTimesDisplay } from '../../src/components/SunTimesDisplay';
import { COLORS } from '../../src/utils/constants';

export default function MainLayout() {
  const { location, isLoading } = useLocation();
  const { todaySunTimes, isValid } = useSunTimes(location);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Persistent sun times */}
      <View style={{ paddingBottom: 8 }}>
        <SunTimesDisplay sunTimes={todaySunTimes} isValid={isValid} isRefreshing={isLoading} />
      </View>

      {/* Inner navigation */}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Alarms' }} />
        <Stack.Screen name="alarm/create" options={{ title: 'New Alarm' }} />
        <Stack.Screen name="alarm/[id]" options={{ title: 'Edit Alarm' }} />
      </Stack>
    </View>
  );
}
