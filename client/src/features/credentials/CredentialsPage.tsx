import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, KeyRound, Send, Hash, Loader2, ShieldCheck, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { credentialsApi } from '@/api/credentials.api'
import { useRole } from '@/hooks/useUserRole'
import { formatDate, cn } from '@/lib/utils'
import type { Credential } from '@/types'

const CRED_TYPES = {
  telegramApi: { label:'Telegram Bot API', icon:Send, color:'text-sky-600', bg:'bg-sky-50 dark:bg-sky-950/40', gradient:'from-sky-500 to-cyan-600', fields:[{ key:'accessToken', label:'Bot Token', placeholder:'7123456789:AAF...' }] },
  slackApi:    { label:'Slack Bot',        icon:Hash, color:'text-emerald-600', bg:'bg-emerald-50 dark:bg-emerald-950/40', gradient:'from-emerald-500 to-teal-600', fields:[{ key:'botToken', label:'Bot Token', placeholder:'xoxb-...' }] },
} as const
type CredTypeKey = keyof typeof CRED_TYPES

const schema = z.object({ name: z.string().min(1,'Required'), type: z.enum(['telegramApi','slackApi']), accessToken: z.string().optional(), botToken: z.string().optional() })
type FormData = z.infer<typeof schema>

function CreateCredentialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { type:'telegramApi' } })
  const selectedType = watch('type') as CredTypeKey
  const typeCfg = CRED_TYPES[selectedType]

  const createMut = useMutation({
    mutationFn: credentialsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey:['credentials'] }); toast.success('Credential saved securely'); reset(); onClose() },
    onError: () => toast.error('Failed to create credential'),
  })

  const onSubmit = (data: FormData) => {
    const credData = data.type === 'telegramApi' ? { accessToken: data.accessToken } : { botToken: data.botToken }
    createMut.mutate({ name: data.name, type: data.type, data: credData })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Credential</DialogTitle>
          <DialogDescription>Your credentials are encrypted with AES-256-CBC before storage and never returned by the API.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
          <div className="space-y-2">
            <Label>Service</Label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(CRED_TYPES) as Array<[CredTypeKey, typeof CRED_TYPES[CredTypeKey]]>).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button key={key} type="button" onClick={() => setValue('type', key)}
                    className={cn('flex items-center gap-2.5 rounded-xl border-2 p-3.5 text-sm font-medium transition-all', selectedType===key ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border text-muted-foreground hover:border-primary/40')}>
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cfg.bg)}>
                      <Icon className={cn('h-4 w-4', cfg.color)} />
                    </div>
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Credential Name</Label>
            <Input placeholder="e.g. Production Bot" {...register('name')} className={errors.name ? 'border-destructive' : ''} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          {typeCfg?.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <Input type="password" placeholder={field.placeholder} {...register(field.key as keyof FormData)} />
            </div>
          ))}
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400">Encrypted before storage. Raw values are only decrypted in-memory when a workflow node needs them — never returned by the API.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMut.isPending} variant="gradient">
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}<Lock className="h-3.5 w-3.5" />Save Encrypted
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CredentialCard({ credential }: { credential: Credential }) {
  const qc = useQueryClient()
  const { isAdmin } = useRole()
  const cfg = CRED_TYPES[credential.type as CredTypeKey]
  const Icon = cfg?.icon ?? KeyRound

  const deleteMut = useMutation({
    mutationFn: () => credentialsApi.delete(credential.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['credentials'] }); toast.success('Credential deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <div className={cn('h-1.5 w-full bg-gradient-to-r', cfg?.gradient ?? 'from-gray-400 to-gray-500')} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm', cfg?.bg ?? 'bg-muted')}>
              <Icon className={cn('h-5 w-5', cfg?.color ?? 'text-muted-foreground')} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{credential.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cfg?.label ?? credential.type}</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => { if (confirm(`Delete "${credential.name}"?`)) deleteMut.mutate() }} disabled={deleteMut.isPending}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-all">
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs text-muted-foreground font-medium">AES-256 encrypted</span>
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(credential.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function CredentialsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const { isEditor } = useRole()
  const { data: credentials, isLoading } = useQuery({ queryKey:['credentials'], queryFn: credentialsApi.list })

  return (
    <div className="min-h-full bg-muted/20">
      <PageHeader title="Credentials" description="Manage encrypted API keys and service integrations"
        action={isEditor && <Button onClick={() => setShowCreate(true)} variant="gradient"><Plus className="h-4 w-4" />Add Credential</Button>} />
      <div className="px-8 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        ) : !credentials?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 mb-4">
                <KeyRound className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="font-semibold text-lg">No credentials yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">Add credentials to connect your workflows to Telegram, Slack, and other services.</p>
              {isEditor && <Button className="mt-5" onClick={() => setShowCreate(true)} variant="gradient"><Plus className="h-4 w-4" />Add first credential</Button>}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {credentials.map((c) => <CredentialCard key={c.id} credential={c} />)}
          </div>
        )}
      </div>
      <CreateCredentialModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
