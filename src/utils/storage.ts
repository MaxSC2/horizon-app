import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULTS } from "../data/constants";

const KEY = "horizon_v4";

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

export async function persistState(state: Record<string, unknown>) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}
