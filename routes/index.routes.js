const express = require('express')
const { isAuthenticated } = require('../middleware/jwt.middleware')
const Component = require('../models/Component.model')
const DefaultComponent = require('../models/DefaultComponent.model')
const Plans = require('../models/Plans.model')
const Website = require('../models/Website.model')
const Section = require('../models/Section.model')
const { default: mongoose } = require('mongoose')

const router = express.Router()

const app = express()
const stripe = require('stripe')('sk_test_QUXcoU3BnbZXp6IMVi7BkW8s')

router.get('/', isAuthenticated, (req, res, next) => {
  res.json('All good in here')
})

router.get('/canvas-store', isAuthenticated, async (req, res, next) => {
  const foundComponents = await DefaultComponent.find()
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

    // by default 3 empty sections are created
    const sections = []
    for (let i = 0; i < 3; i++) {
      const section = await Section.create({
        renderOrder: i,
        subsections: [
          {
            components: [],
          },
        ],
      })
      sections.push(section)
    }
    const newWebsite = await Website.create({ user, name, category, sections })

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
      .populate({
        path: 'sections',
        populate: {
          path: 'subsections',
          populate: {
            path: 'components',
            model: 'Component',
          },
        },
      })
      .then((foundWebsite) => {
        res.status(200).json(foundWebsite)
      })
      .catch((err) => console.log(err))
  } else {
    console.log('id is undefined')
  }
})

router.put('/websites/:id', isAuthenticated, async (req, res, next) => {
  const {
    siteData: {
      droppedComponent,
      sectionIndex,
      subsectionIndex,
      subsectionsIncrease,
    },
  } = req.body

  const { id } = req.params

  try {
    // Handles Subsections Increase or Decrease (later)
    if (subsectionsIncrease && !droppedComponent) {
      //find the website to update
      const website = await Website.findById(id)
        .populate('footer')
        .populate('navbar')
        .populate({
          path: 'sections',
          populate: {
            path: 'subsections',
            populate: {
              path: 'components',
              model: 'Component',
            },
          },
        })

      // Find the Section object within the sections array
      const section = website.sections[sectionIndex]
      // Check how many Subsection objects are currently in the subsections array
      const numSubsections = section.subsections.length

      // Add a new Subsection object to the subsections array
      for (let i = 0; i < subsectionsIncrease; i++) {
        const newSubsection = {
          renderOrder: numSubsections + i,
          components: [],
        }
        section.subsections.push(newSubsection)
      }

      // Save the updated Website document to the database
      const updatedWebsite = await website.save()
      res.status(200).json(updatedWebsite)
    }

    //Handles Dropped items updates
    if (droppedComponent && droppedComponent.type === 'navbar') {
      // create a new component object from the droppedComponent data
      const newComponent = await Component.create(droppedComponent)

      // add to the navbar array of the website
      const updatedWebsite = await Website.findByIdAndUpdate(
        id,
        {
          $push: { navbar: newComponent._id },
        },
        { new: true }
      )
        .populate('navbar')
        .populate('footer')
        .populate({
          path: 'sections',
          populate: {
            path: 'subsections',
            populate: {
              path: 'components',
              model: 'Component',
            },
          },
        })
      res.status(200).json(updatedWebsite)
    }
    if (droppedComponent && droppedComponent.type === 'footer') {
      // create a new component object from the droppedComponent data
      const newComponent = await Component.create(droppedComponent)

      // add the component's _id to the navbar array of the website
      const updatedWebsite = await Website.findByIdAndUpdate(
        id,
        {
          $push: { footer: newComponent._id },
        },
        { new: true }
      )
        .populate('navbar')
        .populate('footer')
        .populate({
          path: 'sections',
          populate: {
            path: 'subsections',
            populate: {
              path: 'components',
              model: 'Component',
            },
          },
        })
      res.status(200).json(updatedWebsite)
    }

    if (droppedComponent && droppedComponent.type === 'body') {
      // create a new component object from the droppedComponent data
      const newComponent = await Component.create(droppedComponent)

      const updatedWebsite = await Website.findByIdAndUpdate(
        id,
        {
          $push: {
            [`sections.${sectionIndex}.subsections.${subsectionIndex}.components`]:
              newComponent._id,
          },
        },
        { new: true }
      )
        .populate('navbar')
        .populate('footer')
        .populate({
          path: 'sections',
          populate: {
            path: 'subsections',
            populate: {
              path: 'components',
              model: 'Component',
            },
          },
        })

      res.status(200).json(updatedWebsite)
    }
  } catch (error) {
    console.log(error)
    res.status(500).send('Internal server error')
  }
})

