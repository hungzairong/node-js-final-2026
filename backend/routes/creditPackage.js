const express = require('express')
const creditPackageController = require('../controllers/creditPackage')

const router = express.Router()

router.get('/', creditPackageController.getCreditPackages)

router.post('/', creditPackageController.createCreditPackage)

router.delete('/:id', creditPackageController.deleteCreditPackage)

module.exports = router
