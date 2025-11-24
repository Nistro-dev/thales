import { Link } from 'react-router-dom'
import { Card, Button } from '@/components/ui'

export const PendingApproval = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold mb-4">Compte en attente</h1>
        <p className="text-gray-600 mb-6">
          Votre compte a été créé avec succès. Un administrateur doit valider votre inscription avant
          que vous puissiez accéder à la plateforme.
        </p>
        <p className="text-gray-600 mb-6">
          Vous recevrez un email de confirmation dès que votre compte sera activé.
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full">
            Retour à la connexion
          </Button>
        </Link>
      </Card>
    </div>
  )
}
