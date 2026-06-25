const SUPABASE_URL = 'https://pxdtyaqjxmihaeericqf.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dDgWNoCh43KsVEHJmpoEzg_4WSDyrvt'

const { createClient } = supabase
const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
window.sb = sb

let passwordRecoveryMode = false

const COULEURS_PAR_LIBELLE = {
  Bleu: '#2563eb',
  Jaune: '#f59e0b',
  Vert: '#16a34a',
  Rouge: '#ef4444',
  Violet: '#a855f7',
  Orange: '#f97316',
  Cyan: '#0ea5e9'
}

function setMessage(elementId, text, isError = false) {
  const el = document.getElementById(elementId)
  if (!el) return
  el.textContent = text
  el.style.color = isError ? '#b91c1c' : '#475569'
}

function currentPageName() {
  const parts = window.location.pathname.split('/')
  return parts[parts.length - 1] || 'index.html'
}

function isProtectedPage(page) {
  return ['saisie.html', 'recap.html', 'config.html'].includes(page)
}

function authPageUrl() {
  const url = new URL(window.location.href)
  url.pathname = url.pathname.replace(/[^/]+$/, 'auth.html')
  url.hash = ''
  return url.toString()
}

function goToAuth() {
  window.location.href = 'auth.html'
}

function goToHome() {
  window.location.href = 'index.html'
}

function showPasswordRecoveryBlock() {
  const block = document.getElementById('update-password-bloc')
  if (!block) return
  block.style.display = 'block'
  block.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function libelleDepuisCouleur(hex) {
  const entree = Object.entries(COULEURS_PAR_LIBELLE).find(
    ([, valeur]) => valeur.toLowerCase() === String(hex || '').toLowerCase()
  )
  return entree ? entree[0] : null
}

function pastilleIdDepuisClasse(classe) {
  return `pastille-${classe.replace('°', '-').replace(/\s+/g, '').replace(/\./g, '')}`
}

function appliquerCouleurDansUI(classe, couleurHex) {
  const select = document.querySelector(`.classes-couleurs select[data-classe="${classe}"]`)
  const pastille = document.getElementById(pastilleIdDepuisClasse(classe))

  if (pastille) {
    pastille.style.background = couleurHex
  }

  const libelle = libelleDepuisCouleur(couleurHex)
  if (select && libelle) {
    select.value = libelle
  }
}

async function protectCurrentPage() {
  const page = currentPageName()
  if (!isProtectedPage(page)) return

  const { data, error } = await sb.auth.getUser()

  if (error || !data?.user) {
    goToAuth()
    return
  }

  const userEmailEl = document.getElementById('user-email')
  if (userEmailEl) {
    userEmailEl.textContent = data.user.email || ''
  }
}

async function logoutUser() {
  const { error } = await sb.auth.signOut()

  if (error) {
    console.error('Erreur de déconnexion :', error.message)
    return
  }

  goToAuth()
}

window.logoutUser = logoutUser

sb.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    passwordRecoveryMode = true
    showPasswordRecoveryBlock()
    setMessage(
      'update-password-message',
      'Vous pouvez maintenant définir un nouveau mot de passe.'
    )
  }

  if (event === 'SIGNED_OUT') {
    passwordRecoveryMode = false
    if (isProtectedPage(currentPageName())) {
      goToAuth()
    }
  }
})

const signupForm = document.getElementById('signup-form')
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('signup-email')?.value.trim()
    const password = document.getElementById('signup-password')?.value

    setMessage('signup-message', '')

    if (!email || !password) {
      setMessage('signup-message', 'Merci de remplir tous les champs.', true)
      return
    }

    const { error } = await sb.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authPageUrl()
      }
    })

    if (error) {
      setMessage('signup-message', `Erreur : ${error.message}`, true)
      return
    }

    setMessage(
      'signup-message',
      'Compte créé. Vérifiez votre boîte mail si une confirmation est demandée.'
    )

    signupForm.reset()
  })
}

const loginForm = document.getElementById('login-form')
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('login-email')?.value.trim()
    const password = document.getElementById('login-password')?.value

    setMessage('login-message', '')

    if (!email || !password) {
      setMessage('login-message', 'Merci de remplir tous les champs.', true)
      return
    }

    const { error } = await sb.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setMessage('login-message', `Erreur : ${error.message}`, true)
      return
    }

    setMessage('login-message', 'Connexion réussie.')
    goToHome()
  })
}

const forgotForm = document.getElementById('forgot-form')
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('forgot-email')?.value.trim()

    setMessage('forgot-message', '')

    if (!email) {
      setMessage('forgot-message', 'Merci de saisir une adresse mail.', true)
      return
    }

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: authPageUrl()
    })

    if (error) {
      setMessage('forgot-message', `Erreur : ${error.message}`, true)
      return
    }

    setMessage(
      'forgot-message',
      'Si cette adresse existe, un lien de réinitialisation a été envoyé.'
    )

    forgotForm.reset()
  })
}

