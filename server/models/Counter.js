/**
 * Counter Model — Atomic sequential ticket ID generation
 * Solves: Unique ticket IDs under high traffic (Issue #2)
 * Format: GRV-2026-00001
 */
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  seq:  { type: Number, default: 0 },
});

// Compound unique index — one counter per name+year
counterSchema.index({ name: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
