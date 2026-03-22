import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import { useLocation } from '../src/hooks/useLocation';
import { useSunTimes } from '../src/hooks/useSunTimes';
import { useAlarmStore } from '../src/stores/alarmStore';
import {
  setupNotificationChannel,
  requestNotificationPermission,
  setupIOSCategories,
} from '../src/services/notificationService';
import { dismissAlarm, scheduleSnooze } from '../src/services/alarmScheduler';
import { scheduleNextDayAlarm } from '../src/services/nextDayScheduler';
import { useAppStateRecalculation } from '../src/hooks/useAppStateRecalculation';
import { registerBackgroundRecalculation } from '../src/tasks/backgroundRecalculate';
import { useSettingsStore } from '../src/stores/settingsStore';
import { SunTimesDisplay } from '../src/components/SunTimesDisplay';
import { COLORS } from '../src/utils/constants';

function CustomHeader({
  title,
  canGoBack,
  onBack,
  showSunTimes,
  sunTimes,
  isValid,
  isRefreshing,
}: {
  title: string;
  canGoBack: boolean;
  onBack: () => void;
  showSunTimes: boolean;
  sunTimes: any;
  isValid: boolean;
  isRefreshing: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: COLORS.background, paddingTop: insets.top }}>
      {/* Navigation bar */}
      <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
        {canGoBack ? (
          <Pressable onPress={onBack} style={{ marginRight: 12, padding: 4 }} hitSlop={8}>
            <Text style={{ color: COLORS.primary, fontSize: 17 }}>{'< Back'}</Text>
          </Pressable>
        ) : null}
        <Text style={{ color: COLORS.textPrimary, fontSize: 20, fontWeight: '700', flex: 1 }} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Sun times below header */}
      {showSunTimes && (
        <View style={{ paddingBottom: 8 }}>
          <SunTimesDisplay sunTimes={sunTimes} isValid={isValid} isRefreshing={isRefreshing} />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { location, isLoading: locationLoading, fetchLocation } = useLocation();
  const { todaySunTimes, isValid } = useSunTimes(location);

  const showSunTimes = !pathname.startsWith('/settings') && pathname !== '/alarm-trigger';

  useAppStateRecalculation();

  useEffect(() => {
    if (!location) {
      fetchLocation();
    }
  }, []);

  useEffect(() => {
    async function init() {
      await requestNotificationPermission();
      await setupNotificationChannel();
      await setupIOSCategories();
      await registerBackgroundRecalculation();
      useSettingsStore.getState().setOnboardingComplete();
    }
    init();
  }, []);

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      const alarmId = detail.notification?.data?.alarmId as string | undefined;
      const isAlarm = detail.notification?.data?.type === 'alarm-trigger';

      switch (type) {
        case EventType.DELIVERED:
          if (isAlarm && alarmId) {
            router.push({ pathname: '/alarm-trigger', params: { alarmId } });
          }
          break;
        case EventType.PRESS:
          if (alarmId) {
            router.push({ pathname: '/alarm-trigger', params: { alarmId } });
          }
          break;
        case EventType.ACTION_PRESS:
          if (detail.pressAction?.id === 'snooze' && alarmId) {
            const alarm = useAlarmStore.getState().alarms[alarmId];
            if (alarm) {
              scheduleSnooze(alarm, alarm.snoozeDurationMinutes);
            }
            dismissAlarm(alarmId);
          } else if (detail.pressAction?.id === 'dismiss' && alarmId) {
            dismissAlarm(alarmId);
            scheduleNextDayAlarm(alarmId);
          }
          break;
      }
    });

    return unsubscribe;
  }, [router]);

  useEffect(() => {
    async function checkInitialNotification() {
      const initial = await notifee.getInitialNotification();
      if (initial) {
        const alarmId = initial.notification?.data?.alarmId as string | undefined;
        if (alarmId) {
          router.push({ pathname: '/alarm-trigger', params: { alarmId } });
        }
      }
    }
    checkInitialNotification();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
          header: ({ options, navigation, route }) => {
            const title = (options.title ?? route.name) as string;
            const canGoBack = navigation.canGoBack() && route.name !== 'index';

            return (
              <CustomHeader
                title={title}
                canGoBack={canGoBack}
                onBack={() => navigation.goBack()}
                showSunTimes={showSunTimes}
                sunTimes={todaySunTimes}
                isValid={isValid}
                isRefreshing={locationLoading}
              />
            );
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Sunrise' }} />
        <Stack.Screen name="alarm/create" options={{ title: 'New Alarm' }} />
        <Stack.Screen name="alarm/[id]" options={{ title: 'Edit Alarm' }} />
        <Stack.Screen
          name="alarm-trigger"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
