import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide a booking date'],
    },
    seatNumber: {
      type: Number,
      required: [true, 'Please provide a seat number'],
      min: [1, 'Seat number must be between 1 and 50'],
      max: [50, 'Seat number must be between 1 and 50'],
    },
    bookingType: {
      type: String,
      enum: {
        values: ['scheduled', 'spare'],
        message: 'Booking type must be either "scheduled" or "spare"',
      },
      required: [true, 'Please provide a booking type'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'released'],
        message: 'Status must be either "active" or "released"',
      },
      default: 'active',
    },
  },
  {
    timestamps: true,
    // Create a unique compound index on seatNumber and date
    indexes: [
      {
        key: { seatNumber: 1, date: 1 },
        unique: true,
        sparse: true,
        partialFilterExpression: { status: 'active' },
      },
    ],
  }
);

// Index for querying bookings by user
bookingSchema.index({ userId: 1, date: 1 });

// Index for querying bookings by date
bookingSchema.index({ date: 1 });

export default mongoose.model('Booking', bookingSchema);
