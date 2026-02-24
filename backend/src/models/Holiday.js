import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Please provide a holiday date'],
      unique: true,
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for the holiday'],
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for querying holidays by date
holidaySchema.index({ date: 1 });

export default mongoose.model('Holiday', holidaySchema);
