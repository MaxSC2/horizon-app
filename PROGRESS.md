# ГОРИЗОНТ — Прогресс разработки

## Проект: `/root/horizon-app/`

---

## ✅ ВЫПОЛНЕНО

### Core
- [x] Expo проект с TypeScript
- [x] Safe area insets (статус-бар + навигация Android)
- [x] AsyncStorage вместо localStorage
- [x] 8 тем оформления с переключением
- [x] Onboarding (4 шага)
- [x] Bottom навигация (6 вкладок)
- [x] Achievement toast уведомления

### Dashboard
- [x] Цитата дня
- [x] Score недели (rings: тренировки, задачи, дневник)
- [x] Серия дней (streak)
- [x] Сегодняшний план тренировки
- [x] Трекер воды (8 стаканов)
- [x] Задачи дня с прогрессом
- [x] Настроение/энергия 7 дней
- [x] Активные цели
- [x] Прогрессия alerts
- [x] **Daily Focus** — главный фокус дня
- [x] **Sleep quick-log** — быстрый ввод сна
- [x] **Achievement count badge**

### Workout
- [x] Список 7 дней плана
- [x] Warmup phase с чекбоксами
- [x] Exercise logging с numpad
- [x] Rest timer (90 сек)
- [x] Finish phase: сложность + боль
- [x] **Numpad +/-1 кнопки**
- [x] **PR badge** при новом рекорде
- [x] **Pain keyword detection** (сустав/колено/плечо)
- [x] **Контекстные метки сложности** (Слишком легко → Очень тяжело)

### Tasks & Goals
- [x] CRUD задач
- [x] Recurring toggle
- [x] Category badges
- [x] **14-day heatmap** выполнения
- [x] CRUD целей с прогрессом
- [x] **Goal templates** (10 готовых)
- [x] **Completed goals section**
- [x] Streak для привычек

### Journal / Body / Pain / Reflection
- [x] Дневник с настроением/энергией/сном
- [x] **Sleep отображение** в карточках
- [x] Body log с формой добавления (вес/грудь/талия/бицепс)
- [x] **Body trend chart** (SVG bars)
- [x] Pain log display
- [x] Reflections CRUD

### AI Mentor (НЕЙРО)
- [x] Чат с AI (Claude, OpenAI, Gemini, Groq, Ollama)
- [x] Quick prompts
- [x] **Markdown рендеринг** (bold, code, lists, headings)
- [x] **Regenerate** последнего ответа
- [x] **Copy** сообщений
- [x] **Clear chat** с подтверждением
- [x] **5 persona presets** (Строгий тренер, Наставник, Учёный, Психолог)
- [x] **Feature cards** на welcome экране
- [x] **Response count** в футере
- [x] **Provider + model** в заголовке
- [x] **CORS error recovery** кнопка

### Stats
- [x] Total workouts + streak
- [x] **Avg difficulty** + **Avg sleep**
- [x] Exercise trend **SVG Line chart** (вместо CSS bars)
- [x] **PR reference line** на графике
- [x] **Trend direction** (Растёт/Снижение)
- [x] Личные рекорды
- [x] Прогрессия alerts
- [x] Достижения (получено/впереди)
- [x] Анатомия мышц (10 мышц с фильтрацией)

### Profile
- [x] Статистика (тренировки, рабочий диапазон, макс)
- [x] **Working range** (60-70% от макс)
- [x] Edit max pushups + notes
- [x] **Asymmetry notes**
- [x] Theme quick-select
- [x] Reset data
- [x] **Улучшенный Theme Picker** (тёмные/светлые, превью карточки)

---

## 🔄 В ПРОЦЕССЕ / ОСТАЛОСЬ

### Charts (SVG)
- [ ] **Radar chart** — Life Balance (5 осей: тренировки, задачи, цели, дневник, серия)
- [ ] **Bar chart** — тренировки за 8 недель
- [ ] **Area chart** — недельный тоннаж
- [ ] **Line chart** — корреляция настроение × тренировки
- [ ] **Area chart** — сон за 30 дней

### Photo Progress
- [ ] Выбор фото из галереи
- [ ] Хранение base64 в AsyncStorage
- [ ] Сетка до 20 фото
- [ ] Delete + "NEW" badge

### Export
- [ ] JSON экспорт всего state
- [ ] CSV экспорт тренировок

### Plan Editor
- [ ] Модалка для кастомного плана тренировок
- [ ] Indicator custom vs standard plan

### Мелкие улучшения
- [ ] Energy emoji в mood row на dashboard
- [ ] Sleep slider с +/- в journal
- [ ] Journal search
- [ ] Goal deadline countdown
- [ ] Goal progress slider
- [ ] Goal history sparkline
- [ ] Mood/Energy/Sleep 14-day chart
- [ ] Body trend chart (line, не bars)
- [ ] AI: show/hide API key toggle
- [ ] AI: typing animation (bouncing dots)

---

## 📊 СТАТИСТИКА

| Метрика | Значение |
|---------|----------|
| Файлов | 7 (App.tsx + 4 utils + config) |
| Строк кода | ~2000+ |
| Экранов | 6 основных + подэкраны |
| Тем | 8 |
| Мышц в анатомии | 10 |
| AI провайдеров | 6 |
| Достижений | 15 |
| Goal templates | 10 |
| **Прогресс от оригинала** | **~75%** |

---

## 🔧 СБОРКА

```bash
cd ~/horizon-app
git add -A && git commit -m "..."
EXPO_TOKEN=9L_q6bXjoip_OQp1SGygGxtlFB8uEVU5gXtXr3pY npx eas build --platform android --profile preview --non-interactive
```

**EAS Build:** https://expo.dev/accounts/nonamesc2/projects/horizon-app/builds
