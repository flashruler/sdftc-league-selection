"use client";

export type AdminSection = "capacity" | "venues" | "events" | "registrations";

export function AdminSidebar({
  active,
  onChange,
}: {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
}) {
  const items: Array<{ id: AdminSection; label: string; icon?: React.ReactNode }> = [
    { id: "capacity", label: "Dashboard" },
    { id: "venues", label: "Venue Details" },
    { id: "events", label: "Events" },
    { id: "registrations", label: "Registrations" },
  ];
  return (
    <aside className="hidden md:flex md:flex-col md:w-60 border-r border-slate-200 bg-white/70 backdrop-blur-sm">
      <div className="px-4 py-4 border-b border-slate-200 text-slate-900 font-semibold">Admin</div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-slate-500">FTC League Selection</div>
    </aside>
  );
}
