/** Audio + annonce vocale pour l'appel patient (salle d'attente). */

let sharedCtx = null

function getAudioContext() {
  if (typeof window === "undefined") return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new Ctx()
  }
  return sharedCtx
}

/** Débloque le son navigateur (autoplay) après un geste utilisateur. */
export async function unlockWaitingRoomAudio() {
  try {
    const ctx = getAudioContext()
    if (ctx?.state === "suspended") await ctx.resume()
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
    }
  } catch {
    // ignore
  }
}

export async function playWaitingRoomChime() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === "suspended") await ctx.resume()

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

  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find((v) => v.lang?.startsWith(utter.lang.slice(0, 2)))
  if (preferred) utter.voice = preferred

  // Certains navigateurs ne parlent qu’après un tick / chargement des voix
  const speak = () => window.speechSynthesis.speak(utter)
  if (voices.length === 0) {
    window.speechSynthesis.addEventListener("voiceschanged", speak, { once: true })
    setTimeout(speak, 150)
  } else {
    speak()
  }
}

export async function playAndAnnounceWaitingRoomCall(payload, locale = "fr") {
  await unlockWaitingRoomAudio()
  await playWaitingRoomChime()
  // Léger délai pour laisser le ding-dong avant la voix
  setTimeout(() => announceWaitingRoomCall(payload, locale), 380)
}
