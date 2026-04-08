import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StatusBar, SafeAreaView, Modal, Alert, Dimensions, ActivityIndicator, Share,
} from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText, Polygon, Defs, LinearGradient, Stop, Polyline } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadState, persistState } from "./src/utils/storage";
import {
  fmt, uid, getMonday, weekDates, todayIdx, TODAY, calcStreak,
  taskStreakForId, weeklyWorkoutStats, exerciseTrend, getPRs,
  getAllProgressionSuggestions, weeklyTonnage, moodWorkoutCorrelation,
  computeAuto1RM, sleepLabel, last7MoodData, calcLifeScore,
  checkAchievements, buildAIContext,
  getHeatMapData, getMuscleRecovery, generateInsights,
  goalForecast, getMonthlyStats,
} from "./src/utils/helpers";
import { callAI } from "./src/utils/ai";
import {
  PLAN, QUOTES, ACHIEVEMENT_DEFS, GOAL_TEMPLATES, MUSCLES,
  ONBOARD_STEPS, AI_PROVIDERS, QUICK_PROMPTS,
  TASK_CATS, GOAL_CATS, PAIN_ZONES, PAIN_INTENSITY,
  MOODS, ENERGY, THEME_LIST, DEFAULTS,
  FOOD_PRESETS, MACRO_GOALS, STYLE_LIST,
} from "./src/data/constants";
import { useStyledIcon } from "./src/components/useStyledIcon";

const W = Dimensions.get("window").width;
const MAX_W = Math.min(W, 480);

function getTheme(id: string, styleId: string = "standard") {
  const theme = THEME_LIST.find((x) => x.id === id) || THEME_LIST[0];
  const style = STYLE_LIST.find((x) => x.id === styleId) || STYLE_LIST[0];
  return { ...theme, ...style };
}

/* ══════════ EXPORT ══════════ */
async function exportJSON(state: any) {
  const data = JSON.stringify(state, null, 2);
  try {
    await Share.share({ message: data, title: "Горизонт — Экспорт JSON" });
  } catch {}
}

async function exportCSV(history: Record<string, any>) {
  const header = "Дата,День,Сложность,Боль,Упражнение,Подход,Значение,Выполнено\n";
  const rows: string[] = [];
  Object.entries(history).forEach(([date, log]: [string, any]) => {
    if (!log.completed) return;
    const dayName = PLAN[log.dayId - 1]?.day || "";
    if (!log.exercises) return;
    Object.entries(log.exercises).forEach(([exId, sets]: [string, any]) => {
      const exName = PLAN.flatMap((p) => p.exercises || []).find((e) => e.id === exId)?.name || exId;
      sets.forEach((s: any, si: number) => {
        rows.push(`${date},${dayName},${log.difficulty || ""},"${(log.painNotes || "").replace(/"/g, '""')}",${exName},${si + 1},${s.value || ""},${s.done ? "Да" : "Нет"}`);
      });
    });
  });
  const csv = header + rows.join("\n");
  try {
    await Share.share({ message: csv, title: "Горизонт — Экспорт CSV" });
  } catch {}
}

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
  const radius = T.radius || 12;
  const borderW = T.borderWidth || 1;
  const shadowColor = T.glowColor || "#000";
  const shadowStyle = T.shadow > 0 ? { shadowColor, shadowOffset: { width: 0, height: T.shadow / 3 }, shadowOpacity: T.showGlow ? 0.5 : 0.3, shadowRadius: T.shadow, elevation: Math.max(T.shadow / 4, 1) } : {};
  const bgColor = T.opacity ? `${T.card}${Math.round(T.opacity * 255).toString(16).padStart(2, '0')}` : T.card;
  const borderColor = T.accent === "neon" ? T.primary : (T.borderWidth > 1 ? T.primary : T.bord);
  return <View style={[{ backgroundColor: bgColor, borderColor, borderWidth: borderW, borderRadius: radius, padding: 16 }, shadowStyle, style]}>{children}</View>;
}

function Btn({ children, onPress, variant = "primary", style, T, disabled }: { children: React.ReactNode; onPress?: () => void; variant?: string; style?: any; T: any; disabled?: boolean }) {
  const radius = T.radius || 10;
  const v: any = {
    primary: { backgroundColor: T.primary, color: "#000" },
    ghost: { backgroundColor: "transparent", color: T.primary, borderColor: T.primary, borderWidth: T.cardBorder ? (T.borderWidth || 2) : 1.5 },
    danger: { backgroundColor: T.danger, color: "#fff" },
    success: { backgroundColor: T.success, color: "#000" },
    muted: { backgroundColor: T.lo, color: T.txt, borderColor: T.bord, borderWidth: 1 },
    warn: { backgroundColor: T.warn, color: "#000" },
  }[variant] || { backgroundColor: T.primary, color: "#000" };
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[{ minHeight: 44, paddingHorizontal: 18, borderRadius: radius, justifyContent: "center", alignItems: "center", opacity: disabled ? 0.5 : 1 }, v, style]}>
      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: v.color }}>{children}</Text>
    </TouchableOpacity>
  );
}

function Ring({ pct, size = 64, color, label, T, strokeWidth, showPercent }: any) {
  const sw = strokeWidth || size / 8;
  const r = (size - sw) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(pct, 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <View style={{ alignItems: "center", gap: 3 }}>
      <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={T.lo}
            strokeWidth={sw}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={sw}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          {showPercent !== false && (
            <Text style={{ fontSize: size / 4, fontWeight: "900", color }}>{Math.round(pct)}%</Text>
          )}
        </View>
      </View>
      {label && <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 10, color: T.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</Text>}
    </View>
  );
}

/* ══════════ NUMPAD ══════════ */
function Numpad({ T, value, onChange, onConfirm, unit, placeholder, color }: any) {
  const display = value || "";
  const tap = (k: string) => {
    if (k === "⌫") onChange(display.slice(0, -1));
    else if (k === "+1") { const v = parseFloat(display) || 0; onChange(String(Math.max(0, v + 1))); }
    else if (k === "-1") { const v = parseFloat(display) || 0; onChange(String(Math.max(0, v - 1))); }
    else if (display.length < 4) onChange(display + k);
  };
  const col = color || T.primary;
  const rows = [["1","2","3"],["4","5","6"],["7","8","9"],["-1","0","+1"],["⌫","⌫","✓"]];
  return (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.7)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 }}>
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 52, color: display ? T.txt : T.muted }}>
              {display || placeholder}
              {display && <Text style={{ fontSize: 22, color: T.muted }}> {unit}</Text>}
            </Text>
            {display && (
              <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
                <TouchableOpacity onPress={() => tap("-1")} style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo }}>
                  <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.muted }}>-1</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => tap("+1")} style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo }}>
                  <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.muted }}>+1</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {rows.flat().map((k, i) => {
              const isConfirm = k === "✓"; const isDel = k === "⌫"; const isAdj = k === "+1" || k === "-1";
              return (
                <TouchableOpacity key={i} onPress={() => (isConfirm ? onConfirm(display) : tap(k))}
                  style={{ flex: 1, height: 56, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: isConfirm ? col : isDel ? `${T.danger}15` : isAdj ? `${T.primary}10` : T.lo }}>
                  <Text style={{ fontFamily: "System", fontWeight: isConfirm ? "900" : "700", fontSize: isConfirm ? 18 : isAdj ? 16 : 22, color: isConfirm ? "#000" : isDel ? T.danger : isAdj ? T.primary : T.txt }}>
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
  const presets = [60, 90, 120, 180];
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
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
            {presets.map((p) => (
              <TouchableOpacity key={p} onPress={() => setS(p)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderColor: T.bord, borderWidth: 1, backgroundColor: s === p ? T.primary : T.lo }}>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: s === p ? "#fff" : T.muted }}>{p}с</Text>
              </TouchableOpacity>
            ))}
          </View>
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
function Header({ T, streak, onOpenThemes, styleId }: any) {
  const { getIcon } = useStyledIcon(styleId || "standard");
  
  const getStyleRadius = () => {
    const style = STYLE_LIST.find(s => s.id === (styleId || "standard"));
    return style?.radius || 12;
  };
  
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: T.bord, backgroundColor: T.surf }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 32, height: 32, borderRadius: getStyleRadius(), backgroundColor: `${T.primary}20`, borderColor: `${T.primary}44`, borderWidth: 1.5, justifyContent: "center", alignItems: "center" }}>
          {getIcon("rest", T.primary)}
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
        <TouchableOpacity onPress={onOpenThemes} style={{ width: 34, height: 34, borderRadius: getStyleRadius(), borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 16 }}>🎨</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ══════════ THEME PICKER ══════════ */
function ThemePicker({ T, currentThemeId, currentStyleId, onSelect, onStyleSelect, onClose }: any) {
  const darkThemes = THEME_LIST.filter((t) => t.dark);
  const lightThemes = THEME_LIST.filter((t) => !t.dark);
  const current = THEME_LIST.find((x) => x.id === currentThemeId);
  const currentStyle = STYLE_LIST.find((x) => x.id === currentStyleId) || STYLE_LIST[0];

  const renderThemeCard = (theme: any) => {
    const th = getTheme(theme.id, currentStyleId);
    const cur = currentThemeId === theme.id;
    return (
      <TouchableOpacity key={theme.id} onPress={() => onSelect(theme.id)}
        style={{
          width: "47%",
          borderRadius: Math.min(currentStyle.radius, 20),
          backgroundColor: th.card,
          borderColor: cur ? th.primary : T.bord,
          borderWidth: cur ? 2.5 : 1.5,
          padding: 12,
          gap: 8,
          ...(currentStyle.shadow > 0 ? { shadowColor: "#000", shadowOffset: { width: 0, height: currentStyle.shadow / 3 }, shadowOpacity: 0.35, shadowRadius: currentStyle.shadow } : {}),
        }}>
        <View style={{ flexDirection: "row", gap: 3, marginBottom: 4 }}>
          {[th.primary, th.success, th.warn, th.danger].map((c, i) => (
            <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: c }} />
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 28, height: 28, borderRadius: Math.min(currentStyle.radius / 2, 10), backgroundColor: `${th.primary}20`, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 14 }}>{theme.icon}</Text>
          </View>
          <View>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: th.txt }}>{theme.name}</Text>
            <Text style={{ fontFamily: "System", fontSize: 9, color: th.muted }}>{theme.desc}</Text>
          </View>
        </View>
        {cur && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: th.primary }} />
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 10, color: th.primary }}>Сейчас</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStyleCard = (style: any) => {
    const cur = currentStyleId === style.id;
    const previewRadius = Math.min(style.radius, 16);
    return (
      <TouchableOpacity key={style.id} onPress={() => onStyleSelect(style.id)}
        style={{
          width: "31%",
          borderRadius: previewRadius,
          backgroundColor: cur ? `${T.primary}15` : T.lo,
          borderColor: cur ? T.primary : T.bord,
          borderWidth: cur ? 2.5 : 1.5,
          padding: 10,
          alignItems: "center",
          gap: 6,
          ...(style.shadow > 0 ? { shadowColor: "#000", shadowOffset: { width: 0, height: style.shadow / 4 }, shadowOpacity: 0.3, shadowRadius: style.shadow / 2 } : {}),
        }}>
        <Text style={{ fontSize: 22, color: cur ? T.primary : T.txt }}>{style.icon}</Text>
        <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: cur ? T.primary : T.txt, textAlign: "center" }}>{style.name}</Text>
        <Text style={{ fontFamily: "System", fontSize: 8, color: T.muted, textAlign: "center" }}>{style.desc.split(" ").slice(0, 3).join(" ")}</Text>
        {cur && (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.primary }} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.8)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: "90%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <View>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.txt }}>Оформление</Text>
              <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, marginTop: 2 }}>{THEME_LIST.length} цветов + {STYLE_LIST.length} стилей</Text>
            </View>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 20, color: T.muted }}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {/* Style selection - grid */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Text style={{ fontSize: 14, color: T.primary }}>{'>'}</Text>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.muted, letterSpacing: 1, textTransform: "uppercase" }}>Стиль интерфейса</Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {STYLE_LIST.map(renderStyleCard)}
            </View>

            {/* Dark themes */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Text style={{ fontSize: 14 }}>{'◐'}</Text>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.muted, letterSpacing: 1, textTransform: "uppercase" }}>Тёмные</Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              {darkThemes.map(renderThemeCard)}
            </View>

            {/* Light themes */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Text style={{ fontSize: 14 }}>{'○'}</Text>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.muted, letterSpacing: 1, textTransform: "uppercase" }}>Светлые</Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              {lightThemes.map(renderThemeCard)}
            </View>
          </ScrollView>

          <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, textAlign: "center", marginTop: 10 }}>
            {current?.icon} {current?.name} + {currentStyle?.icon} {currentStyle?.name}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════ STYLE PICKER ══════════ */
function StylePicker({ T, currentStyleId, onSelect, onClose }: any) {
  const current = STYLE_LIST.find((x) => x.id === currentStyleId) || STYLE_LIST[0];

  const renderStyleCard = (style: any) => {
    const cur = currentStyleId === style.id;
    const previewRadius = Math.min(style.radius, 20);
    return (
      <TouchableOpacity key={style.id} onPress={() => onSelect(style.id)}
        style={{
          width: "47%",
          borderRadius: 10,
          backgroundColor: T.card,
          borderColor: cur ? T.primary : T.bord,
          borderWidth: cur ? 2.5 : 1.5,
          padding: 12,
          gap: 8,
          ...(style.shadow > 0 ? { shadowColor: "#000", shadowOffset: { width: 0, height: style.shadow / 2 }, shadowOpacity: 0.3, shadowRadius: style.shadow, elevation: style.shadow / 2 } : {}),
        }}>
        {/* Preview card */}
        <View style={{
          height: 40,
          borderRadius: Math.min(style.radius, 12),
          backgroundColor: T.lo,
          borderWidth: style.cardBorder ? 2 : 1,
          borderColor: T.primary,
          justifyContent: "center",
          paddingHorizontal: 8,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 12, height: 12, borderRadius: Math.min(style.radius / 2, 6), backgroundColor: T.primary }} />
            <View style={{ flex: 1, height: 8, borderRadius: Math.min(style.radius / 3, 4), backgroundColor: T.bord }} />
            <View style={{ width: 8, height: 8, borderRadius: Math.min(style.radius / 3, 4), backgroundColor: T.success }} />
          </View>
        </View>
        {/* Label */}
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18 }}>{style.icon}</Text>
          <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.txt, marginTop: 2 }}>{style.name}</Text>
          <Text style={{ fontFamily: "System", fontSize: 9, color: T.muted, textAlign: "center" }}>{style.desc}</Text>
        </View>
        {/* Current badge */}
        {cur && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.primary }} />
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 10, color: T.primary }}>Сейчас</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.8)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: "85%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <View>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.txt }}>Стиль интерфейса</Text>
              <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, marginTop: 2 }}>{STYLE_LIST.length} стилей · меняет форму и глубину</Text>
            </View>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 20, color: T.muted }}>✕</Text></TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
            {STYLE_LIST.map(renderStyleCard)}
          </View>
          <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, textAlign: "center", marginTop: 4 }}>
            {current?.icon} {current?.name} — {current?.desc}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════ BOTTOM NAV ══════════ */
