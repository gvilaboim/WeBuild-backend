const express = require('express')
const { isAuthenticated } = require('../middleware/jwt.middleware')
const Component = require('../models/Component.model')
const DefaultComponent = require('../models/DefaultComponent.model')
const Plans = require('../models/Plans.model')
const User = require('../models/User.model')
const Section = require('../models/Section.model')
const { default: mongoose } = require('mongoose')
const { Website, Visitor } = require('../models/Website.model')

const router = express.Router()

const app = express()
const stripe = require('stripe')('sk_test_QUXcoU3BnbZXp6IMVi7BkW8s')

router.get('/', isAuthenticated, (req, res, next) => {
  res.json('All good in here')
})

router.get('/user/:id', isAuthenticated, async (req, res, next) => {
  const { id } = req.params
  const UserFounded = await User.findById(id).populate('plan')
  res.json(UserFounded)
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
    const sections = { home : [], about : [] , contacts : [] }
    for (let i = 0; i < 3; i++) {
      const section = await Section.create({
        renderOrder: i,
        subsections: [
          {
            components: [],
          },
        ],
      })
      sections.home.push(section)
    }

    for (let i = 0; i < 3; i++) {
      const section = await Section.create({
        renderOrder: i,
        subsections: [
          {
            components: [],
          },
        ],
      })
      sections.about.push(section)
    }
    for (let i = 0; i < 3; i++) {
      const section = await Section.create({
        renderOrder: i,
        subsections: [
          {
            components: [],
          },
        ],
      })
      sections.contacts.push(section)
    }

    const pages = [
      {
        menu: 'Home',
        sections: sections.home
      },
      {
        menu: 'About',
        sections:   sections.about
      },
      {
        menu: 'Contacts',
        sections: sections.contacts
      }
    ]

    const newWebsite = await Website.create({ user, name, category, pages })

    console.log(newWebsite.pages)
    
    res.status(201).json(newWebsite)
  } catch (error) {
    console.error(error)
    res.status(500).send('Server error')
  }
})

router.get('/websites/community', isAuthenticated, async (req, res, next) => {
  const foundWebsites = await Website.find({ isPublished: true }).populate(
    'user'
  )
  res.status(200).json(foundWebsites)
})

router.get('/websites/user/:id', isAuthenticated, async (req, res, next) => {
  const { id } = req.params
  const foundWebsites = await Website.find({ user: id }).populate('user')
  res.status(200).json(foundWebsites)
})

router.get('/websites/public/:username/:sitename', async (req, res, next) => {
  const { username, sitename } = req.params

  if (username && sitename) {
    try {
      //Find with username and Sitename
      const foundUser = await User.findOne({ name: username })

      const foundWebsite = await Website.findOne({
        user: foundUser._id,
        name: sitename,
      })
        .populate('navbar')
        .populate('footer')
        .populate({
          path: 'pages.sections',
          populate: {
            path: 'subsections',
            populate: {
              path: 'components',
              model: 'Component',
            },
          },
        })
      if (foundWebsite.isPublished) {
        res.status(200).json(foundWebsite)
      } else {
        res.status(500).json({ message: 'Not Found' })
      }
    } catch (error) {}
  } else {
    console.log('something goes wrong ')
  }
})

// Make the website public
router.put('/websites/publish/:id', isAuthenticated, async (req, res, next) => {
  const { id } = req.params

  try {
    const website = await Website.findByIdAndUpdate(
      id,
      {
        $set: { isPublished: true },
      },
      { new: true }
    )

    res.status(200).json(website)
  } catch (error) {
    res.status(500).json(error)
  }
})

