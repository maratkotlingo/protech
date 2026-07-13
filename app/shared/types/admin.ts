export type MoneyLike = number | string | null | undefined;

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: Pagination;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  image: string | null;
};

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "BULK_UPDATE"
  | "BULK_DELETE"
  | "STOCK_ADJUSTMENT"
  | "ANSWER"
  | "ORDER_STATUS"
  | "PAYMENT_STATUS"
  | "LOGIN"
  | "LOGOUT";

export type AuditLogItem = {
  id: number;
  adminId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata: unknown;
  createdAt: string;
  admin: Pick<AdminUser, "id" | "email" | "name" | "image"> | null;
};

export type Category = {
  id: number;
  name: string;
};

export type Attribute = {
  id: number;
  name: string;
  unit: string;
  _count?: {
    productAttributes: number;
  };
};

export type ProductImage = {
  id?: number;
  url: string;
};

export type ProductAttributeValue = {
  id?: number;
  attributeId: number;
  value: string;
  attribute?: Attribute;
};

export type ProductStock = {
  id: number;
  quantity: number;
  updatedAt: string;
  product: {
    id: number;
    name: string;
    article: string;
    isActive: boolean;
  };
};

export type ProductListItem = {
  id: number;
  name: string;
  description: string;
  currentPrice: MoneyLike;
  costPrice: MoneyLike;
  oldPrice: MoneyLike;
  article: string;
  mainImage: string;
  ozonLink: string | null;
  categoryId: number;
  category: Category;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productStocks: Array<{ quantity: number }>;
  _count: {
    reviews: number;
    orderItems: number;
  };
};

export type ProductDetails = ProductListItem & {
  productImages: ProductImage[];
  productAttributes: ProductAttributeValue[];
  productStocks: Array<{
    id: number;
    quantity: number;
    updatedAt: string;
  }>;
  productPrices: Array<{
    id: number;
    value: MoneyLike;
    createdAt: string;
  }>;
};

export type ProductFormState = {
  name: string;
  description: string;
  currentPrice: number | null;
  costPrice: number | null;
  oldPrice: number | null;
  article: string;
  mainImage: string;
  ozonLink: string;
  categoryId: number | undefined;
  isActive: boolean;
  productImages: Array<{ url: string }>;
  productAttributes: Array<{
    attributeId: number | undefined;
    value: string;
  }>;
};

export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "UPON_RECEIPT" | "PAID" | "CANCELLED";
export type PaymentMethod = "OFFLINE" | "ONLINE";
export type ObtainingMethod = "DELIVERY" | "PICKUP";

export type OrderListItem = {
  id: number;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  obtainingMethod: ObtainingMethod;
  createdAt: string;
  updatedAt: string;
  user: Pick<AdminUser, "id" | "email" | "name"> | null;
  payment: {
    amount: MoneyLike;
    paymentStatus: PaymentStatus;
    paidAt: string | null;
  } | null;
  delivery: {
    address: string;
    apartment: string | null;
    entrance: string | null;
    floor: string | null;
    intercom: string | null;
    comment: string | null;
  } | null;
  orderItems: Array<{
    quantity: number;
    price: MoneyLike;
    product: {
      id: number;
      name: string;
      mainImage: string;
    };
  }>;
  _count?: {
    orderItems: number;
  };
};

export type ReviewListItem = {
  id: number;
  userId: string;
  productId: number;
  rating: number;
  advantages: string | null;
  disadvantages: string | null;
  comment: string | null;
  isAnswered: boolean | null;
  createdAt: string;
  updatedAt: string;
  user: Pick<AdminUser, "id" | "email" | "name">;
  product: {
    id: number;
    name: string;
    mainImage: string;
  };
  reviewPhotos: ProductImage[];
  reviewAnswers: Array<{
    id: number;
    text: string;
    userId: string | null;
    createdAt: string;
    user: {
      name: string | null;
    } | null;
  }>;
};

