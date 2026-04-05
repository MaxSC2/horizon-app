import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StatusBar, SafeAreaView, Modal, Alert, Dimensions, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadState, persistState } from "./src/utils/storage";
import {
  fmt, uid, getMonday, weekDates, todayIdx, TODAY, calcStreak,
  taskStreakForId, getPRs, getAllProgressionSuggestions,
  sleepLabel, last7MoodData, calcLifeScore,
  checkAchievements, buildAIContext,
} from "./src/utils/helpers";
import { callAI } from "./src/utils/ai";
import {
  PLAN, QUOTES, ACHIEVEMENT_DEFS, GOAL_TEMPLATES, MUSCLES,
  ONBOARD_STEPS, AI_PROVIDERS, QUICK_PROMPTS,
  TASK_CATS, GOAL_CATS, PAIN_ZONES, PAIN_INTENSITY,
  MOODS, ENERGY, THEME_LIST, DEFAULTS,
} from "./src/data/constants";

const W = Dimensions.get("window").width;
const MAX_W = Math.min(W, 480);

function getTheme(id: string) { return THEME_LIST.find((x) => x.id === id) || THEME_LIST[0]; }

/* ══════════ PRIMITIVES ══════════ */
function Lbl({ children, T }: { children: React.ReactNode; T: any }) {
  return <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, letterSpacing: 2, color: T.muted, textTransform: "uppercase" }}>{children}</Text>;
}

function Badge({ children, color, T }: { children: React.ReactNode; color: string; T: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: `${color}18`, borderColor: `${color}44`, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 }}>
      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color }}>{children}</Text>
    </View>
  );
}

function Card({ children, style, T }: { children: React.ReactNode; style?: any; T: any }) {
  return <View style={[{ backgroundColor: T.card, borderColor: T.bord, borderWidth: 1, borderRadius: 14, padding: 16 }, style]}>{children}</View>;
}

function Btn({ children, onPress, variant = "primary", style, T, disabled }: { children: React.ReactNode; onPress?: () => void; variant?: string; style?: any; T: any; disabled?: boolean }) {
  const v: any = {
    primary: { backgroundColor: T.primary, color: "#000" },
    ghost: { backgroundColor: "transparent", color: T.primary, borderColor: T.primary, borderWidth: 1.5 },
    danger: { backgroundColor: T.danger, color: "#fff" },
    success: { backgroundColor: T.success, color: "#000" },
    muted: { backgroundColor: T.lo, color: T.txt, borderColor: T.bord, borderWidth: 1 },
    warn: { backgroundColor: T.warn, color: "#000" },
  }[variant] || { backgroundColor: T.primary, color: "#000" };
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[{ minHeight: 44, paddingHorizontal: 18, borderRadius: 10, justifyContent: "center", alignItems: "center", opacity: disabled ? 0.5 : 1 }, v, style]}>
      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: v.color }}>{children}</Text>
    </TouchableOpacity>
  );
}

function Ring({ pct, size = 64, color, label, T }: any) {
  return (
    <View style={{ alignItems: "center", gap: 3 }}>
      <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 13, fontWeight: "900", color }}>{pct}%</Text>
      </View>
      {label && <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 10, color: T.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</Text>}
    </View>
  );
}

/* ══════════ NUMPAD ══════════ */
function Numpad({ T, value, onChange, onConfirm, unit, placeholder, color }: any) {
  const display = value || "";
  const tap = (k: string) => { if (k === "⌫") onChange(display.slice(0, -1)); else if (display.length < 4) onChange(display + k); };
  const col = color || T.primary;
  const rows = [["1","2","3"],["4","5","6"],["7","8","9"],["⌫","0","✓"]];
  return (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.7)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 }}>
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 52, color: display ? T.txt : T.muted }}>
              {display || placeholder}
              {display && <Text style={{ fontSize: 22, color: T.muted }}> {unit}</Text>}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {rows.flat().map((k, i) => {
              const isConfirm = k === "✓"; const isDel = k === "⌫";
              return (
                <TouchableOpacity key={i} onPress={() => (isConfirm ? onConfirm(display) : tap(k))}
                  style={{ flex: 1, height: 56, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: isConfirm ? col : isDel ? `${T.danger}15` : T.lo }}>
                  <Text style={{ fontFamily: "System", fontWeight: isConfirm ? "900" : "700", fontSize: isConfirm ? 18 : 22, color: isConfirm ? "#000" : isDel ? T.danger : T.txt }}>
                    {isConfirm ? "ГОТОВО" : k}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════ REST TIMER ══════════ */
function RestTimer({ T, onDone }: any) {
  const [s, setS] = useState(90);
  useEffect(() => {
    const ref = setInterval(() => setS((x) => { if (x <= 1) { clearInterval(ref); onDone(); return 0; } return x - 1; }), 1000);
    return () => clearInterval(ref);
  }, []);
  return (
    <Modal transparent animationType="fade" visible>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.8)", justifyContent: "center", alignItems: "center" }}>
        <View style={{ backgroundColor: T.card, borderColor: T.bord, borderWidth: 1, borderRadius: 20, padding: 32, alignItems: "center", minWidth: 240 }}>
          <Lbl T={T}>⏱ ОТДЫХ</Lbl>
          <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 48, color: s < 20 ? T.warn : s < 45 ? T.primary : T.success, marginVertical: 12 }}>{s}</Text>
          <Btn T={T} variant="muted" onPress={onDone} style={{ width: "100%" }}>Пропустить →</Btn>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════ ONBOARDING ══════════ */
function OnboardingScreen({ T, onComplete }: any) {
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState({ maxPushups: "15" });
  const s = ONBOARD_STEPS[step];
  const isLast = step === ONBOARD_STEPS.length - 1;
  const accent = T[s.accent] || T.primary;
  const next = () => { if (isLast) onComplete({ maxPushups: parseInt(vals.maxPushups) || 15 }); else setStep((x) => x + 1); };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ flex: 1, justifyContent: "space-between", padding: 24, maxWidth: MAX_W, alignSelf: "center", width: "100%" }}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {ONBOARD_STEPS.map((_, i) => <View key={i} style={{ height: 4, width: i === step ? 28 : 8, borderRadius: 2, backgroundColor: i <= step ? accent : T.bord }} />)}
        </View>
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <View style={{ width: 100, height: 100, borderRadius: 28, backgroundColor: `${accent}18`, borderColor: `${accent}44`, borderWidth: 2, justifyContent: "center", alignItems: "center", marginBottom: 28 }}>
            <Text style={{ fontSize: 52 }}>{s.icon}</Text>
          </View>
          <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 28, color: T.txt, textAlign: "center", marginBottom: 14, lineHeight: 34 }}>{s.title}</Text>
          <Text style={{ fontFamily: "System", fontSize: 15, color: T.muted, textAlign: "center", lineHeight: 24, maxWidth: 300 }}>{s.desc}</Text>
          {s.input && (
            <View style={{ marginTop: 24, width: "100%", maxWidth: 280 }}>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{s.input.label}</Text>
              <TextInput keyboardType="numeric" value={vals[s.input.key as keyof typeof vals]} onChangeText={(t) => setVals((v: any) => ({ ...v, [s.input.key]: t }))}
                placeholder={s.input.placeholder} placeholderTextColor={T.muted}
                style={{ width: "100%", height: 56, borderRadius: 14, borderColor: `${accent}88`, borderWidth: 2, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontWeight: "900", fontSize: 28, textAlign: "center" }} />
            </View>
          )}
        </View>
        <View style={{ width: "100%" }}>
          <TouchableOpacity onPress={next} style={{ width: "100%", height: 56, borderRadius: 16, backgroundColor: accent, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: "#000" }}>{s.action} {isLast ? "🚀" : "→"}</Text>
          </TouchableOpacity>
          {step > 0 && <TouchableOpacity onPress={() => setStep((x) => x - 1)} style={{ marginTop: 10, alignItems: "center" }}><Text style={{ fontFamily: "System", fontSize: 13, color: T.muted }}>← Назад</Text></TouchableOpacity>}
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ══════════ HEADER ══════════ */
function Header({ T, streak, onOpenThemes }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: T.bord, backgroundColor: T.surf }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: `${T.primary}20`, borderColor: `${T.primary}44`, borderWidth: 1.5, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 17 }}>🌅</Text>
        </View>
        <View>
          <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, letterSpacing: 2, color: T.txt }}>ГОРИЗОНТ</Text>
          <Text style={{ fontFamily: "System", fontSize: 9, color: T.muted, letterSpacing: 1.5 }}>LIFE TRACKER</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {streak > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: T.lo, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderColor: T.bord, borderWidth: 1 }}>
            <Text style={{ fontSize: 13 }}>🔥</Text>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.warn }}>{streak}</Text>
          </View>
        )}
        <TouchableOpacity onPress={onOpenThemes} style={{ width: 34, height: 34, borderRadius: 9, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 16 }}>🎨</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ══════════ THEME PICKER ══════════ */
function ThemePicker({ T, currentThemeId, onSelect, onClose }: any) {
  return (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.8)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.txt }}>Тема оформления</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 20, color: T.muted }}>✕</Text></TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {THEME_LIST.map((theme) => {
              const th = getTheme(theme.id); const cur = currentThemeId === theme.id;
              return (
                <TouchableOpacity key={theme.id} onPress={() => onSelect(theme.id)}
                  style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: th.bg, borderColor: cur ? th.primary : T.bord, borderWidth: cur ? 2.5 : 2, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 22 }}>{theme.icon}</Text>
                  {cur && <View style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: th.primary }} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, marginTop: 10, textAlign: "center" }}>
            {THEME_LIST.find((x) => x.id === currentThemeId)?.icon} {THEME_LIST.find((x) => x.id === currentThemeId)?.name}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════ BOTTOM NAV ══════════ */
