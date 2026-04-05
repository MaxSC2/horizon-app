import { PLAN, MOODS, ENERGY, SLEEP_LABELS } from "../data/constants";

export const fmt = (d: Date) => d.toISOString().split("T")[0];
export const uid = () => Math.random().toString(36).slice(2, 9);

export function getMonday() {
  const d = new Date(), day = d.getDay();
  const m = new Date(d);
  m.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  m.setHours(0, 0, 0, 0);
  return m;
}

export function weekDates() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(getMonday());
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function todayIdx() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export const TODAY = fmt(new Date());

export function calcStreak(hist: Record<string, any>) {
  let s = 0;
  const t = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(t);
    d.setDate(t.getDate() - i);
    const pi = d.getDay() === 0 ? 6 : d.getDay() - 1;
    if (hist[fmt(d)]?.completed) s++;
    else if (PLAN[pi]?.type === "rest") continue;
    else if (i > 0) break;
  }
  return s;
}

export function taskStreakForId(task: any) {
  let s = 0;
  const t = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(t);
    d.setDate(t.getDate() - i);
    if (task.completedDates?.includes(fmt(d))) s++;
    else if (i > 0) break;
  }
  return s;
}

export function weeklyWorkoutStats(history: Record<string, any>) {
  return Array.from({ length: 8 }, (_, w) => {
    const m = getMonday();
    m.setDate(m.getDate() - (7 - w) * 7);
    let c = 0;
    for (let d = 0; d < 7; d++) {
      const x = new Date(m);
      x.setDate(m.getDate() + d);
      if (history[fmt(x)]?.completed) c++;
    }
    return { week: w === 7 ? "Эта" : `-${7 - w}н`, count: c };
  });
}

export function exerciseTrend(history: Record<string, any>, exId: string) {
  return Object.entries(history)
    .filter(([, l]: [string, any]) =>
      l.exercises?.[exId]?.some((s: any) => (parseInt(s.value) || 0) > 0)
    )
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-12)
    .map(([date, l]: [string, any]) => ({
      date: (date as string).slice(5),
      val: Math.max(0, ...l.exercises[exId].map((s: any) => parseInt(s.value) || 0)),
    }));
}

export function getPRs(history: Record<string, any>) {
  const prs: Record<string, number> = {};
  Object.values(history).forEach((log: any) => {
    if (!log.exercises) return;
    Object.entries(log.exercises).forEach(([id, sets]: [string, any]) => {
      const m = Math.max(0, ...sets.map((s: any) => parseInt(s.value) || 0));
      if (!prs[id] || m > prs[id]) prs[id] = m;
    });
  });
  return prs;
}

export function checkProgression(history: Record<string, any>, exercise: any) {
  const sessions = Object.entries(history)
    .filter(([, l]: [string, any]) =>
      l.exercises?.[exercise.id]?.some((s: any) => (parseInt(s.value) || 0) > 0)
    )
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .slice(0, 3);
  if (sessions.length < 3) return null;
  const allHi = sessions.every(([, l]: [string, any]) =>
    l.exercises[exercise.id].some((s: any) => (parseInt(s.value) || 0) >= exercise.hi)
  );
  if (!allHi) return null;
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    message: exercise.type === "seconds"
      ? `+5-10 сек к «${exercise.name}»`
      : `+1-2 повтора к «${exercise.name}»`,
  };
}

export function getAllProgressionSuggestions(history: Record<string, any>) {
  const seen = new Set<string>();
  const out: any[] = [];
  PLAN.forEach((d) =>
    (d.exercises || []).forEach((ex) => {
      if (seen.has(ex.id)) return;
      seen.add(ex.id);
      const s = checkProgression(history, ex);
      if (s) out.push(s);
    })
  );
  return out;
}

export function weeklyTonnage(history: Record<string, any>) {
  return Array.from({ length: 8 }, (_, w) => {
    const m = getMonday();
    m.setDate(m.getDate() - (7 - w) * 7);
    let tonnage = 0;
    for (let d = 0; d < 7; d++) {
      const x = new Date(m);
      x.setDate(m.getDate() + d);
      const log = history[fmt(x)];
      if (!log?.exercises) continue;
      Object.entries(log.exercises).forEach(([exId, sets]: [string, any]) => {
        const ex = PLAN.flatMap((p) => p.exercises || []).find((e) => e.id === exId);
        if (!ex || ex.type === "seconds") return;
        sets.forEach((s: any) => { tonnage += parseInt(s.value) || 0; });
      });
    }
    return { week: w === 7 ? "Эта" : `-${7 - w}н`, tonnage };
  });
}

export function moodWorkoutCorrelation(history: Record<string, any>, journal: any[]) {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const dd = fmt(d);
    const jEntry = journal.filter((j) => j.date === dd).slice(-1)[0];
    const didWorkout = history[dd]?.completed ? 1 : 0;
    const planI = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const isRest = PLAN[planI]?.type === "rest";
    return {
      date: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      mood: jEntry?.mood || null,
      energy: jEntry?.energy || null,
      sleep: jEntry?.sleep || null,
      workout: isRest ? null : didWorkout,
      isRest,
    };
  }).filter((d) => d.mood || d.workout !== null);
}

export function computeAuto1RM(history: Record<string, any>) {
  let best = 0;
  Object.values(history).forEach((log: any) => {
    const sets = log.exercises?.["pushups"] || [];
    sets.forEach((s: any) => {
      const v = parseInt(s.value) || 0;
      if (v > best) best = v;
    });
  });
  if (best < 5) return null;
  return Math.round(best * (1 + best / 30));
}

