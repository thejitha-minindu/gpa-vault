export const loadJSON = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const saveJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const removeJSON = key => localStorage.removeItem(key);
