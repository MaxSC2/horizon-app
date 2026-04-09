// src/screens/TasksScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Check } from 'lucide-react-native';
import { useApp } from '../AppContext';
import { Card, Lbl, Btn, Badge, ProgressBar } from '../components';
import { uid, TODAY, goalForecast } from '../helpers';
import { Task, Goal } from '../types';

const TASK_CATS = [
  { id: 'workout', label: 'Тренировка', emoji: '💪', color: '#00C4F0' },
  { id: 'health',  label: 'Здоровье',  emoji: '❤️', color: '#00E676' },
  { id: 'mind',    label: 'Разум',     emoji: '🧠', color: '#C77DFF' },
  { id: 'habit',   label: 'Привычка',  emoji: '🔁', color: '#00E676' },
  { id: 'study',   label: 'Учёба',     emoji: '📚', color: '#FFD600' },
  { id: 'other',   label: 'Другое',    emoji: '✦',  color: '#FF9800' },
];

function taskStreak(task: Task): number {
  let s = 0;
  const t = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(t);
    d.setDate(t.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (task.completedDates?.includes(ds)) s++;
    else if (i > 0) break;
  }
  return s;
}

export default function TasksScreen() {
  const { state, setState, T } = useApp();
  const { tasks, goals } = state;
  const [sub, setSub] = useState<'tasks' | 'goals'>('tasks');
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCat, setTaskCat] = useState('habit');
  const [recurring, setRecurring] = useState(true);
  const [addingGoal, setAddingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', emoji: '🎯', target: '100', unit: '%', cat: 'skill', deadline: '' });

  const addTask = () => {
    if (!taskTitle.trim()) return;
    setState(s => ({ ...s, tasks: [...s.tasks, { id: uid(), title: taskTitle.trim(), category: taskCat, recurring, completedDates: [], createdAt: new Date().toISOString() }] }));
    setTaskTitle(''); setAddingTask(false);
  };

  const toggleTask = (id: string) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(task => {
        if (task.id !== id) return task;
        const done = task.completedDates?.includes(TODAY);
        return { ...task, completedDates: done ? task.completedDates.filter(d => d !== TODAY) : [...(task.completedDates || []), TODAY] };
      }),
    }));
  };

  const addGoal = () => {
    if (!goalForm.title.trim()) return;
    setState(s => ({
      ...s,
      goals: [...s.goals, {
        id: uid(), title: goalForm.title.trim(), emoji: goalForm.emoji,
        category: goalForm.cat, targetValue: parseInt(goalForm.target) || 100,
        currentValue: 0, unit: goalForm.unit, deadline: goalForm.deadline || undefined,
        completed: false, createdAt: new Date().toISOString(), history: [],
      }],
    }));
    setGoalForm({ title: '', emoji: '🎯', target: '100', unit: '%', cat: 'skill', deadline: '' });
    setAddingGoal(false);
  };

  const updateProgress = (id: string, val: number) => {
    setState(s => ({
      ...s,
      goals: s.goals.map(g => {
        if (g.id !== id) return g;
        const nv = Math.max(0, Math.min(val, g.targetValue));
        return { ...g, currentValue: nv, completed: nv >= g.targetValue, history: [...(g.history || []), { date: TODAY, value: nv }].slice(-30) };
      }),
    }));
  };

  // 14-day grid for habits
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Sub-tab bar */}
      <View style={{ flexDirection: 'row', backgroundColor: T.surf, borderBottomWidth: 1, borderBottomColor: T.bord }}>
        {[{ id: 'tasks' as const, l: '✓ Задачи' }, { id: 'goals' as const, l: '🎯 Цели' }].map(t => (
          <TouchableOpacity key={t.id} onPress={() => setSub(t.id)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: sub === t.id ? T.primary : 'transparent' }}>
            <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: sub === t.id ? T.primary : T.muted }}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 20 }}>

        {sub === 'tasks' && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt }}>Задачи и привычки</Text>
              <TouchableOpacity onPress={() => setAddingTask(true)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, backgroundColor: T.primary }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: '#000' }}>+ Добавить</Text>
              </TouchableOpacity>
            </View>

            {addingTask && (
              <Card T={T} style={{ marginBottom: 12, borderWidth: 1, borderColor: T.primary + '55' }}>
                <Lbl T={T} style={{ marginBottom: 10 }}>Новая задача</Lbl>
                <TextInput value={taskTitle} onChangeText={setTaskTitle} placeholder="Название задачи…" placeholderTextColor={T.muted} onSubmitEditing={addTask}
                  style={{ height: 42, borderRadius: 8, borderWidth: 1.5, borderColor: T.primary, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 15, paddingHorizontal: 12, marginBottom: 10 }} />
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {TASK_CATS.map(c => (
                    <TouchableOpacity key={c.id} onPress={() => setTaskCat(c.id)} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1.5, borderColor: taskCat === c.id ? c.color : T.bord, backgroundColor: taskCat === c.id ? c.color + '22' : T.lo }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: taskCat === c.id ? c.color : T.muted }}>{c.emoji} {c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <TouchableOpacity onPress={() => setRecurring(!recurring)} style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: recurring ? T.success : T.muted, backgroundColor: recurring ? T.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {recurring && <Text style={{ color: '#000', fontSize: 13, fontWeight: '900' }}>✓</Text>}
                  </TouchableOpacity>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt }}>Ежедневная привычка</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setAddingTask(false)} style={{ flex: 1, height: 40, borderRadius: 9, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.muted }}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={addTask} disabled={!taskTitle.trim()} style={{ flex: 2, height: 40, borderRadius: 9, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', opacity: !taskTitle.trim() ? 0.5 : 1 }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: '#000' }}>Добавить</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {tasks.length === 0 && !addingTask && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>📋</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.muted }}>Добавь первую задачу</Text>
              </View>
            )}

            {tasks.map(task => {
              const c = TASK_CATS.find(x => x.id === task.category) || TASK_CATS[4];
              const done = task.completedDates?.includes(TODAY);
              const streak = taskStreak(task);
              return (
                <Card key={task.id} T={T} style={{ marginBottom: 10, borderWidth: done ? 1.5 : 1, borderColor: done ? T.success + '55' : T.bord }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <TouchableOpacity onPress={() => toggleTask(task.id)} style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: done ? T.success : c.color, backgroundColor: done ? T.success : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                      {done && <Text style={{ color: '#000', fontSize: 14, fontWeight: '900' }}>✓</Text>}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 15, color: done ? T.muted : T.txt, textDecorationLine: done ? 'line-through' : 'none' }}>{task.title}</Text>
                        <Badge color={c.color} T={T}>{c.emoji} {c.label}</Badge>
                      </View>
                      {task.recurring && streak > 0 && (
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: T.warn }}>🔥 Серия {streak} дн.</Text>
                      )}
                      {/* 14-day grid */}
                      {task.recurring && (
                        <View style={{ flexDirection: 'row', gap: 3, marginTop: 6, flexWrap: 'wrap' }}>
                          {last14.map(d => {
                            const isDone = task.completedDates?.includes(d);
                            return (
                              <View key={d} style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: isDone ? T.success + '80' : T.lo, borderWidth: 1, borderColor: isDone ? T.success + '44' : T.bord }} />
                            );
                          })}
                        </View>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => setState(s => ({ ...s, tasks: s.tasks.filter(x => x.id !== task.id) }))} style={{ padding: 4, opacity: 0.5 }}>
                      <X size={14} color={T.muted} />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {sub === 'goals' && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt }}>Цели</Text>
              <TouchableOpacity onPress={() => setAddingGoal(!addingGoal)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, backgroundColor: T.primary }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: '#000' }}>+ Цель</Text>
              </TouchableOpacity>
            </View>

            {addingGoal && (
              <Card T={T} style={{ marginBottom: 12, borderWidth: 1, borderColor: T.primary + '55' }}>
                <TextInput value={goalForm.title} onChangeText={v => setGoalForm(f => ({ ...f, title: v }))} placeholder="Название цели…" placeholderTextColor={T.muted}
                  style={{ height: 42, borderRadius: 8, borderWidth: 1.5, borderColor: T.primary, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 15, paddingHorizontal: 12, marginBottom: 10 }} />
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 4 }}>ЦЕЛЬ</Text>
                    <TextInput value={goalForm.target} onChangeText={v => setGoalForm(f => ({ ...f, target: v }))} keyboardType="numeric"
                      style={{ height: 38, borderRadius: 7, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'BarlowCondensed_900Black', fontSize: 20, paddingHorizontal: 10, textAlign: 'center' }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 4 }}>ЕДИНИЦА</Text>
                    <TextInput value={goalForm.unit} onChangeText={v => setGoalForm(f => ({ ...f, unit: v }))} placeholder="кг, %, повт…" placeholderTextColor={T.muted}
                      style={{ height: 38, borderRadius: 7, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 14, paddingHorizontal: 10 }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: T.muted, letterSpacing: 1, marginBottom: 4 }}>ИКОНКА</Text>
                    <TextInput value={goalForm.emoji} onChangeText={v => setGoalForm(f => ({ ...f, emoji: v }))}
                      style={{ height: 38, borderRadius: 7, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontSize: 22, textAlign: 'center' }} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setAddingGoal(false)} style={{ flex: 1, height: 40, borderRadius: 9, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.muted }}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={addGoal} disabled={!goalForm.title.trim()} style={{ flex: 2, height: 40, borderRadius: 9, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', opacity: !goalForm.title.trim() ? 0.5 : 1 }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: '#000' }}>Добавить</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {goals.filter(g => !g.completed).map(g => {
              const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
              const fc = goalForecast(g);
              return (
                <Card key={g.id} T={T} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: T.txt }}>{g.emoji} {g.title}</Text>
                      {g.deadline && <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>до {g.deadline}</Text>}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: pct >= 100 ? T.success : pct >= 50 ? T.warn : T.primary }}>{pct}%</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>{g.currentValue}/{g.targetValue} {g.unit}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setState(s => ({ ...s, goals: s.goals.filter(x => x.id !== g.id) }))} style={{ padding: 4, marginLeft: 8, opacity: 0.5 }}>
                      <X size={14} color={T.muted} />
                    </TouchableOpacity>
                  </View>
                  <ProgressBar pct={pct} color={T.primary} T={T} height={10} />

                  {/* Quick +/- buttons */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    {[-10, -1, +1, +10].map(delta => (
                      <TouchableOpacity key={delta} onPress={() => updateProgress(g.id, g.currentValue + delta)}
                        style={{ flex: 1, height: 34, borderRadius: 8, borderWidth: 1, borderColor: delta > 0 ? T.primary + '55' : T.bord, backgroundColor: delta > 0 ? T.primary + '15' : T.lo, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: delta > 0 ? T.primary : T.muted }}>{delta > 0 ? '+' : ''}{delta}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Forecast */}
                  {fc && (
                    <View style={{ marginTop: 8, padding: 8, borderRadius: 8, backgroundColor: T.success + '12', borderWidth: 1, borderColor: T.success + '44', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12 }}>📈</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.txt }}>
                        При текущем темпе: <Text style={{ fontFamily: 'Barlow_600SemiBold' }}>{fc.date}</Text> ({fc.daysNeeded} дн.)
                      </Text>
                    </View>
                  )}
                </Card>
              );
            })}

            {goals.filter(g => !g.completed).length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🎯</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.muted }}>Добавь первую цель</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
