export const PLAN = [
  { id:1, name:"Верх + кор", type:"upper", emoji:"💪", day:"ПН",
    exercises:[
      {id:"pushups",       name:"Отжимания",           type:"reps",    sets:4, reps:"15-20", hi:20, notes:"Темп 2-1-1"},
      {id:"slow_pushups",  name:"Медленные отжимания", type:"reps",    sets:3, reps:"6-10",  hi:10, notes:"3-4 сек вниз"},
      {id:"door_row",      name:"Тяга в проёме",       type:"reps",    sets:3, reps:"12-15", hi:15, notes:"Контроль лопаток"},
      {id:"plank",         name:"Планка",              type:"seconds", sets:3, reps:"30-45", hi:45},
      {id:"hollow",        name:"Hollow hold",         type:"seconds", sets:3, reps:"20-30", hi:30},
    ], warmup:["Круги плечами","Круги руками","Вращения кистей","Перенос веса на кисти","Кошка-корова","Скручивания груди"],
    stretch:["Грудь в проёме","Плечи","Широчайшие","Запястья"]},
  { id:2, name:"Ноги", type:"lower", emoji:"🦵", day:"ВТ",
    exercises:[
      {id:"squats",        name:"Приседания",          type:"reps",    sets:4, reps:"15-25", hi:25, notes:"Колено над стопой"},
      {id:"lunges",        name:"Выпады назад",        type:"reps",    sets:3, reps:"8-12",  hi:12, notes:"Без завала внутрь"},
      {id:"glute_bridge",  name:"Ягодичный мост",      type:"reps",    sets:3, reps:"15-20", hi:20, notes:"Пауза 2 сек"},
      {id:"calf_raise",    name:"Подъёмы на носки",    type:"reps",    sets:4, reps:"20-30", hi:30},
      {id:"side_plank",    name:"Боковая планка",      type:"seconds", sets:2, reps:"20-30", hi:30},
    ], warmup:["Круги бёдрами","Вращения коленей","Махи ногами","Кошка-корова"],
    stretch:["Сгибатель бедра","Квадрицепс","Ягодицы","Задняя поверхность","Икры"]},
  { id:3, name:"Лёгкий день", type:"light", emoji:"☀️", day:"СР",
    exercises:[
      {id:"min_pushups", name:"Отжимания",  type:"reps",    sets:1, reps:"10", hi:10},
      {id:"min_squats",  name:"Приседания", type:"reps",    sets:1, reps:"10", hi:10},
      {id:"min_plank",   name:"Планка",     type:"seconds", sets:1, reps:"20", hi:20},
    ], warmup:[], stretch:["Растяжка груди","Кошка-корова 2 мин","Вращения плечи/кисти"]},
  { id:4, name:"Верх (сила)", type:"upper", emoji:"🔥", day:"ЧТ",
    exercises:[
      {id:"pause_pushups", name:"Отжимания с паузой",  type:"reps",    sets:4, reps:"8-12",  hi:12, notes:"Пауза 2 сек"},
      {id:"narrow_pushups",name:"Узкие отжимания",     type:"reps",    sets:3, reps:"10-15", hi:15},
      {id:"pike",          name:"Pike push-ups",       type:"reps",    sets:3, reps:"6-10",  hi:10},
      {id:"iso_row",       name:"Изометрическая тяга", type:"seconds", sets:3, reps:"15-20", hi:20},
      {id:"pushup_hold",   name:"Удержание внизу",     type:"seconds", sets:3, reps:"10-20", hi:20},
    ], warmup:["Круги плечами","Круги руками","Вращения кистей","Кошка-корова"],
    stretch:["Грудь в проёме","Плечи","Широчайшие","Запястья"]},
  { id:5, name:"Ноги (акцент)", type:"lower", emoji:"🦵", day:"ПТ",
    exercises:[
      {id:"bulgarian",    name:"Болгарские приседы",  type:"reps",    sets:3, reps:"8-10",  hi:10, notes:"Начинать со слабой!"},
      {id:"squats",       name:"Приседания",          type:"reps",    sets:3, reps:"15-20", hi:20},
      {id:"single_glute", name:"Ягод. мост ×1 нога", type:"reps",    sets:3, reps:"10-12", hi:12},
      {id:"wall_sit",     name:"Статический присед",  type:"seconds", sets:3, reps:"20-40", hi:40},
      {id:"hollow",       name:"Hollow hold",         type:"seconds", sets:3, reps:"20-30", hi:30},
    ], warmup:["Круги бёдрами","Вращения коленей","Махи ногами","Кошка-корова"],
    stretch:["Сгибатель бедра","Квадрицепс","Ягодицы","Задняя поверхность","Икры"]},
  { id:6, name:"Смешанный", type:"mixed", emoji:"🔄", day:"СБ", circuit:true,
    exercises:[
      {id:"circ_push",   name:"Отжимания",    type:"reps",    sets:3, reps:"10-15", hi:15},
      {id:"circ_squat",  name:"Приседания",   type:"reps",    sets:3, reps:"15-20", hi:20},
      {id:"circ_row",    name:"Тяга в проёме",type:"reps",    sets:3, reps:"12-15", hi:15},
      {id:"circ_plank",  name:"Планка",       type:"seconds", sets:3, reps:"20-30", hi:30},
      {id:"circ_lunges", name:"Выпады",       type:"reps",    sets:3, reps:"6-8",   hi:8},
    ], warmup:["Полная разминка 5-8 мин"], stretch:["Полная растяжка 5-10 мин"]},
  { id:7, name:"Отдых", type:"rest", emoji:"😴", day:"ВС",
    exercises:[], warmup:[], stretch:["Лёгкая прогулка","Мобилизация суставов","Дыхание"]},
];

