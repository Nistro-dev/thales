import { LegalPageType } from '@prisma/client'
import { prisma } from '../utils/prisma.js'
import { ErrorMessages } from '../utils/response.js'

interface UpsertLegalPageParams {
  type: LegalPageType
  title: string
  content: string
  version?: string
  updatedBy: string
}

/**
 * Get a legal page by type
 */
export async function getLegalPage(type: LegalPageType) {
  return prisma.legalPage.findUnique({
    where: { type },
    include: {
      editor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

/**
 * Get all legal pages
 */
export async function getAllLegalPages() {
  return prisma.legalPage.findMany({
    include: {
      editor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { type: 'asc' },
  })
}

/**
 * Create or update a legal page
 */
export async function upsertLegalPage(params: UpsertLegalPageParams) {
  const existing = await prisma.legalPage.findUnique({
    where: { type: params.type },
  })

  if (existing) {
    // Update existing page, increment version if content changed
    let newVersion = existing.version
    if (params.content !== existing.content) {
      // Increment version number
      const versionNum = parseFloat(existing.version) || 1.0
      newVersion = (versionNum + 0.1).toFixed(1)
    }

    return prisma.legalPage.update({
      where: { type: params.type },
      data: {
        title: params.title,
        content: params.content,
        version: params.version || newVersion,
        updatedBy: params.updatedBy,
      },
      include: {
        editor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }

  // Create new page
  return prisma.legalPage.create({
    data: {
      type: params.type,
      title: params.title,
      content: params.content,
      version: params.version || '1.0',
      updatedBy: params.updatedBy,
    },
    include: {
      editor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

/**
 * Get the current version of the TERMS legal page
 */
export async function getCurrentTermsVersion(): Promise<string> {
  const termsPage = await prisma.legalPage.findUnique({
    where: { type: 'TERMS' },
    select: { version: true },
  })
  return termsPage?.version || '1.0'
}

/**
 * Get the default content for a legal page type
 */
export function getDefaultContent(type: LegalPageType): { title: string; content: string } {
  switch (type) {
    case 'TERMS':
      return {
        title: "Conditions Générales d'Utilisation",
        content: `<h2>Article 1 - Objet</h2>
<p>Les présentes conditions générales d'utilisation (CGU) régissent l'utilisation de l'application de prêt de matériel du CSE.</p>

<h2>Article 2 - Accès au service</h2>
<p>L'accès au service est réservé aux membres du personnel disposant d'un compte actif.</p>

<h2>Article 3 - Conditions d'emprunt</h2>
<p>Les conditions spécifiques d'emprunt (durée, caution, crédits) sont définies par le CSE et peuvent être modifiées à tout moment.</p>

<h2>Article 4 - Responsabilités</h2>
<p>L'emprunteur est responsable du matériel emprunté et s'engage à le restituer dans l'état dans lequel il lui a été confié.</p>`,
      }
    case 'PRIVACY':
      return {
        title: 'Politique de Confidentialité',
        content: `<h2>Collecte des données</h2>
<p>Nous collectons uniquement les données nécessaires au fonctionnement du service de prêt de matériel.</p>

<h2>Données collectées</h2>
<ul>
<li>Nom et prénom</li>
<li>Adresse email professionnelle</li>
<li>Historique des emprunts</li>
</ul>

<h2>Utilisation des données</h2>
<p>Vos données sont utilisées uniquement pour la gestion des emprunts et ne sont jamais partagées avec des tiers.</p>

<h2>Vos droits</h2>
<p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.</p>`,
      }
    case 'LEGAL_NOTICE':
      return {
        title: 'Mentions Légales',
        content: `<h2>Éditeur</h2>
<p>Cette application est éditée par le Comité Social et Économique (CSE).</p>

<h2>Hébergement</h2>
<p>L'application est hébergée par [Nom de l'hébergeur].</p>

<h2>Contact</h2>
<p>Pour toute question concernant l'application, veuillez contacter le CSE.</p>`,
      }
    default:
      return {
        title: 'Page légale',
        content: '<p>Contenu à définir.</p>',
      }
  }
}
