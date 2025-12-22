import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Edit, Loader2, Save, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  legalApi,
  type LegalPage,
  type LegalPageType,
  getLegalPageTypeName,
  getLegalPageTypeShortName,
} from "@/api/legal.api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";

export function AdminLegalPagesPage() {
  const queryClient = useQueryClient();
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Fetch all legal pages
  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin", "legal-pages"],
    queryFn: () => legalApi.getAllPages(),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: {
      type: LegalPageType;
      title: string;
      content: string;
    }) =>
      legalApi.updatePage(data.type, {
        title: data.title,
        content: data.content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "legal-pages"] });
      queryClient.invalidateQueries({ queryKey: ["legal"] });
      toast.success("Page légale mise à jour avec succès");
      setEditingPage(null);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const handleEdit = (page: LegalPage) => {
    setEditingPage(page);
    setEditTitle(page.title);
    setEditContent(page.content);
  };

  const handleSave = () => {
    if (!editingPage) return;
    updateMutation.mutate({
      type: editingPage.type,
      title: editTitle,
      content: editContent,
    });
  };

  const handleCloseDialog = () => {
    setEditingPage(null);
    setEditTitle("");
    setEditContent("");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Pages Légales
          </h1>
          <p className="text-muted-foreground">
            Gérez le contenu des pages légales
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Pages Légales
        </h1>
        <p className="text-muted-foreground">
          Gérez le contenu des CGU, politique de confidentialité et mentions
          légales
        </p>
      </div>

      {/* Legal Pages Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {pages?.map((page) => (
          <Card key={page.type}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {getLegalPageTypeShortName(page.type)}
                  </CardTitle>
                  <CardDescription>
                    {getLegalPageTypeName(page.type)}
                  </CardDescription>
                </div>
                <Badge variant={page.id ? "default" : "secondary"}>
                  {page.id ? `v${page.version}` : "Par défaut"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {page.title}
                </p>

                {page.editor && (
                  <p className="text-xs text-muted-foreground">
                    Modifié par {page.editor.firstName} {page.editor.lastName}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      to={
                        page.type === "TERMS"
                          ? ROUTES.TERMS_OF_SERVICE
                          : page.type === "PRIVACY"
                            ? ROUTES.PRIVACY_POLICY
                            : ROUTES.LEGAL_NOTICE
                      }
                      target="_blank"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingPage}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Modifier {editingPage && getLegalPageTypeName(editingPage.type)}
            </DialogTitle>
            <DialogDescription>
              Modifiez le contenu de cette page légale. Les modifications seront
              immédiatement visibles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titre de la page"
              />
            </div>

            <div className="space-y-2">
              <Label>Contenu</Label>
              <RichTextEditor content={editContent} onChange={setEditContent} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
