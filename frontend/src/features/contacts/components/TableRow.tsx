import { type Contact } from '../api/contacts.api';
import { type Column } from '../../columns/api/columns.api';
import { EditableCell } from './EditableCell';

interface Props {
  contact: Contact;
  columns: Column[];
  onUpdate(id: number, data: Partial<Contact>): void;
}

export function TableRow({ contact, columns, onUpdate }: Props) {
  return (
    <tr>
      <EditableCell
        value={contact.nom}
        onSave={(value) =>
          onUpdate(contact.id, {
            nom: value,
          })
        }
      />

      <EditableCell
        value={contact.entreprise}
        onSave={(value) =>
          onUpdate(contact.id, {
            entreprise: value,
          })
        }
      />

      <EditableCell
        value={contact.telephone}
        onSave={(value) =>
          onUpdate(contact.id, {
            telephone: value,
          })
        }
      />

      <EditableCell
        value={
          contact.dateJoined
            ? new Date(contact.dateJoined).toLocaleDateString()
            : ''
        }
        onSave={(value) =>
          onUpdate(contact.id, {
            dateJoined: value,
          })
        }
      />

      <EditableCell
        value={contact.score}
        onSave={(value) =>
          onUpdate(contact.id, {
            score: Number(value),
          })
        }
      />

      {columns.map((column) => (
        <EditableCell
          key={column.id}
          value={contact.dynamicValues[column.id]}
          onSave={(value) =>
            onUpdate(contact.id, {
              dynamicValues: {
                [column.id]: value,
              },
            })
          }
        />
      ))}
    </tr>
  );
}