import {
  useColumns,
} from './features/columns/hooks/useColumns';

import {
  useContacts,
} from './features/contacts/hooks/useContacts';


function App() {

  const {
    columns,
    loading: columnsLoading,
  } = useColumns();


  const {
    contacts,
    loading: contactsLoading,
  } = useContacts();


  if (
    columnsLoading ||
    contactsLoading
  ) {
    return <div>Loading...</div>;
  }


  return (
    <div>
      <h1>
        CRM
      </h1>


      <pre>
        {JSON.stringify(
          {
            columns,
            contacts,
          },
          null,
          2,
        )}
      </pre>

    </div>
  );
}


export default App;