// src/screens/NutritionScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Target, Plus, X } from 'lucide-react-native';
import { useApp } from '../AppContext';
import { Card, Lbl } from '../components';
import { loadNutrition, saveNutrition } from '../storage';
import { uid, TODAY } from '../helpers';
import { FOOD_PRESETS } from '../data';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

const DEFAULT_GOALS = { calories: 2200, protein: 150, carbs: 220, fat: 70 };

export default function NutritionScreen() {
  const { T } = useApp();
  const [data, setData] = useState<Record<string, any>>({});
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState({ name: '', cal: '', p: '', c: '', f: '' });

  useEffect(() => { loadNutrition().then(setData); }, []);

  const today = data[TODAY] || { entries: [] };
  const totals = today.entries.reduce((acc: any, e: any) => ({
    cal: acc.cal + (e.cal || 0), p: acc.p + (e.p || 0), c: acc.c + (e.c || 0), f: acc.f + (e.f || 0),
  }), { cal: 0, p: 0, c: 0, f: 0 });

  const addEntry = (entry: any) => {
    const updated = { ...data, [TODAY]: { ...today, entries: [...today.entries, { ...entry, id: uid(), time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }] } };
    setData(updated); saveNutrition(updated);
  };
  const removeEntry = (id: string) => {
    const updated = { ...data, [TODAY]: { ...today, entries: today.entries.filter((e: any) => e.id !== id) } };
    setData(updated); saveNutrition(updated);
  };

  const macros = [
    { key: 'protein', label: 'Белок', val: totals.p, goal: goals.protein, color: T.success, unit: 'г' },
    { key: 'carbs',   label: 'Углев.', val: totals.c, goal: goals.carbs, color: T.warn, unit: 'г' },
    { key: 'fat',     label: 'Жиры',  val: totals.f, goal: goals.fat, color: '#FF9500', unit: 'г' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt }}>🥗 Питание</Text>
        </View>

        {/* Macro summary */}
        <Card T={T} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Lbl T={T}>Сегодня</Lbl>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: totals.cal > goals.calories ? T.danger : T.primary }}>
              {totals.cal} <Text style={{ fontSize: 12, color: T.muted }}>/ {goals.calories} ккал</Text>
            </Text>
          </View>
          {/* Calorie bar */}
          <View style={{ height: 8, backgroundColor: T.lo, borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
            <View style={{ height: '100%', width: `${Math.min((totals.cal / goals.calories) * 100, 100)}%`, backgroundColor: totals.cal > goals.calories ? T.danger : T.primary, borderRadius: 4 }} />
          </View>
          {/* Macro rings */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {macros.map(m => {
              const pct = Math.min(Math.round((m.val / m.goal) * 100), 100);
              const r = 26; const circ = 2 * Math.PI * r;
              const offset = circ - (circ * pct / 100);
              return (
                <View key={m.key} style={{ alignItems: 'center' }}>
                  <Svg width={64} height={64}>
                    <Circle cx={32} cy={32} r={r} fill="none" stroke={T.lo} strokeWidth={6} />
                    <Circle cx={32} cy={32} r={r} fill="none" stroke={m.color} strokeWidth={6}
                      strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
                      rotation="-90" origin="32, 32" />
                    <SvgText x={32} y={36} textAnchor="middle" fill={m.color} fontSize={12} fontWeight="900">{pct}%</SvgText>
                  </Svg>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 14, color: m.color }}>{m.val.toFixed(0)}{m.unit}</Text>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>{m.label}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Food list */}
        <TouchableOpacity onPress={() => setAdding(!adding)} style={{ height: 44, borderRadius: 10, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, marginBottom: 12 }}>
          <Plus size={15} color="#000" />
          <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: '#000' }}>{adding ? 'Закрыть' : 'Добавить еду'}</Text>
        </TouchableOpacity>

        {adding && (
          <Card T={T} style={{ marginBottom: 12, borderWidth: 1, borderColor: T.primary + '55' }}>
            <Lbl T={T} style={{ marginBottom: 10 }}>Быстрый выбор</Lbl>
            {FOOD_PRESETS.map((f, i) => (
              <TouchableOpacity key={i} onPress={() => { addEntry(f); setAdding(false); }}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 9, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, marginBottom: 6 }}>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt }}>{f.name}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.primary }}>{f.cal} ккал</Text>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>Б{f.p}·У{f.c}·Ж{f.f}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <Lbl T={T} style={{ marginTop: 8, marginBottom: 8 }}>Своё блюдо</Lbl>
            <TextInput value={custom.name} onChangeText={v => setCustom(c => ({ ...c, name: v }))} placeholder="Название" placeholderTextColor={T.muted}
              style={{ height: 38, borderRadius: 8, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 14, paddingHorizontal: 10, marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
              {[['cal', 'Ккал'], ['p', 'Белок'], ['c', 'Углев'], ['f', 'Жиры']].map(([k, l]) => (
                <View key={k} style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted, marginBottom: 3 }}>{l}</Text>
                  <TextInput value={(custom as any)[k]} onChangeText={v => setCustom(c => ({ ...c, [k]: v }))} keyboardType="numeric"
                    style={{ height: 36, borderRadius: 7, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'BarlowCondensed_700Bold', fontSize: 16, textAlign: 'center' }} />
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={() => { addEntry({ name: custom.name, cal: parseInt(custom.cal) || 0, p: parseFloat(custom.p) || 0, c: parseFloat(custom.c) || 0, f: parseFloat(custom.f) || 0 }); setCustom({ name: '', cal: '', p: '', c: '', f: '' }); setAdding(false); }}
              disabled={!custom.name.trim() || !custom.cal}
              style={{ height: 40, borderRadius: 9, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', opacity: !custom.name.trim() || !custom.cal ? 0.5 : 1 }}>
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: '#000' }}>Добавить</Text>
            </TouchableOpacity>
          </Card>
        )}

        {today.entries.length === 0 && !adding && (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🥗</Text>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.muted }}>Начни отслеживать питание</Text>
          </View>
        )}

        {today.entries.map((e: any) => (
          <View key={e.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingHorizontal: 12, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, borderRadius: 10, marginBottom: 6 }}>
            <View>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt }}>{e.name}</Text>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>{e.time} · Б{e.p?.toFixed(0)}г · У{e.c?.toFixed(0)}г · Ж{e.f?.toFixed(0)}г</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.primary }}>{e.cal} ккал</Text>
              <TouchableOpacity onPress={() => removeEntry(e.id)} style={{ opacity: 0.6 }}>
                <X size={13} color={T.muted} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
