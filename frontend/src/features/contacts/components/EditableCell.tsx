import { useEffect, useState } from 'react';

interface Props {
  value: string | number | null | undefined;
  onSave(value: string): void;
  displayValue?: string | number | null | undefined;
}

export function EditableCell({
  value,
  onSave,
  displayValue,
}: Props) {
  const normalizedValue = value?.toString() ?? '';

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(normalizedValue);
  const [lastValue, setLastValue] = useState(normalizedValue);

  useEffect(() => {
    if (normalizedValue !== lastValue) {
      setLastValue(normalizedValue);

      if (!editing) {
        setDraft(normalizedValue);
      }
    }
  }, [normalizedValue, lastValue, editing]);

  function startEditing() {
    setDraft(normalizedValue);
    setEditing(true);
  }

  function save() {
    if (draft === normalizedValue) {
      setEditing(false);
      return;
    }

    setEditing(false);
    onSave(draft);
  }

  function cancel() {
    setDraft(normalizedValue);
    setEditing(false);
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

            if (event.key === 'Escape') {
              cancel();
            }
          }}
        />
      </td>
    );
  }

  return (
    <td onDoubleClick={startEditing}>
      {displayValue ?? value}
    </td>
  );
}