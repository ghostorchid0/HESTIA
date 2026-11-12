import {
  FiHome,
  FiSettings,
  FiUser,
  FiShoppingBag,
  FiTruck,
  FiCreditCard,
  FiUsers,
  FiFilter,
  FiTrash2,
  FiCheck,
  FiClock,
  FiX,
  FiAlertTriangle,
  FiInfo,
  FiMenu,
  FiDownload,
  FiVolume2,
  FiCoffee,
  FiGrid,
  FiBox,
  FiSearch,
  FiShoppingCart,
  FiSun,
  FiMoon,
  FiPlus
} from 'react-icons/fi'

const iconMap = {
  home: FiHome,
  settings: FiSettings,
  profile: FiUser,
  order: FiShoppingBag,
  delivery: FiTruck,
  payment: FiCreditCard,
  staff: FiUsers,
  filter: FiFilter,
  delete: FiTrash2,
  check: FiCheck,
  clock: FiClock,
  close: FiX,
  warning: FiAlertTriangle,
  info: FiInfo,
  menu: FiMenu,
  download: FiDownload,
  sound: FiVolume2,
  quality: FiCoffee,
  rooms: FiHome,
  hotels: FiGrid,
  dashboard: FiBox,
  search: FiSearch,
  cart: FiShoppingCart,
  sun: FiSun,
  moon: FiMoon,
  add: FiPlus
}

export default function Icon({ name, size = 24, color = 'currentColor', className = '' }) {
  const IconComponent = iconMap[name] || iconMap.info
  
  return (
    <IconComponent 
      size={size} 
      color={color}
      className={className}
    />
  )
}
