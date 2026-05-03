/**
 * Complaint Routes — Fully upgraded
 *
 * Fixes:
 * - Issue #1:  Input validation on all routes
 * - Issue #6:  Server-side filtering (not client-side)
 * - Issue #7:  Pagination on all list endpoints
 * - Issue #8:  Consistent error handling via next(err)
 * - Issue #11: Reassign complaint to another department
 * - Issue #13: Soft delete (isDeleted flag)
 * - Issue #17: SLA / overdue tracking
 * - Issue #18: MongoDB full-text search
 * - Problem #1: ownsComplaint authorization
 * - Problem #2: Sequential GRV-YYYY-NNNNN ticket IDs
 * - Problem #3: Department reassignment + history
 * - Problem #4: State machine transition validation
 */
const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, restrictTo, ownsComplaint } = require('../middleware/auth');
const { validate, complaintRules, statusUpdateRules, reassignRules } = require('../middleware/validate');

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
const buildFilter = (req) => {
  const filter = { isDeleted: false };

  // Managers only see their department's complaints
  if (req.user?.role === 'manager') {
    filter.department = req.user.department?._id || req.user.department;
  }

  if (req.query.status)     filter.status = req.query.status;
  if (req.query.priority)   filter.priority = req.query.priority;
  if (req.query.department && req.user?.role === 'admin') filter.department = req.query.department;
  if (req.query.overdue === 'true') filter.isOverdue = true;

  // Full-text search (Issue #18)
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  return filter;
};

const getPagination = (req) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

const populateComplaint = (query) =>
  query
    .populate('department', 'name icon')
    .populate('submittedBy', 'name email phone')
    .populate('statusHistory.updatedBy', 'name role')
    .populate('departmentHistory.department', 'name icon')
    .populate('departmentHistory.changedBy', 'name role');

/* ================================================================== */
/*  PUBLIC                                                              */
/* ================================================================== */

/**
 * GET /api/complaints/track/:ticketId
 * Public ticket status lookup — limited fields exposed
 */
router.get('/track/:ticketId', async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({
      ticketId: req.params.ticketId.toUpperCase(),
      isDeleted: false,
    })
      .populate('department', 'name icon')
      .populate('statusHistory.updatedBy', 'name role')
      .select('-submittedBy -departmentHistory'); // Don't expose private user info publicly

    if (!complaint) {
      return res.status(404).json({ success: false, message: `Ticket '${req.params.ticketId}' not found.` });
    }
    res.json({ success: true, complaint });
  } catch (err) { next(err); }
});

/* ================================================================== */
/*  USER                                                                */
/* ================================================================== */

/**
 * POST /api/complaints
 * Submit a new complaint — users only
 */
