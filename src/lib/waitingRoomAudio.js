/** Audio + annonce vocale pour l'appel patient (salle d'attente). */

export function playWaitingRoomChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02 + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35 + i * 0.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.08)
      osc.stop(now + 0.45 + i * 0.1)
    })
  } catch {
    // ignore audio failures (autoplay policy, etc.)
  }
}

export function announceWaitingRoomCall(payload, locale = "fr") {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  const number = payload?.numeroPassage != null ? String(payload.numeroPassage).padStart(3, "0") : ""
  const room = payload?.salle || ""
  const patient = payload?.patientNom || ""
  const text =
    locale === "fr"
      ? payload?.rappel
        ? `Rappel. Patient numéro ${number}. ${patient}. Veuillez vous présenter en salle ${room}.`
        : `Patient numéro ${number}. ${patient}. Veuillez vous présenter en salle ${room}.`
      : payload?.rappel
        ? `Recall. Patient number ${number}. ${patient}. Please proceed to room ${room}.`
        : `Patient number ${number}. ${patient}. Please proceed to room ${room}.`
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = locale === "fr" ? "fr-FR" : "en-US"
  utter.rate = 0.95
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utter)
}

export function playAndAnnounceWaitingRoomCall(payload, locale = "fr") {
  playWaitingRoomChime()
  announceWaitingRoomCall(payload, locale)
}
