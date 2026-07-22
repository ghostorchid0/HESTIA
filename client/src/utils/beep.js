function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

function createBeepUrl() {
  const sampleRate = 44100
  const duration = 0.15
  const numSamples = Math.floor(sampleRate * duration)
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, numSamples * 2, true)

  const frequency = 880
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.5
    const pcm = Math.max(-1, Math.min(1, sample)) * 0x7fff
    view.setInt16(44 + i * 2, pcm, true)
  }

  const blob = new Blob([buffer], { type: 'audio/wav' })
  return URL.createObjectURL(blob)
}

let beepUrl = null

export function getBeepUrl() {
  if (!beepUrl && typeof window !== 'undefined') {
    beepUrl = createBeepUrl()
  }
  return beepUrl
}

export function playBeep() {
  const url = getBeepUrl()
  if (!url) return
  const audio = new Audio(url)
  audio.play().catch(() => {})
}
