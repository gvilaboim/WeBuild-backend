const express = require('express')
const { isAuthenticated } = require('../middleware/jwt.middleware')
const Component = require('../models/Component')
const router = express.Router()

router.get('/', isAuthenticated, (req, res, next) => {
  res.json('All good in here')
})

router.get('/canvas-store', isAuthenticated, async (req, res, next) => {
  const foundComponents = await Component.find()
  res.json(foundComponents)
})

module.exports = router
