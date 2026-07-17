import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Room, RoomEvent, Track } from "livekit-client"
import { getMediaUnavailableReason, isMediaDevicesAvailable } from "@/lib/mediaDevices"

function styleVideoElement(element) {
  if (!element) return
  element.style.width = "100%"
  element.style.height = "100%"
  element.style.objectFit = "cover"
  element.style.objectPosition = "center"
}

function attachVideoTrack(track, element) {
  if (!track || track.kind !== Track.Kind.Video || !element) return false
  try {
    track.attach(element)
    styleVideoElement(element)
    element.muted = true
    element.playsInline = true
    element.play().catch(() => {})
    return true
  } catch {
    return false
  }
}

/** Attache une piste audio distante et force la lecture (autoplay). */
function attachRemoteAudioTrack(track, container) {
  if (!track || track.kind !== Track.Kind.Audio) return false
  try {
    const elements = track.attach()
    const list = Array.isArray(elements) ? elements : [elements]
    list.forEach((el) => {
      if (!el) return
      el.autoplay = true
      el.playsInline = true
      el.setAttribute("playsinline", "true")
      el.volume = 1
      el.muted = false
      if (container && !container.contains(el)) {
        container.appendChild(el)
      } else if (!el.parentElement) {
        document.body.appendChild(el)
      }
      el.play().catch(() => {})
    })
    return list.length > 0
  } catch (err) {
    console.warn("[livekit] attach audio:", err)
    return false
  }
}

function detachMediaTrack(track) {
  if (!track) return
  try {
    track.detach().forEach((el) => {
      el.remove()
    })
  } catch {
    try {
      track.detach()
    } catch {
      /* ignore */
    }
  }
}

function collectRemoteTracks(room, kind) {
  const tracks = []
  room.remoteParticipants.forEach((participant) => {
    participant.trackPublications.forEach((publication) => {
      if (publication.track && publication.track.kind === kind) {
        tracks.push(publication.track)
      }
    })
  })
  return tracks
}

function collectRemoteVideoTracks(room) {
  return collectRemoteTracks(room, Track.Kind.Video)
}

function collectRemoteAudioTracks(room) {
  return collectRemoteTracks(room, Track.Kind.Audio)
}

function isBrowserPermissionError(err) {
  const name = (err?.name || "").toLowerCase()
  return name === "notallowederror" || name === "securityerror"
}

function describeCameraError(err) {
  const name = (err?.name || "").toLowerCase()
  const message = (err?.message || "").toLowerCase()

  if (err?.message === "insecure-context" || message.includes("insecure-context")) {
    return "insecure-context"
  }
  if (err?.message === "not-supported" || name === "notsupportederror") return "not-supported"
  if (isBrowserPermissionError(err)) return "permission"
  if (name === "notfounderror" || message.includes("device not found")) return "not-found"
  if (name === "notreadableerror" || message.includes("could not start") || message.includes("in use")) {
    return "in-use"
  }
  return "unknown"
}

function describeMicError(err) {
  if (isBrowserPermissionError(err)) return "mic-permission"
  return "unknown"
}

async function requestCameraStream() {
  const unavailable = getMediaUnavailableReason()
  if (unavailable) {
    const err = new Error(unavailable)
    err.name = unavailable === "insecure-context" ? "SecurityError" : "NotSupportedError"
    throw err
  }

  const attempts = [
    { video: { facingMode: "user" }, audio: false },
    { video: true, audio: false },
  ]

  let lastError = null
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error("camera-unavailable")
}

/** Préflight utilisateur : caméra + micro dans le même geste (clic). */
async function requestAvStream() {
  const unavailable = getMediaUnavailableReason()
  if (unavailable) {
    const err = new Error(unavailable)
    err.name = unavailable === "insecure-context" ? "SecurityError" : "NotSupportedError"
    throw err
  }

  const attempts = [
    {
      video: { facingMode: "user" },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    },
    { video: true, audio: true },
    { video: { facingMode: "user" }, audio: false },
    { video: true, audio: false },
  ]

  let lastError = null
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error("media-unavailable")
}

async function requestMicStream() {
  const unavailable = getMediaUnavailableReason()
  if (unavailable) {
    const err = new Error(unavailable)
    err.name = unavailable === "insecure-context" ? "SecurityError" : "NotSupportedError"
    throw err
  }
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  })
}

