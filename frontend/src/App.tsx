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
    error,
    loadMoreError,
  } = useContacts();

  if (columnsLoading || contactsLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Failed to load contacts. Please try refreshing the page.</div>;
  }

  return (
    <div>
      <h1>CRM</h1>

      {loadMoreError && (
        <div role="alert">
          Couldn't load more contacts. Please try again.
        </div>
      )}

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
