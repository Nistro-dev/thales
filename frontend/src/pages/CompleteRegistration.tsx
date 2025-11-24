import { useEffect, useState } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import { invitationService } from '@/services'
import { Button, Input, Label, Card } from '@/components/ui'
import { useToast } from '@/hooks/useToast'

export const CompleteRegistration = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [email, setEmail] = useState('')
  const [inviterName, setInviterName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!token) {
        setLoading(false)
        setValid(false)
        return
      }
      try {
        const res = await invitationService.validateInvitationToken(token)
        if (!active) return
        setValid(res.valid)
        setEmail(res.email || '')
        setInviterName(res.inviterName || '')
      } catch (e) {
        setValid(false)
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setError('')
    try {
      await invitationService.completeRegistration({ token, name, password })
      setCompleted(true)
      toast({ title: 'Compte créé', description: 'Vous pouvez maintenant vous connecter.' })
    } catch (e) {
      const err = e as { error?: string }
      setError(err?.error || 'Erreur lors de la finalisation')
    }
  }

  if (completed) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    )
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 w-full max-w-md text-center">
          <h1 className="text-xl font-semibold mb-4">Invitation invalide ou expirée</h1>
          <p className="text-sm text-gray-600">Demandez un nouvel e-mail d'invitation à votre administrateur.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Finaliser votre inscription</h1>
          <p className="text-sm text-gray-600">Invité par {inviterName || 'un utilisateur'}</p>
          <p className="text-xs text-gray-500">{email}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom affiché</Label>
            <Input id="name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full">
            Créer mon compte
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default CompleteRegistration
