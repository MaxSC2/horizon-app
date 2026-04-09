import React from "react";
import Svg, { G, Path, Circle, Rect, Line, Polyline } from "react-native-svg";

const size = 24;
const strokeW = 2;

export const Icons = {
  // === STANDARD ===
  rest: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={strokeW} />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
    </Svg>
  ),
  water: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C12 2 6 9 6 14a6 6 0 0012 0c0-5-6-12-6-12z" stroke={color} strokeWidth={strokeW} />
    </Svg>
  ),
  food: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeW} />
      <Path d="M8 12h8M12 8v8" stroke={color} strokeWidth={strokeW} />
    </Svg>
  ),
  workout: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 12h4m8 0h-4M9 7l-2 5 2 5M15 7l2 5-2 5" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
    </Svg>
  ),
  task: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={strokeW} />
      <Path d="M8 12l3 3 5-6" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  // === RPG GAME ===
  restRPG: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={2}>
        <Path d="M12 2L9 9H2l6 5-2 8 6-4 6 4-2-8 6-5h-7z" />
      </G>
    </Svg>
  ),
  waterRPG: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8 8 4 12 4 16a8 8 0 0016 0c0-4-4-8-8-14z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />
      <Path d="M8 16c0-2 2-3 4-3s4 1 4 3" stroke="#fff" strokeWidth={1.5} />
    </Svg>
  ),
  foodRPG: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="3" fill={color} />
    </Svg>
  ),
  workoutRPG: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6v12M18 6v12M6 12h12" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Circle cx="6" cy="6" r="3" fill={color} />
      <Circle cx="18" cy="6" r="3" fill={color} />
      <Circle cx="6" cy="18" r="3" fill={color} />
      <Circle cx="18" cy="18" r="3" fill={color} />
    </Svg>
  ),
  taskRPG: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 2l1 4h4l-3 3 1 4-3-2-3 2 1-4-3-3h4z" fill={color} />
    </Svg>
  ),

  // === KAWAII ===
  restKawaii: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14" r="7" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} />
      <Circle cx="9" cy="13" r="1" fill={color} />
      <Circle cx="15" cy="13" r="1" fill={color} />
      <Path d="M9 16q3 2 6 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8 5l2 3M16 5l-2 3" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  ),
  waterKawaii: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4C12 4 6 11 6 15a6 6 0 0012 0c0-4-6-11-6-11z" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="10" cy="14" r="1" fill={color} />
      <Circle cx="14" cy="14" r="1" fill={color} />
      <Path d="M10 17q2 1 4 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  ),
  foodKawaii: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} />
      <Circle cx="9" cy="11" r="1.5" fill={color} />
      <Circle cx="15" cy="11" r="1.5" fill={color} />
      <Path d="M8 15q4 3 8 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  ),
  workoutKawaii: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} />
      <Path d="M8 10v4M16 10v4M10 12h4" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  ),
  taskKawaii: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} />
      <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  // === CYBER ===
  restCyber: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="12,4 12,12 18,12" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.5} />
      <Line x1="3" y1="3" x2="7" y2="3" stroke={color} strokeWidth={1.5} />
      <Line x1="17" y1="3" x2="21" y2="3" stroke={color} strokeWidth={1.5} />
    </Svg>
  ),
  waterCyber: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C12 2 4 10 4 16l8 6 8-6c0-6-8-14-8-14z" stroke={color} strokeWidth={1.5} />
      <Line x1="4" y1="4" x2="8" y2="8" stroke={color} strokeWidth={1} />
      <Line x1="16" y1="8" x2="20" y2="4" stroke={color} strokeWidth={1} />
    </Svg>
  ),
  foodCyber: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" stroke={color} strokeWidth={1.5} />
      <Rect x="7" y="7" width="10" height="10" stroke={color} strokeWidth={1.5} />
      <Line x1="3" y1="3" x2="9" y2="9" stroke={color} strokeWidth={1} />
      <Line x1="21" y1="3" x2="15" y2="9" stroke={color} strokeWidth={1} />
    </Svg>
  ),
  workoutCyber: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth={2} />
      <Line x1="6" y1="7" x2="6" y2="17" stroke={color} strokeWidth={3} />
      <Line x1="18" y1="7" x2="18" y2="17" stroke={color} strokeWidth={3} />
      <Line x1="10" y1="9" x2="14" y2="9" stroke={color} strokeWidth={2} />
      <Line x1="10" y1="15" x2="14" y2="15" stroke={color} strokeWidth={2} />
    </Svg>
  ),
  taskCyber: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" stroke={color} strokeWidth={1.5} />
      <Polyline points="8,12 11,15 16,9" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  // === RETRO (8-bit style) ===
  restRetro: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x="6" y="6" width="4" height="4" />
      <Rect x="10" y="6" width="4" height="4" />
      <Rect x="14" y="6" width="4" height="4" />
      <Rect x="4" y="10" width="4" height="4" />
      <Rect x="8" y="10" width="4" height="4" />
      <Rect x="12" y="10" width="4" height="4" />
      <Rect x="16" y="10" width="4" height="4" />
      <Rect x="6" y="14" width="4" height="4" />
      <Rect x="10" y="14" width="4" height="4" />
      <Rect x="14" y="14" width="4" height="4" />
    </Svg>
  ),
  waterRetro: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x="8" y="4" width="8" height="4" />
      <Rect x="6" y="8" width="12" height="4" />
      <Rect x="4" y="12" width="16" height="4" />
      <Rect x="6" y="16" width="12" height="4" />
    </Svg>
  ),
  foodRetro: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x="4" y="8" width="16" height="8" />
      <Rect x="8" y="4" width="8" height="4" />
      <Rect x="8" y="16" width="8" height="4" />
    </Svg>
  ),
  workoutRetro: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x="4" y="4" width="4" height="16" />
      <Rect x="16" y="4" width="4" height="16" />
      <Rect x="8" y="10" width="8" height="4" />
    </Svg>
  ),
  taskRetro: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x="4" y="4" width="16" height="16" />
      <Rect x="8" y="8" width="4" height="4" fill="#07090D" />
      <Rect x="12" y="12" width="4" height="4" fill="#07090D" />
    </Svg>
  ),

  // === STEAMPUNK ===
  restSteampunk: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={1} />
      <Line x1="12" y1="6" x2="12" y2="12" stroke={color} strokeWidth={2} />
      <Line x1="12" y1="12" x2="16" y2="14" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="3" cy="12" r="1.5" fill={color} />
      <Circle cx="21" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="3" r="1.5" fill={color} />
      <Circle cx="12" cy="21" r="1.5" fill={color} />
    </Svg>
  ),
  waterSteampunk: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3c0 0-6 7-6 12a6 6 0 0012 0c0-5-6-12-6-12z" stroke={color} strokeWidth={2} />
      <Circle cx="8" cy="14" r="1" fill={color} />
      <Circle cx="12" cy="11" r="1" fill={color} />
      <Circle cx="16" cy="14" r="1" fill={color} />
      <Path d="M9 17c1.5 0.5 3 0.5 4.5 0" stroke={color} strokeWidth={1.5} />
    </Svg>
  ),
  foodSteampunk: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={1} strokeDasharray="3 2" />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Line x1="12" y1="3" x2="12" y2="7" stroke={color} strokeWidth={2} />
      <Line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth={2} />
    </Svg>
  ),
  workoutSteampunk: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="6" r="4" stroke={color} strokeWidth={2} />
      <Circle cx="18" cy="6" r="4" stroke={color} strokeWidth={2} />
      <Circle cx="6" cy="18" r="4" stroke={color} strokeWidth={2} />
      <Circle cx="18" cy="18" r="4" stroke={color} strokeWidth={2} />
      <Line x1="10" y1="6" x2="14" y2="6" stroke={color} strokeWidth={3} />
      <Line x1="6" y1="10" x2="6" y2="14" stroke={color} strokeWidth={3} />
      <Line x1="18" y1="10" x2="18" y2="14" stroke={color} strokeWidth={3} />
      <Line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth={3} />
    </Svg>
  ),
  taskSteampunk: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={1} />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  // === ZEN/MINIMAL ===
  restZen: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={1} />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1} />
    </Svg>
  ),
  waterZen: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4C12 4 6 11 6 15a6 6 0 0012 0c0-4-6-11-6-11z" stroke={color} strokeWidth={1.5} />
    </Svg>
  ),
  foodZen: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.5} />
    </Svg>
  ),
  workoutZen: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={1.5} />
    </Svg>
  ),
  taskZen: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.5} />
      <Circle cx="12" cy="12" r="3" fill={color} />
    </Svg>
  ),

  // === GLASS ===
  restGlass: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} strokeOpacity={0.6} />
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={1.5} strokeOpacity={0.4} />
      <Circle cx="12" cy="12" r="2" fill={color} fillOpacity={0.3} />
    </Svg>
  ),
  waterGlass: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4C12 4 6 11 6 15a6 6 0 0012 0c0-4-6-11-6-11z" stroke={color} strokeWidth={2} strokeOpacity={0.6} fill={color} fillOpacity={0.1} />
    </Svg>
  ),
  foodGlass: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} strokeOpacity={0.6} />
      <Circle cx="12" cy="12" r="5" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1} strokeOpacity={0.4} />
    </Svg>
  ),
  workoutGlass: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} strokeOpacity={0.6} />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth={2} strokeOpacity={0.6} />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth={2} strokeOpacity={0.6} />
    </Svg>
  ),
  taskGlass: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} strokeOpacity={0.6} />
      <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth={2} strokeOpacity={0.8} strokeLinecap="round" />
    </Svg>
  ),

  // === NAVIGATION ICONS (shared) ===
  // Sparkles (AI) - like lucide Sparkles
  ai: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 3L5.5 5L7 5.5L5.5 6L5 8L4.5 6L3 5.5L4.5 5L5 3Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 17L19.5 19L21 19.5L19.5 20L19 22L18.5 20L17 19.5L18.5 19L19 17Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  // BarChart2 (Stats) - like lucide BarChart2
  stats: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 3v6M14 3v12M10 3v9M6 3v15" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
    </Svg>
  ),

  // Sunrise (Dashboard) - like lucide Sunrise
  sunrise: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v2M12 20v2M4 12H2M6.3 5.3l-1.4-1.4M17.7 5.3l1.4-1.4M17.7 17.7l1.4 1.4M6.3 17.7L4.9 19.1" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
      <Path d="M12 6a6 6 0 016 6c0 3.3-2.7 6-6 6s-6-2.7-6-6a6 6 0 016-6z" stroke={color} strokeWidth={strokeW} />
    </Svg>
  ),

  // Leaf (Nutrition) - like lucide Leaf
  leaf: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22c-4-4-8-7.6-8-12a8 8 0 0116 0c0 4.4-4 8-8 12z" stroke={color} strokeWidth={strokeW} />
      <Path d="M12 10c-3-3-6-4-8-4 2 0 4 2 6 4" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
    </Svg>
  ),

  // BookOpen (Journal) - like lucide BookOpen
  book: (color: string) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6.5c2.5-2 5-2.5 7-2.5 3 0 5 2 5 5v9c0 2-1.5 3.5-3.5 3.5-1.5 0-2.5-.5-3.5-1.5M12 6.5C9.5 8.5 7 9 5 9 2.5 9 1 11.5 1 14.5v9C1 21.5 2.5 23 4.5 23 6 23 7 22.5 8 21.5M12 6.5v14" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
};
