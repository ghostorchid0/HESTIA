let audioCtx = null

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

export function unlockAudio() {
  const ctx = getAudioContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

export function playBeep() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  const now = ctx.currentTime
  const duration = 1.6

  // Luxury bell chord: A5, E6, A6 with soft harmonics
  const frequencies = [880, 1320, 1760]
  const gains = [0.25, 0.12, 0.08]

  const master = ctx.createGain()
  master.connect(ctx.destination)
  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(0.4, now + 0.01)
  master.gain.exponentialRampToValueAtTime(0.001, now + duration)

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)

    const partial = ctx.createGain()
    partial.gain.setValueAtTime(0, now)
    partial.gain.linearRampToValueAtTime(gains[i], now + 0.02)
    partial.gain.exponentialRampToValueAtTime(0.001, now + duration * (0.7 + i * 0.1))

    osc.connect(partial)
    partial.connect(master)

    osc.start(now)
    osc.stop(now + duration + 0.1)
  })

  // A little high shimmer for the "ting"
  const shimmer = ctx.createOscillator()
  shimmer.type = 'sine'
  shimmer.frequency.setValueAtTime(3520, now)

  const shimmerGain = ctx.createGain()
  shimmerGain.gain.setValueAtTime(0, now)
  shimmerGain.gain.linearRampToValueAtTime(0.05, now + 0.005)
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

  shimmer.connect(shimmerGain)
  shimmerGain.connect(master)
  shimmer.start(now)
  shimmer.stop(now + 0.7)
}
