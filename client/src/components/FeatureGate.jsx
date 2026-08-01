import useSubscription from '../hooks/useSubscription'

export default function FeatureGate({ feature, children, fallback = null }) {
  const { canAccessFeature } = useSubscription()
  if (canAccessFeature(feature)) return children
  if (fallback) return fallback
  return (
    <div className="relative rounded-2xl border border-hestia-linen bg-white/60 p-6 opacity-75 blur-[1px]">
      <div className="flex flex-col items-center justify-center gap-2 text-center text-gray-500">
        <span className="text-2xl">🔒</span>
        <p className="text-sm font-medium">This feature is available on a higher plan.</p>
      </div>
    </div>
  )
}
