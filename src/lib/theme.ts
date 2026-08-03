const KEY = "shelflife-theme";

export function getStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(KEY, theme);
}
