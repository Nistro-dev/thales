import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, CreditCard, Lock, Bell } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { ProfileCard } from "../components/ProfileCard";
import { CreditBalance } from "../components/CreditBalance";
import { CreditHistory } from "../components/CreditHistory";
import { ProfileForm } from "../components/ProfileForm";
import { PasswordForm } from "../components/PasswordForm";
import { NotificationPreferences } from "../components/NotificationPreferences";

export function ProfilePage() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Utilisateur non connecté</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Mon profil</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gérez vos informations personnelles et vos crédits
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Info & Credits */}
        <div className="lg:col-span-1 space-y-6">
          <ProfileCard user={user} />
          <CreditBalance credits={user.credits} />
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profil</span>
              </TabsTrigger>
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Crédits</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Sécurité</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <ProfileForm user={user} />
            </TabsContent>

            <TabsContent value="credits" className="mt-6">
              <CreditHistory />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <NotificationPreferences />
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <PasswordForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
