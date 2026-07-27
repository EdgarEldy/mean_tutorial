export interface DataTableColumn<T> {
  /** Must not be 'actions' (reserved for the actions column) or throw on a row with missing/null nested fields. */
  key: string;
  header: string;
  value: (row: T) => string;
}

export interface DataTableAction<T> {
  icon: string;
  label: string;
  handler: (row: T) => void;
}