export type FaqQuestion = {
  id: number;
  userId: string;
  title: string;
  comment: string;
  isAnswered: boolean | null;
  createdAt: string;
  updatedAt: string;
  user: Pick<AdminUser, "id" | "email" | "name">;
  shopQuestionImages: ProductImage[];
  shopAnswers: Array<{
    id: number;
    comment: string;
    userId: string | null;
    createdAt: string;
    user: {
      name: string | null;
    } | null;
  }>;
};

export type DashboardStats = {
  productsTotal: number;
  productsActive: number;
  ordersTotal: number;
  ordersNew: number;
  reviewsPending: number;
  faqPending: number;
  lowStock: number;
  revenuePaid: MoneyLike;
};

export type SalesSeriesItem = {
  date: string;
  orders: number;
  quantity: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  averageOrderValue: number;
};

export type SalesAnalyticsResponse = {
  period: {
    startDate: string;
    endDate: string;
    granularity: "day" | "week" | "month";
  };
  filters: {
    productId: number | null;
    categoryId: number | null;
  };
  totals: {
    orders: number;
    quantity: number;
    revenue: number;
    cost: number;
    grossProfit: number;
    averageOrderValue: number;
    grossMargin: number;
  };
  salesByPeriod: SalesSeriesItem[];
  breakdowns: {
    orderStatus: Array<{ status: OrderStatus; orders: number }>;
    paymentMethod: Array<{ paymentMethod: PaymentMethod; orders: number; revenue: number }>;
    obtainingMethod: Array<{ obtainingMethod: ObtainingMethod; orders: number; revenue: number }>;
  };
  productOptions: Array<{
    id: number;
    name: string;
    article: string;
    categoryId: number;
  }>;
  categoryOptions: Category[];
};

export type ProductAnalyticsItem = {
  productId: number;
  name: string;
  article: string;
  mainImage: string | null;
  categoryId: number | null;
  categoryName: string | null;
  orders: number;
  quantity: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  grossMargin: number;
  averageUnitPrice: number;
  averageOrderValue: number;
  currentStock: number;
};

export type ProductAnalyticsResponse = {
  period: {
    startDate: string;
    endDate: string;
  };
  sortBy: "revenue" | "quantity" | "orders" | "profit";
  items: ProductAnalyticsItem[];
};

export type InventoryAnalyticsResponse = {
  period: {
    startDate: string;
    endDate: string;
    granularity: "day" | "week" | "month";
  };
  movementsByPeriod: Array<{
    date: string;
    type: "RESERVE" | "RELEASE" | "ADJUSTMENT";
    quantityDelta: number;
    movements: number;
  }>;
  lowStockItems: Array<{
    productId: number;
    name: string;
    article: string;
    mainImage: string;
    category: Category;
    quantity: number;
    updatedAt: string;
  }>;
};

export type CategoryAnalyticsResponse = {
  period: {
    startDate: string;
    endDate: string;
  };
  items: Array<{
    categoryId: number | null;
    categoryName: string;
    products: number;
    orders: number;
    quantity: number;
    revenue: number;
    cost: number;
    grossProfit: number;
    grossMargin: number;
  }>;
};

export type DashboardStatsResponse = {
  stats: DashboardStats;
  recentOrders: OrderListItem[];
  analytics: {
    period: {
      startDate: string;
      endDate: string;
      days: number;
    };
    selectedProductId: number | null;
    totals: {
      quantity: number;
      orders: number;
      revenue: number;
      averageOrderValue: number;
    };
    salesByDay: Array<{
      date: string;
      label: string;
      quantity: number;
      orders: number;
      revenue: number;
    }>;
    productSales: Array<{
      productId: number;
      name: string;
      article: string;
      mainImage: string;
      quantity: number;
      revenue: number;
      orders: number;
    }>;
    productOptions: Array<{
      id: number;
      name: string;
      article: string;
    }>;
  };
};
