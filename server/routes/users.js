const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');
const { validate, createManagerRules } = require('../middleware/validate');

// GET /api/users — admin only
router.get('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const users = await User.find().populate('department', 'name icon').select('-password');
    res.json({ success: true, users });
  } catch (err) { next(err); }
});

// POST /api/users/create-manager
router.post('/create-manager', protect, restrictTo('admin'), validate(createManagerRules), async (req, res, next) => {
  try {
    const { name, email, password, departmentId, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const manager = await User.create({ name, email, password, phone, role: 'manager', department: departmentId });
    res.status(201).json({ success: true, user: manager });
  } catch (err) { next(err); }
});

// PUT /api/users/:id — admin update user
router.put('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { name, email, role, department, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, phone },
      { new: true, runValidators: true }
    ).populate('department', 'name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id — soft-style: admin only, prevent self-delete
router.delete('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