export const QUOTES = [
  {text:"Дисциплина — это мост между целями и достижениями.", author:"Джим Рон"},
  {text:"Каждый день немного. Каждый год — много.", author:"Горизонт"},
  {text:"Не ищи мотивацию. Строй систему.", author:"Горизонт"},
  {text:"Тело — инструмент. Разум — дирижёр.", author:"Горизонт"},
  {text:"Прогресс, а не совершенство.", author:"Горизонт"},
  {text:"Сильное тело строит сильный разум.", author:"Горизонт"},
  {text:"Маленькие победы каждый день — большая победа через год.", author:"Горизонт"},
  {text:"Твой горизонт приближается с каждым шагом.", author:"Горизонт"},
  {text:"Усталость — временна. Результат — навсегда.", author:"Горизонт"},
  {text:"Один подход лучше нуля.", author:"Горизонт"},
  {text:"Регулярность важнее интенсивности.", author:"Горизонт"},
  {text:"Лучшее вложение — в себя.", author:"Бенджамин Франклин"},
];

export const ACHIEVEMENT_DEFS = [
  {id:"first_workout",   emoji:"🌟", title:"Первый шаг",        desc:"Выполни первую тренировку"},
  {id:"streak_7",        emoji:"🔥", title:"Огненная неделя",   desc:"Серия 7 дней подряд"},
  {id:"streak_30",       emoji:"⚡", title:"Месяц силы",        desc:"Серия 30 дней подряд"},
  {id:"streak_100",      emoji:"💎", title:"100 дней",          desc:"Серия 100 дней подряд"},
  {id:"workouts_10",     emoji:"💪", title:"10 тренировок",     desc:"Завершить 10 тренировок"},
  {id:"workouts_50",     emoji:"🏅", title:"50 тренировок",     desc:"Завершить 50 тренировок"},
  {id:"first_pr",        emoji:"🏆", title:"Рекордсмен",        desc:"Поставить личный рекорд"},
  {id:"pushups_30",      emoji:"🦾", title:"Мастер отжиманий",  desc:"30 отжиманий в одном подходе"},
  {id:"first_journal",   emoji:"📓", title:"Летописец",         desc:"Сделать первую запись"},
  {id:"journal_7",       emoji:"✍️", title:"Неделя рефлексии",  desc:"7 записей в дневнике"},
  {id:"first_goal",      emoji:"🎯", title:"Целеустремлённый",  desc:"Создать первую цель"},
  {id:"goal_done",       emoji:"🏁", title:"Достиг горизонта",  desc:"Выполнить первую цель"},
  {id:"water_7",         emoji:"💧", title:"Гидратация",        desc:"7 дней выполнять норму воды"},
  {id:"reflection_done", emoji:"🧘", title:"Рефлексия",         desc:"Заполнить еженедельный чек-ин"},
  {id:"ai_coach",        emoji:"🤖", title:"Ученик ИИ",         desc:"Поговорить с AI-коучем"},
];

