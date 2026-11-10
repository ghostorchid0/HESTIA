import { Icon } from '@iconify/react'

const iconMap = {
  home: 'lucide:home',
  settings: 'lucide:settings',
  profile: 'lucide:user',
  order: 'lucide:shopping-bag',
  delivery: 'lucide:truck',
  quality: 'lucide:utensils',
  sound: 'lucide:volume-2',
  filter: 'lucide:filter',
  delete: 'lucide:trash-2',
  check: 'lucide:check',
  clock: 'lucide:clock',
  close: 'lucide:x',
  warning: 'lucide:alert-triangle',
  info: 'lucide:info',
  menu: 'lucide:menu',
  download: 'lucide:download',
  payment: 'lucide:credit-card',
  staff: 'lucide:users',
  rooms: 'lucide:bed-double',
  hotels: 'lucide:building-2',
  dashboard: 'lucide:layout-dashboard'
}

export default function IconComponent({ name, size = 24, color = 'currentColor', className = '' }) {
  const iconName = iconMap[name] || iconMap.info
  
  return (
    <Icon 
      icon={iconName} 
      width={size} 
      height={size} 
      color={color}
      className={className}
    />
  )
}
