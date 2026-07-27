import { useState } from 'react';

interface Props {
  value: string | number | null | undefined;
  onSave(value: string): void;
  displayValue?: string | number | null | undefined;
}

export function EditableCell({ value, onSave, displayValue }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? '');
  const [syncedValue, setSyncedValue] = useState(value);

  if (!editing && value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value?.toString() ?? '');
  }

  function save() {
    setEditing(false);

    if (draft !== (value?.toString() ?? '')) {
      onSave(draft);
    }
  }

  if (editing) {
    return (
      <td>
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              save();
            }
          }}
        />
      </td>
    );
  }

  return <td onDoubleClick={() => setEditing(true)}>{displayValue ?? value}</td>;
}