export const GOAL_TEMPLATES = [
  {emoji:"🏃",title:"Пробежать 5 км",       cat:"body",    target:5,   unit:"км",    desc:"Постепенно увеличивай дистанцию"},
  {emoji:"📚",title:"Прочитать 12 книг",     cat:"mind",    target:12,  unit:"книг",  desc:"По книге в месяц"},
  {emoji:"💪",title:"50 отжиманий подряд",   cat:"body",    target:50,  unit:"повт",  desc:"Твой горизонт в отжиманиях"},
  {emoji:"🧘",title:"Медитация 30 дней",     cat:"mind",    target:30,  unit:"дней",  desc:"По 10 минут каждое утро"},
  {emoji:"💧",title:"2 литра воды 30 дней",  cat:"body",    target:30,  unit:"дней",  desc:"Выработай привычку"},
  {emoji:"✍️",title:"Вести дневник месяц",   cat:"mind",    target:30,  unit:"дней",  desc:"Рефлексия каждый день"},
  {emoji:"⚡",title:"Выучить новый навык",   cat:"skill",   target:100, unit:"%",     desc:"Опиши навык в деталях"},
  {emoji:"🚀",title:"Запустить проект",      cat:"project", target:100, unit:"%",     desc:"Разбей на этапы"},
  {emoji:"🧠",title:"Задача каждый день",    cat:"mind",    target:30,  unit:"дней",  desc:"Логика, математика или код"},
  {emoji:"🌿",title:"Без сахара 30 дней",    cat:"body",    target:30,  unit:"дней",  desc:"Без добавленного сахара"},
];

