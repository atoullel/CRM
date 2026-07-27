import {
  useEffect,
  useState,
} from 'react';

import {
  type Column,
  getColumns,
} from '../api/columns.api';


export function useColumns() {

  const [columns, setColumns] =
    useState<Column[]>([]);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    getColumns()
      .then(setColumns)
      .finally(() =>
        setLoading(false),
      );

  }, []);


  return {
    columns,
    loading,
  };
}