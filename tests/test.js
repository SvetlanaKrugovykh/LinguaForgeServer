(async () => {
  try {
    await require('../src/services/forTestsCleaningService').cleanTestsService()
  } catch (error) {
    console.error('Error running cleanTestsService:', error)
  }
})()