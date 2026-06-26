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

/* --------------------------------------------------
   OUTILS GÉNÉRAUX
-------------------------------------------------- */

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

/* --------------------------------------------------
   AUTHENTIFICATION
-------------------------------------------------- */

async function protectCurrentPage() {
  const page = currentPageName()
  if (!isProtectedPage(page)) return true

  const { data, error } = await sb.auth.getUser()

  if (error || !data?.user) {
    goToAuth()
    return false
  }

  const userEmailEl = document.getElementById('user-email')
  if (userEmailEl) {
    userEmailEl.textContent = data.user.email || ''
  }

  return true
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

/* --------------------------------------------------
   COULEURS DES CLASSES
-------------------------------------------------- */

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

/* --------------------------------------------------
   SEMAINES
-------------------------------------------------- */

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

/* --------------------------------------------------
   FORMATIONS DANS RECAP
-------------------------------------------------- */

async function chargerFormationsDansRecap() {
  if (currentPageName() !== 'recap.html') return

  const tbody = document.getElementById('tableau-formations-creees')
  if (!tbody) return

  const { data, error } = await sb
    .from('formations')
    .select(`
      nom,
      lieux!formations_lieu_id_fkey (
        nom
      )
    `)

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
      <td>${formation.lieux?.nom || ''}</td>
    </tr>
  `).join('')
}

function marquerRecapARecharger() {
  sessionStorage.setItem('recharger_formations_recap', 'oui')
}

function verifierRechargementFormationsRecap() {
  if (currentPageName() !== 'recap.html') return

  const doitRecharger = sessionStorage.getItem('recharger_formations_recap')

  if (doitRecharger === 'oui') {
    sessionStorage.removeItem('recharger_formations_recap')
    chargerFormationsDansRecap()
  }
}

/* --------------------------------------------------
   CONFIGURATION : FORMATION + LIEU (OPTION A)
-------------------------------------------------- */

async function trouverOuCreerLieu(nomLieu, createdBy = null) {
  const nomNettoye = nomLieu.trim()
  if (!nomNettoye) return null

  const { data: lieuxExistants, error: erreurLecture } = await sb
    .from('lieux')
    .select('id, nom')
    .eq('nom', nomNettoye)

  if (erreurLecture) {
    throw new Error(`Erreur recherche lieu : ${erreurLecture.message}`)
  }

  if (lieuxExistants && lieuxExistants.length > 0) {
    return lieuxExistants[0].id
  }

  const { data: nouveauLieu, error: erreurCreation } = await sb
    .from('lieux')
    .insert([
      {
        nom: nomNettoye,
        created_by: createdBy
      }
    ])
    .select('id')

  if (erreurCreation) {
    throw new Error(`Erreur création lieu : ${erreurCreation.message}`)
  }

  if (!nouveauLieu || nouveauLieu.length === 0) {
    throw new Error('Le lieu a été créé mais son identifiant est introuvable.')
  }

  return nouveauLieu[0].id
}

async function verifierDoublonFormation(nomFormation, lieuId) {
  const { data, error } = await sb
    .from('formations')
    .select('id, nom')
    .eq('nom', nomFormation)
    .eq('lieu_id', Number(lieuId))

  if (error) {
    throw new Error(`Erreur vérification doublon formation : ${error.message}`)
  }

  return !!(data && data.length > 0)
}

async function initialiserAjoutFormationConfig() {
  if (currentPageName() !== 'config.html') return

  const inputNom = document.getElementById('nom-formation')
  const inputLieu = document.getElementById('lieu-formation')
  const boutonAjouter = document.getElementById('btn-ajouter-formation')
  const message = document.getElementById('message-formation')

  if (!inputNom || !inputLieu || !boutonAjouter) return

  boutonAjouter.addEventListener('click', async () => {
    const nomFormation = inputNom.value.trim()
    const nomLieu = inputLieu.value.trim()

    if (message) {
      message.textContent = ''
      message.style.color = '#475569'
    }

    if (!nomFormation || !nomLieu) {
      if (message) {
        message.textContent = 'Merci de saisir un nom de formation et un nom de lieu.'
        message.style.color = '#b91c1c'
      }
      return
    }

    const { data: userData, error: userError } = await sb.auth.getUser()

    if (userError) {
      if (message) {
        message.textContent = `Erreur utilisateur : ${userError.message}`
        message.style.color = '#b91c1c'
      }
      return
    }

    const createdBy = userData?.user?.email || null

    try {
      const lieuId = await trouverOuCreerLieu(nomLieu, createdBy)

      const existeDeja = await verifierDoublonFormation(nomFormation, lieuId)
      if (existeDeja) {
        if (message) {
          message.textContent = 'Cette formation existe déjà pour ce lieu.'
          message.style.color = '#b91c1c'
        }
        return
      }

      const { error: erreurFormation } = await sb
        .from('formations')
        .insert([
          {
            nom: nomFormation,
            lieu_id: Number(lieuId),
            created_by: createdBy
          }
        ])

      if (erreurFormation) {
        if (message) {
          message.textContent = `Erreur enregistrement formation : ${erreurFormation.message}`
          message.style.color = '#b91c1c'
        }
        return
      }

      if (message) {
        message.textContent = 'Formation et lieu enregistrés avec succès.'
        message.style.color = '#166534'
      }

      marquerRecapARecharger()

      inputNom.value = ''
      inputLieu.value = ''
    } catch (err) {
      if (message) {
        message.textContent = err.message || 'Une erreur est survenue.'
        message.style.color = '#b91c1c'
      }
    }
  })
}

/* --------------------------------------------------
   SAISIE : LIEUX ET FORMATIONS
-------------------------------------------------- */

async function chargerLieuxDansSaisie() {
  if (currentPageName() !== 'saisie.html') return

  const selectLieu = document.getElementById('lieu')
  if (!selectLieu) return

  const { data, error } = await sb
    .from('lieux')
    .select('id, nom')

  if (error) {
    console.error('Erreur chargement lieux dans saisie :', error.message)
    return
  }

  selectLieu.innerHTML = '<option value="">Choisir un lieu</option>'

  data.forEach((lieu) => {
    const option = document.createElement('option')
    option.value = lieu.id
    option.textContent = lieu.nom
    selectLieu.appendChild(option)
  })
}

async function chargerFormationsDansSaisie(lieuId = '') {
  if (currentPageName() !== 'saisie.html') return

  const selectFormation = document.getElementById('formation')
  if (!selectFormation) return

  if (!lieuId) {
    selectFormation.innerHTML = '<option value="">Choisir d’abord un lieu</option>'
    return
  }

  const { data, error } = await sb
    .from('formations')
    .select('id, nom')
    .eq('lieu_id', Number(lieuId))

  if (error) {
    console.error('Erreur chargement formations dans saisie :', error.message)
    selectFormation.innerHTML = '<option value="">Impossible de charger les formations</option>'
    return
  }

  if (!data || data.length === 0) {
    selectFormation.innerHTML = '<option value="">Aucune formation pour ce lieu</option>'
    return
  }

  selectFormation.innerHTML = '<option value="">Choisir une formation</option>'

  data.forEach((formation) => {
    const option = document.createElement('option')
    option.value = formation.id
    option.textContent = formation.nom
    selectFormation.appendChild(option)
  })
}

function initialiserFiltreFormationsDansSaisie() {
  if (currentPageName() !== 'saisie.html') return

  const selectLieu = document.getElementById('lieu')
  if (!selectLieu) return

  selectLieu.addEventListener('change', () => {
    chargerFormationsDansSaisie(selectLieu.value)
  })
}

/* --------------------------------------------------
   SAISIE : ENREGISTREMENT DES MINI-STAGES
-------------------------------------------------- */

async function trouverIdClasseParNom(nomClasse) {
  const { data, error } = await sb
    .from('classes')
    .select('id, nom')
    .eq('nom', nomClasse)

  if (error) {
    throw new Error(`Erreur recherche classe : ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error(`Classe introuvable : ${nomClasse}`)
  }

  return data[0].id
}

