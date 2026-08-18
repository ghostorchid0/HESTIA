let audioCtx = null

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

export function unlockAudio() {
  console.log('unlockAudio called')
  const ctx = getAudioContext()
  console.log('AudioContext obtained:', ctx, 'state:', ctx?.state)
  if (ctx && ctx.state === 'suspended') {
    console.log('Resuming suspended AudioContext')
    ctx.resume().then(() => {
      console.log('AudioContext resumed successfully')
    }).catch((err) => {
      console.error('Failed to resume AudioContext:', err)
    })
  } else if (ctx) {
    console.log('AudioContext state is not suspended:', ctx.state)
  } else {
    console.error('No AudioContext available to unlock')
  }
}

export function playBeep() {
  const ctx = getAudioContext()
  console.log('playBeep called, AudioContext:', ctx, 'state:', ctx?.state)
  if (!ctx) {
    console.error('No AudioContext available')
    return
  }
  if (ctx.state === 'suspended') {
    console.log('Resuming suspended AudioContext')
    ctx.resume().catch((err) => console.error('Failed to resume AudioContext:', err))
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

  console.log('Beep sound scheduled')
}