export const MUSCLES = [
  {
    id:"chest", name:"Грудные мышцы", emoji:"🫁", zone:"upper", color:"#00C4F0",
    exercises:["pushups","slow_pushups","pause_pushups","narrow_pushups","circ_push"],
    desc:"Большая грудная мышца — основной двигатель горизонтального толкания. При отжиманиях берёт на себя 50–60% нагрузки.",
    anatomy:"Две головки: ключичная и грудинно-рёберная. Крепится к плечевой кости.",
    tips:["Локти 45° от тела","Полная амплитуда","Медленный спуск (3 сек)","Своди грудь в верхней точке"],
    mistakes:["Завал локтей к бокам","Неполная амплитуда","Задержка дыхания"],
    recovery:"48-72 ч",
    nextLevel:"Отжимания с паузой → Отжимания на кольцах → На одной руке",
  },
  {
    id:"triceps", name:"Трицепс", emoji:"🦾", zone:"upper", color:"#A78BFA",
    exercises:["narrow_pushups","pike","pushup_hold","circ_push","pause_pushups"],
    desc:"Трёхглавая мышца плеча — разгибатель локтя. Составляет 2/3 объёма плеча.",
    anatomy:"Три головки: длинная (от лопатки), латеральная и медиальная.",
    tips:["Узкие отжимания: руки под плечами","Удержание внизу — изометрия","В верхней точке — полное разгибание"],
    mistakes:["Слишком узкая постановка рук","Не дожимать до конца","Разведение локтей"],
    recovery:"48 ч",
    nextLevel:"Узкие → Алмазные → Обратные отжимания",
  },
  {
    id:"shoulders", name:"Дельтовидные", emoji:"🔝", zone:"upper", color:"#FFD600",
    exercises:["pike","iso_row","door_row"],
    desc:"Три пучка дельтовидной мышцы. Pike push-ups — лучшее домашнее упражнение.",
    anatomy:"Передний, средний и задний пучки.",
    tips:["Pike: вдавливай пол руками","Задний пучок — тяга критична","Не поднимай плечи к ушам"],
    mistakes:["Игнорирование заднего пучка","Перегрузка при слабой ротаторной манжете"],
    recovery:"48 ч",
    nextLevel:"Pike → Pike на возвышении → Стойка на руках у стены",
  },
  {
    id:"back", name:"Спина / Широчайшие", emoji:"🔙", zone:"upper", color:"#00E676",
    exercises:["door_row","iso_row","circ_row"],
    desc:"Широчайшая — самая крупная мышца верха тела. Тяга в проёме — лучший домашний способ.",
    anatomy:"Крепится от T7-L5 к плечевой кости.",
    tips:["Лопатки сводятся","Локти вдоль тела","Медленное возвращение (3 сек)"],
    mistakes:["Тяга бицепсом, а не спиной","Не сводить лопатки"],
    recovery:"48-72 ч",
    nextLevel:"Тяга в проёме → Австралийские подтягивания → Подтягивания",
  },
  {
    id:"biceps", name:"Бицепс", emoji:"💪", zone:"upper", color:"#FF7043",
    exercises:["door_row","iso_row","circ_row"],
    desc:"Двуглавая мышца — синергист в тяговых упражнениях.",
    anatomy:"Длинная и короткая головки, обе от лопатки.",
    tips:["Ладони вверх в тяге","Изометрия 15 сек","Следи за асимметрией"],
    mistakes:["Ожидать большого роста без турника","Игнорировать изометрию"],
    recovery:"48 ч",
    nextLevel:"Изометрия → Австралийские → Подтягивания обратным хватом",
  },
  {
    id:"core", name:"Кор и пресс", emoji:"⚡", zone:"core", color:"#FF9800",
    exercises:["plank","hollow","side_plank","min_plank","circ_plank"],
    desc:"Весь стабилизирующий цилиндр. Hollow hold — лучшее для функционального кора.",
    anatomy:"Прямая, поперечная, косые мышцы живота + разгибатели спины.",
    tips:["Планка: прямая линия","Hollow: поясница прижата","Дышать ровно"],
    mistakes:["Таз вверх или вниз в планке","Hollow с поясницей на весу"],
    recovery:"24-48 ч",
    nextLevel:"Планка → Dragon flag → Hollow rock → L-sit",
  },
  {
    id:"glutes", name:"Ягодичные", emoji:"🍑", zone:"lower", color:"#FF4455",
    exercises:["glute_bridge","single_glute","lunges","bulgarian","squats","circ_squat","circ_lunges"],
    desc:"Самая сильная мышца тела. Слабые ягодицы = боль в пояснице и коленях.",
    anatomy:"Большая, средняя и малая. Крепится к крестцу и бедренной кости.",
    tips:["Пауза 2 сек вверху моста","Болгарские: бедро параллельно полу","Думай про пятки"],
    mistakes:["Не дотягивать бедро","Завал колена внутрь"],
    recovery:"48-72 ч",
    nextLevel:"Мост → На одной ноге → Болгарские → Пистолет",
  },
  {
    id:"quads", name:"Квадрицепс", emoji:"🦵", zone:"lower", color:"#E040FB",
    exercises:["squats","lunges","bulgarian","wall_sit","min_squats","circ_squat","circ_lunges"],
    desc:"Главный разгибатель колена. Приседание — королева упражнений.",
    anatomy:"Четыре головки: прямая, медиальная, латеральная, промежуточная.",
    tips:["Колено над носком","Бёдра параллельно полу","Медленный присед (4 сек)"],
    mistakes:["Неполная глубина","Вынос коленей за носки","Круглая спина"],
    recovery:"48-72 ч",
    nextLevel:"Приседания → Болгарские → Пистолет → Прыжковые",
  },
  {
    id:"hamstrings", name:"Бицепс бедра", emoji:"🔄", zone:"lower", color:"#00BCD4",
    exercises:["lunges","bulgarian","glute_bridge","single_glute","circ_lunges"],
    desc:"Часто слабее квадрицепса, что ведёт к травмам.",
    anatomy:"Три мышцы: двуглавая, полусухожильная, полуперепончатая.",
    tips:["Выпады назад активируют сильнее","Давить пятками в пол","Растяжка обязательна"],
    mistakes:["Не растягивать после тренировки","Игнорировать асимметрию"],
    recovery:"48-72 ч + растяжка",
    nextLevel:"Выпады → Болгарские → Румынская на одной ноге",
  },
  {
    id:"calves", name:"Икры", emoji:"🦶", zone:"lower", color:"#4CAF50",
    exercises:["calf_raise"],
    desc:"Требуют большого объёма (20-30 повт) и полной амплитуды.",
    anatomy:"Икроножная и камбаловидная. Крепятся через ахиллово сухожилие.",
    tips:["Полная амплитуда","Медленное опускание 3 сек","Высокое число повторов"],
    mistakes:["Неполная амплитуда","Слишком мало повторений"],
    recovery:"24-48 ч",
    nextLevel:"Двусторонние → Односторонние → На ступеньке",
  },
];

