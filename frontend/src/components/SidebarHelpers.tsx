import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const navCls = (isActive: boolean) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`

export function SidebarNavLink({ to, icon: Icon, label, open }: { to: string; icon: any; label: string; open: boolean }) {
  return (
    <NavLink to={to} className={({ isActive }) => navCls(isActive)}>
      <Icon className="w-5 h-5" />{open && <span>{label}</span>}
    </NavLink>
  )
}

interface SectionItem { to: string; icon: any; label: string; permission?: boolean }
interface SidebarSectionProps {
  icon: any; label: string; isActive: boolean; isOpen: boolean; sidebarOpen: boolean
  onToggle: () => void; items: SectionItem[]
}

export function SidebarSection({ icon: Icon, label, isActive, isOpen, sidebarOpen, onToggle, items }: SidebarSectionProps) {
  const visible = items.filter(i => i.permission !== false)
  if (visible.length === 0) return null
  return (
    <div className="space-y-1">
      <button type="button" onClick={onToggle} className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}>
        <Icon className="w-5 h-5" />{sidebarOpen && <span>{label}</span>}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && sidebarOpen && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{type:'tween',duration:0.2}} className="overflow-hidden">
            <ul className="ml-5 space-y-1 border-l border-gray-300 pl-3">
              {visible.map(item => (
                <li key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => navCls(isActive)}>
                    <item.icon className="w-4 h-4" />{sidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
