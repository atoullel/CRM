import { type Contact } from '../api/contacts.api';
import { type Column } from '../../columns/api/columns.api';

import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';


interface Props {
  contacts: Contact[];
  columns: Column[];
}


export function ContactsTable({
  contacts,
  columns,
}: Props) {

  return (
    <table>
      <TableHeader
        columns={columns}
      />

      <tbody>
        {contacts.map((contact) => (
          <TableRow
            key={contact.id}
            contact={contact}
            columns={columns}
          />
        ))}
      </tbody>
    </table>
  );
}