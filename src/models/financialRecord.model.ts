import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type FinancialType = "income" | "expense";

export interface IFinancialRecord extends Document {
  amount: number;
  type: FinancialType;
  category: string;
  date: Date;
  notes?: string;
  userId: Types.ObjectId;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const financialRecordSchema = new Schema<IFinancialRecord>(
  {
    amount: { type: Number, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    notes: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

financialRecordSchema.index({ date: 1 });
financialRecordSchema.index({ category: 1 });
financialRecordSchema.index({ type: 1 });
financialRecordSchema.index({ userId: 1 });

export const FinancialRecord: Model<IFinancialRecord> = mongoose.model<IFinancialRecord>(
  "FinancialRecord",
  financialRecordSchema
);
