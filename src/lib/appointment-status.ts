export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";

export const APPOINTMENT_STATUS: Record<
  AppointmentStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  SCHEDULED: { label: "Agendado", variant: "outline" },
  CONFIRMED: { label: "Confirmado", variant: "default" },
  COMPLETED: { label: "Concluído", variant: "secondary" },
  CANCELED: { label: "Cancelado", variant: "outline" },
  NO_SHOW: { label: "Faltou", variant: "destructive" },
};
