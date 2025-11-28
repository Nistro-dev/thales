import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteSection, useDeleteSubSection } from '../hooks/useSectionsAdmin'
import type { Section, SubSection } from '@/types'

interface DeleteSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section?: Section | null
  subSection?: SubSection | null
}

export function DeleteSectionDialog({
  open,
  onOpenChange,
  section,
  subSection,
}: DeleteSectionDialogProps) {
  const deleteSection = useDeleteSection()
  const deleteSubSection = useDeleteSubSection()

  const isSection = !!section
  const item = section || subSection

  const handleDelete = async () => {
    if (!item) return

    try {
      if (isSection) {
        await deleteSection.mutateAsync(item.id)
      } else {
        await deleteSubSection.mutateAsync(item.id)
      }
      onOpenChange(false)
    } catch {
      // Error handled in hook
    }
  }

  if (!item) return null

  const isPending = deleteSection.isPending || deleteSubSection.isPending

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <AlertDialogTitle>
              Supprimer {isSection ? 'la section' : 'la sous-section'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Êtes-vous sûr de vouloir supprimer{' '}
                <strong className="text-foreground">{item.name}</strong> ?
              </p>
              {isSection ? (
                <p>
                  Les produits associés seront déplacés vers la section "Autres". Les sous-sections
                  deviendront orphelines.
                </p>
              ) : (
                <p>Les produits associés seront déplacés vers la section "Autres".</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? 'Suppression...' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