export const ONBOARD_STEPS = [
  {
    icon:"🌅", title:"Добро пожаловать\nв ГОРИЗОНТ",
    desc:"Система роста тела и разума. Тренировки, цели, дневник и AI-ментор.",
    accent:"primary", action:"Начать",
  },
  {
    icon:"💪", title:"Твой план\nтренировок",
    desc:"7-дневный план с отжиманиями, приседаниями и кором.",
    accent:"success", action:"Дальше",
    input:{label:"Сколько отжиманий за раз?", key:"maxPushups", type:"numeric", placeholder:"Например: 15"},
  },
  {
    icon:"📊", title:"Мониторинг\nвсего важного",
    desc:"Сон, настроение, энергия, вес и замеры.",
    accent:"warn", action:"Дальше",
  },
  {
    icon:"🤖", title:"НЕЙРО —\nтвой AI-ментор",
    desc:"Анализирует данные и даёт персональные советы.",
    accent:"primary", action:"Начать путь",
  },
];

export const AI_PROVIDERS = [
  {id:"claude",  name:"Claude",       short:"Claude",   color:"#CC785C",
    models:["claude-sonnet-4-20250514","claude-haiku-4-5-20251001","claude-opus-4-5","claude-3.5-sonnet","claude-3.5-haiku"],
    defaultModel:"claude-sonnet-4-20250514", needsKey:false, free:true, desc:"Встроен, ключ не нужен", hint:"", badge:"Встроен"},
  {id:"openai",  name:"OpenAI",       short:"GPT",      color:"#10A37F",
    models:["gpt-4o","gpt-4o-mini","gpt-4-turbo","gpt-3.5-turbo","o1","o3-mini"], defaultModel:"gpt-4o",
    needsKey:true, free:false, desc:"GPT-4o — мощная модель", hint:"platform.openai.com → API keys", keyPrefix:"sk-"},
  {id:"gemini",  name:"Google Gemini", short:"Gemini",   color:"#4285F4",
    models:["gemini-2.0-flash","gemini-1.5-pro","gemini-1.5-flash","gemini-2.0-flash-lite","gemini-2.5-pro"], defaultModel:"gemini-2.0-flash",
    needsKey:true, free:true, desc:"Бесплатный tier", hint:"aistudio.google.com → Get API key", badge:"Бесплатный", keyPrefix:"AIza"},
  {id:"groq",    name:"Groq",         short:"Groq",     color:"#F55036",
    models:["llama-3.3-70b-versatile","llama-3.1-8b-instant","mixtral-8x7b-32768","llama-3.2-90b","deepseek-r1-distill-llama-70b"], defaultModel:"llama-3.3-70b-versatile",
    needsKey:true, free:true, desc:"Llama 3.3 70B — быстро", hint:"console.groq.com → API Keys", badge:"Бесплатный", keyPrefix:"gsk_"},
  {id:"ollama",  name:"Ollama",       short:"Ollama",   color:"#7C3AED",
    models:["llama3.2","mistral","phi4","qwen2.5","deepseek-r1","llama3.3","gemma2"], defaultModel:"llama3.2",
    needsKey:false, free:true, local:true, desc:"Локальные модели", hint:"localhost:11434", badge:"Локально",
    defaultEndpoint:"http://localhost:11434/v1/chat/completions"},
  {id:"custom",  name:"Свой API",     short:"Custom",   color:"#8B5CF6",
    models:[], defaultModel:"", needsKey:true, free:false, desc:"Любой OpenAI-совместимый", hint:"Authorization: Bearer …"},
];

