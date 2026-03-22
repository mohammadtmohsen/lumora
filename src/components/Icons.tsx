import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../utils/constants';

interface IconProps {
  size?: number;
}

export function SunriseIcon({ size = 28 }: IconProps) {
  const r = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: r * 1.4,
          height: r * 1.4,
          borderRadius: r,
          backgroundColor: COLORS.sunrise,
          opacity: 0.9,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: size,
          height: 2,
          backgroundColor: COLORS.sunrise,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

export function SunsetIcon({ size = 28 }: IconProps) {
  const r = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          width: r * 1.4,
          height: r * 0.7,
          borderTopLeftRadius: r,
          borderTopRightRadius: r,
          backgroundColor: COLORS.sunset,
          opacity: 0.9,
        }}
      />
      <View
        style={{
          width: size,
          height: 2,
          backgroundColor: COLORS.sunset,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

export function AlarmIcon({ size = 28 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: size * 0.35,
          borderWidth: 2.5,
          borderColor: COLORS.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 2,
            height: size * 0.2,
            backgroundColor: COLORS.accent,
            position: 'absolute',
            top: size * 0.1,
          }}
        />
        <View
          style={{
            width: size * 0.15,
            height: 2,
            backgroundColor: COLORS.accent,
            position: 'absolute',
            top: size * 0.25,
            left: size * 0.25,
          }}
        />
      </View>
    </View>
  );
}

export function SettingsIcon({ size = 22 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.65,
          height: size * 0.65,
          borderRadius: size * 0.325,
          borderWidth: 2,
          borderColor: COLORS.textSecondary,
        }}
      />
      <View style={{ position: 'absolute', top: 0, width: 2, height: size * 0.15, backgroundColor: COLORS.textSecondary }} />
      <View style={{ position: 'absolute', bottom: 0, width: 2, height: size * 0.15, backgroundColor: COLORS.textSecondary }} />
      <View style={{ position: 'absolute', left: 0, width: size * 0.15, height: 2, backgroundColor: COLORS.textSecondary }} />
      <View style={{ position: 'absolute', right: 0, width: size * 0.15, height: 2, backgroundColor: COLORS.textSecondary }} />
    </View>
  );
}

export function LocationIcon({ size = 36 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.5,
          height: size * 0.65,
          borderTopLeftRadius: size * 0.25,
          borderTopRightRadius: size * 0.25,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          borderWidth: 2.5,
          borderColor: COLORS.textMuted,
          transform: [{ rotate: '180deg' }],
        }}
      />
    </View>
  );
}
