import { useEffect, useState } from 'react';
import { type Contact, getContacts } from '../api/contacts.api';

const PAGE_SIZE = 50;

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function loadPage(pageNumber: number) {
    const response = await getContacts(pageNumber, PAGE_SIZE);

    setContacts((current) => {
      const existingIds = new Set(current.map((contact) => contact.id));

      const newContacts = response.data.filter(
        (contact) => !existingIds.has(contact.id),
      );

      return [...current, ...newContacts];
    });

    setTotal(response.total);
    setPage(response.page);
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const response = await getContacts(1, PAGE_SIZE);

        if (cancelled) return;

        setContacts(response.data);
        setTotal(response.total);
        setPage(response.page);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadMore() {
    if (loadingMore) return;

    const hasMore = contacts.length < total;

    if (!hasMore) return;

    setLoadingMore(true);

    try {
      await loadPage(page + 1);
    } finally {
      setLoadingMore(false);
    }
  }

  return {
    contacts,
    loading,
    loadingMore,
    loadMore,
    hasMore: contacts.length < total,
  };
}