import { Link, useNavigate } from "react-router-dom";
import { Code2, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { logout } from "@/utils/logout";

export function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          to="/dashboard"
          className="flex items-center space-x-2.5 transition-opacity hover:opacity-85"
        >
          <div className="h-8 w-8 rounded-[6px] bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Code2 className="h-4 w-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            CodeCollab
          </span>
        </Link>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 px-2 hover:bg-secondary rounded-[6px] border border-transparent hover:border-border transition-all"
              >
                <div className="h-6 w-6 rounded-[4px] bg-primary/20 flex items-center justify-center border border-primary/20">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="hidden sm:inline-block text-xs font-semibold text-foreground">
                  {localStorage.getItem("username") || "Account"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card border-border rounded-[6px] shadow-xl"
            >
              <DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2">
                User Controls
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                asChild
                className="focus:bg-secondary rounded-[4px] cursor-pointer mx-1 my-0.5"
              >
                <Link
                  to="/profile"
                  className="flex items-center px-2 py-1.5 text-sm font-medium"
                >
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  Edit Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="focus:bg-secondary rounded-[4px] cursor-pointer mx-1 my-0.5"
              >
                <Link
                  to="/dashboard"
                  className="flex items-center px-2 py-1.5 text-sm font-medium"
                >
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  Manage Rooms
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer mx-1 my-0.5 rounded-[4px]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
