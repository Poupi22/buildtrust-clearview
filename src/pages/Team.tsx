import { Users, Settings as SettingsIcon } from "lucide-react";

export default function Team() {
  const members = [
    { name: "Jean-Marc Dupont", role: "Project Director", projects: 4 },
    { name: "Paul Nkembi", role: "Site Engineer", projects: 2 },
    { name: "Sarah Etonde", role: "Civil Engineer", projects: 1 },
    { name: "Michel Atangana", role: "Site Supervisor", projects: 3 },
    { name: "Aline Tchamba", role: "QS / Quantity Surveyor", projects: 2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Team</h1>
        <p className="text-muted-foreground text-sm mt-1">{members.length} team members</p>
      </div>
      <div className="space-y-3">
        {members.map((m, i) => (
          <div key={i} className="metric-card flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
              {m.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.role} · {m.projects} projects</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Company and application settings</p>
      </div>
      <div className="metric-card text-center py-12">
        <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <h3 className="font-display font-bold">Settings</h3>
        <p className="text-sm text-muted-foreground mt-1">Company settings will be available once connected to the backend</p>
      </div>
    </div>
  );
}
