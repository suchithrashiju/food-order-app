import mongoose, { type Document, type Model, Schema } from 'mongoose';

export interface IMenuItemBase {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  isDeleted?: boolean;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
}

export interface IMenuItem extends Document, IMenuItemBase {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true },
    isAvailable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    deletedBy: { type: String, trim: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

menuItemSchema.index({ isDeleted: 1, category: 1, name: 1 });

export const MenuItem: Model<IMenuItem> = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
