// Kept intentionally local (no import from the categories feature) so this model does not
// count as the cross-feature exception, only the product form's category dropdown does.
interface ProductCategory {
  id: number;
  category_name: string;
}

export interface Product {
  id: number;
  category_id: number;
  product_name: string;
  unit_price: number;
  // Only present on GET (list/detail) and PUT responses, the backend's create endpoint
  // returns the raw row without the eager-loaded association.
  category?: ProductCategory;
}

export type ProductInput = Pick<Product, 'product_name' | 'unit_price' | 'category_id'>;
