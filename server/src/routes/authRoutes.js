const express = require('express');
const router = express.Router();

const { login, adminCreateUser } = require('../controllers/authController');
const { protect, requireAdmin } = require('../middleware/auth');


router.post('/login', login);
router.post('/admin/create-user', protect, requireAdmin, adminCreateUser);

router.get("/validate", protect, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      role: req.user.role,
    },
  });
});


module.exports = router;