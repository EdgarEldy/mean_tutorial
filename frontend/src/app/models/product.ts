export interface Product {
  id: number;
  category_id: number;
  product_name?: string;
  unit_price?: number;
  // Add nested Category object
  Category: {
    id: number;
    category_name?: string
  }
}
