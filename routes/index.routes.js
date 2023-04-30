const express = require('express')
const { isAuthenticated } = require('../middleware/jwt.middleware')
const router = express.Router()

router.get('/', isAuthenticated, (req, res, next) => {
  
  res.json('All good in here')
})

module.exports = router
