const pool = require('./pool')
const fs = require('fs')
const path = require('path')

const dictionaryPath = path.join(__dirname, 'data', 'pl', 'dictionary.json')
const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'))

module.exports.insertWords = async function () {
  try {
    for (const entry of dictionary) {
      const { subject, words } = entry
      const wordList = words.split(',').map(word => word.trim())
      for (const word of wordList) {
        await pool.query('INSERT INTO words (subject, word) VALUES ($1, $2)', [subject, word])
      }
    }
    console.log('Words inserted successfully.')
  } catch (error) {
    console.error('Error inserting words:', error)
  }
}

