import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Settings,
  Building2,
  Mail,
  Bell,
  Shield,
  Database,
  Palette,
  Clock,
  CreditCard,
  Save,
  RotateCcw,
  Loader2,
  TestTube,
  Download,
  HardDrive,
  Scale,
  Edit,
  Eye,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Archive,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  settingsApi,
  SmtpSettings,
  SecuritySettings,
  MaintenanceSettings,
} from "@/api/settings.api";
import { backupApi, type BackupInfo } from "@/api/backup.api";
import {
  legalApi,
  type LegalPage,
  type LegalPageType,
  getLegalPageTypeName,
  getLegalPageTypeShortName,
} from "@/api/legal.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useAuthStore } from "@/stores/auth.store";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";

interface SettingSection {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Format date
function formatBackupDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Backup Management Section Component
function BackupManagementSection() {
  const queryClient = useQueryClient();
  const [confirmRestore, setConfirmRestore] = useState<BackupInfo | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BackupInfo | null>(null);

  // Fetch backups
  const {
    data: backups,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["backups"],
    queryFn: () => backupApi.list(),
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: (type: "full" | "database") => backupApi.create(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      toast.success("Sauvegarde créée avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la création de la sauvegarde");
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: (id: string) => backupApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      toast.success("Sauvegarde supprimée");
      setConfirmDelete(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: (id: string) => backupApi.restore(id),
    onSuccess: () => {
      toast.success("Restauration effectuée avec succès");
      setConfirmRestore(null);
    },
    onError: () => {
      toast.error("Erreur lors de la restauration");
    },
  });

  const handleDownload = async (backup: BackupInfo) => {
    try {
      await backupApi.download(backup.id);
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Backup Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Créer une sauvegarde</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Créez une sauvegarde manuelle de vos données. Les sauvegardes
          automatiques sont effectuées quotidiennement à 2h00.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => createBackupMutation.mutate("full")}
            disabled={createBackupMutation.isPending}
          >
            {createBackupMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <HardDrive className="mr-2 h-4 w-4" />
            )}
            Sauvegarde complète
          </Button>
          <Button
            variant="outline"
            onClick={() => createBackupMutation.mutate("database")}
            disabled={createBackupMutation.isPending}
          >
            {createBackupMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Base de données uniquement
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          La sauvegarde complète inclut la base de données et tous les fichiers
          uploadés. Les sauvegardes sont conservées pendant 14 jours.
        </p>
      </div>

      {/* Backup List Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Historique des sauvegardes</h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !backups || backups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune sauvegarde disponible</p>
            <p className="text-sm">Créez votre première sauvegarde ci-dessus</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-background"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      backup.type === "full"
                        ? "bg-primary/10 text-primary"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {backup.type === "full" ? (
                      <HardDrive className="h-5 w-5" />
                    ) : (
                      <Database className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {backup.filename}
                      </span>
                      {backup.isAutomatic && (
                        <Badge variant="secondary" className="text-xs">
                          Auto
                        </Badge>
                      )}
                      <Badge
                        variant={backup.type === "full" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {backup.type === "full" ? "Complète" : "BDD"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{formatBackupDate(backup.createdAt)}</span>
                      <span>•</span>
                      <span>{formatFileSize(backup.size)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(backup)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmRestore(backup)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete(backup)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={!!confirmRestore}
        onOpenChange={() => setConfirmRestore(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmer la restauration
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir restaurer cette sauvegarde ?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
              <p className="text-sm text-orange-800">
                <strong>Attention :</strong> Cette action va remplacer toutes
                les données actuelles par celles de la sauvegarde. Cette
                opération est irréversible.
              </p>
            </div>
            {confirmRestore && (
              <div className="mt-4 p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium">{confirmRestore.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBackupDate(confirmRestore.createdAt)} •{" "}
                  {formatFileSize(confirmRestore.size)}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmRestore(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                confirmRestore &&
                restoreBackupMutation.mutate(confirmRestore.id)
              }
              disabled={restoreBackupMutation.isPending}
            >
              {restoreBackupMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Restaurer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Supprimer la sauvegarde
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette sauvegarde ?
            </DialogDescription>
          </DialogHeader>
          {confirmDelete && (
            <div className="py-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium">{confirmDelete.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBackupDate(confirmDelete.createdAt)} •{" "}
                  {formatFileSize(confirmDelete.size)}
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                confirmDelete && deleteBackupMutation.mutate(confirmDelete.id)
              }
              disabled={deleteBackupMutation.isPending}
            >
              {deleteBackupMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const settingSections: SettingSection[] = [
  // NOTE: Les sections commentées ne sont pas encore implémentées côté backend
  // {
  //   id: "general",
  //   label: "Général",
  //   icon: Building2,
  //   description: "Paramètres généraux de l'application",
  // },
  // {
  //   id: "reservations",
  //   label: "Réservations",
  //   icon: Clock,
  //   description: "Configuration des réservations",
  // },
  // {
  //   id: "credits",
  //   label: "Crédits",
  //   icon: CreditCard,
  //   description: "Gestion des crédits utilisateurs",
  // },
  // {
  //   id: "notifications",
  //   label: "Notifications",
  //   icon: Bell,
  //   description: "Paramètres des notifications",
  // },
  {
    id: "emails",
    label: "Emails",
    icon: Mail,
    description: "Configuration des emails",
  },
  {
    id: "security",
    label: "Sécurité",
    icon: Shield,
    description: "Paramètres de sécurité",
  },
  // {
  //   id: "appearance",
  //   label: "Apparence",
  //   icon: Palette,
  //   description: "Personnalisation visuelle",
  // },
  {
    id: "advanced",
    label: "Avancé",
    icon: Database,
    description: "Paramètres avancés",
  },
  {
    id: "backups",
    label: "Sauvegardes",
    icon: HardDrive,
    description: "Gestion des sauvegardes",
  },
  {
    id: "legal",
    label: "Pages légales",
    icon: Scale,
    description: "CGU, RGPD, Mentions légales",
  },
];

export function AdminSettingsPage() {
  const { hasPermission } = useAuthStore();
  const queryClient = useQueryClient();
  const canManage = hasPermission(PERMISSIONS.MANAGE_SETTINGS);
  const [activeTab, setActiveTab] = useState("emails");
  const [hasChanges, setHasChanges] = useState(false);
  const [hasSmtpChanges, setHasSmtpChanges] = useState(false);

  // Legal pages state
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Thales App",
    siteDescription: "Application de gestion de prêt de matériel",
    contactEmail: "contact@thales.local",
    supportPhone: "",
    address: "",
    timezone: "Europe/Paris",
    language: "fr",
  });

  // Reservation settings state
  const [reservationSettings, setReservationSettings] = useState({
    maxReservationsPerUser: 5,
    defaultMinDuration: 1,
    defaultMaxDuration: 14,
    allowSameDayReservation: true,
    requireApproval: false,
    autoConfirm: true,
    reminderDaysBefore: 1,
    latePenaltyEnabled: false,
    latePenaltyPerDay: 5,
  });

  // Credit settings state
  const [creditSettings, setCreditSettings] = useState({
    defaultCreditsNewUser: 100,
    monthlyCreditsRefresh: false,
    monthlyCreditsAmount: 50,
    allowNegativeBalance: false,
    maxCreditsPerUser: 1000,
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    notifyOnReservation: true,
    notifyOnCheckout: true,
    notifyOnReturn: true,
    notifyOnCancellation: true,
    notifyAdminOnNewUser: true,
    digestEnabled: false,
    digestFrequency: "daily",
  });

  // Email settings state
  const [emailSettings, setEmailSettings] = useState<SmtpSettings>({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpSecure: true,
    fromEmail: "noreply@thales.local",
    fromName: "Thales App",
    replyToEmail: "",
  });

  // Fetch SMTP settings from API
  const { data: smtpData, isLoading: isLoadingSmtp } = useQuery({
    queryKey: ["settings", "smtp"],
    queryFn: () => settingsApi.getSmtp(),
  });

  // Update local state when SMTP data is fetched
  useEffect(() => {
    if (smtpData?.data.data) {
      setEmailSettings(smtpData.data.data);
    }
  }, [smtpData]);

  // Mutation for saving SMTP settings
  const saveSmtpMutation = useMutation({
    mutationFn: (data: SmtpSettings) => settingsApi.updateSmtp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "smtp"] });
      toast.success("Paramètres SMTP enregistrés avec succès");
      setHasSmtpChanges(false);
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement des paramètres SMTP");
    },
  });

  // Mutation for testing SMTP connection
  const testSmtpMutation = useMutation({
    mutationFn: (data: SmtpSettings) => settingsApi.testSmtp(data),
    onSuccess: () => {
      toast.success("Connexion SMTP réussie !");
    },
    onError: (error: {
      response?: { data?: { error?: { details?: string } } };
    }) => {
      const errorMessage =
        error?.response?.data?.error?.details || "Échec de la connexion SMTP";
      toast.error(errorMessage);
    },
  });

  // Security settings state (from API)
  const [securitySettingsApi, setSecuritySettingsApi] =
    useState<SecuritySettings>({
      accountInactivityDays: 730,
      accountInactivityEnabled: true,
    });
  const [hasSecurityChanges, setHasSecurityChanges] = useState(false);

  // Fetch Security settings from API
  const { data: securityData, isLoading: isLoadingSecurity } = useQuery({
    queryKey: ["settings", "security"],
    queryFn: () => settingsApi.getSecurity(),
  });

  // Update local state when Security data is fetched
  useEffect(() => {
    if (securityData?.data.data) {
      setSecuritySettingsApi(securityData.data.data);
    }
  }, [securityData]);

  // Mutation for saving Security settings
  const saveSecurityMutation = useMutation({
    mutationFn: (data: SecuritySettings) => settingsApi.updateSecurity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "security"] });
      toast.success("Paramètres de sécurité enregistrés avec succès");
      setHasSecurityChanges(false);
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement des paramètres de sécurité");
    },
  });

  // Appearance settings state
  const [appearanceSettings, setAppearanceSettings] = useState({
    primaryColor: "#0ea5e9",
    logoUrl: "",
    faviconUrl: "",
    customCss: "",
    showWelcomeMessage: true,
    welcomeMessage: "Bienvenue sur l'application de prêt de matériel",
  });

  // Maintenance settings state (from API)
  const [maintenanceSettingsApi, setMaintenanceSettingsApi] =
    useState<MaintenanceSettings>({
      maintenanceEnabled: false,
      maintenanceMessage:
        "L'application est en maintenance. Veuillez réessayer plus tard.",
    });
  const [hasMaintenanceChanges, setHasMaintenanceChanges] = useState(false);

  // Fetch Maintenance settings from API
  const { data: maintenanceData, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ["settings", "maintenance"],
    queryFn: () => settingsApi.getMaintenance(),
  });

  // Update local state when Maintenance data is fetched
  useEffect(() => {
    if (maintenanceData?.data.data) {
      setMaintenanceSettingsApi(maintenanceData.data.data);
    }
  }, [maintenanceData]);

  // Mutation for saving Maintenance settings
  const saveMaintenanceMutation = useMutation({
    mutationFn: (data: MaintenanceSettings) =>
      settingsApi.updateMaintenance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "maintenance"] });
      toast.success("Paramètres de maintenance enregistrés avec succès");
      setHasMaintenanceChanges(false);
    },
    onError: () => {
      toast.error(
        "Erreur lors de l'enregistrement des paramètres de maintenance",
      );
    },
  });

  // Fetch legal pages
  const { data: legalPages, isLoading: isLoadingLegal } = useQuery({
    queryKey: ["admin", "legal-pages"],
    queryFn: () => legalApi.getAllPages(),
  });

  // Update legal page mutation
  const updateLegalMutation = useMutation({
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

  const handleEditLegal = (page: LegalPage) => {
    setEditingPage(page);
    setEditTitle(page.title);
    setEditContent(page.content);
  };

  const handleSaveLegal = () => {
    if (!editingPage) return;
    updateLegalMutation.mutate({
      type: editingPage.type,
      title: editTitle,
      content: editContent,
    });
  };

  const handleCloseLegalDialog = () => {
    setEditingPage(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleSave = () => {
    // TODO: Implement API call to save settings
    toast.success("Les paramètres ont été mis à jour avec succès");
    setHasChanges(false);
  };

  const handleReset = () => {
    // TODO: Reset to default values or reload from API
    toast.success("Les paramètres ont été réinitialisés");
    setHasChanges(false);
  };

  const markAsChanged = () => {
    if (!hasChanges) setHasChanges(true);
  };

  const markSmtpAsChanged = () => {
    if (!hasSmtpChanges) setHasSmtpChanges(true);
  };

  const handleSaveSmtp = () => {
    saveSmtpMutation.mutate(emailSettings);
  };

  const handleTestSmtp = () => {
    testSmtpMutation.mutate(emailSettings);
  };

  const markSecurityAsChanged = () => {
    if (!hasSecurityChanges) setHasSecurityChanges(true);
  };

  const handleSaveSecurity = () => {
    if (
      securitySettingsApi.accountInactivityEnabled &&
      (!securitySettingsApi.accountInactivityDays ||
        securitySettingsApi.accountInactivityDays < 1)
    ) {
      toast.error("La durée d'inactivité doit être d'au moins 1 jour");
      return;
    }
    saveSecurityMutation.mutate(securitySettingsApi);
  };

  const markMaintenanceAsChanged = () => {
    if (!hasMaintenanceChanges) setHasMaintenanceChanges(true);
  };

  const handleSaveMaintenance = () => {
    saveMaintenanceMutation.mutate(maintenanceSettingsApi);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Paramètres
          </h1>
          <p className="text-muted-foreground">
            Configurez les paramètres de l'application
          </p>
        </div>
        {canManage && hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      {/* Settings Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
          {settingSections.map((section) => {
            const Icon = section.icon;
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg border"
              >
                <Icon className="mr-2 h-4 w-4" />
                {section.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Informations générales</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Configurez les informations de base de votre application.
            </p>

            <div className="grid gap-6 md:grid-cols-2 overflow-hidden">
              <div className="space-y-2">
                <Label htmlFor="siteName">Nom du site</Label>
                <Input
                  id="siteName"
                  value={generalSettings.siteName}
                  onChange={(e) => {
                    setGeneralSettings({
                      ...generalSettings,
                      siteName: e.target.value,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email de contact</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={generalSettings.contactEmail}
                  onChange={(e) => {
                    setGeneralSettings({
                      ...generalSettings,
                      contactEmail: e.target.value,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="siteDescription">Description</Label>
                <Textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) => {
                    setGeneralSettings({
                      ...generalSettings,
                      siteDescription: e.target.value,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportPhone">Téléphone support</Label>
                <Input
                  id="supportPhone"
                  value={generalSettings.supportPhone}
                  onChange={(e) => {
                    setGeneralSettings({
                      ...generalSettings,
                      supportPhone: e.target.value,
                    });
                    markAsChanged();
                  }}
                  placeholder="+33 1 23 45 67 89"
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <Select
                  value={generalSettings.timezone}
                  onValueChange={(value) => {
                    setGeneralSettings({ ...generalSettings, timezone: value });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">
                      Europe/Paris (UTC+1)
                    </SelectItem>
                    <SelectItem value="Europe/London">
                      Europe/London (UTC+0)
                    </SelectItem>
                    <SelectItem value="America/New_York">
                      America/New_York (UTC-5)
                    </SelectItem>
                    <SelectItem value="Asia/Tokyo">
                      Asia/Tokyo (UTC+9)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={generalSettings.address}
                  onChange={(e) => {
                    setGeneralSettings({
                      ...generalSettings,
                      address: e.target.value,
                    });
                    markAsChanged();
                  }}
                  placeholder="Adresse physique de l'établissement"
                  disabled={!canManage}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Reservation Settings */}
        <TabsContent value="reservations" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                Configuration des réservations
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Définissez les règles et limites pour les réservations.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxReservations">
                  Réservations max par utilisateur
                </Label>
                <Input
                  id="maxReservations"
                  type="number"
                  min="1"
                  value={reservationSettings.maxReservationsPerUser}
                  onChange={(e) => {
                    setReservationSettings({
                      ...reservationSettings,
                      maxReservationsPerUser: parseInt(e.target.value),
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
                <p className="text-xs text-muted-foreground">
                  Nombre maximum de réservations actives simultanées
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderDays">Rappel (jours avant)</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  min="0"
                  value={reservationSettings.reminderDaysBefore}
                  onChange={(e) => {
                    setReservationSettings({
                      ...reservationSettings,
                      reminderDaysBefore: parseInt(e.target.value),
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
                <p className="text-xs text-muted-foreground">
                  Envoyer un rappel X jours avant le début
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultMinDuration">
                  Durée min par défaut (jours)
                </Label>
                <Input
                  id="defaultMinDuration"
                  type="number"
                  min="1"
                  value={reservationSettings.defaultMinDuration}
                  onChange={(e) => {
                    setReservationSettings({
                      ...reservationSettings,
                      defaultMinDuration: parseInt(e.target.value),
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultMaxDuration">
                  Durée max par défaut (jours)
                </Label>
                <Input
                  id="defaultMaxDuration"
                  type="number"
                  min="1"
                  value={reservationSettings.defaultMaxDuration}
                  onChange={(e) => {
                    setReservationSettings({
                      ...reservationSettings,
                      defaultMaxDuration: parseInt(e.target.value),
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Réservation le jour même</Label>
                  <p className="text-sm text-muted-foreground">
                    Autoriser les réservations débutant le jour même
                  </p>
                </div>
                <Switch
                  checked={reservationSettings.allowSameDayReservation}
                  onCheckedChange={(checked: boolean) => {
                    setReservationSettings({
                      ...reservationSettings,
                      allowSameDayReservation: checked,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Confirmation automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Confirmer automatiquement les réservations sans approbation
                  </p>
                </div>
                <Switch
                  checked={reservationSettings.autoConfirm}
                  onCheckedChange={(checked: boolean) => {
                    setReservationSettings({
                      ...reservationSettings,
                      autoConfirm: checked,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pénalité de retard</Label>
                  <p className="text-sm text-muted-foreground">
                    Appliquer une pénalité en crédits pour les retours en retard
                  </p>
                </div>
                <Switch
                  checked={reservationSettings.latePenaltyEnabled}
                  onCheckedChange={(checked: boolean) => {
                    setReservationSettings({
                      ...reservationSettings,
                      latePenaltyEnabled: checked,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              {reservationSettings.latePenaltyEnabled && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="latePenalty">
                    Pénalité par jour de retard (crédits)
                  </Label>
                  <Input
                    id="latePenalty"
                    type="number"
                    min="0"
                    value={reservationSettings.latePenaltyPerDay}
                    onChange={(e) => {
                      setReservationSettings({
                        ...reservationSettings,
                        latePenaltyPerDay: parseInt(e.target.value),
                      });
                      markAsChanged();
                    }}
                    className="max-w-[200px]"
                    disabled={!canManage}
                  />
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Credit Settings */}
        <TabsContent value="credits" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Gestion des crédits</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Configurez les règles de gestion des crédits utilisateurs.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultCredits">
                  Crédits par défaut (nouveaux utilisateurs)
                </Label>
                <Input
                  id="defaultCredits"
                  type="number"
                  min="0"
                  value={creditSettings.defaultCreditsNewUser}
                  onChange={(e) => {
                    setCreditSettings({
                      ...creditSettings,
                      defaultCreditsNewUser: parseInt(e.target.value),
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxCredits">
                  Crédits maximum par utilisateur
                </Label>
                <Input
                  id="maxCredits"
                  type="number"
                  min="0"
                  value={creditSettings.maxCreditsPerUser}
                  onChange={(e) => {
                    setCreditSettings({
                      ...creditSettings,
                      maxCreditsPerUser: parseInt(e.target.value),
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rechargement mensuel</Label>
                  <p className="text-sm text-muted-foreground">
                    Ajouter automatiquement des crédits chaque mois
                  </p>
                </div>
                <Switch
                  checked={creditSettings.monthlyCreditsRefresh}
                  onCheckedChange={(checked: boolean) => {
                    setCreditSettings({
                      ...creditSettings,
                      monthlyCreditsRefresh: checked,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              {creditSettings.monthlyCreditsRefresh && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="monthlyAmount">
                    Montant mensuel (crédits)
                  </Label>
                  <Input
                    id="monthlyAmount"
                    type="number"
                    min="0"
                    value={creditSettings.monthlyCreditsAmount}
                    onChange={(e) => {
                      setCreditSettings({
                        ...creditSettings,
                        monthlyCreditsAmount: parseInt(e.target.value),
                      });
                      markAsChanged();
                    }}
                    className="max-w-[200px]"
                    disabled={!canManage}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Solde négatif autorisé</Label>
                  <p className="text-sm text-muted-foreground">
                    Autoriser les utilisateurs à avoir un solde de crédits
                    négatif
                  </p>
                </div>
                <Switch
                  checked={creditSettings.allowNegativeBalance}
                  onCheckedChange={(checked: boolean) => {
                    setCreditSettings({
                      ...creditSettings,
                      allowNegativeBalance: checked,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                Paramètres des notifications
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Configurez quand et comment les notifications sont envoyées.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyer des notifications par email aux utilisateurs
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked: boolean) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: checked,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications in-app</Label>
                  <p className="text-sm text-muted-foreground">
                    Afficher les notifications dans l'application
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.inAppNotifications}
                  onCheckedChange={(checked: boolean) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      inAppNotifications: checked,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              <Separator className="my-4" />
              <p className="text-sm font-medium">Événements de notification</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Nouvelle réservation</Label>
                  <Switch
                    checked={notificationSettings.notifyOnReservation}
                    onCheckedChange={(checked: boolean) => {
                      setNotificationSettings({
                        ...notificationSettings,
                        notifyOnReservation: checked,
                      });
                      markAsChanged();
                    }}
                    disabled={!canManage}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Retrait effectué</Label>
                  <Switch
                    checked={notificationSettings.notifyOnCheckout}
                    onCheckedChange={(checked: boolean) => {
                      setNotificationSettings({
                        ...notificationSettings,
                        notifyOnCheckout: checked,
                      });
                      markAsChanged();
                    }}
                    disabled={!canManage}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Retour effectué</Label>
                  <Switch
                    checked={notificationSettings.notifyOnReturn}
                    onCheckedChange={(checked: boolean) => {
                      setNotificationSettings({
                        ...notificationSettings,
                        notifyOnReturn: checked,
                      });
                      markAsChanged();
                    }}
                    disabled={!canManage}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Annulation</Label>
                  <Switch
                    checked={notificationSettings.notifyOnCancellation}
                    onCheckedChange={(checked: boolean) => {
                      setNotificationSettings({
                        ...notificationSettings,
                        notifyOnCancellation: checked,
                      });
                      markAsChanged();
                    }}
                    disabled={!canManage}
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifier les admins des nouveaux utilisateurs</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyer une notification aux admins lors de l'inscription
                    d'un nouvel utilisateur
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.notifyAdminOnNewUser}
                  onCheckedChange={(checked: boolean) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      notifyAdminOnNewUser: checked,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Regrouper les notifications en un résumé périodique
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.digestEnabled}
                  onCheckedChange={(checked: boolean) => {
                    setNotificationSettings({
                      ...notificationSettings,
                      digestEnabled: checked,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              {notificationSettings.digestEnabled && (
                <div className="space-y-2 ml-6 relative">
                  <Label htmlFor="digestFrequency">Fréquence du digest</Label>
                  <Select
                    value={notificationSettings.digestFrequency}
                    onValueChange={(value) => {
                      setNotificationSettings({
                        ...notificationSettings,
                        digestFrequency: value,
                      });
                      markAsChanged();
                    }}
                    disabled={!canManage}
                  >
                    <SelectTrigger className="max-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="emails" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Configuration SMTP</h2>
              </div>
              {canManage && hasSmtpChanges && (
                <Button
                  onClick={handleSaveSmtp}
                  disabled={saveSmtpMutation.isPending}
                >
                  {saveSmtpMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Configurez le serveur d'envoi d'emails.
            </p>

            {isLoadingSmtp ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">Serveur SMTP</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) => {
                        setEmailSettings({
                          ...emailSettings,
                          smtpHost: e.target.value,
                        });
                        markSmtpAsChanged();
                      }}
                      placeholder="smtp.example.com"
                      disabled={!canManage}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => {
                        setEmailSettings({
                          ...emailSettings,
                          smtpPort: parseInt(e.target.value) || 587,
                        });
                        markSmtpAsChanged();
                      }}
                      placeholder="587"
                      disabled={!canManage}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">Utilisateur</Label>
                    <Input
                      id="smtpUser"
                      value={emailSettings.smtpUser}
                      onChange={(e) => {
                        setEmailSettings({
                          ...emailSettings,
                          smtpUser: e.target.value,
                        });
                        markSmtpAsChanged();
                      }}
                      disabled={!canManage}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">Mot de passe</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => {
                        setEmailSettings({
                          ...emailSettings,
                          smtpPassword: e.target.value,
                        });
                        markSmtpAsChanged();
                      }}
                      placeholder={
                        emailSettings.smtpPassword === "••••••••"
                          ? "Inchangé"
                          : ""
                      }
                      disabled={!canManage}
                    />
                    <p className="text-xs text-muted-foreground">
                      Laissez vide pour conserver le mot de passe actuel
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">Email d'expédition</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => {
                        setEmailSettings({
                          ...emailSettings,
                          fromEmail: e.target.value,
                        });
                        markSmtpAsChanged();
                      }}
                      disabled={!canManage}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">Nom d'expéditeur</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) => {
                        setEmailSettings({
                          ...emailSettings,
                          fromName: e.target.value,
                        });
                        markSmtpAsChanged();
                      }}
                      disabled={!canManage}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="replyToEmail">
                      Email de réponse (optionnel)
                    </Label>
                    <Input
                      id="replyToEmail"
                      type="email"
                      value={emailSettings.replyToEmail}
                      onChange={(e) => {
                        setEmailSettings({
                          ...emailSettings,
                          replyToEmail: e.target.value,
                        });
                        markSmtpAsChanged();
                      }}
                      placeholder="reply-to@example.com"
                      disabled={!canManage}
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Connexion sécurisée (TLS/SSL)</Label>
                    <p className="text-sm text-muted-foreground">
                      Utiliser une connexion chiffrée pour l'envoi des emails
                    </p>
                  </div>
                  <Switch
                    checked={emailSettings.smtpSecure}
                    onCheckedChange={(checked: boolean) => {
                      setEmailSettings({
                        ...emailSettings,
                        smtpSecure: checked,
                      });
                      markSmtpAsChanged();
                    }}
                    disabled={!canManage}
                  />
                </div>

                {canManage && (
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      onClick={handleTestSmtp}
                      disabled={
                        testSmtpMutation.isPending || !emailSettings.smtpHost
                      }
                    >
                      {testSmtpMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="mr-2 h-4 w-4" />
                      )}
                      Tester la connexion SMTP
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          {/* Account Inactivity Section - From API */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  Inactivité des comptes
                </h2>
              </div>
              {canManage && hasSecurityChanges && (
                <Button
                  onClick={handleSaveSecurity}
                  disabled={saveSecurityMutation.isPending}
                >
                  {saveSecurityMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Configurez la désactivation automatique des comptes inactifs.
            </p>

            {isLoadingSecurity ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>
                      Désactivation automatique des comptes inactifs
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Désactiver automatiquement les comptes qui n'ont pas eu
                      d'activité depuis une certaine période
                    </p>
                  </div>
                  <Switch
                    checked={securitySettingsApi.accountInactivityEnabled}
                    onCheckedChange={(checked: boolean) => {
                      setSecuritySettingsApi({
                        ...securitySettingsApi,
                        accountInactivityEnabled: checked,
                      });
                      markSecurityAsChanged();
                    }}
                    disabled={!canManage}
                  />
                </div>

                {securitySettingsApi.accountInactivityEnabled && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="accountInactivityDays">
                      Durée d'inactivité avant désactivation (jours)
                    </Label>
                    <Input
                      id="accountInactivityDays"
                      type="number"
                      min="1"
                      max="3650"
                      value={securitySettingsApi.accountInactivityDays || ""}
                      onChange={(e) => {
                        const value =
                          e.target.value === "" ? 0 : parseInt(e.target.value);
                        setSecuritySettingsApi({
                          ...securitySettingsApi,
                          accountInactivityDays: value,
                        });
                        markSecurityAsChanged();
                      }}
                      className="max-w-[200px]"
                      disabled={!canManage}
                    />
                    <p className="text-xs text-muted-foreground">
                      Par défaut : 730 jours (2 ans). Les comptes sans connexion
                      depuis cette période seront automatiquement désactivés.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Personnalisation</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Personnalisez l'apparence de l'application.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Couleur principale</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={appearanceSettings.primaryColor}
                    onChange={(e) => {
                      setAppearanceSettings({
                        ...appearanceSettings,
                        primaryColor: e.target.value,
                      });
                      markAsChanged();
                    }}
                    className="w-14 h-10 p-1"
                    disabled={!canManage}
                  />
                  <Input
                    value={appearanceSettings.primaryColor}
                    onChange={(e) => {
                      setAppearanceSettings({
                        ...appearanceSettings,
                        primaryColor: e.target.value,
                      });
                      markAsChanged();
                    }}
                    className="flex-1"
                    disabled={!canManage}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL du logo</Label>
                <Input
                  id="logoUrl"
                  value={appearanceSettings.logoUrl}
                  onChange={(e) => {
                    setAppearanceSettings({
                      ...appearanceSettings,
                      logoUrl: e.target.value,
                    });
                    markAsChanged();
                  }}
                  placeholder="https://example.com/logo.png"
                  disabled={!canManage}
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Message d'accueil</Label>
                  <p className="text-sm text-muted-foreground">
                    Afficher un message de bienvenue sur la page d'accueil
                  </p>
                </div>
                <Switch
                  checked={appearanceSettings.showWelcomeMessage}
                  onCheckedChange={(checked: boolean) => {
                    setAppearanceSettings({
                      ...appearanceSettings,
                      showWelcomeMessage: checked,
                    });
                    markAsChanged();
                  }}
                  disabled={!canManage}
                />
              </div>

              {appearanceSettings.showWelcomeMessage && (
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Contenu du message</Label>
                  <Textarea
                    id="welcomeMessage"
                    value={appearanceSettings.welcomeMessage}
                    onChange={(e) => {
                      setAppearanceSettings({
                        ...appearanceSettings,
                        welcomeMessage: e.target.value,
                      });
                      markAsChanged();
                    }}
                    disabled={!canManage}
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="customCss">CSS personnalisé</Label>
                <Textarea
                  id="customCss"
                  value={appearanceSettings.customCss}
                  onChange={(e) => {
                    setAppearanceSettings({
                      ...appearanceSettings,
                      customCss: e.target.value,
                    });
                    markAsChanged();
                  }}
                  placeholder="/* Ajoutez votre CSS personnalisé ici */"
                  disabled={!canManage}
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Mode maintenance</h2>
              </div>
              {canManage && hasMaintenanceChanges && (
                <Button
                  onClick={handleSaveMaintenance}
                  disabled={saveMaintenanceMutation.isPending}
                >
                  {saveMaintenanceMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Activez le mode maintenance pour bloquer l'accès à l'application.
            </p>

            {isLoadingMaintenance ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-destructive">Mode maintenance</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquer l'accès aux utilisateurs sans permission
                      BYPASS_MAINTENANCE
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceSettingsApi.maintenanceEnabled}
                    onCheckedChange={(checked: boolean) => {
                      setMaintenanceSettingsApi({
                        ...maintenanceSettingsApi,
                        maintenanceEnabled: checked,
                      });
                      markMaintenanceAsChanged();
                    }}
                    disabled={!canManage}
                  />
                </div>

                <div className="space-y-2 ml-6">
                  <Label htmlFor="maintenanceMessage">
                    Message de maintenance
                  </Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={maintenanceSettingsApi.maintenanceMessage}
                    onChange={(e) => {
                      setMaintenanceSettingsApi({
                        ...maintenanceSettingsApi,
                        maintenanceMessage: e.target.value,
                      });
                      markMaintenanceAsChanged();
                    }}
                    disabled={!canManage}
                    rows={3}
                    placeholder="L'application est en maintenance. Veuillez réessayer plus tard."
                  />
                  <p className="text-xs text-muted-foreground">
                    Ce message sera affiché aux utilisateurs lorsque le mode
                    maintenance est activé.
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backups" className="space-y-6">
          {hasPermission(PERMISSIONS.BACKUP_DATABASE) ? (
            <BackupManagementSection />
          ) : (
            <div className="rounded-lg border bg-card p-6 text-center">
              <p className="text-muted-foreground">
                Vous n'avez pas les permissions nécessaires pour accéder aux
                sauvegardes.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Legal Pages Settings */}
        <TabsContent value="legal" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Pages légales</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Gérez le contenu des CGU, politique de confidentialité et mentions
              légales.
            </p>

            {isLoadingLegal ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {legalPages?.map((page) => (
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
                            Modifié par {page.editor.firstName}{" "}
                            {page.editor.lastName}
                          </p>
                        )}

                        <div className="flex gap-2">
                          {canManage && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLegal(page)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </Button>
                          )}
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
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Legal Page Edit Dialog */}
      <Dialog
        open={!!editingPage}
        onOpenChange={(open) => !open && handleCloseLegalDialog()}
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
              <Label htmlFor="legalTitle">Titre</Label>
              <Input
                id="legalTitle"
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
              <Button variant="outline" onClick={handleCloseLegalDialog}>
                Annuler
              </Button>
              <Button
                onClick={handleSaveLegal}
                disabled={updateLegalMutation.isPending}
              >
                {updateLegalMutation.isPending ? (
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
