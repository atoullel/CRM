import { type Contact } from '../api/contacts.api';
import { type Column } from '../../columns/api/columns.api';
import { EditableCell } from './EditableCell';

interface Props {
  contact: Contact;
  columns: Column[];
  onUpdate(id: number, data: Partial<Contact>): void;
  saving?: boolean;
}

function toIsoDateInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function toDisplayDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

export function TableRow({ contact, columns, onUpdate, saving }: Props) {
  return (
    <tr className={saving ? 'saving' : ''}>
      <EditableCell
        value={contact.nom}
        onSave={(value) => onUpdate(contact.id, { nom: value })}
      />
      <EditableCell
        value={contact.entreprise}
        onSave={(value) => onUpdate(contact.id, { entreprise: value })}
      />
      <EditableCell
        value={contact.telephone}
        onSave={(value) => onUpdate(contact.id, { telephone: value })}
      />
      <EditableCell
        value={toIsoDateInput(contact.dateJoined)}
        displayValue={toDisplayDate(contact.dateJoined)}
        onSave={(value) => onUpdate(contact.id, { dateJoined: value })}
      />
      <EditableCell
        value={contact.score}
        onSave={(value) => {
          const parsed = Number(value);

          if (Number.isNaN(parsed)) {
            return;
          }

          onUpdate(contact.id, { score: parsed });
        }}
      />
      {columns.map((column) => (
        <EditableCell
          key={column.id}
          value={contact.dynamicValues?.[column.id]}
          onSave={(value) =>
            onUpdate(contact.id, {
              dynamicValues: { [column.id]: value },
            })
          }
        />
      ))}
    </tr>
  );
}