router.put(
  '/websites/:id/delete-subsection',
  isAuthenticated,
  async (req, res, next) => {
    const { subsectionId, sectionId } = req.body
    const { id } = req.params

    try {
      // Delete a subsection
      if (subsectionId) {
        const updatedWebsite = await Website.findByIdAndUpdate(
          id,
          {
            $pull: { 'sections.$[section].subsections': { _id: subsectionId } },
          },
          { new: true, arrayFilters: [{ 'section._id': sectionId }] }
        )
          .populate('navbar')
          .populate('footer')
          .populate({
            path: 'sections',
            populate: {
              path: 'subsections',
              populate: {
                path: 'components',
                model: 'Component',
              },
            },
          })

        res.status(200).json(updatedWebsite)
      }
    } catch (error) {
      console.log(error)
      res.status(500).send('Internal server error')
    }
  }
)
router.put(
  '/websites/:id/delete-section',
  isAuthenticated,
  async (req, res, next) => {
    const { sectionId } = req.body
    const { id } = req.params

    try {
      // Delete a Section
      if (sectionId) {
        const updatedWebsite = await Website.findByIdAndUpdate(
          id,
          {
            $pull: { sections: { _id: sectionId } },
          },
          { new: true }
        )
          .populate('navbar')
          .populate('footer')
          .populate({
            path: 'sections',
            populate: {
              path: 'subsections',
              populate: {
                path: 'components',
                model: 'Component',
              },
            },
          })

        res.status(200).json(updatedWebsite)
      }
    } catch (error) {
      console.log(error)
      res.status(500).send('Internal server error')
    }
  }
)
router.put(
  '/websites/:id/add-section',
  isAuthenticated,
  async (req, res, next) => {
    const { sectionId } = req.body
    const { id } = req.params

    try {
      const website = await Website.findByIdAndUpdate(id)
        .populate('navbar')
        .populate('footer')
        .populate({
          path: 'sections',
          populate: {
            path: 'subsections',
            populate: {
              path: 'components',
              model: 'Component',
            },
          },
        })

      // find the index of the section where the button was clicked
      const sectionIndex = website.sections.findIndex(
        (section) => section._id.toString() === sectionId
      )

      // create a new Section object
      const newSubsection = { components: [] }
      const newSection = await Section.create({ subsections: newSubsection })
      console.log(newSection)

      // insert the new Section object after the clicked section
      website.sections.splice(sectionIndex + 1, 0, newSection)

      // update the renderOrder property of the affected sections
      website.sections.forEach((section, index) => {
        section.renderOrder = index
      })

      // save the updated Website document to the database
      const updatedWebsite = await website.save()

      res.status(200).json(updatedWebsite)
    } catch (error) {
      console.log(error)
      res.status(500).send('Internal server error')
    }
  }
)

//COMPONENT EDIT
router.put(
  '/websites/components/edit/',
  isAuthenticated,
  async (req, res, next) => {
    const { componentData } = req.body
    console.log(componentData._id)

    console.log(componentData)
    Component.findByIdAndUpdate(componentData._id, {
      type: componentData.type,
      navLinks: componentData.navLinks,
      name: componentData.name,
      category: componentData.category,
      layout: componentData.layout,
      bgColor: componentData.bgColor,
      text: componentData.text,
      border: componentData.border,
      padding: componentData.padding,
      style: componentData.style,
    })
      .then((response) => {
        res.status(200).json(response)
      })
      .catch((error) => {
        console.error(error)
        res.status(500).json({ error: 'Failed to update component' })
      })
  }
)

router.get('/plans/all/', isAuthenticated, async (req, res, next) => {
  const foundPlans = await Plans.find()
  console.log('here')
  res.status(200).json(foundPlans)
})

router.get('/plans/:id', isAuthenticated, async (req, res, next) => {
  const { id } = req.params

  const foundPlans = await Plans.findById(id)
  console.log('here')
  res.status(200).json(foundPlans)
})

router.post('/create-checkout-session', isAuthenticated, async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'T-shirt',
          },
          unit_amount: 2000,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: 'http://localhost:3000/', //  http://localhost:4242/success
    cancel_url: 'http://localhost:4242/cancel', // http://localhost:4242/cancel
  })

  res.redirect(303, session.url)
})

module.exports = router
