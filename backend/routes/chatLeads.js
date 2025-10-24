const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { query } = require('../config/database');
const router = express.Router();

// Get all chat leads (Admin only)
router.get('/', authenticateToken, requireRole(['super_admin', 'admin', 'manager', 'support']), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM chat_leads ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chat leads:', error);
    res.status(500).json({ error: 'Failed to fetch chat leads' });
  }
});

// Get chat lead by ID (Admin only)
router.get('/:id', authenticateToken, requireRole(['super_admin', 'admin', 'manager', 'support']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM chat_leads WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching chat lead:', error);
    res.status(500).json({ error: 'Failed to fetch chat lead' });
  }
});

// Update chat lead status (Admin only)
router.patch('/:id/status', authenticateToken, requireRole(['super_admin', 'admin', 'manager', 'support']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status || !['new', 'contacted', 'qualified', 'converted', 'lost'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      'UPDATE chat_leads SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating chat lead:', error);
    res.status(500).json({ error: 'Failed to update chat lead' });
  }
});

// Delete chat lead (Admin only)
router.delete('/:id', authenticateToken, requireRole(['super_admin', 'admin', 'manager', 'support']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM chat_leads WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat lead not found' });
    }

    res.status(200).json({ message: 'Chat lead deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting chat lead:', error);
    res.status(500).json({ error: 'Failed to delete chat lead' });
  }
});

// Get chat lead metrics (Admin only)
router.get('/stats/metrics', authenticateToken, requireRole(['super_admin', 'admin', 'manager', 'support']), async (req, res) => {
  try {
    const totalResult = await query('SELECT COUNT(*) as count FROM chat_leads');
    const newResult = await query('SELECT COUNT(*) as count FROM chat_leads WHERE status = $1', ['new']);
    const contactedResult = await query('SELECT COUNT(*) as count FROM chat_leads WHERE status = $1', ['contacted']);
    const qualifiedResult = await query('SELECT COUNT(*) as count FROM chat_leads WHERE status = $1', ['qualified']);
    const convertedResult = await query('SELECT COUNT(*) as count FROM chat_leads WHERE status = $1', ['converted']);
    const lostResult = await query('SELECT COUNT(*) as count FROM chat_leads WHERE status = $1', ['lost']);

    const metrics = {
      totalLeads: parseInt(totalResult.rows[0].count),
      newLeads: parseInt(newResult.rows[0].count),
      contactedLeads: parseInt(contactedResult.rows[0].count),
      qualifiedLeads: parseInt(qualifiedResult.rows[0].count),
      convertedLeads: parseInt(convertedResult.rows[0].count),
      lostLeads: parseInt(lostResult.rows[0].count),
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching chat lead metrics:', error);
    res.status(500).json({ error: 'Failed to fetch chat lead metrics' });
  }
});

module.exports = router;
