const { v4: uuidv4 } = require('uuid');
const db = require('./database');

// ─── GET /tasks ───────────────────────────────────────────────────────────────

const getAllTasks = (req, res, next) => {
  try {
    const userId = req.user.id;
    const page   = Math.max(parseInt(req.query.page  || '1',  10), 1);
    const limit  = Math.min(parseInt(req.query.limit || '10', 10), 100);
    const offset = (page - 1) * limit;
    const status = req.query.status || null;

    // Build dynamic WHERE clause
    let where = 'WHERE user_id = ?';
    const params = [userId];

    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    const total = db
      .prepare(`SELECT COUNT(*) AS cnt FROM tasks ${where}`)
      .get(...params).cnt;

    const tasks = db
      .prepare(
        `SELECT id, title, description, status, created_at, updated_at
         FROM tasks ${where}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /tasks/:id ───────────────────────────────────────────────────────────

const getTask = (req, res, next) => {
  try {
    const task = db
      .prepare(
        `SELECT id, title, description, status, created_at, updated_at
         FROM tasks WHERE id = ? AND user_id = ?`
      )
      .get(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
};

// ─── POST /tasks ──────────────────────────────────────────────────────────────

const createTask = (req, res, next) => {
  try {
    const { title, description = null, status = 'pending' } = req.body;
    const id = uuidv4();
    const userId = req.user.id;

    db.prepare(
      `INSERT INTO tasks (id, user_id, title, description, status)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, userId, title.trim(), description?.trim() ?? null, status);

    const task = db
      .prepare(
        `SELECT id, title, description, status, created_at, updated_at
         FROM tasks WHERE id = ?`
      )
      .get(id);

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /tasks/:id ─────────────────────────────────────────────────────────

const updateTask = (req, res, next) => {
  try {
    const existing = db
      .prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { title, description, status } = req.body;

    // Build dynamic SET clause — only update provided fields
    const sets = [];
    const params = [];

    if (title !== undefined)       { sets.push('title = ?');       params.push(title.trim()); }
    if (description !== undefined) { sets.push('description = ?'); params.push(description?.trim() ?? null); }
    if (status !== undefined)      { sets.push('status = ?');      params.push(status); }

    if (sets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updatable fields provided.',
      });
    }

    sets.push("updated_at = datetime('now')");
    params.push(req.params.id, req.user.id);

    db.prepare(
      `UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`
    ).run(...params);

    const task = db
      .prepare(
        `SELECT id, title, description, status, created_at, updated_at
         FROM tasks WHERE id = ?`
      )
      .get(req.params.id);

    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: { task },
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /tasks/:id ────────────────────────────────────────────────────────

const deleteTask = (req, res, next) => {
  try {
    const result = db
      .prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllTasks, getTask, createTask, updateTask, deleteTask };
