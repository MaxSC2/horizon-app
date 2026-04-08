import React, { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import Svg, { Circle, G, Line, Polygon, Defs, LinearGradient, Stop, Polyline } from "react-native-svg";
import { PLAN, ACHIEVEMENT_DEFS, MOODS, ENERGY } from "../data/constants";
import { getPRs, calcStreak, weeklyWorkoutStats, exerciseTrend, weeklyTonnage, moodWorkoutCorrelation, computeAuto1RM, calcLifeScore, getAllProgressionSuggestions, getMonthlyStats } from "../utils/helpers";

export const StatsContent = React.memo(function StatsContent({ T, history, tasks, goals, journal, achievements, user, setState }: any) {
  const [selEx, setSelEx] = React.useState("pushups");
  const [trendSelIdx, setTrendSelIdx] = React.useState<number | null>(null);
  const [tonnageSelIdx, setTonnageSelIdx] = React.useState<number | null>(null);

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
  const wStats = useMemo(() => weeklyWorkoutStats(history), [history]);
  const wTonnage = useMemo(() => weeklyTonnage(history), [history]);
  const corr = useMemo(() => moodWorkoutCorrelation(history, journal), [history, journal]);
  const auto1RM = useMemo(() => computeAuto1RM(history), [history]);

  const trend = useMemo(() => exerciseTrend(history, selEx), [history, selEx]);
  const maxCount = useMemo(() => Math.max(...wStats.map((w: any) => w.count), 1), [wStats]);
  const maxT = useMemo(() => Math.max(...wTonnage.map((w: any) => w.tonnage), 1), [wTonnage]);

  const Card = ({ children, style = {} }: any) => (
    <View style={{ backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.bord, padding: 16, marginBottom: 14, ...style }}>
      {children}
    </View>
  );

  const Lbl = ({ children }: any) => (
    <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 11, color: T.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
      {children}
    </Text>
  );

  return (
    <ScrollView style={{ flex: 1, padding: 14 }} contentContainerStyle={{ paddingBottom: 33 }}>
      <View style={{ flexDirection: "row", gap: 7, marginBottom: 14 }}>
        {[
          { l: "Тренировок", v: totalW, c: T.primary },
          { l: "🔥 Серия", v: streak, c: T.success },
          { l: "Ср. сложн.", v: avgDiff, c: T.warn },
          { l: "Сон avg", v: avgSleep !== "—" ? `${avgSleep}ч` : "—", c: T.muted }
        ].map((s, i) => (
          <Card key={i} style={{ flex: 1, alignItems: "center", padding: 10 }}>
            <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 18, color: s.c }}>{s.v}</Text>
            <Lbl>{s.l}</Lbl>
          </Card>
        ))}
      </View>

      {/* Exercise Trend */}
      <Card>
        <Lbl>Динамика упражнения</Lbl>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {["pushups", "pause_pushups", "squats", "plank", "hollow"].map((id) => {
            const ex = trackedEx.find((e: any) => e.id === id);
            if (!ex) return null;
            return (
              <View key={id}
                style={{
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                  borderColor: selEx === id ? T.primary : T.bord, borderWidth: 1.5,
                  backgroundColor: selEx === id ? `${T.primary}15` : T.lo
                }}>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 12, color: selEx === id ? T.primary : T.muted }}>{ex.name}</Text>
              </View>
            );
          })}
        </View>
        {trend.length > 1 ? (
          <Svg height="100" width="100%" viewBox="0 0 300 90">
            <Polyline
              points={trend.map((t: any, i: number) => `${(i / (trend.length - 1)) * 280 + 10},${80 - (t.val / Math.max(...trend.map((d: any) => d.val), 1)) * 70}`).join(" ")}
              fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinejoin="round"
            />
          </Svg>
        ) : <Text style={{ color: T.muted, textAlign: "center" }}>Недостаточно данных</Text>}
      </Card>

      {/* Weekly Stats */}
      <Card>
        <Lbl>Тренировки по неделям</Lbl>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {wStats.map((w: any, i: number) => (
              <View key={i} style={{ alignItems: "center", minWidth: 40 }}>
                <Text style={{ fontFamily: "System", fontWeight: "900", fontSize: 16, color: w.count > 0 ? T.primary : T.muted }}>{w.count}</Text>
                <Text style={{ fontFamily: "System", fontSize: 10, color: T.muted }}>{w.week}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Card>

      {/* PRs */}
      {Object.keys(prs).length > 0 && (
        <Card>
          <Lbl>Личные рекорды</Lbl>
          {Object.entries(prs).map(([id, val]: [string, any]) => {
            const ex = trackedEx.find((e: any) => e.id === id);
            if (!ex || !val) return null;
            return (
              <View key={id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: T.bord }}>
                <Text style={{ fontFamily: "System", fontSize: 14, color: T.txt }}>{ex.name}</Text>
                <Text style={{ fontFamily: "System", fontWeight: "700", fontSize: 16, color: T.warn }}>{val} {ex.type === "seconds" ? "сек" : "повт"}</Text>
              </View>
            );
          })}
        </Card>
      )}

      {/* Progression Alerts */}
      {alerts.length > 0 && (
        <Card style={{ backgroundColor: `${T.warn}08`, borderColor: `${T.warn}33` }}>
          <Lbl>Прогрессия</Lbl>
          {alerts.map((a: any, i: number) => (
            <Text key={i} style={{ fontFamily: "System", fontSize: 14, color: T.txt, paddingVertical: 5 }}>{a.message}</Text>
          ))}
        </Card>
      )}
    </ScrollView>
  );
});
