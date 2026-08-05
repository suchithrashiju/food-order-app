import mongoose, { type Document, type Model, Schema } from 'mongoose';

export const ORDER_STATUSES = [
  'Order Received',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Normal delivery flow — excludes Cancelled */
export const ORDER_PROGRESS_STATUSES = [
  'Order Received',
  'Preparing',
  'Out for Delivery',
  'Delivered',
] as const;

export interface IOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface IDeliveryDetails {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  email?: string;
  notes?: string;
}

export interface IStatusHistoryEntry {
  status: OrderStatus;
  remarks?: string;
  updatedBy: string;
  updatedAt: Date;
}

export interface IOrderBase {
  orderReference: string;
  items: IOrderItem[];
  delivery: IDeliveryDetails;
  status: OrderStatus;
  statusHistory: IStatusHistoryEntry[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  estimatedDeliveryMinutes: number;
}

export interface IOrder extends Document, IOrderBase {
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const deliverySchema = new Schema<IDeliveryDetails>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    remarks: { type: String, trim: true, maxlength: 500 },
    updatedBy: { type: String, required: true, trim: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderReference: { type: String, required: true, unique: true, trim: true, uppercase: true },
    items: { type: [orderItemSchema], required: true },
    delivery: { type: deliverySchema, required: true },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Order Received',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    estimatedDeliveryMinutes: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderReference: 1 });

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
