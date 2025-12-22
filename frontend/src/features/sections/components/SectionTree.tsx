import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Edit,
  Trash2,
  Plus,
  Package,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import type { SectionWithCount } from "@/api/sections.api";
import type { SubSection } from "@/types";

interface SectionTreeProps {
  sections: SectionWithCount[];
  onEditSection: (section: SectionWithCount) => void;
  onDeleteSection: (section: SectionWithCount) => void;
  onAddSubSection: (sectionId: string) => void;
  onEditSubSection: (subSection: SubSection, sectionId: string) => void;
  onDeleteSubSection: (subSection: SubSection) => void;
}

export function SectionTree({
  sections,
  onDeleteSection,
  onAddSubSection,
  onEditSubSection,
  onDeleteSubSection,
}: SectionTreeProps) {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id)),
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const getSubSectionProductCount = (
    subSection: SubSection & { _count?: { products: number } },
  ) => {
    return subSection._count?.products ?? 0;
  };

  const getSectionDirectProductCount = (section: SectionWithCount) => {
    // Products directly in section (no subsection)
    return section._count?.products ?? 0;
  };

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const hasSubSections =
          section.subSections && section.subSections.length > 0;
        const productCount = getSectionDirectProductCount(section);
        const totalSubSectionProducts =
          section.subSections?.reduce(
            (acc, sub) =>
              acc +
              getSubSectionProductCount(
                sub as SubSection & { _count?: { products: number } },
              ),
            0,
          ) ?? 0;

        return (
          <div key={section.id} className="rounded-lg border bg-card">
            {/* Section Header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleSection(section.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>

                {isExpanded ? (
                  <FolderOpen className="h-5 w-5 text-primary" />
                ) : (
                  <Folder className="h-5 w-5 text-primary" />
                )}

                <span className="font-medium">{section.name}</span>

                {section.isSystem && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    Système
                  </span>
                )}

                <span className="text-xs text-muted-foreground">
                  ({productCount + totalSubSectionProducts} produits)
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddSubSection(section.id)}
                  title="Ajouter une sous-section"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigate(
                      ROUTES.ADMIN_SECTION_DETAIL.replace(":id", section.id),
                    )
                  }
                  title="Paramètres"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                {!section.isSystem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteSection(section)}
                    title="Supprimer"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* SubSections */}
            {isExpanded && hasSubSections && (
              <div className="border-t bg-muted/30">
                {section.subSections?.map((subSection) => {
                  const subProductCount = getSubSectionProductCount(
                    subSection as SubSection & {
                      _count?: { products: number };
                    },
                  );

                  return (
                    <div
                      key={subSection.id}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 ml-8 border-b last:border-b-0",
                        "hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{subSection.name}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="h-3 w-3" />
                          {subProductCount}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            onEditSubSection(subSection, section.id)
                          }
                          title="Modifier"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => onDeleteSubSection(subSection)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty subsections message */}
            {isExpanded && !hasSubSections && (
              <div className="border-t bg-muted/30 px-3 py-4 ml-8 text-sm text-muted-foreground">
                Aucune sous-section
              </div>
            )}
          </div>
        );
      })}

      {sections.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Aucune section créée
        </div>
      )}
    </div>
  );
}
