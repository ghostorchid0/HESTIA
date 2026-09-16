let audioElement = null

export function unlockAudio() {
  // No-op for HTML5 audio - it doesn't need unlocking
}

export function playBeep() {
  console.log('playBeep called with MP3')
  if (!audioElement) {
    console.log('Creating new Audio element')
    audioElement = new Audio('/sounds/ding.mp3')
    audioElement.volume = 0.5
    audioElement.addEventListener('error', (e) => {
      console.error('Audio element error:', e)
    })
    audioElement.addEventListener('canplay', () => {
      console.log('Audio can play')
    })
  }
  audioElement.currentTime = 0
  console.log('Playing audio')
  audioElement.play().then(() => {
    console.log('Audio played successfully')
  }).catch((err) => {
    console.error('Failed to play ding sound:', err)
  })
}