router.post('/', protect, restrictTo('user'), validate(complaintRules), async (req, res, next) => {
  try {
    const { title, description, department, imageUrl, priority } = req.body;

    const complaint = await Complaint.create({
      title,
      description,
      department,
      imageUrl: imageUrl || '',
      priority: priority || 'Medium',
      submittedBy: req.user._id,
      statusHistory: [{
        status: 'Received',
        note: 'Complaint submitted successfully.',
        action: 'created',
        updatedBy: req.user._id,
      }],
    });

    await populateComplaint(Complaint.findById(complaint._id)).then((c) => {
      res.status(201).json({ success: true, complaint: c });
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/complaints/my
 * Logged-in user's own complaints — paginated + filtered server-side
 */
router.get('/my', protect, restrictTo('user'), async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const filter = {
      submittedBy: req.user._id,
      isDeleted: false,
    };

    if (req.query.status)   filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.search)   filter.$text = { $search: req.query.search };

    const [complaints, total] = await Promise.all([
      populateComplaint(Complaint.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Complaint.countDocuments(filter),
    ]);

    res.json({
      success: true,
      complaints,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

/* ================================================================== */
/*  MANAGER / ADMIN                                                     */
/* ================================================================== */

/**
 * GET /api/complaints/stats
 * Dashboard statistics
 */
router.get('/stats', protect, restrictTo('manager', 'admin'), async (req, res, next) => {
  try {
    const base = buildFilter(req);
    const [total, received, underReview, resolved, rejected, overdue] = await Promise.all([
      Complaint.countDocuments(base),
      Complaint.countDocuments({ ...base, status: 'Received' }),
      Complaint.countDocuments({ ...base, status: 'Under Review' }),
      Complaint.countDocuments({ ...base, status: 'Resolved' }),
      Complaint.countDocuments({ ...base, status: 'Rejected' }),
      Complaint.countDocuments({ ...base, isOverdue: true }),
    ]);
    res.json({ success: true, stats: { total, received, underReview, resolved, rejected, overdue } });
  } catch (err) { next(err); }
});

/**
 * GET /api/complaints/department
 * Manager/Admin — department complaints (paginated + server-side filtered)
 */
router.get('/department', protect, restrictTo('manager', 'admin'), async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const filter = buildFilter(req);

    const [complaints, total] = await Promise.all([
      populateComplaint(Complaint.find(filter)).sort({ isOverdue: -1, createdAt: -1 }).skip(skip).limit(limit),
      Complaint.countDocuments(filter),
    ]);

    res.json({
      success: true,
      complaints,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/complaints (admin only — all complaints)
 */
router.get('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const filter = buildFilter(req);

    const [complaints, total] = await Promise.all([
      populateComplaint(Complaint.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Complaint.countDocuments(filter),
    ]);

    res.json({
      success: true,
      complaints,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

/* ================================================================== */
/*  SINGLE COMPLAINT (by ID)                                            */
/* ================================================================== */

/**
 * GET /api/complaints/:id
 * Auth required — users can only see their own
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const complaint = await populateComplaint(
      Complaint.findOne({ _id: req.params.id, isDeleted: false })
    );
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Problem #1: Prevent user from viewing others' tickets
    if (!ownsComplaint(complaint, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied. This is not your complaint.' });
    }

    res.json({ success: true, complaint });
  } catch (err) { next(err); }
});

/**
 * PUT /api/complaints/:id/status
 * Problem #4: Enforces valid state machine transitions
 * Tracks who updated + when in statusHistory
 */
router.put('/:id/status', protect, restrictTo('manager', 'admin'), validate(statusUpdateRules), async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const complaint = await Complaint.findOne({ _id: req.params.id, isDeleted: false });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Managers can only update their own department
    if (req.user.role === 'manager') {
      const deptId = complaint.department?.toString();
      const userDeptId = (req.user.department?._id || req.user.department)?.toString();
      if (deptId !== userDeptId) {
        return res.status(403).json({ success: false, message: 'Access denied. This complaint belongs to a different department.' });
      }
    }

    // Problem #4: Validate state machine transition (throws if invalid)
    Complaint.validateTransition(complaint.status, status);

    // Apply the update
    complaint.status = status;
    if (note) complaint.resolutionNote = note;

    // Track who updated + when (Problem #4 audit requirement)
    complaint.statusHistory.push({
      status,
      note: note || '',
      action: 'status_change',
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });

    await complaint.save();
    const updated = await populateComplaint(Complaint.findById(complaint._id));
    res.json({ success: true, complaint: updated });
  } catch (err) { next(err); }
});

/**
 * PUT /api/complaints/:id/reassign
 * Problem #3: Admin reassigns complaint to correct department
 */
router.put('/:id/reassign', protect, restrictTo('admin'), validate(reassignRules), async (req, res, next) => {
  try {
    const { departmentId, reason } = req.body;
    const complaint = await Complaint.findOne({ _id: req.params.id, isDeleted: false });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    if (complaint.status === 'Resolved' || complaint.status === 'Rejected') {
      return res.status(400).json({ success: false, message: 'Cannot reassign a resolved or rejected complaint.' });
    }

    // Save previous department to history
    complaint.departmentHistory.push({
      department: complaint.department,
      reason,
      changedBy: req.user._id,
      changedAt: new Date(),
    });

    // Add audit trail entry
    complaint.statusHistory.push({
      status: complaint.status,
      note: `Reassigned to new department. Reason: ${reason}`,
      action: 'reassigned',
      updatedBy: req.user._id,
    });

    complaint.department = departmentId;
    await complaint.save();

    const updated = await populateComplaint(Complaint.findById(complaint._id));
    res.json({ success: true, complaint: updated });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/complaints/:id
 * Soft delete (Issue #13) — data preserved with isDeleted flag
 */
router.delete('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Soft delete (Issue #13)
    complaint.isDeleted = true;
    complaint.deletedAt = new Date();
    complaint.deletedBy = req.user._id;
    await complaint.save();

    res.json({ success: true, message: 'Complaint soft-deleted successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;
