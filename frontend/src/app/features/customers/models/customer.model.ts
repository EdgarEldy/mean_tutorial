// Every field is optional/nullable, mirroring backend/src/database/models/customer.js
// (allowNull: true on all columns) and customer.validation.js (every rule is .optional()).
export interface Customer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  telephone: string | null;
  email: string | null;
  address: string | null;
}

export type CustomerInput = Partial<Omit<Customer, 'id'>>;
