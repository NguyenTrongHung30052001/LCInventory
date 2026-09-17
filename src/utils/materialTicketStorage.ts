import { MaterialTicket } from '../types';

const STORAGE_KEY = 'material_inventory_tickets_v2';

export const INITIAL_MATERIAL_TICKETS: MaterialTicket[] = [];

export function getStoredMaterialTickets(): MaterialTicket[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Filter out any previous dummy items if any exist
        return parsed.filter(
          (t) =>
            t.id !== 'mat-ticket-1' &&
            t.id !== 'mat-ticket-2' &&
            t.id !== 'mat-ticket-3' &&
            t.code !== 'PH-892101' &&
            t.code !== 'PH-892102' &&
            t.code !== 'PH-892103'
        );
      }
    }
  } catch (e) {
    console.error('Error reading material tickets from localStorage', e);
  }
  return [];
}

export function saveStoredMaterialTickets(tickets: MaterialTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error('Error saving material tickets to localStorage', e);
  }
}
