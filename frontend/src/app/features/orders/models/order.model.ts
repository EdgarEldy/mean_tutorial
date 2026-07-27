// GraphQL's ID scalar always serializes as a string in the response, even though the
// underlying BIGINT column is numeric, so ids coming back from OrderService are string here.
// This is unlike the REST features (categories/products/customers) where ids are number.
interface OrderCustomer {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface OrderProduct {
  id: string;
  product_name: string;
  unit_price: number;
}

export interface Order {
  id: string;
  quantity: number;
  total: number;
  customer: OrderCustomer | null;
  product: OrderProduct | null;
}

// customer_id/product_id are sent as plain numbers (the dropdowns are populated from the
// existing REST CustomerService/ProductService), GraphQL's ID scalar accepts an Int literal
// and coerces it, so no string conversion is needed on the way out.
export interface OrderInput {
  customer_id: number;
  product_id: number;
  quantity: number;
}