async function initialiserEnregistrementMiniStage() {
  if (currentPageName() !== 'saisie.html') return

  const form = document.getElementById('form-saisie-mini-stage') || document.querySelector('.page-form')
  const message = document.getElementById('message-saisie')

  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const classeNom = document.getElementById('classe')?.value || ''
    const semaine = document.getElementById('semaine')?.value || ''
    const nom = document.getElementById('nom')?.value.trim() || ''
    const prenom = document.getElementById('prenom')?.value.trim() || ''
    const dateStage = document.getElementById('date_stage')?.value || ''
    const heureDebut = document.getElementById('heure_debut')?.value || ''
    const heureFin = document.getElementById('heure_fin')?.value || ''
    const lieuId = document.getElementById('lieu')?.value || ''
    const formationId = document.getElementById('formation')?.value || ''
    const etatConvention = document.getElementById('etat_convention')?.value || '?'
    const presenceStage = document.getElementById('presence_stage')?.value || '?'

    if (message) {
      message.textContent = ''
      message.style.color = '#475569'
    }

    if (
      !classeNom ||
      !semaine ||
      !nom ||
      !prenom ||
      !dateStage ||
      !heureDebut ||
      !heureFin ||
      !lieuId ||
      !formationId
    ) {
      if (message) {
        message.textContent = 'Merci de remplir tous les champs obligatoires.'
        message.style.color = '#b91c1c'
      }
      return
    }

    const { data: userData, error: userError } = await sb.auth.getUser()

    if (userError) {
      if (message) {
        message.textContent = `Erreur utilisateur : ${userError.message}`
        message.style.color = '#b91c1c'
      }
      return
    }

    const createdBy = userData?.user?.email || null

    try {
      const classeId = await trouverIdClasseParNom(classeNom)

      const { error } = await sb
        .from('mini_stages')
        .insert([
          {
            classe_id: Number(classeId),
            nom,
            prenom,
            semaine: Number(semaine),
            date_stage: dateStage,
            heure_debut: heureDebut,
            heure_fin: heureFin,
            lieu_id: Number(lieuId),
            formation_id: Number(formationId),
            etat_convention: etatConvention,
            presence_stage: presenceStage,
            created_by: createdBy
          }
        ])

      if (error) {
        if (message) {
          message.textContent = `Erreur enregistrement mini-stage : ${error.message}`
          message.style.color = '#b91c1c'
        }
        return
      }

      if (message) {
        message.textContent = 'Mini-stage enregistré avec succès.'
        message.style.color = '#166534'
      }

      form.reset()
      preselectionnerSemaineDansSaisie()
      await chargerLieuxDansSaisie()
      await chargerFormationsDansSaisie('')
    } catch (err) {
      if (message) {
        message.textContent = err.message || 'Une erreur est survenue.'
        message.style.color = '#b91c1c'
      }
    }
  })
}

