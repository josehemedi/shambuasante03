import { http, getToken, getHopitalId, API_BASE_URL } from "./httpClient"

const liveApiOnly = (fn) => fn()

export const archiveService = {
  getStats: () => liveApiOnly(() => http.get("/archives/statistiques")),

  list: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v))
    })
    const query = qs.toString()
    return liveApiOnly(() => http.get(`/archives${query ? `?${query}` : ""}`))
  },

  listAVerifier: (page = 0, size = 20) =>
    liveApiOnly(() => http.get(`/archives/a-verifier?page=${page}&size=${size}`)),

  listIncomplets: (page = 0, size = 20) =>
    liveApiOnly(() => http.get(`/archives/incomplets?page=${page}&size=${size}`)),

  listPretAArchiver: (page = 0, size = 20) =>
    liveApiOnly(() => http.get(`/archives/pret-a-archiver?page=${page}&size=${size}`)),

  listArchives: (params = {}) => archiveService.list({ ...params, statut: "ARCHIVE" }),

  getById: (id) => liveApiOnly(() => http.get(`/archives/${id}`)),

  getByPatient: (patientId) => liveApiOnly(() => http.get(`/archives/patient/${patientId}`)),

  getHistorique: (id) => liveApiOnly(() => http.get(`/archives/${id}/historique`)),

  listFichiers: (id) => liveApiOnly(() => http.get(`/archives/${id}/fichiers`)),

  regenererPdf: (id) => liveApiOnly(() => http.post(`/archives/${id}/fichiers/pdf`, {})),

  uploadFichier: async (archiveId, file, libelle) => {
    const headers = new Headers()
    const token = getToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
    const hopitalId = getHopitalId()
    if (hopitalId != null) headers.set("X-Hopital-Id", String(hopitalId))
    const form = new FormData()
    form.append("file", file)
    if (libelle) form.append("libelle", libelle)
    const response = await fetch(`${API_BASE_URL}/archives/${archiveId}/fichiers/upload`, {
      method: "POST",
      headers,
      body: form,
    })
    if (!response.ok) {
      let message = `HTTP ${response.status}`
      try {
        const payload = await response.json()
        message = payload.message || payload.error || message
      } catch {
        // ignore
      }
      throw new Error(message)
    }
    return response.json()
  },

  supprimerFichier: (archiveId, fichierId) =>
    liveApiOnly(() => http.delete(`/archives/${archiveId}/fichiers/${fichierId}`)),

  downloadFichierUrl: (archiveId, fichierId) =>
    `/archives/${archiveId}/fichiers/${fichierId}/download`,

  downloadFichierBlob: async (archiveId, fichierId) => {
    const headers = new Headers()
    const token = getToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
    const hopitalId = getHopitalId()
    if (hopitalId != null) headers.set("X-Hopital-Id", String(hopitalId))
    const response = await fetch(
      `${API_BASE_URL}/archives/${archiveId}/fichiers/${fichierId}/download`,
      { headers },
    )
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return response.blob()
  },

  verifier: (payload) => liveApiOnly(() => http.post("/archives/verifier", payload)),

  enregistrer: (payload) => liveApiOnly(() => http.post("/archives/enregistrer", payload)),

  marquerIncomplet: (id, payload) =>
    liveApiOnly(() => http.post(`/archives/${id}/marquer-incomplet`, payload)),

  pretAArchiver: (id, payload) =>
    liveApiOnly(() => http.post(`/archives/${id}/pret-a-archiver`, payload)),

  archiver: (id, payload) => liveApiOnly(() => http.post(`/archives/${id}/archiver`, payload)),

  restaurer: (id, payload) => liveApiOnly(() => http.post(`/archives/${id}/restaurer`, payload)),

  creerDemandeAcces: (id, payload) =>
    liveApiOnly(() => http.post(`/archives/${id}/demandes-acces`, payload)),

  listDemandesEnAttente: () => liveApiOnly(() => http.get("/archives/demandes-acces/en-attente")),

  accepterDemande: (demandeId, observation) =>
    liveApiOnly(() => http.put(`/archives/demandes-acces/${demandeId}/accepter`, { observation })),

  refuserDemande: (demandeId, observation) =>
    liveApiOnly(() => http.put(`/archives/demandes-acces/${demandeId}/refuser`, { observation })),

  getRegles: () => liveApiOnly(() => http.get("/archives/regles")),

  updateRegles: (regles) => liveApiOnly(() => http.put("/archives/regles", regles)),

  // Classement type explorateur Windows
  explorer: (folderId = null) => {
    const qs = folderId != null ? `?folderId=${folderId}` : ""
    return liveApiOnly(() => http.get(`/archives/classement/explorer${qs}`))
  },

  arbreDossiers: () => liveApiOnly(() => http.get("/archives/classement/arbre")),

  creerDossierVirtuel: (payload) =>
    liveApiOnly(() => http.post("/archives/classement/dossiers", payload)),

  renommerDossierVirtuel: (folderId, nom) =>
    liveApiOnly(() => http.put(`/archives/classement/dossiers/${folderId}/renommer`, { nom })),

  deplacerDossierVirtuel: (folderId, parentId) =>
    liveApiOnly(() => http.put(`/archives/classement/dossiers/${folderId}/deplacer`, { parentId })),

  supprimerDossierVirtuel: (folderId) =>
    liveApiOnly(() => http.delete(`/archives/classement/dossiers/${folderId}`)),

  deplacerArchiveDansDossier: (archiveId, dossierVirtuelId) =>
    liveApiOnly(() =>
      http.put(`/archives/classement/archives/${archiveId}/deplacer`, { dossierVirtuelId }),
    ),
}
