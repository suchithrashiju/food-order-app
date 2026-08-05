import mongoose, { type Document, type Model, Schema } from 'mongoose';

export interface ISystemConfigBase {
  key: string;
  value: string;
  description?: string;
}

export interface ISystemConfig extends Document, ISystemConfigBase {
  createdAt: Date;
  updatedAt: Date;
}

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    key: { type: String, required: true, trim: true, unique: true },
    value: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

export const SystemConfig: Model<ISystemConfig> = mongoose.model<ISystemConfig>('SystemConfig', systemConfigSchema);
