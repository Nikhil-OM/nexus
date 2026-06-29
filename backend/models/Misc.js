import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: String, required: true }
}, { _id: false });
LogSchema.virtual('id').get(function() { return this._id; });
LogSchema.set('toJSON', { virtuals: true });
LogSchema.set('toObject', { virtuals: true });

const AppointmentSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String },
  date: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  participants: { type: [String] },
  creator: { type: String }
}, { _id: false });
AppointmentSchema.virtual('id').get(function() { return this._id; });
AppointmentSchema.set('toJSON', { virtuals: true });
AppointmentSchema.set('toObject', { virtuals: true });

const NotificationSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  text: { type: String },
  type: { type: String },
  relatedId: { type: String },
  read: { type: Boolean, default: false },
  timestamp: { type: String, required: true }
}, { _id: false });
NotificationSchema.virtual('id').get(function() { return this._id; });
NotificationSchema.set('toJSON', { virtuals: true });
NotificationSchema.set('toObject', { virtuals: true });

const MoodSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "2026-06-29_u1"
  date: { type: String, required: true },
  userId: { type: String, required: true },
  score: { type: Number, required: true }
}, { _id: false });

export const Log = mongoose.model('Log', LogSchema);
export const Appointment = mongoose.model('Appointment', AppointmentSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);
export const Mood = mongoose.model('Mood', MoodSchema);
