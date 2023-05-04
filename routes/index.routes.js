const express = require('express')
const { isAuthenticated } = require('../middleware/jwt.middleware')
const Component = require('../models/Component.model')
const DefaultComponent = require('../models/DefaultComponent.model')

const Website = require('../models/Website.model')
const Section = require('../models/Section.model')
const { default: mongoose } = require('mongoose')

const router = express.Router()

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
      draggedComponent,
      sectionIndex,
      subsectionIndex,
      subsectionsIncrease,
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
      res.status(200).json(updatedWebsite)
    }

    //Handles Dropped items updates
    if (draggedComponent && draggedComponent.type === 'navbar') {
      // create a new component object from the draggedComponent data
      const newComponent = new Component(draggedComponent)

      // save the new component object to the database
      const savedComponent = await newComponent.save()

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


module.exports = router
