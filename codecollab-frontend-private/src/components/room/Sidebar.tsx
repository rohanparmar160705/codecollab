import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Activity,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RoomUser {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
  role?: string;
}

interface SidebarProps {
  users: RoomUser[];
  currentUserId: string;
  isOpen: boolean;
  onToggle: () => void;
  userInput: string;
  setUserInput: (v: string) => void;
  output: string;
  onClearOutput: () => void;
}

export function Sidebar({
  users,
  currentUserId,
  isOpen,
  onToggle,
  userInput,
  setUserInput,
}: SidebarProps) {
  return (
    <div
      className={cn(
        "h-full border-r border-border bg-card flex shrink-0 transition-all duration-300",
        isOpen ? "w-64" : "w-12"
      )}
    >
      {/* Nav Rail / Minimal State */}
      {!isOpen && (
        <div className="flex-1 flex flex-col items-center py-4 gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 rounded-[4px]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex flex-col gap-4 items-center">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isOpen && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Collaborators
              </span>
              <span className="text-[10px] bg-secondary px-1.5 rounded text-muted-foreground">
                {users.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-7 w-7 rounded-[4px]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {/* User List */}
            <div className="p-3 space-y-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-[4px] group transition-colors",
                    user.id === currentUserId
                      ? "bg-primary/5"
                      : "hover:bg-secondary"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8 border border-slate-700">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback
                        className="text-[10px] font-bold text-white"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500 shadow-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate flex items-center gap-2">
                      {user.name}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">
                      {user.role || "Developer"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Config Area */}
            <div className="mt-8 px-4 pb-8 space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Terminal className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                  Input Stream
                </span>
              </div>
              <div className="space-y-2">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type or paste input here..."
                  className="w-full h-32 bg-secondary border border-border rounded-[6px] p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none placeholder:text-muted-foreground/30 text-foreground"
                />
                <p className="text-[9px] text-slate-600 italic">
                  This will be piped to stdin during execution.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
