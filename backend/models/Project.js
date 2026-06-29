import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  emoji: { type: String, default: '🚀' },
  color: { type: String, default: '#7c3aed' },
  desc: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  members: { type: [String], default: [] }
}, { _id: false });

ProjectSchema.virtual('id').get(function() {
  return this._id;
});

ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });

export default mongoose.model('Project', ProjectSchema);
