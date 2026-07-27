import { apiClient } from '../../../shared/api/client';

export interface Column {
  id: number;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'PHONE';
  position: number;
}

export function getColumns() {
  return apiClient<Column[]>('/columns');
}