import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { _id: false });

const TaskSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, required: true },
  title: { type: String, required: true },
  desc: { type: String },
  status: { type: String, default: 'todo' },
  priority: { type: String, default: 'medium' },
  assignee: { type: String },
  dueDate: { type: String },
  tags: { type: [String], default: [] },
  timeLogged: { type: Number, default: 0 },
  comments: { type: [CommentSchema], default: [] }
}, { _id: false });

TaskSchema.virtual('id').get(function() {
  return this._id;
});

TaskSchema.set('toJSON', { virtuals: true });
TaskSchema.set('toObject', { virtuals: true });

export default mongoose.model('Task', TaskSchema);
