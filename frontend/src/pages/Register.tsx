import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button, Input, Label, Card } from '@/components/ui'

export const Register = () => {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    gdprConsent: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
    }
    if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir une majuscule'
    }
    if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir un chiffre'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    if (!formData.gdprConsent) {
      newErrors.gdprConsent = 'Vous devez accepter les conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gdprConsent: formData.gdprConsent,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Inscription</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <input
              id="gdprConsent"
              name="gdprConsent"
              type="checkbox"
              checked={formData.gdprConsent}
              onChange={handleChange}
              className="mt-1"
            />
            <Label htmlFor="gdprConsent" className="text-sm font-normal">
              J'accepte les conditions d'utilisation et la politique de confidentialité
            </Label>
          </div>
          {errors.gdprConsent && <p className="text-red-500 text-sm">{errors.gdprConsent}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Inscription...' : "S'inscrire"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </div>
      </Card>
    </div>
  )
}