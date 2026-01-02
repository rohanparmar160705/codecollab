import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import { Code2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { login as loginApi } from "@/services/authService";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const from = location.state?.from?.pathname || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await loginApi({
        email: formData.email,
        password: formData.password,
      });
      const accessToken = res?.accessToken;
      const user = res?.user;
      if (accessToken && user) {
        dispatch(setCredentials({ user, accessToken }));
        try {
          localStorage.setItem("userId", String(user.id || user.userId || ""));
          localStorage.setItem("username", String(user.username || ""));
        } catch {}
      }
      toast({
        title: "Login Successful",
        description: "Welcome back to CodeCollab.",
      });
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password.",
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

      <Card className="w-full max-w-[400px] border-border bg-card shadow-2xl rounded-[6px] overflow-hidden">
        <div className="h-1.5 bg-primary w-full" />
        <CardHeader className="space-y-1 text-center pt-8">
          <div className="flex justify-center mb-4">
            <div className="h-10 w-10 rounded-[6px] bg-primary flex items-center justify-center text-primary-foreground">
              <Code2 className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            Account Login
          </CardTitle>
          <CardDescription className="text-sm font-medium">
            Securely access your CodeCollab workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
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
                className="h-11 rounded-[6px] bg-secondary/50 border-border focus:ring-1 focus:ring-primary/40 font-medium"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  Account Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="h-11 rounded-[6px] bg-secondary/50 border-border focus:ring-1 focus:ring-primary/40 font-medium"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-[6px] font-bold text-sm shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary-foreground" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="mt-8 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground border-t border-border pt-6">
            New to CodeCollab?{" "}
            <Link
              to="/register"
              className="text-primary hover:underline transition-all"
            >
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
