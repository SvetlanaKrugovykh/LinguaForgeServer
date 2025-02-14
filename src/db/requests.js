const { Pool } = require('pg')
const dotenv = require('dotenv')
const g_translateText = require('../services/translateService').g_translateText

dotenv.config()
const pool = new Pool({
  user: process.env.LANG_DB_USER,
  host: process.env.LANG_DB_HOST,
  database: process.env.LANG_DB_NAME,
  password: process.env.LANG_DB_PASSWORD,
  port: process.env.LANG_DB_PORT,
})

module.exports.getWords = async function (text) {

  const { rows } = await pool.query('SELECT * FROM pl_words WHERE word = $1', [text])

  return rows
}

module.exports.updateWord = async function (row) {
  const translations = await Promise.all([
    row.en ? row.en : g_translateText(row.word, 'pl', 'en'),
    row.ru ? row.ru : g_translateText(row.word, 'pl', 'ru'),
    row.uk ? row.uk : g_translateText(row.word, 'pl', 'uk')
  ])

  const [en, ru, uk] = translations

  await pool.query('UPDATE pl_words SET en = $1, ru = $2, uk = $3 WHERE id = $4', [en, ru, uk, row.id])

  return await pool.query('SELECT * FROM pl_words WHERE id = $1', [row.id])
}