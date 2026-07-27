import { apiClient } from '../../../shared/api/client';

export interface Contact {
  id: number;
  nom: string;
  entreprise?: string | null;
  telephone?: string | null;
  dateJoined?: string | null;
  score?: number | null;
  dynamicValues: Record<string, string>;
}

export interface ContactsResponse {
  data: Contact[];
  total: number;
  page: number;
  pageSize: number;
}

export function getContacts(page = 1, pageSize = 50) {
  return apiClient<ContactsResponse>(
    `/contacts?page=${page}&pageSize=${pageSize}`,
  );
}

export function updateContact(id: number, data: Partial<Contact>) {
  return apiClient<Contact>(`/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}