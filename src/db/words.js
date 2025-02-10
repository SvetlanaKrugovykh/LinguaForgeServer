const dotenv = require('dotenv')
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const client = new Pool({
  user: process.env.LANG_DB_USER,
  host: process.env.LANG_DB_HOST,
  database: process.env.LANG_DB_NAME,
  password: process.env.LANG_DB_PASSWORD,
  port: process.env.LANG_DB_PORT,
})

client.connect()

const dictionaryPath = path.join(__dirname, 'data', 'pl', 'dictionary.json')
const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'))

module.exports.insertWords() = async function () {

  for (const entry of dictionary) {
    const { subject, words } = entry
    const wordList = words.split(',').map(word => word.trim())
    for (const word of wordList) {
      await client.query('INSERT INTO words (subject, word) VALUES ($1, $2)', [subject, word])
    }
  }

  await client.end()
}

// insertWords().catch(err => console.error('Error inserting words:', err))