import { useState } from 'react';
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

  async function handleUpdate(id: number, data: Partial<Contact>) {
    const updated = await updateContact(id, data);

    setRows((current) =>
      current.map((row) => (row.id === id ? updated : row)),
    );
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}