import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  FileText,
  MessageSquare,
  CalendarDays,
  Inbox,
  Users2,
  Brain,
  Settings,
  Search,
  Activity,
  Stethoscope,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn, initials } from "@/lib/utils";
import { currentUser, getClinic, seedPatients } from "@/lib/data-service";
import { useMessages, useAppointments } from "@/lib/selectors";
import { useTheme } from "@/lib/theme";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { CommandSearch } from "@/components/shared/CommandSearch";

const NAV = [
  { to: "/", label: "Daily Worklist", icon: LayoutDashboard, end: true },
  { to: "/patients", label: "Patient Registry", icon: Users },
  { to: "/orders", label: "Order Wizard", icon: FlaskConical },
  { to: "/reports", label: "Report Wizard", icon: FileText },
  { to: "/chatemr", label: "ChatEMR", icon: MessageSquare },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/osakhi", label: "OSakhi Inbox", icon: Inbox },
  { to: "/peer-review", label: "Peer Review", icon: Users2 },
  { to: "/mtb", label: "Molecular Tumor Board", icon: Brain },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const messages = useMessages();
  const appts = useAppointments();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const unread = messages.filter((m) => m.status === "Unread").length;
  const todayAppts = appts.filter((a) => a.isToday && a.status !== "Cancelled").length;
  const clinic = getClinic(currentUser.clinicId);

  const badges: Record<string, number> = useMemo(
    () => ({ "/osakhi": unread, "/appointments": todayAppts }),
    [unread, todayAppts]
  );

  return (
    <div className="flex h-full">
      {/* Mobile drawer backdrop */}
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/70 bg-card backdrop-blur-sm transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 lg:bg-card/70",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-indigo-600 text-white shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight">
              Onc<span className="gold-gradient-text">OPD</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Precision Oncology</div>
          </div>
          <button
            onClick={() => setNavOpen(false)}
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="mx-3 mb-4 flex items-center gap-2 rounded-lg border border-border/70 bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span>Search patients…</span>
          <kbd className="ml-auto rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
        </button>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gold/12 text-gold shadow-[inset_2px_0_0_0] shadow-gold"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badges[item.to] > 0 && (
                <Badge variant="gold" className="px-1.5 py-0 text-[10px]">
                  {badges[item.to]}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border/70 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <Avatar className="h-9 w-9">{initials(currentUser.name)}</Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium">{currentUser.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{currentUser.subspecialty}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-card/70 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            onClick={() => setNavOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Mobile brand */}
          <div className="flex items-center gap-1.5 text-base font-bold tracking-tight lg:hidden">
            Onc<span className="gold-gradient-text">OPD</span>
          </div>
          {/* Desktop clinic breadcrumb */}
          <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
            <Activity className="h-4 w-4 text-gold" />
            <span className="font-medium text-foreground">{clinic?.name}</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{clinic?.city}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
            <div className="hidden items-center gap-1.5 rounded-sm border border-border/70 bg-muted/50 px-3 py-1 text-xs xl:flex">
              <span className="h-1.5 w-1.5 animate-pulse-gold rounded-full bg-gold" />
              <span className="text-muted-foreground">Monday, 06 Jul 2026</span>
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground lg:hidden"
            >
              <Search className="h-4 w-4" />
            </button>
            <Badge variant="outline" className="hidden gap-1.5 sm:flex">
              <span className="font-semibold text-foreground">{seedPatients.length}</span> active patients
            </Badge>
            <button
              onClick={toggle}
              title={theme === "light" ? "Switch to dark" : "Switch to light"}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border/70 bg-card/50 px-4 py-2 text-[11px] text-muted-foreground sm:px-6 lg:px-8">
          <span className="truncate">OncOPD — Precision Oncology Platform</span>
          <span className="shrink-0">v1.0 · © 2026</span>
        </footer>
      </div>

      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} onPick={(id) => navigate(`/patients/${id}`)} />
    </div>
  );
}
