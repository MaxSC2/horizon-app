// src/screens/OnboardingScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';

const STEPS = [
  { icon: '🌅', title: 'Добро пожаловать\nв ГОРИЗОНТ', desc: 'Система роста тела и разума. Тренировки, цели, дневник и AI-ментор в одном приложении.', accent: 'primary', action: 'Начать' },
  { icon: '💪', title: 'Твой план\nтренировок', desc: '7-дневный план с отжиманиями, приседаниями и кором. Прогрессия и советы по технике.', accent: 'success', action: 'Дальше', input: { label: 'Сколько отжиманий делаешь за раз?', key: 'maxPushups', placeholder: '15' } },
  { icon: '📊', title: 'Мониторинг\nвсего важного', desc: 'Сон, настроение, энергия, вес и замеры. Корреляции покажут, как тренировки влияют на жизнь.', accent: 'warn', action: 'Дальше' },
  { icon: '🤖', title: 'НЕЙРО —\nтвой AI-ментор', desc: 'Анализирует твои данные и даёт персональные советы. Встроен Claude — работает без ключа.', accent: 'primary', action: 'Начать путь' },
];

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { state, setState } = useApp();
  const T = { bg: '#07090D', txt: '#DDE6EE', muted: '#3D5A72', lo: '#0F1C2C', bord: '#1A2E42', primary: '#00C4F0', success: '#00E676', warn: '#FFD600' } as any;
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState({ maxPushups: '15' });
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const accentColor = (T as any)[s.accent] || T.primary;

  const next = () => {
    if (isLast) {
      setState(prev => ({
        ...prev,
        onboarded: true,
        user: { ...prev.user, maxPushups: parseInt(vals.maxPushups) || 15 },
      }));
    } else {
      setStep(x => x + 1);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 36, alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Progress dots */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {STEPS.map((_, i) => (
            <View key={i} style={{ height: 4, width: i === step ? 28 : 8, borderRadius: 2, backgroundColor: i <= step ? accentColor : T.bord }} />
          ))}
        </View>

        {/* Content */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
          <View style={{ width: 100, height: 100, borderRadius: 28, backgroundColor: accentColor + '22', borderWidth: 2, borderColor: accentColor + '55', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <Text style={{ fontSize: 52 }}>{s.icon}</Text>
          </View>

          <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 32, color: T.txt, textAlign: 'center', marginBottom: 14, lineHeight: 38, letterSpacing: 0.5 }}>
            {s.title}
          </Text>
          <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 15, color: T.muted, textAlign: 'center', lineHeight: 24, maxWidth: 300 }}>
            {s.desc}
          </Text>

          {s.input && (
            <View style={{ marginTop: 24, width: '100%', maxWidth: 280 }}>
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
                {s.input.label}
              </Text>
              <TextInput
                keyboardType="numeric"
                value={vals[s.input.key as keyof typeof vals]}
                onChangeText={v => setVals(prev => ({ ...prev, [s.input!.key]: v }))}
                placeholder={s.input.placeholder}
                placeholderTextColor={T.muted}
                style={{
                  width: '100%', height: 56, borderRadius: 14,
                  borderWidth: 2, borderColor: accentColor + '99',
                  backgroundColor: T.lo, color: T.txt,
                  fontFamily: 'BarlowCondensed_900Black', fontSize: 28,
                  textAlign: 'center',
                }}
              />
              {vals.maxPushups && (
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, textAlign: 'center', marginTop: 8 }}>
                  Рабочий диапазон: {Math.round(parseInt(vals.maxPushups || '15') * 0.6)}–{Math.round(parseInt(vals.maxPushups || '15') * 0.7)} повт
                </Text>
              )}
            </View>
          )}
        </View>

        {/* CTA */}
        <View style={{ width: '100%' }}>
          <TouchableOpacity onPress={next} activeOpacity={0.85} style={{ width: '100%', height: 56, borderRadius: 16, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center', shadowColor: accentColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 }}>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: '#000', letterSpacing: 0.5 }}>
              {s.action} {isLast ? '🚀' : '→'}
            </Text>
          </TouchableOpacity>
          {step > 0 && (
            <TouchableOpacity onPress={() => setStep(x => x - 1)} style={{ width: '100%', height: 38, marginTop: 10, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted }}>← Назад</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
