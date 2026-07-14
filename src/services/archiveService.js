import { http } from "./httpClient"

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
}
