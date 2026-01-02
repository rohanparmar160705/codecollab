import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Code2, Loader2, ArrowLeft, User, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { register as registerApi } from "@/services/authService";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("password", formData.password);
      if (avatarFile) {
        data.append("avatar", avatarFile);
      }

      const res = await registerApi(data as any);
      if (res.accessToken && res.user) {
        dispatch(
          setCredentials({ user: res.user, accessToken: res.accessToken })
        );
        try {
          localStorage.setItem(
            "userId",
            String(res.user.id || res.user.userId || "")
          );
          localStorage.setItem("username", String(res.user.username || ""));
        } catch {}
      }
      toast({
        title: "Account Created",
        description: "Welcome to CodeCollab.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description:
          error?.response?.data?.message ?? "Check details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background selection:bg-primary/10">
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>

      <Card className="w-full max-w-[440px] border-border bg-card shadow-2xl rounded-[6px] overflow-hidden">
        <div className="h-1.5 bg-primary w-full" />
        <CardHeader className="space-y-1 text-center pt-8 px-8">
          <div className="flex justify-center mb-4">
            <div className="h-10 w-10 rounded-[6px] bg-primary flex items-center justify-center text-primary-foreground">
              <Code2 className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            Create New Account
          </CardTitle>
          <CardDescription className="text-sm font-medium">
            Join the professional collaborative IDE network.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative group">
                <div className="h-20 w-20 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                >
                  <Upload className="h-5 w-5" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Profile Picture (Optional)
              </span>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="username"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
              >
                Username
              </Label>
              <Input
                id="username"
                placeholder="developer_01"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                className="h-10 rounded-[6px] bg-secondary/50 border-border focus:ring-1 focus:ring-primary/40 font-medium sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="h-10 rounded-[6px] bg-secondary/50 border-border focus:ring-1 focus:ring-primary/40 font-medium sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="h-10 rounded-[6px] bg-secondary/50 border-border focus:ring-1 focus:ring-primary/40 font-medium sm:text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Confirm
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  className="h-10 rounded-[6px] bg-secondary/50 border-border focus:ring-1 focus:ring-primary/40 font-medium sm:text-sm"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-[6px] font-bold text-sm shadow-sm mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary-foreground" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          <div className="mt-8 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground border-t border-border pt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline transition-all"
            >
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