const updatePasswordForm = document.getElementById('update-password-form')
if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const newPassword = document.getElementById('new-password')?.value

    setMessage('update-password-message', '')

    if (!newPassword) {
      setMessage(
        'update-password-message',
        'Merci de saisir un nouveau mot de passe.',
        true
      )
      return
    }

    if (!passwordRecoveryMode) {
      setMessage(
        'update-password-message',
        'Le lien de réinitialisation n’a pas été détecté. Revenez au mail reçu et recliquez sur le lien.',
        true
      )
      return
    }

    const { error } = await sb.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setMessage('update-password-message', `Erreur : ${error.message}`, true)
      return
    }

    setMessage(
      'update-password-message',
      'Mot de passe mis à jour. Vous pouvez maintenant vous connecter.'
    )

    updatePasswordForm.reset()
    passwordRecoveryMode = false
  })
}

async function chargerCouleursClasses() {
  if (currentPageName() !== 'config.html') return

  const { data, error } = await sb
    .from('classes')
    .select('nom, couleur')

  if (error) {
    console.error('Erreur chargement couleurs classes :', error.message)
    return
  }

  data.forEach((ligne) => {
    if (ligne.nom && ligne.couleur) {
      appliquerCouleurDansUI(ligne.nom, ligne.couleur)
    }
  })
}

async function enregistrerCouleurClasse(classe, libelleCouleur) {
  const couleurHex = COULEURS_PAR_LIBELLE[libelleCouleur]
  if (!couleurHex) return

  const { error } = await sb
    .from('classes')
    .update({ couleur: couleurHex })
    .eq('nom', classe)

  if (error) {
    console.error(`Erreur enregistrement couleur pour ${classe} :`, error.message)
    return
  }

  appliquerCouleurDansUI(classe, couleurHex)
}

async function updateCouleurPastille(selectElement, pastilleId) {
  const libelleCouleur = selectElement.value
  const couleurHex = COULEURS_PAR_LIBELLE[libelleCouleur] || '#94a3b8'
  const classe = selectElement.dataset.classe

  const pastille = document.getElementById(pastilleId)
  if (pastille) {
    pastille.style.background = couleurHex
  }

  if (!classe) return

  await enregistrerCouleurClasse(classe, libelleCouleur)
}

window.updateCouleurPastille = updateCouleurPastille

function initialiserCouleursConfig() {
  if (currentPageName() !== 'config.html') return
  chargerCouleursClasses()
}

initialiserCouleursConfig()

function getInfosSemaineISO(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)

  return {
    annee: d.getUTCFullYear(),
    semaine: weekNo
  }
}

function afficherSemaineDansRecap() {
  if (currentPageName() !== 'recap.html') return

  const info = getInfosSemaineISO(new Date())
  const semaineCourante = info.semaine
  const semaineSuivante = semaineCourante === 52 ? 1 : semaineCourante + 1

  const elCourante = document.getElementById('resume-semaine-courante')
  const elSuivante = document.getElementById('resume-semaine-suivante')

  if (elCourante) {
    elCourante.textContent = `Nous sommes actuellement en semaine ${semaineCourante}.`
  }

  if (elSuivante) {
    elSuivante.textContent = `La semaine suivante est la semaine ${semaineSuivante}.`
  }
}

function preselectionnerSemaineDansSaisie() {
  if (currentPageName() !== 'saisie.html') return

  const selectSemaine = document.getElementById('semaine')
  if (!selectSemaine) return

  const info = getInfosSemaineISO(new Date())
  selectSemaine.value = String(info.semaine)
}

afficherSemaineDansRecap()
preselectionnerSemaineDansSaisie()

async function chargerFormationsDansRecap() {
  if (currentPageName() !== 'recap.html') return

  const tbody = document.getElementById('tableau-formations-creees')
  if (!tbody) return

  const { data, error } = await sb
    .from('formations')
    .select('nom, lieu')

  if (error) {
    console.error('Erreur chargement formations :', error.message)
    tbody.innerHTML = `
      <tr class="ligne-vide">
        <td colspan="2">Impossible de charger les formations.</td>
      </tr>
    `
    return
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr class="ligne-vide">
        <td colspan="2">Aucune formation à afficher pour le moment.</td>
      </tr>
    `
    return
  }

  tbody.innerHTML = data.map((formation) => `
    <tr>
      <td>${formation.nom || ''}</td>
      <td>${formation.lieu || ''}</td>
    </tr>
  `).join('')
}

chargerFormationsDansRecap()

protectCurrentPage()
