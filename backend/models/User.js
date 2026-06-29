import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Keep string IDs like 'u1' to match frontend
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  name: { type: String, required: true },
  initials: { type: String },
  color: { type: String, default: '#7c3aed' },
  role: { type: String, default: 'Junior Developer' },
  mood: { type: [Number], default: [3, 3, 3, 3, 3] },
  taskCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false }); // We explicitly define _id

// Virtual for 'id' to map to _id for frontend compatibility
UserSchema.virtual('id').get(function() {
  return this._id;
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', UserSchema);