export const QUICK_PROMPTS = [
  {icon:"📈",text:"Проанализируй мои тренировки"},
  {icon:"⚡",text:"Как мне прогрессировать?"},
  {icon:"❤️",text:"Советы по восстановлению"},
  {icon:"📅",text:"Составь план на неделю"},
  {icon:"🔁",text:"Объясни технику отжиманий"},
  {icon:"🧠",text:"Советы по продуктивности"},
  {icon:"🎯",text:"Помоги с моими целями"},
  {icon:"⚖️",text:"Питание и вес"},
];

export const PLAN_PROMPT = `Составь персональный план тренировок на следующую неделю. Формат: день — название — упражнения с подходами. Добавь советы по восстановлению.`;

export const TASK_CATS = [
  {id:"body",  label:"Тело",     emoji:"💪", color:"#00C4F0"},
  {id:"mind",  label:"Разум",    emoji:"🧠", color:"#A78BFA"},
  {id:"habit", label:"Привычка", emoji:"🔁", color:"#00E676"},
  {id:"study", label:"Учёба",    emoji:"📚", color:"#FFD600"},
  {id:"other", label:"Другое",   emoji:"✦",  color:"#FF9800"},
];

export const GOAL_CATS = [
  {id:"body",label:"Тело",emoji:"💪"},
  {id:"mind",label:"Разум",emoji:"🧠"},
  {id:"skill",label:"Навык",emoji:"⚡"},
  {id:"project",label:"Проект",emoji:"🚀"},
  {id:"life",label:"Жизнь",emoji:"🌱"},
];

export const PAIN_ZONES = [
  {id:"shoulder", name:"Плечо",    emoji:"💪", color:"#FF6B6B"},
  {id:"elbow",    name:"Локоть",   emoji:"🦾", color:"#FF9500"},
  {id:"wrist",    name:"Запястье", emoji:"✋", color:"#FFD600"},
  {id:"knee",     name:"Колено",   emoji:"🦵", color:"#FF6B6B"},
  {id:"lower_back",name:"Поясница",emoji:"🔙", color:"#FF4455"},
  {id:"neck",     name:"Шея",      emoji:"🧘", color:"#A78BFA"},
  {id:"hip",      name:"Бедро",    emoji:"🍑", color:"#FF9500"},
  {id:"other",    name:"Другое",   emoji:"⚡", color:"#8B5CF6"},
];

export const PAIN_INTENSITY = [
  {v:1,l:"Слабая",c:"#4ADE80"},
  {v:2,l:"Умеренная",c:"#FFD600"},
  {v:3,l:"Сильная",c:"#FF9500"},
  {v:4,l:"Острая",c:"#FF4455"},
];

export const MOODS = [
  {v:1,e:"😢",l:"Тяжело"},
  {v:2,e:"😕",l:"Плохо"},
  {v:3,e:"😐",l:"Нейтр."},
  {v:4,e:"🙂",l:"Хорошо"},
  {v:5,e:"😊",l:"Отлично"},
];

