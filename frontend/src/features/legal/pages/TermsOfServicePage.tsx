import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROUTES } from '@/constants/routes'

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-muted/40 p-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link to={ROUTES.LOGIN}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Conditions Générales d'Utilisation</CardTitle>
            <p className="text-sm text-muted-foreground">Dernière mise à jour : Novembre 2024</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <h2 className="text-lg font-semibold mt-6 mb-3">1. Objet</h2>
            <p className="text-muted-foreground mb-4">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
              de la plateforme de réservation de matériel Thales (ci-après "la Plateforme").
              En accédant à la Plateforme, vous acceptez sans réserve les présentes CGU.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">2. Accès à la Plateforme</h2>
            <p className="text-muted-foreground mb-4">
              L'accès à la Plateforme est réservé aux collaborateurs de Thales disposant d'une
              invitation valide. Chaque utilisateur est responsable de la confidentialité de ses
              identifiants de connexion et s'engage à ne pas les communiquer à des tiers.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">3. Services proposés</h2>
            <p className="text-muted-foreground mb-4">
              La Plateforme permet aux utilisateurs autorisés de :
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>Consulter le catalogue de matériel disponible</li>
              <li>Effectuer des réservations de matériel</li>
              <li>Gérer leurs réservations en cours</li>
              <li>Consulter l'historique de leurs emprunts</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">4. Obligations de l'utilisateur</h2>
            <p className="text-muted-foreground mb-4">
              L'utilisateur s'engage à :
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>Utiliser la Plateforme conformément à sa destination</li>
              <li>Respecter les délais de réservation et de restitution du matériel</li>
              <li>Prendre soin du matériel emprunté et le restituer en bon état</li>
              <li>Signaler tout dysfonctionnement ou dommage constaté</li>
              <li>Ne pas utiliser la Plateforme à des fins illicites ou non autorisées</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">5. Système de crédits</h2>
            <p className="text-muted-foreground mb-4">
              La réservation de certains équipements peut nécessiter des crédits. Les crédits sont
              attribués par les administrateurs et ne sont pas transférables entre utilisateurs.
              Le solde de crédits est visible dans votre espace personnel.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">6. Responsabilité</h2>
            <p className="text-muted-foreground mb-4">
              L'utilisateur est responsable du matériel qui lui est confié pendant toute la durée
              de l'emprunt. En cas de perte, vol ou détérioration du matériel, l'utilisateur pourra
              être tenu responsable selon les procédures internes de Thales.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">7. Propriété intellectuelle</h2>
            <p className="text-muted-foreground mb-4">
              L'ensemble des éléments de la Plateforme (textes, images, logos, logiciels) sont
              protégés par le droit de la propriété intellectuelle. Toute reproduction ou
              représentation, totale ou partielle, est interdite sans autorisation préalable.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">8. Modification des CGU</h2>
            <p className="text-muted-foreground mb-4">
              Thales se réserve le droit de modifier les présentes CGU à tout moment. Les
              utilisateurs seront informés de toute modification substantielle. La poursuite
              de l'utilisation de la Plateforme vaut acceptation des nouvelles CGU.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">9. Contact</h2>
            <p className="text-muted-foreground mb-4">
              Pour toute question relative aux présentes CGU ou à l'utilisation de la Plateforme,
              veuillez contacter votre administrateur local ou le support technique.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
