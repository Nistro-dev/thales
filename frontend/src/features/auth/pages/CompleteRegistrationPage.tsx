import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, UserPlus, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { invitationsApi } from '@/api/users.api'
import { ROUTES } from '@/constants/routes'
import toast from 'react-hot-toast'

const completeRegistrationSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial'),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: 'Vous devez accepter les conditions',
  }),
})

type CompleteRegistrationForm = z.infer<typeof completeRegistrationSchema>

export function CompleteRegistrationPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [isValidating, setIsValidating] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [tokenEmail, setTokenEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompleteRegistrationForm>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: {
      gdprConsent: false,
    },
  })

  const gdprConsent = watch('gdprConsent')

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false)
        setIsTokenValid(false)
        return
      }

      try {
        const response = await invitationsApi.validateToken(token)
        setIsTokenValid(response.data?.valid ?? false)
        setTokenEmail(response.data?.email ?? null)
      } catch {
        setIsTokenValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const onSubmit = async (data: CompleteRegistrationForm) => {
    if (!token) return

    setIsLoading(true)
    try {
      await invitationsApi.completeRegistration({
        token,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        gdprConsent: data.gdprConsent,
      })
      setIsSuccess(true)
      toast.success('Inscription réussie !')
    } catch {
      toast.error("Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid or missing token
  if (!token || !isTokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Lien d'invitation invalide</CardTitle>
            <CardDescription>
              Ce lien d'invitation n'est plus valide. Il a peut-être expiré ou a déjà été utilisé.
              Veuillez contacter un administrateur pour obtenir une nouvelle invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to={ROUTES.LOGIN} className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Inscription réussie !</CardTitle>
            <CardDescription>
              Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter avec votre
              adresse email et votre mot de passe.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to={ROUTES.LOGIN} className="w-full">
              <Button className="w-full">Se connecter</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Registration form
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Finaliser votre inscription
          </CardTitle>
          <CardDescription>
            {tokenEmail ? (
              <>
                Créez votre compte pour <strong>{tokenEmail}</strong>
              </>
            ) : (
              'Complétez vos informations pour créer votre compte'
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Jean"
                  {...register('firstName')}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  {...register('lastName')}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="gdprConsent"
                checked={gdprConsent}
                onCheckedChange={(checked: boolean | 'indeterminate') => setValue('gdprConsent', checked === true)}
                disabled={isLoading}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="gdprConsent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  J'accepte les conditions d'utilisation
                </label>
                <p className="text-xs text-muted-foreground">
                  En créant votre compte, vous acceptez nos{' '}
                  <Link
                    to={ROUTES.TERMS_OF_SERVICE}
                    className="text-primary hover:underline"
                    target="_blank"
                  >
                    conditions générales d'utilisation
                  </Link>{' '}
                  et notre{' '}
                  <Link
                    to={ROUTES.PRIVACY_POLICY}
                    className="text-primary hover:underline"
                    target="_blank"
                  >
                    politique de confidentialité
                  </Link>
                  .
                </p>
                {errors.gdprConsent && (
                  <p className="text-sm text-destructive">{errors.gdprConsent.message}</p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Création du compte...' : 'Créer mon compte'}
            </Button>
            <Link to={ROUTES.LOGIN} className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
