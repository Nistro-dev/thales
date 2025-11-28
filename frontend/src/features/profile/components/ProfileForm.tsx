import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Pencil } from 'lucide-react'
import { useUpdateProfile } from '../hooks/useProfile'
import type { User } from '@/types'

interface ProfileFormProps {
  user: User
}

// French phone number regex: supports formats like:
// 01 23 45 67 89, 1 23 45 67 89, +33 1 23 45 67 89, +33 01 23 45 67 89
const phoneRegex = /^(\+\s?33\s?)?0?[1-9](\s?[0-9]{2}){4}$/

export function ProfileForm({ user }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName] = useState(user.lastName)
  const [phone, setPhone] = useState(user.phone || '')
  const [phoneError, setPhoneError] = useState('')

  const updateProfile = useUpdateProfile()

  const validatePhone = (value: string): boolean => {
    if (!value) {
      setPhoneError('')
      return true
    }
    if (!phoneRegex.test(value)) {
      setPhoneError('Format invalide (ex: 01 23 45 67 89 ou +33 1 23 45 67 89)')
      return false
    }
    setPhoneError('')
    return true
  }

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters except +
    const digits = value.replace(/[^\d+]/g, '')

    // Handle +33 prefix
    if (digits.startsWith('+33')) {
      const rest = digits.slice(3)
      const groups = rest.match(/.{1,2}/g) || []
      return '+33 ' + groups.join(' ')
    }

    // Handle regular French numbers (starting with 0 or without)
    const groups = digits.match(/.{1,2}/g) || []
    return groups.join(' ')
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow digits, spaces, and + sign
    const sanitized = value.replace(/[^\d\s+]/g, '')
    const formatted = formatPhoneNumber(sanitized)
    setPhone(formatted)
    if (formatted) {
      validatePhone(formatted)
    } else {
      setPhoneError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (phone && !validatePhone(phone)) {
      return
    }

    const data: { firstName?: string; lastName?: string; phone?: string } = {}

    if (firstName !== user.firstName) data.firstName = firstName
    if (lastName !== user.lastName) data.lastName = lastName
    if (phone !== (user.phone || '')) data.phone = phone || undefined

    if (Object.keys(data).length === 0) {
      setIsEditing(false)
      return
    }

    try {
      await updateProfile.mutateAsync(data)
      setIsEditing(false)
    } catch {
      // Error handled by mutation
    }
  }

  const handleCancel = () => {
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setPhone(user.phone || '')
    setPhoneError('')
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Modifier le profil</CardTitle>
            <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={!isEditing}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={!isEditing}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              disabled={!isEditing}
              placeholder="01 23 45 67 89"
              className={phoneError ? 'border-destructive' : ''}
            />
            {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={updateProfile.isPending || !!phoneError}>
                {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateProfile.isPending}
              >
                Annuler
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
