import { useRef, useState } from 'react';
import { type Contact, updateContact } from '../api/contacts.api';
import { type Column } from '../../columns/api/columns.api';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

interface Props {
  contacts: Contact[];
  columns: Column[];
}

export function ContactsTable({ contacts, columns }: Props) {
  const [rows, setRows] = useState(contacts);
  const [savingIds, setSavingIds] = useState<number[]>([]);
  const latestRequestId = useRef<Record<number, number>>({});
  const inFlightCount = useRef<Record<number, number>>({});

  async function handleUpdate(id: number, data: Partial<Contact>) {
    const requestId = (latestRequestId.current[id] ?? 0) + 1;
    latestRequestId.current[id] = requestId;

    let previousData: Partial<Contact> | undefined;

    inFlightCount.current[id] = (inFlightCount.current[id] ?? 0) + 1;
    setSavingIds((current) => (current.includes(id) ? current : [...current, id]));

    // Optimistic UI update
    // Handles deep dynamicValues merge if present.
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;

        previousData = (Object.keys(data) as (keyof Contact)[]).reduce(
          (acc, key) => {
            if (key === 'dynamicValues' && data.dynamicValues) {
              acc.dynamicValues = row.dynamicValues;
            } else {
              (acc as Record<string, unknown>)[key] = row[key];
            }
            return acc;
          },
          {} as Partial<Contact>,
        );

        return {
          ...row,
          ...data,
          dynamicValues: data.dynamicValues
            ? {
                ...row.dynamicValues,
                ...data.dynamicValues,
              }
            : row.dynamicValues,
        };
      }),
    );

    try {
      // Sync with backend response
      const updated = await updateContact(id, data);

      // Ignore stale responses.
      if (latestRequestId.current[id] !== requestId) {
        return;
      }

      setRows((current) =>
        current.map((row) => (row.id === id ? updated : row)),
      );
    } catch (error) {
      console.error('Failed to update contact:', error);

      // Ignore stale rollbacks.
      if (latestRequestId.current[id] !== requestId) {
        return;
      }

      // Selective rollback: restore only the previous values of the
      // keys this call touched.
      setRows((current) =>
        current.map((row) =>
          row.id === id ? { ...row, ...previousData } : row,
        ),
      );
    } finally {
      inFlightCount.current[id] = Math.max(0, (inFlightCount.current[id] ?? 1) - 1);
      if (inFlightCount.current[id] === 0) {
        setSavingIds((current) => current.filter((item) => item !== id));
      }
    }
  }

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
    </div>
  );
}
