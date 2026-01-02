import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getRoom,
  joinRoom,
  leaveRoom,
  setRoomVisibility,
} from "@/services/roomsService";
import { getSocket } from "@/sockets/socketClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import {
  executeCode,
  getExecution,
  checkHealth,
} from "@/services/executionService";
import * as monaco from "monaco-editor";
import "monaco-editor/min/vs/editor/editor.main.css";
import ChatDrawer from "@/components/chat/ChatDrawer";
import CodeHistoryPanel from "@/components/history/CodeHistoryPanel";
import { useTheme } from "@/providers/ThemeProvider";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { USER_COLORS } from "@/styles/theme";
import { toast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/room/Sidebar";
import { getProfile } from "@/services/usersService";
import {
  Share2,
  Play,
  Terminal,
  Users,
  Activity,
  Globe,
  Settings,
  ChevronRight,
  ChevronDown,
  Code2,
  ExternalLink,
  Shield,
  PanelLeft,
} from "lucide-react";

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

type RoomRole = "OWNER" | "EDITOR" | "VIEWER";

const ROLE_PERMISSIONS = {
  OWNER: {
    canEdit: true,
    canRun: true,
    canChangeVisibility: true,
    canInvite: true,
  },
  EDITOR: {
    canEdit: true,
    canRun: true,
    canChangeVisibility: false,
    canInvite: false,
  },
  VIEWER: {
    canEdit: false,
    canRun: false,
    canChangeVisibility: false,
    canInvite: false,
  },
} as const;

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") return new jsonWorker();
    if (label === "css" || label === "scss" || label === "less")
      return new cssWorker();
    if (label === "html" || label === "handlebars" || label === "razor")
      return new htmlWorker();
    if (label === "typescript" || label === "javascript") return new tsWorker();
    return new editorWorker();
  },
};

