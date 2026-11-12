(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const shell = $("#entryShell"), copy = $("#entryCopy"), card = $("#entryCard"), app = $("#appShell");
  const supabase = window.NUTRITRACK_SUPABASE;
  if (!shell || !copy || !card || !app) return;

  let step = 0;
  let pending = null;
  let activeUser = null;
  let bootstrapPromise = null;
  const onboarding = { goal: "cutting", age: 28, height: 175, weight: 72.5, sex: "male", activity: 1.55, preference: "Balanced" };
  const pendingKey = email => `nutritrack_pending_onboarding:${String(email || "").trim().toLowerCase()}`;
  const redirectUrl = () => `${window.location.origin}${window.location.pathname}`;

  const hide = () => {
    shell.hidden = true;
    app.hidden = false;
    app.removeAttribute("aria-hidden");
    document.body.classList.remove("entry-open");
  };
  const enterDemo = () => {
    activeUser = null;
    window.NutriTrackApp?.useDemo();
    localStorage.setItem("nutritrack_entry_seen", "1");
    hide();
  };
  function show(screen) {
    shell.hidden = false;
    app.hidden = true;
    app.setAttribute("aria-hidden", "true");
    document.body.classList.add("entry-open");
    if (screen === "welcome") {
      copy.innerHTML = `<span class="eyebrow">A CALMER WAY TO TRACK NUTRITION</span><h1>Make nutrition feel simple.</h1><p>Know what you eat, understand your targets, and build habits that fit real life — without making food feel complicated.</p><div class="entry-actions"><button class="button button-primary" data-entry="signup">Create free account</button><button class="button button-secondary" data-entry="signin">I already have an account</button></div><div class="entry-feature-grid"><article class="entry-feature"><small>01</small><strong>Simple daily tracking</strong><p>Log meals and see your calories and macros at a glance.</p></article><article class="entry-feature"><small>02</small><strong>Progress that makes sense</strong><p>Follow weight and nutrition trends over time.</p></article><article class="entry-feature"><small>03</small><strong>A coach that explains</strong><p>Get practical, data-aware ideas — not rigid rules.</p></article></div>`;
      card.innerHTML = `<span class="eyebrow">YOUR DAY, IN BALANCE</span><h2>A clearer picture of your nutrition.</h2><div class="entry-preview-calories"><small>CALORIES TODAY</small><strong>1,840 <small>of 2,200 kcal</small></strong><div class="progress-track"><span class="progress-fill lime-fill" style="width:84%"></span></div><p>360 kcal remaining</p></div><div class="entry-preview-macro"><span>Protein</span><strong>92 / 140 g</strong></div><div class="entry-preview-macro"><span>Carbohydrates</span><strong>186 / 220 g</strong></div><div class="entry-preview-macro"><span>Fat</span><strong>54 / 70 g</strong></div><button class="button button-secondary full-width" style="margin-top:20px" data-entry="demo">Explore demo without signing in</button>`;
    } else if (screen === "signin") {
      copy.innerHTML = `<span class="eyebrow">WELCOME BACK</span><h1>Small habits.<br>Steady progress.</h1><p>Pick up where you left off. Your daily log, goals, and progress are ready when you are.</p><div class="entry-trust">Your nutrition data is personal. You control what you log and what you share.</div>`;
      card.innerHTML = `<button class="entry-back" data-entry="welcome">← Back</button><h2>Sign in to NutriTrack</h2><p class="subcopy">Welcome back — let's keep your momentum going.</p><form id="entrySignIn"><div class="field"><label>Email address</label><input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div><div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" minlength="8" placeholder="Enter your password" required></div><div class="entry-inline"><label><input type="checkbox" name="remember" style="width:auto;height:auto" checked> Remember me</label><button class="entry-link" type="button" data-entry="forgot">Forgot password?</button></div><p class="entry-error" hidden></p><button class="button button-primary" type="submit">Sign in</button></form><div class="entry-divider">Or continue with</div><div class="entry-demo-action"><button class="button button-secondary" type="button" data-entry="demo">Continue with demo profile</button></div><p class="entry-bottom">New to NutriTrack? <button class="entry-link" data-entry="signup">Create an account</button></p>`;
    } else if (screen === "signup") {
      copy.innerHTML = `<span class="eyebrow">START WITH THE BASICS</span><h1>Your routine, your pace.</h1><p>Create a free account and set targets that reflect your goals. No payment is required by this app.</p><div class="entry-trust">Your account is secured by Supabase Authentication. Your password is never stored by NutriTrack.</div>`;
      card.innerHTML = `<button class="entry-back" data-entry="welcome">← Back</button><h2>Create your account</h2><p class="subcopy">A few details will help us personalize your experience.</p><form id="entrySignUp"><div class="field"><label>Full name</label><input name="name" maxlength="60" autocomplete="name" placeholder="Your name" required></div><div class="field"><label>Email address</label><input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div><div class="field"><label>Password</label><input name="password" type="password" autocomplete="new-password" minlength="8" placeholder="At least 8 characters" required></div><div class="field"><label>Confirm password</label><input name="confirm" type="password" autocomplete="new-password" minlength="8" placeholder="Re-enter password" required></div><p class="entry-error" hidden></p><button class="button button-primary" type="submit">Continue to setup</button></form><p class="entry-bottom">Already have an account? <button class="entry-link" data-entry="signin">Sign in</button></p>`;
    } else if (screen === "forgot") {
      copy.innerHTML = `<span class="eyebrow">ACCOUNT SUPPORT</span><h1>We'll help you get back on track.</h1><p>Enter your email address and Supabase will send a password recovery link.</p>`;
      card.innerHTML = `<button class="entry-back" data-entry="signin">← Back to sign in</button><h2>Forgot password?</h2><p class="subcopy">We'll send a secure recovery link to your inbox.</p><form id="entryForgot"><div class="field"><label>Email address</label><input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div><p class="entry-error" hidden></p><button class="button button-primary" type="submit">Send reset link</button></form>`;
    } else if (screen === "verify") {
      copy.innerHTML = `<span class="eyebrow">CHECK YOUR INBOX</span><h1>One more step to get started.</h1><p>Confirm your email address using the link Supabase sent you. Then return here and sign in.</p>`;
      card.innerHTML = `<span class="eyebrow">EMAIL VERIFICATION</span><h2>Verify your email</h2><p class="subcopy">Your onboarding details have been kept on this browser temporarily. After verifying, sign in with the same email to finish setting up your profile.</p><button class="button button-primary full-width" data-entry="signin">Back to sign in</button><p class="entry-bottom">Didn't receive the email? Check your spam folder or try signing up again later.</p>`;
    } else if (screen === "sent") {
      copy.innerHTML = `<span class="eyebrow">CHECK YOUR INBOX</span><h1>One small step to get back in.</h1><p>We sent a password recovery link if the email is registered with NutriTrack.</p>`;
      card.innerHTML = `<span class="eyebrow">PASSWORD RECOVERY</span><h2>Reset link sent</h2><p class="subcopy">Open the email on this device, follow the link, and choose a new password.</p><button class="button button-primary" data-entry="signin">Back to sign in</button>`;
    } else if (screen === "reset") {
      copy.innerHTML = `<span class="eyebrow">SECURE YOUR ACCOUNT</span><h1>Choose a new password.</h1><p>Use at least 8 characters. You can sign in with it after updating.</p>`;
      card.innerHTML = `<h2>Update password</h2><form id="entryReset"><div class="field"><label>New password</label><input name="password" type="password" autocomplete="new-password" minlength="8" required></div><div class="field"><label>Confirm new password</label><input name="confirm" type="password" autocomplete="new-password" minlength="8" required></div><p class="entry-error" hidden></p><button class="button button-primary" type="submit">Save new password</button></form>`;
    } else if (screen === "onboarding") renderStep();
  }

  function renderStep() {
    copy.innerHTML = `<span class="eyebrow">PERSONALIZE YOUR EXPERIENCE</span><h1>A plan built around you.</h1><p>These estimates are a starting point, not a strict rule. You can change them any time.</p>`;
    const labels = ["Choose your goal", "Your profile", "Activity & preferences", "Review targets"];
    let body = "";
    if (step === 0) body = `<h2>What's your main goal?</h2><p class="subcopy">Choose the direction that feels right for you.</p><div class="onboard-options">${[["cutting", "Lose weight", "A gradual calorie deficit"], ["maintenance", "Maintain weight", "Keep your current weight"], ["bulking", "Build muscle", "A gradual calorie surplus"]].map(([v, t, d]) => `<button class="onboard-option ${onboarding.goal === v ? "selected" : ""}" data-goal="${v}"><strong>${t}</strong><small>${d}</small></button>`).join("")}</div><div class="entry-trust">A steady, realistic approach is usually easier to maintain over time.</div>`;
    if (step === 1) body = `<h2>Your profile</h2><p class="subcopy">Used to estimate your daily energy needs.</p><div class="onboard-grid"><div class="field"><label>Age</label><input id="onAge" type="number" min="15" max="100" value="${onboarding.age}" required></div><div class="field"><label>Height (cm)</label><input id="onHeight" type="number" min="120" max="230" value="${onboarding.height}" required></div><div class="field"><label>Current weight (kg)</label><input id="onWeight" type="number" min="30" max="300" step="0.1" value="${onboarding.weight}" required></div><div class="field"><label>Sex for equation</label><select id="onSex"><option value="male" ${onboarding.sex === "male" ? "selected" : ""}>Male</option><option value="female" ${onboarding.sex === "female" ? "selected" : ""}>Female</option></select></div></div><p class="entry-progress-note">Your profile is saved to your NutriTrack account after signup.</p>`;
    if (step === 2) body = `<h2>Activity & preferences</h2><p class="subcopy">Choose the option closest to your usual routine.</p><div class="field"><label>Activity level</label><select id="onActivity"><option value="1.2" ${onboarding.activity === 1.2 ? "selected" : ""}>Mostly sitting</option><option value="1.375" ${onboarding.activity === 1.375 ? "selected" : ""}>Lightly active</option><option value="1.55" ${onboarding.activity === 1.55 ? "selected" : ""}>Moderately active</option><option value="1.725" ${onboarding.activity === 1.725 ? "selected" : ""}>Very active</option></select></div><div class="field"><label>Dietary preference</label><select id="onPreference">${["Balanced", "Vegetarian", "Vegan", "Pescatarian", "Gluten-free", "Dairy-free"].map(x => `<option ${onboarding.preference === x ? "selected" : ""}>${x}</option>`).join("")}</select></div><div class="entry-trust">Preferences help shape food suggestions. They do not replace medical or allergy advice.</div>`;
    if (step === 3) {
      const bmr = 10 * onboarding.weight + 6.25 * onboarding.height - 5 * onboarding.age + (onboarding.sex === "male" ? 5 : -161);
      const maintenance = Math.round(bmr * onboarding.activity / 50) * 50;
      const target = Math.round((maintenance + (onboarding.goal === "cutting" ? -400 : onboarding.goal === "bulking" ? 250 : 0)) / 50) * 50;
      const protein = Math.round(onboarding.weight * (onboarding.goal === "bulking" ? 1.8 : 1.6));
      const fat = Math.round(target * .27 / 9), carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
      onboarding.estimate = { maintenance, target, protein, fat, carbs };
      body = `<h2>Your starting targets</h2><p class="subcopy">Based on the details you entered. You can fine-tune these later.</p><div class="onboard-review"><small class="muted">ESTIMATED DAILY CALORIES</small><strong>${target.toLocaleString()} kcal</strong><span class="muted">Estimated maintenance: ${maintenance.toLocaleString()} kcal</span></div><div class="onboard-grid"><div class="entry-preview-macro"><span>Protein</span><strong>${protein} g</strong></div><div class="entry-preview-macro"><span>Carbohydrates</span><strong>${carbs} g</strong></div><div class="entry-preview-macro"><span>Fat</span><strong>${fat} g</strong></div><div class="entry-preview-macro"><span>Goal</span><strong>${onboarding.goal}</strong></div></div><p class="entry-progress-note">These are general estimates. Individual needs may vary.</p>`;
    }
    card.innerHTML = `<button class="entry-back" data-entry="welcome">← Exit setup</button><span class="eyebrow">STEP ${step + 1} OF 4</span><div class="onboard-progress">${labels.map((_, i) => `<span class="${i <= step ? "done" : ""}"></span>`).join("")}</div>${body}<p class="entry-error" hidden></p><div class="modal-actions" style="justify-content:space-between"><button class="button button-secondary" data-step="back" ${step === 0 ? "disabled" : ""}>Back</button><button class="button button-primary" data-step="next">${step === 3 ? "Create account" : "Continue"}</button></div>`;
  }

  function onboardingProfile() {
    const e = onboarding.estimate;
    return {
      full_name: pending.name,
      email: pending.email,
      age: onboarding.age,
      gender: onboarding.sex,
      height_cm: onboarding.height,
      current_weight_kg: onboarding.weight,
      activity_level: onboarding.activity,
      goal_type: onboarding.goal,
      goal_weight_kg: onboarding.goal === "cutting" ? Math.max(35, onboarding.weight - 4) : onboarding.goal === "bulking" ? onboarding.weight + 3 : onboarding.weight,
      dietary_preferences: [onboarding.preference],
      targets: { calories: e.target, maintenance_calories: e.maintenance, protein_g: e.protein, carbs_g: e.carbs, fat_g: e.fat }
    };
  }

  async function saveOnboardingToCloud(user, profileData) {
    if (!supabase || !user?.id) throw new Error("Supabase session is not available.");
    const { targets, ...profile } = profileData;
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, ...profile }, { onConflict: "id" });
    if (profileError) throw profileError;
    const { error: targetError } = await supabase.from("nutrition_targets").upsert({ user_id: user.id, ...targets }, { onConflict: "user_id" });
    if (targetError) throw targetError;
  }

  async function loadAccount(user) {
    if (!user?.id) throw new Error("User session is missing.");
    if (bootstrapPromise) return bootstrapPromise;
    bootstrapPromise = (async () => {
      activeUser = user;
      const key = pendingKey(user.email);
      const pendingRaw = localStorage.getItem(key);
      if (pendingRaw) {
        try {
          await saveOnboardingToCloud(user, JSON.parse(pendingRaw));
          localStorage.removeItem(key);
        } catch (error) {
          console.error("NutriTrack: profile sync failed", error);
          throw new Error(`Your account is signed in, but profile setup could not be saved: ${error.message}`);
        }
      }
      const [{ data: profile, error: profileError }, { data: targets, error: targetsError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("nutrition_targets").select("*").eq("user_id", user.id).maybeSingle()
      ]);
      if (profileError) throw profileError;
      if (targetsError) throw targetsError;
      await window.NutriTrackApp?.useAccount(user.id, profile || { email: user.email }, targets);
      localStorage.setItem("nutritrack_entry_seen", "1");
      hide();
    })().finally(() => { bootstrapPromise = null; });
    return bootstrapPromise;
  }

  async function finishSignup() {
    const nextButton = card.querySelector('[data-step="next"]');
    const errorBox = card.querySelector(".entry-error");
    if (!supabase) { errorBox.textContent = window.NUTRITRACK_SUPABASE_ERROR || "Supabase is not connected. Check the project files and internet connection."; errorBox.hidden = false; return; }
    nextButton.disabled = true; nextButton.textContent = "Creating account…";
    try {
      const profileData = onboardingProfile();
      const { data, error } = await supabase.auth.signUp({
        email: pending.email,
        password: pending.password,
        options: { data: { full_name: pending.name }, emailRedirectTo: redirectUrl() }
      });
      if (error) throw error;
      if (!data.user) throw new Error("Supabase did not return a user. Please try again.");
      localStorage.setItem(pendingKey(pending.email), JSON.stringify(profileData));
      pending.password = "";
      if (data.session) {
        await loadAccount(data.user);
      } else {
        show("verify");
      }
    } catch (error) {
      console.error("NutriTrack signup error:", error);
      errorBox.textContent = error.message || "We couldn't create your account. Please try again.";
      errorBox.hidden = false;
      nextButton.disabled = false; nextButton.textContent = "Create account";
    }
  }

  async function handleSignIn(form) {
    const data = new FormData(form), errorBox = form.querySelector(".entry-error"), button = form.querySelector('button[type="submit"]');
    if (!supabase) { errorBox.textContent = window.NUTRITRACK_SUPABASE_ERROR || "Supabase is not connected."; errorBox.hidden = false; return; }
    button.disabled = true; button.textContent = "Signing in…";
    try {
      const rememberMe = form.querySelector('input[name="remember"]')?.checked ?? true;
      window.NUTRITRACK_AUTH_STORAGE?.setRememberMe(rememberMe);
      const { data: result, error } = await supabase.auth.signInWithPassword({ email: String(data.get("email")).trim(), password: String(data.get("password")) });
      if (error) throw error;
      await loadAccount(result.user);
    } catch (error) {
      errorBox.textContent = error.message || "Unable to sign in. Check your email and password.";
      errorBox.hidden = false; button.disabled = false; button.textContent = "Sign in";
    }
  }

  async function handleForgot(form) {
    const data = new FormData(form), errorBox = form.querySelector(".entry-error"), button = form.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = "Sending…";
    try {
      if (!supabase) throw new Error("Supabase is not connected.");
      const { error } = await supabase.auth.resetPasswordForEmail(String(data.get("email")).trim(), { redirectTo: redirectUrl() });
      if (error) throw error;
      show("sent");
    } catch (error) {
      errorBox.textContent = error.message || "Unable to send the recovery email.";
      errorBox.hidden = false; button.disabled = false; button.textContent = "Send reset link";
    }
  }

  async function handleReset(form) {
    const data = new FormData(form), errorBox = form.querySelector(".entry-error"), button = form.querySelector('button[type="submit"]');
    const password = String(data.get("password"));
    if (password !== String(data.get("confirm"))) { errorBox.textContent = "Passwords do not match."; errorBox.hidden = false; return; }
    button.disabled = true; button.textContent = "Updating…";
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) await loadAccount(sessionData.session.user);
      else show("signin");
    } catch (error) {
      errorBox.textContent = error.message || "Unable to update password.";
      errorBox.hidden = false; button.disabled = false; button.textContent = "Save new password";
    }
  }

  async function handleSignOut() {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      activeUser = null;
      window.NutriTrackApp?.useDemo();
      localStorage.removeItem("nutritrack_entry_seen");
      show("welcome");
    } catch (error) {
      alert(`Unable to sign out: ${error.message}`);
    }
  }

  shell.addEventListener("click", event => {
    const nav = event.target.closest("[data-entry]");
    if (nav) {
      const action = nav.dataset.entry;
      if (action === "demo") { enterDemo(); return; }
      show(action); return;
    }
    const goal = event.target.closest("[data-goal]");
    if (goal) { onboarding.goal = goal.dataset.goal; renderStep(); return; }
    const stepButton = event.target.closest("[data-step]");
    if (!stepButton) return;
    if (stepButton.dataset.step === "back") { step = Math.max(0, step - 1); renderStep(); return; }
    if (step === 1) {
      onboarding.age = Number($("#onAge").value); onboarding.height = Number($("#onHeight").value); onboarding.weight = Number($("#onWeight").value); onboarding.sex = $("#onSex").value;
      if (!(onboarding.age >= 15 && onboarding.age <= 100 && onboarding.height >= 120 && onboarding.height <= 230 && onboarding.weight >= 30 && onboarding.weight <= 300)) { alert("Please check your profile details."); return; }
    }
    if (step === 2) { onboarding.activity = Number($("#onActivity").value); onboarding.preference = $("#onPreference").value; }
    if (step < 3) { step++; renderStep(); } else finishSignup();
  });

  shell.addEventListener("submit", event => {
    const form = event.target;
    if (!form.matches("form")) return;
    event.preventDefault();
    const data = new FormData(form), errorBox = form.querySelector(".entry-error");
    if (form.id === "entrySignUp") {
      if (String(data.get("password")) !== String(data.get("confirm"))) { errorBox.textContent = "Passwords do not match."; errorBox.hidden = false; return; }
      pending = { name: String(data.get("name")).trim(), email: String(data.get("email")).trim(), password: String(data.get("password")) };
      step = 0; show("onboarding");
    } else if (form.id === "entrySignIn") handleSignIn(form);
    else if (form.id === "entryForgot") handleForgot(form);
    else if (form.id === "entryReset") handleReset(form);
  });

  $("#signOutDemo")?.addEventListener("click", handleSignOut);
  $("#passwordInfo")?.addEventListener("click", () => show("forgot"));

  if (supabase) {
    supabase.auth.onAuthStateChange(event => {
      if (event === "PASSWORD_RECOVERY") setTimeout(() => show("reset"), 0);
    });
  }

  async function init() {
    if (!supabase) { show("welcome"); return; }
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error_description")) {
      show("signin");
      const error = card.querySelector(".entry-error");
      if (error) { error.textContent = hash.get("error_description").replace(/\+/g, " "); error.hidden = false; }
      return;
    }
    if (hash.get("type") === "recovery") { show("reset"); return; }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session?.user) await loadAccount(data.session.user);
      else show("welcome");
    } catch (error) {
      console.error("NutriTrack session restore failed:", error);
      show("welcome");
    }
  }
  init();
})();
