import { useEffect, useRef, useState } from 'react'

export default function CategorySelect({ value, onChange, options, label }) {
  const [query, setQuery] = useState(value || '')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  const normalizedOptions = [...new Set(options.filter(Boolean))].sort()
  const filtered = normalizedOptions.filter(o => o.toLowerCase().includes(query.toLowerCase()))
  const exactMatch = normalizedOptions.some(o => o.toLowerCase() === query.toLowerCase())

  const select = (val) => {
    setQuery(val)
    onChange(val)
    setIsOpen(false)
  }

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    setIsOpen(true)
  }

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (query) select(query)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </label>
      )}
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="input-luxe w-full"
        autoComplete="off"
      />
      {isOpen && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-hestia-linen bg-white shadow-soft">
          {filtered.map(o => (
            <li
              key={o}
              onMouseDown={() => select(o)}
              className="cursor-pointer px-4 py-2 text-sm text-hestia-navy hover:bg-hestia-linen"
            >
              {o}
            </li>
          ))}
          {!exactMatch && query && (
            <li
              onMouseDown={() => select(query)}
              className="cursor-pointer px-4 py-2 text-sm font-semibold text-hestia-gold hover:bg-hestia-linen"
            >
              + {query}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