export default function RoomEditor() {
  const { id } = useParams();
  const roomId = id as string;
  const { search } = useLocation();

  // --- State Hooks ---
  const [content, setContent] = useState<string>("");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>("");
  const [yUsers, setYUsers] = useState<
    { id: string; name: string; color: string }[]
  >([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [myProfile, setMyProfile] = useState<{
    id?: string;
    username?: string;
    avatarUrl?: string;
    role?: string;
  } | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [syncStatus, setSyncStatus] = useState<
    "connected" | "syncing" | "offline"
  >("syncing");

  // --- Ref Hooks ---
  const containerRef = useRef<HTMLDivElement | null>(null);
  const monacoEditorRef = useRef<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const yInputRef = useRef<Y.Text | null>(null); // Added ref
  const yOutputRef = useRef<Y.Map<any> | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // --- Context Hooks ---
  const { actualTheme } = useTheme();
  const socket = useMemo(() => getSocket(), []);

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoom(roomId),
    enabled: !!roomId,
  });

  const myRoomRole = useMemo((): RoomRole => {
    const userId = localStorage.getItem("userId") || "me";
    const members = (room as any)?.members || [];
    const member = members.find((m: any) => m.userId === userId);

    if (member) return member.role;
    // If room is public, treat authenticated guest as EDITOR
    if ((room as any)?.isPublic) return "EDITOR";

    return "VIEWER";
  }, [room]);

  const myPermissions = useMemo(
    () => ROLE_PERMISSIONS[myRoomRole],
    [myRoomRole]
  );

  // --- Helpers ---
  const colorForUser = useCallback((userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++)
      hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    return USER_COLORS[hash % USER_COLORS.length];
  }, []);

  const hslVarToHex = useCallback((name: string) => {
    try {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
      const [h, s, l] = raw.split(/\s+/);
      const H = parseFloat(h);
      const S = parseFloat(s.replace("%", "")) / 100;
      const L = parseFloat(l.replace("%", "")) / 100;
      const c = (1 - Math.abs(2 * L - 1)) * S;
      const x = c * (1 - Math.abs(((H / 60) % 2) - 1));
      const m = L - c / 2;
      let r = 0,
        g = 0,
        b = 0;
      if (H < 60) {
        r = c;
        g = x;
        b = 0;
      } else if (H < 120) {
        r = x;
        g = c;
        b = 0;
      } else if (H < 180) {
        r = 0;
        g = c;
        b = x;
      } else if (H < 240) {
        r = 0;
        g = x;
        b = c;
      } else if (H < 300) {
        r = x;
        g = 0;
        b = c;
      } else {
        r = c;
        g = 0;
        b = x;
      }
      const toHex = (v: number) =>
        Math.round((v + m) * 255)
          .toString(16)
          .padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
      return "#09090b";
    }
  }, []);

  const handleUserInputChange = useCallback((val: string) => {
    setUserInput(val);
    const yInput = yInputRef.current;
    if (yInput && yInput.toString() !== val) {
      ydocRef.current?.transact(() => {
        yInput.delete(0, yInput.length);
        yInput.insert(0, val);
      });
    }
  }, []);

  const applyMonacoTheme = useCallback(() => {
    const bg = hslVarToHex("--background");
    const fg = hslVarToHex("--foreground");
    const primary = hslVarToHex("--primary");
    const border = hslVarToHex("--border");
    const selection = hslVarToHex("--accent");

    monaco.editor.defineTheme("codecollab-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": bg,
        "editor.foreground": fg,
        "editorCursor.foreground": primary,
        "editor.lineHighlightBackground": "#1e293b50",
        "editorLineNumber.foreground": "#64748b",
        "editorLineNumber.activeForeground": fg,
        "editor.selectionBackground": selection + "40",
        "editorIndentGuide.background": border + "30",
        "editorIndentGuide.activeBackground": border,
      },
    });
    monaco.editor.setTheme("codecollab-light");
  }, [hslVarToHex]);

  const onRun = async () => {
    try {
      setRunning(true);
      setOutput("Building container...");
      const code = monacoEditorRef.current?.getValue() || content;
      const res: any = await executeCode({
        code,
        language: (room as any)?.language || "javascript",
        roomId,
        input: userInput,
      });
      const execId = res?.executionId || res?.data?.executionId;
      if (execId) {
        let finished = false;
        while (!finished) {
          await new Promise((r) => setTimeout(r, 1000));
          const r: any = await getExecution(execId);
          const data = r?.data ?? r;
          if (data.status === "COMPLETED" || data.status === "FAILED") {
            const out =
              data.status === "FAILED"
                ? data.errorMessage ||
                  data.error ||
                  data.output ||
                  "(no error output)"
                : data.output ||
                  data.stdout ||
                  data.errorMessage ||
                  "(no output)";
            setOutput(out);
            yOutputRef.current?.set("text", out);
            finished = true;
          }
        }
      }
    } catch (e) {
      setOutput("Error: Kernel failed to respond.");
    } finally {
      setRunning(false);
    }
  };

  const onCheckHealth = async () => {
    try {
      const res = await checkHealth();
      const data = res?.data ?? res;
      const lang = (room as any)?.language || "javascript";
      const actualLang =
        lang === "nodejs" || lang === "javascript" ? "node" : lang;
      const status = data[actualLang] || { status: "unknown" };

      if (status.status === "ONLINE") {
        toast({
          title: "Environment Healthy",
          description: `${lang.toUpperCase()} runner is active. (Latency: ${
            status.latency || 0
          }ms)`,
        });
      } else {
        toast({
          title: "Environment Issue",
          description: `The ${lang} runner is currently ${
            status.status || "OFFLINE"
          }. Compiler may be asleep due to inactivity. Please retry 2-3 times and wait 2-4 minutes for it to wake up.`,
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Health Check Failed",
        description:
          "Could not connect to the gateway. Compiler may be off due to no requests. Try health check 2-3 times and wait 2-4 minutes for it to start. Once it's healthy, you can compile code.",
        variant: "destructive",
      });
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (!room) return;
    const serverPublic = (room as any)?.isPublic;
    if (typeof serverPublic === "boolean") setIsPublic(!!serverPublic);
  }, [room]);

  useEffect(() => {
    if (!roomId) return;
    const userId = localStorage.getItem("userId") || "me";
    const username = localStorage.getItem("username") || userId;

    (async () => {
      try {
        const data = await getProfile();
        setMyProfile({
          id: data.id,
          username: data.username,
          avatarUrl: data.avatarUrl,
          role: data.role,
        });
      } catch (err) {}
    })();

    joinRoom({ roomId, userId }).catch(() => {});
    socket.emit("join-room", { userId, username, roomId });

    return () => {
      leaveRoom({ roomId, userId }).catch(() => {});
      socket.emit("leave-room", { userId, username, roomId });
    };
  }, [roomId, socket]);

  useEffect(() => {
    if (!containerRef.current || monacoEditorRef.current) return;
    const lang = (room as any)?.language || "javascript";
    const monacoLang = lang === "nodejs" ? "javascript" : lang;

    monacoEditorRef.current = monaco.editor.create(containerRef.current, {
      language: monacoLang,
      automaticLayout: true,
      theme: "vs",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      tabSize: 2,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      lineHeight: 20,
      padding: { top: 16 },
      fontLigatures: false,
      fixedOverflowWidgets: true,
      cursorSmoothCaretAnimation: "on",
      renderWhitespace: "none",
    });

    // Force font measurement correction
    setTimeout(() => {
      monaco.editor.remeasureFonts();
    }, 500);

    monacoEditorRef.current.onDidChangeCursorPosition((e: any) => {
      setCursorPos({ line: e.position.lineNumber, column: e.position.column });
    });

    applyMonacoTheme();
    setIsEditorReady(true);

    return () => {
      monacoEditorRef.current?.dispose();
      monacoEditorRef.current = null;
    };
  }, [room, applyMonacoTheme]);

  useEffect(() => {
    if (!monacoEditorRef.current || !roomId || !isEditorReady) return;

    // Use a reference to store the doc and avoid re-creating on every render
    if (!ydocRef.current) ydocRef.current = new Y.Doc();
    const ydoc = ydocRef.current;

    const token = localStorage.getItem("accessToken") || "";
    const wsUrl =
      (import.meta.env.VITE_SOCKET_URL || "ws://localhost:4000").replace(
        /^http/,
        "ws"
      ) + "/yjs";

    const provider = new WebsocketProvider(wsUrl, roomId, ydoc, {
      connect: true,
      params: { token },
    });
    providerRef.current = provider;

    provider.on("status", (s: any) => setSyncStatus(s.status));

    const yText = ydoc.getText("code");
    const yInput = ydoc.getText("input"); // Sync input stream
    const yOutput = ydoc.getMap("output");

    yTextRef.current = yText;
    yInputRef.current = yInput; // Store ref
    yOutputRef.current = yOutput;

    const binding = new MonacoBinding(
      yText,
      monacoEditorRef.current.getModel(),
      new Set([monacoEditorRef.current]),
      provider.awareness
    );
    bindingRef.current = binding;

    // 🔧 FIX: Force sync when editor is cleared (Select All + Delete issue)
    const disposable = monacoEditorRef.current.onDidChangeModelContent(() => {
      const val = monacoEditorRef.current.getValue();
      if (val === "" && yText.length > 0) {
        yText.delete(0, yText.length);
      }
    });

    const outputObserver = () => setOutput(String(yOutput.get("text") || ""));
    yOutput.observe(outputObserver);

    // Sync Input Observer
    const inputObserver = () => {
      const val = yInput.toString();
      if (val !== userInput) {
        setUserInput(val);
      }
    };
    yInput.observe(inputObserver);

    // Initialize input if exists remotely
    if (yInput.length > 0) {
      setUserInput(yInput.toString());
    }

    // Set initial awareness state immediately
    const userId = localStorage.getItem("userId") || "me";
    provider.awareness.setLocalStateField("user", {
      id: userId,
      name: myProfile?.username || localStorage.getItem("username") || "User",
      color: colorForUser(userId),
      avatarUrl: myProfile?.avatarUrl,
      role: myRoomRole,
    });

    provider.awareness.on("update", () => {
      const states = Array.from(provider.awareness.getStates().values())
        .map((s: any) => s?.user)
        .filter(Boolean);
      setYUsers(states);
    });

    return () => {
      disposable.dispose();
      binding.destroy();
      provider.destroy();
      yOutput.unobserve(outputObserver);
      yInput.unobserve(inputObserver);
      ydoc.destroy();
      ydocRef.current = null;
    };
  }, [isEditorReady, roomId]);

  // Handle awareness updates (username, role) without reconnecting provider
  useEffect(() => {
    if (!providerRef.current) return;
    const userId = localStorage.getItem("userId") || "me";
    providerRef.current.awareness.setLocalStateField("user", {
      id: userId,
      name: myProfile?.username || localStorage.getItem("username") || "User",
      color: colorForUser(userId),
      avatarUrl: myProfile?.avatarUrl,
      role: myRoomRole,
    });
  }, [myProfile, myRoomRole, colorForUser]);

  // Handle read-only updates without reconnecting
  useEffect(() => {
    if (!monacoEditorRef.current) return;
    monacoEditorRef.current.updateOptions({
      readOnly: !myPermissions.canEdit,
    });
  }, [myPermissions.canEdit]);

  if (isLoading)
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center text-foreground font-medium">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mb-4" />
        <span className="text-sm opacity-50 tracking-widest uppercase">
          Connecting...
        </span>
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 font-sans">
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 rounded-[4px] border border-border flex items-center justify-center hover:bg-secondary transition-colors",
              isSidebarOpen && "bg-secondary text-primary"
            )}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border" />
          <Link
            to="/dashboard"
            className="h-7 w-7 rounded-[4px] border border-border flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <Code2 className="h-4 w-4 text-primary" />
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-semibold tracking-tight">
            {(room as any)?.name}
          </h1>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary border border-border border-b-muted-foreground/20 text-muted-foreground uppercase tracking-tight">
            {(room as any)?.language}
          </span>
          <div className="h-4 w-px bg-border" />
          {isPublic ? (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-tight flex items-center gap-1">
              <Globe className="h-2.5 w-2.5" />
              Public
            </span>
          ) : (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-tight flex items-center gap-1">
              <Shield className="h-2.5 w-2.5" />
              Private
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Active Collaborators Avatars */}
          <div className="flex -space-x-2 mr-4">
            {yUsers.map((u, i) => (
              <div
                key={i}
                title={u.name}
                className="h-7 w-7 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold"
                style={{ color: u.color }}
              >
                {u.name.slice(0, 1).toUpperCase()}
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-semibold hover:bg-secondary rounded-[4px] gap-2"
            onClick={() => {
              const url = `${window.location.origin}/rooms/${roomId}`;
              navigator.clipboard.writeText(url);
              toast({ title: "Room link copied" });
            }}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>

          <Button
            size="sm"
            className="h-8 text-xs font-bold rounded-[4px] px-4 shadow-md gap-2"
            onClick={onRun}
            disabled={running || !myPermissions.canRun}
          >
            <Play className={cn("h-3.5 w-3.5", running && "animate-pulse")} />
            {running ? "Running" : "Run Code"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[10px] font-bold rounded-[4px] gap-1.5 hover:bg-emerald-50 text-emerald-600"
            onClick={onCheckHealth}
          >
            <Activity className="h-3 w-3" />
            Check Health
          </Button>

          <div className="h-4 w-px bg-border mx-1" />
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Mini Rail */}
        <Sidebar
          users={yUsers}
          currentUserId={localStorage.getItem("userId") || "me"}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          userInput={userInput}
          setUserInput={handleUserInputChange}
          output={output}
          onClearOutput={() => setOutput("")}
        />

        {/* Editor & Output Pane */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative border-r border-border">
            <div ref={containerRef} className="absolute inset-0" />
            <CodeHistoryPanel
              roomId={roomId}
              currentCode={content}
              onApply={(c) => {
                if (yTextRef.current) {
                  const y = yTextRef.current;
                  y.delete(0, y.length);
                  y.insert(0, c);
                }
              }}
            />
          </div>

          {/* Minimal Bottom Output Pane */}
          <div className="h-60 border-t border-border bg-white flex flex-col shrink-0">
            <div className="h-8 px-4 border-b border-border/50 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-foreground">
                  Execution Output
                </span>
              </div>
              <button
                className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors uppercase tracking-widest px-2"
                onClick={() => setOutput("")}
              >
                Clear
              </button>
            </div>
            <div className="flex-1 p-4 font-mono text-xs overflow-auto text-foreground">
              {output ? (
                <pre className="whitespace-pre-wrap">{output}</pre>
              ) : (
                <span className="italic opacity-20">
                  Idle. Ready to execute code.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shared Components */}
      <ChatDrawer roomId={roomId} />

      {/* Status Bar */}
      <footer className="h-7 border-t border-border bg-background px-4 flex items-center justify-between text-[10px] font-medium text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity
              className={cn(
                "h-3 w-3",
                syncStatus === "connected" ? "text-primary" : "text-amber-500"
              )}
            />
            <span className="uppercase tracking-widest">{syncStatus}</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5 hover:text-foreground cursor-default transition-colors">
            <span className="uppercase tracking-widest">
              LN {cursorPos.line}, COL {cursorPos.column}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-widest">Spaces: 2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-widest">
              {(room as any)?.language}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-widest">UTF-8</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { cn } from "@/lib/utils";
