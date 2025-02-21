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
  let { rows } = await pool.query('SELECT * FROM pl_words WHERE word = $1', [text.trim()])

  if (!rows || rows.length === 0) {
    const likeText = `%${text.trim()}%`
    const result = await pool.query('SELECT * FROM pl_words WHERE word_forms LIKE $1', [likeText])
    rows = result.rows
  }

  return rows
}


module.exports.getTasks = async function (topic, level, source) {
  const { rows } = await pool.query('SELECT * FROM pl_tasks WHERE topic = $1 AND level = $2 AND source = $3 LIMIT 1', [topic, level, source])
  return rows
}

module.exports.getOpuses = async function (topic, _level, _source, size) {
  let rows = []

  if (size === '1') {
    const result = await pool.query(`
      SELECT pl_examples.*, pl_subjects.subject 
      FROM pl_examples 
      LEFT JOIN pl_subjects ON pl_examples.subject = pl_subjects.id 
      WHERE pl_examples.example IS NOT NULL AND LENGTH(pl_examples.example) < 650 AND topic = $1
      LIMIT 1
    `, [topic])
    rows = result.rows
  } else {
    const result = await pool.query(`
      SELECT pl_examples.*, pl_subjects.subject 
      FROM pl_examples 
      LEFT JOIN pl_subjects ON pl_examples.subject = pl_subjects.id 
      WHERE pl_examples.example IS NOT NULL AND LENGTH(pl_examples.example) > 650 AND topic = $1
      LIMIT 1
    `, [topic])
    rows = result.rows
  }

  if (rows.length > 0) {
    const exampleId = rows[0].id;
    const wordsResult = await pool.query('SELECT * FROM pl_words WHERE example = $1 LIMIT 100', [exampleId]);
    return { example: rows[0], words: wordsResult.rows };
  }

  return { example: null, words: [] };
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

module.exports.setUserTasksData = async function (data) {
  try {
    const { currentTest, userId, lang, part, success } = data
    const taskId = currentTest.id
    const source = currentTest.source
    const level = currentTest.level

    const { rows } = await pool.query('SELECT * FROM pl_t_results WHERE user_id = $1 AND task_id = $2  AND source = $3 AND lang = $4 AND part = $5 AND level = $6', [userId, taskId, source, lang, part, level])

    if (rows.length > 0) {
      if (success) {
        await pool.query('UPDATE pl_t_results SET correct = correct + 1 WHERE user_id = $1 AND task_id = $2', [userId, taskId])
      } else {
        await pool.query('UPDATE pl_t_results SET incorrect = incorrect + 1 WHERE user_id = $1 AND task_id = $2', [userId, taskId])
      }
    } else {
      await pool.query('INSERT INTO pl_t_results (user_id, task_id, correct, incorrect, source, lang, part, level) VALUES ($1, $2, $3, $4 , $5, $6, $7, $8)', [userId, taskId, success ? 1 : 0, success ? 0 : 1, source, lang, part, level])
    }
  } catch (error) {
    console.error('Error setUserTasksData:', error)
  }
}