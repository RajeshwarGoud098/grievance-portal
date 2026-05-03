const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/departments - public (for complaint form dropdown)
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().populate('manager', 'name email');
    res.json({ success: true, departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/departments - admin only
router.post('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, department: dept });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/departments/:id - admin only
router.put('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found.' });
    res.json({ success: true, department: dept });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/departments/:id - admin only
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Department deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
