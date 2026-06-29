import express from 'express';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Role from '../models/Role.js';
import { Log, Appointment, Notification, Mood } from '../models/Misc.js';

const router = express.Router();

// Fetch all data for the frontend
router.get('/data', async (req, res) => {
  try {
    const [members, projects, tasks, roles, logs, appointments, notifications, moods] = await Promise.all([
      User.find({}, '-password'),
      Project.find(),
      Task.find(),
      Role.find(),
      Log.find().sort({ timestamp: -1 }).limit(200),
      Appointment.find(),
      Notification.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(100),
      Mood.find()
    ]);

    // Format moods correctly for frontend: { date: { userId: score } }
    const moodsMap = {};
    moods.forEach(m => {
      if (!moodsMap[m.date]) moodsMap[m.date] = {};
      moodsMap[m.date][m.userId] = m.score;
    });

    res.json({
      members, projects, tasks, roles, logs, appointments, notifications, moods: moodsMap
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generic generic handlers for brevity in this migration
const createHandler = (Model) => async (req, res) => {
  try {
    const doc = new Model({ _id: req.body.id || req.body._id || `${Model.modelName.toLowerCase()}_${Date.now()}`, ...req.body });
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateHandler = (Model) => async (req, res) => {
  try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteHandler = (Model) => async (req, res) => {
  try {
    await Model.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Projects
router.post('/projects', createHandler(Project));
router.put('/projects/:id', updateHandler(Project));
router.delete('/projects/:id', deleteHandler(Project));

// Tasks
router.post('/tasks', createHandler(Task));
router.put('/tasks/:id', updateHandler(Task));
router.delete('/tasks/:id', deleteHandler(Task));

// Users
router.put('/members/:id', updateHandler(User));

// Misc
router.post('/logs', createHandler(Log));
router.post('/appointments', createHandler(Appointment));
router.post('/roles', createHandler(Role));
router.put('/roles/:id', updateHandler(Role));
router.delete('/roles/:id', deleteHandler(Role));

export default router;
