(async () => {
  try {
    const path = require('path')
    const fs = require('fs')
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
    const credentialsPath = path.resolve(__dirname, '../path/to/serviceAccountKey.json'); // Убедитесь, что путь правильный
    const credentialsData = fs.readFileSync(credentialsPath, 'utf8')
    const credentials = JSON.parse(credentialsData)
    await require('../src/services/wordsService').cleanWordTranslates(credentials)
  } catch (error) {
    console.error('Error running cleanTestsService:', error)
  }
})()