/* --------------------------------------------------
   RECAP : MINI-STAGES
-------------------------------------------------- */

function formaterDateFr(yyyyMmDd) {
  if (!yyyyMmDd) return ''
  const [annee, mois, jour] = String(yyyyMmDd).split('-')
  if (!annee || !mois || !jour) return yyyyMmDd
  return `${jour}/${mois}/${annee}`
}

async function chargerMiniStagesDansRecap() {
  if (currentPageName() !== 'recap.html') return

  const tbody = document.getElementById('tableau-mini-stages')
  if (!tbody) return

  const { data, error } = await sb
    .from('mini_stages')
    .select(`
      nom,
      prenom,
      semaine,
      date_stage,
      heure_debut,
      heure_fin,
      etat_convention,
      presence_stage,
      classes (
        nom,
        couleur
      ),
      lieux (
        nom
      ),
      formations (
        nom
      )
    `)

  if (error) {
    console.error('Erreur chargement mini-stages :', error.message)
    tbody.innerHTML = `
      <tr class="ligne-vide">
        <td colspan="10">Impossible de charger les mini-stages.</td>
      </tr>
    `
    return
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr class="ligne-vide">
        <td colspan="10">Aucun mini-stage à afficher pour le moment.</td>
      </tr>
    `
    return
  }

  tbody.innerHTML = data.map((stage) => {
    const nomClasse = stage.classes?.nom || ''
    const couleurClasse = stage.classes?.couleur || '#64748b'
    const eleve = `${stage.nom || ''} ${stage.prenom || ''}`.trim()
    const horaires = `${stage.heure_debut || ''} - ${stage.heure_fin || ''}`
    const badgeClasse = nomClasse
      ? `<span class="badge-classe" style="background:${couleurClasse};">${nomClasse}</span>`
      : ''

    return `
      <tr>
        <td>${eleve}</td>
        <td>${badgeClasse}</td>
        <td>${stage.semaine ?? ''}</td>
        <td>${formaterDateFr(stage.date_stage)}</td>
        <td>${horaires}</td>
        <td>${stage.lieux?.nom || ''}</td>
        <td>${stage.formations?.nom || ''}</td>
        <td>${stage.etat_convention || ''}</td>
        <td>${stage.presence_stage || ''}</td>
        <td></td>
      </tr>
    `
  }).join('')
}

/* --------------------------------------------------
   INITIALISATION GLOBALE
-------------------------------------------------- */

async function initPage() {
  const autorise = await protectCurrentPage()
  if (!autorise && isProtectedPage(currentPageName())) return

  initialiserCouleursConfig()
  afficherSemaineDansRecap()
  preselectionnerSemaineDansSaisie()
  chargerFormationsDansRecap()
  verifierRechargementFormationsRecap()
  initialiserAjoutFormationConfig()

  await chargerLieuxDansSaisie()
  initialiserFiltreFormationsDansSaisie()
  initialiserEnregistrementMiniStage()
  chargerMiniStagesDansRecap()

  if (currentPageName() === 'saisie.html') {
    const selectLieu = document.getElementById('lieu')
    if (selectLieu && selectLieu.value) {
      chargerFormationsDansSaisie(selectLieu.value)
    } else {
      chargerFormationsDansSaisie('')
    }
  }
}

initPage()
