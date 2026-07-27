export interface Category {
  id: number;
  category_name: string;
}

export type CategoryInput = Pick<Category, 'category_name'>;
