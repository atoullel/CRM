import { type Column } from '../../columns/api/columns.api';


interface Props {
  columns: Column[];
}


export function TableHeader({
  columns,
}: Props) {

  return (
    <thead>
      <tr>

        <th>
          Nom
        </th>

        <th>
          Entreprise
        </th>

        <th>
          Téléphone
        </th>

        <th>
          Date joined
        </th>

        <th>
          Score
        </th>


        {columns.map((column) => (
          <th
            key={column.id}
          >
            {column.name}
          </th>
        ))}

      </tr>
    </thead>
  );
}