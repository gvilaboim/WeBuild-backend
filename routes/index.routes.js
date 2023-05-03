const express = require('express')
const { isAuthenticated } = require('../middleware/jwt.middleware')
const Component = require('../models/Component.model')
const Website = require('../models/Website.model')
const Section = require('../models/Section.model')
const { default: mongoose } = require('mongoose')

const router = express.Router()

router.get('/', isAuthenticated, (req, res, next) => {
  res.json('All good in here')
})

router.get('/canvas-store', isAuthenticated, async (req, res, next) => {
  const foundComponents = await Component.find()
  res.json(foundComponents)
})

// user creates a website from scratch
router.post('/websites/create', isAuthenticated, async (req, res, next) => {
  try {
    // data from form in the frontend
    const {
      siteData: { name, category },
    } = req.body
    const user = new mongoose.Types.ObjectId(req.payload._id)

    const newWebsite = new Website({ user, name, category })

    // by default 3 empty sections are created
    const sections = []
    for (let i = 0; i < 3; i++) {
      const section = new Section({
        name: `Section ${i + 1}`,
        renderOrder: i,
        subsections: [
          {
            components: [],
          },
        ],
        numberOfColumns: 1,
      })
      await section.save()
      sections.push(section)
    }
    newWebsite.sections = sections

    await newWebsite.save()
    console.log(newWebsite)
    res.status(201).json(newWebsite)
  } catch (error) {
    console.error(error)
    res.status(500).send('Server error')
  }
})

router.get('/websites/get-all', isAuthenticated, async (req, res, next) => {
  const foundWebsites = await Website.find()
  res.status(200).json(foundWebsites)
})

router.get('/websites/:id', isAuthenticated, async (req, res, next) => {
  const { id } = req.params
  if (id) {
    Website.findById(id)
      .populate('navbar')
      .populate('footer')
      .then((foundWebsite) => {
        res.status(200).json(foundWebsite)
      })
      .catch((err) => console.log(err))
  } else {
    console.log('id is undefined')
  }
})

router.put('/websites/', isAuthenticated, async (req, res, next) => {
  //criar put | Edit do website através do website ID

  const { siteData } = req.body
  const id = siteData.id
  let content = {
    navbar: siteData.navbarComponents,
    body: siteData.bodyComponents,
    footer: siteData.footerComponents,
  }

  const UpdatedWebsite = Website.findByIdAndUpdate(id, content, { new: true })
    .then((updatedUser) => {
      console.log(updatedUser)
    })
    .catch((error) => {
      console.log(error)
    })
})

module.exports = router
