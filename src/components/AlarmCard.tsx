import React, { useCallback, useEffect } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import type { Alarm } from '../models/types';
import { formatOffset, formatTime, formatTime24, formatTimeUntil } from '../utils/timeUtils';
import { SunriseIcon, SunsetIcon, AlarmIcon } from './Icons';
import { COLORS } from '../utils/constants';

interface Props {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
}

const DELETE_THRESHOLD = -80;
const TRACK_W = 48;
const TRACK_H = 28;
const THUMB_SIZE = 22;
const THUMB_TRAVEL = TRACK_W - THUMB_SIZE - 6;

function AnimatedToggle({
  value,
  onValueChange,
  activeColor,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: () => void;
  activeColor: string;
  accessibilityLabel?: string;
}) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, { damping: 15, stiffness: 180 });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [COLORS.border, activeColor],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  return (
    <Pressable
      onPress={onValueChange}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <Animated.View
        style={[
          {
            width: TRACK_W,
            height: TRACK_H,
            borderRadius: TRACK_H / 2,
            justifyContent: 'center',
            paddingHorizontal: 3,
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: '#ffffff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 3,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

export function AlarmCard({ alarm, onToggle, onPress, onDelete }: Props) {
  const isAbsolute = alarm.type === 'absolute';
  const eventLabel = isAbsolute ? 'Fixed time' : alarm.referenceEvent === 'sunrise' ? 'Sunrise' : 'Sunset';
  const EventIconComponent = isAbsolute ? AlarmIcon : alarm.referenceEvent === 'sunrise' ? SunriseIcon : SunsetIcon;
  const eventColor = isAbsolute ? COLORS.accent : alarm.referenceEvent === 'sunrise' ? COLORS.sunrise : COLORS.sunset;

  const translateX = useSharedValue(0);

  const confirmDelete = useCallback(() => {
    Alert.alert('Delete Alarm', `Delete "${alarm.name}"?`, [
      { text: 'Cancel', style: 'cancel', onPress: () => { translateX.value = withSpring(0); } },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(alarm.id) },
    ]);
  }, [alarm.id, alarm.name, onDelete]);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -120);
      }
    })
    .onEnd((event) => {
      if (event.translationX < DELETE_THRESHOLD) {
        translateX.value = withTiming(-120);
        runOnJS(confirmDelete)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 10, borderRadius: 14, overflow: 'hidden' }}>
      {/* Delete background */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 120,
          backgroundColor: COLORS.danger,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>Delete</Text>
      </View>

      {/* Card */}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={cardStyle}>
          <Pressable
            onPress={() => onPress(alarm.id)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? COLORS.surfaceLight : COLORS.surface,
              borderRadius: 14,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
            })}
            accessibilityRole="button"
            accessibilityLabel={`${alarm.name}, ${isAbsolute ? formatTime24(alarm.absoluteHour, alarm.absoluteMinute) : `${formatOffset(alarm.offsetMinutes)} ${eventLabel}`}, ${alarm.isEnabled ? 'enabled' : 'disabled'}${alarm.nextTriggerAt ? `, next at ${formatTime(new Date(alarm.nextTriggerAt))}` : ''}`}
            accessibilityHint="Double tap to edit"
          >
            {/* Column 1: Time + Icon */}
            <View style={{ alignItems: 'center', marginRight: 14, minWidth: 56 }}>
              {alarm.nextTriggerAt ? (
                <Text
                  style={{
                    color: alarm.isEnabled ? COLORS.textPrimary : COLORS.textMuted,
                    fontSize: 18,
                    fontWeight: '700',
                    marginBottom: 6,
                  }}
                >
                  {formatTime(new Date(alarm.nextTriggerAt))}
                </Text>
              ) : (
                <Text style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 6 }}>--:--</Text>
              )}
              <View accessibilityElementsHidden style={{ opacity: alarm.isEnabled ? 1 : 0.3 }}>
                <EventIconComponent size={22} />
              </View>
            </View>

            {/* Column 2: Details */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: alarm.isEnabled ? COLORS.textPrimary : COLORS.textMuted,
                  fontSize: 17,
                  fontWeight: '600',
                  marginBottom: 3,
                }}
                numberOfLines={1}
              >
                {alarm.name}
              </Text>
              <Text style={{ color: alarm.isEnabled ? eventColor : COLORS.textMuted, fontSize: 13, marginBottom: 3 }}>
                {isAbsolute
                  ? `Daily at ${formatTime24(alarm.absoluteHour, alarm.absoluteMinute)}`
                  : `${formatOffset(alarm.offsetMinutes)} ${eventLabel.toLowerCase()}`}
              </Text>
              <Text style={{ color: alarm.isEnabled ? COLORS.accent : COLORS.textMuted, fontSize: 12 }}>
                {alarm.isEnabled
                  ? alarm.nextTriggerAt
                    ? formatTimeUntil(new Date(alarm.nextTriggerAt))
                    : ''
                  : 'Disabled'}
              </Text>
            </View>

            {/* Column 3: Toggle */}
            <View style={{ marginLeft: 12 }}>
              <AnimatedToggle
                value={alarm.isEnabled}
                onValueChange={() => onToggle(alarm.id)}
                activeColor={eventColor}
                accessibilityLabel={`Toggle ${alarm.name} ${alarm.isEnabled ? 'off' : 'on'}`}
              />
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
