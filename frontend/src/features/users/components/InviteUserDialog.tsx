import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInviteUser } from '../hooks/useUsers'

const inviteUserSchema = z.object({
  email: z.string().email("Format d'email invalide"),
})

type InviteUserFormData = z.infer<typeof inviteUserSchema>

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const inviteUser = useInviteUser()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: InviteUserFormData) => {
    try {
      await inviteUser.mutateAsync(data.email)
      reset()
      onOpenChange(false)
    } catch {
      // Error handled in hook
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inviter un utilisateur
          </DialogTitle>
          <DialogDescription>
            Envoyez une invitation par email. L'utilisateur recevra un lien pour créer son compte
            avec ses propres informations (nom, prénom, mot de passe).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="utilisateur@example.com"
              autoFocus
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Comment ça fonctionne :</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>L'utilisateur reçoit un email avec un lien d'invitation</li>
              <li>Il clique sur le lien et accède au formulaire d'inscription</li>
              <li>Il complète ses informations et crée son mot de passe</li>
            </ol>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || inviteUser.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {inviteUser.isPending ? 'Envoi...' : 'Envoyer l\'invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
