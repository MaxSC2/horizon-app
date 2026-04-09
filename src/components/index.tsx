// src/components/index.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ViewStyle, TextStyle, ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Theme } from '../types';

// ── Btn
interface BtnProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'muted' | 'warn';
  T: Theme;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
}
export function Btn({ children, onPress, variant = 'primary', T, style, disabled, loading }: BtnProps) {
  const variantStyle: Record<string, { bg: string; border?: string; textColor: string }> = {
    primary:  { bg: T.primary, textColor: '#000' },
    ghost:    { bg: 'transparent', border: T.primary, textColor: T.primary },
    danger:   { bg: T.danger, textColor: '#fff' },
    success:  { bg: T.success, textColor: '#000' },
    muted:    { bg: T.lo, border: T.bord, textColor: T.txt },
    warn:     { bg: T.warn, textColor: '#000' },
  };
  const v = variantStyle[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[{
        minHeight: 44,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: v.bg,
        borderWidth: v.border ? 1.5 : 0,
        borderColor: v.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        opacity: disabled ? 0.5 : 1,
      }, style]}
    >
      {loading
        ? <ActivityIndicator color={v.textColor} size="small"/>
        : typeof children === 'string'
          ? <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: v.textColor, letterSpacing: 0.5 }}>{children}</Text>
          : children
      }
    </TouchableOpacity>
  );
}

// ── Card
interface CardProps {
  children: React.ReactNode;
  T: Theme;
  style?: ViewStyle;
}
export function Card({ children, T, style }: CardProps) {
  return (
    <View style={[{
      backgroundColor: T.card,
      borderWidth: 1,
      borderColor: T.bord,
      borderRadius: 14,
      padding: 16,
    }, style]}>
      {children}
    </View>
  );
}

// ── Lbl
interface LblProps {
  children: React.ReactNode;
  T: Theme;
  style?: TextStyle;
}
export function Lbl({ children, T, style }: LblProps) {
  return (
    <Text style={[{
      fontFamily: 'BarlowCondensed_700Bold',
      fontSize: 11,
      letterSpacing: 2,
      color: T.muted,
      textTransform: 'uppercase',
    }, style]}>
      {children}
    </Text>
  );
}

// ── Badge
interface BadgeProps {
  children: React.ReactNode;
  color: string;
  T: Theme;
}
export function Badge({ children, color }: BadgeProps) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color + '30',
      borderWidth: 1,
      borderColor: color + '66',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 2,
    }}>
      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color, letterSpacing: 0.5 }}>
        {children}
      </Text>
    </View>
  );
}

// ── Ring (circular progress)
interface RingProps {
  pct: number;
  size?: number;
  stroke?: number;
  color: string;
  bg: string;
  label?: string;
  T: Theme;
}
export function Ring({ pct, size = 64, stroke = 6, color, bg, label, T }: RingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(pct, 100) / 100);
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <Circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
        <SvgText x={size / 2} y={size / 2 + 5} textAnchor="middle" fill={color} fontSize={13} fontWeight="900">
          {pct}%
        </SvgText>
      </Svg>
      {label && (
        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: T.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {label}
        </Text>
      )}
    </View>
  );
}

// ── Simple Bar Chart (using SVG)
interface BarChartData { label: string; value: number; color?: string; }
interface SimpleBarChartProps {
  data: BarChartData[];
  T: Theme;
  height?: number;
  maxVal?: number;
  accentColor?: string;
}
export function SimpleBarChart({ data, T, height = 100, maxVal, accentColor }: SimpleBarChartProps) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  const barWidth = 280 / data.length;
  const chartH = height - 20;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 280 ${height}`}>
      {data.map((d, i) => {
        const barH = Math.max(2, (d.value / max) * chartH);
        const x = i * barWidth + barWidth * 0.15;
        const w = barWidth * 0.7;
        const y = chartH - barH;
        return (
          <React.Fragment key={i}>
            <Circle cx={x + w / 2} cy={0} r={0} fill="none" />
            <SvgText x={x + w / 2} y={chartH + 14} textAnchor="middle" fill={T.muted} fontSize={8}>
              {d.label}
            </SvgText>
            <Circle
              cx={x} cy={y} r={0} fill="none"
            />
            {/* bar */}
            <SvgText x={x} y={y + barH} fill={d.color || accentColor || T.primary} fontSize={0}>.</SvgText>
            <View/>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ── Section header
export function SectionHeader({ title, T, right }: { title: string; T: Theme; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt }}>{title}</Text>
      {right}
    </View>
  );
}

// ── Divider
export function Divider({ T }: { T: Theme }) {
  return <View style={{ height: 1, backgroundColor: T.bord, marginVertical: 8 }} />;
}

// ── EmptyState
export function EmptyState({ emoji, text, subtext, T }: { emoji: string; text: string; subtext?: string; T: Theme }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 40, marginBottom: 10 }}>{emoji}</Text>
      <Text style={{ fontFamily: 'Barlow_600SemiBold', fontSize: 15, color: T.txt, textAlign: 'center' }}>{text}</Text>
      {subtext && <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, textAlign: 'center', marginTop: 4 }}>{subtext}</Text>}
    </View>
  );
}

// ── Progress bar
export function ProgressBar({ pct, color, T, height = 6 }: { pct: number; color: string; T: Theme; height?: number }) {
  return (
    <View style={{ height, backgroundColor: T.lo, borderRadius: height / 2, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${Math.min(Math.max(pct, 0), 100)}%`, backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

// ── BtnRow (horizontal group)
export function BtnRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>;
}
