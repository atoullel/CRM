import { useEffect, useState } from 'react';
import { type Contact, getContacts } from '../api/contacts.api';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContacts()
      .then((response) => {
        setContacts(response.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return {
    contacts,
    loading,
  };
}