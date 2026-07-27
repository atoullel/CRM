import { useState } from 'react';

interface Props {
  value: string | number | null | undefined;
  onSave(value: string): void;
}

export function EditableCell({ value, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.toString() ?? '');

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

  return <td onDoubleClick={() => setEditing(true)}>{value}</td>;
}