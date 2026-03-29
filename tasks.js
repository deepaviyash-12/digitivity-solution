const router = require('express').Router();
const {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require('./taskController');
const { authenticate } = require('./auth');
const {
  createTaskRules,
  updateTaskRules,
  paginationRules,
  validate,
} = require('./validation');

// All task routes require authentication
router.use(authenticate);

// GET    /api/tasks          — list with pagination & filter
router.get('/',    paginationRules, validate, getAllTasks);

// GET    /api/tasks/:id      — single task
router.get('/:id', getTask);

// POST   /api/tasks          — create task
router.post('/',   createTaskRules, validate, createTask);

// PATCH  /api/tasks/:id      — update task (partial)
router.patch('/:id', updateTaskRules, validate, updateTask);

// DELETE /api/tasks/:id      — delete task
router.delete('/:id', deleteTask);

module.exports = router;
