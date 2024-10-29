// Product type

export type Product = {
  _id: string;
  title: string;
  price: number;
  slug: string;
  ratting: {
    rate: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

// Product variant
export type ProductCreatePayload = Omit<
  Product,
  '_id' | 'createdAt' | 'updatedAt'
>;
export type ProductCreateInput = Omit<ProductCreatePayload, 'slug' | 'ratting'>;

export type ProductUpdatePayload = Partial<
  Omit<Product, '_id' | 'createdAt' | 'updatedAt'>
>;
export type ProductUpdateInput = Omit<ProductUpdatePayload, 'slug' | 'ratting'>;

// ProductRedirect type

export type ProductRedirect = {
  _id: string;
  productId: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

// ProductRedirect variant
export type ProductRedirectInput = Omit<
  ProductRedirect,
  '_id' | 'createdAt' | 'updatedAt'
>;