function showStreamPreview(stream, element) {
  if (!stream || !element) return false
  element.srcObject = stream
  element.muted = true
  element.playsInline = true
  styleVideoElement(element)
  element.play().catch(() => {})
  return true
}

function bindVideoPlayback(element, onPlaying) {
  if (!element || element.dataset.playbackBound === "1") return
  element.dataset.playbackBound = "1"

  const notify = () => {
    const hasFrame = element.videoWidth > 0 && element.videoHeight > 0
    const hasStream = Boolean(element.srcObject?.getVideoTracks?.()?.some((t) => t.readyState === "live"))
    if (hasFrame || hasStream || element.readyState >= 2) {
      onPlaying()
    }
  }

  element.addEventListener("loadeddata", notify)
  element.addEventListener("playing", notify)
  element.addEventListener("resize", notify)
  notify()
}

function hasLiveCameraTrack(stream) {
  const track = stream?.getVideoTracks?.()?.[0]
  return Boolean(track && track.readyState === "live")
}

export function useLiveKitRoom({ serverUrl, token, enabled, initialCameraStream }) {
  const roomRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const previewStreamRef = useRef(null)
  const initialCameraStreamRef = useRef(null)
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState(null)
  const [mediaError, setMediaError] = useState(null)
  const [cameraDenied, setCameraDenied] = useState(false)
  const [micDenied, setMicDenied] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)
  const [localVideoReady, setLocalVideoReady] = useState(false)
  const [remoteConnected, setRemoteConnected] = useState(false)
  const [remoteParticipantPresent, setRemoteParticipantPresent] = useState(false)

  useEffect(() => {
    initialCameraStreamRef.current = initialCameraStream || null
    if (!initialCameraStream) return

    previewStreamRef.current = initialCameraStream
    const element = localVideoRef.current
    if (element) {
      showStreamPreview(initialCameraStream, element)
    }
    if (hasLiveCameraTrack(initialCameraStream)) {
      setLocalVideoReady(true)
      setCamOn(true)
      setCameraDenied(false)
      setMediaError(null)
    }
  }, [initialCameraStream])

  const clearCameraWarnings = useCallback(() => {
    setCameraDenied(false)
    setMediaError((current) => (current === "permission" ? null : current))
  }, [])

  const markCameraActive = useCallback(() => {
    setLocalVideoReady(true)
    setCamOn(true)
    clearCameraWarnings()
  }, [clearCameraWarnings])

  const stopPreviewStream = useCallback(() => {
    const stream = previewStreamRef.current
    if (stream && stream !== initialCameraStreamRef.current) {
      stream.getTracks().forEach((track) => track.stop())
    }
    previewStreamRef.current = null
    initialCameraStreamRef.current = null
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
  }, [])

  const syncLocalVideo = useCallback(
    (room) => {
      if (room) {
        const publication = room.localParticipant.getTrackPublication(Track.Source.Camera)
        const track = publication?.track
        if (track && attachVideoTrack(track, localVideoRef.current)) {
          markCameraActive()
          return true
        }
      }

      if (previewStreamRef.current && localVideoRef.current) {
        if (!localVideoRef.current.srcObject) {
          showStreamPreview(previewStreamRef.current, localVideoRef.current)
        }
        if (hasLiveCameraTrack(previewStreamRef.current)) {
          markCameraActive()
          return true
        }
      }

      return false
    },
    [markCameraActive],
  )

  const setLocalVideoElement = useCallback(
    (element) => {
      localVideoRef.current = element
      if (!element) return

      styleVideoElement(element)
      bindVideoPlayback(element, markCameraActive)

      if (previewStreamRef.current) {
        showStreamPreview(previewStreamRef.current, element)
      }
      if (roomRef.current) {
        syncLocalVideo(roomRef.current)
      } else if (hasLiveCameraTrack(previewStreamRef.current)) {
        markCameraActive()
      }
    },
    [syncLocalVideo, markCameraActive],
  )

  useLayoutEffect(() => {
    if (!localVideoRef.current) return
    if (roomRef.current) {
      syncLocalVideo(roomRef.current)
    } else if (previewStreamRef.current) {
      showStreamPreview(previewStreamRef.current, localVideoRef.current)
      if (hasLiveCameraTrack(previewStreamRef.current)) {
        markCameraActive()
      }
    }
  }, [localVideoReady, camOn, syncLocalVideo, markCameraActive])

  const syncRemoteAudio = useCallback((room) => {
    collectRemoteAudioTracks(room).forEach((track) => {
      attachRemoteAudioTrack(track)
    })
  }, [])

  const syncRemoteMedia = useCallback(
    (room) => {
      const remoteTracks = collectRemoteVideoTracks(room)
      setRemoteParticipantPresent(room.remoteParticipants.size > 0)
      syncRemoteAudio(room)

      if (remoteTracks.length === 0) {
        setRemoteConnected(false)
        return
      }

      const attached = attachVideoTrack(remoteTracks[0], remoteVideoRef.current)
      setRemoteConnected(attached)
    },
    [syncRemoteAudio],
  )

  const publishPreviewStream = useCallback(
    async (room, stream) => {
      const videoTrack = stream.getVideoTracks()[0]
      const audioTrack = stream.getAudioTracks()[0]
      if (!videoTrack && !audioTrack) return false

      previewStreamRef.current = stream

      try {
        if (videoTrack && !room.localParticipant.getTrackPublication(Track.Source.Camera)) {
          await room.localParticipant.publishTrack(videoTrack, { source: Track.Source.Camera })
        }
        if (audioTrack && !room.localParticipant.getTrackPublication(Track.Source.Microphone)) {
          await room.localParticipant.publishTrack(audioTrack, {
            source: Track.Source.Microphone,
          })
          setMicOn(true)
          setMicDenied(false)
        }
        return videoTrack ? syncLocalVideo(room) : Boolean(audioTrack)
      } catch (err) {
        console.warn("[livekit] publication média:", err)
        if (videoTrack && localVideoRef.current) {
          showStreamPreview(stream, localVideoRef.current)
        }
        if (hasLiveCameraTrack(stream)) {
          markCameraActive()
        }
        return false
      }
    },
    [syncLocalVideo, markCameraActive],
  )

  const enableCamera = useCallback(async () => {
    const room = roomRef.current
    if (!room) {
      setMediaError("not-connected")
      return false
    }

    if (hasLiveCameraTrack(previewStreamRef.current)) {
      if (localVideoRef.current) {
        showStreamPreview(previewStreamRef.current, localVideoRef.current)
      }
      await publishPreviewStream(room, previewStreamRef.current)
      clearCameraWarnings()
      return true
    }

    if (!isMediaDevicesAvailable()) {
      const reason = getMediaUnavailableReason() || "not-supported"
      setMediaError(reason)
      setCamOn(false)
      setLocalVideoReady(false)
      return false
    }

    try {
      await room.localParticipant.setCameraEnabled(true, { facingMode: "user" })
      if (syncLocalVideo(room)) {
        clearCameraWarnings()
        return true
      }
    } catch (err) {
      console.warn("[livekit] setCameraEnabled:", err)
    }

    try {
      const stream = await requestCameraStream()
      previewStreamRef.current = stream
      if (localVideoRef.current) {
        showStreamPreview(stream, localVideoRef.current)
      }
      markCameraActive()
      await publishPreviewStream(room, stream)
      clearCameraWarnings()
      return true
    } catch (err) {
      const kind = describeCameraError(err)
      if (kind === "permission") {
        setCameraDenied(true)
        setMediaError("permission")
      } else if (kind === "not-found") {
        setMediaError("not-found")
      } else if (kind === "in-use") {
        setMediaError("in-use")
      } else {
        setMediaError("unknown")
      }
      setCamOn(false)
      setLocalVideoReady(false)
      console.warn("[livekit] caméra:", err)
      return false
    }
  }, [syncLocalVideo, publishPreviewStream, markCameraActive, clearCameraWarnings])

  const enableMicrophone = useCallback(async () => {
    const room = roomRef.current
    if (!room) return false

    try {
      if (room.localParticipant.isMicrophoneEnabled) {
        setMicOn(true)
        setMicDenied(false)
        return true
      }

      if (!isMediaDevicesAvailable()) {
        setMicOn(false)
        return false
      }

      await room.localParticipant.setMicrophoneEnabled(true)
      setMicOn(true)
      setMicDenied(false)
      setMediaError((current) => (current === "mic-permission" ? null : current))
      return true
    } catch (err) {
      try {
        const stream = await requestMicStream()
        const audioTrack = stream.getAudioTracks()[0]
        if (audioTrack) {
          await room.localParticipant.publishTrack(audioTrack, { source: Track.Source.Microphone })
          stream.getTracks().forEach((track) => {
            if (track !== audioTrack) track.stop()
          })
          setMicOn(true)
          setMicDenied(false)
          setMediaError((current) => (current === "mic-permission" ? null : current))
          return true
        }
      } catch (micErr) {
        if (describeMicError(micErr) === "mic-permission") {
          setMicDenied(true)
          setMediaError("mic-permission")
        }
        setMicOn(false)
        return false
      }

      if (describeMicError(err) === "mic-permission") {
        setMicDenied(true)
        setMediaError("mic-permission")
      }
      setMicOn(false)
      return false
    }
  }, [])

  const startLocalMedia = useCallback(async () => {
    const cameraOk = await enableCamera()
    const micOk = await enableMicrophone()
    return cameraOk || micOk
  }, [enableCamera, enableMicrophone])

  const bootstrapLocalMedia = useCallback(async () => {
    const room = roomRef.current
    if (!room || status !== "connected") return false

    const pending = initialCameraStreamRef.current || previewStreamRef.current
    if (pending && (hasLiveCameraTrack(pending) || pending.getAudioTracks?.()?.length)) {
      previewStreamRef.current = pending
      if (localVideoRef.current && hasLiveCameraTrack(pending)) {
        showStreamPreview(pending, localVideoRef.current)
      }
      if (hasLiveCameraTrack(pending)) {
        markCameraActive()
      }
      await publishPreviewStream(room, pending)
      initialCameraStreamRef.current = null
      if (!room.localParticipant.isMicrophoneEnabled) {
        await enableMicrophone()
      }
      return true
    }

    return startLocalMedia()
  }, [status, publishPreviewStream, markCameraActive, startLocalMedia, enableMicrophone])

  useEffect(() => {
    if (!enabled || !serverUrl || !token) {
      return undefined
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    roomRef.current = room
    let cancelled = false

    const handleRemoteTrack = (track) => {
      if (track.kind === Track.Kind.Audio) {
        attachRemoteAudioTrack(track)
        setRemoteParticipantPresent(true)
        return
      }
      if (track.kind !== Track.Kind.Video) return
      const attached = attachVideoTrack(track, remoteVideoRef.current)
      if (attached) {
        setRemoteConnected(true)
        setRemoteParticipantPresent(true)
      }
    }

    room.on(RoomEvent.TrackSubscribed, (track) => handleRemoteTrack(track))
    room.on(RoomEvent.TrackMuted, (publication) => {
      if (publication.kind === Track.Kind.Audio && publication.track) {
        attachRemoteAudioTrack(publication.track)
      }
    })
    room.on(RoomEvent.TrackUnmuted, (publication) => {
      if (publication.kind === Track.Kind.Audio && publication.track) {
        attachRemoteAudioTrack(publication.track)
      }
    })
    room.on(RoomEvent.ParticipantConnected, () => {
      setRemoteParticipantPresent(room.remoteParticipants.size > 0)
      syncRemoteMedia(room)
    })
    room.on(RoomEvent.ParticipantDisconnected, () => {
      setRemoteParticipantPresent(room.remoteParticipants.size > 0)
      syncRemoteMedia(room)
    })
    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      if (track.kind === Track.Kind.Audio || track.kind === Track.Kind.Video) {
        detachMediaTrack(track)
        syncRemoteMedia(room)
      }
    })
    room.on(RoomEvent.LocalTrackPublished, (publication) => {
      if (publication.source === Track.Source.Camera) {
        syncLocalVideo(room)
      }
      if (publication.source === Track.Source.Microphone) {
        setMicOn(true)
        setMicDenied(false)
      }
    })

    async function connect() {
      try {
        setStatus("connecting")
        setError(null)
        setRemoteConnected(false)
        setRemoteParticipantPresent(false)

        await room.connect(serverUrl, token)
        if (cancelled) return

        setStatus("connected")
        syncRemoteMedia(room)

        const pending = initialCameraStreamRef.current || previewStreamRef.current
        if (pending && (hasLiveCameraTrack(pending) || pending.getAudioTracks?.()?.length)) {
          previewStreamRef.current = pending
          if (localVideoRef.current && hasLiveCameraTrack(pending)) {
            showStreamPreview(pending, localVideoRef.current)
          }
          if (hasLiveCameraTrack(pending)) {
            markCameraActive()
          }
          await publishPreviewStream(room, pending)
          initialCameraStreamRef.current = null
        }

        if (!cancelled && isMediaDevicesAvailable()) {
          try {
            if (!room.localParticipant.isMicrophoneEnabled) {
              await room.localParticipant.setMicrophoneEnabled(true)
            }
            setMicOn(Boolean(room.localParticipant.isMicrophoneEnabled))
            setMicDenied(false)
          } catch (micErr) {
            console.warn("[livekit] micro au démarrage:", micErr)
            try {
              const stream = await requestMicStream()
              const audioTrack = stream.getAudioTracks()[0]
              if (audioTrack && !room.localParticipant.getTrackPublication(Track.Source.Microphone)) {
                await room.localParticipant.publishTrack(audioTrack, {
                  source: Track.Source.Microphone,
                })
                setMicOn(true)
                setMicDenied(false)
              }
            } catch (fallbackErr) {
              if (describeMicError(fallbackErr) === "mic-permission") {
                setMicDenied(true)
                setMediaError("mic-permission")
              }
              setMicOn(false)
            }
          }
        }

        if (!cancelled) {
          syncRemoteMedia(room)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Connexion LiveKit impossible")
          setStatus("error")
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      stopPreviewStream()
      room.disconnect()
      roomRef.current = null
      setRemoteConnected(false)
      setRemoteParticipantPresent(false)
      setLocalVideoReady(false)
      setCamOn(false)
      setMicOn(false)
    }
  }, [
    enabled,
    serverUrl,
    token,
    syncRemoteMedia,
    syncLocalVideo,
    publishPreviewStream,
    markCameraActive,
    stopPreviewStream,
  ])

  useEffect(() => {
    if (status !== "connected" || localVideoReady) return undefined

    const timer = window.setInterval(() => {
      if (roomRef.current) {
        syncLocalVideo(roomRef.current)
      }
    }, 400)

    return () => window.clearInterval(timer)
  }, [status, localVideoReady, syncLocalVideo])

  const toggleMic = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    if (!micOn) {
      await enableMicrophone()
      return
    }
    try {
      await room.localParticipant.setMicrophoneEnabled(false)
      setMicOn(false)
    } catch {
      setMicOn(false)
    }
  }, [micOn, enableMicrophone])

  const toggleCam = useCallback(async () => {
    const room = roomRef.current
    if (!room) return

    if (camOn || localVideoReady) {
      stopPreviewStream()
      try {
        await room.localParticipant.setCameraEnabled(false)
      } catch {
        // ignore
      }
      setCamOn(false)
      setLocalVideoReady(false)
      return
    }

    await enableCamera()
  }, [camOn, localVideoReady, enableCamera, stopPreviewStream])

  const disconnect = useCallback(() => {
    stopPreviewStream()
    roomRef.current?.disconnect()
    roomRef.current = null
    setStatus("idle")
    setRemoteConnected(false)
    setRemoteParticipantPresent(false)
    setLocalVideoReady(false)
    setCamOn(false)
    setMicOn(false)
    setCameraDenied(false)
    setMicDenied(false)
    setMediaError(null)
  }, [stopPreviewStream])

  const showCameraWarning = cameraDenied || mediaError === "permission"
  const showMicWarning = micDenied || mediaError === "mic-permission"
  const hasLocalPreview = localVideoReady || camOn

  return {
    status,
    error,
    mediaError,
    cameraDenied,
    micDenied,
    showCameraWarning: showCameraWarning && !hasLocalPreview,
    showMicWarning,
    mediaWarning: showCameraWarning || showMicWarning ? "media-permission" : null,
    localVideoRef: setLocalVideoElement,
    remoteVideoRef,
    micOn,
    camOn,
    localVideoReady: hasLocalPreview,
    toggleMic,
    toggleCam,
    enableCamera,
    enableMicrophone,
    startLocalMedia,
    bootstrapLocalMedia,
    disconnect,
    remoteConnected,
    remoteParticipantPresent,
  }
}

/** Demande caméra + micro pendant un clic utilisateur (avant les appels réseau). */
export async function primeTeleconsultationMedia() {
  try {
    return await requestAvStream()
  } catch {
    try {
      return await requestCameraStream()
    } catch {
      return null
    }
  }
}
