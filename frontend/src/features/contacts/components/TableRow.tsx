import { type Contact } from '../api/contacts.api';
import { type Column } from '../../columns/api/columns.api';


interface Props {
  contact: Contact;
  columns: Column[];
}


export function TableRow({
  contact,
  columns,
}: Props) {

  return (
    <tr>

      <td>
        {contact.nom}
      </td>


      <td>
        {contact.entreprise}
      </td>


      <td>
        {contact.telephone}
      </td>


      <td>
        {contact.dateJoined
          ? new Date(
              contact.dateJoined,
            ).toLocaleDateString()
          : ''}
      </td>


      <td>
        {contact.score}
      </td>


      {columns.map((column) => (
        <td
          key={column.id}
        >
          {
            contact.dynamicValues[
              column.id
            ]
          }
        </td>
      ))}

    </tr>
  );
}