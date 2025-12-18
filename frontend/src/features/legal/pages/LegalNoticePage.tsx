import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { legalApi } from "@/api/legal.api";

export function LegalNoticePage() {
  const { data: page, isLoading } = useQuery({
    queryKey: ["legal", "LEGAL_NOTICE"],
    queryFn: () => legalApi.getPage("LEGAL_NOTICE"),
  });

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
          {isLoading ? (
            <CardContent className="py-16 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {page?.title || "Mentions Légales"}
                  </CardTitle>
                  <Badge variant="outline">
                    Version {page?.version || "1.0"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Dernière mise à jour :{" "}
                  {page?.updatedAt
                    ? new Date(page.updatedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "N/A"}
                </p>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: page?.content || "" }}
                />
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
