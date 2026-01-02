import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createRoom } from "@/services/roomsService";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { Code2, ArrowLeft, Terminal, Globe, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoomsNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    language: "javascript",
    description: "",
    isPublic: true,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Name is required");
      return await createRoom({
        name: form.name.trim(),
        language: form.language,
        description: form.description || undefined,
        isPublic: form.isPublic,
      });
    },
    onSuccess: (room: any) => {
      if (room?.id) {
        navigate(`/rooms/${room.id}`);
      } else {
        navigate("/dashboard");
      }
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-6 py-12 max-w-2xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Rooms
        </Link>

        <Card className="rounded-[6px] border border-border bg-card shadow-lg overflow-hidden">
          <CardHeader className="pt-8 pb-6 px-8 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-[6px] bg-primary/10 flex items-center justify-center border border-primary/20">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  Initialize Environment
                </CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground">
                  {" "}
                  Configure your private or public sandbox.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
              >
                Room Label
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., frontend-refactor-sprint-1"
                className="h-11 bg-secondary border-border rounded-[6px] focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all font-medium text-sm"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label
                  htmlFor="language"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  Runtime Engine
                </Label>
                <select
                  id="language"
                  className="w-full h-11 bg-secondary border border-border rounded-[6px] px-4 py-2 focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all appearance-none cursor-pointer text-sm font-medium"
                  value={form.language}
                  onChange={(e) =>
                    setForm({ ...form, language: e.target.value })
                  }
                >
                  <option value="javascript">Node.js 20.x</option>
                  <option value="python">Python 3.11</option>
                  <option value="cpp">C++ 17 (GCC)</option>
                  <option value="java">Java 17 (OpenJDK)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Access Level
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isPublic: true })}
                    className={cn(
                      "h-11 flex items-center justify-center gap-2 rounded-[6px] border text-xs font-bold transition-all",
                      form.isPublic
                        ? "bg-primary/10 border-primary text-primary shadow-sm"
                        : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isPublic: false })}
                    className={cn(
                      "h-11 flex items-center justify-center gap-2 rounded-[6px] border text-xs font-bold transition-all",
                      !form.isPublic
                        ? "bg-primary/10 border-primary text-primary shadow-sm"
                        : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Private
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"
              >
                Context (Optional)
              </Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Briefly describe the purpose of this room..."
                className="w-full h-24 bg-secondary border border-border rounded-[6px] p-4 text-sm font-medium focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all resize-none placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
              <Button
                onClick={() => createMut.mutate()}
                disabled={createMut.isPending}
                className="h-11 px-8 rounded-[6px] font-bold shadow-sm w-full sm:w-auto"
              >
                {createMut.isPending ? "Starting..." : "Create Room"}
              </Button>
              <Button
                variant="ghost"
                asChild
                className="h-11 px-6 text-muted-foreground hover:text-foreground rounded-[6px] font-semibold"
              >
                <Link to="/dashboard">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security / Info Strip */}
        <div className="mt-8 p-4 rounded-[6px] border border-border bg-secondary/10 flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Everything created in this room is synchronized in real-time.
            Environments are isolated and automatically hibernated after 24
            hours of inactivity.
          </p>
        </div>
      </main>
    </div>
  );
}
