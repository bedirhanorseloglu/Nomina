import { DenemeRecord } from "./denemeUtils";

const STORAGE_KEY = "kpss_2026_denemeler";
const TARGET_NET_KEY = "deneme_target_net";
const DEFAULT_TARGET_NET = 90;

export function loadDenemeler(): DenemeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed: DenemeRecord[] = [];
    if (raw) {
      parsed = JSON.parse(raw);
    }

    return Array.isArray(parsed)
      ? parsed.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      : [];
  } catch {
    return [];
  }
}

export function saveDenemeler(denemeler: DenemeRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(denemeler));
}

export function addDeneme(deneme: DenemeRecord): DenemeRecord[] {
  const list = [deneme, ...loadDenemeler()];
  saveDenemeler(list);
  return list;
}

export function deleteDeneme(id: string): DenemeRecord[] {
  const list = loadDenemeler().filter((d) => d.id !== id);
  saveDenemeler(list);
  return list;
}

export function updateDeneme(updated: DenemeRecord): DenemeRecord[] {
  const list = loadDenemeler().map((d) =>
    d.id === updated.id ? updated : d
  );
  saveDenemeler(list);
  return list;
}

export function loadTargetNet(): number {
  if (typeof window === "undefined") return DEFAULT_TARGET_NET;
  try {
    const saved = localStorage.getItem(TARGET_NET_KEY);
    if (!saved) return DEFAULT_TARGET_NET;
    const parsed = parseInt(saved, 10);
    return Number.isFinite(parsed) ? parsed : DEFAULT_TARGET_NET;
  } catch {
    return DEFAULT_TARGET_NET;
  }
}

export function saveTargetNet(value: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TARGET_NET_KEY, String(value));
}
