import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import axios from 'axios'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  projectName: z.string().min(2, 'At least 2 characters'),
  subdomain: z.string().min(3).max(50).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Lowercase letters, numbers and hyphens only'),
})
type FormData = z.infer<typeof schema>

const steps = [
  { n: 1, label: 'Name your workspace' },
  { n: 2, label: 'Pick a subdomain' },
  { n: 3, label: 'Create your account' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const subdomain = watch('subdomain', '')

  const onSubmit = async (data: FormData) => {
    try {
      const { user, project } = await authApi.register(data)
      console.log(user,project)
      const loginRes = await authApi.login({ email: data.email, password: data.password, subdomain: data.subdomain })
      setAuth({ token: loginRes.token, user: { ...loginRes.user, role: 'admin' }, subdomain: project.subdomain, projectId: project.id, projectName: project.name })
      toast.success(`Workspace "${project.name}" created!`)
      navigate('/dashboard')
    } catch (err) {
      console.log(err)
      toast.error(axios.isAxiosError(err) ? err.response?.data?.error ?? 'Registration failed' : 'Registration failed')
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-[52%] flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Automiq</span>
        </div>

        <div className="relative z-10 mt-auto mb-12">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Get started<br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">in 30 seconds.</span>
          </h2>
          <p className="mt-4 text-slate-400 text-lg">Set up your workspace and start automating. No credit card required.</p>

          <div className="mt-10 space-y-4">
            {steps.map(({ n, label }) => (
              <div key={n} className="flex items-center gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-blue-500/30">{n}</div>
                <p className="text-sm font-medium text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">What you get</p>
          <div className="grid grid-cols-2 gap-2">
            {['6 node types','Webhook triggers','Cron scheduler','If/Else branching','Telegram & Slack','Execution logs'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />{f}
              </div>
            ))}
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
            <h1 className="text-2xl font-bold tracking-tight">Create your workspace</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Start automating in under a minute</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input placeholder="Acme Corp" {...register('projectName')} className={errors.projectName ? 'border-destructive' : ''} />
              {errors.projectName && <p className="text-xs text-destructive">{errors.projectName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Subdomain</Label>
              <div className="flex items-center rounded-lg border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
                <input placeholder="acme" autoComplete="off"
                  className="h-10 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground font-mono"
                  {...register('subdomain')} />
                <span className="border-l border-input bg-muted px-3 h-10 flex items-center text-sm text-muted-foreground">.localhost</span>
              </div>
              {subdomain && !errors.subdomain && (
                <p className="text-xs text-muted-foreground">Webhooks at: <span className="font-mono text-primary">{subdomain}.localhost/webhook/…</span></p>
              )}
              {errors.subdomain && <p className="text-xs text-destructive">{errors.subdomain.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="you@example.com" {...register('email')} className={errors.email ? 'border-destructive' : ''} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="Min 8 characters" {...register('password')} className={errors.password ? 'border-destructive' : ''} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11 mt-2" disabled={isSubmitting} variant="gradient">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating workspace…' : 'Create workspace'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have a workspace?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
