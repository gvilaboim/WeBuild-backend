const express = require('express')
const { isAuthenticated } = require('../middleware/jwt.middleware')
const Component = require('../models/Component.model')
const Website = require('../models/Website.model')

const router = express.Router()


router.get('/', isAuthenticated, (req, res, next) => {
  res.json('All good in here')
})

router.get('/canvas-store', isAuthenticated, async (req, res, next) => {
  const foundComponents = await Component.find()
  res.json(foundComponents)
})


router.post('/websites/create', isAuthenticated, async (req, res, next) => {
  //criar um Website quando o website ainda n tiver um Id
  const { siteData } = req.body;
  const createWebSite = await Website.create(siteData)
  console.log(createWebSite)
  res.status(200).json(createWebSite)

})

router.get('/websites', isAuthenticated, async (req, res, next) => {
  const foundWebsites = await Website.find()
  res.status(200).json(foundWebsites)
})


router.get('/websites/:id', isAuthenticated, async (req, res, next) => {
  const { id } = req.params;
  const foundWebsite = await Website.findById(id);
  console.log(foundWebsite);

  res.status(200).json(foundWebsite);
})

router.put('/websites/', isAuthenticated, async (req, res, next) => {
  //criar put | Edit do website através do website ID

  const { siteData } = req.body;
  const id = siteData.id
  console.log(siteData)

  let content = {
    navbar: siteData.navbarComponents,
    body: siteData.bodyComponents,
    footer: siteData.footerComponents
  }

  const UpdatedWebsite = Website.findByIdAndUpdate(id, content, { new: true })
    .then(updatedUser => {
      console.log(updatedUser);
    })
    .catch(error => {
      console.log(error);
    });


})


module.exports = router
