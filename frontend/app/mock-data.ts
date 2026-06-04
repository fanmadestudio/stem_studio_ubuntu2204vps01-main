import { Booking, Client, Equipment, Invoice, Role, Staff } from "./types";

export const roles: Role[] = ["Admin", "Staff", "Client"];

export const clients: Client[] = [
  {
    id: "CL-01",
    name: "Ayla Pratama",
    email: "ayla@mail.com",
    phone: "0812-1900-1021",
    lastActivity: "2026-05-10 15:20",
  },
  {
    id: "CL-02",
    name: "Nero Studio",
    email: "nero@mail.com",
    phone: "0811-3011-9982",
    lastActivity: "2026-05-11 09:48",
  },
  {
    id: "CL-03",
    name: "Bima Orchestra",
    email: "bima@mail.com",
    phone: "0813-7402-1010",
    lastActivity: "2026-05-11 13:06",
  },
];

export const staffList: Staff[] = [
  { id: "ST-01", name: "Kevin", role: "Engineer", availability: "Available" },
  { id: "ST-02", name: "Rama", role: "Engineer", availability: "Busy" },
  { id: "ST-03", name: "Nadia", role: "Operator", availability: "Available" },
];

export const equipmentList: Equipment[] = [
  { id: "EQ-01", name: "Neumann U87", status: "Ready" },
  { id: "EQ-02", name: "Focusrite 18i20", status: "Ready" },
  { id: "EQ-03", name: "Compressor LA-2A", status: "Maintenance" },
];

export const bookingsSeed: Booking[] = [
  {
    id: "BK-101",
    client: "Ayla Pratama",
    room: "Room A",
    engineer: "Kevin",
    start: "2026-05-12T10:00",
    end: "2026-05-12T12:00",
    status: "Confirmed",
  },
  {
    id: "BK-102",
    client: "Nero Studio",
    room: "Room B",
    engineer: "Rama",
    start: "2026-05-12T11:00",
    end: "2026-05-12T14:00",
    status: "Pending",
  },
  {
    id: "BK-103",
    client: "Bima Orchestra",
    room: "Room A",
    engineer: "Kevin",
    start: "2026-05-13T15:00",
    end: "2026-05-13T18:00",
    status: "Completed",
  },
];

export const invoicesSeed: Invoice[] = [
  { id: "INV-001", bookingId: "BK-101", total: 1500000, status: "Unpaid" },
  { id: "INV-002", bookingId: "BK-102", total: 2200000, status: "Partially Paid" },
  { id: "INV-003", bookingId: "BK-103", total: 3000000, status: "Paid" },
];
