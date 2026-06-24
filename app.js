// app.js — version minimale
// Remplace les 2 valeurs ci-dessous par celles de ton projet Supabase.
// Elles se trouvent dans Supabase > Settings > API Keys. 
// Pour un site web, utilise la clé "Publishable key". 
// Supabase indique que la publishable key est prévue pour les composants publics
// comme les pages web. 

const SUPABASE_URL = 'https://VOTRE-PROJET.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dDgWNoCh43KsVEHJmpoEzg_4WSDyrvt'

// Cette version suppose que la bibliothèque Supabase est déjà chargée
// dans la page HTML via un script CDN.
const { createClient } = supabase

// Client unique pour toute l'application
const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

// On le rend accessible partout
window.sb = sb

console.log('Supabase initialisé')

// Petite fonction de test
async function testerConnexion() {
  const { data, error } = await sb
    .from('classes')
    .select('*')
    .limit(5)

  if (error) {
    console.error('Erreur Supabase :', error)
    return
  }

  console.log('Connexion OK, classes trouvées :', data)
}

// Décommente cette ligne si tu veux lancer un test dès le chargement
// testerConnexion()
