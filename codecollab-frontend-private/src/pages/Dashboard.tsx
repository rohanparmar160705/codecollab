import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  FolderCode,
  Plus,
  Users,
  Clock,
  Share2,
  Globe,
  Trash2,
  ArrowRight,
  Code2,
  ExternalLink,
  Shield,
  Copy,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { deleteRoom, listRooms } from "@/services/roomsService";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    data: rooms,
    isLoading,
    refetch,
  } = useQuery({ queryKey: ["rooms", "mine"], queryFn: listRooms });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: () => refetch(),
  });

  const origin = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    []
  );

  async function handleShare(roomId: string) {
    const url = `${origin}/rooms/${roomId}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Room URL has been copied to your clipboard.",
    });
  }

  const roomsCount = Array.isArray(rooms) ? rooms.length : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
            <p className="text-muted-foreground font-medium">
              Manage your collaborative coding sessions and environments.
            </p>
          </div>
          <Button
            asChild
            className="rounded-[6px] h-11 px-6 font-semibold shadow-sm"
          >
            <Link to="/rooms/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Room
            </Link>
          </Button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Active Sessions", value: roomsCount, icon: FolderCode },
            { label: "Total Members", value: "-", icon: Users },
            { label: "Code Executions", value: "-", icon: Clock },
            { label: "Storage Used", value: "0.4 MB", icon: Shield },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-4 rounded-[6px] border border-border bg-card/50 flex flex-col gap-1"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <stat.icon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <span className="text-xl font-bold">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Rooms Table-like List */}
        <div className="rounded-[6px] border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-12 px-6 py-3 bg-secondary/50 border-b border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <div className="col-span-12 md:col-span-5">Room Name</div>
            <div className="hidden md:block md:col-span-2">Environment</div>
            <div className="hidden md:block md:col-span-2">Created</div>
            <div className="hidden md:block md:col-span-3 text-right">
              Actions
            </div>
          </div>

          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-20 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : roomsCount > 0 ? (
              rooms.map((r: any) => (
                <div
                  key={r.id}
                  className="grid grid-cols-12 px-6 py-4 items-center hover:bg-secondary/30 transition-colors group"
                >
                  <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                    <div className="h-9 w-9 rounded-[6px] bg-secondary flex items-center justify-center border border-border group-hover:border-primary/20 transition-colors">
                      <Code2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h4
                        className="font-semibold text-sm group-hover:text-primary transition-colors cursor-pointer"
                        onClick={() => navigate(`/rooms/${r.id}`)}
                      >
                        {r.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {r.description || "No description provided."}
                        </p>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        {r.isPublic ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
                            <Globe className="h-2.5 w-2.5" />
                            Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-tighter">
                            <Shield className="h-2.5 w-2.5" />
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:block md:col-span-2">
                    <span className="text-[11px] font-mono bg-secondary px-2 py-0.5 rounded border border-border font-medium uppercase tracking-tight">
                      {r.language}
                    </span>
                  </div>

                  <div className="hidden md:block md:col-span-2 text-xs text-muted-foreground font-medium">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>

                  <div className="col-span-12 md:col-span-3 flex items-center justify-end gap-1 mt-4 md:mt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-[6px]"
                      onClick={() => navigate(`/rooms/${r.id}`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-[6px]"
                      onClick={() => handleShare(r.id)}
                      title="Copy Share Link"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-[6px]"
                      onClick={() => delMut.mutate(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-32 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto opacity-50">
                  <FolderCode className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">No rooms found</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Build your first collaborative session and start shipping code
                  with your team.
                </p>
                <Button asChild size="sm" className="rounded-[6px] h-10 px-8">
                  <Link to="/rooms/new">Create Your First Room</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
