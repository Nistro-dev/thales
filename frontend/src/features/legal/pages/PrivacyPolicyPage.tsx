import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROUTES } from '@/constants/routes'

export function PrivacyPolicyPage() {
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
            <CardTitle className="text-2xl">Politique de Confidentialité</CardTitle>
            <p className="text-sm text-muted-foreground">Dernière mise à jour : Novembre 2024</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <h2 className="text-lg font-semibold mt-6 mb-3">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              Thales s'engage à protéger la vie privée de ses collaborateurs. Cette politique de
              confidentialité décrit comment nous collectons, utilisons et protégeons vos données
              personnelles dans le cadre de l'utilisation de la plateforme de réservation de matériel.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">2. Responsable du traitement</h2>
            <p className="text-muted-foreground mb-4">
              Le responsable du traitement des données personnelles est Thales, représenté par
              le Délégué à la Protection des Données (DPO) du groupe.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">3. Données collectées</h2>
            <p className="text-muted-foreground mb-4">
              Dans le cadre de l'utilisation de la Plateforme, nous collectons les données suivantes :
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li><strong>Données d'identification :</strong> nom, prénom, adresse email professionnelle</li>
              <li><strong>Données de connexion :</strong> identifiants, logs de connexion, adresse IP</li>
              <li><strong>Données d'utilisation :</strong> historique des réservations, solde de crédits</li>
              <li><strong>Données de contact :</strong> numéro de téléphone professionnel (optionnel)</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">4. Finalités du traitement</h2>
            <p className="text-muted-foreground mb-4">
              Vos données personnelles sont traitées pour les finalités suivantes :
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>Gestion de votre compte utilisateur</li>
              <li>Traitement et suivi de vos réservations de matériel</li>
              <li>Gestion du système de crédits</li>
              <li>Communication relative à vos réservations (notifications, rappels)</li>
              <li>Amélioration de la Plateforme et statistiques d'utilisation</li>
              <li>Sécurité et prévention des fraudes</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">5. Base légale</h2>
            <p className="text-muted-foreground mb-4">
              Le traitement de vos données est fondé sur :
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>L'exécution du contrat de travail et la mise à disposition d'outils professionnels</li>
              <li>L'intérêt légitime de Thales pour la gestion efficace de son parc matériel</li>
              <li>Votre consentement pour certains traitements spécifiques</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-3">6. Destinataires des données</h2>
            <p className="text-muted-foreground mb-4">
              Vos données sont accessibles uniquement aux personnes habilitées :
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>Les administrateurs de la Plateforme</li>
              <li>Les gestionnaires de votre section</li>
              <li>Les services informatiques pour la maintenance technique</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Vos données ne sont pas transmises à des tiers externes sans votre consentement.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">7. Durée de conservation</h2>
            <p className="text-muted-foreground mb-4">
              Vos données personnelles sont conservées pendant la durée de votre relation
              contractuelle avec Thales, puis archivées conformément aux obligations légales
              et réglementaires applicables. Les données de connexion sont conservées pendant
              une durée maximale de 12 mois.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">8. Sécurité des données</h2>
            <p className="text-muted-foreground mb-4">
              Thales met en œuvre des mesures techniques et organisationnelles appropriées pour
              protéger vos données contre tout accès non autorisé, modification, divulgation ou
              destruction. Ces mesures incluent le chiffrement des données, la gestion des accès
              et la surveillance des systèmes.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">9. Vos droits</h2>
            <p className="text-muted-foreground mb-4">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
              des droits suivants :
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
              <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Pour exercer ces droits, contactez le DPO à l'adresse indiquée ci-dessous.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">10. Cookies</h2>
            <p className="text-muted-foreground mb-4">
              La Plateforme utilise des cookies strictement nécessaires au fonctionnement du service
              (authentification, préférences). Aucun cookie publicitaire ou de traçage n'est utilisé.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">11. Contact</h2>
            <p className="text-muted-foreground mb-4">
              Pour toute question relative à cette politique de confidentialité ou pour exercer
              vos droits, vous pouvez contacter le Délégué à la Protection des Données (DPO)
              de Thales via les canaux internes habituels.
            </p>

            <h2 className="text-lg font-semibold mt-6 mb-3">12. Réclamation</h2>
            <p className="text-muted-foreground mb-4">
              Si vous estimez que le traitement de vos données n'est pas conforme à la réglementation,
              vous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale de
              l'Informatique et des Libertés) ou de toute autre autorité de contrôle compétente.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
