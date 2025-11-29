const pool = require('./pool')
const dotenv = require('dotenv')
const g_translateText = require('../services/translateService').g_translateText
const { analyzeOneWord } = require('../services/wordAPIService')

dotenv.config()

module.exports.saveUserSet = async function (body) {
  try {
    const { user_id, first_name, last_name, username, language_code } = body
    const userCheck = await pool.query('SELECT * FROM tg_users WHERE user_id = $1', [user_id])

    if (userCheck.rows.length > 0) {
      await pool.query(
        'UPDATE tg_users SET first_name = $1, last_name = $2, username = $3, language_code = $4 WHERE user_id = $5',
        [first_name, last_name, username, language_code, user_id]
      )
    } else {
      await pool.query(
        'INSERT INTO tg_users (user_id, first_name, last_name, username, language_code) VALUES ($1, $2, $3, $4, $5)',
        [user_id, first_name, last_name, username, language_code]
      )
    }
  } catch (error) {
    console.error('Error saving user set:', error)
    return null
  }
}

module.exports.getSubjects = async function () {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT pl_subjects.subject 
      FROM pl_subjects 
      JOIN pl_examples ON pl_subjects.id = pl_examples.subject 
      WHERE pl_examples.topic LIKE 'Słownictwo' 
      ORDER BY pl_subjects.subject ASC 
      LIMIT 50
    `)
    return rows
  } catch (error) {
    console.error('Error getting subjects:', error)
    return null
  }
}

module.exports.addNewTest = async function (entry) {
  let { topic, level, source, year, type, value, total_topic, task_number, tasks_count, text, options, correct, explanation, delete: deleteFlag, taskId } = entry

  try {
    text = text.replace(/[()]/g, '_')

    let rows
    if (taskId) {
      const result = await pool.query('SELECT * FROM pl_tasks WHERE id = $1', [taskId])
      rows = result.rows
    } else {
      const result = await pool.query('SELECT * FROM pl_tasks WHERE topic = $1 AND text = $2', [topic, text])
      rows = result.rows
    }

    if (rows.length > 0) {
      const taskId = rows[0].id
      if (deleteFlag === 'delete') {
        await deleteTaskAndRelatedResults(taskId)
        return 'deleted'
      } else {
        await pool.query(
          'UPDATE pl_tasks SET level = $1, source = $2, year = $3, type = $4, value = $5, total_topic = $6, task_number = $7, tasks_count = $8, text = $9, options = $10, correct = $11, explanation = $12 WHERE id = $13',
          [level, source, year, type, value, total_topic, task_number, tasks_count, text, options, correct, explanation, taskId]
        )
        return 'updated'
      }
    }

    await pool.query(
      'INSERT INTO pl_tasks (topic, level, source, year, type, value, total_topic, task_number, tasks_count, text, options, correct, explanation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
      [topic, level, source, year, type, value, total_topic, task_number, tasks_count, text, options, correct, explanation]
    )
    return 'added'

  } catch (error) {
    console.error('Error in addNewTest:', error)
    return null
  }
}

async function deleteTaskAndRelatedResults(taskId) {
  try {
    await pool.query('DELETE FROM pl_t_results WHERE task_id = $1', [taskId])
    await pool.query('DELETE FROM pl_tasks WHERE id = $1', [taskId])
  } catch (error) {
    console.error('Error deleting task and related results:', error)
  }
}

module.exports.getWords = async function (text) {
  let { rows } = await pool.query('SELECT * FROM pl_words WHERE word = $1', [text.trim()])
  let likeText

  if (!rows || rows.length === 0) {
    likeText = `%, ${text.trim()}%`
    const result = await pool.query('SELECT * FROM pl_words WHERE word_forms ILIKE $1', [likeText])
    rows = result.rows
  }

  if (!rows || rows.length === 0) {
    likeText = `%${text.trim()}%`
    const result = await pool.query('SELECT * FROM pl_words WHERE word_forms ILIKE $1', [likeText])
    rows = result.rows
  }

  return rows
}

module.exports.getTasks = async function (topic, level, _source, userId, taskId) {
  if (taskId) {
    const { rows } = await pool.query('SELECT * FROM pl_tasks WHERE id = $1', [taskId])
    return rows
  }

  let { rows } = await pool.query(`
    SELECT * FROM pl_tasks 
    WHERE topic = $1 AND level = $2  
    AND id NOT IN (SELECT task_id FROM pl_t_results WHERE user_id = $3)
    ORDER BY RANDOM() 
    LIMIT 1
  `, [topic, level, userId])

  if (rows.length === 0) {
    const result = await pool.query(`
      SELECT * FROM pl_tasks 
      WHERE topic = $1 AND level = $2  
      AND id IN (SELECT task_id FROM pl_t_results WHERE user_id = $3 AND correct <= incorrect)
      ORDER BY RANDOM() 
      LIMIT 1
    `, [topic, level, userId])
    rows = result.rows
  }

  return rows
}

module.exports.getOpuses = async function (topic, _level, _source, size, userId, opusId, subject) {
  let rows = []
  let wordsResult = []

  if (opusId) {
    const result = await pool.query(getRequestText4opus('opusId'), [opusId])
    rows = result.rows
  } else if (subject) {
    const result = await pool.query(getRequestText4opus('subject'), [`${subject}%`])
    rows = result.rows
  } else {
    if (size === '1') {
      const result = await pool.query(getRequestText4opus('size1'), [topic, userId])
      rows = result.rows
    } else {
      const result = await pool.query(getRequestText4opus('size2'), [topic, userId])
      rows = result.rows
    }

    if (rows.length === 0) {
      if (size === '1') {
        const result = await pool.query(`
          SELECT pl_examples.*, pl_subjects.subject 
          FROM pl_examples 
          LEFT JOIN pl_subjects ON pl_examples.subject = pl_subjects.id 
          WHERE pl_examples.example IS NOT NULL AND LENGTH(pl_examples.example) < 650 
          AND topic = $1
          AND pl_examples.id IN (SELECT opus_id FROM pl_o_results WHERE user_id = $2 AND correct < incorrect)
          ORDER BY RANDOM() 
          LIMIT 1
        `, [topic, userId])
        rows = result.rows
      } else {
        const result = await pool.query(`
          SELECT pl_examples.*, pl_subjects.subject 
          FROM pl_examples 
          LEFT JOIN pl_subjects ON pl_examples.subject = pl_subjects.id 
          WHERE pl_examples.example IS NOT NULL AND LENGTH(pl_examples.example) > 650 
          AND topic = $1
          AND pl_examples.id IN (SELECT opus_id FROM pl_o_results WHERE user_id = $2 AND correct < incorrect)
          ORDER BY RANDOM() 
          LIMIT 1
        `, [topic, userId])
        rows = result.rows
      }
    }
  }

  if (rows.length > 0) {
    const exampleId = rows[0].id
    if (subject) {
      wordsResult = await pool.query(getRequestSubjWords(), [exampleId, userId])
    } else {
      wordsResult = await pool.query('SELECT * FROM pl_words WHERE example = $1 LIMIT 100', [exampleId])
    }
    return { example: rows[0], words: wordsResult.rows }
  }

  return { example: null, words: [] }
}

function getRequestSubjWords() {
  return `
    SELECT pl_words.* 
    FROM pl_words 
    LEFT JOIN pl_w_results ON pl_words.id = pl_w_results.word_id 
    WHERE pl_words.example = $1 
    AND (pl_w_results.user_id IS NULL OR pl_w_results.finished = false OR pl_w_results.user_id != $2)
    ORDER BY RANDOM()
    LIMIT 1
  `
}

function getRequestText4opus(caseData) {

  switch (caseData) {
    case 'opusId':
      return 'SELECT pl_examples.*, pl_subjects.subject FROM pl_examples LEFT JOIN pl_subjects ON pl_examples.subject = pl_subjects.id WHERE pl_examples.id = $1'
    case 'subject':
      return 'SELECT pl_examples.*, pl_subjects.subject FROM pl_examples LEFT JOIN pl_subjects ON pl_examples.subject = pl_subjects.id WHERE pl_subjects.subject LIKE $1'
    case 'size1':
      return `
        SELECT pl_examples.*, pl_subjects.subject
        FROM pl_examples
        LEFT JOIN pl_subjects ON pl_examples.subject = pl_subjects.id
        WHERE pl_examples.example IS NOT NULL AND LENGTH(pl_examples.example) <= 650
        AND topic = $1
        AND pl_examples.id NOT IN (SELECT opus_id FROM pl_o_results WHERE user_id = $2)
        ORDER BY RANDOM()
        LIMIT 1
      `
    case 'size2':
      return `
        SELECT pl_examples.*, pl_subjects.subject
        FROM pl_examples
        LEFT JOIN pl_subjects ON pl_examples.subject = pl_subjects.id
        WHERE pl_examples.example IS NOT NULL AND LENGTH(pl_examples.example) > 650
        AND topic = $1
        AND pl_examples.id NOT IN (SELECT opus_id FROM pl_o_results WHERE user_id = $2)
        ORDER BY RANDOM()
        LIMIT 1
      `
  }
}

module.exports.manualUpdateWord = async function (data) {
  try {
    const { text, en, ru, uk, part_of_speech } = data

    const searchResult = await pool.query('SELECT * FROM pl_words WHERE word = $1', [text])

    if (searchResult.rows.length > 0) {
      const wordId = searchResult.rows[0].id
      await pool.query('UPDATE pl_words SET en = $1, ru = $2, uk = $3 WHERE id = $4', [en, ru, uk, wordId])
    } else {
      await pool.query('INSERT INTO pl_words (word, en, ru, uk,  part_of_speech) VALUES ($1, $2, $3, $4)', [text, en, ru, uk, part_of_speech])
    }

    const result = await pool.query('SELECT * FROM pl_words WHERE word = $1', [text])
    if (!result.rows || result.rows.length === 0) {
      return null
    }
    return result.rows
  } catch (error) {
    console.error('Error updating word:', error)
    return null
  }
}

module.exports.updateWord = async function (row) {
  try {
    const translations = await Promise.all([
      row.en ? row.en : await g_translateText(row.word, 'pl', 'en'),
      row.ru ? row.ru : await g_translateText(row.word, 'pl', 'ru'),
      row.uk ? row.uk : await g_translateText(row.word, 'pl', 'uk')
    ])

    const [en, ru, uk] = translations

    // Determine part of speech and gender using wordAPIService
    let part_of_speech = null
    let gender = null
    try {
      const analysis = await analyzeOneWord(row.word, row.lang || 'en')
      if (analysis && analysis.tokens && analysis.tokens[0] && analysis.tokens[0].partOfSpeech) {
        part_of_speech = analysis.tokens[0].partOfSpeech.tag || null
        gender = analysis.tokens[0].partOfSpeech.gender || null
      }
    } catch (err) {
      console.error('Error analyzing word:', err)
    }

    await pool.query('UPDATE pl_words SET en = $1, ru = $2, uk = $3, part_of_speech = $4, gender = $5 WHERE id = $6', [en, ru, uk, part_of_speech, gender, row.id])

    const result = await pool.query('SELECT * FROM pl_words WHERE id = $1', [row.id])
    if (!result.rows || result.rows.length === 0) {
      return null
    }
    return result.rows
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

module.exports.setUserOpusData = async function (data) {
  try {
    const { currentOpus, userId, lang, part, success } = data
    const opusId = currentOpus.example.id
    const level = currentOpus.example.level

    const { rows } = await pool.query('SELECT * FROM pl_o_results WHERE user_id = $1 AND opus_id = $2 AND lang = $3 AND part = $4 AND level = $5', [userId, opusId, lang, part, level])

    if (rows.length > 0) {
      if (success) {
        await pool.query('UPDATE pl_o_results SET correct = correct + 1 WHERE user_id = $1 AND opus_id = $2', [userId, opusId])
      } else {
        await pool.query('UPDATE pl_o_results SET incorrect = incorrect + 1 WHERE user_id = $1 AND opus_id = $2', [userId, opusId])
      }
    } else {
      await pool.query('INSERT INTO pl_o_results (user_id, opus_id, correct, incorrect, lang, part, level) VALUES ($1, $2, $3, $4 , $5, $6, $7)', [userId, opusId, success ? 1 : 0, success ? 0 : 1, lang, part, level])
    }
  } catch (error) {
    console.error('Error setUserTasksData:', error)
  }
}

module.exports.setUserWord = async function (data) {
  try {
    const { currentOpus, userId, success } = data
    const wordId = currentOpus.id

    const { rows } = await pool.query('SELECT * FROM pl_w_results WHERE user_id = $1 AND word_id = $2', [userId, wordId])

    if (rows.length > 0) {
      if (success) {
        await pool.query('UPDATE pl_w_results SET correct = correct + 1, finished = true WHERE user_id = $1 AND word_id = $2', [userId, wordId])
      } else {
        await pool.query('UPDATE pl_w_results SET incorrect = incorrect + 1, finished = true WHERE user_id = $1 AND word_id = $2', [userId, wordId])
      }
    } else {
      await pool.query('INSERT INTO pl_w_results (user_id, word_id, finished) VALUES ($1, $2, $3)', [userId, wordId, true])
    }
  } catch (error) {
    console.error('Error setUserWord:', error)
  }
}

module.exports.getMaxTestId = async function () {
  const { rows } = await pool.query('SELECT MAX(id) FROM pl_tasks')
  return rows[0].max
}

module.exports.getMaxWordId = async function () {
  const { rows } = await pool.query('SELECT MAX(id) FROM pl_words')
  return rows[0].max
}

module.exports.get1Word = async function (id) {
  const result = await pool.query('SELECT * FROM pl_words WHERE id = $1', [id])
  return result.rows[0]
}

module.exports.cleanWord = async function (i, translations) {
  try {

    const { en, ru, uk } = translations

    const { rows } = await pool.query('UPDATE pl_words SET en = $1, ru = $2, uk = $3 WHERE id = $4', [en, ru, uk, i])
    return rows

  } catch (error) {
    console.error('Error updating word:', error)
    return null
  }
}

module.exports.pool = pool