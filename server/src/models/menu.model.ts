import mongoose, { type Document, type Model, Schema } from 'mongoose';

export interface IMenuItemBase {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface IMenuItem extends Document, IMenuItemBase {
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true },
    isAvailable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

export const MenuItem: Model<IMenuItem> = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
