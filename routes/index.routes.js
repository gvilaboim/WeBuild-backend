const express = require('express')
const { isAuthenticated } = require('../middleware/jwt.middleware')
const Component = require('../models/Component.model')
const DefaultComponent = require('../models/DefaultComponent.model')
const Plans = require('../models/Plans.model')
const Website = require('../models/Website.model')
const Section = require('../models/Section.model')
const { default: mongoose } = require('mongoose')

const router = express.Router()

const app = express();
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

    const newWebsite = new Website({ user, name, category })

    // by default 3 empty sections are created
    const sections = []
    for (let i = 0; i < 3; i++) {
      const section = new Section({
        name: `Section ${i + 1}`,
        renderOrder: i,
        subsections: [
          {
            name: `Subsection ${1}`,
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
      subsectionId,
    },
  } = req.body

  const { id } = req.params

  try {
    // Handles Subsections Increase or Decrease (later)
    if (subsectionsIncrease && !draggedComponent) {
      //find the website to update
      const website = await Website.findById(id)

      // Find the Section object within the sections array
      const section = website.sections[sectionIndex]
      // Check how many Subsection objects are currently in the subsections array
      const numSubsections = section.subsections.length

      // Add a new Subsection object to the subsections array
      for (let i = 0; i < subsectionsIncrease; i++) {
        const newSubsection = {
          name: `Subsection ${numSubsections + i + 1}`,
          renderOrder: numSubsections + i,
          components: [],
        }
        section.subsections.push(newSubsection)
        section.numberOfColumns++
      }

      // Save the updated Website document to the database
      const updatedWebsite = await website.save() 
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
          $push: { navbar: savedComponent._id },
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
    if (draggedComponent && draggedComponent.type === 'footer') {
      // create a new component object from the draggedComponent data
      const newComponent = new Component({
        draggedComponent,
      })

      // save the new component object to the database
      const savedComponent = await newComponent.save()

      // add the component's _id to the navbar array of the website
      const updatedWebsite = await Website.findByIdAndUpdate(
        id,
        {
          $push: { footer: savedComponent._id },
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
    if (draggedComponent && draggedComponent.type === 'body') {
      // create a new component object from the draggedComponent data
      const newComponent = await Component.create(draggedComponent)
      console.log(newComponent)

      // save the new component object to the database
      // const newComponentId = Component.findById(draggedComponent._id)

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
      console.log(
        newComponent._id,
        updatedWebsite.sections[sectionIndex].subsections[subsectionIndex]
          .components
      )
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
        const deletedSubWebsite = await Website.findByIdAndUpdate(
          id,
          { $pull: { 'sections.$[].subsections': { _id: subsectionId } } },
          { new: true }
        )
        const section = await Section.findById(sectionId)

        if (section) {
          const numColumns = section.subsections.length
          const updatedWebsite = await Website.findOneAndUpdate(
            { _id: id, 'sections._id': sectionId },
            { $set: { 'sections.$.numberOfColumns': numColumns } },
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

          console.log(
            `Updated section ${sectionId} with ${numColumns} columns`,
            updatedWebsite
          )

          res.status(200).json(updatedWebsite)
        }
      }
    } catch (error) {
      console.log(error)
      res.status(500).send('Internal server error')
    }
  }
)

//COMPONENT EDIT


//COMPONENT EDIT
router.put('/websites/components/edit/', isAuthenticated, async (req, res, next) => {

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
    style: componentData.style
  }).then(response => {
    res.status(200).json(response)
  }).catch(error => {
    console.error(error)
    res.status(500).json({ error: 'Failed to update component' })
  })

})



router.get('/plans/all/', isAuthenticated, async (req, res, next) => {
  const foundPlans = await Plans.find()
  console.log("here")
  res.status(200).json(foundPlans)
})

router.get('/plans/:id', isAuthenticated, async (req, res, next) => {
  const { id } = req.params

  const foundPlans = await Plans.findById(id);
    console.log("here")
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
    cancel_url: 'http://localhost:4242/cancel',   // http://localhost:4242/cancel
  });

  res.redirect(303, session.url);
});


module.exports = router
