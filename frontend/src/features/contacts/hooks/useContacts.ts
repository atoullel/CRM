import { useCallback, useEffect, useRef, useState } from 'react';
import { type Contact, getContacts } from '../api/contacts.api';

const PAGE_SIZE = 50;

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState<Error | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<Error | null>(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const isFetchingMoreRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      setLoading(true);
      setError(null);

      try {
        const response = await getContacts(1, PAGE_SIZE);

        if (cancelled) return;

        setContacts(response.data);
        setTotal(response.total);
        setPage(response.page);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('Failed to load contacts'),
          );
        }
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

  const loadMore = useCallback(async () => {
    if (isFetchingMoreRef.current) return;

    const hasMoreNow = contacts.length < total;
    if (!hasMoreNow) return;

    isFetchingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await getContacts(page + 1, PAGE_SIZE);

      setContacts((current) => {
        const existingIds = new Set(current.map((contact) => contact.id));

        const newContacts = response.data.filter(
          (contact) => !existingIds.has(contact.id),
        );

        return [...current, ...newContacts];
      });

      setTotal(response.total);
      setPage(response.page);
    } catch (err) {
      setLoadMoreError(
        err instanceof Error
          ? err
          : new Error('Failed to load more contacts'),
      );
    } finally {
      isFetchingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [contacts.length, total, page]);

  return {
    contacts,
    loading,
    loadingMore,
    loadMore,
    hasMore: contacts.length < total,
    error,
    loadMoreError,
  };
}
