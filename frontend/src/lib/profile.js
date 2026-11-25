const STORAGE_KEY = 'lara.profile';

export function getProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.id && saved?.name) return saved;
  } catch {
    /* start a fresh local profile */
  }

  const profile = {
    id: crypto.randomUUID(),
    name: 'Researcher',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
}