export const ENERGY = [
  {v:1,e:"🪫",l:"Разряжен"},
  {v:2,e:"😴",l:"Слабо"},
  {v:3,e:"⚡",l:"Норм"},
  {v:4,e:"🔋",l:"Энергично"},
  {v:5,e:"🚀",l:"Мощь"},
];

export const SLEEP_LABELS = [
  {h:0,label:"Не сплю"},
  {h:4,label:"4ч — мало"},
  {h:5,label:"5ч — мало"},
  {h:6,label:"6ч — норм"},
  {h:7,label:"7ч — хорошо"},
  {h:8,label:"8ч — отлично"},
  {h:9,label:"9ч+ — много"},
];

export const STYLE_LIST = [
  { 
    id: "standard", name: "Стандарт", icon: "◻", 
    desc: "Чистый и простой интерфейс",
    radius: 14, shadow: 10, borderWidth: 1, headerBold: false, 
    accent: "line", showGlow: false 
  },
  { 
    id: "rpg", name: "RPG Game", icon: "⚔", 
    desc: "Игровой интерфейс с XP и уровнями",
    radius: 8, shadow: 12, borderWidth: 2, headerBold: true, 
    accent: "bar", showGlow: true, glowColor: "#00C4F0", showXP: true 
  },
  { 
    id: "kawaii", name: "Kawaii", icon: "🐱", 
    desc: "Милый, мягкие формы и пастель",
    radius: 24, shadow: 6, borderWidth: 2, headerBold: false, 
    accent: "soft", showGlow: true, glowColor: "#FF69B4", bouncy: true 
  },
  { 
    id: "minimal", name: "Zen", icon: "☯", 
    desc: "Спокойный, природный минимализм",
    radius: 8, shadow: 0, borderWidth: 1, headerBold: false, 
    accent: "zen", showGlow: false, thin: true 
  },
  { 
    id: "glass", name: "Glass", icon: "◈", 
    desc: "Матовое стекло, полупрозрачность",
    radius: 20, shadow: 8, borderWidth: 1, headerBold: false, 
    accent: "glow", showGlow: true, glowColor: "#00C4F0", opacity: 0.75 
  },
  { 
    id: "cyber", name: "Cyber", icon: "⬡", 
    desc: "Футуристичный, неон и глитч",
    radius: 4, shadow: 15, borderWidth: 2, headerBold: true, 
    accent: "neon", showGlow: true, glowColor: "#00FFCC" 
  },
  { 
    id: "retro", name: "Retro", icon: "■", 
    desc: "Пиксельный, 8-bit ностальгия",
    radius: 0, shadow: 0, borderWidth: 3, headerBold: true, 
    accent: "pixel", showGlow: false 
  },
  { 
    id: "steampunk", name: "Steampunk", icon: "⚙", 
    desc: "Викторианская механика, латунь",
    radius: 6, shadow: 10, borderWidth: 2, headerBold: true, 
    accent: "brass", showGlow: true, glowColor: "#CD7F32" 
  },
];

