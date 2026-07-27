import { useColumns } from './features/columns/hooks/useColumns';
import { useContacts } from './features/contacts/hooks/useContacts';
import { ContactsTable } from './features/contacts/components/ContactsTable';

function App() {
  const { columns, loading: columnsLoading } = useColumns();

  const {
    contacts,
    loading: contactsLoading,
    loadMore,
    loadingMore,
    hasMore,
  } = useContacts();

  if (columnsLoading || contactsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>CRM</h1>

      <ContactsTable
        columns={columns}
        contacts={contacts}
        loadMore={loadMore}
        loadingMore={loadingMore}
        hasMore={hasMore}
      />
    </div>
  );
}

export default App;