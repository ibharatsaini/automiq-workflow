import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, GitBranch, PlayCircle, KeyRound, Settings, LogOut, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { toast } from 'sonner'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workflows', label: 'Workflows', icon: GitBranch },
  { to: '/executions', label: 'Executions', icon: PlayCircle },
  { to: '/credentials', label: 'Credentials', icon: KeyRound },
]

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  editor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  viewer: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export function Sidebar() {
  const { auth, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const initials = auth?.user.email?.slice(0, 2).toUpperCase() ?? 'U'

  const handleLogout = () => {
    clearAuth()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar overflow-hidden border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/30">
          <Zap className="h-5 w-5 text-white" />
          <div className="absolute inset-0 rounded-xl bg-white/10" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-sidebar-foreground">n8n Clone</p>
          <p className="text-[11px] text-sidebar-foreground/50 truncate font-mono">{auth?.subdomain}.localhost</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border mx-3 w-auto" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn(
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
            isActive
              ? 'bg-sidebar-primary/15 text-sidebar-primary shadow-sm'
              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
          )}>
            {({ isActive }) => (
              <>
                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all', isActive ? 'bg-sidebar-primary/20' : 'group-hover:bg-sidebar-accent-foreground/5')}>
                  <Icon className={cn('h-4 w-4', isActive ? 'text-sidebar-primary' : '')} />
                </div>
                <span>{label}</span>
                {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-2">
        <NavLink to="/project" className={({ isActive }) => cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
          isActive ? 'bg-sidebar-primary/15 text-sidebar-primary' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        )}>
          {({ isActive }) => (
            <>
              <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', isActive ? 'bg-sidebar-primary/20' : '')}>
                <Settings className="h-4 w-4" />
              </div>
              <span>Settings</span>
            </>
          )}
        </NavLink>
      </div>

      <Separator className="bg-sidebar-border mx-3 w-auto" />

      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-sidebar-foreground/40 font-medium">Appearance</span>
          <ThemeToggle variant="pill" />
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 px-3 py-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{auth?.user.email}</p>
            {auth?.user.role && (
              <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium capitalize mt-0.5', ROLE_COLORS[auth.user.role])}>
                {auth.user.role}
              </span>
            )}
          </div>
          <button onClick={handleLogout} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-red-400 transition-colors">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
