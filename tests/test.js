(async () => {
  try {
    const path = require('path')
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
    await require('../src/services/forTestsCleaningService').cleanTestsService()
  } catch (error) {
    console.error('Error running cleanTestsService:', error)
  }
})()