function BottomNav({ T, tab, setTab, hasActive, styleId }: any) {
  const { getIcon } = useStyledIcon(styleId || "standard");
  
  const getTabIcon = (id: string) => {
    switch (id) {
      case "dashboard": return getIcon("rest", isActive(id) ? T.primary : T.muted);
      case "workout": return getIcon("workout", isActive(id) ? T.primary : T.muted);
      case "tasks": return getIcon("task", isActive(id) ? T.primary : T.muted);
      case "nutrition": return getIcon("food", isActive(id) ? T.primary : T.muted);
      case "journal": return getIcon("water", isActive(id) ? T.primary : T.muted);
      case "ai": return <Text style={{ fontSize: 18 }}>🤖</Text>;
      case "stats": return <Text style={{ fontSize: 18 }}>📊</Text>;
      default: return null;
    }
  };
  
  const isActive = (id: string) => tab === id;
  
  const tabs = [
    { id: "dashboard", label2: "ГОРИЗОНТ" },
    { id: "workout", label2: "ТРЕН." },
    { id: "tasks", label2: "ЗАДАЧИ" },
    { id: "nutrition", label2: "ПИТАНИЕ" },
    { id: "journal", label2: "ДНЕВН." },
    { id: "ai", label2: "РАЗУМ" },
    { id: "stats", label2: "СТАТЫ" },
  ];
  
  const getStyleRadius = () => {
    const style = STYLE_LIST.find(s => s.id === (styleId || "standard"));
    return style?.radius || 12;
  };
  
  return (
    <View style={{ flexDirection: "row", backgroundColor: T.surf, borderTopWidth: 1, borderTopColor: T.bord, paddingBottom: 8 }}>
      {tabs.map(({ id, label2 }) => {
        const active = isActive(id);
        return (
          <TouchableOpacity key={id} onPress={() => setTab(id)}
            style={{ 
              flex: 1, 
              alignItems: "center", 
              paddingVertical: 6, 
              borderTopWidth: 2.5, 
              borderTopColor: active ? T.primary : "transparent",
            }}>
            <View style={{
              width: 28,
              height: 28,
              borderRadius: getStyleRadius() / 2,
              backgroundColor: active ? `${T.primary}15` : "transparent",
              justifyContent: "center",
              alignItems: "center",
            }}>
              {getTabIcon(id)}
            </View>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 8, color: active ? T.primary : T.muted, marginTop: 2, letterSpacing: 0.5 }}>{label2}</Text>
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
  const maxLogged = Math.max(0, ...logs.map((s: any) => parseInt(s.value) || 0));
  const isNewPR = maxLogged > 0 && prVal > 0 && maxLogged > prVal;
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
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            {allDone && <Text style={{ fontSize: 18, color: T.success }}>✓</Text>}
            {isNewPR && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: `${T.warn}18`, borderColor: `${T.warn}44`, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10 }}>🏆</Text>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.warn, letterSpacing: 0.5 }}>PR!</Text>
              </View>
            )}
            {prVal > 0 && <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>рек: {prVal}</Text>}
          </View>
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
  const score = useMemo(() => calcLifeScore(history, tasks, journal), [history, tasks, journal]);
  const moodData = useMemo(() => last7MoodData(journal), [journal]);
  const workoutStreak = useMemo(() => calcStreak(history), [history]);
  const todayI = todayIdx();
  const todayPlan = PLAN[todayI];
  const todayLog = history[TODAY];
  const todayTasks = useMemo(() => tasks.filter((t: any) => t.recurring || t.dueDate === TODAY), [tasks, journal]);
  const todayTasksDone = todayTasks.filter((t: any) => t.completedDates?.includes(TODAY)).length;
  const activeGoals = useMemo(() => goals.filter((g: any) => !g.completed).slice(0, 3), [goals]);
  const todayJournal = useMemo(() => journal.find((j: any) => j.date === TODAY), [journal]);
  const waterToday = todayJournal?.waterGlasses || 0;
  const dayNum = Math.floor(Date.now() / 86400000);
  const quote = QUOTES[dayNum % QUOTES.length];
  const progressionAlerts = useMemo(() => getAllProgressionSuggestions(history), [history]);

  const setWaterGlass = (n: number) => {
    setState((s: any) => {
      const j = [...s.journal];
      const idx = j.findIndex((x: any) => x.date === TODAY);
      if (idx >= 0) j[idx] = { ...j[idx], waterGlasses: n, waterDone: n >= 8 };
      else j.unshift({ id: uid(), date: TODAY, text: "", mood: 3, energy: 3, waterGlasses: n, waterDone: n >= 8 });
      return { ...s, journal: j };
    });
  };

  const setFocus = (text: string) => {
    setState((s: any) => ({ ...s, focus: { text, date: text ? TODAY : "" } }));
  };

  const focusToday = (state.focus?.date === TODAY) ? state.focus?.text || "" : "";
  const achievements = state.achievements || [];

  return (
    <ScrollView style={{ flex: 1, padding: 14 }} contentContainerStyle={{ gap: 12, paddingBottom: 33 }}>
      <Card T={T} style={{ borderColor: `${T.primary}22`, backgroundColor: `${T.primary}10` }}>
        <Text style={{ fontFamily: "System", fontSize: 14, color: T.txt, fontStyle: "italic", lineHeight: 20 }}>«{quote.text}»</Text>
        <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.primary, marginTop: 6 }}>— {quote.author.toUpperCase()}</Text>
      </Card>

      <Card T={T} style={{ backgroundColor: T.card }}>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          {/* Main score ring */}
          <View style={{ width: 160, height: 160, justifyContent: "center", alignItems: "center" }}>
            <Svg width={160} height={160} style={{ position: "absolute" }}>
              <Circle cx={80} cy={80} r={68} stroke={T.lo} strokeWidth={14} fill="none" />
              <Circle
                cx={80} cy={80} r={68}
                stroke={score.total >= 80 ? T.success : score.total >= 50 ? T.warn : T.danger}
                strokeWidth={14}
                fill="none"
                strokeDasharray={2 * Math.PI * 68}
                strokeDashoffset={2 * Math.PI * 68 * (1 - score.total / 100)}
                strokeLinecap="round"
                rotation={-90}
                origin="80, 80"
              />
            </Svg>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 48, color: score.total >= 80 ? T.success : score.total >= 50 ? T.warn : T.danger }}>
                {score.total}
              </Text>
              <Text style={{ fontFamily: "System", fontSize: 14, color: T.muted }}>из 100</Text>
            </View>
          </View>
          <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.muted, marginTop: 8, letterSpacing: 1, textTransform: "uppercase" }}>WEEKLY SCORE</Text>
        </View>

        {/* Sub rings */}
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 50, height: 50, justifyContent: "center", alignItems: "center" }}>
              <Svg width={50} height={50} style={{ position: "absolute" }}>
                <Circle cx={25} cy={25} r={20} stroke={T.lo} strokeWidth={5} fill="none" />
                <Circle cx={25} cy={25} r={20} stroke={T.primary} strokeWidth={5} fill="none" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - score.workout / 100)} strokeLinecap="round" rotation={-90} origin="25, 25" />
              </Svg>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 14, color: T.primary }}>{score.workout}%</Text>
            </View>
            <Text style={{ fontFamily: "System", fontSize: 9, color: T.muted, marginTop: 2 }}>Тренировки</Text>
          </View>
          {score.tasks !== null && (
            <View style={{ alignItems: "center" }}>
              <View style={{ width: 50, height: 50, justifyContent: "center", alignItems: "center" }}>
                <Svg width={50} height={50} style={{ position: "absolute" }}>
                  <Circle cx={25} cy={25} r={20} stroke={T.lo} strokeWidth={5} fill="none" />
                  <Circle cx={25} cy={25} r={20} stroke={T.success} strokeWidth={5} fill="none" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - score.tasks / 100)} strokeLinecap="round" rotation={-90} origin="25, 25" />
                </Svg>
                <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 14, color: T.success }}>{score.tasks}%</Text>
              </View>
              <Text style={{ fontFamily: "System", fontSize: 9, color: T.muted, marginTop: 2 }}>Задачи</Text>
            </View>
          )}
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 50, height: 50, justifyContent: "center", alignItems: "center" }}>
              <Svg width={50} height={50} style={{ position: "absolute" }}>
                <Circle cx={25} cy={25} r={20} stroke={T.lo} strokeWidth={5} fill="none" />
                <Circle cx={25} cy={25} r={20} stroke={T.warn} strokeWidth={5} fill="none" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - score.journal / 100)} strokeLinecap="round" rotation={-90} origin="25, 25" />
              </Svg>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 14, color: T.warn }}>{score.journal}%</Text>
            </View>
            <Text style={{ fontFamily: "System", fontSize: 9, color: T.muted, marginTop: 2 }}>Дневник</Text>
          </View>
        </View>

        {/* Streak & Achievements */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.bord }}>
          {workoutStreak > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 16 }}>🔥</Text>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.warn }}>{workoutStreak} дней</Text>
            </View>
          )}
          {achievements.length > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 16 }}>🏆</Text>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.primary }}>{achievements.length}</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Daily Focus */}
      <Card T={T} style={{ borderColor: `${T.warn}33`, backgroundColor: `${T.warn}08` }}>
        <Lbl T={T}>🎯 Главный фокус дня</Lbl>
        <TextInput
          value={focusToday}
          onChangeText={setFocus}
          placeholder="Одна самая важная задача на сегодня…"
          placeholderTextColor={T.muted}
          style={{
            width: "100%",
            borderRadius: 8,
            borderColor: T.bord,
            borderWidth: 1.5,
            backgroundColor: T.lo,
            color: T.txt,
            fontFamily: "System",
            fontSize: 15,
            padding: 10,
            marginTop: 8,
            minHeight: 44,
          }}
        />
      </Card>

      {/* Sleep quick-log */}
      <Card T={T}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Lbl T={T}>💤 Сон сегодня</Lbl>
          {todayJournal?.sleep > 0 && (
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: todayJournal.sleep >= 7 ? T.success : todayJournal.sleep >= 6 ? T.warn : T.danger }}>
              {todayJournal.sleep}ч {todayJournal.sleep >= 7 ? "✓" : ""}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {[4, 5, 6, 7, 8, 9].map((h) => (
            <TouchableOpacity key={h} onPress={() => {
              setState((s: any) => {
                const j = [...s.journal];
                const idx = j.findIndex((x: any) => x.date === TODAY);
                if (idx >= 0) j[idx] = { ...j[idx], sleep: h };
                else j.unshift({ id: uid(), date: TODAY, text: "", mood: 3, energy: 3, sleep: h });
                return { ...s, journal: j };
              });
            }}
              style={{
                flex: 1,
                paddingVertical: 6,
                borderRadius: 8,
                borderColor: todayJournal?.sleep === h ? T.primary : T.bord,
                borderWidth: 1.5,
                backgroundColor: todayJournal?.sleep === h ? `${T.primary}20` : T.lo,
                alignItems: "center",
                marginHorizontal: 2,
              }}>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: todayJournal?.sleep === h ? T.primary : T.muted }}>{h}ч</Text>
            </TouchableOpacity>
          ))}
        </View>
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

      {(todayJournal?.mood == null || todayJournal?.energy == null) && (
        <Card T={T} style={{ borderColor: `${T.primary}55`, backgroundColor: `${T.primary}08` }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Text style={{ fontSize: 14 }}>⚡</Text>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 11, color: T.primary, letterSpacing: 1.2 }}>БЫСТРЫЙ ЧЕК-ИН</Text>
            <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted, marginLeft: "auto" }}>заполни оба!</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted, marginBottom: 6 }}>Настроение</Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {MOODS.map((m: any) => {
                  const isSelected = todayJournal?.mood === m.v;
                  return (
                    <TouchableOpacity key={m.v} onPress={() => {
                      setState((s: any) => {
                        const j = [...s.journal];
                        const existing = j.find((x: any) => x.date === TODAY);
                        if (existing) {
                          const idx = j.indexOf(existing);
                          j[idx] = { ...existing, mood: m.v };
                        } else {
                          j.unshift({ id: uid(), date: TODAY, text: "", mood: m.v, energy: 3, createdAt: new Date().toISOString() });
                        }
                        return { ...s, journal: j };
                      });
                    }}
                      style={{ flex: 1, height: 34, borderRadius: 7, borderColor: isSelected ? T.primary : T.bord, borderWidth: isSelected ? 2 : 1.5, backgroundColor: isSelected ? `${T.primary}20` : T.lo, justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ fontSize: 17 }}>{m.e}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted, marginBottom: 6 }}>Энергия</Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {ENERGY.map((e: any) => {
                  const isSelected = todayJournal?.energy === e.v;
                  return (
                    <TouchableOpacity key={e.v} onPress={() => {
                      setState((s: any) => {
                        const j = [...s.journal];
                        const existing = j.find((x: any) => x.date === TODAY);
                        if (existing) {
                          const idx = j.indexOf(existing);
                          j[idx] = { ...existing, energy: e.v };
                        } else {
                          j.unshift({ id: uid(), date: TODAY, text: "", mood: 3, energy: e.v, createdAt: new Date().toISOString() });
                        }
                        return { ...s, journal: j };
                      });
                    }}
                      style={{ flex: 1, height: 34, borderRadius: 7, borderColor: isSelected ? T.success : T.bord, borderWidth: isSelected ? 2 : 1.5, backgroundColor: isSelected ? `${T.success}20` : T.lo, justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ fontSize: 15 }}>{e.e}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Card>
      )}

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

      {/* 14-day Mood/Energy/Sleep chart */}
      {journal.length >= 3 && (
        <Card T={T}>
          <Lbl T={T}>📈 Настроение / Энергия / Сон за 14 дней</Lbl>
          {(() => {
            const data14 = Array.from({ length: 14 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - 13 + i);
              const dd = fmt(d);
              const entry = journal.filter((j: any) => j.date === dd).slice(-1)[0];
              return {
                date: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
                mood: entry?.mood || 0,
                energy: entry?.energy || 0,
                sleep: entry?.sleep || 0,
              };
            }).filter((d) => d.mood || d.energy || d.sleep);
            if (data14.length < 2) return null;
            const w = 300; const h = 80;
            const moodPts = data14.filter((d: any) => d.mood).map((d: any, i: number, arr: any[]) => `${(i / Math.max(arr.length - 1, 1)) * w},${h - ((d.mood - 1) / 4) * (h - 10)}`).join(" ");
            const energyPts = data14.filter((d: any) => d.energy).map((d: any, i: number, arr: any[]) => `${(i / Math.max(arr.length - 1, 1)) * w},${h - ((d.energy - 1) / 4) * (h - 10)}`).join(" ");
            const sleepPts = data14.filter((d: any) => d.sleep).map((d: any, i: number, arr: any[]) => `${(i / Math.max(arr.length - 1, 1)) * w},${h - ((d.sleep - 4) / 5) * (h - 10)}`).join(" ");
            return (
              <Svg height={h + 30} width="100%" viewBox={`0 0 ${w} ${h + 30}`}>
                {moodPts && <Polyline points={moodPts} fill="none" stroke={T.primary} strokeWidth="2" strokeLinejoin="round" />}
                {energyPts && <Polyline points={energyPts} fill="none" stroke={T.success} strokeWidth="2" strokeDasharray="4,3" strokeLinejoin="round" />}
                {sleepPts && <Polyline points={sleepPts} fill="none" stroke={T.warn} strokeWidth="1.5" strokeDasharray="2,4" strokeLinejoin="round" />}
                {data14.filter((d: any) => d.mood).map((d: any, i: number, arr: any[]) => {
                  const cx = (i / Math.max(arr.length - 1, 1)) * w;
                  const cy = h - ((d.mood - 1) / 4) * (h - 10);
                  return <Circle key={i} cx={cx} cy={cy} r="3" fill={T.primary} />;
                })}
                <SvgText x="5" y="12" fill={T.primary} fontSize="8">— Настр.</SvgText>
                <SvgText x="70" y="12" fill={T.success} fontSize="8">--- Энерг.</SvgText>
                <SvgText x="150" y="12" fill={T.warn} fontSize="8">--- Сон</SvgText>
              </Svg>
            );
          })()}
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
function WorkoutTab({ T, session, setSession, onFinish, prs, history, onStart, onEditPlan, onEditHistory, hasCustomPlan }: any) {
  const [showHist, setShowHist] = useState(false);
  const [histSearch, setHistSearch] = useState("");
  const [editEntry, setEditEntry] = useState<{ date: string; log: any } | null>(null);

  const histEntries = Object.entries(history)
    .filter(([, l]) => (l as any).completed)
    .sort(([a], [b]) => (a > b ? -1 : 1));

  const filteredHist = histSearch
    ? histEntries.filter(([date, l]) => {
        const p = PLAN.find((x) => x.id === (l as any).dayId);
        return date.includes(histSearch) || p?.name.toLowerCase().includes(histSearch.toLowerCase());
      })
    : histEntries.slice(0, 20);

  if (!session) {
    return (
      <ScrollView style={{ padding: 14 }} contentContainerStyle={{ gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 24, color: T.txt }}>💪 Тренировка</Text>
          <TouchableOpacity onPress={() => setShowHist(!showHist)} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, borderColor: T.bord, borderWidth: 1, backgroundColor: showHist ? `${T.primary}15` : T.lo }}>
            <Text style={{ fontSize: 12 }}>🕐</Text>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: showHist ? T.primary : T.muted }}>{showHist ? "К плану" : "История"}</Text>
          </TouchableOpacity>
        </View>

        {showHist ? (
          <>
            <TextInput value={histSearch} onChangeText={setHistSearch} placeholder="Поиск по дате (2025-01) или названию…"
              style={{ height: 40, borderRadius: 10, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, paddingHorizontal: 14, marginBottom: 12 }} />
            {filteredHist.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 36 }}>
                <Text style={{ fontSize: 32, opacity: 0.4 }}>🕐</Text>
                <Text style={{ fontFamily: "System", fontSize: 14, color: T.muted, marginTop: 8 }}>{histSearch ? "Ничего не найдено" : "История пуста"}</Text>
              </View>
            )}
            {filteredHist.map(([date, log]: [string, any]) => {
              const plan = PLAN.find((p) => p.id === log.dayId) || { name: "Тренировка", emoji: "💪" };
              const dateObj = new Date(date + "T12:00:00");
              const exCount = Object.keys(log.exercises || {}).length;
              const totalReps = Object.values(log.exercises || {}).flat().reduce((s: number, x: any) => s + (parseInt(x.value) || 0), 0);
              return (
                <Card key={date} T={T} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                      <Text style={{ fontSize: 22 }}>{plan.emoji}</Text>
                      <View>
                        <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.txt }}>{plan.name}</Text>
                        <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted }}>
                          {dateObj.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" })}
                        </Text>
                        <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                          <Badge color={T.primary} T={T}>{exCount} упр.</Badge>
                          {totalReps > 0 && <Badge color={T.success} T={T}>{totalReps} повт</Badge>}
                          {log.difficulty && <Badge color={log.difficulty >= 8 ? T.danger : log.difficulty >= 5 ? T.warn : T.muted} T={T}>💪 {log.difficulty}/10</Badge>}
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setEditEntry({ date, log })} style={{ padding: 6 }}>
                      <Text style={{ fontSize: 16 }}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                  {log.painNotes && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, padding: 6, backgroundColor: `${T.danger}10`, borderRadius: 6 }}>
                      <Text style={{ fontSize: 12 }}>⚠️</Text>
                      <Text style={{ fontFamily: "System", fontSize: 11, color: T.danger }} numberOfLines={1}>{log.painNotes}</Text>
                    </View>
                  )}
                </Card>
              );
            })}
          </>
        ) : (
          <>
            {hasCustomPlan && (
              <View style={{ padding: 8, backgroundColor: `${T.warn}10`, borderColor: `${T.warn}33`, borderWidth: 1, borderRadius: 8, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 12 }}>⚡</Text>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: T.warn }}>Кастомный план активен</Text>
              </View>
            )}
            {Object.keys(history).length > 0 && (() => {
              const recovery = getMuscleRecovery(history);
              const groups = [
                { id: "upper", label: "Верх тела", icon: "💪", threshold: 48 },
                { id: "lower", label: "Ноги", icon: "🦵", threshold: 48 },
                { id: "core", label: "Кор", icon: "⚡", threshold: 24 },
              ];
              const getStatus = (days: number | null, threshold: number) => {
                if (days === null) return { label: "Не трениров.", color: "#3D5A72", bar: 0 };
                const hrs = days * 24;
                if (hrs >= threshold * 2) return { label: "Полностью", color: "#00E676", bar: 100 };
                if (hrs >= threshold) return { label: "Восстановлен", color: "#4ADE80", bar: 80 };
                if (hrs >= threshold * 0.5) return { label: "Восстан.", color: "#FFD600", bar: 50 };
                return { label: "Нужен отдых", color: "#FF4455", bar: 20 };
              };
              return (
                <Card T={T} style={{ marginBottom: 8 }}>
                  <Lbl T={T}>💪 Восстановление мышц</Lbl>
                  {groups.map((g) => {
                    const days = recovery[g.id];
                    const st = getStatus(days, g.threshold);
                    return (
                      <View key={g.id} style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                            <Text style={{ fontSize: 15 }}>{g.icon}</Text>
                            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.txt }}>{g.label}</Text>
                            {days !== null && <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{days === 0 ? "сегодня" : `${days} дн. назад`}</Text>}
                          </View>
                          <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: st.color }}>{st.label}</Text>
                        </View>
                        <View style={{ height: 5, backgroundColor: T.lo, borderRadius: 3, overflow: "hidden" }}>
                          <View style={{ height: "100%", width: `${st.bar}%`, backgroundColor: st.color, borderRadius: 3 }} />
                        </View>
                      </View>
                    );
                  })}
                </Card>
              );
            })()}
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
                    {log?.completed ? (
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <TouchableOpacity onPress={() => setEditEntry({ date: fmt(weekDates()[i]), log })} style={{ padding: 4 }}>
                          <Text style={{ fontSize: 14 }}>✏️</Text>
                        </TouchableOpacity>
                        <Badge color={T.success} T={T}>✓</Badge>
                      </View>
                    ) : plan.type !== "rest" ? <Btn T={T} onPress={() => onStart(i)} style={{ minHeight: 34, paddingHorizontal: 12, fontSize: 13 }} variant={isToday ? "primary" : "muted"}>▶</Btn> : <Badge color={T.muted} T={T}>~</Badge>}
                  </View>
                </Card>
              );
            })}
          </>
        )}
        {editEntry && <EditWorkoutModal T={T} date={editEntry.date} log={editEntry.log} onSave={onEditHistory} onClose={() => setEditEntry(null)} />}
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
    <ScrollView style={{ padding: 14 }} contentContainerStyle={{ gap: 10, paddingBottom: 33 }}>
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
            <Text style={{ fontFamily: "System", fontSize: 13, padding: 8, borderRadius: 8, backgroundColor: T.lo, color: session.difficulty <= 3 ? T.primary : session.difficulty >= 9 ? T.danger : session.difficulty <= 6 ? T.success : T.warn, marginTop: 8 }}>
              {session.difficulty <= 3 ? "😴 Слишком легко" : session.difficulty <= 6 ? "💪 Хороший диапазон" : session.difficulty <= 8 ? "🔥 Тяжело, но продуктивно" : "😤 Очень тяжело — следи за восстановлением"}
            </Text>
          </Card>
          <Card T={T}>
            <Lbl T={T}>Болевые ощущения</Lbl>
            <TextInput placeholder="Опиши, если что-то беспокоило…" placeholderTextColor={T.muted} value={session.painNotes} onChangeText={(t) => upd({ painNotes: t })} multiline
              style={{ width: "100%", borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 10, minHeight: 80 }} />
            {session.painNotes?.toLowerCase().match(/сустав|колен|плеч|локт|запяст/) && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8, padding: 8, backgroundColor: `${T.danger}15`, borderColor: `${T.danger}44`, borderWidth: 1, borderRadius: 8 }}>
                <Text style={{ fontSize: 15 }}>⚠️</Text>
                <Text style={{ fontFamily: "System", fontSize: 13, color: T.danger, flex: 1 }}>Боль в суставах — снизь нагрузку и следи за техникой</Text>
              </View>
            )}
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
      <ScrollView style={{ flex: 1, padding: 14 }} contentContainerStyle={{ paddingBottom: 33 }}>
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
                      {task.recurring && (
                        <View style={{ flexDirection: "row", gap: 3, marginTop: 6 }}>
                          {Array.from({ length: 14 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - 13 + i);
                            const dd = fmt(d);
                            return (
                              <View
                                key={i}
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: 3,
                                  backgroundColor: task.completedDates?.includes(dd) ? c.color : T.lo,
                                  borderColor: dd === TODAY ? T.primary : "transparent",
                                  borderWidth: dd === TODAY ? 1.5 : 1,
                                }}
                              />
                            );
                          })}
                        </View>
                      )}
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
            {goals.filter((g: any) => !g.completed).length === 0 && !addingGoal && (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🌅</Text>
                <Text style={{ fontFamily: "System", fontSize: 14, color: T.muted }}>Поставь первую цель</Text>
              </View>
            )}
            {!addingGoal && (
              <Card T={T} style={{ marginBottom: 12 }}>
                <Lbl T={T}>📋 Шаблоны целей</Lbl>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {GOAL_TEMPLATES.map((t, i) => (
                    <TouchableOpacity key={i} onPress={() => { setGoalForm({ title: t.title, desc: t.desc, cat: t.cat, target: t.target, unit: t.unit, deadline: "", emoji: t.emoji }); setAddingGoal(true); setEditingGoalId(null); }}
                      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo }}>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: T.txt }}>{t.emoji} {t.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            )}
            {goals.filter((g: any) => !g.completed).map((g: any) => {
              const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
              const deadlineDays = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000) : null;
              const isUrgent = deadlineDays !== null && deadlineDays <= 3;
              const isToday = deadlineDays === 0;
              return (
                <Card key={g.id} T={T} style={{ marginBottom: 10, borderColor: isUrgent ? `${T.danger}44` : undefined }}>
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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {deadlineDays !== null && (
                        <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: isToday ? T.danger : isUrgent ? T.warn : T.muted }}>
                          {isToday ? "Сегодня!" : deadlineDays < 0 ? `Просрочено ${Math.abs(deadlineDays)} дн.` : `${deadlineDays} дн.`}
                        </Text>
                      )}
                      <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: pct >= 100 ? T.success : pct >= 50 ? T.warn : T.primary }}>{pct}%</Text>
                    </View>
                  </View>
                  <View style={{ height: 10, backgroundColor: T.lo, borderRadius: 5, marginBottom: 10 }}>
                    <View style={{ height: "100%", width: `${Math.min(pct, 100)}%`, backgroundColor: isUrgent ? T.danger : T.primary, borderRadius: 5 }} />
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <TouchableOpacity onPress={() => updateProgress(g.id, Math.max(0, g.currentValue - Math.max(1, Math.floor(g.targetValue * 0.05))))}
                      style={{ width: 36, height: 36, borderRadius: 18, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 20, color: T.muted }}>−</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1, height: 32, borderRadius: 16, backgroundColor: T.lo, borderColor: T.bord, borderWidth: 1, overflow: "hidden" }}>
                      <View style={{ height: "100%", width: `${Math.min(pct, 100)}%`, backgroundColor: isUrgent ? T.danger : T.primary, borderRadius: 16, justifyContent: "center", paddingHorizontal: 10 }}>
                        <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 12, color: pct > 30 ? "#fff" : T.txt }}>{g.currentValue}/{g.targetValue}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => updateProgress(g.id, Math.min(g.targetValue, g.currentValue + Math.max(1, Math.floor(g.targetValue * 0.05))))}
                      style={{ width: 36, height: 36, borderRadius: 18, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 20, color: T.muted }}>+</Text>
                    </TouchableOpacity>
                  </View>
                  {g.history && g.history.length >= 2 && (() => {
                    const forecast = goalForecast(g);
                    if (!forecast) return null;
                    return (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: T.bord }}>
                        <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted }}>📅 Прогноз: {forecast.daysNeeded} дн. → {forecast.date}</Text>
                      </View>
                    );
                  })()}
                </Card>
              );
            })}
            {goals.filter((g: any) => g.completed).length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.muted }}>
                  ДОСТИГНУТЫЕ ({goals.filter((g: any) => g.completed).length})
                </Text>
                {goals.filter((g: any) => g.completed).map((g: any) => (
                  <Card key={g.id} T={T} style={{ marginBottom: 8, opacity: 0.7 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.success }}>
                        ✓ {g.emoji} {g.title}
                      </Text>
                      <TouchableOpacity onPress={() => setGoals((g2: any) => g2.filter((x: any) => x.id !== g.id))}>
                        <Text style={{ color: T.muted }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ══════════ JOURNAL TAB ══════════ */
function JournalBodyTab({ T, journal, setJournal, bodyLog, setBodyLog, reflections, setReflections, painLog, setPainLog, photos, setPhotos }: any) {
  const [sub, setSub] = useState("journal");
  const [adding, setAdding] = useState(false);
  const [jText, setJText] = useState("");
  const [jMood, setJMood] = useState(3);
  const [jEnergy, setJEnergy] = useState(3);
  const [jSleep, setJSleep] = useState(7);
  const [addBody, setAddBody] = useState(false);
  const [bodyForm, setBodyForm] = useState({ weight: "", chest: "", waist: "", arms: "", height: "", hips: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [addPain, setAddPain] = useState(false);
  const [painForm, setPainForm] = useState({ zone: "", isRight: true, intensity: 3, note: "" });
  const [addReflection, setAddReflection] = useState(false);
  const [refForm, setRefForm] = useState({ went: "", improve: "", grat: "" });

  const saveJournal = () => {
    if (!jText.trim()) return;
    setJournal((j: any) => [{ id: uid(), date: TODAY, text: jText.trim(), mood: jMood, energy: jEnergy, sleep: jSleep, createdAt: new Date().toISOString() }, ...j]);
    setJText(""); setJMood(3); setJEnergy(3); setJSleep(7); setAdding(false);
  };

  const saveBody = () => {
    if (!bodyForm.weight && !bodyForm.chest && !bodyForm.waist && !bodyForm.arms && !bodyForm.height && !bodyForm.hips) return;
    setBodyLog((l: any) => [{ id: uid(), date: TODAY, ...bodyForm }, ...l]);
    setBodyForm({ weight: "", chest: "", waist: "", arms: "", height: "", hips: "" });
    setAddBody(false);
  };

  const savePain = () => {
    if (!painForm.zone) return;
    setPainLog((l: any) => [{ id: uid(), date: TODAY, ...painForm }, ...(l || [])]);
    setPainForm({ zone: "", isRight: true, intensity: 3, note: "" });
    setAddPain(false);
  };

  const saveReflection = () => {
    if (!refForm.went.trim() && !refForm.improve.trim() && !refForm.grat.trim()) return;
    setReflections((r: any) => [{ id: uid(), date: TODAY, ...refForm }, ...r]);
    setRefForm({ went: "", improve: "", grat: "" });
    setAddReflection(false);
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
      <ScrollView style={{ flex: 1, padding: 14 }} contentContainerStyle={{ paddingBottom: 33 }}>
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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 }}>
                    <TouchableOpacity onPress={() => setJSleep(Math.max(3, jSleep - 1))}
                      style={{ width: 40, height: 40, borderRadius: 20, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.muted }}>−</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1, height: 8, backgroundColor: T.lo, borderRadius: 4 }}>
                      <View style={{ height: "100%", width: `${((jSleep - 3) / 7) * 100}%`, backgroundColor: jSleep >= 7 ? T.primary : jSleep >= 6 ? T.warn : T.danger, borderRadius: 4 }} />
                    </View>
                    <TouchableOpacity onPress={() => setJSleep(Math.min(10, jSleep + 1))}
                      style={{ width: 40, height: 40, borderRadius: 20, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.muted }}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
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
            {journal.length > 0 && (
              <View style={{ marginBottom: 10 }}>
                <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="🔍 Поиск по записям…" placeholderTextColor={T.muted}
                  style={{ width: "100%", height: 40, borderRadius: 10, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, paddingHorizontal: 12 }} />
              </View>
            )}
            {journal
              .filter((entry: any) => !searchQuery || entry.text?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((entry: any) => {
              const m = MOODS.find((x) => x.v === entry.mood); const en = ENERGY.find((x) => x.v === entry.energy);
              return (
                <Card key={entry.id} T={T} style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: (m?.v ?? 3) >= 4 ? T.success : (m?.v ?? 3) <= 2 ? T.danger : T.muted }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 20 }}>{m?.e}</Text>
                      {entry.energy && <Text style={{ fontSize: 16, opacity: 0.7 }}>{en?.e}</Text>}
                      {entry.sleep > 0 && <Text style={{ fontSize: 14, opacity: 0.7 }}>💤 {entry.sleep}ч</Text>}
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.txt }}>Трекер тела</Text>
              <Btn T={T} onPress={() => setAddBody(!addBody)} style={{ minHeight: 36, paddingHorizontal: 14, fontSize: 13 }}>{addBody ? "Закрыть" : "+ Замер"}</Btn>
            </View>
            {addBody && (
              <Card T={T} style={{ marginBottom: 12, borderColor: `${T.primary}44` }}>
                <Lbl T={T}>Новые замеры</Lbl>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 12 }}>
                  {[["weight", "⚖️ Вес (кг)", "70"], ["chest", "📏 Грудь (см)", "90"], ["waist", "📏 Талия (см)", "80"], ["arms", "💪 Бицепс (см)", "30"], ["height", "📏 Рост (см)", "170"], ["hips", "📏 Бёдра (см)", "95"]].map(([k, l, ph]) => (
                    <View key={k} style={{ flex: 1, minWidth: "45%" }}>
                      <Lbl T={T}>{l}</Lbl>
                      <TextInput keyboardType="numeric" value={bodyForm[k as keyof typeof bodyForm]} onChangeText={(t) => setBodyForm((f) => ({ ...f, [k]: t }))} placeholder={ph} placeholderTextColor={T.muted}
                        style={{ height: 40, borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontWeight: "700", fontSize: 18, paddingHorizontal: 10, marginTop: 4 }} />
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Btn T={T} variant="muted" onPress={() => setAddBody(false)} style={{ flex: 1 }}>Отмена</Btn>
                  <Btn T={T} onPress={saveBody} style={{ flex: 2 }}>Сохранить</Btn>
                </View>
              </Card>
            )}
            {bodyLog.length > 1 && (
              <Card T={T} style={{ marginBottom: 12 }}>
                <Lbl T={T}>Динамика веса</Lbl>
                {(() => {
                  const weightData = bodyLog.filter((e: any) => e.weight).slice(0, 14).reverse();
                  if (weightData.length < 2) return <Text style={{ fontFamily: "System", fontSize: 13, color: T.muted, textAlign: "center", paddingVertical: 12 }}>Нужно минимум 2 замера</Text>;
                  const w = 300; const h = 80;
                  const maxW = Math.max(...weightData.map((e: any) => parseFloat(e.weight) || 0), 1);
                  const minW = Math.min(...weightData.map((e: any) => parseFloat(e.weight) || 0));
                  const range = Math.max(maxW - minW, 1);
                  const pts = weightData.map((d: any, i: number) => `${(i / Math.max(weightData.length - 1, 1)) * w},${h - ((parseFloat(d.weight) - minW) / range) * (h - 15) - 5}`).join(" ");
                  const areaPts = `0,${h} ${pts} ${w},${h}`;
                  return (
                    <Svg height={h + 25} width="100%" viewBox={`0 0 ${w} ${h + 25}`}>
                      <Defs>
                        <LinearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor={T.primary} stopOpacity="0.2" />
                          <Stop offset="1" stopColor={T.primary} stopOpacity="0" />
                        </LinearGradient>
                      </Defs>
                      <Polygon points={areaPts} fill="url(#bodyGrad)" />
                      <Polyline points={pts} fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinejoin="round" />
                      {weightData.map((d: any, i: number) => {
                        const cx = (i / Math.max(weightData.length - 1, 1)) * w;
                        const cy = h - ((parseFloat(d.weight) - minW) / range) * (h - 15) - 5;
                        return (
                          <G key={i}>
                            <Circle cx={cx} cy={cy} r="4" fill={T.primary} stroke={T.card} strokeWidth="2" />
                            <SvgText x={cx} y={cy - 8} textAnchor="middle" fill={T.primary} fontSize="9" fontWeight="700">{d.weight}</SvgText>
                            <SvgText x={cx} y={h + 14} textAnchor="middle" fill={T.muted} fontSize="8">{d.date.slice(5)}</SvgText>
                          </G>
                        );
                      })}
                    </Svg>
                  );
                })()}
              </Card>
            )}
            {bodyLog.length > 0 && (() => {
              const latest = bodyLog[0];
              const w = parseFloat(latest.weight);
              const h = parseFloat(latest.height);
              if (!w || !h) return null;
              const bmi = (w / Math.pow(h / 100, 2)).toFixed(1);
              const bmiNum = parseFloat(bmi);
              const bmiLabel = bmiNum < 18.5 ? "Недостаточный" : bmiNum < 25 ? "Норма" : bmiNum < 30 ? "Избыток" : "Ожирение";
              const bmiColor = bmiNum < 18.5 ? T.warn : bmiNum < 25 ? T.success : bmiNum < 30 ? T.warn : "#e74c3c";
              return (
                <Card T={T} style={{ marginBottom: 12, borderColor: `${bmiColor}44` }}>
                  <Lbl T={T}>ИМТ (Индекс массы тела)</Lbl>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
                    <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 36, color: bmiColor }}>{bmi}</Text>
                    <View>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: bmiColor }}>{bmiLabel}</Text>
                      <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted }}>{w} кг / {h} см</Text>
                    </View>
                  </View>
                  <View style={{ height: 10, backgroundColor: T.lo, borderRadius: 5, marginTop: 10, overflow: "hidden" }}>
                    <View style={{ width: `${Math.min((bmiNum / 35) * 100, 100)}%`, height: "100%", backgroundColor: bmiColor, borderRadius: 5 }} />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                    <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted }}>18.5</Text>
                    <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted }}>25</Text>
                    <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted }}>30</Text>
                  </View>
                </Card>
              );
            })()}
            {bodyLog.length === 0 && !addBody && <View style={{ alignItems: "center", paddingVertical: 40 }}><Text style={{ fontSize: 40, marginBottom: 10 }}>⚖️</Text><Text style={{ fontFamily: "System", fontSize: 14, color: T.muted }}>Начни отслеживать тело</Text></View>}
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
                  {entry.height && <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.primary }}>📏 {entry.height} (рост)</Text>}
                  {entry.hips && <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.success }}>📏 {entry.hips} (бёдра)</Text>}
                </View>
              </Card>
            ))}
          </>
        )}
        {sub === "pain" && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.txt }}>Боль и асимметрия</Text>
              <Btn T={T} onPress={() => setAddPain(!addPain)} style={{ minHeight: 36, paddingHorizontal: 14, fontSize: 13 }}>{addPain ? "Закрыть" : "+ Боль"}</Btn>
            </View>
            <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted, marginBottom: 12 }}>Отслеживай паттерны — предотвращай травмы</Text>
            {addPain && (
              <Card T={T} style={{ marginBottom: 12, borderColor: `${T.danger}44` }}>
                <Lbl T={T}>Где болит?</Lbl>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, marginBottom: 12 }}>
                  {PAIN_ZONES.map((z) => (
                    <TouchableOpacity key={z.id} onPress={() => setPainForm((f: any) => ({ ...f, zone: z.id }))}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderColor: painForm.zone === z.id ? T.danger : T.bord, borderWidth: painForm.zone === z.id ? 2 : 1.5, backgroundColor: painForm.zone === z.id ? `${T.danger}15` : T.lo, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ fontSize: 14 }}>{z.emoji}</Text>
                      <Text style={{ fontFamily: "System", fontWeight: "600", fontSize: 12, color: painForm.zone === z.id ? T.danger : T.txt }}>{z.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                  <TouchableOpacity onPress={() => setPainForm((f: any) => ({ ...f, isRight: true }))} style={{ flex: 1, padding: 10, borderRadius: 8, borderColor: painForm.isRight ? T.primary : T.bord, borderWidth: painForm.isRight ? 2 : 1.5, backgroundColor: painForm.isRight ? `${T.primary}15` : T.lo, alignItems: "center" }}>
                    <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: painForm.isRight ? T.primary : T.muted }}>Правая</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setPainForm((f: any) => ({ ...f, isRight: false }))} style={{ flex: 1, padding: 10, borderRadius: 8, borderColor: !painForm.isRight ? T.primary : T.bord, borderWidth: !painForm.isRight ? 2 : 1.5, backgroundColor: !painForm.isRight ? `${T.primary}15` : T.lo, alignItems: "center" }}>
                    <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: !painForm.isRight ? T.primary : T.muted }}>Левая</Text>
                  </TouchableOpacity>
                </View>
                <Lbl T={T}>Интенсивность</Lbl>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 12 }}>
                  {PAIN_INTENSITY.map((p) => (
                    <TouchableOpacity key={p.v} onPress={() => setPainForm((f: any) => ({ ...f, intensity: p.v }))}
                      style={{ flex: 1, padding: 8, borderRadius: 8, borderColor: painForm.intensity === p.v ? p.c : T.bord, borderWidth: painForm.intensity === p.v ? 2 : 1.5, backgroundColor: painForm.intensity === p.v ? `${p.c}15` : T.lo, alignItems: "center" }}>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: painForm.intensity === p.v ? p.c : T.muted }}>{p.l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput value={painForm.note} onChangeText={(t) => setPainForm((f: any) => ({ ...f, note: t }))} placeholder="Заметка (опц.)" placeholderTextColor={T.muted}
                  style={{ borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 10, marginBottom: 10 }} />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Btn T={T} variant="muted" onPress={() => setAddPain(false)} style={{ flex: 1 }}>Отмена</Btn>
                  <Btn T={T} onPress={savePain} style={{ flex: 2 }}>Сохранить</Btn>
                </View>
              </Card>
            )}
            {painLog?.length === 0 && !addPain && <View style={{ alignItems: "center", paddingVertical: 36 }}><Text style={{ fontSize: 40, marginBottom: 10 }}>🩺</Text><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 16, color: T.txt, marginBottom: 6 }}>Журнал болей пуст</Text></View>}
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 22, color: T.txt }}>Еженедельная рефлексия</Text>
              <Btn T={T} onPress={() => setAddReflection(!addReflection)} style={{ minHeight: 36, paddingHorizontal: 14, fontSize: 13 }}>{addReflection ? "Закрыть" : "+ Записать"}</Btn>
            </View>
            <Text style={{ fontFamily: "System", fontSize: 13, color: T.muted, marginBottom: 12 }}>Воскресный чек-ин — ключ к настоящему росту</Text>
            {addReflection && (
              <Card T={T} style={{ marginBottom: 12, borderColor: `${T.success}44` }}>
                <Lbl T={T}>✅ Что получилось?</Lbl>
                <TextInput value={refForm.went} onChangeText={(t) => setRefForm((f: any) => ({ ...f, went: t }))} placeholder="Напиши 1-3 вещи, которые удались..." placeholderTextColor={T.muted} multiline
                  style={{ borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 10, minHeight: 60, marginTop: 6, marginBottom: 12 }} />
                <Lbl T={T}>🔄 Что улучшить?</Lbl>
                <TextInput value={refForm.improve} onChangeText={(t) => setRefForm((f: any) => ({ ...f, improve: t }))} placeholder="Что можно сделать лучше на след. неделе?" placeholderTextColor={T.muted} multiline
                  style={{ borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 10, minHeight: 60, marginTop: 6, marginBottom: 12 }} />
                <Lbl T={T}>🎯 Фокус на неделю</Lbl>
                <TextInput value={refForm.grat} onChangeText={(t) => setRefForm((f: any) => ({ ...f, grat: t }))} placeholder="Главная цель на следующую неделю..." placeholderTextColor={T.muted} multiline
                  style={{ borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 10, minHeight: 60, marginTop: 6, marginBottom: 12 }} />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Btn T={T} variant="muted" onPress={() => setAddReflection(false)} style={{ flex: 1 }}>Отмена</Btn>
                  <Btn T={T} onPress={saveReflection} style={{ flex: 2 }}>Сохранить</Btn>
                </View>
              </Card>
            )}
            {reflections.length === 0 && !addReflection && <View style={{ alignItems: "center", paddingVertical: 36 }}><Text style={{ fontSize: 40, marginBottom: 10 }}>🧘</Text><Text style={{ fontFamily: "System", fontSize: 14, color: T.muted }}>Заполни первую рефлексию</Text></View>}
            {reflections.map((r: any) => (
              <Card key={r.id} T={T} style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: T.success }}>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.muted, marginBottom: 10 }}>{new Date(r.date + "T12:00:00").toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</Text>
                {r.went && <View style={{ marginBottom: 8 }}><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.success, letterSpacing: 1, marginBottom: 3 }}>✅ ПОЛУЧИЛОСЬ</Text><Text style={{ fontFamily: "System", fontSize: 13, color: T.txt, lineHeight: 20 }}>{r.went}</Text></View>}
                {r.improve && <View style={{ marginBottom: 8 }}><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.warn, letterSpacing: 1, marginBottom: 3 }}>🔄 УЛУЧШИТЬ</Text><Text style={{ fontFamily: "System", fontSize: 13, color: T.txt, lineHeight: 20 }}>{r.improve}</Text></View>}
                {r.grat && <View><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.primary, letterSpacing: 1, marginBottom: 3 }}>🎯 ФОКУС</Text><Text style={{ fontFamily: "System", fontSize: 13, color: T.txt, lineHeight: 20 }}>{r.grat}</Text></View>}
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
  const [bouncePhase, setBouncePhase] = useState(0);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    if (!loading) return;
    const ref = setInterval(() => setBouncePhase((p) => p + 1), 150);
    return () => clearInterval(ref);
  }, [loading]);

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

  const regenerate = async () => {
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
    if (!lastUser) return;
    const msgs = messages.slice(0, -1);
    setMessages(msgs); setLoading(true); setError(null);
    try {
      const reply = await callAI(msgs, buildAIContext(state), aiConfig);
      const aMsg = { role: "assistant", content: reply, ts: Date.now(), provider: aiConfig.provider || "claude" };
      const final = [...msgs, aMsg]; setMessages(final); saveHistory(final);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const clearChat = () => {
    Alert.alert("Очистить чат", "Удалить всю историю переписки?", [
      { text: "Отмена", style: "cancel" },
      { text: "Очистить", style: "destructive", onPress: () => { setMessages([]); saveHistory([]); } },
    ]);
  };

  const copyMessage = (text: string) => {
    Alert.alert("Скопировано", text.slice(0, 100) + (text.length > 100 ? "…" : ""));
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("### ")) return <Text key={i} style={{ fontFamily: "System", fontWeight: "900", fontSize: 16, color: T.txt, marginTop: 8, marginBottom: 2 }}>{line.slice(4)}</Text>;
      if (line.startsWith("## ")) return <Text key={i} style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.txt, marginTop: 10, marginBottom: 4 }}>{line.slice(3)}</Text>;
      if (line.startsWith("# ")) return <Text key={i} style={{ fontFamily: "System", fontWeight: "900", fontSize: 20, color: T.txt, marginTop: 12, marginBottom: 6 }}>{line.slice(2)}</Text>;
      if (line.startsWith("---")) return <View key={i} style={{ height: 1, backgroundColor: T.bord, marginVertical: 8 }} />;
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const parts = parseInline(line.slice(2), T);
        return <View key={i} style={{ flexDirection: "row", gap: 6, marginBottom: 2 }}><Text style={{ color: T.primary }}>•</Text><Text style={{ fontFamily: "System", fontSize: 14, color: T.txt, lineHeight: 20, flex: 1 }}>{parts}</Text></View>;
      }
      if (/^\d+\.\s/.test(line)) {
        const parts = parseInline(line.replace(/^\d+\.\s/, ""), T);
        const num = line.match(/^(\d+)\./)?.[1];
        return <View key={i} style={{ flexDirection: "row", gap: 6, marginBottom: 2 }}><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.primary, minWidth: 18 }}>{num}.</Text><Text style={{ fontFamily: "System", fontSize: 14, color: T.txt, lineHeight: 20, flex: 1 }}>{parts}</Text></View>;
      }
      if (line.trim() === "") return <View key={i} style={{ height: 6 }} />;
      return <Text key={i} style={{ fontFamily: "System", fontSize: 14, color: T.txt, lineHeight: 20 }}>{parseInline(line, T)}</Text>;
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: T.bord, backgroundColor: T.surf }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${provColor}15`, borderColor: `${provColor}55`, borderWidth: 1.5, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 19 }}>✨</Text>
            </View>
            <View>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 20, color: T.txt }}>НЕЙРО</Text>
              <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{prov.name}{aiConfig.model ? ` · ${aiConfig.model}` : ""}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {messages.length > 0 && (
              <TouchableOpacity onPress={clearChat}>
                <Text style={{ fontSize: 16, color: T.muted }}>🗑</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => Alert.alert("Контекст ИИ", buildAIContext(state).slice(0, 500) + "...")}>
              <Text style={{ fontSize: 16, color: T.muted }}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSettings(true)}>
              <Text style={{ fontSize: 18, color: T.muted }}>⚙️</Text>
            </TouchableOpacity>
          </View>
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
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 24, justifyContent: "center" }}>
              {[
                { icon: "📈", text: "Анализ прогресса" },
                { icon: "📅", text: "Планирование" },
                { icon: "🧠", text: "Работа с разумом" },
                { icon: "❤️", text: "Восстановление" },
              ].map((f, i) => (
                <View key={i} style={{ padding: 10, backgroundColor: T.lo, borderColor: T.bord, borderWidth: 1, borderRadius: 12, width: "45%", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 20 }}>{f.icon}</Text>
                  <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: T.txt, textAlign: "center" }}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {messages.map((m: any, i: number) => {
          const isUser = m.role === "user";
          return (
            <View key={i} style={{ alignItems: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <View style={{ maxWidth: "88%", borderRadius: 18, backgroundColor: isUser ? provColor : T.card, borderColor: isUser ? "transparent" : T.bord, borderWidth: isUser ? 0 : 1 }}>
                <View style={{ padding: isUser ? 12 : 14 }}>
                  {isUser ? (
                    <Text style={{ fontFamily: "System", fontSize: 14, color: "#000", lineHeight: 20 }}>{m.content}</Text>
                  ) : (
                    renderMarkdown(m.content)
                  )}
                </View>
                {!isUser && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 8 }}>
                    <Text style={{ fontFamily: "System", fontSize: 9, color: T.muted }}>{m.provider || prov.name}</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity onPress={() => copyMessage(m.content)}>
                        <Text style={{ fontSize: 12, color: T.muted }}>📋</Text>
                      </TouchableOpacity>
                      {i === messages.length - 1 && !loading && (
                        <TouchableOpacity onPress={regenerate}>
                          <Text style={{ fontSize: 12, color: T.muted }}>🔄</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
              {m.ts && <Text style={{ fontFamily: "System", fontSize: 9, color: T.muted, marginTop: 2 }}>{new Date(m.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</Text>}
            </View>
          );
        })}
        {loading && (
          <View style={{ flexDirection: "row", gap: 6, padding: 14, backgroundColor: T.card, borderRadius: 18, alignSelf: "flex-start", borderColor: T.bord, borderWidth: 1, alignItems: "center" }}>
            {[0, 1, 2].map((i) => {
              const phase = (bouncePhase + i) % 3;
              const size = phase === 0 ? 6 : phase === 1 ? 10 : 8;
              return (
                <View key={i} style={{
                  width: size, height: size, borderRadius: size / 2, backgroundColor: provColor,
                }} />
              );
            })}
            <Text style={{ fontFamily: "System", fontSize: 13, color: T.muted, marginLeft: 4 }}>Думаю…</Text>
          </View>
        )}
        {error && (
          <View style={{ padding: 12, backgroundColor: `${T.danger}12`, borderColor: `${T.danger}44`, borderWidth: 1, borderRadius: 14 }}>
            <Text style={{ fontFamily: "System", fontSize: 13, color: T.danger }}>{error}</Text>
            {error.includes("ключ") && <TouchableOpacity onPress={() => setShowSettings(true)}><Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: T.primary, marginTop: 6 }}>Открыть настройки →</Text></TouchableOpacity>}
            {error.includes("CORS") && (
              <TouchableOpacity onPress={() => { setState((s: any) => ({ ...s, aiConfig: { ...s.aiConfig, provider: "claude" } })); setError(null); }}>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: T.primary, marginTop: 6 }}>Переключиться на Claude →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      <View style={{ padding: 10, borderTopWidth: 1, borderTopColor: T.bord, backgroundColor: T.surf, paddingBottom: 14 }}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
          <TextInput value={input} onChangeText={setInput} placeholder="Напиши что угодно…" placeholderTextColor={T.muted} multiline
            style={{ flex: 1, borderRadius: 14, borderColor: input ? `${provColor}88` : T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 11, maxHeight: 100, minHeight: 44 }} />
          <TouchableOpacity onPress={() => send()} disabled={!input.trim() || loading}
            style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: input.trim() && !loading ? provColor : T.lo, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 22, color: input.trim() && !loading ? "#000" : T.muted }}>→</Text>
          </TouchableOpacity>
        </View>
        {messages.length > 0 && (
          <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted, textAlign: "center", marginTop: 4 }}>{messages.filter((m: any) => m.role === "assistant").length} ответов · {prov.name}</Text>
        )}
      </View>
      {showSettings && <AISettingsModal T={T} aiConfig={aiConfig} onSave={(cfg: any) => setState((s: any) => ({ ...s, aiConfig: { ...(s.aiConfig || {}), ...cfg } }))} onClose={() => setShowSettings(false)} />}
    </View>
  );
}

function parseInline(text: string, T: any) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) parts.push(<Text key={match.index} style={{ fontFamily: "System", fontWeight: "700", color: T.txt }}>{match[2]}</Text>);
    else if (match[3]) parts.push(<Text key={match.index} style={{ fontFamily: "System", backgroundColor: T.lo, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, color: T.primary }}>{match[3]}</Text>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

/* ══════════ AI SETTINGS MODAL ══════════ */
function AISettingsModal({ T, aiConfig, onSave, onClose }: any) {
  const insets = useSafeAreaInsets();
  const cfg = aiConfig || {};
  const [provider, setProvider] = useState(cfg.provider || "claude");
  const [apiKey, setApiKey] = useState(cfg.apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(cfg.model || "");
  const [systemExtra, setSystemExtra] = useState(cfg.systemExtra || "");
  const [persona, setPersona] = useState(cfg.persona || "");
  const prov = AI_PROVIDERS.find((p) => p.id === provider) || AI_PROVIDERS[0];
  const save = () => { onSave({ provider, apiKey: apiKey.trim(), model: model || prov.defaultModel, endpoint: "", systemExtra, persona }); onClose(); };

  const PERSONAS = [
    { id: "", name: "По умолчанию", emoji: "🤖", desc: "Стандартный AI-коуч" },
    { id: "coach", name: "Строгий тренер", emoji: "💪", desc: "Жёсткий, мотивирует, не жалеет" },
    { id: "mentor", name: "Спокойный наставник", emoji: "🧘", desc: "Мудрый, поддерживает, объясняет" },
    { id: "scientist", name: "Учёный-биохакер", emoji: "🔬", desc: "Научный подход, данные, исследования" },
    { id: "psychologist", name: "Спортивный психолог", emoji: "🧠", desc: "Ментальное здоровье, мотивация" },
  ];

  const personaSystem: Record<string, string> = {
    coach: "Ты строгий тренер. Говоришь прямо, мотивируешь жёстко, не жалеешь. Используешь эмодзи 💪🔥. Короткие фразы, конкретные указания.",
    mentor: "Ты спокойный мудрый наставник. Объясняешь подробно, поддерживаешь, не давишь. Мягкий тон, используешь 🧘✨.",
    scientist: "Ты учёный-биохакер. Опираешься на данные и исследования. Используешь точные термины, ссылки на науку. 🔬📊.",
    psychologist: "Ты спортивный психолог. Фокус на ментальном здоровье, мотивации, страхе и тревоге. Эмпатичный, поддерживающий. 🧠💭.",
  };

  const fullSystemExtra = personaSystem[persona] ? `${personaSystem[persona]}\n\n${systemExtra}` : systemExtra;

  return (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.88)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "90%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 20, paddingBottom: 12 }}>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.txt }}>Настройки НЕЙРО</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 20, color: T.muted }}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: "85%", paddingHorizontal: 20 }}>
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
                    {p.badge && <Text style={{ fontFamily: "System", fontSize: 8, color: p.color, marginTop: 2 }}>{p.badge}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            {prov.needsKey && (
              <View style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Lbl T={T}>API Ключ</Lbl>
                  <TouchableOpacity onPress={() => setShowKey(!showKey)} style={{ padding: 4 }}>
                    <Text style={{ fontFamily: "System", fontSize: 14, color: T.muted }}>{showKey ? "🙈" : "👁"}</Text>
                  </TouchableOpacity>
                </View>
                <TextInput value={apiKey} onChangeText={setApiKey} placeholder={prov.keyPrefix ? `${prov.keyPrefix}…` : "Твой API ключ"} placeholderTextColor={T.muted} secureTextEntry={!showKey}
                  style={{ height: 42, borderRadius: 9, borderColor: apiKey ? `${T.success}88` : T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, paddingHorizontal: 12 }} />
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
                        {m === prov.defaultModel && <Text style={{ fontFamily: "System", fontSize: 8, color: T.muted }}>по умолч.</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Persona presets */}
            <View style={{ marginBottom: 14 }}>
              <Lbl T={T}>Персонаж</Lbl>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {PERSONAS.map((p) => {
                  const cur = persona === p.id;
                  return (
                    <TouchableOpacity key={p.id} onPress={() => setPersona(p.id)}
                      style={{ flex: 1, minWidth: "45%", padding: 10, borderRadius: 10, borderColor: cur ? T.primary : T.bord, borderWidth: 1.5, backgroundColor: cur ? `${T.primary}10` : T.lo }}>
                      <Text style={{ fontSize: 16, marginBottom: 2 }}>{p.emoji}</Text>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: cur ? T.primary : T.txt }}>{p.name}</Text>
                      <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted, marginTop: 2 }}>{p.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ marginBottom: 14 }}>
              <Lbl T={T}>Доп. инструкции</Lbl>
              <TextInput value={systemExtra} onChangeText={setSystemExtra} placeholder="Напр.: отвечай только по-русски" placeholderTextColor={T.muted} multiline
                style={{ borderRadius: 9, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 13, padding: 10, minHeight: 60, marginTop: 6 }} />
            </View>
          </ScrollView>
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: T.bord, paddingBottom: 16 + insets.bottom }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Btn T={T} variant="muted" onPress={onClose} style={{ flex: 1 }}>Отмена</Btn>
              <Btn T={T} onPress={save} style={{ flex: 2 }}>Сохранить</Btn>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════ STATS TAB ══════════ */
const StatsTab = React.memo(function StatsTab({ T, history, tasks, goals, journal, achievements, user, setState }: any) {
  const [sub, setSub] = useState("stats");
  const [selEx, setSelEx] = useState("pushups");
  const [trendSelIdx, setTrendSelIdx] = useState<number | null>(null);
  const [tonnageSelIdx, setTonnageSelIdx] = useState<number | null>(null);
  
  const prs = useMemo(() => getPRs(history), [history]);
  const streak = useMemo(() => calcStreak(history), [history]);
  const totalW = useMemo(() => Object.values(history).filter((l: any) => l.completed).length, [history]);
  const avgDiff = useMemo(() => totalW > 0 ? (Object.values(history).reduce((s: number, l: any) => s + (l.difficulty || 5), 0) / totalW).toFixed(1) : "—", [history, totalW]);
  const avgSleep = useMemo(() => journal.length > 0 ? (journal.reduce((s: number, j: any) => s + (j.sleep || 0), 0) / journal.filter((j: any) => j.sleep > 0).length).toFixed(1) : "—", [journal]);
  const alerts = useMemo(() => getAllProgressionSuggestions(history), [history]);
  const trackedEx = useMemo(() => PLAN.flatMap((d) => d.exercises || []).reduce((a: any[], e) => { if (!a.find((x) => x.id === e.id)) a.push(e); return a; }, []), []);
  const earned = achievements || [];
  const notEarned = useMemo(() => ACHIEVEMENT_DEFS.filter((a) => !earned.includes(a.id)), [earned]);
  const score = useMemo(() => calcLifeScore(history, tasks, journal), [history, tasks, journal]);
  
  const trend = useMemo(() => exerciseTrend(history, selEx), [history, selEx]);
  const auto1RM = useMemo(() => computeAuto1RM(history), [history]);
  const wStats = useMemo(() => weeklyWorkoutStats(history), [history]);
  const wTonnage = useMemo(() => weeklyTonnage(history), [history]);
  const corr = useMemo(() => moodWorkoutCorrelation(history, journal), [history, journal]);
  const maxCount = useMemo(() => Math.max(...wStats.map((w: any) => w.count), 1), [wStats]);
  const maxT = useMemo(() => Math.max(...wTonnage.map((w: any) => w.tonnage), 1), [wTonnage]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: T.bord, backgroundColor: T.surf }}>
        {[{ id: "stats", l: "📊 Статы" }, { id: "achievements", l: "🏆 Достиж." }, { id: "anatomy", l: "🫀 Анатомия" }].map((t) => (
          <TouchableOpacity key={t.id} onPress={() => setSub(t.id)} style={{ flex: 1, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: sub === t.id ? T.primary : "transparent" }}>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, textAlign: "center", color: sub === t.id ? T.primary : T.muted }}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={{ flex: 1, padding: 14 }} contentContainerStyle={{ paddingBottom: 33 }}>
        {sub === "stats" && (
          <>
            <View style={{ flexDirection: "row", gap: 7, marginBottom: 14 }}>
              {[{ l: "Тренировок", v: totalW, c: T.primary }, { l: "🔥 Серия", v: streak, c: T.success }, { l: "Ср. сложн.", v: avgDiff, c: T.warn }, { l: "Сон avg", v: avgSleep !== "—" ? `${avgSleep}ч` : "—", c: T.muted }].map((s, i) => (
                <Card key={i} T={T} style={{ flex: 1, alignItems: "center", padding: 10 }}>
                  <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: s.c }}>{s.v}</Text><Lbl T={T}>{s.l}</Lbl>
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
              {trend.length > 1 ? (() => {
                  const max = Math.max(...trend.map((t: any) => t.val), 1);
                  const w = 300; const h = 100;
                  const prVal = prs[selEx] || 0;
                  const pts = trend.map((d: any, i: number) => `${(i / Math.max(trend.length - 1, 1)) * w},${h - (d.val / max) * (h - 10)}`).join(" ");
                  const areaPts = `0,${h} ${pts} ${w},${h}`;
                  const last3 = trend.slice(-3);
                  const goingUp = last3.length >= 2 && last3[last3.length - 1].val >= last3[0].val;
                  return (
                    <View style={{ marginTop: 4 }}>
                      {trendSelIdx !== null && (
                        <View style={{ backgroundColor: T.lo, borderRadius: 8, padding: 8, marginBottom: 8, flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.txt }}>{trend[trendSelIdx]?.date}</Text>
                          <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.success }}>{trend[trendSelIdx]?.val} повт</Text>
                        </View>
                      )}
                      <Svg height="140" width="100%" viewBox="0 0 300 125">
                        <Defs>
                          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={T.success} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={T.success} stopOpacity="0" />
                          </LinearGradient>
                        </Defs>
                        <Polygon points={areaPts} fill="url(#grad)" />
                        {prVal > 0 && (
                          <Line x1="0" y1={h - (prVal / max) * (h - 10)} x2={w} y2={h - (prVal / max) * (h - 10)} stroke={T.warn} strokeWidth="1.5" strokeDasharray="6,4" />
                        )}
                        <Polyline points={pts} fill="none" stroke={T.success} strokeWidth="2.5" strokeLinejoin="round" />
                        {trend.map((d: any, i: number) => {
                          const cx = (i / Math.max(trend.length - 1, 1)) * w;
                          const cy = h - (d.val / max) * (h - 10);
                          const isSel = trendSelIdx === i;
                          return (
                            <G key={i}>
                              <Circle cx={cx} cy={cy} r={isSel ? 7 : 4} fill={isSel ? T.success : T.surf} stroke={T.success} strokeWidth={isSel ? 3 : 2} />
                              <SvgText x={cx} y={h + 12} textAnchor="middle" fill={isSel ? T.success : T.muted} fontSize="8" fontWeight={isSel ? "700" : "400"}>{d.date}</SvgText>
                              <Rect x={cx - 18} y={cy - 20} width={36} height={16} fill={T.success} rx={4} onPress={() => setTrendSelIdx(isSel ? null : i)} />
                              <SvgText x={cx} y={cy - 8} textAnchor="middle" fill="#000" fontSize="10" fontWeight="700" onPress={() => setTrendSelIdx(isSel ? null : i)}>{d.val}</SvgText>
                            </G>
                          );
                        })}
                      </Svg>
                      <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted, textAlign: "center", marginTop: 4 }}>Тапни на точку для деталей</Text>
                      {last3.length >= 2 && (
                        <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: goingUp ? T.success : T.danger, textAlign: "center", marginTop: 4 }}>
                          {goingUp ? "📈 Растёт!" : "📉 Снижение"}
                        </Text>
                      )}
                    </View>
                  );
                })() : (
                <Text style={{ fontFamily: "System", fontSize: 13, color: T.muted, textAlign: "center", paddingVertical: 20 }}>Нужно минимум 2 записи</Text>
              )}
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

            {/* Life Balance Radar Chart */}
            {useMemo(() => {
              const vals = [
                { label: "Трен.", value: score.workout },
                { label: "Задачи", value: score.tasks ?? 0 },
                { label: "Цели", value: goals.filter((g: any) => g.completed).length > 0 ? 100 : goals.length > 0 ? 50 : 0 },
                { label: "Дневн.", value: score.journal },
                { label: "Серия", value: Math.min(streak * 10, 100) },
              ];
              const cx = 100; const cy = 90; const r = 70;
              const axes = 5;
              const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
              const getPoint = (angle: number, ratio: number) => ({
                x: cx + r * ratio * Math.cos(angle - Math.PI / 2),
                y: cy + r * ratio * Math.sin(angle - Math.PI / 2),
              });
              const gridPts = levels.map((lv) =>
                Array.from({ length: axes }, (_, i) => {
                  const angle = (i / axes) * Math.PI * 2;
                  return getPoint(angle, lv);
                })
              );
              const dataPts = vals.map((v, i) => {
                const angle = (i / axes) * Math.PI * 2;
                return getPoint(angle, Math.max(v.value, 0) / 100);
              });
              const polyStr = dataPts.map((p) => `${p.x},${p.y}`).join(" ");
              return (
                <Card T={T} style={{ marginBottom: 14 }}>
                  <Lbl T={T}>🕸 Баланс жизни</Lbl>
                  <Svg height="200" width="100%" viewBox="0 0 200 200">
                    {gridPts.map((pts, li) => (
                      <Polygon key={`g${li}`} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={T.bord} strokeWidth="0.8" />
                    ))}
                    {Array.from({ length: axes }, (_, i) => {
                      const angle = (i / axes) * Math.PI * 2;
                      const end = getPoint(angle, 1);
                      return <Line key={`a${i}`} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={T.bord} strokeWidth="0.8" />;
                    })}
                    <Polygon points={polyStr} fill={`${T.primary}30`} stroke={T.primary} strokeWidth="2" />
                    {dataPts.map((p, i) => (
                      <G key={`d${i}`}>
                        <Circle cx={p.x} cy={p.y} r="3.5" fill={T.primary} stroke={T.card} strokeWidth="1.5" />
                        <SvgText x={p.x} y={p.y - 8} textAnchor="middle" fill={T.primary} fontSize="9" fontWeight="700">{vals[i].value}</SvgText>
                      </G>
                    ))}
                  </Svg>
                </Card>
              );
            }, [score.workout, score.tasks, score.journal, streak, goals, T.primary, T.bord, T.card])}

            {/* Weekly Workouts Bar Chart */}
            <Card T={T} style={{ marginBottom: 14 }}>
              <Lbl T={T}>📊 Тренировки по неделям</Lbl>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: "row", gap: 8, paddingRight: 20 }}>
                  {wStats.map((w: any, i: number) => (
                    <View key={i} style={{ alignItems: "center", minWidth: 40 }}>
                      <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 16, color: w.count > 0 ? T.primary : T.muted }}>{w.count}</Text>
                      <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted, marginTop: 2 }}>{w.week}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </Card>

            {/* Weekly Tonnage Area Chart */}
            {wTonnage.length > 0 && (() => {
              const w = 300; const h = 100;
              const pts = wTonnage.map((d: any, i: number) => `${(i / Math.max(wTonnage.length - 1, 1)) * w},${h - (d.tonnage / maxT) * (h - 15)}`).join(" ");
              const areaPts = `0,${h} ${pts} ${w},${h}`;
              return (
                <Card T={T} style={{ marginBottom: 14 }}>
                  <Lbl T={T}>📈 Недельный тоннаж</Lbl>
                  {tonnageSelIdx !== null && (
                    <View style={{ backgroundColor: T.lo, borderRadius: 8, padding: 8, marginTop: 8, marginBottom: 8, flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.txt }}>{wTonnage[tonnageSelIdx]?.week}</Text>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.warn }}>{wTonnage[tonnageSelIdx]?.tonnage} повт</Text>
                    </View>
                  )}
                  <Svg height={h + 20} width="100%" viewBox={`0 0 ${w} ${h + 15}`}>
                    <Defs>
                      <LinearGradient id="tonnageGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={T.warn} stopOpacity="0.3" />
                        <Stop offset="1" stopColor={T.warn} stopOpacity="0" />
                      </LinearGradient>
                    </Defs>
                    <Polygon points={areaPts} fill="url(#tonnageGrad)" />
                    <Polyline points={pts} fill="none" stroke={T.warn} strokeWidth="2.5" strokeLinejoin="round" />
                    {wTonnage.map((d: any, i: number) => {
                      const cx = (i / Math.max(wTonnage.length - 1, 1)) * w;
                      const cy = h - (d.tonnage / maxT) * (h - 15);
                      const isSel = tonnageSelIdx === i;
                      return (
                        <G key={i}>
                          <Circle cx={cx} cy={cy} r={isSel ? 8 : 5} fill={isSel ? T.warn : T.surf} stroke={T.warn} strokeWidth={isSel ? 3 : 2} onPress={() => setTonnageSelIdx(isSel ? null : i)} />
                          <SvgText x={cx} y={h + 12} textAnchor="middle" fill={isSel ? T.warn : T.muted} fontSize="8" fontWeight={isSel ? "700" : "400"}>{d.week}</SvgText>
                        </G>
                      );
                    })}
                  </Svg>
                </Card>
              );
            })()}

            {/* Mood x Workout Correlation */}
            {(() => {
              const corr = moodWorkoutCorrelation(history, journal);
              if (corr.length < 2) return null;
              const w = 300; const h = 80;
              const moodPts = corr.filter((d: any) => d.mood).map((d: any, i, arr) => `${(i / Math.max(arr.length - 1, 1)) * w},${h - ((d.mood - 1) / 4) * (h - 15)}`).join(" ");
              const energyPts = corr.filter((d: any) => d.energy).map((d: any, i, arr) => `${(i / Math.max(arr.length - 1, 1)) * w},${h - ((d.energy - 1) / 4) * (h - 15)}`).join(" ");
              return (
                <Card T={T} style={{ marginBottom: 14 }}>
                  <Lbl T={T}>📉 Настроение и энергия</Lbl>
                  <View style={{ flexDirection: "row", gap: 16, marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ width: 16, height: 3, backgroundColor: T.primary, borderRadius: 2 }} />
                      <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>Настроение</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ width: 16, height: 3, backgroundColor: T.success, borderRadius: 2, borderWidth: 1, borderStyle: "dashed" }} />
                      <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>Энергия</Text>
                    </View>
                  </View>
                  <Svg height={h + 40} width="100%" viewBox={`0 0 ${w} ${h + 35}`}>
                    {moodPts && <Polyline points={moodPts} fill="none" stroke={T.primary} strokeWidth="2" strokeLinejoin="round" />}
                    {energyPts && <Polyline points={energyPts} fill="none" stroke={T.success} strokeWidth="2" strokeDasharray="4,3" strokeLinejoin="round" />}
                    {corr.filter((d: any) => d.mood).map((d: any, i: number, arr: any[]) => {
                      const cx = (i / Math.max(arr.length - 1, 1)) * w;
                      const cy = h - ((d.mood - 1) / 4) * (h - 15);
                      return <Circle key={i} cx={cx} cy={cy} r="3" fill={T.primary} />;
                    })}
                    {corr.filter((d: any) => d.energy).map((d: any, i: number, arr: any[]) => {
                      const cx = (i / Math.max(arr.length - 1, 1)) * w;
                      const cy = h - ((d.energy - 1) / 4) * (h - 15);
                      return <Circle key={i} cx={cx} cy={cy} r="3" fill={T.success} />;
                    })}
                  </Svg>
                </Card>
              );
            })()}

            {/* Sleep 30-day Area Chart */}
            {(() => {
              const sleepData = Array.from({ length: 30 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - 29 + i);
                const dd = fmt(d);
                const entry = journal.filter((j: any) => j.date === dd).slice(-1)[0];
                return { date: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }), sleep: entry?.sleep || 0 };
              }).filter((d) => d.sleep > 0);
              if (sleepData.length < 2) return null;
              const w = 300; const h = 80;
              const maxS = 10;
              const pts = sleepData.map((d: any, i: number) => `${(i / Math.max(sleepData.length - 1, 1)) * w},${h - (d.sleep / maxS) * (h - 10)}`).join(" ");
              const areaPts = `0,${h} ${pts} ${w},${h}`;
              const refY = h - (7 / maxS) * (h - 10);
              return (
                <Card T={T} style={{ marginBottom: 14 }}>
                  <Lbl T={T}>💤 Сон за 30 дней</Lbl>
                  <Svg height={h + 30} width="100%" viewBox={`0 0 ${w} ${h + 30}`}>
                    <Defs>
                      <LinearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={T.success} stopOpacity="0.25" />
                        <Stop offset="1" stopColor={T.success} stopOpacity="0" />
                      </LinearGradient>
                    </Defs>
                    <Line x1="0" y1={refY} x2={w} y2={refY} stroke={T.muted} strokeWidth="1" strokeDasharray="3,3" />
                    <SvgText x={w - 5} y={refY - 4} textAnchor="end" fill={T.muted} fontSize="8">7ч</SvgText>
                    <Polygon points={areaPts} fill="url(#sleepGrad)" />
                    <Polyline points={pts} fill="none" stroke={T.success} strokeWidth="2" strokeLinejoin="round" />
                    {sleepData.map((d: any, i: number) => {
                      const cx = (i / Math.max(sleepData.length - 1, 1)) * w;
                      const cy = h - (d.sleep / maxS) * (h - 10);
                      return (
                        <G key={i}>
                          <Circle cx={cx} cy={cy} r="3" fill={d.sleep >= 7 ? T.success : d.sleep >= 6 ? T.warn : T.danger} stroke={T.card} strokeWidth="1.5" />
                          {i % 5 === 0 && <SvgText x={cx} y={h + 14} textAnchor="middle" fill={T.muted} fontSize="8">{d.date}</SvgText>}
                        </G>
                      );
                    })}
                  </Svg>
                </Card>
              );
            })()}
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
});

/* ══════════ PROFILE TAB ══════════ */
function ProfileTab({ T, state, setState }: any) {
  const [editing, setEditing] = useState(false);
  const [mp, setMp] = useState(state.user.maxPushups);
  const [note, setNote] = useState(state.user.note || "");
  const [asymNote, setAsymNote] = useState(state.user.asymmetryNote || "");
  const [showReset, setShowReset] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const total = Object.values(state.history).filter((l: any) => l.completed).length;
  const wR = { min: Math.round((state.user.maxPushups || 27) * 0.6), max: Math.round((state.user.maxPushups || 27) * 0.7) };
  const save = () => { setState((s: any) => ({ ...s, user: { ...s.user, maxPushups: parseInt(mp) || 27, note, asymmetryNote: asymNote } })); setEditing(false); };

  return (
    <ScrollView style={{ flex: 1, padding: 14 }} contentContainerStyle={{ gap: 12, paddingBottom: 33 }}>
      <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 24, color: T.txt, marginBottom: 14 }}>⚙️ Профиль</Text>
      <Card T={T} style={{ backgroundColor: `${T.primary}08`, borderColor: `${T.primary}33` }}>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}><Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 28, color: T.primary }}>{total}</Text><Lbl T={T}>Тренировок</Lbl></View>
          <View style={{ width: 1, backgroundColor: T.bord }} />
          <View style={{ alignItems: "center" }}><Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 28, color: T.success }}>{wR.min}–{wR.max}</Text><Lbl T={T}>Рабочий диап.</Lbl></View>
          <View style={{ width: 1, backgroundColor: T.bord }} />
          <View style={{ alignItems: "center" }}><Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 28, color: T.warn }}>{state.user.maxPushups}</Text><Lbl T={T}>Макс. повт.</Lbl></View>
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
        <View style={{ padding: 10, backgroundColor: T.lo, borderRadius: 10, marginBottom: 10 }}>
          <Lbl T={T}>Рабочий диапазон (60–70%)</Lbl>
          <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 20, color: T.success, marginTop: 4 }}>{wR.min}–{wR.max} повт</Text>
        </View>
        {editing && (
          <>
            <Lbl T={T}>Заметки об асимметрии</Lbl>
            <TextInput value={asymNote} onChangeText={setAsymNote} placeholder="Напр.: левое плечо слабее…" placeholderTextColor={T.muted} multiline
              style={{ borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 10, minHeight: 60, marginTop: 6, marginBottom: 10 }} />
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
          <View style={{ height: 1, backgroundColor: T.bord, marginVertical: 12 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Text style={{ fontSize: 14 }}>🎭</Text>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, letterSpacing: 1, color: T.muted, textTransform: "uppercase" }}>СТИЛЬ ИНТЕРФЕЙСА</Text>
          </View>
          <TouchableOpacity onPress={() => setShowStylePicker(true)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, backgroundColor: T.lo, borderRadius: 10, borderColor: T.bord, borderWidth: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 20 }}>{STYLE_LIST.find((x) => x.id === (state.styleThemeId || "standard"))?.icon}</Text>
              <View>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.txt }}>{STYLE_LIST.find((x) => x.id === (state.styleThemeId || "standard"))?.name}</Text>
                <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{STYLE_LIST.find((x) => x.id === (state.styleThemeId || "standard"))?.desc}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 16, color: T.muted }}>→</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "column", gap: 8, marginTop: 14 }}>
          <Btn T={T} variant="muted" onPress={() => exportJSON(state)} style={{ width: "100%" }}>📥 Экспорт JSON</Btn>
          <Btn T={T} variant="muted" onPress={() => exportCSV(state.history)} style={{ width: "100%" }}>📊 Экспорт CSV</Btn>
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
                <Btn T={T} variant="danger" onPress={() => { setState({ ...DEFAULTS, themeId: state.themeId || "cosmos", styleThemeId: state.styleThemeId || "standard" }); setShowReset(false); }} style={{ flex: 1 }}>Удалить всё</Btn>
              </View>
            </Card>
          </View>
        </Modal>
      )}
      {showThemes && <ThemePicker T={T} currentThemeId={state.themeId || "cosmos"} currentStyleId={state.styleThemeId || "standard"} onSelect={(id: string) => setState((s: any) => ({ ...s, themeId: id }))} onStyleSelect={(id: string) => setState((s: any) => ({ ...s, styleThemeId: id }))} onClose={() => setShowThemes(false)} />}
      {showStylePicker && <StylePicker T={T} currentStyleId={state.styleThemeId || "standard"} onSelect={(id: string) => { setState((s: any) => ({ ...s, styleThemeId: id })); setShowStylePicker(false); }} onClose={() => setShowStylePicker(false)} />}
    </ScrollView>
  );
}

/* ══════════ PLAN EDITOR ══════════ */
function PlanEditorModal({ T, customPlan, onSave, onClose }: any) {
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState(customPlan || JSON.parse(JSON.stringify(PLAN)));
  const [editDay, setEditDay] = useState<number | null>(null);
  const [editEx, setEditEx] = useState<number | null>(null);

  const save = () => { onSave(plan); onClose(); };
  const updateDay = (di: number, patch: any) => setPlan((p: any) => p.map((d: any, i: number) => i === di ? { ...d, ...patch } : d));
  const updateExercise = (di: number, ei: number, patch: any) => setPlan((p: any) => {
    const ex = [...p[di].exercises];
    ex[ei] = { ...ex[ei], ...patch };
    return p.map((d: any, i: number) => i === di ? { ...d, exercises: ex } : d);
  });
  const addExercise = (di: number) => setPlan((p: any) => {
    const ex = [...(p[di].exercises || []), { id: `custom_${Date.now()}`, name: "Новое упражнение", type: "reps", sets: 3, reps: "10", hi: 10 }];
    return p.map((d: any, i: number) => i === di ? { ...d, exercises: ex } : d);
  });
  const removeExercise = (di: number, ei: number) => setPlan((p: any) => {
    const ex = p[di].exercises.filter((_: any, i: number) => i !== ei);
    return p.map((d: any, i: number) => i === di ? { ...d, exercises: ex } : d);
  });

  return (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.85)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, maxHeight: "90%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.txt }}>✏️ Редактор плана</Text>
              <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted, marginTop: 2 }}>Кастомный план тренировок</Text>
            </View>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 20, color: T.muted }}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: "75%" }}>
            {plan.map((day: any, di: number) => (
              <Card key={di} T={T} style={{ marginBottom: 8, borderColor: editDay === di ? `${T.primary}55` : undefined }}>
                <TouchableOpacity onPress={() => setEditDay(editDay === di ? null : di)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 20 }}>{day.emoji}</Text>
                    <View>
                      <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: T.txt }}>{day.day} — {day.name}</Text>
                      <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{day.type === "rest" ? "Отдых" : `${(day.exercises || []).length} упр.`}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, color: T.muted }}>{editDay === di ? "▲" : "▼"}</Text>
                </TouchableOpacity>

                {editDay === di && day.type !== "rest" && (
                  <View style={{ marginTop: 10 }}>
                    <TextInput value={day.name} onChangeText={(t) => updateDay(di, { name: t })}
                      style={{ height: 36, borderRadius: 8, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, paddingHorizontal: 10, marginBottom: 8 }} />
                    {(day.exercises || []).map((ex: any, ei: number) => (
                      <View key={ei} style={{ padding: 8, backgroundColor: T.lo, borderRadius: 8, marginBottom: 6 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <TextInput value={ex.name} onChangeText={(t) => updateExercise(di, ei, { name: t })}
                            style={{ flex: 1, height: 32, borderRadius: 6, borderColor: T.bord, borderWidth: 1, backgroundColor: T.card, color: T.txt, fontFamily: "System", fontSize: 13, paddingHorizontal: 8, marginRight: 6 }} />
                          <TouchableOpacity onPress={() => removeExercise(di, ei)}><Text style={{ fontSize: 16, color: T.danger }}>×</Text></TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <TextInput keyboardType="numeric" value={String(ex.sets)} onChangeText={(t) => updateExercise(di, ei, { sets: Number(t) || 1 })}
                            style={{ width: 50, height: 30, borderRadius: 6, borderColor: T.bord, borderWidth: 1, backgroundColor: T.card, color: T.txt, fontFamily: "System", fontSize: 13, textAlign: "center" }} />
                          <TextInput value={ex.reps} onChangeText={(t) => updateExercise(di, ei, { reps: t })}
                            style={{ width: 70, height: 30, borderRadius: 6, borderColor: T.bord, borderWidth: 1, backgroundColor: T.card, color: T.txt, fontFamily: "System", fontSize: 13, textAlign: "center" }} />
                          <TouchableOpacity onPress={() => updateExercise(di, ei, { type: ex.type === "reps" ? "seconds" : "reps" })}
                            style={{ paddingHorizontal: 8, height: 30, borderRadius: 6, borderColor: T.bord, borderWidth: 1, backgroundColor: T.card, justifyContent: "center" }}>
                            <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{ex.type === "reps" ? "повт" : "сек"}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    <Btn T={T} variant="ghost" onPress={() => addExercise(di)} style={{ width: "100%", minHeight: 36, fontSize: 13 }}>+ Добавить упражнение</Btn>
                  </View>
                )}
              </Card>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, paddingBottom: insets.bottom }}>
            <Btn T={T} variant="muted" onPress={onClose} style={{ flex: 1 }}>Отмена</Btn>
            <Btn T={T} onPress={save} style={{ flex: 2 }}>Сохранить план</Btn>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════ EDIT WORKOUT MODAL ══════════ */
function EditWorkoutModal({ T, date, log, onSave, onClose }: any) {
  const insets = useSafeAreaInsets();
  const plan = PLAN.find((p) => p.id === log.dayId) || { name: "Тренировка", exercises: [] };
  const [difficulty, setDifficulty] = useState(log.difficulty || 5);
  const [painNotes, setPainNotes] = useState(log.painNotes || "");
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, any>>(log.exercises || {});
  const [showNumpad, setShowNumpad] = useState<{ exId: string; si: number } | null>(null);
  const [numpadValue, setNumpadValue] = useState("");

  const handleNumpad = (key: string) => {
    if (key === "⌫") { setNumpadValue((v) => v.slice(0, -1)); return; }
    if (key === "✓") {
      const { exId, si } = showNumpad!;
      setExerciseLogs((prev: Record<string, any>) => {
        const ex = { ...prev[exId] };
        ex[si] = { ...ex[si], value: numpadValue || "0" };
        return { ...prev, [exId]: ex };
      });
      setShowNumpad(null); setNumpadValue("");
      return;
    }
    setNumpadValue((v) => v.length < 4 ? v + key : v);
  };

  const handleSave = () => {
    onSave({ ...log, difficulty, painNotes, exercises: exerciseLogs });
    onClose();
  };

  const dateObj = new Date(date + "T12:00:00");
  const dateLabel = dateObj.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });

  return (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.85)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, maxHeight: "90%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <View>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.txt }}>✏️ Редактировать</Text>
              <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted, marginTop: 2 }}>{dateLabel} · {plan.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 20, color: T.muted }}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: "70%" }} showsVerticalScrollIndicator={false}>
            <Card T={T} style={{ marginBottom: 12 }}>
              <Lbl T={T}>Сложность</Lbl>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <TouchableOpacity key={n} onPress={() => setDifficulty(n)}
                    style={{ width: 38, height: 38, borderRadius: 8, borderColor: difficulty === n ? T.primary : T.bord, borderWidth: 2, backgroundColor: difficulty === n ? `${T.primary}22` : T.lo, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: difficulty === n ? T.primary : T.muted }}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            <Card T={T} style={{ marginBottom: 12 }}>
              <Lbl T={T}>Болевые ощущения</Lbl>
              <TextInput value={painNotes} onChangeText={setPainNotes} placeholder="Опиши, если что-то беспокоило…"
                style={{ width: "100%", borderRadius: 8, borderColor: T.bord, borderWidth: 1.5, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 14, padding: 10, minHeight: 70, marginTop: 8 }} multiline />
            </Card>

            <Card T={T} style={{ marginBottom: 12 }}>
              <Lbl T={T}>Результаты</Lbl>
              {(plan.exercises || []).map((ex: any) => {
                const logs = exerciseLogs[ex.id] || [];
                if (!logs.length) return null;
                return (
                  <View key={ex.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: T.bord }}>
                    <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.txt, marginBottom: 8 }}>{ex.name}</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {logs.map((s: any, si: number) => (
                        <TouchableOpacity key={si} onPress={() => { setShowNumpad({ exId: ex.id, si }); setNumpadValue(String(s.value || "")); }}
                          style={{ minWidth: 60, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderColor: s.done ? T.success : T.bord, borderWidth: 1.5, backgroundColor: s.done ? `${T.success}15` : T.lo, justifyContent: "center", alignItems: "center" }}>
                          <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 15, color: s.done ? T.success : T.muted }}>{s.value || "-"}</Text>
                          <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted }}>{ex.type === "seconds" ? "сек" : "повт"}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </Card>
          </ScrollView>

          {showNumpad && (
            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: T.surf, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 16 + insets.bottom }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted }}>Введи значение</Text>
                <TouchableOpacity onPress={() => { setShowNumpad(null); setNumpadValue(""); }}><Text style={{ color: T.muted }}>Отмена</Text></TouchableOpacity>
              </View>
              <View style={{ backgroundColor: T.lo, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 40, color: T.txt, textAlign: "center" }}>{numpadValue || "0"}</Text>
                <Text style={{ fontFamily: "System", fontSize: 14, color: T.muted, textAlign: "center" }}>{showNumpad && plan.exercises.find((e: any) => e.id === showNumpad.exId)?.type === "seconds" ? "секунд" : "повторений"}</Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {["1","2","3","4","5","6","7","8","9","⌫","0","✓"].map((key) => (
                  <TouchableOpacity key={key} onPress={() => handleNumpad(key)}
                    style={{ width: "30%", aspectRatio: 2, borderRadius: 10, justifyContent: "center", alignItems: "center",
                      backgroundColor: key === "✓" ? T.primary : key === "⌫" ? `${T.danger}20` : T.card,
                      borderColor: key === "✓" ? T.primary : T.bord, borderWidth: 1 }}>
                    <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 22, color: key === "✓" ? "#000" : key === "⌫" ? T.danger : T.txt }}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, paddingBottom: insets.bottom }}>
            <Btn T={T} variant="muted" onPress={onClose} style={{ flex: 1 }}>Отмена</Btn>
            <Btn T={T} variant="success" onPress={handleSave} style={{ flex: 2 }}>Сохранить</Btn>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════ HEAT MAP ══════════ */
function HeatMap({ T, history }: any) {
  const data = getHeatMapData(history, 12);
  const completedCount = data.filter(d => d.completed).length;
  return (
    <Card T={T} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Lbl T={T}>📅 Активность / 12 недель</Lbl>
        <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: T.primary }}>{completedCount} тренировок</Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
        {data.map((d: any, i: number) => {
          const opacity = d.completed ? Math.min(1, 0.25 + (d.difficulty / 10) * 0.75) : d.isRest ? 0.05 : 0.1;
          const bg = d.completed ? T.primary : d.isRest ? T.muted : T.lo;
          return (
            <View key={i} style={{
              width: 10, height: 10, borderRadius: 2, backgroundColor: bg, opacity,
              borderColor: d.isToday ? T.warn : "transparent", borderWidth: d.isToday ? 1.5 : 0,
            }} />
          );
        })}
      </View>
    </Card>
  );
}

/* ══════════ INSIGHTS CARD ══════════ */
function InsightsCard({ T, history, journal, tasks, goals }: any) {
  const insights = generateInsights(history, journal, tasks, goals);
  if (insights.length === 0) return null;
  return (
    <>
      {insights.map((ins: any, i: number) => (
        <View key={i} style={{ padding: 10, backgroundColor: `${ins.color}10`, borderColor: `${ins.color}33`, borderWidth: 1, borderRadius: 10, flexDirection: "row", gap: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 18 }}>{ins.icon}</Text>
          <Text style={{ fontFamily: "System", fontSize: 13, color: T.txt, flex: 1, lineHeight: 18 }}>{ins.text}</Text>
        </View>
      ))}
    </>
  );
}

/* ══════════ MUSCLE RECOVERY ══════════ */
function MuscleRecoveryCard({ T, history }: any) {
  const recovery = getMuscleRecovery(history);
  const groups = [
    { id: "upper", name: "Верх", emoji: "💪", color: "#00C4F0" },
    { id: "lower", name: "Ноги", emoji: "🦵", color: "#E040FB" },
    { id: "core", name: "Кор", emoji: "⚡", color: "#FF9800" },
  ];
  const statusLabel = (days: number | null) => {
    if (days === null) return { text: "Нет данных", color: T.muted, pct: 0 };
    if (days === 0) return { text: "Сегодня", color: T.danger, pct: 0 };
    if (days <= 1) return { text: "Восстанавливается", color: T.warn, pct: 33 };
    if (days <= 2) return { text: "Почти готово", color: T.success, pct: 66 };
    return { text: "Полностью готово", color: T.primary, pct: 100 };
  };
  return (
    <Card T={T} style={{ marginBottom: 12 }}>
      <Lbl T={T}>🫀 Восстановление мышц</Lbl>
      {groups.map((g) => {
        const days = recovery[g.id];
        const st = statusLabel(days);
        return (
          <View key={g.id} style={{ marginTop: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 13, color: T.txt }}>{g.emoji} {g.name}</Text>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: st.color }}>{st.text}{days !== null ? ` (${days} дн.)` : ""}</Text>
            </View>
            <View style={{ height: 6, backgroundColor: T.lo, borderRadius: 3 }}>
              <View style={{ height: "100%", width: `${st.pct}%`, backgroundColor: st.color, borderRadius: 3 }} />
            </View>
          </View>
        );
      })}
    </Card>
  );
}

/* ══════════ NUTRITION TAB ══════════ */
function NutritionTab({ T, state, setState }: any) {
  const nutrition = state.nutrition || {};
  const todayData = nutrition[TODAY] || { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] };
  const [adding, setAdding] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCal, setCustomCal] = useState("");
  const [customP, setCustomP] = useState("");
  const [customC, setCustomC] = useState("");
  const [customF, setCustomF] = useState("");

  const addFood = (name: string, cal: number, p: number, c: number, f: number) => {
    const entries = [...(todayData.entries || []), { name, cal, p, c, f, ts: Date.now() }];
    const updated = {
      calories: todayData.calories + cal,
      protein: todayData.protein + p,
      carbs: todayData.carbs + c,
      fat: todayData.fat + f,
      entries,
    };
    setState((s: any) => ({ ...s, nutrition: { ...s.nutrition, [TODAY]: updated } }));
  };

  const removeEntry = (idx: number) => {
    const entry = todayData.entries[idx];
    const entries = todayData.entries.filter((_: any, i: number) => i !== idx);
    const updated = {
      calories: Math.max(0, todayData.calories - entry.cal),
      protein: Math.max(0, todayData.protein - entry.p),
      carbs: Math.max(0, todayData.carbs - entry.c),
      fat: Math.max(0, todayData.fat - entry.f),
      entries,
    };
    setState((s: any) => ({ ...s, nutrition: { ...s.nutrition, [TODAY]: updated } }));
  };

  // Last 7 days calorie bar
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const dd = fmt(d);
    const nd = nutrition[dd];
    return { date: d.toLocaleDateString("ru-RU", { weekday: "short" }), cal: nd?.calories || 0 };
  });
  const maxCal = Math.max(...last7.map(d => d.cal), MACRO_GOALS.calories);

  const calPct = Math.min(100, Math.round((todayData.calories / Math.max(MACRO_GOALS.calories, 1)) * 100));
  const proteinPct = Math.min(100, Math.round((todayData.protein / Math.max(MACRO_GOALS.protein, 1)) * 100));
  const carbsPct = Math.min(100, Math.round((todayData.carbs / Math.max(MACRO_GOALS.carbs, 1)) * 100));
  const fatPct = Math.min(100, Math.round((todayData.fat / Math.max(MACRO_GOALS.fat, 1)) * 100));

  return (
    <ScrollView style={{ flex: 1, padding: 14 }} contentContainerStyle={{ gap: 12, paddingBottom: 33 }}>
      <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 24, color: T.txt }}>🥗 Питание</Text>

      {/* Modern Rings Card */}
      <Card T={T} style={{ backgroundColor: T.card }}>
        {/* Main calorie ring */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 140, height: 140, justifyContent: "center", alignItems: "center" }}>
            <Svg width={140} height={140} style={{ position: "absolute" }}>
              <Circle cx={70} cy={70} r={58} stroke={T.lo} strokeWidth={12} fill="none" />
              <Circle
                cx={70} cy={70} r={58}
                stroke={todayData.calories > MACRO_GOALS.calories ? T.danger : T.primary}
                strokeWidth={12}
                fill="none"
                strokeDasharray={2 * Math.PI * 58}
                strokeDashoffset={2 * Math.PI * 58 * (1 - calPct / 100)}
                strokeLinecap="round"
                rotation={-90}
                origin="70, 70"
              />
            </Svg>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 32, color: T.txt }}>{todayData.calories}</Text>
              <Text style={{ fontFamily: "System", fontSize: 12, color: T.muted }}>из {MACRO_GOALS.calories}</Text>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: todayData.calories > MACRO_GOALS.calories ? T.danger : T.primary, marginTop: 2 }}>
                {calPct}%
              </Text>
            </View>
          </View>
          <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.muted, marginTop: 8, letterSpacing: 1, textTransform: "uppercase" }}>КАЛОРИИ СЕГОДНЯ</Text>
        </View>

        {/* Macro rings row */}
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          {/* Protein */}
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 70, height: 70, justifyContent: "center", alignItems: "center" }}>
              <Svg width={70} height={70} style={{ position: "absolute" }}>
                <Circle cx={35} cy={35} r={28} stroke={T.lo} strokeWidth={6} fill="none" />
                <Circle
                  cx={35} cy={35} r={28}
                  stroke={T.success}
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - proteinPct / 100)}
                  strokeLinecap="round"
                  rotation={-90}
                  origin="35, 35"
                />
              </Svg>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.success }}>{Math.round(todayData.protein)}</Text>
            </View>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 10, color: T.success, marginTop: 4 }}>БЕЛОК</Text>
            <Text style={{ fontFamily: "System", fontSize: 9, color: T.muted }}>{MACRO_GOALS.protein}г</Text>
          </View>

          {/* Carbs */}
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 70, height: 70, justifyContent: "center", alignItems: "center" }}>
              <Svg width={70} height={70} style={{ position: "absolute" }}>
                <Circle cx={35} cy={35} r={28} stroke={T.lo} strokeWidth={6} fill="none" />
                <Circle
                  cx={35} cy={35} r={28}
                  stroke={T.warn}
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - carbsPct / 100)}
                  strokeLinecap="round"
                  rotation={-90}
                  origin="35, 35"
                />
              </Svg>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.warn }}>{Math.round(todayData.carbs)}</Text>
            </View>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 10, color: T.warn, marginTop: 4 }}>УГЛЕВОДЫ</Text>
            <Text style={{ fontFamily: "System", fontSize: 9, color: T.muted }}>{MACRO_GOALS.carbs}г</Text>
          </View>

          {/* Fat */}
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 70, height: 70, justifyContent: "center", alignItems: "center" }}>
              <Svg width={70} height={70} style={{ position: "absolute" }}>
                <Circle cx={35} cy={35} r={28} stroke={T.lo} strokeWidth={6} fill="none" />
                <Circle
                  cx={35} cy={35} r={28}
                  stroke={T.danger}
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - fatPct / 100)}
                  strokeLinecap="round"
                  rotation={-90}
                  origin="35, 35"
                />
              </Svg>
              <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.danger }}>{Math.round(todayData.fat)}</Text>
            </View>
            <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 10, color: T.danger, marginTop: 4 }}>ЖИРЫ</Text>
            <Text style={{ fontFamily: "System", fontSize: 9, color: T.muted }}>{MACRO_GOALS.fat}г</Text>
          </View>
        </View>
      </Card>

      {/* 7-day bar chart */}
      <Card T={T}>
        <Lbl T={T}>Калории / 7 дней</Lbl>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height: 80, marginTop: 10 }}>
          {last7.map((d, i) => {
            const h = maxCal > 0 ? (d.cal / maxCal) * 70 : 0;
            const isToday = i === 6;
            return (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                {d.cal > 0 && <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 8, color: T.primary, marginBottom: 2 }}>{d.cal}</Text>}
                <View style={{ width: "100%", height: h, backgroundColor: isToday ? T.primary : `${T.primary}55`, borderRadius: 3 }} />
                <Text style={{ fontFamily: "System", fontSize: 8, color: isToday ? T.primary : T.muted, marginTop: 2 }}>{d.date}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Food presets */}
      <Card T={T}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Lbl T={T}>Добавить еду</Lbl>
          <Btn T={T} variant="ghost" onPress={() => setAdding(!adding)} style={{ minHeight: 30, paddingHorizontal: 10, fontSize: 11 }}>{adding ? "Закрыть" : "Своё"}</Btn>
        </View>
        {adding && (
          <View style={{ marginBottom: 10 }}>
            <TextInput value={customName} onChangeText={setCustomName} placeholder="Название" placeholderTextColor={T.muted}
              style={{ height: 36, borderRadius: 8, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 13, paddingHorizontal: 10, marginBottom: 6 }} />
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TextInput keyboardType="numeric" value={customCal} onChangeText={setCustomCal} placeholder="Ккал" placeholderTextColor={T.muted}
                style={{ flex: 1, height: 34, borderRadius: 8, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 13, textAlign: "center" }} />
              <TextInput keyboardType="numeric" value={customP} onChangeText={setCustomP} placeholder="Б" placeholderTextColor={T.muted}
                style={{ flex: 1, height: 34, borderRadius: 8, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 13, textAlign: "center" }} />
              <TextInput keyboardType="numeric" value={customC} onChangeText={setCustomC} placeholder="У" placeholderTextColor={T.muted}
                style={{ flex: 1, height: 34, borderRadius: 8, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 13, textAlign: "center" }} />
              <TextInput keyboardType="numeric" value={customF} onChangeText={setCustomF} placeholder="Ж" placeholderTextColor={T.muted}
                style={{ flex: 1, height: 34, borderRadius: 8, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo, color: T.txt, fontFamily: "System", fontSize: 13, textAlign: "center" }} />
            </View>
            <Btn T={T} onPress={() => { if (customName) { addFood(customName, Number(customCal) || 0, Number(customP) || 0, Number(customC) || 0, Number(customF) || 0); setCustomName(""); setCustomCal(""); setCustomP(""); setCustomC(""); setCustomF(""); } }} style={{ marginTop: 8, minHeight: 36, fontSize: 13 }}>+ Добавить</Btn>
          </View>
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {FOOD_PRESETS.map((food, i) => (
            <TouchableOpacity key={i} onPress={() => addFood(food.name, food.cal, food.p, food.c, food.f)}
              style={{ flex: 1, minWidth: "45%", padding: 10, borderRadius: 10, borderColor: T.bord, borderWidth: 1, backgroundColor: T.lo }}>
              <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: T.txt }}>{food.name}</Text>
              <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted, marginTop: 2 }}>{food.cal} ккал · Б:{food.p} У:{food.c} Ж:{food.f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Today's entries */}
      {todayData.entries.length > 0 && (
        <Card T={T}>
          <Lbl T={T}>Съедено сегодня ({todayData.entries.length})</Lbl>
          {todayData.entries.map((e: any, i: number) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.bord }}>
              <View>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 14, color: T.txt }}>{e.name}</Text>
                <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted }}>{e.cal} ккал · Б:{e.p} У:{e.c} Ж:{e.f}</Text>
              </View>
              <TouchableOpacity onPress={() => removeEntry(i)}><Text style={{ fontSize: 16, color: T.danger }}>×</Text></TouchableOpacity>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

/* ══════════ MONTHLY STATS ══════════ */
function MonthlyStats({ T, history, journal }: any) {
  const [monthOffset, setMonthOffset] = useState(0);
  const month = useMemo(() => {
    const d = new Date(); d.setMonth(d.getMonth() + monthOffset); d.setDate(1); return d;
  }, [monthOffset]);
  const stats = getMonthlyStats(history, journal, month);
  const monthName = month.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

  return (
    <Card T={T} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <TouchableOpacity onPress={() => setMonthOffset(m => m - 1)}><Text style={{ fontSize: 18, color: T.primary }}>◀</Text></TouchableOpacity>
        <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 16, color: T.txt, textTransform: "capitalize" }}>{monthName}</Text>
        <TouchableOpacity onPress={() => setMonthOffset(m => m + 1)} disabled={monthOffset >= 0}><Text style={{ fontSize: 18, color: monthOffset >= 0 ? T.muted : T.primary }}>▶</Text></TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
        <View style={{ flex: 1, backgroundColor: T.lo, borderRadius: 8, padding: 8, alignItems: "center" }}>
          <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.primary }}>{stats.workoutDays}</Text>
          <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted }}>Тренировок</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: T.lo, borderRadius: 8, padding: 8, alignItems: "center" }}>
          <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.success }}>{stats.consistency}%</Text>
          <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted }}>Консист.</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: T.lo, borderRadius: 8, padding: 8, alignItems: "center" }}>
          <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.warn }}>{stats.avgDiff}</Text>
          <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted }}>Сложн.</Text>
        </View>
        {stats.avgMood && (
          <View style={{ flex: 1, backgroundColor: T.lo, borderRadius: 8, padding: 8, alignItems: "center" }}>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: T.primary }}>{stats.avgMood}</Text>
            <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted }}>Настр.</Text>
          </View>
        )}
      </View>
      {/* Mini calendar grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
        {stats.days.map((d: any, i: number) => {
          const bg = d.workout ? T.primary : d.isRest ? `${T.muted}22` : d.mood ? `${T.warn}44` : T.lo;
          return (
            <View key={i} style={{ width: 18, height: 18, borderRadius: 3, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
              {d.workout && <Text style={{ fontSize: 7, color: "#000" }}>✓</Text>}
              {d.mood && !d.workout && <Text style={{ fontSize: 7 }}>{MOODS.find((m: any) => m.v === d.mood)?.e}</Text>}
            </View>
          );
        })}
      </View>
      {stats.avgSleep && <Text style={{ fontFamily: "System", fontSize: 11, color: T.muted, marginTop: 8 }}>Средний сон: {stats.avgSleep}ч</Text>}
    </Card>
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
  const [showPlanEditor, setShowPlanEditor] = useState(false);

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
  const styleThemeId = state.styleThemeId || "standard";
  const T = useMemo(() => getTheme(themeId, styleThemeId), [themeId, styleThemeId]);
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
      {showThemes && <ThemePicker T={T} currentThemeId={themeId} currentStyleId={styleThemeId} onSelect={(id: string) => setState((s: any) => ({ ...s, themeId: id }))} onStyleSelect={(id: string) => setState((s: any) => ({ ...s, styleThemeId: id }))} onClose={() => setShowThemes(false)} />}
      {showPlanEditor && <PlanEditorModal T={T} customPlan={state.customPlan} onSave={(plan: any) => setState((s: any) => ({ ...s, customPlan: plan }))} onClose={() => setShowPlanEditor(false)} />}
      <View style={{ flex: 1, maxWidth: MAX_W, alignSelf: "center", width: "100%", paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Header T={T} streak={state.streak || 0} onOpenThemes={() => setShowThemes(true)} styleId={styleThemeId} />
        <View style={{ flex: 1 }}>
          {tab === "dashboard" && <DashboardTab T={T} state={state} setState={setState} onStartWorkout={startWorkout} />}
          {tab === "workout" && <WorkoutTab T={T} session={session} setSession={setSession} onFinish={finishWorkout} prs={prs} history={state.history} onStart={startWorkout} onEditPlan={() => setShowPlanEditor(true)} onEditHistory={(date: string, log: any) => setState((s: any) => ({ ...s, history: { ...s.history, [date]: log } }))} hasCustomPlan={!!state.customPlan} />}
          {tab === "nutrition" && <NutritionTab T={T} state={state} setState={setState} />}
          {tab === "tasks" && <TasksGoalsTab T={T} tasks={state.tasks || []} setTasks={setTasks} goals={state.goals || []} setGoals={setGoals} />}
          {tab === "journal" && <JournalBodyTab T={T} journal={state.journal || []} setJournal={setJournal} bodyLog={state.bodyLog || []} setBodyLog={setBodyLog} reflections={state.reflections || []} setReflections={setReflections} painLog={state.painLog || []} setPainLog={setPainLog} />}
          {tab === "ai" && <MentorTab T={T} state={state} setState={setState} />}
          {tab === "stats" && <StatsTab T={T} history={state.history} tasks={state.tasks || []} goals={state.goals || []} journal={state.journal || []} achievements={state.achievements || []} user={state.user} setState={setState} />}
        </View>
        <BottomNav T={T} tab={tab} setTab={setTab} hasActive={!!session} styleId={styleThemeId} />
      </View>
    </View>
  );
}
