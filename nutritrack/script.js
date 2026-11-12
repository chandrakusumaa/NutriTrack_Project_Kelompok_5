(() => {
  "use strict";

  const STORAGE_KEY = "nutritrack_figma_v1";
  let activeStorageKey = STORAGE_KEY;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const number = value => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0));
  const decimal = value => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number(value) || 0);
  const decimal2 = value => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0);
  const localISO = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const todayISO = () => localISO(new Date());
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const formatDate = (iso, options = { day: "numeric", month: "short" }) => new Intl.DateTimeFormat("en-US", options).format(new Date(`${iso}T12:00:00`));
  const shiftDate = (days, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + days); return localISO(d); };

  const FOOD_DB = [
    { id: "yogurt", name: "Greek yogurt", category: "Breakfast", emoji: "◉", calories: 70.6, protein: 10, carbs: 3.5, fat: 2.35, portion: "170 g" },
    { id: "oats", name: "Oats & banana", category: "Breakfast", emoji: "◒", calories: 300, protein: 8, carbs: 60, fat: 4, portion: "1 bowl" },
    { id: "chicken", name: "Chicken rice bowl", category: "Lunch", emoji: "◉", calories: 520, protein: 28, carbs: 58, fat: 12, portion: "1 serving" },
    { id: "avocado", name: "Sliced avocado", category: "Lunch", emoji: "◕", calories: 160, protein: 2, carbs: 7, fat: 14, portion: "100 g" },
    { id: "shake", name: "Protein shake & almonds", category: "Snacks", emoji: "◍", calories: 240, protein: 24, carbs: 12, fat: 10, portion: "1 serving" },
    { id: "salmon", name: "Grilled salmon", category: "Dinner", emoji: "◒", calories: 320, protein: 10, carbs: 19, fat: 8, portion: "100 g" },
    { id: "quinoa", name: "Veggies & quinoa", category: "Dinner", emoji: "◉", calories: 180, protein: 3, carbs: 24, fat: 2, portion: "1 side" },
    { id: "egg", name: "Boiled egg", category: "Snacks", emoji: "◍", calories: 155, protein: 13, carbs: 1.1, fat: 11, portion: "2 eggs" },
    { id: "apple", name: "Apple", category: "Snacks", emoji: "◒", calories: 52, protein: .3, carbs: 14, fat: .2, portion: "1 medium" },
    { id: "almonds", name: "Almonds", category: "Snacks", emoji: "◉", calories: 164, protein: 6, carbs: 6, fat: 14, portion: "28 g" },
    { id: "tofu", name: "Firm tofu", category: "Lunch", emoji: "◧", calories: 144, protein: 17, carbs: 3, fat: 9, portion: "100 g" },
    { id: "tempeh", name: "Tempeh", category: "Lunch", emoji: "◧", calories: 193, protein: 20, carbs: 9, fat: 11, portion: "100 g" },
    { id: "rice", name: "Cooked white rice", category: "Lunch", emoji: "◌", calories: 130, protein: 2.7, carbs: 28, fat: .3, portion: "100 g" }
  ];

  const makeSeedState = () => {
    const date = todayISO();
    const seedIds = ["yogurt", "oats", "chicken", "avocado", "shake", "salmon", "quinoa"];
    const grams = [170, 100, 100, 100, 100, 100, 100];
    const meals = ["Breakfast", "Breakfast", "Lunch", "Lunch", "Snacks", "Dinner", "Dinner"];
    const diaryEntries = seedIds.map((id, i) => {
      const food = FOOD_DB.find(item => item.id === id);
      return { ...food, entryId: `seed-${id}`, grams: grams[i], meal: meals[i], createdAt: Date.now() };
    });
    const history = [76.8, 76.3, 75.7, 74.8, 74.5, 73.2, 72.8, 72.5].map((weight, i) => ({ date: shiftDate(-49 + i * 7), weight }));
    const calorieHistory = [1960, 1980, 1950, 2020, 1980, 2020, 1950].map((calories, i) => ({ date: shiftDate(i - 6), calories, logged: true }));
    return {
      profile: { name: "Alex Morgan", email: "alex.morgan@example.com", age: 28, sex: "male", height: 175, weight: 72.5, activity: 1.55, goal: "cutting", pace: 0.4, goalWeight: 68 },
      targets: { calories: 1950, protein: 135, carbs: 195, fat: 54, maintenance: 2350 },
      diary: { [date]: diaryEntries }, customFoods: [], water: { [date]: 1.5 }, waterTarget: 2.5,
      weights: history, calorieHistory, preferences: ["Balanced"], units: { weight: "kg", height: "cm", energy: "kcal" },
      notifications: { meal: true, water: true, weekly: false }, coachMessages: [],
      weeklyLogged: [true, true, true, true, false, false, true], startWeight: 76.8
    };
  };

  function loadState(key = activeStorageKey) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return makeSeedState();
      const saved = JSON.parse(raw);
      const defaults = makeSeedState();
      return {
        ...defaults, ...saved,
        profile: { ...defaults.profile, ...(saved.profile || {}) },
        targets: { ...defaults.targets, ...(saved.targets || {}) },
        units: { ...defaults.units, ...(saved.units || {}) },
        notifications: { ...defaults.notifications, ...(saved.notifications || {}) },
        diary: { ...(saved.diary || {}) }, customFoods: Array.isArray(saved.customFoods) ? saved.customFoods : [],
        weights: Array.isArray(saved.weights) ? saved.weights : defaults.weights,
        calorieHistory: Array.isArray(saved.calorieHistory) ? saved.calorieHistory : defaults.calorieHistory,
        preferences: Array.isArray(saved.preferences) ? saved.preferences : defaults.preferences,
        coachMessages: Array.isArray(saved.coachMessages) ? saved.coachMessages : [],
        water: saved.water || {}, weeklyLogged: saved.weeklyLogged || defaults.weeklyLogged
      };
    } catch (error) {
      console.warn("NutriTrack: data lokal tidak dapat dibaca.", error);
      return makeSeedState();
    }
  }
  let state = loadState();
  let currentView = "dashboard";
  let currentMealFilter = "All";
  let currentProgressPeriod = "30D";
  let toastTimer;
  let pendingFood = null;
  let pendingWeightEdit = null;
  let activeUserId = null;
  let activeCoachConversationId = null;
  let coachSaveQueue = Promise.resolve();
  let cloudFoods = null;
  let cloudFoodLoadError = false;
  const supabase = window.NUTRITRACK_SUPABASE;

  function persist() {
    try { localStorage.setItem(activeStorageKey, JSON.stringify(state)); }
    catch (error) { console.warn("NutriTrack: gagal menyimpan data lokal.", error); showToast("Penyimpanan browser penuh atau tidak tersedia."); }
  }
  function showToast(message) {
    const toast = $("#toast"); if (!toast) return;
    toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
  }
  function currentWater() { return Number(state.water[todayISO()] || 0); }
  function allFoods() {
    if (activeUserId) return Array.isArray(cloudFoods) ? cloudFoods : [];
    return [...FOOD_DB, ...state.customFoods];
  }
  function foodEmoji(category) {
    return ({ Breakfast: "◒", Lunch: "◉", Dinner: "◔", Snacks: "◍" })[category] || "◉";
  }
  function mapCloudFood(row) {
    return {
      id: row.id, name: row.name, category: row.category || "Snacks", emoji: foodEmoji(row.category),
      calories: Number(row.calories) || 0, protein: Number(row.protein_g) || 0,
      carbs: Number(row.carbs_g) || 0, fat: Number(row.fat_g) || 0,
      portion: row.serving_label || "100 g", servingGrams: Number(row.serving_grams) || 100,
      ownerId: row.owner_id || null, isCustom: Boolean(row.owner_id)
    };
  }
  function mapCloudEntry(row) {
    const food = (cloudFoods || []).find(item => item.id === row.food_id);
    return {
      id: row.food_id || null, entryId: row.id, name: row.food_name,
      category: row.meal_type, meal: row.meal_type, emoji: food?.emoji || foodEmoji(row.meal_type),
      calories: Number(row.calories_per_100g) || 0, protein: Number(row.protein_per_100g) || 0,
      carbs: Number(row.carbs_per_100g) || 0, fat: Number(row.fat_per_100g) || 0,
      grams: Number(row.quantity_grams) || 100, createdAt: row.logged_at ? Date.parse(row.logged_at) : Date.now()
    };
  }
  async function loadCloudFoodDiary() {
    if (!supabase || !activeUserId) return;
    cloudFoods = null;
    cloudFoodLoadError = false;
    try {
      const foodColumns = "id,slug,owner_id,name,brand,category,serving_label,serving_grams,calories,protein_g,carbs_g,fat_g,fiber_g,is_verified";
      const entryColumns = "id,food_id,food_name,meal_type,entry_date,quantity_grams,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,logged_at";
      const { data: foods, error: foodsError } = await supabase
        .from("foods").select(foodColumns).order("name");
      if (foodsError) throw foodsError;
      cloudFoods = (foods || []).map(mapCloudFood);

      // Migrate any custom foods that were saved locally by this account before cloud sync.
      for (const localFood of (Array.isArray(state.customFoods) ? state.customFoods : [])) {
        const nameKey = String(localFood.name || "").trim().toLowerCase();
        if (!nameKey || cloudFoods.some(food => food.ownerId === activeUserId && food.name.trim().toLowerCase() === nameKey)) continue;
        const { data, error } = await supabase.from("foods").insert({
          owner_id: activeUserId,
          name: localFood.name,
          category: ["Breakfast", "Lunch", "Dinner", "Snacks"].includes(localFood.category) ? localFood.category : "Snacks",
          serving_label: localFood.portion || "100 g",
          serving_grams: Number(localFood.servingGrams) || 100,
          calories: Number(localFood.calories) || 0,
          protein_g: Number(localFood.protein) || 0,
          carbs_g: Number(localFood.carbs) || 0,
          fat_g: Number(localFood.fat) || 0,
          is_verified: false
        }).select(foodColumns).single();
        if (error) throw error;
        cloudFoods.push(mapCloudFood(data));
      }

      const { data: remoteBeforeMigration, error: entriesError } = await supabase
        .from("food_entries").select(entryColumns)
        .eq("user_id", activeUserId)
        .order("entry_date", { ascending: true })
        .order("logged_at", { ascending: true });
      if (entriesError) throw entriesError;

      // Preserve account-specific local entries without duplicating rows already in the cloud.
      // A multiset comparison keeps intentional repeated servings of the same food intact.
      const signature = (date, item) => [
        date,
        String(item.food_name || item.name || "").trim().toLowerCase(),
        normalizeMeal(item.meal_type || item.meal || item.category),
        Number(item.quantity_grams ?? item.grams ?? 100).toFixed(2),
        Number(item.calories_per_100g ?? item.calories ?? 0).toFixed(2),
        Number(item.protein_per_100g ?? item.protein ?? 0).toFixed(2),
        Number(item.carbs_per_100g ?? item.carbs ?? 0).toFixed(2),
        Number(item.fat_per_100g ?? item.fat ?? 0).toFixed(2)
      ].join("|");
      const remoteCounts = new Map();
      for (const row of (remoteBeforeMigration || [])) {
        const key = signature(row.entry_date, row);
        remoteCounts.set(key, (remoteCounts.get(key) || 0) + 1);
      }
      const pendingEntries = [];
      for (const [date, localEntries] of Object.entries(state.diary || {})) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(localEntries)) continue;
        for (const item of localEntries) {
          const key = signature(date, item);
          const existingCount = remoteCounts.get(key) || 0;
          if (existingCount > 0) {
            remoteCounts.set(key, existingCount - 1);
            continue;
          }
          const food = cloudFoods.find(candidate =>
            String(candidate.id) === String(item.id) || candidate.name.trim().toLowerCase() === String(item.name || "").trim().toLowerCase()
          );
          pendingEntries.push({
            user_id: activeUserId,
            food_id: food?.id || null,
            food_name: item.name,
            meal_type: normalizeMeal(item.meal || item.category),
            entry_date: date,
            quantity_grams: clamp(Number(item.grams) || 100, 1, 2500),
            calories_per_100g: Number(item.calories) || 0,
            protein_per_100g: Number(item.protein) || 0,
            carbs_per_100g: Number(item.carbs) || 0,
            fat_per_100g: Number(item.fat) || 0
          });
        }
      }
      if (pendingEntries.length) {
        const { error: migrateError } = await supabase.from("food_entries").insert(pendingEntries);
        if (migrateError) throw migrateError;
      }

      const { data: entries, error: refreshError } = await supabase
        .from("food_entries").select(entryColumns)
        .eq("user_id", activeUserId)
        .order("entry_date", { ascending: true })
        .order("logged_at", { ascending: true });
      if (refreshError) throw refreshError;

      const diaryByDate = {};
      for (const row of (entries || [])) {
        if (!diaryByDate[row.entry_date]) diaryByDate[row.entry_date] = [];
        diaryByDate[row.entry_date].push(mapCloudEntry(row));
      }
      state.diary = diaryByDate;
      if (!state.diary[todayISO()]) state.diary[todayISO()] = [];
      persist();
      renderAll();
    } catch (error) {
      cloudFoods = [];
      cloudFoodLoadError = true;
      console.error("NutriTrack: gagal memuat Food Diary dari Supabase.", error);
      showToast(`Food Diary cloud sync failed: ${error.message || "check your connection"}`);
      renderAll();
    }
  }
  async function loadCloudWaterLogs() {
    if (!supabase || !activeUserId) return;
    const columns = "id,log_date,amount_ml,logged_at";
    const { data: initialRows, error: readError } = await supabase
      .from("water_logs").select(columns)
      .eq("user_id", activeUserId)
      .order("log_date", { ascending: true })
      .order("logged_at", { ascending: true });
    if (readError) throw readError;

    // Migrate browser-only hydration totals. Cloud totals are authoritative;
    // only a positive local-minus-cloud difference is uploaded, so repeated
    // logins do not duplicate glasses already stored in Supabase.
    const cloudTotals = new Map();
    for (const row of (initialRows || [])) {
      const date = String(row.log_date || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      cloudTotals.set(date, (cloudTotals.get(date) || 0) + Math.max(0, Number(row.amount_ml) || 0));
    }
    const migrationRows = [];
    for (const [date, litersValue] of Object.entries(state.water || {})) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const localMl = Math.max(0, Math.round((Number(litersValue) || 0) * 1000));
      let remainingMl = localMl - (cloudTotals.get(date) || 0);
      while (remainingMl > 0) {
        const amount = Math.min(10000, remainingMl);
        migrationRows.push({ user_id: activeUserId, log_date: date, amount_ml: amount });
        remainingMl -= amount;
      }
    }
    if (migrationRows.length) {
      const { error: migrateError } = await supabase.from("water_logs").insert(migrationRows);
      if (migrateError) throw migrateError;
    }

    const { data: rows, error } = await supabase
      .from("water_logs").select(columns)
      .eq("user_id", activeUserId)
      .order("log_date", { ascending: true })
      .order("logged_at", { ascending: true });
    if (error) throw error;
    const totalsByDate = {};
    for (const row of (rows || [])) {
      const date = String(row.log_date || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      totalsByDate[date] = (totalsByDate[date] || 0) + (Math.max(0, Number(row.amount_ml) || 0) / 1000);
    }
    state.water = totalsByDate;
    persist();
  }

  async function addWaterGlass() {
    const date = todayISO();
    const buttons = [$("#logWaterBtn"), $("#foodLogWater")].filter(Boolean);
    buttons.forEach(button => { button.disabled = true; });
    try {
      if (activeUserId) {
        if (!supabase) throw new Error("Supabase connection is unavailable. Water was not synced.");
        const { error } = await supabase.from("water_logs").insert({
          user_id: activeUserId,
          log_date: date,
          amount_ml: 250
        });
        if (error) throw error;
        await loadCloudWaterLogs();
      } else {
        state.water[date] = Math.max(0, currentWater()) + 0.25;
        persist();
      }
      state.weeklyLogged[6] = true;
      persist();
      renderAll();
      showToast(activeUserId ? "250 ml of water saved to your account." : "Water intake updated.");
    } catch (error) {
      console.error("NutriTrack: water log save failed", error);
      showToast(`Water was not saved: ${error.message || "please try again"}`);
    } finally {
      buttons.forEach(button => { button.disabled = false; });
    }
  }

  function getEntries(date = todayISO()) { return Array.isArray(state.diary[date]) ? state.diary[date] : []; }
  function entryTotals(entries) {
    return entries.reduce((total, entry) => {
      const factor = (Number(entry.grams) || 100) / 100;
      total.calories += Number(entry.calories || 0) * factor;
      total.protein += Number(entry.protein || 0) * factor;
      total.carbs += Number(entry.carbs || 0) * factor;
      total.fat += Number(entry.fat || 0) * factor;
      return total;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }
  function totalsToday() { return entryTotals(getEntries()); }
  function pct(value, target) { return target > 0 ? clamp(value / target * 100, 0, 100) : 0; }
  function setProgressBar(id, value, target) { const node = $(id); if (node) node.style.width = `${pct(value, target)}%`; }
  function initials(name) { return (name || "A").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "A"; }
  function updateNav(view) {
    $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    $$(".mobile-bottom-nav button").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  }
  function setView(view) {
    const panel = $(`#view-${view}`); if (!panel) return;
    currentView = view;
    $$(".view").forEach(section => section.classList.toggle("active", section === panel));
    updateNav(view);
    if (view === "dashboard") renderDashboard();
    if (view === "food") renderFoodPage();
    if (view === "goals") renderGoalsPage();
    if (view === "progress") renderProgressPage();
    if (view === "coach") renderCoachPage();
    if (view === "settings") renderSettingsPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderDashboard() {
    const p = state.profile, t = state.targets, totals = totalsToday(), entries = getEntries();
    $("#dashboardTitle").textContent = `Good morning, ${p.name.trim().split(/\s+/)[0] || "Alex"}`;
    $("#sidebarName").textContent = p.name || "Your profile";
    $("#sidebarAvatar").textContent = initials(p.name);
    $("#todayLabel").textContent = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "2-digit" }).format(new Date()).toUpperCase();
    const used = Math.round(totals.calories), remaining = Math.round(t.calories - totals.calories);
    const calorieStatus = $(".calories-card .status-pill"); if (calorieStatus) { calorieStatus.innerHTML = `<i></i> ${remaining >= 0 ? "ON TRACK" : "OVER TARGET"}`; calorieStatus.classList.toggle("over-target", remaining < 0); }
    $("#dashCalories").textContent = number(used); $("#dashCalorieGoal").textContent = `of ${number(t.calories)} kcal daily target`;
    $("#dashCaloriesLeft").textContent = `${number(Math.max(0, remaining))} kcal ${remaining >= 0 ? "remaining" : "over target"}`;
    $("#dashCaloriesPercent").textContent = `${Math.round(totals.calories / Math.max(1, t.calories) * 100)}% of daily goal`;
    setProgressBar("#dashCalorieBar", totals.calories, t.calories);
    [["Protein", totals.protein, t.protein], ["Carbohydrates", totals.carbs, t.carbs], ["Fat", totals.fat, t.fat]].forEach(([name, value, target]) => {
      const key = name === "Protein" ? "Protein" : name === "Carbohydrates" ? "Carbs" : "Fat";
      $(`#dash${key}`).textContent = number(value); $(`#dash${key}Goal`).textContent = `Target ${number(target)} g`;
      setProgressBar(`#dash${key}Bar`, value, target);
    });
    const water = currentWater(), waterTarget = state.waterTarget || 2.5;
    $("#waterAmount").textContent = decimal2(water); $("#waterTarget").textContent = decimal2(waterTarget);
    $("#waterGlasses").textContent = `${Math.round(water / .25)} of ${Math.round(waterTarget / .25)} glasses today`;
    setProgressBar("#waterBar", water, waterTarget);
    $("#hydrationTipText").textContent = `${decimal2(Math.max(0, waterTarget - water))} L away from your daily water goal.`;
    $("#mealCount").textContent = `${entries.length} entries · ${number(totals.calories)} kcal logged`;
    const mealOrder = ["Breakfast", "Lunch", "Snacks", "Dinner"];
    $("#dashboardMeals").innerHTML = mealOrder.map(meal => {
      const group = entries.filter(entry => normalizeMeal(entry.meal) === meal);
      if (!group.length) return "";
      const labels = group.map(item => item.name).join(", ");
      const calories = Math.round(entryTotals(group).calories);
      const markers = { Breakfast: "◒", Lunch: "◉", Snacks: "◍", Dinner: "◔" };
      return `<article class="card meal-preview-card"><span class="meal-marker">${markers[meal]}</span><div class="meal-preview-info"><h3>${meal}</h3><p>${escapeHTML(labels)}</p></div><strong class="meal-preview-calories">${number(calories)} kcal</strong></article>`;
    }).join("") || `<div class="empty-panel"><strong>No meals logged yet</strong>Add your first food to start your daily diary.</div>`;
    const proteinGap = Math.max(0, Math.round(t.protein - totals.protein));
    $("#dashboardInsightTitle").textContent = proteinGap > 0 ? "A little more protein will go a long way." : "You're making steady progress.";
    $("#dashboardInsightText").textContent = proteinGap > 0 ? `You have about ${proteinGap} g of your estimated protein target left. Consider a protein-rich option with your next meal.` : "Your protein target is on track. Keep building habits that work for your routine.";
    $("#dashboardDinnerIdea").textContent = proteinGap > 0 ? "Salmon, tofu, or lentils" : "Keep a balanced plate";
  }

  function normalizeMeal(meal) { return meal === "Snack" || meal === "Snacks" ? "Snacks" : meal || "Snacks"; }
  function renderFoodPage() {
    const entries = getEntries(); const totals = entryTotals(entries); const target = state.targets;
    $("#foodDateLabel").textContent = "TODAY";
    $("#foodCount").textContent = `${entries.length} foods logged today`;
    $("#foodCalories").textContent = `${number(totals.calories)} kcal`;
    $("#foodCalorieGoal").textContent = `of ${number(target.calories)} kcal daily target`;
    $("#foodCaloriesLeft").textContent = `${number(Math.max(0, target.calories - totals.calories))} kcal left`;
    $("#foodCaloriePercent").textContent = `${Math.round(totals.calories / Math.max(1, target.calories) * 100)}% reached`;
    setProgressBar("#foodCalorieBar", totals.calories, target.calories);
    $("#foodMacroRows").innerHTML = macroRowsHTML(totals, target);
    const water = currentWater();
    $("#foodWaterValue").textContent = `${decimal2(water)} / ${decimal2(state.waterTarget)} L`;
    $("#foodWaterGlasses").textContent = `${Math.round(water / .25)} of ${Math.round(state.waterTarget / .25)} glasses logged`;
    setProgressBar("#foodWaterBar", water, state.waterTarget);
    renderMealGroups(); renderFoodSearchResults(); renderFrequentFoods();
  }
  function macroRowsHTML(values, targets) {
    return [["Protein", values.protein, targets.protein, "lime-fill"], ["Carbs", values.carbs, targets.carbs, "green-fill"], ["Fat", values.fat, targets.fat, "amber-fill"]].map(([label, value, target, color]) => `<div class="macro-row"><div class="macro-row-head"><span>${label}</span><strong>${number(value)} / ${number(target)} g</strong></div><div class="progress-track"><span class="progress-fill ${color}" style="width:${pct(value, target)}%"></span></div></div>`).join("");
  }
  function renderMealGroups() {
    const entries = getEntries();
    const order = ["Breakfast", "Lunch", "Snacks", "Dinner"];
    if (!entries.length) {
      $("#foodMealGroups").innerHTML = `<article class="empty-diary-state"><div class="empty-state-icon">＋</div><h2>Your food diary is ready</h2><p>Start by adding your first meal. NutriTrack will calculate your calories and macros as you go.</p><button class="button button-primary" type="button" data-empty-add-food>Add your first food</button><small>Today's target: ${number(state.targets.calories)} kcal</small></article>`;
      return;
    }
    const groups = order.map(meal => {
      const rows = entries.filter(item => normalizeMeal(item.meal) === meal);
      if (currentMealFilter !== "All" && currentMealFilter !== meal) return "";
      const total = entryTotals(rows).calories;
      const time = { Breakfast: "07:30 AM", Lunch: "12:45 PM", Snacks: "03:30 PM", Dinner: "07:15 PM" }[meal];
      const body = rows.length ? rows.map(entry => foodEntryHTML(entry)).join("") : `<div class="empty-panel">No ${meal.toLowerCase()} entries yet.</div>`;
      return `<article class="meal-group"><div class="meal-group-header"><strong>${meal}</strong><span>${rows.length ? time : ""}</span><span class="meal-total">${number(total)} kcal</span></div>${body}</article>`;
    }).join("");
    $("#foodMealGroups").innerHTML = groups || `<div class="empty-panel"><strong>No entries found</strong>Try another meal filter or add food to your diary.</div>`;
  }
  function foodEntryHTML(entry) {
    const factor = (Number(entry.grams) || 100) / 100;
    return `<div class="food-entry"><div class="food-entry-main"><span class="food-entry-icon">${escapeHTML(entry.emoji || "◉")}</span><div><strong>${escapeHTML(entry.name)}</strong><small>P ${decimal(entry.protein * factor)} · C ${decimal(entry.carbs * factor)} · F ${decimal(entry.fat * factor)} g</small></div></div><span class="portion">${decimal(entry.grams)} g</span><strong class="entry-calories">${number(entry.calories * factor)} kcal</strong><button class="entry-edit" data-edit-entry="${escapeHTML(entry.entryId)}" aria-label="Edit ${escapeHTML(entry.name)}">✎</button><button class="entry-add" data-remove-entry="${escapeHTML(entry.entryId)}" aria-label="Remove ${escapeHTML(entry.name)}">×</button></div>`;
  }
  function renderFoodSearchResults() {
    const query = $("#foodSearch").value.trim().toLowerCase();
    const panel = $("#foodSearchResults");
    if (!query) { panel.hidden = true; panel.innerHTML = ""; return; }
    const results = allFoods().filter(food => food.name.toLowerCase().includes(query)).slice(0, 8);
    panel.hidden = false;
    panel.innerHTML = `<div class="search-result-heading"><strong>Food database</strong><span>${results.length} matches</span></div>${results.length ? results.map(food => `<div class="search-result-row"><span class="food-entry-icon">${escapeHTML(food.emoji || "◉")}</span><div><strong>${escapeHTML(food.name)}</strong><small>${number(food.calories)} kcal · per 100 g</small></div><button class="button button-secondary" data-add-food-id="${escapeHTML(food.id)}">＋ Add</button></div>`).join("") : `<div class="empty-panel">No matching food. Try another keyword or create a custom food.</div>`}`;
  }
  function renderFrequentFoods() {
    const frequent = ["Boiled egg", "Apple", "Almonds"].map(name => allFoods().find(food => food.name.toLowerCase() === name.toLowerCase())).filter(Boolean);
    $("#frequentlyAdded").innerHTML = frequent.map(food => `<div class="frequent-food"><span>${escapeHTML(food.name)} · ${number(food.calories)} kcal</span><button data-add-food-id="${escapeHTML(food.id)}" aria-label="Tambah ${escapeHTML(food.name)}">＋</button></div>`).join("") || `<p class="muted small">Frequent foods will appear here.</p>`;
  }
  async function addFood(food, grams, meal) {
    if (!food) return;
    const quantity = clamp(Number(grams) || 100, 1, 2500);
    const normalizedMeal = normalizeMeal(meal);
    if (activeUserId && !supabase) {
      showToast("Cloud connection unavailable. Food was not saved.");
      return;
    }
    if (activeUserId && supabase) {
      try {
        const { data, error } = await supabase.from("food_entries").insert({
          user_id: activeUserId, food_id: food.id, food_name: food.name, meal_type: normalizedMeal,
          entry_date: todayISO(), quantity_grams: quantity, calories_per_100g: food.calories,
          protein_per_100g: food.protein, carbs_per_100g: food.carbs, fat_per_100g: food.fat
        }).select("id,food_id,food_name,meal_type,entry_date,quantity_grams,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,logged_at").single();
        if (error) throw error;
        state.diary[todayISO()] = [...getEntries(), mapCloudEntry(data)];
        state.weeklyLogged[6] = true; persist(); renderAll(); showToast(`${food.name} added to your cloud diary.`);
      } catch (error) {
        console.error("NutriTrack: gagal menyimpan food entry.", error);
        showToast(`Food belum tersimpan: ${error.message || "coba lagi"}`);
      }
      return;
    }
    const entry = { ...food, entryId: `entry-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, grams: quantity, meal: normalizedMeal, createdAt: Date.now() };
    state.diary[todayISO()] = [...getEntries(), entry];
    state.weeklyLogged[6] = true; persist(); renderAll(); showToast(`${food.name} added to your diary.`);
  }

  async function removeFoodEntry(entryId) {
    if (activeUserId && supabase) {
      try {
        const { data, error } = await supabase.from("food_entries").delete()
          .eq("id", entryId).eq("user_id", activeUserId).select("id").maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Food entry was not found in your account.");
      } catch (error) {
        console.error("NutriTrack: gagal menghapus food entry.", error);
        showToast(`Food belum bisa dihapus: ${error.message || "coba lagi"}`);
        return;
      }
    }
    state.diary[todayISO()] = getEntries().filter(item => item.entryId !== entryId);
    persist(); renderAll(); showToast("Food entry removed.");
  }

  function showEditFoodEntryModal(entry) {
    if (!entry) return;
    openModal("Edit food entry", "FOOD DIARY", `<form id="editFoodEntryForm"><div class="modal-form"><div class="field"><label for="editFoodGrams">Portion size (grams)</label><input id="editFoodGrams" type="number" min="1" max="2500" step="1" value="${Number(entry.grams) || 100}" required></div><div class="field"><label for="editFoodMeal">Meal</label><select id="editFoodMeal"><option ${normalizeMeal(entry.meal) === "Breakfast" ? "selected" : ""}>Breakfast</option><option ${normalizeMeal(entry.meal) === "Lunch" ? "selected" : ""}>Lunch</option><option ${normalizeMeal(entry.meal) === "Snacks" ? "selected" : ""}>Snacks</option><option ${normalizeMeal(entry.meal) === "Dinner" ? "selected" : ""}>Dinner</option></select></div></div><p class="modal-note">${escapeHTML(entry.name)} · Nutrition values are based on the selected food per 100 g.</p><div class="modal-actions"><button type="button" class="button button-secondary" id="cancelModal">Cancel</button><button type="submit" class="button button-primary">Save changes</button></div><input type="hidden" id="editFoodEntryId" value="${escapeHTML(entry.entryId)}"></form>`);
  }

  async function saveFoodEntryEdit(entryId, grams, meal) {
    const quantity = clamp(Number(grams) || 100, 1, 2500);
    const normalizedMeal = normalizeMeal(meal);
    if (activeUserId && supabase) {
      try {
        const { data, error } = await supabase.from("food_entries")
          .update({ quantity_grams: quantity, meal_type: normalizedMeal })
          .eq("id", entryId).eq("user_id", activeUserId).select("id").maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Food entry was not found in your account.");
      } catch (error) {
        console.error("NutriTrack: gagal mengubah food entry.", error);
        showToast(`Perubahan belum tersimpan: ${error.message || "coba lagi"}`);
        return false;
      }
    }
    state.diary[todayISO()] = getEntries().map(item => item.entryId === entryId ? { ...item, grams: quantity, meal: normalizedMeal, category: normalizedMeal } : item);
    persist(); renderAll(); showToast("Food entry updated.");
    return true;
  }

  function calculateTargets(profile) {
    const weight = Number(profile.weight), height = Number(profile.height), age = Number(profile.age);
    const sexAdjustment = profile.sex === "female" ? -161 : profile.sex === "male" ? 5 : -78;
    const bmr = 10 * weight + 6.25 * height - 5 * age + sexAdjustment;
    const tdee = bmr * Number(profile.activity || 1.55);
    const weeklyChange = Number(profile.pace || .4);
    let calories = tdee;
    if (profile.goal === "cutting") calories -= weeklyChange * 7700 / 7;
    if (profile.goal === "bulking") calories += weeklyChange * 7700 / 7;
    calories = clamp(calories, 1200, 5000);
    const protein = Math.round(weight * 1.8);
    const fat = Math.round(weight * .75);
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
    return { calories: Math.round(calories / 25) * 25, protein, carbs, fat, maintenance: Math.round(tdee / 25) * 25, bmr: Math.round(bmr) };
  }
  function readGoalForm() {
    return {
      ...state.profile,
      age: Number($("#goalAge").value), height: Number($("#goalHeight").value), weight: Number($("#goalWeight").value),
      activity: Number($("#goalActivity").value), sex: $("#goalSex").value,
      pace: Number($("#paceRange").value)
    };
  }
  function renderGoalsPage() {
    const p = state.profile;
    $("#goalAge").value = p.age; $("#goalHeight").value = p.height; $("#goalWeight").value = p.weight;
    $("#goalActivity").value = String(p.activity); $("#goalSex").value = p.sex; $("#paceRange").value = p.pace || .4;
    $$(".goal-option").forEach(button => button.classList.toggle("selected", button.dataset.goal === p.goal));
    updateGoalEstimate();
  }
  function updateGoalEstimate() {
    const profile = readGoalForm();
    if (!(profile.age > 0 && profile.height > 0 && profile.weight > 0)) return;
    const estimate = calculateTargets(profile);
    $("#paceValue").textContent = `${decimal(profile.pace)} kg / week`;
    $("#maintenanceValue").textContent = `${number(estimate.maintenance)} kcal`;
    $("#targetCalories").textContent = `${number(estimate.calories)} kcal`;
    const difference = estimate.calories - estimate.maintenance;
    $("#targetDifference").textContent = profile.goal === "maintenance" ? "Around your estimated maintenance" : `About ${number(Math.abs(difference))} kcal ${difference < 0 ? "below" : "above"} maintenance`;
    const progress = profile.goal === "maintenance" ? 100 : clamp(estimate.calories / Math.max(1, estimate.maintenance) * 100, 0, 100);
    $("#targetBar").style.width = `${progress}%`;
    $("#targetPace").textContent = `${profile.goal === "cutting" ? "−" : profile.goal === "bulking" ? "+" : "±"}${decimal(profile.pace)} kg / week`;
    $("#goalMacroRows").innerHTML = macroRowsHTML({ protein: 0, carbs: 0, fat: 0 }, estimate).replace(/0 \/ /g, "");
    // The goal preview only displays target quantities, not current intake.
    $$("#goalMacroRows .macro-row").forEach((row, index) => {
      const target = [estimate.protein, estimate.carbs, estimate.fat][index];
      row.querySelector(".macro-row-head").innerHTML = `<span>${["Protein", "Carbohydrates", "Fat"][index]}</span><strong>${number(target)} g</strong>`;
      row.querySelector(".progress-fill").style.width = `${[30, 58, 26][index]}%`;
    });
    return estimate;
  }
  async function saveGoals() {
    const form = $("#goalForm"); if (!form.reportValidity()) return;
    const profile = readGoalForm(); const estimate = calculateTargets(profile);
    const nextTargets = { calories: estimate.calories, protein: estimate.protein, carbs: estimate.carbs, fat: estimate.fat, maintenance: estimate.maintenance };
    const profilePatch = {
      age: Number(profile.age),
      gender: genderToDb(profile.sex),
      height_cm: Number(profile.height),
      current_weight_kg: Number(profile.weight),
      activity_level: Number(profile.activity),
      goal_type: profile.goal,
      goal_weight_kg: Number(profile.goalWeight),
      goal_pace_kg: Number(profile.pace)
    };
    const saveButton = $("#saveGoals");
    saveButton.disabled = true; saveButton.textContent = "Saving…";
    try {
      if (activeUserId) await saveCloudProfile(profilePatch, {
        calories: nextTargets.calories,
        maintenance_calories: nextTargets.maintenance,
        protein_g: nextTargets.protein,
        carbs_g: nextTargets.carbs,
        fat_g: nextTargets.fat
      });
      state.profile = { ...state.profile, ...profile };
      state.targets = nextTargets;
      persist(); renderAll();
      showToast(activeUserId ? "Goals and nutrition targets synced to Supabase." : "Your goals have been saved on this device.");
    } catch (error) {
      console.error("NutriTrack: goals/targets save failed", error);
      showToast(`Goals were not synced: ${error.message || "please try again"}`);
    } finally {
      saveButton.disabled = false; saveButton.textContent = "Save my goals";
    }
  }

  function renderProgressPage() {
    const weights = [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
    const current = weights.length ? weights[weights.length - 1].weight : state.profile.weight;
    const starting = Number(state.startWeight || weights[0]?.weight || current);
    const goal = Number(state.profile.goalWeight || 68);
    const delta = current - starting;
    const denominator = Math.max(.1, starting - goal);
    const completed = clamp((starting - current) / denominator * 100, 0, 100);
    const remaining = Math.max(0, current - goal);
    const weekDelta = weights.length > 1 ? (weights[weights.length - 1].weight - weights[Math.max(0, weights.length - 2)].weight) : 0;
    const consistency = Math.round((state.weeklyLogged.filter(Boolean).length / Math.max(1, state.weeklyLogged.length)) * 100);
    $("#currentWeightMetric").textContent = `${decimal(current)} kg`;
    $("#weightDeltaMetric").textContent = `${delta > 0 ? "+" : "−"}${decimal(Math.abs(delta))} kg from starting weight`;
    $("#goalProgressMetric").textContent = `${Math.round(completed)}% complete`;
    $("#goalProgressHint").textContent = `${decimal(remaining)} kg to reach your goal`;
    $("#consistencyMetric").textContent = `${consistency}%`;
    $("#consistencyHint").textContent = `${state.weeklyLogged.filter(Boolean).length} of 7 days logged this week`;
    $("#chartCurrentWeight").textContent = `${decimal(current)} kg`;
    $("#goalStartWeight").textContent = `Start ${decimal(starting)} kg`;
    $("#goalEndWeight").textContent = `Goal ${decimal(goal)} kg`;
    $("#goalProgressBar").style.width = `${completed}%`;
    $("#goalPercentText").textContent = `${Math.round(completed)}% of your total journey completed`;
    $("#goalRemaining").textContent = `${decimal(remaining)} kg`;
    $("#weeklyAverage").textContent = `${weekDelta > 0 ? "+" : "−"}${decimal(Math.abs(weekDelta))} kg`;
    let milestone;
    if (state.profile.goal === "bulking") milestone = Math.min(goal, Math.ceil((current + .01) / 2.5) * 2.5);
    else if (state.profile.goal === "maintenance") milestone = current;
    else milestone = Math.max(goal, Math.floor((current - .01) / 2.5) * 2.5);
    const milestoneGap = state.profile.goal === "bulking" ? Math.max(0, milestone - current) : Math.max(0, current - milestone);
    $("#nextMilestone").textContent = state.profile.goal === "maintenance" ? "Keep your current routine" : `${decimal(milestone)} kg · ${decimal(milestoneGap)} kg to go`;
    $("#weeklyConsistencyLabel").textContent = `${state.weeklyLogged.filter(Boolean).length} / 7 days`;
    $("#weeklyConsistencyValue").textContent = `${consistency}%`;
    $("#weekDots").innerHTML = ["M", "T", "W", "T", "F", "S", "S"].map((day, index) => `<span class="week-dot ${state.weeklyLogged[index] ? "done" : ""}" data-day="${day}" aria-label="${day} ${state.weeklyLogged[index] ? "logged" : "not logged"}"></span>`).join("");
    const calorieValues = calorieSeries();
    const average = calorieValues.reduce((sum, entry) => sum + entry.calories, 0) / Math.max(1, calorieValues.length);
    $("#calorieAverage").textContent = `${number(average)} kcal avg.`;
    $("#chartCalorieTarget").textContent = `${number(state.targets.calories)} kcal`;
    $("#progressEncouragement").textContent = delta <= 0 ? "Nice work! Your average weight has moved down steadily. Keep focusing on repeatable habits." : "Progress can move in different directions from week to week. Keep tracking consistently and review the longer-term trend.";
    $("#weightTrendPeriod").textContent = `Your weight over the selected period (${currentProgressPeriod.toLowerCase()})`;
    renderWeightChart(weights); renderWeightHistoryList(weights); renderCalorieChart(calorieValues);
  }
  function calorieSeries() {
    const map = new Map(state.calorieHistory.map(item => [item.date, item]));
    return Array.from({ length: 7 }, (_, i) => {
      const date = shiftDate(i - 6);
      const entry = map.get(date);
      return entry || { date, calories: 0, logged: false };
    });
  }
  function renderWeightChart(weights) {
    const count = currentProgressPeriod === "7D" ? 2 : currentProgressPeriod === "30D" ? 5 : currentProgressPeriod === "90D" ? 8 : 8;
    const points = weights.slice(-count);
    if (points.length < 2) { $("#weightChart").innerHTML = `<div class="empty-panel">Add at least two weight entries to see your trend.</div>`; return; }
    const width = 680, height = 215, left = 46, right = 12, top = 12, bottom = 26;
    const values = points.map(item => Number(item.weight)).filter(Number.isFinite);
    const goalWeight = Number(state.profile.goalWeight);
    const scaleValues = Number.isFinite(goalWeight) && goalWeight > 0 ? [...values, goalWeight] : values;
    const min = Math.min(...scaleValues) - .7;
    const max = Math.max(...scaleValues) + .7;
    const x = i => left + i * (width - left - right) / Math.max(1, points.length - 1);
    const y = value => top + (max - value) * (height - top - bottom) / Math.max(.1, max - min);
    const grid = [0, 1, 2, 3].map(i => {
      const val = max - i * (max - min) / 3; const yy = y(val);
      return `<line x1="${left}" y1="${yy}" x2="${width}" y2="${yy}" stroke="#2b342e" stroke-width="1"/><text x="2" y="${yy + 4}">${decimal(val)} kg</text>`;
    }).join("");
    const path = points.map((item, i) => `${i ? "L" : "M"}${x(i)},${y(item.weight)}`).join(" ");
    const goalY = Number.isFinite(goalWeight) && goalWeight > 0 ? y(goalWeight) : null;
    const dots = points.map((item, i) => `<circle cx="${x(i)}" cy="${y(item.weight)}" r="4.5" fill="#b8f34a" stroke="#141816" stroke-width="2"><title>${formatDate(item.date)}: ${decimal(item.weight)} kg</title></circle>`).join("");
    const labels = points.map((item, i) => i % Math.max(1, Math.ceil(points.length / 5)) === 0 || i === points.length - 1 ? `<text x="${x(i)}" y="${height - 3}" text-anchor="middle">${formatDate(item.date, { month: "short", day: "2-digit" }).toUpperCase()}</text>` : "").join("");
    const goalLine = goalY === null ? "" : `<line x1="${left}" y1="${goalY}" x2="${width - right}" y2="${goalY}" stroke="#e3b54f" stroke-width="2" stroke-dasharray="7 6"/>`;
    $("#weightChart").innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${grid}${goalLine}<path d="${path}" fill="none" stroke="#b8f34a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg>`;
  }
  function renderCalorieChart(series) {
    const max = Math.max(state.targets.calories, ...series.map(item => item.calories), 500) * 1.12;
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    $("#calorieChart").innerHTML = series.map((item, index) => `<div class="bar-column"><span class="bar-value">${item.calories ? number(item.calories) : "—"}</span><span class="bar" style="height:${item.calories ? Math.max(4, item.calories / max * 100) : 3}%"></span><small>${days[index]}</small></div>`).join("");
  }
  function renderWeightHistoryList(weights = state.weights) {
    const container = $("#weightHistoryList");
    if (!container) return;
    const recent = [...weights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
    if (!recent.length) {
      container.innerHTML = '<p class="weight-history-empty">No weight entries yet. Add your first measurement to start tracking.</p>';
      return;
    }
    container.innerHTML = recent.map(item => {
      const key = item.id || item.date;
      return `<div class="weight-history-row"><div class="weight-history-value"><strong>${decimal(item.weight)} kg</strong><small>${escapeHTML(formatDate(item.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }))}</small></div><div class="weight-history-actions"><button type="button" class="text-button" data-edit-weight="${escapeHTML(key)}" aria-label="Edit weight entry for ${escapeHTML(item.date)}">Edit</button><button type="button" class="text-button danger" data-delete-weight="${escapeHTML(key)}" aria-label="Delete weight entry for ${escapeHTML(item.date)}">Delete</button></div></div>`;
    }).join("");
  }

  async function updateCloudCurrentWeight() {
    if (!activeUserId || !window.NUTRITRACK_SUPABASE) return;
    const latest = [...state.weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    const { error } = await window.NUTRITRACK_SUPABASE
      .from("profiles")
      .update({ current_weight_kg: latest ? Number(latest.weight) : null })
      .eq("id", activeUserId);
    if (error) throw error;
    if (latest) state.profile.weight = Number(latest.weight);
  }

  async function syncWeightHistory(userId, onboardingWeight) {
    const client = window.NUTRITRACK_SUPABASE;
    if (!client || !userId) return;
    const { data: remoteRows, error: readError } = await client
      .from("weight_logs")
      .select("id, measured_on, weight_kg, note")
      .eq("user_id", userId)
      .order("measured_on", { ascending: true });
    if (readError) throw readError;

    // First cloud sign-in: migrate the signed-in browser's locally saved measurements.
    // Existing cloud records always win on later logins.
    if (!remoteRows?.length) {
      const localByDate = new Map();
      for (const item of (Array.isArray(state.weights) ? state.weights : [])) {
        const date = String(item.date || "");
        const weight = Number(item.weight);
        if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(weight) && weight >= 25 && weight <= 350) {
          localByDate.set(date, { user_id: userId, measured_on: date, weight_kg: weight, note: item.note || null });
        }
      }
      if (!localByDate.size && Number(onboardingWeight) >= 25 && Number(onboardingWeight) <= 350) {
        localByDate.set(todayISO(), { user_id: userId, measured_on: todayISO(), weight_kg: Number(onboardingWeight), note: "Starting weight from onboarding" });
      }
      if (localByDate.size) {
        const { error: migrateError } = await client
          .from("weight_logs")
          .upsert([...localByDate.values()], { onConflict: "user_id,measured_on" });
        if (migrateError) throw migrateError;
      }
    }

    const { data: rows, error } = await client
      .from("weight_logs")
      .select("id, measured_on, weight_kg, note")
      .eq("user_id", userId)
      .order("measured_on", { ascending: true });
    if (error) throw error;
    state.weights = (rows || []).map(row => ({
      id: row.id,
      date: row.measured_on,
      weight: Number(row.weight_kg),
      note: row.note || ""
    }));
    if (state.weights.length) {
      state.startWeight = Number(state.startWeight) || state.weights[0].weight;
      await updateCloudCurrentWeight();
    }
    persist();
  }

  async function addWeight(date, weight) {
    const client = window.NUTRITRACK_SUPABASE;
    let savedRow = null;
    if (activeUserId && client) {
      const { data, error } = await client.from("weight_logs").upsert({
        user_id: activeUserId,
        measured_on: date,
        weight_kg: weight
      }, { onConflict: "user_id,measured_on" }).select("id, measured_on, weight_kg, note").single();
      if (error) { console.error("NutriTrack: weight save failed", error); showToast(`Could not save weight: ${error.message}`); return false; }
      savedRow = data;
    }
    const existing = state.weights.findIndex(item => item.date === date);
    const normalized = savedRow ? { id: savedRow.id, date: savedRow.measured_on, weight: Number(savedRow.weight_kg), note: savedRow.note || "" } : { date, weight };
    if (existing >= 0) state.weights[existing] = { ...state.weights[existing], ...normalized };
    else state.weights.push(normalized);
    state.weights.sort((a, b) => a.date.localeCompare(b.date));
    if (!state.startWeight) state.startWeight = state.weights[0]?.weight || weight;
    state.weeklyLogged[6] = true;
    if (activeUserId && client) {
      try { await updateCloudCurrentWeight(); }
      catch (error) { console.warn("NutriTrack: current profile weight did not refresh", error); }
    } else state.profile.weight = weight;
    persist(); renderProgressPage(); renderDashboard(); showToast("Weight entry saved.");
    return true;
  }

  async function editWeight(key, date, weight) {
    const item = state.weights.find(entry => String(entry.id || entry.date) === String(key));
    if (!item) return false;
    const client = window.NUTRITRACK_SUPABASE;
    if (activeUserId && client && item.id) {
      const { data, error } = await client.from("weight_logs")
        .update({ measured_on: date, weight_kg: weight })
        .eq("id", item.id).eq("user_id", activeUserId)
        .select("id, measured_on, weight_kg, note").maybeSingle();
      if (error) { showToast(`Could not update weight: ${error.message}`); return false; }
      if (!data) { showToast("Weight entry was not found in your account."); return false; }
      Object.assign(item, { id: data.id, date: data.measured_on, weight: Number(data.weight_kg), note: data.note || "" });
    }
    const next = state.weights.filter(entry => entry !== item && entry.date !== date);
    next.push({ ...item, date, weight });
    state.weights = next.sort((a, b) => a.date.localeCompare(b.date));
    if (activeUserId && client) {
      try { await updateCloudCurrentWeight(); } catch (error) { console.warn(error); }
    } else state.profile.weight = state.weights.at(-1)?.weight ?? state.profile.weight;
    persist(); renderProgressPage(); renderDashboard(); showToast("Weight entry updated.");
    return true;
  }

  async function deleteWeight(key) {
    const item = state.weights.find(entry => String(entry.id || entry.date) === String(key));
    if (!item) return;
    const client = window.NUTRITRACK_SUPABASE;
    if (activeUserId && client && item.id) {
      const { data, error } = await client.from("weight_logs").delete()
        .eq("id", item.id).eq("user_id", activeUserId).select("id").maybeSingle();
      if (error) { showToast(`Could not delete weight: ${error.message}`); return; }
      if (!data) { showToast("Weight entry was not found in your account."); return; }
    }
    state.weights = state.weights.filter(entry => entry !== item);
    if (activeUserId && client) {
      try { await updateCloudCurrentWeight(); } catch (error) { console.warn(error); }
    } else state.profile.weight = state.weights.at(-1)?.weight ?? state.profile.weight;
    if (state.weights.length) state.startWeight = state.weights[0].weight;
    persist(); renderProgressPage(); renderDashboard(); showToast("Weight entry deleted.");
  }

  function createConversationId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, character => {
      const random = Math.random() * 16 | 0;
      return (character === "x" ? random : (random & 0x3 | 0x8)).toString(16);
    });
  }
  function formatCoachTime(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime())
      ? new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date())
      : new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  async function loadCloudCoachMessages() {
    if (!supabase || !activeUserId) return;
    const localMessages = Array.isArray(state.coachMessages) ? state.coachMessages.slice(-24) : [];
    const { data: latestRows, error: latestError } = await supabase
      .from("coach_messages")
      .select("conversation_id,created_at")
      .eq("user_id", activeUserId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (latestError) throw latestError;

    if (!latestRows?.length) {
      activeCoachConversationId = createConversationId();
      // Preserve and migrate any browser-saved chat once, only when this account has no cloud chat yet.
      if (localMessages.length) {
        const migrationRows = localMessages.map((message, index) => ({
          user_id: activeUserId,
          conversation_id: activeCoachConversationId,
          role: message.role === "user" ? "user" : "assistant",
          content: String(message.text || "").trim().slice(0, 5000),
          created_at: new Date(Date.now() - (localMessages.length - index) * 1000).toISOString()
        })).filter(row => row.content.length > 0);
        if (migrationRows.length) {
          const { error: migrationError } = await supabase.from("coach_messages").insert(migrationRows);
          if (migrationError) throw migrationError;
        }
      }
      state.coachMessages = localMessages;
      persist();
      return;
    }

    activeCoachConversationId = latestRows[0].conversation_id;
    const { data: rows, error } = await supabase
      .from("coach_messages")
      .select("id,conversation_id,role,content,created_at")
      .eq("user_id", activeUserId)
      .eq("conversation_id", activeCoachConversationId)
      .order("created_at", { ascending: true })
      .limit(40);
    if (error) throw error;
    state.coachMessages = (rows || []).map(row => ({
      role: row.role,
      text: row.content,
      time: formatCoachTime(row.created_at),
      createdAt: row.created_at
    }));
    persist();
  }

  async function persistCoachMessages(messages) {
    if (!activeUserId) return;
    if (!supabase) throw new Error("Supabase connection is unavailable. This chat was only saved on this device.");
    if (!activeCoachConversationId) activeCoachConversationId = createConversationId();
    const rows = messages.map((message, index) => ({
      user_id: activeUserId,
      conversation_id: activeCoachConversationId,
      role: message.role,
      content: String(message.text || "").trim().slice(0, 5000),
      created_at: new Date(Date.now() + index).toISOString()
    })).filter(row => row.content.length > 0);
    if (!rows.length) return;
    const { error } = await supabase.from("coach_messages").insert(rows);
    if (error) throw error;
  }

  function coachWeightSummary() {
    const rows = (Array.isArray(state.weights) ? state.weights : [])
      .filter(item => item && item.date && Number.isFinite(Number(item.weight)))
      .slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (!rows.length) return null;
    const latest = rows[rows.length - 1];
    const previous = rows.length > 1 ? rows[rows.length - 2] : null;
    return {
      latest: Number(latest.weight),
      date: latest.date,
      change: previous ? Number((Number(latest.weight) - Number(previous.weight)).toFixed(1)) : null,
      goal: Number(state.profile.goalWeight) || null,
      count: rows.length
    };
  }

  function ruleBasedAnswer(question) {
    const q = String(question || "").toLowerCase();
    const totals = totalsToday();
    const targets = state.targets;
    const profile = state.profile;
    const proteinGap = Math.max(0, Math.round(targets.protein - totals.protein));
    const calorieGap = Math.round(targets.calories - totals.calories);
    const waterLeft = Math.max(0, Number(state.waterTarget || 0) - currentWater());
    const weight = coachWeightSummary();
    const entries = getEntries();
    const foodsLogged = entries.map(entry => entry.name).filter(Boolean);

    if (q.includes("weight") || q.includes("berat") || q.includes("progress") || q.includes("trend")) {
      if (!weight) return "I don't have a saved weight measurement yet. Add one in Progress & Analytics and I can help you read the trend over time.";
      const changeText = weight.change == null
        ? "This is your first saved measurement, so there isn't an earlier point to compare yet."
        : weight.change === 0
          ? "Your latest measurement is unchanged from the previous log."
          : `That's ${Math.abs(weight.change).toFixed(1)} kg ${weight.change > 0 ? "higher" : "lower"} than your previous log.`;
      const goalText = weight.goal
        ? ` Your saved goal is ${decimal(weight.goal)} kg, about ${decimal(Math.abs(weight.latest - weight.goal))} kg ${weight.latest > weight.goal ? "above" : weight.latest < weight.goal ? "below" : "from"} that target.`
        : " Add a goal weight in Goals & Calculator if you want a reference point.";
      return `Your latest saved weight is ${decimal(weight.latest)} kg (${formatDate(weight.date, { day: "numeric", month: "short", year: "numeric" })}). ${changeText}${goalText} Weight naturally fluctuates, so use several weeks of measurements rather than reacting to one reading.`;
    }
    if (q.includes("protein") || q.includes("snack")) {
      if (!proteinGap) return `Your food diary shows about ${number(totals.protein)} g protein today, which meets your saved ${number(targets.protein)} g target. You can focus on balanced meals and foods you enjoy rather than forcing extra protein.`;
      const options = profile.goal === "bulking" ? "Greek yogurt, eggs, tofu, tempeh, chicken, or fish" : "Greek yogurt, eggs, tofu, tempeh, beans, or fish";
      return `Based on today's saved diary, you've logged about ${number(totals.protein)} g of protein out of ${number(targets.protein)} g, leaving roughly ${proteinGap} g against your estimate. Practical options include ${options}. Pick a portion that fits your appetite and remaining energy needs.`;
    }
    if (q.includes("calorie") || q.includes("kalori") || q.includes("review") || q.includes("ate today") || q.includes("food diary")) {
      const mealText = foodsLogged.length ? ` Your logged foods include ${foodsLogged.slice(0, 5).join(", ")}${foodsLogged.length > 5 ? ", and more" : ""}.` : " You haven't logged any food for today yet.";
      return `Your diary currently shows ${number(totals.calories)} kcal out of your saved ${number(targets.calories)} kcal target. ${calorieGap >= 0 ? `That leaves around ${number(calorieGap)} kcal against your estimate.` : `You're around ${number(Math.abs(calorieGap))} kcal above the estimate.`} Protein is ${number(totals.protein)} g, carbohydrates ${number(totals.carbs)} g, and fat ${number(totals.fat)} g.${mealText} One day does not determine your progress; look at patterns over time and avoid extreme compensation.`;
    }
    if (q.includes("water") || q.includes("hydration") || q.includes("drink")) {
      return `Your cloud-synced water log shows ${decimal2(currentWater())} L today, against your saved reference of ${decimal2(state.waterTarget)} L. That's approximately ${decimal2(waterLeft)} L remaining. Adjust fluid intake to your needs, activity, and environment.`;
    }
    if (q.includes("balanced") || q.includes("plate") || q.includes("meal")) {
      const proteinSuggestion = proteinGap > 15 ? "Add a protein source such as tofu, tempeh, eggs, fish, or chicken" : "Include a comfortable protein portion";
      return `For a balanced plate, ${proteinSuggestion}, add vegetables or fruit, and include a carbohydrate source such as rice, potatoes, or oats, with some healthy fats. Your current diary is ${number(totals.calories)} kcal and ${number(totals.protein)} g protein today. Portion needs vary, so use your saved targets as a guide rather than a strict rule.`;
    }
    if (q.includes("macro") || q.includes("carb") || q.includes("fat")) {
      return `Your saved daily estimates are ${number(targets.protein)} g protein, ${number(targets.carbs)} g carbohydrates, and ${number(targets.fat)} g fat. Today's diary currently has ${number(totals.protein)} g protein, ${number(totals.carbs)} g carbohydrates, and ${number(totals.fat)} g fat. These are guides, not strict pass-or-fail numbers.`;
    }
    if (profile.goal === "cutting") return `Your saved goal is gradual weight loss. Today's diary is ${number(totals.calories)} / ${number(targets.calories)} kcal, and hydration is ${decimal(currentWater())} / ${decimal(state.waterTarget)} L. Focus on repeatable habits: regular meals, enough protein and fiber, and movement you enjoy. Use your weight trend over several weeks rather than reacting to a single day.`;
    if (profile.goal === "bulking") return `Your saved goal is gradual weight gain. Today's diary is ${number(totals.calories)} / ${number(targets.calories)} kcal with ${number(totals.protein)} / ${number(targets.protein)} g protein; water is ${decimal(currentWater())} / ${decimal(state.waterTarget)} L. Consistent meals, protein across the day, and a suitable strength-training routine can support your plan. Track trends over several weeks.`;
    return `Your saved goal is maintenance. Today's diary is ${number(totals.calories)} / ${number(targets.calories)} kcal, and water is ${decimal(currentWater())} / ${decimal(state.waterTarget)} L. Keep logging consistently and review patterns over several weeks. Choose a routine that supports your energy and day-to-day life.`;
  }
  function renderCoachPage() {
    const firstName = String(state.profile.name || "").trim().split(/\s+/)[0] || "there";
    $("#coachName").textContent = firstName;
    const totals = totalsToday(), targets = state.targets;
    $("#coachCalories").textContent = `${number(totals.calories)} / ${number(targets.calories)} kcal`;
    setProgressBar("#coachCalorieBar", totals.calories, targets.calories);
    $("#coachMacroRows").innerHTML = macroRowsHTML(totals, targets);

    const proteinGap = Math.max(0, Math.round(targets.protein - totals.protein));
    const waterGap = Math.max(0, Number(state.waterTarget || 0) - currentWater());
    const calorieGap = Math.round(targets.calories - totals.calories);
    const weight = coachWeightSummary();
    let nextTitle = "Keep your balanced routine";
    let nextText = "Your logged intake is close to your current estimates. Keep choosing meals and habits that feel sustainable.";
    let foodName = "Balanced meal";
    let foodDetail = "A mix of protein, produce, and energy foods";
    if (proteinGap >= 15) {
      nextTitle = "Make room for a protein source";
      nextText = `Today's diary has ${number(totals.protein)} g protein so far, around ${proteinGap} g below your saved target.`;
      foodName = profileFoodSuggestion(state.profile.goal);
      foodDetail = "Choose a portion that fits your appetite";
    } else if (waterGap >= 0.25) {
      nextTitle = "Check in with your hydration";
      nextText = `Your water log is ${decimal2(currentWater())} L today, about ${decimal2(waterGap)} L below your saved reference.`;
      foodName = "A glass of water";
      foodDetail = "250 ml per glass";
    } else if (state.profile.goal === "bulking" && calorieGap > 350) {
      nextTitle = "Plan a satisfying extra meal";
      nextText = `You have logged ${number(totals.calories)} kcal so far. A nourishing meal or snack may help you approach your saved goal.`;
      foodName = "Yogurt, oats & fruit";
      foodDetail = "An easy energy-and-protein option";
    } else if (state.profile.goal === "cutting" && calorieGap < 0) {
      nextTitle = "Return to your usual routine";
      nextText = "One higher-calorie day does not define progress. Avoid skipping meals or trying to compensate; look at your weekly pattern.";
    }
    $("#coachNextTitle").textContent = nextTitle;
    $("#coachNextText").textContent = nextText;
    $("#coachFoodName").textContent = foodName;
    $("#coachFoodDetail").textContent = foodDetail;

    const contextLine = $("#coachContextLine");
    if (contextLine) {
      const weightText = weight ? `Latest weight ${decimal(weight.latest)} kg` : "No weight log yet";
      contextLine.textContent = `Water ${decimal2(currentWater())} / ${decimal2(state.waterTarget)} L · ${weightText}`;
    }

    const thread = $("#chatThread");
    const coachView = $("#view-coach");
    const status = $("#coachStatus");
    if (coachView) coachView.classList.toggle("has-chat", state.coachMessages.length > 0);
    if (status) status.innerHTML = activeUserId ? "<i></i> GEMINI AI · GENERAL GUIDANCE" : "<i></i> DEMO MODE · LOCAL REPLIES";
    const sourceLabel = activeUserId ? "Gemini AI · General nutrition guidance" : "Demo guidance · Local sample data only";
    if (!state.coachMessages.length) {
      const opening = activeUserId
        ? "I can help with general nutrition questions, meal ideas, and healthy habits. Your saved profile, measurements, and food diary stay in NutriTrack and are not sent to Gemini."
        : "You're viewing the local demo. Sign in to use Gemini AI; demo replies stay on this device and use sample guidance.";
      thread.innerHTML = `<div class="chat-timestamp">NUTRI COACH · READY</div><div class="chat-bubble assistant">Hi ${escapeHTML(firstName)}! ${escapeHTML(opening)}</div><div class="chat-source">✦ &nbsp;${sourceLabel}</div>`;
    } else {
      thread.innerHTML = state.coachMessages.map(message => `<div class="chat-timestamp">${message.role === "user" ? "YOU" : "NUTRI COACH"} · ${escapeHTML(message.time)}</div><div class="chat-bubble ${message.role}">${escapeHTML(message.text)}</div>${message.role === "assistant" ? `<div class="chat-source">✦ &nbsp;${sourceLabel}</div>` : ""}`).join("");
    }
    const recent = state.coachMessages.filter(message => message.role === "user").slice(-3).reverse();
    if (recent.length) {
      $("#recentTopics").innerHTML = recent.map(message => `<p>${escapeHTML(message.text.slice(0, 34))}${message.text.length > 34 ? "…" : ""}<span>Recent</span></p>`).join("");
    } else {
      $("#recentTopics").innerHTML = `<p>Balanced meal ideas <span>Try asking</span></p><p>Protein and macros <span>Try asking</span></p><p>Everyday hydration tips <span>Try asking</span></p>`;
    }
    // Keep the newest exchange in view whenever the chat is rendered or reopened.
    if (thread) thread.scrollTop = thread.scrollHeight;
  }
  function profileFoodSuggestion(goal) {
    if (goal === "bulking") return "Greek yogurt or tempeh";
    return "Tofu, eggs, or Greek yogurt";
  }
  let coachRequestPending = false;
  async function requestGeminiCoach(message) {
    if (!activeUserId) return ruleBasedAnswer(message);
    if (!supabase?.functions?.invoke) throw new Error("AI service is not available in this session. Please refresh and sign in again.");
    // Only the text typed into the chat is sent. No profile, measurements, diary,
    // targets, weight history, water log, account identifier, or prior chat turns.
    const { data, error } = await supabase.functions.invoke("nutri-coach", { body: { message } });
    if (error) {
      const status = Number(error?.context?.status || error?.status || 0);
      let serverError = null;
      try {
        const response = error?.context;
        if (response && typeof response.clone === "function") {
          serverError = await response.clone().json();
        } else if (response && typeof response.json === "function") {
          serverError = await response.json();
        }
      } catch (_) {
        // Some gateway/runtime errors have no JSON response body.
      }
      const code = String(serverError?.code || "");
      if (status === 401) throw new Error("Your session has expired. Please sign in again to use Nutri Coach AI.");
      if (status === 429 || code === "rate_limited") throw new Error("Gemini's free request limit has been reached for now. Please wait a little and try again.");
      if (code === "missing_api_key") throw new Error("Gemini API key is not available to the Edge Function. Please check the GEMINI_API_KEY secret in this Supabase project.");
      if (code === "model_busy" || status === 503) throw new Error("Gemini is temporarily unavailable or overloaded. This is not necessarily an API-key problem. Please wait a moment and try again.");
      if (code === "timeout" || status === 504) throw new Error("Gemini took too long to respond. Please try again in a moment.");
      if (code === "provider_rejected") throw new Error("Google rejected the Gemini request. The admin should check that the API key is valid and allowed to use the Gemini API.");
      if (code === "model_not_found") throw new Error("The configured Gemini model is currently unavailable. The project admin needs to check the model setting.");
      if (code === "network_error") throw new Error("Nutri Coach could not reach Gemini because of a temporary network problem. Please try again.");
      throw new Error("Nutri Coach AI service returned an unexpected error (HTTP " + (status || "unknown") + "). Please try again; this does not by itself mean the API key is missing.");
    }
    const reply = String(data?.reply || "").trim();
    if (!reply) throw new Error("Nutri Coach AI returned an empty response. Please try asking in a different way.");
    return reply;
  }

  async function sendChat(question) {
    const text = String(question || "").trim();
    if (!text || coachRequestPending) return;
    coachRequestPending = true;
    const input = $("#chatInput");
    const sendButton = $("#chatForm button");
    const promptButtons = $$(".prompt-button");
    input.disabled = true;
    sendButton.disabled = true;
    promptButtons.forEach(button => button.disabled = true);
    sendButton.textContent = "…";

    if (!activeCoachConversationId) activeCoachConversationId = createConversationId();
    const stamp = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    const userMessage = { role: "user", text, time: stamp };
    state.coachMessages.push(userMessage);
    state.coachMessages = state.coachMessages.slice(-24);
    persist();
    renderCoachPage();
    $("#chatThread").scrollTop = $("#chatThread").scrollHeight;

    let replyText = "";
    try {
      replyText = await requestGeminiCoach(text);
    } catch (error) {
      replyText = error?.message || "Nutri Coach AI is temporarily unavailable. Please try again later.";
    }

    const assistantMessage = { role: "assistant", text: replyText, time: new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date()) };
    state.coachMessages.push(assistantMessage);
    state.coachMessages = state.coachMessages.slice(-24);
    persist();
    renderCoachPage();
    $("#chatThread").scrollTop = $("#chatThread").scrollHeight;

    if (activeUserId) {
      const messagesToSave = [userMessage, assistantMessage];
      coachSaveQueue = coachSaveQueue.catch(() => {}).then(() => persistCoachMessages(messagesToSave));
      try {
        await coachSaveQueue;
      } catch (error) {
        console.warn("NutriTrack: coach chat cloud sync failed.");
        showToast("Reply is ready, but chat history could not be synced.");
      }
    }

    coachRequestPending = false;
    input.disabled = false;
    sendButton.disabled = false;
    sendButton.textContent = "↑";
    promptButtons.forEach(button => button.disabled = false);
    input.focus();
  }

  function genderToDb(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (["male", "female", "other"].includes(normalized)) return normalized;
    if (normalized === "prefer not to say" || normalized === "prefer_not_to_say") return "prefer_not_to_say";
    return "prefer_not_to_say";
  }
  function genderToLabel(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "male") return "Male";
    if (normalized === "female") return "Female";
    if (normalized === "other") return "Other";
    return "Prefer not to say";
  }
  function ageFromBirthDate(value, fallback) {
    if (!value) return Number(fallback) || null;
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return Number(fallback) || null;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age--;
    return age >= 13 && age <= 120 ? age : Number(fallback) || null;
  }
  async function saveCloudProfile(profilePatch, targetPatch = null) {
    if (!activeUserId) return;
    if (!supabase) throw new Error("Supabase connection is unavailable. Changes were not synced.");
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles").update(profilePatch).eq("id", activeUserId).select("id").maybeSingle();
    if (profileError) throw profileError;
    if (!profileRow) throw new Error("Your profile row was not found. Please sign out and sign in again to reload your account.");
    if (targetPatch) {
      const { error: targetError } = await supabase.from("nutrition_targets")
        .upsert({ user_id: activeUserId, ...targetPatch }, { onConflict: "user_id" });
      if (targetError) throw targetError;
    }
  }
  async function refreshAccountSettingsFromCloud() {
    if (!activeUserId || !supabase || document.hidden || refreshSettingsInFlight) return;
    refreshSettingsInFlight = true;
    try {
      const [profileResult, targetResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", activeUserId).maybeSingle(),
        supabase.from("nutrition_targets").select("*").eq("user_id", activeUserId).maybeSingle()
      ]);
      if (profileResult.error) throw profileResult.error;
      if (targetResult.error) throw targetResult.error;
      const profile = profileResult.data, targets = targetResult.data;
      if (profile) {
        state.profile = {
          ...state.profile,
          name: profile.full_name ?? state.profile.name,
          email: profile.email ?? state.profile.email,
          age: profile.age ?? state.profile.age,
          birthDate: profile.birth_date || state.profile.birthDate || "",
          gender: genderToLabel(profile.gender), sex: profile.gender === "prefer_not_to_say" ? "other" : (profile.gender || state.profile.sex),
          height: profile.height_cm == null ? state.profile.height : Number(profile.height_cm),
          weight: profile.current_weight_kg == null ? state.profile.weight : Number(profile.current_weight_kg),
          activity: profile.activity_level == null ? state.profile.activity : Number(profile.activity_level),
          goal: profile.goal_type || state.profile.goal,
          goalWeight: profile.goal_weight_kg == null ? state.profile.goalWeight : Number(profile.goal_weight_kg),
          pace: profile.goal_pace_kg == null ? state.profile.pace : Number(profile.goal_pace_kg)
        };
        state.preferences = Array.isArray(profile.dietary_preferences) ? profile.dietary_preferences : state.preferences;
        state.units = { weight: profile.weight_unit || state.units.weight, height: profile.height_unit || state.units.height, energy: profile.energy_unit || state.units.energy };
        state.notifications = { ...state.notifications, ...(profile.notifications || {}) };
      }
      if (targets) state.targets = {
        calories: Number(targets.calories) || state.targets.calories,
        maintenance: Number(targets.maintenance_calories) || Number(targets.calories) || state.targets.maintenance,
        protein: Number(targets.protein_g) || 0, carbs: Number(targets.carbs_g) || 0, fat: Number(targets.fat_g) || 0
      };
      await Promise.all([
        loadCloudWaterLogs(),
        loadCloudFoodDiary(),
        syncWeightHistory(activeUserId, state.profile.weight)
      ]);
      persist();
      renderAll();
    } catch (error) {
      console.warn("NutriTrack: failed to refresh cloud profile/targets and coach context", error);
    } finally {
      refreshSettingsInFlight = false;
    }
  }
  let refreshSettingsInFlight = false;

  function renderSettingsPage() {
    const p = state.profile;
    $("#sidebarName").textContent = p.name || "Your profile"; $("#sidebarAvatar").textContent = initials(p.name);
    $("#largeAvatar").textContent = initials(p.name); $("#profileDisplayName").textContent = p.name;
    $("#profileDisplayEmail").textContent = p.email || "";
    $("#settingsName").value = p.name; $("#settingsEmail").value = p.email;
    const birth = p.birthDate || ""; $("#settingsBirth").value = birth;
    $("#settingsGender").value = genderToLabel(p.gender || p.sex);
    $("#weightUnit").value = state.units.weight; $("#heightUnit").value = state.units.height; $("#energyUnit").value = state.units.energy;
    $("#mealReminder").checked = state.notifications.meal; $("#waterReminder").checked = state.notifications.water; $("#weeklyReminder").checked = state.notifications.weekly;
    $$(".preference-chip").forEach(button => button.classList.toggle("active", state.preferences.includes(button.dataset.preference)));
    $("#saveStatus").textContent = activeUserId ? "● CLOUD SYNC READY" : "● ALL CHANGES SAVED";
  }
  async function saveSettings() {
    const name = $("#settingsName").value.trim(); const email = $("#settingsEmail").value.trim();
    if (!name) { showToast("Please enter your name."); $("#settingsName").focus(); return; }
    if (email && !$("#settingsEmail").checkValidity()) { showToast("Please enter a valid email address."); $("#settingsEmail").focus(); return; }
    const birthDate = $("#settingsBirth").value;
    const genderLabel = $("#settingsGender").value;
    const units = { weight: $("#weightUnit").value, height: $("#heightUnit").value, energy: $("#energyUnit").value };
    const notifications = { meal: $("#mealReminder").checked, water: $("#waterReminder").checked, weekly: $("#weeklyReminder").checked };
    const profilePatch = {
      full_name: name,
      birth_date: birthDate || null,
      age: ageFromBirthDate(birthDate, state.profile.age),
      gender: genderToDb(genderLabel),
      weight_unit: units.weight, height_unit: units.height, energy_unit: units.energy,
      dietary_preferences: [...state.preferences], notifications
    };
    const saveButton = $("#saveSettings");
    saveButton.disabled = true; saveButton.textContent = "Saving…";
    try {
      let emailNotice = "";
      if (activeUserId && supabase) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const currentEmail = authData.user?.email || state.profile.email;
        if (email && currentEmail && email.toLowerCase() !== currentEmail.toLowerCase()) {
          const { error: emailError } = await supabase.auth.updateUser({ email });
          if (emailError) throw emailError;
          emailNotice = " Email change requested; confirm it from your inbox before it takes effect.";
        }
        profilePatch.email = currentEmail;
        await saveCloudProfile(profilePatch);
      } else if (activeUserId) {
        throw new Error("Supabase connection is unavailable. Changes were not synced.");
      }
      state.profile.name = name;
      state.profile.email = activeUserId ? (state.profile.email || email) : email;
      state.profile.birthDate = birthDate;
      state.profile.age = profilePatch.age;
      state.profile.gender = genderLabel;
      state.profile.sex = genderToDb(genderLabel) === "prefer_not_to_say" ? "other" : genderToDb(genderLabel);
      state.units = units; state.notifications = notifications;
      persist(); renderSettingsPage(); renderDashboard(); renderCoachPage();
      showToast((activeUserId ? "Profile and preferences synced to Supabase." : "Settings saved on this device.") + emailNotice);
    } catch (error) {
      console.error("NutriTrack: profile settings save failed", error);
      showToast(`Profile was not synced: ${error.message || "please try again"}`);
      $("#saveStatus").textContent = "● SYNC FAILED";
    } finally {
      saveButton.disabled = false; saveButton.textContent = "Save changes";
    }
  }

  function openModal(title, eyebrow, html) {
    $("#modalTitle").textContent = title; $("#modalEyebrow").textContent = eyebrow;
    $("#modalBody").innerHTML = html; $("#modalBackdrop").hidden = false;
    document.body.classList.add("modal-open");
    const input = $("#modalBody input, #modalBody select"); if (input) setTimeout(() => input.focus(), 30);
  }
  function closeModal() { $("#modalBackdrop").hidden = true; $("#modalBody").innerHTML = ""; document.body.classList.remove("modal-open"); pendingFood = null; pendingWeightEdit = null; }
  function showFoodModal(food = null, custom = false) {
    pendingFood = food;
    const options = allFoods().map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`).join("");
    const picked = food || FOOD_DB[0];
    openModal(custom ? "Create custom food" : "Add food to diary", "FOOD DIARY", `
      <form id="foodModalForm">
        ${custom ? `<div class="modal-form"><div class="field full"><label for="modalFoodName">Food name</label><input id="modalFoodName" required maxlength="70" placeholder="e.g. Homemade chicken wrap"></div><div class="field"><label for="modalCalories">Calories per 100 g</label><input id="modalCalories" type="number" min="0" step="0.1" required></div><div class="field"><label for="modalProtein">Protein (g)</label><input id="modalProtein" type="number" min="0" step="0.1" required></div><div class="field"><label for="modalCarbs">Carbohydrates (g)</label><input id="modalCarbs" type="number" min="0" step="0.1" required></div><div class="field"><label for="modalFat">Fat (g)</label><input id="modalFat" type="number" min="0" step="0.1" required></div></div><p class="modal-note">Enter nutrition values per 100 grams. These values will be saved as a custom food on this device.</p>` : `<div class="modal-form"><div class="field full"><label for="modalFoodSelect">Choose food</label><select id="modalFoodSelect">${options}</select></div><div class="field"><label for="modalFoodGrams">Portion size (grams)</label><input id="modalFoodGrams" type="number" min="1" max="2500" step="1" value="100" required></div><div class="field"><label for="modalFoodMeal">Meal</label><select id="modalFoodMeal"><option>Breakfast</option><option>Lunch</option><option>Snacks</option><option>Dinner</option></select></div></div><p class="modal-note" id="modalFoodNutrition">${number(picked.calories)} kcal · ${decimal(picked.protein)} g protein per 100 g.</p>`}
        <div class="modal-actions"><button type="button" class="button button-secondary" id="cancelModal">Cancel</button><button type="submit" class="button button-primary">${custom ? "Save custom food" : "Add to diary"}</button></div>
      </form>`);
    if (!custom) {
      $("#modalFoodSelect").value = picked.id;
      $("#modalFoodMeal").value = picked.category || "Snacks";
      $("#modalFoodSelect").addEventListener("change", () => {
        const chosen = allFoods().find(item => item.id === $("#modalFoodSelect").value);
        $("#modalFoodMeal").value = chosen.category || "Snacks";
        $("#modalFoodNutrition").textContent = `${number(chosen.calories)} kcal · ${decimal(chosen.protein)} g protein per 100 g.`;
      });
    }
  }
  function showWeightModal(entry = null) {
    pendingWeightEdit = entry ? (entry.id || entry.date) : null;
    const isEdit = Boolean(entry);
    openModal(isEdit ? "Edit weight entry" : "Log your weight", "PROGRESS", `<form id="weightModalForm"><div class="modal-form"><div class="field"><label for="modalWeightDate">Date</label><input id="modalWeightDate" type="date" value="${escapeHTML(entry?.date || todayISO())}" required></div><div class="field"><label for="modalWeightValue">Weight (kg)</label><input id="modalWeightValue" type="number" min="25" max="350" step="0.1" value="${Number(entry?.weight ?? state.profile.weight) || ""}" required></div></div><p class="modal-note">${activeUserId ? "This measurement will sync to your NutriTrack account." : "This measurement is saved on this device in demo mode."}</p><div class="modal-actions"><button type="button" class="button button-secondary" id="cancelModal">Cancel</button><button class="button button-primary" type="submit">${isEdit ? "Save changes" : "Save entry"}</button></div></form>`);
  }
  function exportJSON() {
    const payload = { exportedAt: new Date().toISOString(), app: "NutriTrack", data: state };
    downloadFile(`nutritrack-data-${todayISO()}.json`, JSON.stringify(payload, null, 2), "application/json");
    showToast("Your NutriTrack data has been exported.");
  }
  function exportReportCSV() {
    const rows = [["Date", "Calories", "Weight (kg)"], ...state.calorieHistory.map(entry => [entry.date, entry.calories, ""]), ...state.weights.map(entry => [entry.date, "", entry.weight])];
    const csv = rows.map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile(`nutritrack-progress-${todayISO()}.csv`, csv, "text/csv;charset=utf-8"); showToast("Progress report exported.");
  }
  function downloadFile(name, content, type) {
    const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function renderAccountModeControls() {
    const isCloudAccount = Boolean(activeUserId);
    const demoResetRow = $("#demoResetRow");
    const localDataControls = $("#localDataControls");
    const passwordDescription = $("#passwordDescription");
    const passwordButton = $("#passwordInfo");

    if (demoResetRow) demoResetRow.hidden = isCloudAccount;
    if (localDataControls) localDataControls.hidden = isCloudAccount;
    if (passwordDescription) {
      passwordDescription.textContent = isCloudAccount
        ? "Managed securely by Supabase Authentication."
        : "No account password in demo mode.";
    }
    if (passwordButton) {
      passwordButton.textContent = isCloudAccount ? "Reset password" : "Unavailable";
      passwordButton.disabled = !isCloudAccount;
      passwordButton.setAttribute("aria-label", isCloudAccount ? "Send a password reset link" : "Password changes are unavailable in demo mode");
    }
  }

  function renderAll() {
    renderAccountModeControls();
    renderDashboard();
    if (currentView === "food") renderFoodPage();
    if (currentView === "goals") renderGoalsPage();
    if (currentView === "progress") renderProgressPage();
    if (currentView === "coach") renderCoachPage();
    if (currentView === "settings") renderSettingsPage();
  }

  function makeEmptyAccountState() {
    const base = makeSeedState();
    const date = todayISO();
    return {
      ...base,
      profile: { ...base.profile, name: "", email: "", age: null, height: null, weight: null, goalWeight: null },
      targets: { calories: 2000, protein: 120, carbs: 220, fat: 65, maintenance: 2000 },
      diary: { [date]: [] }, customFoods: [], water: {}, weights: [], calorieHistory: [],
      coachMessages: [], weeklyLogged: [false, false, false, false, false, false, false], startWeight: null,
      preferences: ["Balanced"]
    };
  }

  async function useAccount(userId, profile, targets) {
    if (!userId) throw new Error("Missing authenticated user id.");
    activeUserId = userId;
    activeCoachConversationId = null;
    coachSaveQueue = Promise.resolve();
    activeStorageKey = `${STORAGE_KEY}:user:${userId}`;
    const hasAccountState = Boolean(localStorage.getItem(activeStorageKey));
    state = hasAccountState ? loadState(activeStorageKey) : makeEmptyAccountState();
    if (profile) {
      state.profile = {
        ...state.profile,
        name: profile.full_name || state.profile.name || "",
        email: profile.email || state.profile.email || "",
        age: profile.age ?? state.profile.age,
        birthDate: profile.birth_date || state.profile.birthDate || "",
        gender: genderToLabel(profile.gender),
        sex: profile.gender === "prefer_not_to_say" ? "other" : (profile.gender || state.profile.sex),
        height: profile.height_cm == null ? state.profile.height : Number(profile.height_cm),
        weight: profile.current_weight_kg == null ? state.profile.weight : Number(profile.current_weight_kg),
        activity: profile.activity_level == null ? state.profile.activity : Number(profile.activity_level),
        goal: profile.goal_type || state.profile.goal,
        goalWeight: profile.goal_weight_kg == null ? state.profile.goalWeight : Number(profile.goal_weight_kg),
        pace: profile.goal_pace_kg == null ? state.profile.pace : Number(profile.goal_pace_kg)
      };
      if (Array.isArray(profile.dietary_preferences) && profile.dietary_preferences.length) state.preferences = profile.dietary_preferences;
      state.units = { weight: profile.weight_unit || state.units.weight, height: profile.height_unit || state.units.height, energy: profile.energy_unit || state.units.energy };
      state.notifications = { ...state.notifications, ...(profile.notifications || {}) };
      if (!state.weights.length && Number(state.profile.weight) > 0) {
        state.weights = [{ date: todayISO(), weight: Number(state.profile.weight) }];
        state.startWeight = Number(state.profile.weight);
      }
    }
    if (targets) {
      state.targets = {
        calories: Number(targets.calories) || state.targets.calories,
        maintenance: Number(targets.maintenance_calories) || Number(targets.calories) || state.targets.maintenance,
        protein: Number(targets.protein_g) || 0,
        carbs: Number(targets.carbs_g) || 0,
        fat: Number(targets.fat_g) || 0
      };
    }
    if (!state.diary[todayISO()]) state.diary[todayISO()] = [];
    try {
      await syncWeightHistory(userId, state.profile.weight);
    } catch (error) {
      console.error("NutriTrack: weight history sync failed", error);
      showToast("Could not sync weight history. Your saved browser data is preserved.");
    }
    try {
      await loadCloudFoodDiary();
    } catch (error) {
      console.error("NutriTrack: food diary sync failed", error);
      showToast("Food Diary cloud sync failed. Local data is preserved.");
    }
    try {
      await loadCloudWaterLogs();
    } catch (error) {
      console.error("NutriTrack: water history sync failed", error);
      showToast("Could not sync water history. Your saved browser data is preserved.");
    }
    try {
      await loadCloudCoachMessages();
    } catch (error) {
      console.error("NutriTrack: coach history sync failed", error);
      showToast("Nutri Coach history could not be synced. Replies will remain available on this device.");
    }
    persist();
    renderAll();
  }

  function useDemo() {
    activeUserId = null;
    activeCoachConversationId = null;
    coachSaveQueue = Promise.resolve();
    cloudFoods = null;
    cloudFoodLoadError = false;
    activeStorageKey = STORAGE_KEY;
    state = loadState(STORAGE_KEY);
    renderAll();
  }

  window.NutriTrackApp = {
    useAccount,
    useDemo,
    getState: () => JSON.parse(JSON.stringify(state)),
    render: renderAll
  };

  // Global interactions
  document.addEventListener("click", async event => {
    if (event.target.closest("[data-empty-add-food]")) {
      showFoodModal();
      return;
    }
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) { setView(viewButton.dataset.view); return; }
    const filter = event.target.closest("[data-meal-filter]");
    if (filter) { currentMealFilter = filter.dataset.mealFilter; $$(".filter-pill").forEach(button => button.classList.toggle("active", button === filter)); renderMealGroups(); return; }
    const addId = event.target.closest("[data-add-food-id]");
    if (addId) { const food = allFoods().find(item => item.id === addId.dataset.addFoodId); if (food) showFoodModal(food); return; }
    const editFoodButton = event.target.closest("[data-edit-entry]");
    if (editFoodButton) {
      showEditFoodEntryModal(getEntries().find(item => String(item.entryId) === String(editFoodButton.dataset.editEntry)));
      return;
    }
    const remove = event.target.closest("[data-remove-entry]");
    if (remove) { await removeFoodEntry(remove.dataset.removeEntry); return; }
    const goalButton = event.target.closest("[data-goal]");
    if (goalButton) { state.profile.goal = goalButton.dataset.goal; $$(".goal-option").forEach(button => button.classList.toggle("selected", button === goalButton)); updateGoalEstimate(); return; }
    const preference = event.target.closest("[data-preference]");
    if (preference) { const name = preference.dataset.preference; state.preferences = state.preferences.includes(name) ? state.preferences.filter(item => item !== name) : [...state.preferences, name]; if (!state.preferences.length) state.preferences = ["Balanced"]; $$(".preference-chip").forEach(button => button.classList.toggle("active", state.preferences.includes(button.dataset.preference))); persist(); return; }
    const period = event.target.closest("[data-period]");
    if (period) { currentProgressPeriod = period.dataset.period; $$(".period-switch button").forEach(button => button.classList.toggle("active", button === period)); renderProgressPage(); return; }
    const editWeightButton = event.target.closest("[data-edit-weight]");
    if (editWeightButton) {
      const key = editWeightButton.dataset.editWeight;
      const item = state.weights.find(entry => String(entry.id || entry.date) === String(key));
      if (item) showWeightModal(item);
      return;
    }
    const deleteWeightButton = event.target.closest("[data-delete-weight]");
    if (deleteWeightButton) {
      const key = deleteWeightButton.dataset.deleteWeight;
      if (window.confirm("Delete this weight entry?")) await deleteWeight(key);
      return;
    }
  });

  $("#foodSearch").addEventListener("input", renderFoodSearchResults);
  $("#openAddFood").addEventListener("click", () => showFoodModal());
  $("#quickAddBtn")?.addEventListener("click", () => showFoodModal());
  $("#openCustomFood").addEventListener("click", () => showFoodModal(null, true));
  $("#logWaterBtn").addEventListener("click", addWaterGlass);
  $("#foodLogWater").addEventListener("click", () => $("#logWaterBtn").click());
  $("#paceRange").addEventListener("input", updateGoalEstimate);
  ["#goalAge", "#goalHeight", "#goalWeight", "#goalActivity", "#goalSex"].forEach(selector => $(selector).addEventListener("input", updateGoalEstimate));
  $("#saveGoals").addEventListener("click", saveGoals);
  $("#logWeightBtn").addEventListener("click", showWeightModal);
  $("#exportProgress").addEventListener("click", exportReportCSV);
  $("#exportData").addEventListener("click", exportJSON);
  $("#saveSettings").addEventListener("click", saveSettings);
  $("#settingsForm").addEventListener("input", () => { $("#saveStatus").textContent = "● UNSAVED CHANGES"; });
  $("#settingsForm").addEventListener("change", () => { $("#saveStatus").textContent = "● UNSAVED CHANGES"; });
  $("#chatForm").addEventListener("submit", event => { event.preventDefault(); const input = $("#chatInput"); const value = input.value; if (!value.trim()) return; input.value = ""; sendChat(value); });
  $$(".prompt-button").forEach(button => button.addEventListener("click", () => sendChat(button.dataset.prompt)));
  $("#newChat").addEventListener("click", () => { state.coachMessages = []; activeCoachConversationId = createConversationId(); persist(); renderCoachPage(); showToast(activeUserId ? "Started a new cloud conversation." : "Started a new demo chat."); });
  $("#closeModal").addEventListener("click", closeModal);
  $("#modalBackdrop").addEventListener("click", event => { if (event.target === $("#modalBackdrop")) closeModal(); });
  $("#modalBody").addEventListener("click", event => { if (event.target.closest("#cancelModal")) closeModal(); });
  $("#modalBody").addEventListener("submit", async event => {
    event.preventDefault();
    if (event.target.id === "foodModalForm") {
      if (pendingFood || $("#modalFoodSelect")) {
        const food = allFoods().find(item => item.id === $("#modalFoodSelect").value);
        const grams = Number($("#modalFoodGrams").value); if (!food || !(grams > 0)) return;
        const meal = $("#modalFoodMeal").value; closeModal(); await addFood(food, grams, meal);
      } else {
        const name = $("#modalFoodName").value.trim();
        const calories = Number($("#modalCalories").value), protein = Number($("#modalProtein").value), carbs = Number($("#modalCarbs").value), fat = Number($("#modalFat").value);
        if (!name || [calories, protein, carbs, fat].some(value => !Number.isFinite(value) || value < 0)) { showToast("Check the food details and nutrition values."); return; }
        const food = { id: `custom-${Date.now()}`, name, category: "Snacks", emoji: "◉", calories, protein, carbs, fat, portion: "100 g" };
        if (activeUserId && !supabase) {
          showToast("Cloud connection unavailable. Custom food was not saved.");
          return;
        }
        if (activeUserId && supabase) {
          const submitButton = event.target.querySelector('button[type="submit"]');
          submitButton.disabled = true; submitButton.textContent = "Saving…";
          supabase.from("foods").insert({ owner_id: activeUserId, name, category: "Snacks", serving_label: "100 g", serving_grams: 100, calories, protein_g: protein, carbs_g: carbs, fat_g: fat, is_verified: false }).select("id,slug,owner_id,name,brand,category,serving_label,serving_grams,calories,protein_g,carbs_g,fat_g,fiber_g,is_verified").single().then(({ data, error }) => {
            if (error) throw error;
            const savedFood = mapCloudFood(data);
            cloudFoods = [...(cloudFoods || []), savedFood];
            closeModal(); showFoodModal(savedFood); showToast("Custom food saved to your account. Set a portion to add it.");
          }).catch(error => {
            console.error("NutriTrack: gagal menyimpan custom food.", error);
            showToast(`Custom food belum tersimpan: ${error.message || "coba lagi"}`);
            submitButton.disabled = false; submitButton.textContent = "Save custom food";
          });
        } else {
          state.customFoods.push(food); persist(); closeModal(); showFoodModal(food); showToast("Custom food saved. Set a portion to add it.");
        }
      }
    }
    if (event.target.id === "editFoodEntryForm") {
      const entryId = $("#editFoodEntryId").value;
      const grams = Number($("#editFoodGrams").value);
      const meal = $("#editFoodMeal").value;
      if (!entryId || !(grams > 0)) return;
      const submitButton = event.target.querySelector('button[type="submit"]');
      submitButton.disabled = true; submitButton.textContent = "Saving…";
      const saved = await saveFoodEntryEdit(entryId, grams, meal);
      if (saved) closeModal(); else { submitButton.disabled = false; submitButton.textContent = "Save changes"; }
    }
    if (event.target.id === "weightModalForm") {
      const date = $("#modalWeightDate").value, weight = Number($("#modalWeightValue").value);
      if (!date || !(weight >= 25 && weight <= 350)) return;
      const submit = event.target.querySelector('[type="submit"]');
      submit.disabled = true;
      const ok = pendingWeightEdit
        ? await editWeight(pendingWeightEdit, date, weight)
        : await addWeight(date, weight);
      if (ok) { pendingWeightEdit = null; closeModal(); } else submit.disabled = false;
    }
  });

  $("#resetDemo").addEventListener("click", () => {
    if (activeUserId) { showToast("Demo reset is only available when using the local demo."); return; }
    if (!window.confirm("Reset the NutriTrack demo data on this device?")) return;
    state = makeSeedState(); persist(); renderAll(); showToast("Demo data has been reset.");
  });
  $("#deleteData").addEventListener("click", () => {
    if (activeUserId) { showToast("Local demo data controls are unavailable for a signed-in account."); return; }
    if (!window.confirm("Delete all locally saved NutriTrack demo data? This cannot be undone.")) return;
    localStorage.removeItem(STORAGE_KEY); state = makeSeedState(); renderAll(); showToast("Local demo data deleted. A fresh demo profile is ready.");
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !$("#modalBackdrop").hidden) closeModal(); if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setView("food"); $("#foodSearch").focus(); } });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && activeUserId) refreshAccountSettingsFromCloud();
  });


  function initMotionEnhancements() {
    // Respect OS/browser accessibility preferences and avoid unnecessary observers.
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    const selector = ".view .card, .view .meal-preview-card, .view .food-entry, .view .progress-encouragement, .view .danger-zone, .view .empty-diary-state, .view .info-banner";
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("motion-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });

    const prepareNode = node => {
      if (!(node instanceof Element)) return;
      const targets = [];
      if (node.matches(selector)) targets.push(node);
      targets.push(...node.querySelectorAll(selector));
      targets.forEach(element => {
        if (element.classList.contains("motion-reveal")) return;
        const siblings = element.parentElement
          ? [...element.parentElement.children].filter(child => child.matches(selector))
          : [];
        const position = Math.max(0, siblings.indexOf(element));
        element.style.setProperty("--nt-motion-delay", `${Math.min(position, 5) * 42}ms`);
        element.classList.add("motion-reveal");
        revealObserver.observe(element);
      });
    };

    document.querySelectorAll(".view").forEach(prepareNode);
    const contentRoot = document.querySelector(".main-content") || document.body;
    const contentObserver = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(prepareNode));
    });
    contentObserver.observe(contentRoot, { childList: true, subtree: true });
  }

  function init() {
    initMotionEnhancements();
    if (!state.diary[todayISO()]) state.diary[todayISO()] = [];
    $("#todayLabel").textContent = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "2-digit" }).format(new Date()).toUpperCase();
    renderAll(); persist();
  }
  init();
})();
