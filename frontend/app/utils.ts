import { Booking } from "./types";

export function hasBookingConflict(existing: Booking[], candidate: Booking): boolean {
  return existing.some((booking) => {
    const sameRoom = booking.room === candidate.room;
    const sameEngineer = booking.engineer === candidate.engineer;
    if (!sameRoom && !sameEngineer) return false;
    const candidateStart = new Date(candidate.start).getTime();
    const candidateEnd = new Date(candidate.end).getTime();
    const start = new Date(booking.start).getTime();
    const end = new Date(booking.end).getTime();
    return candidateStart < end && start < candidateEnd;
  });
}

export function toRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}
