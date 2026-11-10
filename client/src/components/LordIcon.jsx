import { useEffect, useRef } from 'react'
import { defineElement } from '@lordicon/element'

// Register the lord-icon custom element
defineElement()

const iconMap = {
  home: 'https://cdn.lordicon.com/etqbfrgp.json',
  settings: 'https://cdn.lordicon.com/oncyjozz.json',
  profile: 'https://cdn.lordicon.com/dqxvvqzi.json',
  order: 'https://cdn.lordicon.com/surjmvno.json',
  delivery: 'https://cdn.lordicon.com/innjjrve.json',
  quality: 'https://cdn.lordicon.com/iwaotjbp.json',
  sound: 'https://cdn.lordicon.com/webtefou.json',
  filter: 'https://cdn.lordicon.com/mxddzdmt.json',
  default: 'https://cdn.lordicon.com/rmkpgtpt.json'
}

export default function LordIcon({ name, size = 24, trigger = 'loop', colors = 'primary:#0B1A2A', delay = 0 }) {
  const iconRef = useRef(null)
  const src = iconMap[name] || iconMap.default

  useEffect(() => {
    if (iconRef.current && src) {
      iconRef.current.src = src
      iconRef.current.trigger = trigger
      iconRef.current.colors = colors
      iconRef.current.delay = delay
    }
  }, [src, trigger, colors, delay])

  return (
    <lord-icon
      ref={iconRef}
      style={{ width: size, height: size }}
      trigger={trigger}
      colors={colors}
      delay={delay}
    />
  )
}
