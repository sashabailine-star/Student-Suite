const SUPABASE_URL = "https://kprlkctuyggqypjqwrey.supabase.co";
const SUPABASE_KEY = "sb_publishable_w3xLD4D-gk0HQwRCOY7kow_7aa_qLzM";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function showAuthMessage(message, isError = false) {
  const el = document.getElementById("authMessage");
  if (!el) return;

  el.innerHTML = `
    <div class="list-card" style="border-color:${isError ? "#f0c8c8" : "#bfd3f4"};">
      <div class="list-sub" style="color:${isError ? "#b33939" : "#163a70"};">
        ${message}
      </div>
    </div>
  `;
}

async function redirectIfLoggedIn() {
  const { data, error } = await supabaseClient.auth.getSession();
  console.log("SESSION CHECK:", data, error);

  if (data?.session) {
    window.location.href = "index.html";
  }
}

async function handleSignup(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  console.log("SIGN UP RESULT:", data, error);

  if (error) {
    showAuthMessage(error.message, true);
    return;
  }

  if (data?.session) {
    showAuthMessage("Account created. Redirecting...");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
    return;
  }

  if (data?.user) {
    showAuthMessage("Account created. Now log in.");
  }
}

async function handleLogin(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  console.log("LOGIN RESULT:", data, error);

  if (error) {
    showAuthMessage(error.message, true);
    return;
  }

  if (data?.session) {
    showAuthMessage("Login successful. Redirecting...");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await redirectIfLoggedIn();

  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      await handleSignup(email, password);
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      await handleLogin(email, password);
    });
  }
});