export const THEME_LIST = [
  {id:"cosmos", name:"Космос", desc:"Глубокий тёмно-синий", icon:"🌌", dark:true,
    bg:"#07090D", surf:"#0D1520", card:"#111D2C", bord:"#1A2E42",
    txt:"#DDE6EE", muted:"#3D5A72", lo:"#0F1C2C",
    primary:"#00C4F0", success:"#00E676", warn:"#FFD600", danger:"#FF4455"},
  {id:"aurora", name:"Аврора", desc:"Тёмный с пурпуром", icon:"🌠", dark:true,
    bg:"#06030F", surf:"#100820", card:"#160B2E", bord:"#2A1250",
    txt:"#EAD9FF", muted:"#6B3FA0", lo:"#120A26",
    primary:"#C77DFF", success:"#56CFE1", warn:"#FFD166", danger:"#FF4D6D"},
  {id:"neon", name:"Неон", desc:"Киберпанк", icon:"⚡", dark:true,
    bg:"#040408", surf:"#08080F", card:"#0C0C18", bord:"#1A1A35",
    txt:"#E0FFFF", muted:"#3D5060", lo:"#0A0A16",
    primary:"#00FFCC", success:"#39FF14", warn:"#FFE600", danger:"#FF003C"},
  {id:"forest", name:"Лес", desc:"Тёмно-зелёный", icon:"🌿", dark:true,
    bg:"#060D08", surf:"#0A1A0D", card:"#0F2214", bord:"#1A3D22",
    txt:"#D4EDD9", muted:"#3D6B48", lo:"#0C1C10",
    primary:"#4ADE80", success:"#86EFAC", warn:"#FDE047", danger:"#FF6B6B"},
  {id:"sunset", name:"Закат", desc:"Тёплые оттенки", icon:"🌅", dark:true,
    bg:"#0D0805", surf:"#1A100A", card:"#211510", bord:"#3D2518",
    txt:"#F0DDD0", muted:"#7A4A35", lo:"#1C1008",
    primary:"#FB923C", success:"#4ADE80", warn:"#FACC15", danger:"#F43F5E"},
  {id:"steel", name:"Сталь", desc:"Нейтральный серый", icon:"🔩", dark:true,
    bg:"#0C0E12", surf:"#141820", card:"#1C2130", bord:"#2A3245",
    txt:"#C8D4E8", muted:"#4A5A70", lo:"#151A24",
    primary:"#7EB8FF", success:"#4DD8A0", warn:"#F5C842", danger:"#FF6060"},
  {id:"arctic", name:"Арктика", desc:"Чистый светлый", icon:"❄️", dark:false,
    bg:"#F0F7FF", surf:"#FFFFFF", card:"#FFFFFF", bord:"#D0E4F5",
    txt:"#0F2740", muted:"#6B99BF", lo:"#E8F4FF",
    primary:"#0284C7", success:"#059669", warn:"#D97706", danger:"#DC2626"},
  {id:"sand", name:"Песок", desc:"Тёплый бежевый", icon:"🏜️", dark:false,
    bg:"#FAF5EB", surf:"#FFFFFF", card:"#FFFFFF", bord:"#E2D5BE",
    txt:"#3D2B0E", muted:"#9B7F56", lo:"#F5EDD8",
    primary:"#B45309", success:"#16A34A", warn:"#CA8A04", danger:"#DC2626"},
];

export const FOOD_PRESETS = [
  { name: "Куриная грудь 100г", cal: 165, p: 31, c: 0, f: 3.6 },
  { name: "Овсянка 100г", cal: 389, p: 17, c: 66, f: 7 },
  { name: "Яйцо 1шт", cal: 78, p: 6, c: 0.6, f: 5 },
  { name: "Творог 200г", cal: 180, p: 34, c: 6, f: 1 },
  { name: "Рис варёный 150г", cal: 195, p: 4, c: 45, f: 0.5 },
  { name: "Банан 1шт", cal: 105, p: 1.3, c: 27, f: 0.3 },
  { name: "Гречка 150г", cal: 196, p: 7, c: 40, f: 2 },
  { name: "Протеин 1 скуп", cal: 120, p: 24, c: 3, f: 1 },
  { name: "Молоко 200мл", cal: 102, p: 5.4, c: 9.4, f: 4.8 },
  { name: "Хлеб 1 ломтик", cal: 65, p: 2.5, c: 12, f: 0.6 },
];

export const MACRO_GOALS = { calories: 2200, protein: 150, carbs: 220, fat: 70 };

export const DEFAULTS = {
  history: {}, tasks: [], goals: [], journal: [],
  bodyLog: [], reflections: [], achievements: [],
  aiHistory: [], painLog: [], photos: [],
  focus: { text: "", date: "" },
  customPlan: null, onboarded: false,
  user: { maxPushups: 27, note: "", height: "", hips: "" },
  themeId: "cosmos", dark: true, styleThemeId: "standard",
  aiConfig: { provider: "claude", apiKey: "", model: "", endpoint: "", name: "", systemExtra: "" },
  nutrition: {},
};
