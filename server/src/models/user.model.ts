import mongoose, { type Document, type Model, Schema } from 'mongoose';

export interface IUserBase {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'customer';
  isActive: boolean;
}

export interface IUser extends Document, IUserBase {
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
