const { Pool } = require('pg')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

dotenv.config()

const pool = new Pool({
  user: process.env.LANG_DB_USER,
  host: process.env.LANG_DB_HOST,
  database: process.env.LANG_DB_NAME,
  password: process.env.LANG_DB_PASSWORD,
  port: process.env.LANG_DB_PORT,
})

const tableQueries = {
  'tg_users': `
    CREATE TABLE tg_users (
      id SERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255),
      username VARCHAR(255),
      language_code VARCHAR(2)
    )`,
  'tg_msgs': `
    CREATE TABLE tg_msgs (
      id SERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      msg_id INTEGER NOT NULL,
      msg_text TEXT NOT NULL,
      msg_date TIMESTAMP NOT NULL
    )`,
  'pl_subjects': `
    CREATE TABLE pl_subjects (
      id SERIAL PRIMARY KEY,
      subject TEXT NOT NULL
    )`,
  'pl_examples': `
    CREATE TABLE pl_examples (
      id SERIAL PRIMARY KEY,
      example TEXT NOT NULL,
      subject INTEGER,
      FOREIGN KEY (subject) REFERENCES pl_subjects(id)
    )`,
  'pl_words': `
    CREATE TABLE pl_words (
      id SERIAL PRIMARY KEY,
      word TEXT NOT NULL,
      word_forms TEXT,
      phrase TEXT,
      ru TEXT,
      uk TEXT,
      en TEXT,
      subject INTEGER,
      part_of_speech VARCHAR(50),
      frequency INTEGER,
      example INTEGER,
      FOREIGN KEY (example) REFERENCES pl_examples(id),
      FOREIGN KEY (subject) REFERENCES pl_subjects(id)
    )`,
}


module.exports.updateTables = function () {
  checkAndCreateTable('tg_users')
    .then(() => checkAndCreateTable('tg_msgs'))
    .then(() => checkAndCreateTable('pl_subjects'))
    .then(() => checkAndCreateTable('pl_examples'))
    .then(() => checkAndCreateTable('pl_words'))
    .then(() => {
      console.log('All tables created or already exist.')
      if (process.env.LOAD_BASE_DICT === 'true') {
        loadDictionary()
      }
      if (process.env.LOAD_DOP_DICT === 'true') {
        addDataToWords()
      }
      if (process.env.SET_POS === 'true') {
        setPartOfSpeech()
      }
    })
    .catch((err) => {
      console.error('Error in table creation sequence:', err)
    })
}

function checkAndCreateTable(tableName) {
  return new Promise((resolve, reject) => {
    pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = $1
      )`,
      [tableName],
      (err, res) => {
        if (err) {
          console.error(`Error checking if table ${tableName} exists:`, err)
          reject(err)
          return
        }
        const tableExists = res.rows[0].exists
        if (!tableExists) {
          createTable(tableName).then(resolve).catch(reject)
        } else {
          console.log(`Table ${tableName} already exists.`)
          resolve()
        }
      }
    )
  })
}

function createTable(tableName) {
  return new Promise((resolve, reject) => {
    const query = tableQueries[tableName]
    if (!query) {
      console.error(`No query found for table ${tableName}`)
      reject(new Error(`No query found for table ${tableName}`))
      return
    }

    pool.query(query, (err, res) => {
      if (err) {
        console.error(`Error creating table ${tableName}:`, err)
        reject(err)
      } else {
        console.log(`Table ${tableName} created successfully.`)
        resolve()
      }
    })
  })
}

async function loadDictionary() {

  const dictionaryPath = path.join(__dirname, '../../data/pl/', `${process.env.DICT_NAME}.txt`)
  const lines = fs.readFileSync(dictionaryPath, 'utf8').split('\n').map(word => word.trim())

  for (const line of lines) {
    if (line.includes(',') && line[1] !== ' ' && line[1] !== '.') {
      const [word, ...wordForms] = line.split(',').map(word => word.trim())
      const wordFormsString = wordForms.join(', ')

      if (word) {
        await pool.query('INSERT INTO pl_words (word, word_forms) VALUES ($1, $2)', [word, wordFormsString]);
      }
    }
  }
}

async function addDataToWords() {
  const dictionaryPath = path.join(__dirname, '../../data/pl/', `${process.env.DICT_DOP_NAME}.json`)
  const data = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'))

  for (const entry of data) {
    const { subject, words, ru, uk, en, examples } = entry

    const subjectId = await getOrCreateSubjectId(subject)
    const exampleId = await getOrCreateExampleId(examples, subjectId)

    const wordsArray = words.split(',').map(word => word.trim())
    const ruArray = ru.split(',').map(word => word.trim())
    const ukArray = uk.split(',').map(word => word.trim())
    const enArray = en.split(',').map(word => word.trim())

    await processWords(wordsArray, ruArray, ukArray, enArray, subjectId, exampleId)
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

async function getOrCreateExampleId(examples, subjectId) {
  const exampleRes = await pool.query('SELECT id FROM pl_examples WHERE example = $1', [examples])
  if (exampleRes.rows.length > 0) {
    return exampleRes.rows[0].id
  } else {
    const insertExampleRes = await pool.query('INSERT INTO pl_examples (example, subject) VALUES ($1, $2) RETURNING id', [examples, subjectId])
    return insertExampleRes.rows[0].id
  }
}

async function processWords(wordsArray, ruArray, ukArray, enArray, subjectId, exampleId) {
  for (let i = 0; i < wordsArray.length; i++) {
    const word = wordsArray[i]
    const ruWord = ruArray[i] !== undefined ? ruArray[i] : ""
    const ukWord = ukArray[i] !== undefined ? ukArray[i] : ""
    const enWord = enArray[i] !== undefined ? enArray[i] : ""

    await upsertWord(word, ruWord, ukWord, enWord, subjectId, exampleId)
  }
}

async function upsertWord(word, ruWord, ukWord, enWord, subjectId, exampleId) {
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


async function setPartOfSpeech() {
  let unfilled_POS = {}

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word_forms LIKE $1", ['%liśmy%'])
  for (const row of unfilled_POS.rows) {
    await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['czasownik', row.id])
  }

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word_forms LIKE $1", ['%ów%'])
  for (const row of unfilled_POS.rows) {
    if ((row.word_forms && (row.word_forms.includes(`ów,`) || row.word_forms.endsWith(`ów`)))) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }
}