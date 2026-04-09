import { useCallback } from "react";
import { Icons } from "./StyledIcons";
import { ReactElement } from "react";

type IconType = "rest" | "water" | "food" | "workout" | "task" | "ai" | "stats" | "sunrise" | "leaf" | "book";

const STYLE_ICON_MAP: Record<string, Record<IconType, (color: string) => ReactElement>> = {
  standard: {
    rest: Icons.rest,
    water: Icons.water,
    food: Icons.food,
    workout: Icons.workout,
    task: Icons.task,
    ai: Icons.ai,
    stats: Icons.stats,
    sunrise: Icons.sunrise,
    leaf: Icons.leaf,
    book: Icons.book,
  },
  rpg: {
    rest: Icons.restRPG,
    water: Icons.waterRPG,
    food: Icons.foodRPG,
    workout: Icons.workoutRPG,
    task: Icons.taskRPG,
    ai: Icons.ai,
    stats: Icons.stats,
    sunrise: Icons.sunrise,
    leaf: Icons.leaf,
    book: Icons.book,
  },
  kawaii: {
    rest: Icons.restKawaii,
    water: Icons.waterKawaii,
    food: Icons.foodKawaii,
    workout: Icons.workoutKawaii,
    task: Icons.taskKawaii,
    ai: Icons.ai,
    stats: Icons.stats,
    sunrise: Icons.sunrise,
    leaf: Icons.leaf,
    book: Icons.book,
  },
  minimal: {
    rest: Icons.restZen,
    water: Icons.waterZen,
    food: Icons.foodZen,
    workout: Icons.workoutZen,
    task: Icons.taskZen,
    ai: Icons.ai,
    stats: Icons.stats,
    sunrise: Icons.sunrise,
    leaf: Icons.leaf,
    book: Icons.book,
  },
  glass: {
    rest: Icons.restGlass,
    water: Icons.waterGlass,
    food: Icons.foodGlass,
    workout: Icons.workoutGlass,
    task: Icons.taskGlass,
    ai: Icons.ai,
    stats: Icons.stats,
    sunrise: Icons.sunrise,
    leaf: Icons.leaf,
    book: Icons.book,
  },
  cyber: {
    rest: Icons.restCyber,
    water: Icons.waterCyber,
    food: Icons.foodCyber,
    workout: Icons.workoutCyber,
    task: Icons.taskCyber,
    ai: Icons.ai,
    stats: Icons.stats,
    sunrise: Icons.sunrise,
    leaf: Icons.leaf,
    book: Icons.book,
  },
  retro: {
    rest: Icons.restRetro,
    water: Icons.waterRetro,
    food: Icons.foodRetro,
    workout: Icons.workoutRetro,
    task: Icons.taskRetro,
    ai: Icons.ai,
    stats: Icons.stats,
    sunrise: Icons.sunrise,
    leaf: Icons.leaf,
    book: Icons.book,
  },
  steampunk: {
    rest: Icons.restSteampunk,
    water: Icons.waterSteampunk,
    food: Icons.foodSteampunk,
    workout: Icons.workoutSteampunk,
    task: Icons.taskSteampunk,
    ai: Icons.ai,
    stats: Icons.stats,
    sunrise: Icons.sunrise,
    leaf: Icons.leaf,
    book: Icons.book,
  },
};

export function useStyledIcon(styleId: string = "standard") {
  const getIcon = useCallback(
    (type: IconType, color: string) => {
      const styleMap = STYLE_ICON_MAP[styleId] || STYLE_ICON_MAP.standard;
      return styleMap[type](color);
    },
    [styleId]
  );

  return { getIcon };
}
