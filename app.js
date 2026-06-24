const SUPABASE_URL = 'https://VOTRE-PROJET.supabase.co'
const SUP.signUp({const SUPABASE_PUBLISHABLE_KEY = 'VOTRE_PUBLISHABLE_KEY'
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, 'auth.html')}`
      }
    })

    message.textContent = error
      ? `Erreur : ${error.message}`
      : 'Compte créé. Vérifiez votre boîte mail si une confirmation est demandée.'
  })
}

// -----------------------------
// CONNEXION
// -----------------------------
const loginForm = document.getElementById('login-form')
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('login-email').value.trim()
    const password = document.getElementById('login-password').value
    const message = document.getElementById('login-message')

    const { error } = await sb.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      message.textContent = `Erreur : ${error.message}`
      return
    }

    message.textContent = 'Connexion réussie.'
    window.location.href = 'index.html'
  })
}

// -----------------------------
// MOT DE PASSE OUBLIÉ
// -----------------------------
const forgotForm = document.getElementById('forgot-form')
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('forgot-email').value.trim()
    const message = document.getElementById('forgot-message')

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, 'auth.html')}`
    })

    message.textContent = error
      ? `Erreur : ${error.message}`
      : 'Si cette adresse existe, un lien de réinitialisation a été envoyé.'
  })
}

// -----------------------------
// MISE À JOUR DU MOT DE PASSE
// -----------------------------
const updatePasswordForm = document.getElementById('update-password-form')
if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const newPassword = document.getElementById('new-password').value
    const message = document.getElementById('update-password-message')

    if (!passwordRecoveryMode) {
      message.textContent = 'Le lien de réinitialisation n’a pas été détecté.'
      return
    }

    const { error } = await sb.auth.updateUser({
      password: newPassword
    })

    if (error) {
      message.textContent = `Erreur : ${error.message}`
      return
    }

    message.textContent = 'Mot de passe mis à jour. Vous pouvez maintenant vous connecter.'
  })
}

const { createClient } = supabase
const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
window.sb = sb

let passwordRecoveryMode = false

// Détection du mode récupération de mot de passe
sb.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    passwordRecoveryMode = true

    const bloc = document.getElementById('update-password-bloc')
    if (bloc) {
      bloc.style.display = 'block'
      bloc.scrollIntoView({ behavior: 'smooth' })
    }
  }
})

// -----------------------------
// INSCRIPTION
// -----------------------------
const signupForm = document.getElementById('signup-form')
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('signup-email').value.trim()
    const password = document.getElementById('signup-password').value
    const message = document.getElementById('signup-message')

