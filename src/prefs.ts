// Device-local look & feel preferences (not synced — like the theme).

export interface FontChoice {
  id: string
  label: string
  family: string
}

export const FONTS: FontChoice[] = [
  { id: 'goblock', label: 'Goblock', family: "'Goblock', 'Permanent Marker', cursive" },
  { id: 'marker', label: 'Marker', family: "'Permanent Marker', cursive" },
  { id: 'bangers', label: 'Bangers', family: "'Bangers', cursive" },
  { id: 'bebas', label: 'Bebas', family: "'Bebas Neue', sans-serif" },
  { id: 'orbitron', label: 'Orbitron', family: "'Orbitron', sans-serif" },
  { id: 'pixel', label: 'Pixel', family: "'Silkscreen', monospace" },
  { id: 'script', label: 'Script', family: "'Pacifico', cursive" },
]

export function loadPref(key: string, fallback: string): string {
  try {
    return localStorage.getItem(`compound.${key}`) ?? fallback
  } catch {
    return fallback
  }
}

export function savePref(key: string, value: string): void {
  try {
    localStorage.setItem(`compound.${key}`, value)
  } catch {
    /* unavailable */
  }
}
