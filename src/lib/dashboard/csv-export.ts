import type { OrganizerPeopleRosterItem } from "@/types/dashboard";

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = typeof value === "object" ? JSON.stringify(value) : String(value);

  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function formatRosterCsv(items: OrganizerPeopleRosterItem[]): string {
  const headers = [
    "ID",
    "Name",
    "Display Name",
    "Username",
    "Participation Type",
    "Status",
    "Registration Date",
    "Campaign Title",
    "Registration Data",
  ];

  const rows = items.map((item) => {
    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toISOString()
      : "";

    const registrationDataStr =
      item.registrationData && Object.keys(item.registrationData).length > 0
        ? JSON.stringify(item.registrationData)
        : "";

    return [
      escapeCsvField(item.id),
      escapeCsvField(item.name || ""),
      escapeCsvField(item.displayName || ""),
      escapeCsvField(item.username ? `@${item.username}` : ""),
      escapeCsvField(item.participationType),
      escapeCsvField(item.status),
      escapeCsvField(formattedDate),
      escapeCsvField(item.campaignTitle || ""),
      escapeCsvField(registrationDataStr),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

export function downloadRosterCsv(filename: string, csvContent: string): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
