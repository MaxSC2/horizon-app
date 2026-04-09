// src/screens/JournalScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BedDouble, Plus, Minus } from 'lucide-react-native';
import { useApp } from '../AppContext';
import { Card, Lbl } from '../components';
import { uid, TODAY } from '../helpers';
import { MOODS, ENERGY } from '../data';

const SLEEP_LABELS: { h: number; label: string }[] = [
  { h: 0, label: 'Не сплю' }, { h: 4, label: '4ч — мало' }, { h: 5, label: '5ч — мало' },
  { h: 6, label: '6ч — норм' }, { h: 7, label: '7ч — хорошо' }, { h: 8, label: '8ч — отлично' }, { h: 9, label: '9ч+ — много' },
];
function sleepLabel(h: number) { return SLEEP_LABELS.reduce((best, cur) => h >= cur.h ? cur : best, SLEEP_LABELS[0]).label; }

export default function JournalScreen() {
  const { state, setState, T } = useApp();
  const { journal } = state;
  const [sub, setSub] = useState<'journal' | 'body'>('journal');
  const [adding, setAdding] = useState(false);
  const [jText, setJText] = useState('');
  const [jMood, setJMood] = useState(3);
  const [jEnergy, setJEnergy] = useState(3);
  const [jSleep, setJSleep] = useState(7);
  const [search, setSearch] = useState('');

  const saveJournal = () => {
    if (!jText.trim()) return;
    setState(s => ({ ...s, journal: [{ id: uid(), date: TODAY, text: jText.trim(), mood: jMood, energy: jEnergy, sleep: jSleep, waterGlasses: 0, createdAt: new Date().toISOString() }, ...s.journal] }));
    setJText(''); setJMood(3); setJEnergy(3); setJSleep(7); setAdding(false);
  };

  const filtered = journal.filter(j => !search || j.text.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.date > a.date ? 1 : -1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ flexDirection: 'row', backgroundColor: T.surf, borderBottomWidth: 1, borderBottomColor: T.bord }}>
        {[{ id: 'journal' as const, l: '📓 Дневник' }, { id: 'body' as const, l: '⚖️ Тело' }].map(t => (
          <TouchableOpacity key={t.id} onPress={() => setSub(t.id)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: sub === t.id ? T.primary : 'transparent' }}>
            <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: sub === t.id ? T.primary : T.muted }}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 20 }}>
        {sub === 'journal' && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt }}>Дневник</Text>
              <TouchableOpacity onPress={() => setAdding(!adding)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, backgroundColor: T.primary }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: '#000' }}>{adding ? 'Закрыть' : '+ Запись'}</Text>
              </TouchableOpacity>
            </View>

            {adding && (
              <Card T={T} style={{ marginBottom: 12, borderWidth: 1, borderColor: T.primary + '55' }}>
                <Lbl T={T} style={{ marginBottom: 10 }}>Как прошёл день?</Lbl>
                <Lbl T={T} style={{ marginBottom: 6 }}>Настроение</Lbl>
                <View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>
                  {MOODS.map(m => (
                    <TouchableOpacity key={m.v} onPress={() => setJMood(m.v)} style={{ flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 2, borderColor: jMood === m.v ? T.primary : T.bord, backgroundColor: jMood === m.v ? T.primary + '22' : T.lo, alignItems: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{m.e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Lbl T={T} style={{ marginBottom: 6 }}>Энергия</Lbl>
                <View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>
                  {ENERGY.map(e => (
                    <TouchableOpacity key={e.v} onPress={() => setJEnergy(e.v)} style={{ flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 2, borderColor: jEnergy === e.v ? T.success : T.bord, backgroundColor: jEnergy === e.v ? T.success + '22' : T.lo, alignItems: 'center' }}>
                      <Text style={{ fontSize: 18 }}>{e.e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Sleep */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Lbl T={T}>Сон</Lbl>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <BedDouble size={13} color={jSleep >= 7 ? T.primary : jSleep >= 6 ? T.warn : T.danger} />
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: jSleep >= 7 ? T.primary : jSleep >= 6 ? T.warn : T.danger }}>{jSleep}ч — {sleepLabel(jSleep)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <TouchableOpacity onPress={() => setJSleep(h => Math.max(0, +(h - 0.5).toFixed(1)))} style={{ width: 30, height: 30, borderRadius: 7, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                    <Minus size={13} color={T.muted} />
                  </TouchableOpacity>
                  <View style={{ flex: 1, height: 8, backgroundColor: T.lo, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${(jSleep / 12) * 100}%`, backgroundColor: jSleep >= 7 ? T.primary : jSleep >= 6 ? T.warn : T.danger, borderRadius: 4 }} />
                  </View>
                  <TouchableOpacity onPress={() => setJSleep(h => Math.min(12, +(h + 0.5).toFixed(1)))} style={{ width: 30, height: 30, borderRadius: 7, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={13} color={T.muted} />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 10 }}>
                  {[4, 5, 6, 7, 8, 9].map(h => (
                    <TouchableOpacity key={h} onPress={() => setJSleep(h)} style={{ flex: 1, paddingVertical: 4, borderRadius: 7, borderWidth: 1, borderColor: jSleep === h ? T.primary : T.bord, backgroundColor: jSleep === h ? T.primary + '22' : T.lo, alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: jSleep === h ? T.primary : T.muted }}>{h}ч</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput value={jText} onChangeText={setJText} placeholder="Мысли, идеи, наблюдения…" placeholderTextColor={T.muted} multiline numberOfLines={5}
                  style={{ borderRadius: 10, borderWidth: 1.5, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 14, padding: 12, lineHeight: 21, minHeight: 100, marginBottom: 10, textAlignVertical: 'top' }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setAdding(false)} style={{ flex: 1, height: 40, borderRadius: 9, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.muted }}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveJournal} disabled={!jText.trim()} style={{ flex: 2, height: 40, borderRadius: 9, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', opacity: !jText.trim() ? 0.5 : 1 }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: '#000' }}>Сохранить</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {journal.length > 0 && (
              <TextInput value={search} onChangeText={setSearch} placeholder="🔍 Поиск…" placeholderTextColor={T.muted}
                style={{ height: 38, borderRadius: 8, borderWidth: 1.5, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 14, paddingHorizontal: 12, marginBottom: 12 }} />
            )}

            {filtered.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>📝</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.muted }}>{search ? 'Ничего не найдено' : 'Начни вести дневник'}</Text>
              </View>
            )}

            {filtered.map(entry => {
              const m = MOODS.find(x => x.v === entry.mood);
              const en = ENERGY.find(x => x.v === entry.energy);
              return (
                <Card key={entry.id} T={T} style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: m?.v && m.v >= 4 ? T.success : m?.v && m.v <= 2 ? T.danger : T.muted }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 20 }}>{m?.e}</Text>
                      {entry.energy && <Text style={{ fontSize: 16, opacity: 0.7 }}>{en?.e}</Text>}
                      {entry.sleep && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: T.lo, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <BedDouble size={10} color={T.muted} />
                          <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: T.muted }}>{entry.sleep}ч</Text>
                        </View>
                      )}
                      <View>
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: entry.date === TODAY ? T.primary : T.muted }}>
                          {entry.date === TODAY ? 'Сегодня' : new Date(entry.date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </Text>
                        <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>{m?.l}{entry.energy ? ' · ' + en?.l : ''}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setState(s => ({ ...s, journal: s.journal.filter(x => x.id !== entry.id) }))} style={{ opacity: 0.5 }}>
                      <Text style={{ fontSize: 15, color: T.muted }}>×</Text>
                    </TouchableOpacity>
                  </View>
                  {entry.text && <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt, lineHeight: 21 }}>{entry.text}</Text>}
                </Card>
              );
            })}
          </>
        )}

        {sub === 'body' && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>⚖️</Text>
            <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 18, color: T.txt, marginBottom: 6 }}>Трекер тела</Text>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, textAlign: 'center' }}>Вес, замеры, BMI и фото прогресса{'\n'}(полная версия в следующем обновлении)</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
