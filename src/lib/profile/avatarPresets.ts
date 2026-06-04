// تعریف ۱۲ preset آواتار — همگی از پالت رنگی brand

export const AVATAR_PRESETS = [
  { bg: "#1A1A1F", fg: "#F5F2EB" },  // 0: ink (پیش‌فرض)
  { bg: "#2E2C28", fg: "#F5F2EB" },  // 1: charcoal
  { bg: "#6B6657", fg: "#F5F2EB" },  // 2: stone
  { bg: "#7A8471", fg: "#F5F2EB" },  // 3: sage
  { bg: "#5C6555", fg: "#F5F2EB" },  // 4: sage deep
  { bg: "#C75D3C", fg: "#F5F2EB" },  // 5: ember
  { bg: "#9BB4C7", fg: "#1A1A1F" },  // 6: mist
  { bg: "#C19A4A", fg: "#1A1A1F" },  // 7: gold
  { bg: "#BDB6A7", fg: "#1A1A1F" },  // 8: fog
  { bg: "#8A6C55", fg: "#F5F2EB" },  // 9: umber گرم
  { bg: "#6B8CAE", fg: "#F5F2EB" },  // 10: slate آبی
  { bg: "#EAE4D6", fg: "#1A1A1F" },  // 11: bone روشن
] as const;

export type AvatarPresetIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export function getPreset(index: number) {
  const safe = Math.max(0, Math.min(11, Math.floor(index)));
  return AVATAR_PRESETS[safe];
}