function BottomNav({ T, tab, setTab, hasActive }: any) {
  const tabs = [
    { id: "dashboard", label: "🏠", label2: "ГОРИЗОНТ" },
    { id: "workout", label: hasActive ? "⚡" : "💪", label2: "ТРЕН." },
    { id: "tasks", label: "📋", label2: "ЗАДАЧИ" },
    { id: "journal", label: "📓", label2: "ДНЕВН." },
    { id: "ai", label: "🤖", label2: "РАЗУМ" },
    { id: "stats", label: "📊", label2: "СТАТЫ" },
  ];
  return (
    <View style={{ flexDirection: "row", backgroundColor: T.surf, borderTopWidth: 1, borderTopColor: T.bord, paddingBottom: 8 }}>
      {tabs.map(({ id, label, label2 }) => {
        const isActive = tab === id;
        return (
          <TouchableOpacity key={id} onPress={() => setTab(id)}
            style={{ flex: 1, alignItems: "center", paddingVertical: 6, borderTopWidth: 2.5, borderTopColor: isActive ? T.primary : "transparent" }}>
            <Text style={{ fontSize: 18 }}>{label}</Text>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 8, color: isActive ? T.primary : T.muted, marginTop: 2, letterSpacing: 0.5 }}>{label2}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ══════════ EXERCISE CARD ══════════ */
function ExerciseCard({ T, exercise, logs, onComplete, onValueChange, onRest, prVal }: any) {
  const [activeNumpad, setActiveNumpad] = useState<number | null>(null);
  const allDone = logs.every((s: any) => s.done);
  return (
    <>
      {activeNumpad !== null && (
        <Numpad T={T} value={logs[activeNumpad]?.value || ""} onChange={(v: string) => onValueChange(activeNumpad, v)}
          onConfirm={(val: string) => { if (val) onValueChange(activeNumpad, val); setActiveNumpad(null); onComplete(activeNumpad); onRest(); }}
          unit={exercise.type === "seconds" ? "сек" : "повт"} placeholder={exercise.reps} color={T.primary} />
      )}
      <Card T={T} style={{ marginBottom: 10, borderColor: allDone ? `${T.success}55` : undefined }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 17, color: T.txt }}>{exercise.name}</Text>
            <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, marginTop: 2 }}>
              {exercise.sets} подхода · {exercise.reps} {exercise.type === "seconds" ? "сек" : "повт"}{exercise.notes ? ` · ${exercise.notes}` : ""}
            </Text>
          </View>
          {allDone && <Text style={{ fontSize: 18, color: T.success }}>✓</Text>}
          {prVal > 0 && <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>рек: {prVal}</Text>}
        </View>
        {logs.map((log: any, si: number) => (
          <View key={si} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.muted, width: 18, textAlign: "right" }}>{si + 1}</Text>
            {!log.done ? (
              <TouchableOpacity onPress={() => setActiveNumpad(si)}
                style={{ width: 72, height: 44, borderRadius: 10, borderColor: log.value ? `${T.primary}88` : T.bord, borderWidth: 1.5, backgroundColor: log.value ? `${T.primary}15` : T.lo, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 22, color: log.value ? T.txt : T.muted }}>{log.value || exercise.reps}</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 72, height: 44, borderRadius: 10, borderColor: `${T.success}44`, borderWidth: 1.5, backgroundColor: `${T.success}12`, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 22, color: T.success }}>{log.value}</Text>
              </View>
            )}
            <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, width: 28 }}>{exercise.type === "seconds" ? "сек" : "повт"}</Text>
            {!log.done ? (
              <TouchableOpacity onPress={() => { if (!log.value) { setActiveNumpad(si); return; } onComplete(si); onRest(); }}
                style={{ flex: 1, height: 44, borderRadius: 10, borderColor: log.value ? `${T.success}66` : T.bord, borderWidth: 1, backgroundColor: log.value ? `${T.success}15` : T.lo, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: log.value ? T.success : T.muted }}>{log.value ? "Готово" : "Ввести"}</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1, alignItems: "center" }}><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.success }}>✓ Выполнено</Text></View>
            )}
          </View>
        ))}
      </Card>
    </>
  );
}

