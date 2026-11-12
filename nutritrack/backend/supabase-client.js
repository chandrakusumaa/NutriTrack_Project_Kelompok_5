(() => {
  "use strict";
  const config = window.NUTRITRACK_SUPABASE_CONFIG;
  const sdk = window.supabase;
  if (!config?.url || !config?.publishableKey || !sdk?.createClient) {
    console.error("NutriTrack: Supabase SDK/configuration is unavailable. Check internet access and backend/supabase-config.js.");
    window.NUTRITRACK_SUPABASE_ERROR = "Supabase SDK or public configuration could not be loaded.";
    return;
  }

  // Remember me selects where Supabase Auth stores its session:
  // checked   -> localStorage (survives browser restarts)
  // unchecked -> sessionStorage (scoped to the current browser tab session)
  // Read both locations on startup so sessions created by older NutriTrack
  // versions remain usable. Every new write is moved to the selected store.
  let rememberMe = true;
  const getBrowserStorage = (name) => {
    try { return window[name] || null; }
    catch { return null; }
  };

  const authStorage = {
    getItem(key) {
      const sessionStore = getBrowserStorage("sessionStorage");
      const localStore = getBrowserStorage("localStorage");
      try {
        const sessionValue = sessionStore?.getItem(key);
        if (sessionValue !== null && sessionValue !== undefined) {
          rememberMe = false;
          return sessionValue;
        }
      } catch (error) {
        console.warn("NutriTrack: could not read the browser session store.", error);
      }
      try {
        const localValue = localStore?.getItem(key);
        if (localValue !== null && localValue !== undefined) {
          rememberMe = true;
          return localValue;
        }
      } catch (error) {
        console.warn("NutriTrack: could not read the persistent browser store.", error);
      }
      return null;
    },
    setItem(key, value) {
      const sessionStore = getBrowserStorage("sessionStorage");
      const localStore = getBrowserStorage("localStorage");
      if (rememberMe) {
        try { sessionStore?.removeItem(key); } catch (error) {
          console.warn("NutriTrack: could not clear the tab session store.", error);
        }
        if (!localStore) throw new Error("Persistent browser storage is unavailable.");
        localStore.setItem(key, value);
      } else {
        try { localStore?.removeItem(key); } catch (error) {
          console.warn("NutriTrack: could not clear the persistent browser store.", error);
        }
        if (!sessionStore) throw new Error("Tab session storage is unavailable.");
        sessionStore.setItem(key, value);
      }
    },
    removeItem(key) {
      const sessionStore = getBrowserStorage("sessionStorage");
      const localStore = getBrowserStorage("localStorage");
      try { sessionStore?.removeItem(key); } catch (error) {
        console.warn("NutriTrack: could not clear the tab session store.", error);
      }
      try { localStore?.removeItem(key); } catch (error) {
        console.warn("NutriTrack: could not clear the persistent browser store.", error);
      }
    }
  };

  window.NUTRITRACK_AUTH_STORAGE = {
    setRememberMe(enabled) { rememberMe = Boolean(enabled); }
  };

  window.NUTRITRACK_SUPABASE = sdk.createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: authStorage,
      detectSessionInUrl: true,
      flowType: "implicit"
    }
  });
})();
