// src/utils/authStorage.js
export const STORAGE_KEYS = ["user", "access", "refresh", "identifier"];

export const getStorage = () => {
  const hasSessionAccess = !!sessionStorage.getItem("access");
  const hasLocalAccess   = !!localStorage.getItem("access");
  if (hasSessionAccess) return sessionStorage;
  if (hasLocalAccess)   return localStorage;

  const hasSessionRefresh = !!sessionStorage.getItem("refresh");
  const hasLocalRefresh   = !!localStorage.getItem("refresh");
  if (hasSessionRefresh) return sessionStorage;
  if (hasLocalRefresh)   return localStorage;

  return sessionStorage;
};

export const saveAuth = ({ user, access, refresh, remember }) => {
  ["user","access","refresh","identifier","remember"].forEach(k=>{
    sessionStorage.removeItem(k); localStorage.removeItem(k);
  });

  const store = remember ? localStorage : sessionStorage;
  if (user) store.setItem("user", JSON.stringify(user));
  if (access) store.setItem("access", access);
  if (refresh) store.setItem("refresh", refresh);
  store.setItem("remember", remember ? "1" : "0");
};


export const clearAllAuth = () => {
  STORAGE_KEYS.forEach((k) => {
    sessionStorage.removeItem(k);
    localStorage.removeItem(k);
  });
};

export const loadAuth = () => {
  const store = getStorage();
  const access = store.getItem("access");
  const refresh = store.getItem("refresh");
  const userStr = store.getItem("user");
  return {
    access: access || null,
    refresh: refresh || null,
    user: userStr ? JSON.parse(userStr) : null,
    store,
  };
};

// kiểm tra hạn JWT access/refresh
export const isJwtExpired = (jwt) => {
  try {
    const [, payload] = jwt.split(".");
    const { exp } = JSON.parse(atob(payload));
    return !exp || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};
