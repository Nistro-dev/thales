import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  legalApi,
  type LegalPageType,
  getLegalPageTypeName,
} from "@/api/legal.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LegalPage() {
  const { type } = useParams<{ type: string }>();
  const pageType = type?.toUpperCase() as LegalPageType;

  const {
    data: page,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["legal", pageType],
    queryFn: () => legalApi.getPage(pageType),
    enabled:
      !!pageType && ["TERMS", "PRIVACY", "LEGAL_NOTICE"].includes(pageType),
  });

  if (!pageType || !["TERMS", "PRIVACY", "LEGAL_NOTICE"].includes(pageType)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Page non trouvée</p>
            <Button asChild variant="link" className="mt-4">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Impossible de charger cette page
            </p>
            <Button asChild variant="link" className="mt-4">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{page.title}</CardTitle>
            <Badge variant="outline">Version {page.version}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {getLegalPageTypeName(pageType)}
          </p>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
            Dernière mise à jour :{" "}
            {new Date(page.updatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
