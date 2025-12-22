import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSectionsAdmin } from "../hooks/useSectionsAdmin";
import {
  SectionTree,
  SectionFormDialog,
  SubSectionFormDialog,
  DeleteSectionDialog,
} from "../components";
import type { SectionWithCount } from "@/api/sections.api";
import type { Section, SubSection } from "@/types";

export function AdminSectionsPage() {
  const navigate = useNavigate();
  const { data: sections, isLoading, isError } = useSectionsAdmin(true);

  // Section form dialog
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // SubSection form dialog
  const [subSectionDialogOpen, setSubSectionDialogOpen] = useState(false);
  const [editingSubSection, setEditingSubSection] = useState<SubSection | null>(
    null,
  );
  const [parentSectionId, setParentSectionId] = useState<string>("");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);
  const [deletingSubSection, setDeletingSubSection] =
    useState<SubSection | null>(null);

  // Handlers
  const handleAddSection = () => {
    setEditingSection(null);
    setSectionDialogOpen(true);
  };

  const handleEditSection = (section: SectionWithCount) => {
    setEditingSection(section);
    setSectionDialogOpen(true);
  };

  const handleDeleteSection = (section: SectionWithCount) => {
    setDeletingSection(section);
    setDeletingSubSection(null);
    setDeleteDialogOpen(true);
  };

  const handleAddSubSection = (sectionId: string) => {
    setParentSectionId(sectionId);
    setEditingSubSection(null);
    setSubSectionDialogOpen(true);
  };

  const handleEditSubSection = (subSection: SubSection, sectionId: string) => {
    setParentSectionId(sectionId);
    setEditingSubSection(subSection);
    setSubSectionDialogOpen(true);
  };

  const handleDeleteSubSection = (subSection: SubSection) => {
    setDeletingSubSection(subSection);
    setDeletingSection(null);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-destructive">
            Erreur lors du chargement des sections
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderTree className="h-6 w-6" />
            Sections
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérez les sections et sous-sections de produits
          </p>
        </div>
        <Button onClick={handleAddSection} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle section
        </Button>
      </div>

      {/* Section Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Arborescence des sections</CardTitle>
          <CardDescription>
            Cliquez sur une section pour voir ses sous-sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionTree
            sections={sections || []}
            onEditSection={handleEditSection}
            onDeleteSection={handleDeleteSection}
            onAddSubSection={handleAddSubSection}
            onEditSubSection={handleEditSubSection}
            onDeleteSubSection={handleDeleteSubSection}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SectionFormDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        section={editingSection}
        onCreated={(sectionId) => navigate(`/admin/sections/${sectionId}`)}
      />

      <SubSectionFormDialog
        open={subSectionDialogOpen}
        onOpenChange={setSubSectionDialogOpen}
        sectionId={parentSectionId}
        subSection={editingSubSection}
      />

      <DeleteSectionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        section={deletingSection}
        subSection={deletingSubSection}
      />
    </div>
  );
}
