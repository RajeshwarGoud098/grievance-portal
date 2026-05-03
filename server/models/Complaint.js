/**
 * Complaint Model — Fully upgraded
 *
 * Fixes:
 * - Issue #2:  Sequential GRV-YYYY-NNNNN ticket IDs via atomic Counter
 * - Issue #4:  Status transition machine (state machine)
 * - Issue #13: Soft delete (isDeleted flag)
 * - Issue #17: SLA / due date tracking
 * - Issue #18: Full-text search index on title + description
 * - Problem #4: Valid status transitions enforced at model level
 * - Problem #1: Status history tracks who+when for every change
 */
const mongoose = require('mongoose');
const Counter = require('./Counter');

/* ------------------------------------------------------------------ */
/*  Status transition machine                                           */
/*  Prevents invalid transitions like Resolved → Under Review          */
/* ------------------------------------------------------------------ */
const VALID_TRANSITIONS = {
  'Received':     ['Under Review', 'Rejected'],
  'Under Review': ['Resolved', 'Rejected'],
  'Resolved':     [],   // Terminal state
  'Rejected':     [],   // Terminal state
};

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Received', 'Under Review', 'Resolved', 'Rejected'],
      required: true,
    },
    note: { type: String, default: '' },
    action: {
      type: String,
      enum: ['status_change', 'reassigned', 'created'],
      default: 'status_change',
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const complaintSchema = new mongoose.Schema(
  {
    /* ---------- Ticket ID ---------- */
    ticketId: {
      type: String,
      unique: true,
      // Generated atomically in pre-save hook
    },

    /* ---------- Core fields ---------- */
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      minlength: [5, 'Title must be at least 5 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
    },

    /* ---------- Department & Routing ---------- */
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    // History of department reassignments (Problem #3)
    departmentHistory: [
      {
        department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
        reason: { type: String, default: '' },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    /* ---------- Submitter ---------- */
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /* ---------- Evidence ---------- */
    imageUrl: { type: String, default: '' },

    /* ---------- Status (State Machine) ---------- */
    status: {
      type: String,
      enum: ['Received', 'Under Review', 'Resolved', 'Rejected'],
      default: 'Received',
    },
    statusHistory: [statusHistorySchema],

    /* ---------- Priority & SLA (Issue #17) ---------- */
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    dueDate: {
      type: Date,
      // SLA: Low=14d, Medium=7d, High=2d
    },
    isOverdue: { type: Boolean, default: false },

    /* ---------- Resolution ---------- */
    resolutionNote: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },

    /* ---------- Soft Delete (Issue #13) ---------- */
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------------ */
/*  Full-text search index (Issue #18)                                  */
/* ------------------------------------------------------------------ */
complaintSchema.index({ title: 'text', description: 'text', ticketId: 'text' });

/* ------------------------------------------------------------------ */
/*  Pre-save hooks                                                      */
/* ------------------------------------------------------------------ */
complaintSchema.pre('save', async function () {
  // Generate sequential ticket ID on first save
  if (this.isNew && !this.ticketId) {
    const year = new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
      { name: 'complaint', year },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.ticketId = `GRV-${year}-${String(counter.seq).padStart(5, '0')}`;
  }

  // Set SLA due date on creation
  if (this.isNew && !this.dueDate) {
    const slaMap = { High: 2, Medium: 7, Low: 14 };
    const days = slaMap[this.priority] || 7;
    const due = new Date();
    due.setDate(due.getDate() + days);
    this.dueDate = due;
  }

  // Track resolution timestamp
  if (this.isModified('status') && this.status === 'Resolved') {
    this.resolvedAt = new Date();
  }

  // Check if overdue
  if (this.dueDate && this.status !== 'Resolved' && this.status !== 'Rejected') {
    this.isOverdue = new Date() > this.dueDate;
  }

  // Remove next() for Mongoose 9
});

/* ------------------------------------------------------------------ */
/*  Static: Validate status transition (Problem #4)                    */
/* ------------------------------------------------------------------ */
complaintSchema.statics.validateTransition = function (from, to) {
  const allowed = VALID_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    const err = new Error(
      allowed.length
        ? `Invalid transition: '${from}' → '${to}'. Allowed next: ${allowed.join(', ')}`
        : `'${from}' is a terminal state. No further transitions allowed.`
    );
    err.statusCode = 400;
    throw err;
  }
  return true;
};

complaintSchema.statics.VALID_TRANSITIONS = VALID_TRANSITIONS;

module.exports = mongoose.model('Complaint', complaintSchema);
