import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Zap, Loader2, Workflow, Shield, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth.api'
import { projectsApi } from '@/api/projects.api'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import axios from 'axios'

const schema = z.object({
  subdomain: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
})
type FormData = z.infer<typeof schema>

const features = [
  { icon: Workflow, title: 'Visual Workflow Builder', desc: 'Design automation flows with an intuitive drag-and-drop canvas' },
  { icon: Shield, title: 'Encrypted Credentials', desc: 'AES-256 encrypted storage for all your API keys and secrets' },
  { icon: Rocket, title: 'Instant Webhooks', desc: 'Deploy webhook triggers with project-scoped subdomain isolation' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const { token, user } = await authApi.login(data)
      setAuth({ token, user, subdomain: data.subdomain, projectId: '', projectName: '' })
      const [project, members] = await Promise.all([projectsApi.getCurrent(), projectsApi.getMembers()])
      const role = members.find((m) => m.userId === user.id)?.role
      setAuth({ token, user: { ...user, role }, subdomain: project.subdomain, projectId: project.id, projectName: project.name })
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.error ?? 'Login failed' : 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-[52%] flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Automiq</span>
        </div>

        <div className="relative z-10 mt-auto mb-8">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Automate everything.<br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Ship faster.</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Build powerful workflow automations with a visual canvas, webhook triggers, and 6+ integrations.
          </p>

          <div className="mt-10 space-y-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {['A','B','C'].map((l) => (
                <div key={l} className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 border-2 border-slate-900 text-xs font-bold text-white">{l}</div>
              ))}
            </div>
            <p className="text-sm text-slate-300"><span className="text-white font-semibold">100+ teams</span> use n8n Clone to automate their workflows</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-background px-8 py-12">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>

        <div className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">n8n Clone</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your workspace to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subdomain">Workspace</Label>
              <div className="flex items-center rounded-lg border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
                <input id="subdomain" placeholder="your-workspace" autoComplete="off"
                  className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                  {...register('subdomain')} />
                <span className="border-l border-input bg-muted px-3 h-10 flex items-center text-sm text-muted-foreground">.localhost</span>
              </div>
              {errors.subdomain && <p className="text-xs text-destructive">{errors.subdomain.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" className={errors.email ? 'border-destructive' : ''} {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" className={errors.password ? 'border-destructive' : ''} {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting} variant="gradient">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No workspace yet?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline underline-offset-4">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
