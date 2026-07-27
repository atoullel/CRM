import { useEffect, useRef, useState } from 'react';
import { type Contact, updateContact } from '../api/contacts.api';
import { type Column } from '../../columns/api/columns.api';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

interface Props {
  contacts: Contact[];
  columns: Column[];
  loadMore(): void;
  loadingMore: boolean;
  hasMore: boolean;
}

function diffPreviousData(
  row: Contact,
  data: Partial<Contact>,
): Partial<Contact> {
  return (Object.keys(data) as (keyof Contact)[]).reduce((acc, key) => {
    if (key === 'dynamicValues' && data.dynamicValues) {
      acc.dynamicValues = row.dynamicValues;
    } else {
      (acc as Record<string, unknown>)[key] = row[key];
    }

    return acc;
  }, {} as Partial<Contact>);
}

export function ContactsTable({
  contacts,
  columns,
  loadMore,
  loadingMore,
  hasMore,
}: Props) {
  const [rows, setRows] = useState<Contact[]>(contacts);
  const [previousContacts, setPreviousContacts] = useState(contacts);

  const [savingIds, setSavingIds] = useState<number[]>([]);

  const latestRequestId = useRef<Record<number, number>>({});
  const inFlightCount = useRef<Record<number, number>>({});

  // Mirrors `rows` so `handleUpdate` can read the latest state
  // synchronously without needing a side effect inside `setRows`.
  const rowsRef = useRef<Contact[]>(rows);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Per-contact promise chain so two updates to the same row are sent to
  // the server in order, rather than racing each other.
  const requestQueue = useRef<Record<number, Promise<void>>>({});

  /*
   * Synchronize newly fetched pages into local table state.
   *
   * We intentionally do this during render instead of useEffect so we avoid
   * React's "setState inside effect" lint warning while preserving optimistic
   * edits already stored in rows.
   */
  if (contacts !== previousContacts) {
    setPreviousContacts(contacts);

    setRows((current) => {
      const existingIds = new Set(current.map((row) => row.id));

      const newRows = contacts.filter(
        (contact) => !existingIds.has(contact.id),
      );

      return newRows.length > 0 ? [...current, ...newRows] : current;
    });
  }

  async function performUpdate(id: number, data: Partial<Contact>) {
    const requestId = (latestRequestId.current[id] ?? 0) + 1;
    latestRequestId.current[id] = requestId;

    // Computed up front, from a ref that mirrors current state, instead of
    // as a side effect inside the `setRows` updater. Updater functions are
    // expected to be pure - React may invoke them more than once per
    // commit (e.g. under StrictMode or concurrent rendering), and mutating
    // an outer variable from inside one is fragile.
    const existingRow = rowsRef.current.find((row) => row.id === id);

    const previousData: Partial<Contact> = existingRow
      ? diffPreviousData(existingRow, data)
      : {};

    inFlightCount.current[id] = (inFlightCount.current[id] ?? 0) + 1;

    setSavingIds((current) =>
      current.includes(id) ? current : [...current, id],
    );

    // Optimistic update
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              ...data,
              dynamicValues: data.dynamicValues
                ? {
                    ...row.dynamicValues,
                    ...data.dynamicValues,
                  }
                : row.dynamicValues,
            }
          : row,
      ),
    );

    try {
      const updated = await updateContact(id, data);

      // Ignore stale responses
      if (latestRequestId.current[id] !== requestId) {
        return;
      }

      setRows((current) =>
        current.map((row) => (row.id === id ? updated : row)),
      );
    } catch (error) {
      console.error('Failed to update contact:', error);

      // Ignore stale rollbacks
      if (latestRequestId.current[id] !== requestId) {
        return;
      }

      setRows((current) =>
        current.map((row) =>
          row.id === id
            ? {
                ...row,
                ...previousData,
              }
            : row,
        ),
      );
    } finally {
      inFlightCount.current[id] = Math.max(
        0,
        (inFlightCount.current[id] ?? 0) - 1,
      );

      if (inFlightCount.current[id] === 0) {
        setSavingIds((current) =>
          current.filter((item) => item !== id),
        );
      }
    }
  }

  function handleUpdate(id: number, data: Partial<Contact>) {
    // Chain onto any update already in flight for this contact so PATCH
    // requests for the same row are always sent in order. `.catch(() =>
    // {})` on the previous link keeps a failed update from breaking the
    // chain for subsequent ones.
    const previous = requestQueue.current[id] ?? Promise.resolve();

    const next = previous
      .catch(() => {})
      .then(() => performUpdate(id, data))
      .finally(() => {
        // Only clear the entry if it's still the one we set - a newer
        // call for this id may have already replaced it while this one
        // was in flight.
        if (requestQueue.current[id] === next) {
          delete requestQueue.current[id];
        }
      });

    requestQueue.current[id] = next;

    return next;
  }

  /*
   * Infinite scrolling.
   *
   * Watches an invisible sentinel placed below the table.
   * When it becomes visible we request the next page.
   */
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          hasMore &&
          !loadingMore
        ) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  return (
    <div className="table-container">
      <table>
        <TableHeader columns={columns} />

        <tbody>
          {rows.map((contact) => (
            <TableRow
              key={contact.id}
              contact={contact}
              columns={columns}
              onUpdate={handleUpdate}
              saving={savingIds.includes(contact.id)}
            />
          ))}
        </tbody>
      </table>

      {loadingMore && (
        <div
          style={{
            textAlign: 'center',
            padding: '1rem',
          }}
        >
          Loading more contacts...
        </div>
      )}

      <div
        ref={sentinelRef}
        style={{
          height: 1,
        }}
      />

      {!hasMore && (
        <div
          style={{
            textAlign: 'center',
            padding: '1rem',
            color: '#666',
          }}
        >
          All contacts loaded
        </div>
      )}
    </div>
  );
}