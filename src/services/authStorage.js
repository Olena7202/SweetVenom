import api from '../api/axiosConfig';

const CURRENT_USER_KEY = "bakery_current_user";
const CONFECTIONER_PROFILE_KEY = "bakery_confectioner_profiles";

function readProfiles() {
  const raw = localStorage.getItem(CONFECTIONER_PROFILE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProfiles(value) {
  localStorage.setItem(CONFECTIONER_PROFILE_KEY, JSON.stringify(value));
}

export function getConfectionerProfile(userId) {
  if (!userId) return null;
  const profiles = readProfiles();
  return profiles.find((item) => Number(item.userId) === Number(userId)) ?? null;
}

export function saveConfectionerProfile({ userId, telegram = "", phone = "" }) {
  if (!userId) return null;
  const profiles = readProfiles();
  const existing = profiles.find((item) => Number(item.userId) === Number(userId));
  const profile = {
    userId,
    telegram: (telegram ?? existing?.telegram ?? "").trim(),
    phone: (phone ?? existing?.phone ?? "").trim(),
  };
  const next = [
    profile,
    ...profiles.filter((item) => Number(item.userId) !== Number(userId))
  ];
  writeProfiles(next);
  return profile;
}

export function getCurrentUser() {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}


const PROFILE_PREFERENCES_KEY = "bakery_profile_preferences";
function readProfilePreferences(userId) {
 try { const all=JSON.parse(localStorage.getItem(PROFILE_PREFERENCES_KEY)||"{}"); return all?.[String(userId)] || {}; } catch { return {}; }
}
function writeProfilePreferences(userId, patch) {
 let all={}; try { const parsed=JSON.parse(localStorage.getItem(PROFILE_PREFERENCES_KEY)||"{}"); if(parsed && typeof parsed==="object" && !Array.isArray(parsed)) all=parsed; } catch { /* Start a fresh preferences record. */ }
 const preferences={...readProfilePreferences(userId)};
 for(const key of ["fullName","phone"]) if(typeof patch[key]==="string") preferences[key]=patch[key];
 all[String(userId)]=preferences;
 localStorage.setItem(PROFILE_PREFERENCES_KEY,JSON.stringify(all));
}
export function updateCurrentUser(patch) {
  const current = getCurrentUser();
  if (!current) return null;
  const updated = { ...current, ...patch };
  writeProfilePreferences(current.id,patch);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
  return updated;
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem('token');
}

export function getDashboardPathByRole(role) {
  return role === "confectioner" ? "/confectioner" : "/client";
}

export async function registerUser({ fullName, email, password, role, telegram = "" }) {
  try {
    await api.post('/auth/register', {
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: '',
      role: role === 'confectioner' ? 'Confectioner' : 'Client'
    });
    const loginResult = await loginUser({ email, password });
    if (loginResult.ok && role === "confectioner") {
      saveConfectionerProfile({ userId: loginResult.user.id, telegram });
      const refreshedUser = {
        ...loginResult.user,
        telegram: (telegram || "").trim()
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(refreshedUser));
      return { ...loginResult, user: refreshedUser };
    }
    return loginResult;
  } catch (error) {
    const message = error.response?.data || 'Registration failed';
    return { ok: false, message };
  }
}


export async function loginUser({ email, password }) {
  try {
    const response = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password
    });

    const { token, role, userId, name, email:serverEmail, phone:serverPhone } = response.data;
    const savedProfile = getConfectionerProfile(userId);
    const preferences = readProfilePreferences(userId);

    localStorage.setItem('token', token);
    const user = {
      id: userId,
      fullName: name || preferences.fullName || "",
      email: serverEmail || email.trim().toLowerCase(),
      role: role.toLowerCase(),
      telegram: savedProfile?.telegram || "",
      phone: serverPhone ?? preferences.phone ?? savedProfile?.phone ?? "",
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    return { ok: true, user };
  } catch (error) {
    const message = error.response?.data || 'Invalid email or password!';
    return { ok: false, message };
  }
}


export async function saveAccountProfile({ fullName, email, phone }) {
    const response = await api.put("/auth/profile", { name:fullName.trim(), email:email.trim().toLowerCase(), phone:phone.trim() });
    const result = response.data;
    if (!result?.token || !result.email) throw new Error("Сервер не підтвердив зміну профілю.");
    localStorage.setItem("token",result.token);
    return updateCurrentUser({ fullName:result.name, email:result.email, phone:result.phone });
}
