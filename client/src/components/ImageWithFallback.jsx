import { useState } from 'react'

export default function ImageWithFallback({ src, alt, className, fallback = '✦' }) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div className={`${className} flex items-center justify-center bg-hestia-linen text-2xl text-hestia-gold`}>
        {fallback}
      </div>
    )
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />
}
