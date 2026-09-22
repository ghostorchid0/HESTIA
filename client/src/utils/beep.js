let audioElement = null

export function unlockAudio() {
  // No-op for HTML5 audio - it doesn't need unlocking
}

export function playBeep() {
  if (!audioElement) {
    audioElement = new Audio('/sounds/ding.mp3')
    audioElement.volume = 0.5
  }
  audioElement.currentTime = 0
  audioElement.play().catch((err) => {
    console.error('Failed to play ding sound:', err)
  })
}
