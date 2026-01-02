import { useEffect, useState } from "react";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
} from "@/services/usersService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const [form, setForm] = useState<{
    username?: string;
    email?: string;
    avatarUrl?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getProfile();
        const user = (res?.data ?? res) as any;
        setForm({
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
        });
        setCurrentUserId(user.id);
      } catch {}
    })();
  }, []);

  async function onSave() {
    setSaving(true);
    try {
      await updateProfile({ username: form.username, email: form.email });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not save profile.",
      });
    }
    setSaving(false);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res: any = await uploadAvatar(file);
      const updatedUser = res?.data || res;
      setForm((prev) => ({ ...prev, avatarUrl: updatedUser.avatarUrl }));
      toast({ title: "Avatar updated", description: "Looks good!" });
    } catch {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Could not upload image.",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
        Account Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={form.avatarUrl} className="object-cover" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {form.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer text-white text-xs font-medium text-center"
                >
                  Change
                </label>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  className="relative overflow-hidden"
                  onClick={() =>
                    document.getElementById("avatar-upload")?.click()
                  }
                >
                  {uploading ? "Uploading..." : "Upload New Photo"}
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onFileChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, max 2MB.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={form.username || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              value={form.email || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>

          <Button
            onClick={onSave}
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
