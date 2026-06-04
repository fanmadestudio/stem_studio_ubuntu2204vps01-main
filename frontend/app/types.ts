export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export type Role = "Admin" | "Staff" | "Client";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastActivity: string;
}

export interface Staff {
  id: string;
  name: string;
  role: "Engineer" | "Operator";
  availability: "Available" | "Busy";
}

export interface Equipment {
  id: string;
  name: string;
  status: "Ready" | "Maintenance";
}

export interface Booking {
  id: string;
  client: string;
  room: string;
  engineer: string;
  start: string;
  end: string;
  status: BookingStatus;
  actionBy?: string;
}

export interface Invoice {
  id: string;
  bookingId: string;
  total: number;
  status: "Unpaid" | "Paid" | "Partially Paid";
}
