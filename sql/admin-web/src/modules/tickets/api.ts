import { mockTickets } from '@/mocks/admin';
import type { Ticket } from './types';

export function fetchTickets() {
  return Promise.resolve<Ticket[]>(mockTickets);
}

export function fetchTicketById(id: string) {
  return Promise.resolve<Ticket | undefined>(mockTickets.find((item) => item.id === id));
}