router.get('/websites/:id', async (req, res, next) => {
  const { id } = req.params
console.log("here")
  if (id) {
    Website.findById(id)
      .populate('user')
      .populate('navbar')
      .populate('footer')
      .populate({
        path: 'pages.sections',
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

//Agora terá que vir para aqui uma sections dentro da page que tenha um nome no menu
// menu ="HOME"
//Section = secti on;
  const {
    siteData: {
      menu,
      droppedComponent,
      sectionIndex,
      subsectionIndex,
      subsectionsIncrease,
      componentToEdit,
    },
  } = req.body

  console.log("menu BACKEND m ", menu)
  
  const { id } = req.params

  try {
    // Handles Subsections Increase or Decrease
    if (subsectionsIncrease && !droppedComponent) {
      //find the website to update
      const website = await Website.findById(id)
        .populate('footer')
        .populate('navbar')
        .populate({
          path: 'pages.sections',
          populate: {
            path: 'subsections',
            populate: {
              path: 'components',
              model: 'Component',
            },
          },
        })

      // Find the Section object within the sections array
      const section = website.pages[menu].sections[sectionIndex]
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
          path: 'pages.sections',
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
          path: 'pages.sections',
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
      console.log("INSIDE BODY")
      // create a new component object from the droppedComponent data
      const newComponent = await Component.create(droppedComponent)
      console.log("NEW" , newComponent)
      const updatedWebsite = await Website.findByIdAndUpdate(
        id,
        {
          $push: {
            [`pages.${menu}.sections.${sectionIndex}.subsections.${subsectionIndex}.components`]: newComponent._id, 
          },
        },
        { new: true }
      )
        .populate('navbar')
        .populate('footer')
        .populate({
          path: 'pages.sections',
          populate: {
            path: 'subsections',
            populate: {
              path: 'components',
              model: 'Component',
            },
          },
        })
        console.log(`updatedWebsite.pages[menu] | pages[${menu}].sections.${sectionIndex}.subsections.${subsectionIndex}.components` , updatedWebsite.pages[menu])
        //Tentar Percervebrr porque o componente não está a entrar na tabela que das paginas do site

        
      res.status(200).json(updatedWebsite)
    }
    if (componentToEdit && componentToEdit.data) {
      const updatedComponent = await Component.findByIdAndUpdate(
        componentToEdit.id,
        {
          $set: {
            'items.0.content': componentToEdit.data,
          },
        },
        { new: true }
      )

      const updatedWebsite = await Website.findById(id)
        .populate('navbar')
        .populate('footer')
        .populate({
          path: 'pages.sections',
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
    const { subsectionId, sectionId, menu } = req.body;
    const { id } = req.params;

    try {
      // Delete a subsection

      const website = await Website.findById(id)
        .populate('navbar')
        .populate('footer')
        .populate({
          path: 'pages.sections',
          populate: {
            path: 'subsections',
            populate: {
              path: 'components',
              model: 'Component',
            },
          },
        });

      const sectionIndex = website.pages[menu].sections.findIndex(
        (section) => section._id.toString() === sectionId
      );

      if (subsectionId) {
        console.log("sectionIndex " , sectionIndex)
        console.log("subsectionId " , subsectionId)
        const updatedWebsite = await Website.findByIdAndUpdate(
          id,
          {
            $pull: {
              [`pages.${menu}.sections.${sectionIndex}.subsections`]: { _id: subsectionId },
            },
          },
          { new: true}
        )
          .populate('navbar')
          .populate('footer')
          .populate({
            path: 'pages.sections',
            populate: {
              path: 'subsections',
              populate: {
                path: 'components',
                model:'Component',
              },
            },
          });

        res.status(200).json(updatedWebsite);
      }
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  }
)
router.put(
  '/websites/:id/delete-section',
  isAuthenticated,
  async (req, res, next) => {
    const { sectionId, menu } = req.body;
    const { id } = req.params;

    try {
      // Delete a Section
      if (sectionId) {
        const updatedWebsite = await Website.findByIdAndUpdate(
          id,
          {
            $pull: { [`pages.${menu}.sections`]: { _id: sectionId } },
          },
          { new: true }
        )
          .populate('navbar')
          .populate('footer')
          .populate({
            path: 'pages.sections',
            populate: {
              path: 'subsections',
              populate: {
                path: 'components',
                model: 'Component',
              },
            },
          });

        res.status(200).json(updatedWebsite);
      }
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  }
);
router.put(
  '/websites/:id/add-section',
  isAuthenticated,
  async (req, res, next) => {
    const { data } = req.body
    const { id } = req.params

    try {
      const website = await Website.findByIdAndUpdate(id)
        .populate('navbar')
        .populate('footer')
        .populate({
          path: 'pages.sections',
          populate: {
            path: 'subsections',
            populate: {
              path: 'components',
              model: 'Component',
            },
          },
        })

        //            [`pages.${menu}.sections.${sectionIndex}.subsections.${subsectionIndex}.components`]: newComponent._id, 



      // find the index of the section where the button was clicked
      console.log("website =>" ,website)
      console.log("menu;" , data.menu)
      console.log("sectionId;" , data.sectionId)
      const sectionIndex = website.pages[data.menu].sections.findIndex(
        (section) => section._id.toString() === data.sectionId
      )

      // create a new Section object
      const newSubsection = { components: [] }
      const newSection = await Section.create({ subsections: newSubsection })

      // insert the new Section object after the clicked section
      website.pages[data.menu].sections.splice(sectionIndex + 1, 0, newSection)

      // update the renderOrder property of the affected sections
      website.pages[data.menu].sections.forEach((section, index) => {
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
  '/websites/:id/components/edit/',
  isAuthenticated,
  async (req, res, next) => {
    const { componentData  } = req.body
    const { id } = req.params

    try {
      let updatedComponent

      if (componentData.name === 'navbar') {
        updatedComponent = await Component.findByIdAndUpdate(
          componentData._id,
          {
            style: componentData.style,
            navLinks: componentData.navLinks,
          },
          { new: true }
        )
      } else {
        updatedComponent = await Component.findByIdAndUpdate(
          componentData._id,
          {
            style: componentData.style,
            items: componentData.items,
          },
          { new: true }
        )
      }

      const updatedWebsite = await Website.findById(id)
        .populate('navbar')
        .populate('footer')
        .populate({
          path: 'pages.sections',
          populate: {
            path: 'subsections',
            populate: {
              path: 'components',
              model: 'Component',
            },
          },
        })

      res.status(200).json({ updatedWebsite, updatedComponent })
    } catch (error) {
      console.log(error) // Add this line to log the error
      res.status(500).json({ message: error.message })
    }
  }
)

router.get('/plans/all/', isAuthenticated, async (req, res, next) => {
  const foundPlans = await Plans.find()
  res.status(200).json(foundPlans)
})

router.get('/plans/:id', isAuthenticated, async (req, res, next) => {
  const { id } = req.params

  const foundPlans = await Plans.findById(id)
  res.status(200).json(foundPlans)
})

router.post('/create-checkout-session', isAuthenticated, async (req, res) => {
  const { details } = req.body

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: details.plan.name,
          },
          unit_amount: details.plan.price,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url:
      'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'http://localhost:3000',
    metadata: {
      planId: details.plan._id,
      userId: details.userId,
    },
  })

  res.json({ url: session.url, id: session.id })
})

router.get(
  '/get-payment-details/:sessionId',
  isAuthenticated,
  async (req, res) => {
    const { sessionId } = req.params
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent
    )
    const paymentId = paymentIntent.id
    const planId = session.metadata.planId
    const userId = session.metadata.userId

    res.json({ paymentId, planId, userId })
  }
)

router.post('/update-user-plan', isAuthenticated, async (req, res) => {
  try {
    const { userId, planId } = req.body
    const user = await User.findById(userId)
    user.plan = planId
    await user.save()
    res.json({ status: 'success', userId: userId })
  } catch (e) {
    console.log(e)
  }
})

router.put('/settings/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params
  const { userInfo } = req.body

  User.findById(id)
    .then((user) => {
      user.email = userInfo.email // Use dot notation to set userInfo property
      user.name = userInfo.name
      user.username = userInfo.username

      return user.save()
    })
    .then((response) => {
      res.status(200).json({ status: 'success' })
    })
    .catch((error) => {
      console.error(error)
      res
        .status(500)
        .json({ error: 'An error occurred while updating the user settings.' })
    })
})

router.put('/dashboard/statistics', async (req, res, next) => {
  const { StatisticsObject } = req.body
  const { county, contry, country_code } = StatisticsObject.location.address
  try {
    const website = await Website.findById(StatisticsObject._id)
    const visitor = new Visitor({
      website: website._id,
      location: county,
      contry: contry,
      country_code: country_code,
      views: StatisticsObject.views || 0,
    })

    website.visitors.push(visitor)
    await website.save()

    res.status(200).json({ status: 'success' })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ error: 'An error occurred while updating the user settings.' })
  }
})

router.get(
  '/dashboard/statistics/:id',
  isAuthenticated,
  async (req, res, next) => {
    const { id } = req.params
    try {
      const data = await Website.findById(id).populate('visitors')
      res.json(data)
    } catch (e) {
      console.log(e)
      res
        .status(500)
        .json({ error: 'An error occurred while updating the user settings.' })
    }
  }
)

module.exports = router
