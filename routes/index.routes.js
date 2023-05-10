const express = require('express')
const { isAuthenticated } = require('../middleware/jwt.middleware')
const Component = require('../models/Component.model')
const DefaultComponent = require('../models/DefaultComponent.model')
const Plans = require('../models/Plans.model')
const Website = require('../models/Website.model')
const User = require('../models/User.model')
const Section = require('../models/Section.model')
const { default: mongoose } = require('mongoose')

const router = express.Router()

const app = express()
const stripe = require('stripe')('sk_test_QUXcoU3BnbZXp6IMVi7BkW8s')

router.get('/', isAuthenticated, (req, res, next) => {
  res.json('All good in here')
})


router.get('/user/:id', isAuthenticated,async (req, res, next) => {
  const { id } = req.params
  const UserFounded = await User.findById(id).populate("plan")
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




router.get('/websites/publicview/:username/:sitename', async (req, res, next) => {
  const { username , sitename } = req.params
  if (username && sitename ) {

    //Find with username and Sitename

    User.findOne({ username })
    .then(user => {
   
      Website.findOne({user: user._id , name : sitename })
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

    })
    .catch(error => {
      console.error(error);
    });

   
  } else {
    console.log('something goes wrong ')
  }
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
  console.log(droppedComponent?.items)

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

      console.log(droppedComponent)
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

router.post("/create-checkout-session", isAuthenticated, async (req, res) => {
  const { details } = req.body;
  console.log("DETAils:",details);
 
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: details.plan.name,
          },
          unit_amount: details.plan.price,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "http://localhost:3000",
    metadata: {
      planId: details.plan._id,
      userId: details.userId
    },
  });

  console.log(session.id )
  res.json({ url: session.url , id: session.id  } );
});

router.get("/get-payment-details/:sessionId",  isAuthenticated, async (req, res) => {
  const { sessionId } = req.params;
  console.log("get-payment-details ID :" ,sessionId)
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
  const paymentId = paymentIntent.id;
  console.log("SESSION ->",session)
  const planId = session.metadata.planId;
  const userId = session.metadata.userId;

  res.json({ paymentId, planId, userId });
});

router.post("/update-user-plan",  isAuthenticated, async (req, res) => {
  try {

  
  const { userId, planId } = req.body;
  const user = await User.findById(userId);
  user.plan = planId;
  await user.save();
  res.json({ status: "success" , userId: userId});
}
catch(e)
{
  console.log(e)
}
});



router.put("/settings/:id", isAuthenticated,async (req, res) => {
  console.log("INSIDE PUTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT");
  const { id } = req.params;
  const { userInfo } = req.body;
  console.log(userInfo);
  
  User.findById(id)
    .then(user => {
      user.email = userInfo.email; // Use dot notation to set userInfo property
      user.name = userInfo.name
      user.username = userInfo.username

      return user.save();
    })
    .then(response => {
      console.log(response);
      res.status(200).json({ status: "success" });
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: "An error occurred while updating the user settings." });
    });
});




module.exports = router
