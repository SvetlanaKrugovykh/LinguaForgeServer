
const { Pool } = require('pg')
const dotenv = require('dotenv')
const db = require('../db/requests')

dotenv.config()
const pool = new Pool({
  user: process.env.LANG_DB_USER,
  host: process.env.LANG_DB_HOST,
  database: process.env.LANG_DB_NAME,
  password: process.env.LANG_DB_PASSWORD,
  port: process.env.LANG_DB_PORT,
})

module.exports.addNewOpus = async function (body) {
  try {

    const { subject, words, ru, uk, en, examples, topic } = body

    const subjectId = await getOrCreateSubjectId(subject)
    const exampleId = await getOrCreateExampleId(examples, subjectId, topic)

    const wordsArray = words.split(',').map(word => word.trim())
    const ruArray = ru.split(',').map(word => word.trim())
    const ukArray = uk.split(',').map(word => word.trim())
    const enArray = en.split(',').map(word => word.trim())

    await processWords(wordsArray, ruArray, ukArray, enArray, subjectId, exampleId)


    return []
  } catch (error) {
    console.error('Error adding new test:', error)
    return null
  }
}

async function processWords(wordsArray, ruArray, ukArray, enArray, subjectId, exampleId) {
  for (let i = 0; i < wordsArray.length; i++) {
    const word = wordsArray[i]
    const ruWord = ruArray[i] !== undefined ? ruArray[i] : ""
    const ukWord = ukArray[i] !== undefined ? ukArray[i] : ""
    const enWord = enArray[i] !== undefined ? enArray[i] : ""

    await module.exports.updateOpus(word, ruWord, ukWord, enWord, subjectId, exampleId)
  }
}

async function getOrCreateSubjectId(subject) {
  const subjectRes = await pool.query('SELECT id FROM pl_subjects WHERE subject = $1', [subject])
  if (subjectRes.rows.length > 0) {
    return subjectRes.rows[0].id
  } else {
    const insertSubjectRes = await pool.query('INSERT INTO pl_subjects (subject) VALUES ($1) RETURNING id', [subject])
    return insertSubjectRes.rows[0].id
  }
}

async function getOrCreateExampleId(examples, subjectId, topic) {
  const exampleRes = await pool.query('SELECT id FROM pl_examples WHERE example = $1', [examples])
  if (exampleRes.rows.length > 0) {
    return exampleRes.rows[0].id
  } else {
    const insertExampleRes = await pool.query('INSERT INTO pl_examples (example, subject, topic) VALUES ($1, $2, $3) RETURNING id', [examples, subjectId, topic])
    return insertExampleRes.rows[0].id
  }
}

module.exports.updateOpus = async function (word, ruWord, ukWord, enWord, subjectId, exampleId) {
  let wordRes

  if (word.length <= 3) {
    wordRes = await pool.query('SELECT id FROM pl_words WHERE word = $1', [word])
  } else {
    wordRes = await pool.query('SELECT id, word, word_forms FROM pl_words WHERE word = $1', [word])
    if (wordRes.rows.length === 0) {
      wordRes = await pool.query('SELECT id, word, word_forms FROM pl_words WHERE word_forms LIKE $1', [`%${word}%`])
    }
  }

  if (wordRes.rows.length > 0) {
    for (const row of wordRes.rows) {
      if ((row.word_forms && (row.word_forms.includes(`, ${word}`) || row.word_forms.startsWith(`${word},`))) && row.word.startsWith(word.substring(0, 3))) {
        await pool.query('UPDATE pl_words SET ru = $1, uk = $2, en = $3, subject = $4, example = $5 WHERE id = $6', [ruWord, ukWord, enWord, subjectId, exampleId, row.id])
      }
    }
  } else {
    await pool.query('INSERT INTO pl_words (word, ru, uk, en, subject, example) VALUES ($1, $2, $3, $4, $5, $6)', [word, ruWord, ukWord, enWord, subjectId, exampleId])
  }
}

module.exports.saveUserOpusSet = async function (body) {
  try {
    const data = body.query
    const result = await db.setUserOpusData(data)
    return result
  } catch (error) {
    console.error('Error setting user data:', error)
    return null
  }
}