/* ══════════ DASHBOARD ══════════ */
function DashboardTab({ T, state, setState, onStartWorkout }: any) {
  const { history, tasks, goals, journal } = state;
  const score = calcLifeScore(history, tasks, journal);
  const moodData = last7MoodData(journal);
  const workoutStreak = calcStreak(history);
  const todayI = todayIdx();
  const todayPlan = PLAN[todayI];
  const todayLog = history[TODAY];
  const todayTasks = tasks.filter((t: any) => t.recurring || t.dueDate === TODAY);
  const todayTasksDone = todayTasks.filter((t: any) => t.completedDates?.includes(TODAY)).length;
  const activeGoals = goals.filter((g: any) => !g.completed).slice(0, 3);
  const todayJournal = journal.find((j: any) => j.date === TODAY);
  const waterToday = todayJournal?.waterGlasses || 0;
  const dayNum = Math.floor(Date.now() / 86400000);
  const quote = QUOTES[dayNum % QUOTES.length];
  const progressionAlerts = getAllProgressionSuggestions(history);

  const setWaterGlass = (n: number) => {
    setState((s: any) => {
      const j = [...s.journal];
      const idx = j.findIndex((x: any) => x.date === TODAY);
      if (idx >= 0) j[idx] = { ...j[idx], waterGlasses: n, waterDone: n >= 8 };
      else j.unshift({ id: uid(), date: TODAY, text: "", mood: 3, energy: 3, waterGlasses: n, waterDone: n >= 8 });
      return { ...s, journal: j };
    });
  };

  return (
    <ScrollView style={{ padding: 14 }} contentContainerStyle={{ gap: 12 }}>
      <Card T={T} style={{ borderColor: `${T.primary}22`, backgroundColor: `${T.primary}10` }}>
        <Text style={{ fontFamily: "System", fontSize: 14, color: T.txt, fontStyle: "italic", lineHeight: 20 }}>«{quote.text}»</Text>
        <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.primary, marginTop: 6 }}>— {quote.author.toUpperCase()}</Text>
      </Card>

      <Card T={T} style={{ backgroundColor: `${T.primary}08`, borderColor: `${T.primary}33` }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Lbl T={T}>Score недели</Lbl>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 38, color: score.total >= 80 ? T.success : score.total >= 50 ? T.warn : T.danger }}>
              {score.total}<Text style={{ fontSize: 18, color: T.muted }}>/100</Text>
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Ring pct={score.workout} color={T.primary} label="Трен." T={T} />
            {score.tasks !== null && <Ring pct={score.tasks} color={T.success} label="Задачи" T={T} />}
            <Ring pct={score.journal} color={T.warn} label="Дневн." T={T} />
          </View>
        </View>
        {workoutStreak > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 }}>
            <Text style={{ fontSize: 13 }}>🔥</Text>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.warn }}>Серия {workoutStreak} дн.</Text>
          </View>
        )}
      </Card>

      <Card T={T}>
        <Lbl T={T}>Сегодня — {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</Lbl>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, backgroundColor: T.lo, borderRadius: 10, marginTop: 8, borderColor: todayLog?.completed ? `${T.success}55` : T.bord, borderWidth: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 22 }}>{todayPlan.emoji}</Text>
            <View>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.txt }}>{todayPlan.name}</Text>
              <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted }}>
                {todayPlan.type === "rest" ? "День отдыха" : todayLog?.completed ? `Сложность: ${todayLog.difficulty}/10` : `${todayPlan.exercises?.length || 0} упражнений`}
              </Text>
            </View>
          </View>
          {todayLog?.completed ? <Badge color={T.success} T={T}>✓</Badge> : todayPlan.type !== "rest" ? <Btn T={T} onPress={() => onStartWorkout(todayI)} style={{ minHeight: 36, paddingHorizontal: 12, fontSize: 13 }}>▶</Btn> : <Badge color={T.muted} T={T}>~</Badge>}
        </View>

        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Lbl T={T}>💧 Вода сегодня</Lbl>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 16, color: waterToday >= 8 ? T.success : T.primary }}>{waterToday}/8 ст.</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 5, flexWrap: "wrap" }}>
            {Array.from({ length: 8 }, (_, i) => (
              <TouchableOpacity key={i} onPress={() => setWaterGlass(waterToday === i + 1 ? i : i + 1)}
                style={{ width: 36, height: 36, borderRadius: 8, borderColor: i < waterToday ? T.primary : T.bord, borderWidth: 1.5, backgroundColor: i < waterToday ? `${T.primary}25` : T.lo, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 14, opacity: i < waterToday ? 1 : 0.4 }}>💧</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {todayTasks.length > 0 && (
          <View style={{ marginTop: 12, padding: 10, backgroundColor: T.lo, borderRadius: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.txt }}>Задачи дня</Text>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: todayTasksDone === todayTasks.length ? T.success : T.primary }}>{todayTasksDone}/{todayTasks.length}</Text>
            </View>
            <View style={{ height: 4, backgroundColor: T.bord, borderRadius: 2 }}>
              <View style={{ height: "100%", width: `${todayTasks.length ? (todayTasksDone / todayTasks.length) * 100 : 0}%`, backgroundColor: T.success, borderRadius: 2 }} />
            </View>
          </View>
        )}
      </Card>

      {journal.length > 0 && (
        <Card T={T}>
          <Lbl T={T}>Настроение и энергия / 7 дней</Lbl>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
            {moodData.map((d: any, i: number) => {
              const m = MOODS.find((x) => x.v === d.mood); const en = ENERGY.find((x) => x.v === d.energy);
              return (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 2 }}>
                  {d.mood ? <Text style={{ fontSize: 17 }}>{m?.e}</Text> : <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: T.bord, borderStyle: "dashed" }} />}
                  <Text style={{ fontFamily: "System", fontSize: 9, color: d.day === TODAY ? T.primary : T.muted }}>{d.date}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {activeGoals.length > 0 && (
        <Card T={T}>
          <Lbl T={T}>🎯 Цели на горизонте</Lbl>
          {activeGoals.map((g: any) => {
            const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
            return (
              <View key={g.id} style={{ marginTop: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                  <Text style={{ fontFamily: "System", fontSize: 14, color: T.txt }}>{g.emoji} {g.title}</Text>
                  <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.primary }}>{g.currentValue}/{g.targetValue} {g.unit}</Text>
                </View>
                <View style={{ height: 6, backgroundColor: T.lo, borderRadius: 3 }}>
                  <View style={{ height: "100%", width: `${Math.min(pct, 100)}%`, backgroundColor: T.primary, borderRadius: 3 }} />
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {progressionAlerts.slice(0, 2).map((a: any, i: number) => (
        <View key={i} style={{ padding: 10, backgroundColor: `${T.warn}10`, borderColor: `${T.warn}33`, borderWidth: 1, borderRadius: 10, flexDirection: "row", gap: 8 }}>
          <Text style={{ fontSize: 15 }}>💡</Text>
          <Text style={{ fontFamily: "System", fontSize: 13, color: T.txt, flex: 1 }}>{a.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

/* ══════════ WORKOUT TAB ══════════ */
function WorkoutTab({ T, session, setSession, onFinish, prs, history, onStart }: any) {
  if (!session) {
    return (
      <ScrollView style={{ padding: 14 }} contentContainerStyle={{ gap: 8 }}>
        <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 24, color: T.txt, marginBottom: 14 }}>💪 Тренировка</Text>
        {PLAN.map((plan, i) => {
          const log = history[fmt(weekDates()[i])]; const isToday = i === todayIdx();
          return (
            <Card key={i} T={T} style={{ marginBottom: 8, borderColor: isToday ? `${T.primary}55` : undefined, opacity: plan.type === "rest" ? 0.6 : 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={{ fontSize: 24 }}>{plan.emoji}</Text>
                  <View>
                    <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 16, color: isToday ? T.primary : T.txt }}>{plan.day} — {plan.name}</Text>
                    <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted }}>{plan.type === "rest" ? "Отдых" : `${plan.exercises?.length || 0} упр.`}</Text>
                  </View>
                </View>
                {log?.completed ? <Badge color={T.success} T={T}>✓</Badge> : plan.type !== "rest" ? <Btn T={T} onPress={() => onStart(i)} style={{ minHeight: 34, paddingHorizontal: 12, fontSize: 13 }} variant={isToday ? "primary" : "muted"}>▶</Btn> : <Badge color={T.muted} T={T}>~</Badge>}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    );
  }

  const plan = PLAN[session.dayIdx];
  const upd = (patch: any) => setSession((s: any) => ({ ...s, ...patch }));
  const toggleWarmup = (i: number) => { const s = new Set(session.warmupDone); s.has(i) ? s.delete(i) : s.add(i); upd({ warmupDone: s }); };
  const handleComplete = (exId: string, si: number) => { const l = { ...session.exerciseLogs }; l[exId] = l[exId].map((x: any, j: number) => (j === si ? { ...x, done: true } : x)); upd({ exerciseLogs: l }); };
  const handleValue = (exId: string, si: number, val: string) => { const l = { ...session.exerciseLogs }; l[exId] = l[exId].map((x: any, j: number) => (j === si ? { ...x, value: val } : x)); upd({ exerciseLogs: l }); };
  const doneSets = Object.values(session.exerciseLogs).flat().filter((s: any) => s.done).length;
  const totalSets = Object.values(session.exerciseLogs).flat().length;

  return (
    <ScrollView style={{ padding: 14 }} contentContainerStyle={{ gap: 10 }}>
      {session.showRest && <RestTimer T={T} onDone={() => upd({ showRest: false })} />}
      {session.phase === "warmup" && (
        <>
          <Lbl T={T}>Этап 1 / 3</Lbl>
          <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 26, color: T.txt, marginBottom: 4 }}>🔥 Разминка — {plan.name}</Text>
          <Card T={T}>
            {plan.warmup.map((item: string, i: number) => (
              <TouchableOpacity key={i} onPress={() => toggleWarmup(i)}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: i < plan.warmup.length - 1 ? 1 : 0, borderBottomColor: T.bord }}>
                <View style={{ width: 22, height: 22, borderRadius: 6, borderColor: session.warmupDone.has(i) ? T.success : T.muted, borderWidth: 2, backgroundColor: session.warmupDone.has(i) ? T.success : "transparent", justifyContent: "center", alignItems: "center" }}>
                  {session.warmupDone.has(i) && <Text style={{ color: "#000", fontSize: 13, fontWeight: "900" }}>✓</Text>}
                </View>
                <Text style={{ fontFamily: "System", fontSize: 15, color: session.warmupDone.has(i) ? T.muted : T.txt, textDecorationLine: session.warmupDone.has(i) ? "line-through" : "none" }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </Card>
          <Btn T={T} onPress={() => upd({ phase: "exercises" })} style={{ width: "100%", fontSize: 16 }} variant={session.warmupDone.size >= plan.warmup.length ? "primary" : "ghost"}>Начать упражнения →</Btn>
        </>
      )}
      {session.phase === "exercises" && (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <View><Lbl T={T}>Этап 2 / 3</Lbl><Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 24, color: T.txt }}>💪 {plan.name}</Text></View>
            <View><Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: doneSets === totalSets ? T.success : T.primary }}>{doneSets}/{totalSets}</Text><Lbl T={T}>подходов</Lbl></View>
          </View>
          <View style={{ height: 6, backgroundColor: T.lo, borderRadius: 3, marginBottom: 14 }}>
            <View style={{ height: "100%", width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%`, backgroundColor: T.primary, borderRadius: 3 }} />
          </View>
          {plan.exercises.map((ex: any) => (
            <ExerciseCard key={ex.id} T={T} exercise={ex} logs={session.exerciseLogs[ex.id] || []}
              onComplete={(si: number) => handleComplete(ex.id, si)} onValueChange={(si: number, v: string) => handleValue(ex.id, si, v)}
              onRest={() => upd({ showRest: true })} prVal={prs[ex.id] || 0} />
          ))}
          {plan.stretch.length > 0 && (
            <Card T={T} style={{ backgroundColor: `${T.success}08`, borderColor: `${T.success}33` }}>
              <Lbl T={T}>🧘 Заминка</Lbl>
              {plan.stretch.map((s: string, i: number) => <Text key={i} style={{ fontFamily: "System", fontSize: 13, color: T.muted, paddingVertical: 3 }}>· {s}</Text>)}
            </Card>
          )}
          <Btn T={T} variant={doneSets === totalSets ? "success" : "ghost"} onPress={() => upd({ phase: "finish" })} style={{ width: "100%", fontSize: 16 }}>
            {doneSets === totalSets ? "✓ Завершить →" : "Завершить (не всё) →"}
          </Btn>
        </>
      )}
      {session.phase === "finish" && (
        <>
          <Lbl T={T}>Этап 3 / 3</Lbl>
          <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 26, color: T.txt, marginBottom: 16 }}>🏁 Завершение</Text>
          <Card T={T}>
            <Lbl T={T}>Сложность тренировки</Lbl>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <TouchableOpacity key={n} onPress={() => upd({ difficulty: n })}
                  style={{ width: 42, height: 42, borderRadius: 8, borderColor: session.difficulty === n ? T.primary : T.bord, borderWidth: 2, backgroundColor: session.difficulty === n ? `${T.primary}22` : T.lo, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 17, color: session.difficulty === n ? T.primary : T.muted }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
          <Card T={T}>
            <Lbl T={T}>Болевые ощущения</Lbl>
            <TextInput placeholder="Опиши, если что-то беспокоило…" placeholderTextColor={T.muted} value={session.painNotes} onChangeText={(t) => upd({ painNotes: t })} multiline
              style={{ width: "100%", borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 10, minHeight: 80 }} />
          </Card>
          <Btn T={T} variant="success" onPress={onFinish} style={{ width: "100%", fontSize: 18, minHeight: 52 }}>✓ Сохранить тренировку</Btn>
        </>
      )}
    </ScrollView>
  );
}

/* ══════════ TASKS/GOALS TAB ══════════ */
function TasksGoalsTab({ T, tasks, setTasks, goals, setGoals }: any) {
  const [sub, setSub] = useState("tasks");
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCat, setTaskCat] = useState("habit");
  const [recurring, setRecurring] = useState(true);
  const [addingGoal, setAddingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: "", desc: "", cat: "skill", target: 100, unit: "%", deadline: "", emoji: "🎯" });
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const addTask = () => {
    if (!taskTitle.trim()) return;
    setTasks((t: any) => [...t, { id: uid(), title: taskTitle.trim(), category: taskCat, recurring, completedDates: [], createdAt: TODAY }]);
    setTaskTitle(""); setAddingTask(false);
  };
  const toggleTask = (id: string) => {
    setTasks((t: any) => t.map((task: any) => {
      if (task.id !== id) return task;
      const done = task.completedDates?.includes(TODAY);
      return { ...task, completedDates: done ? task.completedDates.filter((d: string) => d !== TODAY) : [...(task.completedDates || []), TODAY] };
    }));
  };
  const saveGoal = () => {
    if (!goalForm.title.trim()) return;
    if (editingGoalId) setGoals((g: any) => g.map((x: any) => (x.id === editingGoalId ? { ...x, ...goalForm, targetValue: Number(goalForm.target) } : x)));
    else setGoals((g: any) => [...g, { id: uid(), title: goalForm.title.trim(), desc: goalForm.desc, category: goalForm.cat, targetValue: Number(goalForm.target), currentValue: 0, unit: goalForm.unit, deadline: goalForm.deadline, emoji: goalForm.emoji, completed: false, createdAt: TODAY, history: [] }]);
    setGoalForm({ title: "", desc: "", cat: "skill", target: 100, unit: "%", deadline: "", emoji: "🎯" }); setAddingGoal(false); setEditingGoalId(null);
  };
  const updateProgress = (id: string, val: number) => {
    setGoals((g: any) => g.map((x: any) => {
      if (x.id !== id) return x;
      const nv = Math.max(0, Math.min(Number(val), x.targetValue));
      return { ...x, currentValue: nv, completed: nv >= x.targetValue, history: [...(x.history || []), { date: TODAY, value: nv }].slice(-30) };
    }));
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: T.bord, backgroundColor: T.surf }}>
        {[{ id: "tasks", l: "✓ Задачи" }, { id: "goals", l: "🎯 Цели" }].map((t) => (
          <TouchableOpacity key={t.id} onPress={() => setSub(t.id)} style={{ flex: 1, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: sub === t.id ? T.primary : "transparent" }}>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, textAlign: "center", color: sub === t.id ? T.primary : T.muted }}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={{ padding: 14 }}>
        {sub === "tasks" && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.txt }}>Задачи и привычки</Text>
              <Btn T={T} onPress={() => setAddingTask(true)} style={{ minHeight: 36, paddingHorizontal: 14, fontSize: 13 }}>+ Добавить</Btn>
            </View>
            {addingTask && (
              <Card T={T} style={{ marginBottom: 12, borderColor: `${T.primary}44` }}>
                <Lbl T={T}>Новая задача</Lbl>
                <TextInput value={taskTitle} onChangeText={setTaskTitle} placeholder="Название задачи…" placeholderTextColor={T.muted} onSubmitEditing={addTask}
                  style={{ width: "100%", height: 42, borderRadius: 8, borderColor: T.primary, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 15, paddingHorizontal: 12, marginTop: 8, marginBottom: 10 }} />
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {TASK_CATS.map((c) => (
                    <TouchableOpacity key={c.id} onPress={() => setTaskCat(c.id)}
                      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderColor: taskCat === c.id ? c.color : T.bord, borderWidth: 1.5, backgroundColor: taskCat === c.id ? `${c.color}15` : T.lo }}>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: taskCat === c.id ? c.color : T.muted }}>{c.emoji} {c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setRecurring(!recurring)} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderColor: recurring ? T.success : T.muted, borderWidth: 2, backgroundColor: recurring ? T.success : "transparent", justifyContent: "center", alignItems: "center" }}>
                    {recurring && <Text style={{ color: "#000", fontSize: 13, fontWeight: "900" }}>✓</Text>}
                  </View>
                  <Text style={{ fontFamily: "System", fontSize: 14, color: T.txt }}>Ежедневная привычка</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Btn T={T} variant="muted" onPress={() => setAddingTask(false)} style={{ flex: 1 }}>Отмена</Btn>
                  <Btn T={T} onPress={addTask} disabled={!taskTitle.trim()} style={{ flex: 2 }}>Добавить</Btn>
                </View>
              </Card>
            )}
            {tasks.length === 0 && !addingTask && <View style={{ alignItems: "center", paddingVertical: 40 }}><Text style={{ fontSize: 40, marginBottom: 10 }}>📋</Text><Text style={{ fontFamily: "System", fontSize: 14, color: T.muted }}>Добавь первую задачу</Text></View>}
            {tasks.map((task: any) => {
              const c = TASK_CATS.find((x) => x.id === task.category) || TASK_CATS[4];
              const done = task.completedDates?.includes(TODAY); const streak = taskStreakForId(task);
              return (
                <Card key={task.id} T={T} style={{ marginBottom: 10, borderColor: done ? `${T.success}44` : undefined }}>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity onPress={() => toggleTask(task.id)}
                      style={{ width: 26, height: 26, borderRadius: 8, borderColor: done ? T.success : c.color, borderWidth: 2, backgroundColor: done ? T.success : "transparent", justifyContent: "center", alignItems: "center" }}>
                      {done && <Text style={{ color: "#000", fontSize: 14, fontWeight: "900" }}>✓</Text>}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <Text style={{ fontFamily: "System", fontSize: 15, color: done ? T.muted : T.txt, textDecorationLine: done ? "line-through" : "none" }}>{task.title}</Text>
                        <Badge color={c.color} T={T}>{c.emoji} {c.label}</Badge>
                      </View>
                      {streak > 1 && <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: T.warn, marginTop: 4 }}>🔥 {streak} дн. подряд</Text>}
                    </View>
                    <TouchableOpacity onPress={() => setTasks((t: any) => t.filter((x: any) => x.id !== task.id))}><Text style={{ fontSize: 16, color: T.muted, opacity: 0.6 }}>×</Text></TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </>
        )}
        {sub === "goals" && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.txt }}>Цели</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Btn T={T} variant="muted" onPress={() => setAddingGoal(true)} style={{ minHeight: 36, paddingHorizontal: 12, fontSize: 12 }}>📋</Btn>
                <Btn T={T} onPress={() => { setAddingGoal(true); setEditingGoalId(null); setGoalForm({ title: "", desc: "", cat: "skill", target: 100, unit: "%", deadline: "", emoji: "🎯" }); }} style={{ minHeight: 36, paddingHorizontal: 14, fontSize: 13 }}>+ Новая</Btn>
              </View>
            </View>
            {addingGoal && (
              <Card T={T} style={{ marginBottom: 12, borderColor: `${T.primary}44` }}>
                <Lbl T={T}>{editingGoalId ? "Редактировать" : "Новая цель"}</Lbl>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 10 }}>
                  <TextInput value={goalForm.emoji} onChangeText={(t) => setGoalForm((f) => ({ ...f, emoji: t }))} style={{ width: 48, height: 42, borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontSize: 20, textAlign: "center" }} />
                  <TextInput value={goalForm.title} onChangeText={(t) => setGoalForm((f) => ({ ...f, title: t }))} placeholder="Название цели…" placeholderTextColor={T.muted}
                    style={{ flex: 1, height: 42, borderRadius: 8, borderColor: T.primary, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 15, paddingHorizontal: 12 }} />
                </View>
                <TextInput value={goalForm.desc} onChangeText={(t) => setGoalForm((f) => ({ ...f, desc: t }))} placeholder="Описание…" placeholderTextColor={T.muted} multiline
                  style={{ width: "100%", borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 13, padding: 10, marginBottom: 10, minHeight: 60 }} />
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {GOAL_CATS.map((c) => (
                    <TouchableOpacity key={c.id} onPress={() => setGoalForm((f) => ({ ...f, cat: c.id }))}
                      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderColor: goalForm.cat === c.id ? T.primary : T.bord, borderWidth: 1.5, backgroundColor: goalForm.cat === c.id ? `${T.primary}15` : T.lo }}>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: goalForm.cat === c.id ? T.primary : T.muted }}>{c.emoji} {c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Lbl T={T}>Цель</Lbl>
                    <TextInput keyboardType="numeric" value={String(goalForm.target)} onChangeText={(t) => setGoalForm((f) => ({ ...f, target: Number(t) || 0 }))}
                      style={{ height: 38, borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontWeight: "700", fontSize: 16, paddingHorizontal: 10 }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Lbl T={T}>Единица</Lbl>
                    <TextInput value={goalForm.unit} onChangeText={(t) => setGoalForm((f) => ({ ...f, unit: t }))}
                      style={{ height: 38, borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, paddingHorizontal: 10 }} />
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Btn T={T} variant="muted" onPress={() => { setAddingGoal(false); setEditingGoalId(null); }} style={{ flex: 1 }}>Отмена</Btn>
                  <Btn T={T} onPress={saveGoal} disabled={!goalForm.title.trim()} style={{ flex: 2 }}>Сохранить</Btn>
                </View>
              </Card>
            )}
            {goals.filter((g: any) => !g.completed).length === 0 && !addingGoal && <View style={{ alignItems: "center", paddingVertical: 40 }}><Text style={{ fontSize: 40, marginBottom: 10 }}>🌅</Text><Text style={{ fontFamily: "System", fontSize: 14, color: T.muted }}>Поставь первую цель</Text></View>}
            {goals.filter((g: any) => !g.completed).map((g: any) => {
              const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
              return (
                <Card key={g.id} T={T} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <View>
                      <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.txt }}>{g.emoji} {g.title}</Text>
                      {g.desc && <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, marginTop: 2 }}>{g.desc}</Text>}
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity onPress={() => { setEditingGoalId(g.id); setGoalForm({ title: g.title, desc: g.desc || "", cat: g.category, target: g.targetValue, unit: g.unit, deadline: g.deadline || "", emoji: g.emoji }); setAddingGoal(true); }}><Text style={{ fontSize: 14, color: T.muted }}>✏️</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => setGoals((g2: any) => g2.filter((x: any) => x.id !== g.id))}><Text style={{ fontSize: 14, color: T.muted }}>🗑</Text></TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 20, color: T.primary }}>{g.currentValue}<Text style={{ color: T.muted, fontSize: 13 }}>/{g.targetValue} {g.unit}</Text></Text>
                    <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: pct >= 100 ? T.success : pct >= 50 ? T.warn : T.primary }}>{pct}%</Text>
                  </View>
                  <View style={{ height: 10, backgroundColor: T.lo, borderRadius: 5, marginBottom: 10 }}>
                    <View style={{ height: "100%", width: `${Math.min(pct, 100)}%`, backgroundColor: T.primary, borderRadius: 5 }} />
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <View style={{ flex: 1, height: 4, backgroundColor: T.lo, borderRadius: 2 }}>
                      <View style={{ height: "100%", width: `${Math.min(pct, 100)}%`, backgroundColor: T.primary, borderRadius: 2 }} />
                    </View>
                    <TextInput keyboardType="numeric" value={String(g.currentValue)} onChangeText={(t) => updateProgress(g.id, Number(t))}
                      style={{ width: 60, height: 34, borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontWeight: "700", fontSize: 16, textAlign: "center" }} />
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ══════════ JOURNAL TAB ══════════ */
function JournalBodyTab({ T, journal, setJournal, bodyLog, setBodyLog, reflections, setReflections, painLog, setPainLog }: any) {
  const [sub, setSub] = useState("journal");
  const [adding, setAdding] = useState(false);
  const [jText, setJText] = useState("");
  const [jMood, setJMood] = useState(3);
  const [jEnergy, setJEnergy] = useState(3);
  const [jSleep, setJSleep] = useState(7);

  const saveJournal = () => {
    if (!jText.trim()) return;
    setJournal((j: any) => [{ id: uid(), date: TODAY, text: jText.trim(), mood: jMood, energy: jEnergy, sleep: jSleep, createdAt: new Date().toISOString() }, ...j]);
    setJText(""); setJMood(3); setJEnergy(3); setJSleep(7); setAdding(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: T.bord, backgroundColor: T.surf }}>
        {[{ id: "journal", l: "📓 Дневник" }, { id: "body", l: "⚖️ Тело" }, { id: "pain", l: "🩺 Боль" }, { id: "reflection", l: "🧘 Рефл." }].map((t) => (
          <TouchableOpacity key={t.id} onPress={() => setSub(t.id)} style={{ flex: 1, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: sub === t.id ? T.primary : "transparent" }}>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, textAlign: "center", color: sub === t.id ? T.primary : T.muted }}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={{ padding: 14 }}>
        {sub === "journal" && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.txt }}>Дневник</Text>
              <Btn T={T} onPress={() => setAdding(!adding)} style={{ minHeight: 36, paddingHorizontal: 14, fontSize: 13 }}>{adding ? "Закрыть" : "+ Запись"}</Btn>
            </View>
            {adding && (
              <Card T={T} style={{ marginBottom: 12, borderColor: `${T.primary}44` }}>
                <Lbl T={T}>Как прошёл день?</Lbl>
                <View style={{ marginTop: 8, marginBottom: 10 }}>
                  <Lbl T={T}>Настроение</Lbl>
                  <View style={{ flexDirection: "row", gap: 5, marginTop: 6 }}>
                    {MOODS.map((m) => (
                      <TouchableOpacity key={m.v} onPress={() => setJMood(m.v)}
                        style={{ flex: 1, paddingVertical: 6, borderRadius: 8, borderColor: jMood === m.v ? T.primary : T.bord, borderWidth: 2, backgroundColor: jMood === m.v ? `${T.primary}15` : T.lo, alignItems: "center" }}>
                        <Text style={{ fontSize: 20 }}>{m.e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Lbl T={T}>Энергия</Lbl>
                  <View style={{ flexDirection: "row", gap: 5, marginTop: 6 }}>
                    {ENERGY.map((e) => (
                      <TouchableOpacity key={e.v} onPress={() => setJEnergy(e.v)}
                        style={{ flex: 1, paddingVertical: 6, borderRadius: 8, borderColor: jEnergy === e.v ? T.success : T.bord, borderWidth: 2, backgroundColor: jEnergy === e.v ? `${T.success}15` : T.lo, alignItems: "center" }}>
                        <Text style={{ fontSize: 20 }}>{e.e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Lbl T={T}>Сон</Lbl>
                    <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: jSleep >= 7 ? T.primary : jSleep >= 6 ? T.warn : T.danger }}>{jSleep}ч — {sleepLabel(jSleep)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                    {[4, 5, 6, 7, 8, 9].map((h) => (
                      <TouchableOpacity key={h} onPress={() => setJSleep(h)}
                        style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, borderColor: jSleep === h ? T.primary : T.bord, borderWidth: 1, backgroundColor: jSleep === h ? `${T.primary}15` : T.lo }}>
                        <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: jSleep === h ? T.primary : T.muted }}>{h}ч</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TextInput value={jText} onChangeText={setJText} placeholder="Мысли, идеи, наблюдения…" placeholderTextColor={T.muted} multiline
                  style={{ width: "100%", borderRadius: 10, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 12, minHeight: 120, marginBottom: 10 }} />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Btn T={T} variant="muted" onPress={() => setAdding(false)} style={{ flex: 1 }}>Отмена</Btn>
                  <Btn T={T} onPress={saveJournal} disabled={!jText.trim()} style={{ flex: 2 }}>Сохранить</Btn>
                </View>
              </Card>
            )}
            {journal.length === 0 && !adding && <View style={{ alignItems: "center", paddingVertical: 36 }}><Text style={{ fontSize: 36, marginBottom: 10 }}>📝</Text><Text style={{ fontFamily: "System", fontSize: 14, color: T.muted }}>Начни вести дневник</Text></View>}
            {journal.map((entry: any) => {
              const m = MOODS.find((x) => x.v === entry.mood); const en = ENERGY.find((x) => x.v === entry.energy);
              return (
                <Card key={entry.id} T={T} style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: (m?.v ?? 3) >= 4 ? T.success : (m?.v ?? 3) <= 2 ? T.danger : T.muted }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 20 }}>{m?.e}</Text>
                      {entry.energy && <Text style={{ fontSize: 16, opacity: 0.7 }}>{en?.e}</Text>}
                      <View>
                        <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: entry.date === TODAY ? T.primary : T.muted }}>
                          {entry.date === TODAY ? "Сегодня" : new Date(entry.date + "T12:00:00").toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" })}
                        </Text>
                        <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{m?.l}{entry.energy ? " · " + en?.l : ""}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setJournal((j: any) => j.filter((x: any) => x.id !== entry.id))}><Text style={{ fontSize: 15, color: T.muted, opacity: 0.6 }}>×</Text></TouchableOpacity>
                  </View>
                  {entry.text && <Text style={{ fontFamily: "System", fontSize: 14, color: T.txt, lineHeight: 22 }}>{entry.text}</Text>}
                </Card>
              );
            })}
          </>
        )}
        {sub === "body" && (
          <>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.txt, marginBottom: 14 }}>Трекер тела</Text>
            {bodyLog.length === 0 && <View style={{ alignItems: "center", paddingVertical: 40 }}><Text style={{ fontSize: 40, marginBottom: 10 }}>⚖️</Text><Text style={{ fontFamily: "System", fontSize: 14, color: T.muted }}>Начни отслеживать тело</Text></View>}
            {bodyLog.slice(0, 10).map((entry: any) => (
              <Card key={entry.id} T={T} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.muted }}>{new Date(entry.date + "T12:00:00").toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" })}</Text>
                  <TouchableOpacity onPress={() => setBodyLog((l: any) => l.filter((x: any) => x.id !== entry.id))}><Text style={{ fontSize: 14, color: T.muted, opacity: 0.6 }}>×</Text></TouchableOpacity>
                </View>
                <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                  {entry.weight && <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.primary }}>⚖️ {entry.weight} кг</Text>}
                  {entry.chest && <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.success }}>📏 {entry.chest} (грудь)</Text>}
                  {entry.waist && <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.warn }}>📏 {entry.waist} (талия)</Text>}
                  {entry.arms && <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.muted }}>💪 {entry.arms} (бицепс)</Text>}
                </View>
              </Card>
            ))}
          </>
        )}
        {sub === "pain" && (
          <>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.txt, marginBottom: 4 }}>Боль и асимметрия</Text>
            <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, marginBottom: 14 }}>Отслеживай паттерны — предотвращай травмы</Text>
            {painLog?.length === 0 && <View style={{ alignItems: "center", paddingVertical: 36 }}><Text style={{ fontSize: 40, marginBottom: 10 }}>🩺</Text><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 16, color: T.txt, marginBottom: 6 }}>Журнал болей пуст</Text></View>}
            {painLog?.slice(0, 20).map((entry: any) => {
              const zone = PAIN_ZONES.find((z) => z.id === entry.zone); const intensity = PAIN_INTENSITY.find((p) => p.v === entry.intensity);
              return (
                <View key={entry.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 9, backgroundColor: T.lo, borderColor: T.bord, borderWidth: 1, borderRadius: 10, marginBottom: 6 }}>
                  <Text style={{ fontSize: 20 }}>{zone?.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.txt }}>{zone?.name} · {entry.isRight ? "Правая" : "Левая"}</Text>
                    <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{entry.date} · {intensity?.l}{entry.note ? " · " + entry.note.slice(0, 40) : ""}</Text>
                  </View>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: intensity?.c }} />
                  <TouchableOpacity onPress={() => setPainLog((l: any) => (l || []).filter((x: any) => x.id !== entry.id))}><Text style={{ color: T.muted, opacity: 0.5 }}>✕</Text></TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
        {sub === "reflection" && (
          <>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.txt, marginBottom: 4 }}>Еженедельная рефлексия</Text>
            <Text style={{ fontFamily: "System", fontSize: 13, color: T.muted, marginBottom: 14 }}>Воскресный чек-ин — ключ к настоящему росту</Text>
            {reflections.length === 0 && <View style={{ alignItems: "center", paddingVertical: 36 }}><Text style={{ fontSize: 40, marginBottom: 10 }}>🧘</Text><Text style={{ fontFamily: "System", fontSize: 14, color: T.muted }}>Заполни первую рефлексию</Text></View>}
            {reflections.map((r: any) => (
              <Card key={r.id} T={T} style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: T.success }}>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.muted, marginBottom: 10 }}>{new Date(r.date + "T12:00:00").toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</Text>
                {r.went && <View style={{ marginBottom: 8 }}><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.success, letterSpacing: 1, marginBottom: 3 }}>✅ ПОЛУЧИЛОСЬ</Text><Text style={{ fontFamily: "System", fontSize: 13, color: T.txt, lineHeight: 20 }}>{r.went}</Text></View>}
                {r.didnt && <View style={{ marginBottom: 8 }}><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.warn, letterSpacing: 1, marginBottom: 3 }}>🔄 УЛУЧШИТЬ</Text><Text style={{ fontFamily: "System", fontSize: 13, color: T.txt, lineHeight: 20 }}>{r.didnt}</Text></View>}
                {r.focus && <View><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.primary, letterSpacing: 1, marginBottom: 3 }}>🎯 ФОКУС</Text><Text style={{ fontFamily: "System", fontSize: 13, color: T.txt, lineHeight: 20 }}>{r.focus}</Text></View>}
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ══════════ AI MENTOR TAB ══════════ */
function MentorTab({ T, state, setState }: any) {
  const aiConfig = state.aiConfig || {};
  const prov = AI_PROVIDERS.find((p) => p.id === (aiConfig.provider || "claude")) || AI_PROVIDERS[0];
  const provColor = prov.color;
  const [messages, setMessages] = useState(() => state.aiHistory || []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<any>(null);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [messages, loading]);

  const saveHistory = (msgs: any[]) => setState((s: any) => ({ ...s, aiHistory: msgs.slice(-80) }));

  const send = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput(""); setError(null);
    const userMsg = { role: "user", content: userText, ts: Date.now() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setLoading(true);
    try {
      const reply = await callAI(newMsgs, buildAIContext(state), aiConfig);
      const aMsg = { role: "assistant", content: reply, ts: Date.now(), provider: aiConfig.provider || "claude" };
      const final = [...newMsgs, aMsg]; setMessages(final); saveHistory(final);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: T.bord, backgroundColor: T.surf }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${provColor}15`, borderColor: `${provColor}55`, borderWidth: 1.5, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 19 }}>✨</Text>
            </View>
            <View><Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 20, color: T.txt }}>НЕЙРО</Text><Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{prov.name}</Text></View>
          </View>
          <TouchableOpacity onPress={() => setShowSettings(true)}><Text style={{ fontSize: 18, color: T.muted }}>⚙️</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
          {QUICK_PROMPTS.map(({ icon, text }, i) => (
            <TouchableOpacity key={i} onPress={() => send(text)} disabled={loading}
              style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 16, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo, marginRight: 5 }}>
              <Text style={{ fontSize: 10 }}>{icon}</Text><Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={{ flex: 1, padding: 12 }} ref={scrollRef}>
        {messages.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: `${provColor}15`, borderColor: `${provColor}33`, borderWidth: 2, justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 32 }}>✨</Text>
            </View>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 26, color: T.txt, marginBottom: 6 }}>НЕЙРО</Text>
            <Text style={{ fontFamily: "System", fontSize: 14, color: T.muted, textAlign: "center", lineHeight: 22, maxWidth: 260 }}>Персональный ИИ-ассистент.{"\n"}Знает твои тренировки, цели и настроение.</Text>
          </View>
        )}
        {messages.map((m: any, i: number) => {
          const isUser = m.role === "user";
          return (
            <View key={i} style={{ alignItems: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <View style={{ maxWidth: "88%", padding: isUser ? 12 : 14, borderRadius: 18, backgroundColor: isUser ? provColor : T.card, borderColor: isUser ? "transparent" : T.bord, borderWidth: isUser ? 0 : 1 }}>
                <Text style={{ fontFamily: "System", fontSize: 14, color: isUser ? "#000" : T.txt, lineHeight: 20 }}>{m.content}</Text>
              </View>
              {m.ts && <Text style={{ fontFamily: "System", fontSize: 9, color: T.muted, marginTop: 2 }}>{new Date(m.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</Text>}
            </View>
          );
        })}
        {loading && <View style={{ flexDirection: "row", gap: 5, padding: 12, backgroundColor: T.card, borderRadius: 18, alignSelf: "flex-start", borderColor: T.bord, borderWidth: 1 }}><ActivityIndicator color={provColor} /><Text style={{ fontFamily: "System", fontSize: 13, color: T.muted }}>Думаю…</Text></View>}
        {error && (
          <View style={{ padding: 12, backgroundColor: `${T.danger}12`, borderColor: `${T.danger}44`, borderWidth: 1, borderRadius: 14 }}>
            <Text style={{ fontFamily: "System", fontSize: 13, color: T.danger }}>{error}</Text>
            {error.includes("ключ") && <TouchableOpacity onPress={() => setShowSettings(true)}><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: T.primary, marginTop: 6 }}>Открыть настройки →</Text></TouchableOpacity>}
          </View>
        )}
      </ScrollView>
      <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: T.bord, backgroundColor: T.surf }}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
          <TextInput value={input} onChangeText={setInput} placeholder="Напиши что угодно…" placeholderTextColor={T.muted} multiline
            style={{ flex: 1, borderRadius: 14, borderColor: input ? `${provColor}88` : T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 11, maxHeight: 130 }} />
          <TouchableOpacity onPress={() => send()} disabled={!input.trim() || loading}
            style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: input.trim() && !loading ? provColor : T.lo, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 22, color: input.trim() && !loading ? "#000" : T.muted }}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showSettings && <AISettingsModal T={T} aiConfig={aiConfig} onSave={(cfg: any) => setState((s: any) => ({ ...s, aiConfig: { ...(s.aiConfig || {}), ...cfg } }))} onClose={() => setShowSettings(false)} />}
    </View>
  );
}

/* ══════════ AI SETTINGS MODAL ══════════ */
function AISettingsModal({ T, aiConfig, onSave, onClose }: any) {
  const cfg = aiConfig || {};
  const [provider, setProvider] = useState(cfg.provider || "claude");
  const [apiKey, setApiKey] = useState(cfg.apiKey || "");
  const [model, setModel] = useState(cfg.model || "");
  const [systemExtra, setSystemExtra] = useState(cfg.systemExtra || "");
  const prov = AI_PROVIDERS.find((p) => p.id === provider) || AI_PROVIDERS[0];
  const save = () => { onSave({ provider, apiKey: apiKey.trim(), model: model || prov.defaultModel, endpoint: "", systemExtra }); onClose(); };
  return (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.88)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: "90%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.txt }}>Настройки НЕЙРО</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 20, color: T.muted }}>✕</Text></TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
            {AI_PROVIDERS.map((p) => {
              const active = provider === p.id;
              return (
                <TouchableOpacity key={p.id} onPress={() => { setProvider(p.id); setModel(""); }}
                  style={{ padding: 10, borderRadius: 12, borderColor: active ? p.color : T.bord, borderWidth: active ? 2 : 1.5, backgroundColor: active ? `${p.color}12` : T.card, alignItems: "center", minWidth: 80 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${p.color}20`, justifyContent: "center", alignItems: "center", marginBottom: 4 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.color }} />
                  </View>
                  <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 12, color: active ? p.color : T.txt }}>{p.short}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {prov.needsKey && (
            <View style={{ marginBottom: 14 }}>
              <Lbl T={T}>API Ключ</Lbl>
              <TextInput value={apiKey} onChangeText={setApiKey} placeholder={prov.keyPrefix ? `${prov.keyPrefix}…` : "Твой API ключ"} placeholderTextColor={T.muted} secureTextEntry
                style={{ height: 42, borderRadius: 9, borderColor: apiKey ? `${T.success}88` : T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, paddingHorizontal: 12, marginTop: 6 }} />
            </View>
          )}
          {prov.models.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Lbl T={T}>Модель</Lbl>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {prov.models.map((m) => {
                  const cur = (model || prov.defaultModel) === m;
                  return (
                    <TouchableOpacity key={m} onPress={() => setModel(m)}
                      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderColor: cur ? prov.color : T.bord, borderWidth: 1.5, backgroundColor: cur ? `${prov.color}10` : T.lo }}>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: cur ? prov.color : T.txt }}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          <View style={{ marginBottom: 14 }}>
            <Lbl T={T}>Доп. инструкции</Lbl>
            <TextInput value={systemExtra} onChangeText={setSystemExtra} placeholder="Напр.: отвечай только по-русски" placeholderTextColor={T.muted} multiline
              style={{ borderRadius: 9, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 13, padding: 10, minHeight: 60, marginTop: 6 }} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Btn T={T} variant="muted" onPress={onClose} style={{ flex: 1 }}>Отмена</Btn>
            <Btn T={T} onPress={save} style={{ flex: 2 }}>Сохранить</Btn>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════ STATS TAB ══════════ */
function StatsTab({ T, history, tasks, goals, journal, achievements, user, setState }: any) {
  const [sub, setSub] = useState("stats");
  const [selEx, setSelEx] = useState("pushups");
  const prs = getPRs(history);
  const trend = require("./src/utils/helpers").exerciseTrend(history, selEx);
  const totalW = Object.values(history).filter((l: any) => l.completed).length;
  const streak = calcStreak(history);
  const auto1RM = require("./src/utils/helpers").computeAuto1RM(history);
  const alerts = getAllProgressionSuggestions(history);
  const earned = achievements || [];
  const notEarned = ACHIEVEMENT_DEFS.filter((a) => !earned.includes(a.id));
  const trackedEx = PLAN.flatMap((d) => d.exercises || []).reduce((a: any[], e) => { if (!a.find((x) => x.id === e.id)) a.push(e); return a; }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: T.bord, backgroundColor: T.surf }}>
        {[{ id: "stats", l: "📊 Статы" }, { id: "achievements", l: "🏆 Достиж." }, { id: "anatomy", l: "🫀 Анатомия" }].map((t) => (
          <TouchableOpacity key={t.id} onPress={() => setSub(t.id)} style={{ flex: 1, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: sub === t.id ? T.primary : "transparent" }}>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, textAlign: "center", color: sub === t.id ? T.primary : T.muted }}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={{ padding: 14 }}>
        {sub === "stats" && (
          <>
            <View style={{ flexDirection: "row", gap: 7, marginBottom: 14 }}>
              {[{ l: "Тренировок", v: totalW, c: T.primary }, { l: "🔥 Серия", v: streak, c: T.success }].map((s, i) => (
                <Card key={i} T={T} style={{ flex: 1, alignItems: "center", padding: 10 }}>
                  <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 20, color: s.c }}>{s.v}</Text><Lbl T={T}>{s.l}</Lbl>
                </Card>
              ))}
            </View>
            {auto1RM && auto1RM !== (user?.maxPushups || 27) && (
              <View style={{ padding: 10, backgroundColor: `${T.success}10`, borderColor: `${T.success}33`, borderWidth: 1, borderRadius: 12, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 18 }}>📈</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.success }}>Расчётный максимум обновился</Text>
                  <Text style={{ fontFamily: "System", fontSize: 12, color: T.txt, marginTop: 2 }}>По формуле Эпли: {auto1RM} повт (сейчас: {user?.maxPushups || 27})</Text>
                </View>
                <TouchableOpacity onPress={() => setState((s: any) => ({ ...s, user: { ...s.user, maxPushups: auto1RM } }))}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderColor: `${T.success}44`, borderWidth: 1, backgroundColor: `${T.success}15` }}>
                  <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: T.success }}>Обновить</Text>
                </TouchableOpacity>
              </View>
            )}
            <Card T={T} style={{ marginBottom: 14 }}>
              <Lbl T={T}>Динамика упражнения</Lbl>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 8, marginBottom: 12 }}>
                {["pushups", "pause_pushups", "squats", "plank", "hollow"].map((id) => {
                  const ex = trackedEx.find((e: any) => e.id === id); if (!ex) return null;
                  return (
                    <TouchableOpacity key={id} onPress={() => setSelEx(id)}
                      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderColor: selEx === id ? T.primary : T.bord, borderWidth: 1.5, backgroundColor: selEx === id ? `${T.primary}15` : T.lo }}>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: selEx === id ? T.primary : T.muted }}>{ex.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {trend.length > 1 ? (
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3, height: 80 }}>
                  {trend.map((d: any, i: number) => {
                    const max = Math.max(...trend.map((t: any) => t.val), 1); const h = (d.val / max) * 70;
                    return (
                      <View key={i} style={{ flex: 1, alignItems: "center" }}>
                        <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 10, color: T.success, marginBottom: 2 }}>{d.val}</Text>
                        <View style={{ width: "100%", height: h, backgroundColor: T.success, borderRadius: 3, opacity: 0.7 }} />
                        <Text style={{ fontFamily: "System", fontSize: 8, color: T.muted, marginTop: 2 }}>{d.date}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : <Text style={{ fontFamily: "System", fontSize: 13, color: T.muted, textAlign: "center", paddingVertical: 20 }}>Нужно минимум 2 записи</Text>}
            </Card>
            {Object.keys(prs).length > 0 && (
              <Card T={T} style={{ marginBottom: 14 }}>
                <Lbl T={T}>🏆 Личные рекорды</Lbl>
                {Object.entries(prs).slice(0, 8).map(([id, val]) => {
                  const ex = trackedEx.find((e: any) => e.id === id); if (!ex || !val) return null;
                  return (
                    <View key={id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: T.bord }}>
                      <Text style={{ fontFamily: "System", fontSize: 14, color: T.txt }}>{ex.name}</Text>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 16, color: T.warn }}>{val} {ex.type === "seconds" ? "сек" : "повт"}</Text>
                    </View>
                  );
                })}
              </Card>
            )}
            {alerts.length > 0 && (
              <Card T={T} style={{ marginBottom: 14, backgroundColor: `${T.warn}08`, borderColor: `${T.warn}33` }}>
                <Lbl T={T}>💡 Прогрессия</Lbl>
                {alerts.map((a: any, i: number) => <Text key={i} style={{ fontFamily: "System", fontSize: 14, color: T.txt, paddingVertical: 5, borderBottomWidth: i < alerts.length - 1 ? 1 : 0, borderBottomColor: T.bord }}>{a.message}</Text>)}
              </Card>
            )}
          </>
        )}
        {sub === "achievements" && (
          <>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.txt, marginBottom: 4 }}>Достижения</Text>
            <Text style={{ fontFamily: "System", fontSize: 13, color: T.muted, marginBottom: 10 }}>{earned.length} / {ACHIEVEMENT_DEFS.length}</Text>
            <View style={{ height: 8, backgroundColor: T.lo, borderRadius: 4, marginBottom: 16 }}>
              <View style={{ height: "100%", width: `${Math.round((earned.length / ACHIEVEMENT_DEFS.length) * 100)}%`, backgroundColor: T.primary, borderRadius: 4 }} />
            </View>
            {earned.length > 0 && (
              <>
                <Lbl T={T}>Получено</Lbl>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 16 }}>
                  {ACHIEVEMENT_DEFS.filter((a) => earned.includes(a.id)).map((a) => (
                    <Card key={a.id} T={T} style={{ width: "48%", padding: 12, backgroundColor: `${T.success}08`, borderColor: `${T.success}44` }}>
                      <Text style={{ fontSize: 28, marginBottom: 6 }}>{a.emoji}</Text>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.success, marginBottom: 2 }}>{a.title}</Text>
                      <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{a.desc}</Text>
                    </Card>
                  ))}
                </View>
              </>
            )}
            {notEarned.length > 0 && (
              <>
                <Lbl T={T}>Впереди</Lbl>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {notEarned.map((a) => (
                    <Card key={a.id} T={T} style={{ width: "48%", padding: 12, opacity: 0.45 }}>
                      <Text style={{ fontSize: 28, marginBottom: 6, opacity: 0.5 }}>{a.emoji}</Text>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.muted, marginBottom: 2 }}>{a.title}</Text>
                      <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{a.desc}</Text>
                    </Card>
                  ))}
                </View>
              </>
            )}
          </>
        )}
        {sub === "anatomy" && <AnatomyTab T={T} history={history} />}
      </ScrollView>
    </View>
  );
}

/* ══════════ ANATOMY TAB ══════════ */
function AnatomyTab({ T, history }: any) {
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const prs = getPRs(history);
  const zones = [{ id: "all", l: "Всё тело" }, { id: "upper", l: "Верх" }, { id: "core", l: "Кор" }, { id: "lower", l: "Ноги" }];
  const filtered = filter === "all" ? MUSCLES : MUSCLES.filter((m) => m.zone === filter);
  const trackedEx = PLAN.flatMap((d) => d.exercises || []).reduce((a: any[], e) => { if (!a.find((x) => x.id === e.id)) a.push(e); return a; }, []);

  if (selected) {
    const exList = trackedEx.filter((ex: any) => selected.exercises.includes(ex.id));
    return (
      <>
        <TouchableOpacity onPress={() => setSelected(null)} style={{ marginBottom: 14 }}><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.primary }}>← Назад к анатомии</Text></TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: `${selected.color}22`, borderColor: `${selected.color}44`, borderWidth: 2, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 28 }}>{selected.emoji}</Text>
          </View>
          <View><Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 24, color: T.txt }}>{selected.name}</Text><Badge color={selected.color} T={T}>{selected.zone === "upper" ? "Верх" : selected.zone === "core" ? "Кор" : "Ноги"}</Badge></View>
        </View>
        <Card T={T} style={{ marginBottom: 12 }}>
          <Lbl T={T}>О мышце</Lbl>
          <Text style={{ fontFamily: "System", fontSize: 14, color: T.txt, lineHeight: 20, marginTop: 8 }}>{selected.desc}</Text>
          <View style={{ padding: 10, backgroundColor: T.lo, borderRadius: 8, marginTop: 8 }}><Lbl T={T}>Анатомия</Lbl><Text style={{ fontFamily: "System", fontSize: 13, color: T.muted, lineHeight: 18, marginTop: 4 }}>{selected.anatomy}</Text></View>
        </Card>
        <Card T={T} style={{ marginBottom: 12 }}>
          <Lbl T={T}>Упражнения в твоей программе</Lbl>
          {exList.length === 0 && <Text style={{ fontFamily: "System", fontSize: 13, color: T.muted, marginTop: 8 }}>Нет прямых упражнений</Text>}
          {exList.map((ex: any) => (
            <View key={ex.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: T.bord }}>
              <View><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.txt }}>{ex.name}</Text><Text style={{ fontFamily: "System", fontSize: 12, color: T.muted }}>{ex.sets} подхода · {ex.reps} {ex.type === "seconds" ? "сек" : "повт"}</Text></View>
              {(prs[ex.id] || 0) > 0 && <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.warn }}>🏆 {prs[ex.id]}</Text>}
            </View>
          ))}
        </Card>
        <Card T={T} style={{ marginBottom: 12, backgroundColor: `${selected.color}08`, borderColor: `${selected.color}33` }}>
          <Lbl T={T}>💡 Советы по технике</Lbl>
          {selected.tips.map((t: string, i: number) => (
            <View key={i} style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: `${selected.color}22`, borderColor: `${selected.color}44`, borderWidth: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 11, color: selected.color }}>{i + 1}</Text>
              </View>
              <Text style={{ fontFamily: "System", fontSize: 14, color: T.txt, lineHeight: 20, flex: 1 }}>{t}</Text>
            </View>
          ))}
        </Card>
        <Card T={T} style={{ marginBottom: 12, backgroundColor: `${T.danger}08`, borderColor: `${T.danger}22` }}>
          <Lbl T={T}>⚠️ Частые ошибки</Lbl>
          {selected.mistakes.map((m: string, i: number) => <Text key={i} style={{ fontFamily: "System", fontSize: 13, color: T.txt, marginTop: 6, lineHeight: 18 }}>✗ {m}</Text>)}
        </Card>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Card T={T} style={{ flex: 1, alignItems: "center" }}><Text style={{ fontSize: 24, marginBottom: 6 }}>⏱</Text><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.warn }}>{selected.recovery}</Text><Lbl T={T}>Восстановление</Lbl></Card>
          <Card T={T} style={{ flex: 1 }}><Lbl T={T}>Прогрессия</Lbl><Text style={{ fontFamily: "System", fontSize: 12, color: T.txt, lineHeight: 18, marginTop: 4 }}>{selected.nextLevel}</Text></Card>
        </View>
      </>
    );
  }

  return (
    <>
      <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 24, color: T.txt, marginBottom: 4 }}>🫀 Анатомия</Text>
      <Text style={{ fontFamily: "System", fontSize: 13, color: T.muted, marginBottom: 14 }}>Знай свои мышцы — тренируйся умнее</Text>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
        {zones.map((z) => (
          <TouchableOpacity key={z.id} onPress={() => setFilter(z.id)}
            style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderColor: filter === z.id ? T.primary : T.bord, borderWidth: 1.5, backgroundColor: filter === z.id ? `${T.primary}15` : T.lo }}>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: filter === z.id ? T.primary : T.muted }}>{z.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {filtered.map((m) => {
          const exList = trackedEx.filter((ex: any) => m.exercises.includes(ex.id));
          const hasPR = exList.some((ex: any) => (prs[ex.id] || 0) > 0);
          return (
            <TouchableOpacity key={m.id} onPress={() => setSelected(m)} style={{ width: "48%", backgroundColor: T.card, borderColor: T.bord, borderWidth: 1, borderRadius: 14, padding: 14 }}>
              <View style={{ height: 3, backgroundColor: m.color, borderRadius: 3, marginBottom: 8 }} />
              <Text style={{ fontSize: 28, marginBottom: 8 }}>{m.emoji}</Text>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 15, color: T.txt, marginBottom: 4 }}>{m.name}</Text>
              <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted, lineHeight: 16, marginBottom: 8 }}>{m.desc.slice(0, 60)}…</Text>
              <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap" }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: `${m.color}15`, borderColor: `${m.color}33`, borderWidth: 1 }}><Text style={{ fontFamily: "System", fontSize: 10, color: m.color }}>{exList.length} упр.</Text></View>
                {hasPR && <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: `${T.warn}15`, borderColor: `${T.warn}33`, borderWidth: 1 }}><Text style={{ fontFamily: "System", fontSize: 10, color: T.warn }}>🏆 PR</Text></View>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

/* ══════════ PROFILE TAB ══════════ */
function ProfileTab({ T, state, setState }: any) {
  const [editing, setEditing] = useState(false);
  const [mp, setMp] = useState(state.user.maxPushups);
  const [note, setNote] = useState(state.user.note || "");
  const [showReset, setShowReset] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const total = Object.values(state.history).filter((l: any) => l.completed).length;
  const save = () => { setState((s: any) => ({ ...s, user: { ...s.user, maxPushups: parseInt(mp) || 27, note } })); setEditing(false); };

  return (
    <ScrollView style={{ padding: 14 }} contentContainerStyle={{ gap: 12 }}>
      <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 24, color: T.txt, marginBottom: 14 }}>⚙️ Профиль</Text>
      <Card T={T} style={{ backgroundColor: `${T.primary}08`, borderColor: `${T.primary}33` }}>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}><Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 28, color: T.primary }}>{total}</Text><Lbl T={T}>Тренировок</Lbl></View>
          <View style={{ width: 1, backgroundColor: T.bord }} />
          <View style={{ alignItems: "center" }}><Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 28, color: T.success }}>{state.user.maxPushups}</Text><Lbl T={T}>Макс. повт.</Lbl></View>
        </View>
      </Card>
      <Card T={T}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Lbl T={T}>Мои данные</Lbl>
          <Btn T={T} variant="ghost" onPress={() => { setEditing(!editing); if (editing) setMp(state.user.maxPushups); }} style={{ minHeight: 32, paddingHorizontal: 12, fontSize: 12 }}>{editing ? "Отмена" : "Изменить"}</Btn>
        </View>
        <Lbl T={T}>Максимум отжиманий</Lbl>
        {editing ? (
          <TextInput keyboardType="numeric" value={String(mp)} onChangeText={(t) => setMp(t)}
            style={{ height: 44, borderRadius: 8, borderColor: T.primary, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontWeight: "700", fontSize: 22, paddingHorizontal: 12, marginTop: 6, marginBottom: 10 }} />
        ) : <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 32, color: T.primary, marginBottom: 10 }}>{state.user.maxPushups}</Text>}
        {editing && (
          <>
            <Lbl T={T}>Заметки</Lbl>
            <TextInput value={note} onChangeText={setNote} multiline
              style={{ borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 10, minHeight: 60, marginTop: 6, marginBottom: 10 }} />
            <Btn T={T} onPress={save} style={{ width: "100%" }}>Сохранить</Btn>
          </>
        )}
      </Card>
      <Card T={T}>
        <Lbl T={T}>Настройки</Lbl>
        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Text style={{ fontSize: 14 }}>🎨</Text>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, letterSpacing: 1, color: T.muted, textTransform: "uppercase" }}>ТЕМА ОФОРМЛЕНИЯ</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            {THEME_LIST.map((theme) => {
              const th = getTheme(theme.id); const cur = (state.themeId || "cosmos") === theme.id;
              return (
                <TouchableOpacity key={theme.id} onPress={() => setState((s: any) => ({ ...s, themeId: theme.id }))}
                  style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: th.bg, borderColor: cur ? th.primary : T.bord, borderWidth: cur ? 2.5 : 2, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: 16 }}>{theme.icon}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, marginTop: 6 }}>{THEME_LIST.find((x) => x.id === (state.themeId || "cosmos"))?.icon} {THEME_LIST.find((x) => x.id === (state.themeId || "cosmos"))?.name}</Text>
        </View>
        <View style={{ flexDirection: "column", gap: 8, marginTop: 14 }}>
          <Btn T={T} variant="muted" onPress={() => Alert.alert("Экспорт", "Функция экспорта будет добавлена позже")} style={{ width: "100%" }}>📥 Экспорт JSON</Btn>
          <Btn T={T} variant="danger" onPress={() => setShowReset(true)} style={{ width: "100%", fontSize: 13 }}>🗑 Сбросить данные</Btn>
        </View>
      </Card>
      <Card T={T}><View style={{ alignItems: "center", paddingVertical: 8 }}><Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, letterSpacing: 2, color: T.txt }}>ГОРИЗОНТ</Text><Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, marginTop: 4 }}>Life Tracker · v1.0 RN</Text></View></Card>
      {showReset && (
        <Modal transparent animationType="fade" visible>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.85)", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Card T={T} style={{ maxWidth: 340, width: "100%" }}>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 22, color: T.danger, marginBottom: 12 }}>⚠️ Сбросить всё?</Text>
              <Text style={{ fontFamily: "System", fontSize: 15, color: T.txt, marginBottom: 20 }}>Тренировки, задачи, цели, дневник — всё будет удалено.</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Btn T={T} variant="muted" onPress={() => setShowReset(false)} style={{ flex: 1 }}>Отмена</Btn>
                <Btn T={T} variant="danger" onPress={() => { setState({ ...DEFAULTS, themeId: state.themeId || "cosmos" }); setShowReset(false); }} style={{ flex: 1 }}>Удалить всё</Btn>
              </View>
            </Card>
          </View>
        </Modal>
      )}
      {showThemes && <ThemePicker T={T} currentThemeId={state.themeId || "cosmos"} onSelect={(id: string) => setState((s: any) => ({ ...s, themeId: id }))} onClose={() => setShowThemes(false)} />}
    </ScrollView>
  );
}

/* ══════════ APP ROOT ══════════ */
export default function App() {
  const insets = useSafeAreaInsets();
  const [state, setState_] = useState<any>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [session, setSession] = useState<any>(null);
  const [toast, setToast] = useState<any>(null);
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    loadState().then((s) => { setState_(s); setLoaded(true); });
  }, []);

  const setState = useCallback((patch: any) => {
    setState_((s: any) => {
      const n = typeof patch === "function" ? patch(s) : { ...s, ...patch };
      persistState(n);
      return n;
    });
  }, []);

  const setTasks = useCallback((fn: any) => setState((s: any) => ({ ...s, tasks: typeof fn === "function" ? fn(s.tasks) : fn })), [setState]);
  const setGoals = useCallback((fn: any) => setState((s: any) => ({ ...s, goals: typeof fn === "function" ? fn(s.goals) : fn })), [setState]);
  const setJournal = useCallback((fn: any) => setState((s: any) => ({ ...s, journal: typeof fn === "function" ? fn(s.journal) : fn })), [setState]);
  const setBodyLog = useCallback((fn: any) => setState((s: any) => ({ ...s, bodyLog: typeof fn === "function" ? fn(s.bodyLog || []) : fn })), [setState]);
  const setReflections = useCallback((fn: any) => setState((s: any) => ({ ...s, reflections: typeof fn === "function" ? fn(s.reflections || []) : fn })), [setState]);
  const setPainLog = useCallback((fn: any) => setState((s: any) => ({ ...s, painLog: typeof fn === "function" ? fn(s.painLog || []) : fn })), [setState]);

  const themeId = state.themeId || "cosmos";
  const T = useMemo(() => getTheme(themeId), [themeId]);
  const prs = useMemo(() => getPRs(state.history), [state.history]);

  const showAchievement = useCallback((id: string) => {
    setState((s: any) => {
      if ((s.achievements || []).includes(id)) return s;
      const def = ACHIEVEMENT_DEFS.find((a) => a.id === id);
      if (def) { setToast(def); setTimeout(() => setToast(null), 4500); }
      return { ...s, achievements: [...(s.achievements || []), id] };
    });
  }, [setState]);

  const startWorkout = useCallback((dayIdx: number) => {
    const plan = PLAN[dayIdx];
    const logs: any = {};
    plan.exercises.forEach((ex: any) => { logs[ex.id] = Array.from({ length: ex.sets }, () => ({ done: false, value: "" })); });
    setSession({ dayIdx, phase: plan.warmup.length > 0 ? "warmup" : "exercises", warmupDone: new Set(), exerciseLogs: logs, showRest: false, difficulty: 5, painNotes: "", startTime: new Date().toISOString() });
    setTab("workout");
  }, []);

  const finishWorkout = useCallback(() => {
    if (!session) return;
    const dates = weekDates();
    const date = fmt(dates[session.dayIdx]);
    setState((s: any) => {
      const newHist = { ...s.history, [date]: { dayId: session.dayIdx + 1, completed: true, exercises: session.exerciseLogs, difficulty: session.difficulty, painNotes: session.painNotes, startTime: session.startTime, endTime: new Date().toISOString() } };
      const newAch = checkAchievements(s, newHist);
      const newIds = (newAch as string[]).filter((id) => !(s.achievements || []).includes(id));
      if (newIds.length > 0) { const def = ACHIEVEMENT_DEFS.find((a) => a.id === newIds[0]); if (def) { setToast(def); setTimeout(() => setToast(null), 4500); } }
      return { ...s, history: newHist, streak: calcStreak(newHist), achievements: newAch };
    });
    setSession(null); setTab("dashboard");
  }, [session, setState]);

  const completeOnboarding = useCallback((data: any) => {
    setState((s: any) => ({ ...s, onboarded: true, user: { ...s.user, maxPushups: data.maxPushups || 15 } }));
  }, [setState]);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: "#07090D", justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#00C4F0" /></View>;

  if (!state.onboarded) return (
    <View style={{ flex: 1, backgroundColor: T.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar barStyle={T.dark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <OnboardingScreen T={T} onComplete={completeOnboarding} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle={T.dark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      {toast && (
        <View style={{ position: "absolute", top: insets.top + 10, left: 0, right: 0, alignItems: "center", zIndex: 500 }}>
          <View style={{ backgroundColor: T.card, borderColor: T.warn, borderWidth: 2, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, maxWidth: 340, width: "90%" }}>
            <Text style={{ fontSize: 36 }}>{toast.emoji}</Text>
            <View>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 15, color: T.warn }}>🎉 Достижение!</Text>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.txt }}>{toast.title}</Text>
              <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted }}>{toast.desc}</Text>
            </View>
          </View>
        </View>
      )}
      {showThemes && <ThemePicker T={T} currentThemeId={themeId} onSelect={(id: string) => setState((s: any) => ({ ...s, themeId: id }))} onClose={() => setShowThemes(false)} />}
      <View style={{ flex: 1, maxWidth: MAX_W, alignSelf: "center", width: "100%", paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Header T={T} streak={state.streak || 0} onOpenThemes={() => setShowThemes(true)} />
        <View style={{ flex: 1 }}>
          {tab === "dashboard" && <DashboardTab T={T} state={state} setState={setState} onStartWorkout={startWorkout} />}
          {tab === "workout" && <WorkoutTab T={T} session={session} setSession={setSession} onFinish={finishWorkout} prs={prs} history={state.history} onStart={startWorkout} />}
          {tab === "tasks" && <TasksGoalsTab T={T} tasks={state.tasks || []} setTasks={setTasks} goals={state.goals || []} setGoals={setGoals} />}
          {tab === "journal" && <JournalBodyTab T={T} journal={state.journal || []} setJournal={setJournal} bodyLog={state.bodyLog || []} setBodyLog={setBodyLog} reflections={state.reflections || []} setReflections={setReflections} painLog={state.painLog || []} setPainLog={setPainLog} />}
          {tab === "ai" && <MentorTab T={T} state={state} setState={setState} />}
          {tab === "stats" && <StatsTab T={T} history={state.history} tasks={state.tasks || []} goals={state.goals || []} journal={state.journal || []} achievements={state.achievements || []} user={state.user} setState={setState} />}
        </View>
        <BottomNav T={T} tab={tab} setTab={setTab} hasActive={!!session} />
      </View>
    </View>
  );
}