export function sleepLabel(h: number) {
  return SLEEP_LABELS.reduce(
    (best, cur) => (h >= cur.h ? cur : best),
    SLEEP_LABELS[0]
  ).label;
}

export function last7MoodData(journal: any[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const dd = fmt(d);
    const entry = journal.filter((j) => j.date === dd).slice(-1)[0];
    return {
      date: d.toLocaleDateString("ru-RU", { weekday: "short" }),
      mood: entry?.mood || null,
      energy: entry?.energy || null,
      day: dd,
    };
  });
}

export function calcLifeScore(history: Record<string, any>, tasks: any[], journal: any[]) {
  const dates = weekDates();
  const wd = dates.filter((_, i) => {
    const p = PLAN[i];
    if (p.type === "rest") return false;
    return history[fmt(dates[i])]?.completed;
  }).length;
  const wt = PLAN.filter((p) => p.type !== "rest").length;
  const rec = tasks.filter((t) => t.recurring);
  let ts = 0;
  if (rec.length > 0) {
    let done = 0;
    dates.forEach((d) => {
      rec.forEach((t) => {
        if (t.completedDates?.includes(fmt(d))) done++;
      });
    });
    ts = Math.round((done / (rec.length * 7)) * 100);
  }
  const ws = wt > 0 ? Math.round((wd / wt) * 100) : 0;
  const js = dates.some((d) => journal.some((j) => j.date === fmt(d))) ? 100 : 0;
  const arr = [ws, rec.length > 0 ? ts : null, js].filter((x) => x !== null) as number[];
  return {
    workout: ws,
    tasks: rec.length > 0 ? ts : null,
    journal: js,
    total: arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0,
  };
}

export function checkAchievements(state: any, newHistory?: Record<string, any>) {
  const earned = new Set(state.achievements || []);
  const hist = newHistory || state.history;
  const totalW = Object.values(hist).filter((l: any) => l.completed).length;
  const streak = calcStreak(hist);
  const prs = getPRs(hist);
  if (totalW >= 1) earned.add("first_workout");
  if (totalW >= 10) earned.add("workouts_10");
  if (totalW >= 50) earned.add("workouts_50");
  if (streak >= 7) earned.add("streak_7");
  if (streak >= 30) earned.add("streak_30");
  if (streak >= 100) earned.add("streak_100");
  if (Object.keys(prs).length > 0) earned.add("first_pr");
  if ((prs["pushups"] || 0) >= 30) earned.add("pushups_30");
  if ((state.journal || []).length >= 1) earned.add("first_journal");
  if ((state.journal || []).length >= 7) earned.add("journal_7");
  if ((state.goals || []).length >= 1) earned.add("first_goal");
  if ((state.goals || []).some((g: any) => g.completed)) earned.add("goal_done");
  if ((state.reflections || []).length >= 1) earned.add("reflection_done");
  if ((state.aiHistory || []).length >= 1) earned.add("ai_coach");
  const waterDays = new Set((state.journal || []).filter((j: any) => j.waterDone).map((j: any) => j.date));
  if (waterDays.size >= 7) earned.add("water_7");
  return [...earned];
}

export function buildAIContext(state: any) {
  const totalW = Object.values(state.history || {}).filter((l: any) => l.completed).length;
  const streak = calcStreak(state.history || {});
  const prs = getPRs(state.history || {});
  const recentWorkouts = Object.entries(state.history || {})
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .slice(0, 5)
    .map(([date, l]: [string, any]) =>
      `${date}: ${PLAN.find((p) => p.id === l.dayId)?.name || "Тренировка"}, сложность ${l.difficulty}/10${l.painNotes ? `, боль: ${l.painNotes}` : ""}`
    ).join("\n");
  const activeGoals = (state.goals || [])
    .filter((g: any) => !g.completed)
    .map((g: any) => `"${g.title}": ${g.currentValue}/${g.targetValue} ${g.unit}`)
    .join(", ");
  const recentMoods = (state.journal || [])
    .slice(0, 7)
    .map((j: any) => `${j.date}: настроение ${j.mood}/5, энергия ${j.energy || "?"}/5`)
    .join("\n");
  const taskCount = (state.tasks || []).length;
  const habitsDoneToday = (state.tasks || [])
    .filter((t: any) => t.recurring && t.completedDates?.includes(TODAY))
    .length;
  const suggestions = getAllProgressionSuggestions(state.history || {})
    .map((s: any) => s.message)
    .join("; ");

  return `Ты — AI-коуч приложения "Горизонт". Ты знаешь данные пользователя и даёшь конкретные, личные советы. Отвечай по-русски, кратко и по делу. Используй эмодзи умеренно.

ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
- Тренировок всего: ${totalW}
- Текущая серия: ${streak} дней
- Максимум отжиманий: ${state.user?.maxPushups || 27}
- Активные цели: ${activeGoals || "нет"}
- Задач/привычек: ${taskCount}, выполнено сегодня: ${habitsDoneToday}
- Личные рекорды: ${Object.entries(prs).slice(0, 5).map(([id, v]) => `${id}: ${v}`).join(", ") || "пока нет"}

ПОСЛЕДНИЕ 5 ТРЕНИРОВОК:
${recentWorkouts || "нет данных"}

НАСТРОЕНИЕ И ЭНЕРГИЯ (последние записи):
${recentMoods || "нет данных"}

СОВЕТЫ ПО ПРОГРЕССИИ (автоматически): ${suggestions || "нет"}

Ты можешь: анализировать тренировки, давать советы по восстановлению, объяснять упражнения, мотивировать, помогать с целями и планированием. Если пользователь спрашивает о конкретном упражнении — объясняй технику. При отсутствии данных — задавай уточняющие вопросы.`;
}
