import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  authority: { type: Number, required: true }
}, { _id: false });

RoleSchema.virtual('id').get(function() { return this._id; });
RoleSchema.set('toJSON', { virtuals: true });
RoleSchema.set('toObject', { virtuals: true });

export default mongoose.model('Role', RoleSchema);
