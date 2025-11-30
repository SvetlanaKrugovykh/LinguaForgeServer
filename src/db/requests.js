const pool = require('./pool')
const dotenv = require('dotenv')
const g_translateText = require('../services/translateService').g_translateText
const { analyzeOneWord } = require('../services/wordAPIService')
const stringSimilarity = require("string-similarity")

dotenv.config()

module.exports.saveUserSet = async function (body) {
  try {
    const {
      user_id,
      first_name,
      last_name,
      username,
      language_code,
      learning_language,
      tts_language,
      menu_language
    } = body
    const userCheck = await pool.query('SELECT * FROM tg_users WHERE user_id = $1', [user_id])

    if (userCheck.rows.length > 0) {
      // Build dynamic update query for only provided fields
      const fields = []
      const values = []
      let idx = 1
      if (first_name !== undefined && first_name !== null && first_name !== '') {
        fields.push(`first_name = $${idx++}`)
        values.push(first_name)
      }
      if (last_name !== undefined && last_name !== null && last_name !== '') {
        fields.push(`last_name = $${idx++}`)
        values.push(last_name)
      }
      if (username !== undefined && username !== null && username !== '') {
        fields.push(`username = $${idx++}`)
        values.push(username)
      }
      if (language_code !== undefined && language_code !== null && language_code !== '') {
        fields.push(`language_code = $${idx++}`)
        values.push(language_code)
      }
      if (learning_language !== undefined && learning_language !== null && learning_language !== '') {
        fields.push(`learning_language = $${idx++}`)
        values.push(learning_language)
      }
      if (tts_language !== undefined && tts_language !== null && tts_language !== '') {
        fields.push(`tts_language = $${idx++}`)
        values.push(tts_language)
      }
      if (menu_language !== undefined && menu_language !== null && menu_language !== '') {
        fields.push(`menu_language = $${idx++}`)
        values.push(menu_language)
      }
      if (fields.length > 0) {
        values.push(user_id)
        const query = `UPDATE tg_users SET ${fields.join(', ')} WHERE user_id = $${idx}`
        await pool.query(query, values)
      }
    } else {
      // Only insert fields that are provided
      const insertFields = ['user_id']
      const insertValues = [user_id]
      const placeholders = ['$1']
      let idx = 2
      if (first_name !== undefined && first_name !== null && first_name !== '') {
        insertFields.push('first_name')
        insertValues.push(first_name)
        placeholders.push(`$${idx++}`)
      }
      if (last_name !== undefined && last_name !== null && last_name !== '') {
        insertFields.push('last_name')
        insertValues.push(last_name)
        placeholders.push(`$${idx++}`)
      }
      if (username !== undefined && username !== null && username !== '') {
        insertFields.push('username')
        insertValues.push(username)
        placeholders.push(`$${idx++}`)
      }
      if (language_code !== undefined && language_code !== null && language_code !== '') {
        insertFields.push('language_code')
        insertValues.push(language_code)
        placeholders.push(`$${idx++}`)
      }
      if (learning_language !== undefined && learning_language !== null && learning_language !== '') {
        insertFields.push('learning_language')
        insertValues.push(learning_language)
        placeholders.push(`$${idx++}`)
      }
      if (tts_language !== undefined && tts_language !== null && tts_language !== '') {
        insertFields.push('tts_language')
        insertValues.push(tts_language)
        placeholders.push(`$${idx++}`)
      }
      if (menu_language !== undefined && menu_language !== null && menu_language !== '') {
        insertFields.push('menu_language')
        insertValues.push(menu_language)
        placeholders.push(`$${idx++}`)
      }
      const query = `INSERT INTO tg_users (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')})`
      await pool.query(query, insertValues)
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


const stringSimilarity = require("string-similarity")

module.exports.getWords = async function (text, lang) {
	const tableName = `${lang}_words`
	const tableExistsRes = await pool.query("SELECT to_regclass($1) AS exists", [
		tableName,
	])
	if (!tableExistsRes.rows[0].exists) {
		return []
	}

	let { rows } = await pool.query(
		`SELECT * FROM ${tableName} WHERE word = $1`,
		[text.trim()]
	)

	if (!rows || rows.length === 0) {
		const likeText = `%${text.trim()}%`
		const result = await pool.query(
			`SELECT * FROM ${tableName} WHERE word_forms ILIKE $1`,
			[likeText]
		)
		rows = result.rows
	}

	if (rows && rows.length > 1) {
		const matches = rows.map((row) => row.word)
		const bestMatch = stringSimilarity.findBestMatch(text.trim(), matches)
		return rows.filter((row) => row.word === bestMatch.bestMatch.target)
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

module.exports.updateWord = async function (row, lang, checkGender) {
  try {
    const translations = await Promise.all([
      row.en ? row.en : await g_translateText(row.word, lang, 'en'),
      row.ru ? row.ru : await g_translateText(row.word, lang, 'ru'),
      row.uk ? row.uk : await g_translateText(row.word, lang, 'uk')
    ])

    const [en, ru, uk] = translations

    // Determine part of speech and gender using wordAPIService
    let part_of_speech = null
    let gender = null
    try {
      if (checkGender) {
        console.log('Checking gender for word:', row.word)
      const analysis = await analyzeOneWord(row.word, lang)
			if (
				analysis &&
				analysis.tokens &&
				analysis.tokens[0] &&
				analysis.tokens[0].partOfSpeech
			) {
				part_of_speech = analysis.tokens[0].partOfSpeech.tag || null
				gender = analysis.tokens[0].partOfSpeech.gender || null
				console.log(
					"WORD:",
					row.word,
					"POS:",
					part_of_speech,
					"GENDER:",
					gender
				)
			}
     }
    } catch (err) {
      console.error('Error analyzing word:', err)
    }

    if (!gender) {
      await pool.query('UPDATE pl_words SET en = $1, ru = $2, uk = $3 WHERE id = $4', [en, ru, uk, row.id])
    } else {
      await pool.query('UPDATE pl_words SET en = $1, ru = $2, uk = $3, part_of_speech = $4, gender = $5 WHERE id = $6', [en, ru, uk, part_of_speech, gender, row.id])
    }

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