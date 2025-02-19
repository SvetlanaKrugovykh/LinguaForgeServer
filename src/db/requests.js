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
  let { rows } = await pool.query('SELECT * FROM pl_words WHERE word = $1', [text])

  if (!rows || rows.length === 0) {
    const likeText = `%${text}%`
    const result = await pool.query('SELECT * FROM pl_words WHERE word_forms LIKE $1', [likeText])
    rows = result.rows
  }

  return rows
}


module.exports.getTasks = async function (topic, level, source) {
  const { rows } = await pool.query('SELECT * FROM pl_tasks WHERE topic = $1 AND level = $2 AND source = $3', [topic, level, source])
  return rows
}


module.exports.updateWord = async function (row) {
  try {
    const translations = await Promise.all([
      row.en ? row.en : g_translateText(row.word, 'pl', 'en'),
      row.ru ? row.ru : g_translateText(row.word, 'pl', 'ru'),
      row.uk ? row.uk : g_translateText(row.word, 'pl', 'uk')
    ])

    const [en, ru, uk] = translations

    await pool.query('UPDATE pl_words SET en = $1, ru = $2, uk = $3 WHERE id = $4', [en, ru, uk, row.id])

    const result = await pool.query('SELECT * FROM pl_words WHERE id = $1', [row.id]);
    if (!result.rows || result.rows.length === 0) {
      return null
    }
    return result.rows[0]
  } catch (error) {
    console.error('Error updating word:', error)
    return null
  }
}
