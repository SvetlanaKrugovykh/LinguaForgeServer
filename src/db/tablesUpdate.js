const { Pool } = require('pg')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')
const db = require('./requests')
const { addNewOpus } = require('../services/opusService')

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
      user_id BIGINT NOT NULL UNIQUE,
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
      description TEXT,
      example TEXT NOT NULL,
      subject INTEGER,
      topic TEXT,
      level TEXT,
      source TEXT,
      size TEXT,
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
  'pl_tasks': `
    CREATE TABLE pl_tasks (
      id SERIAL PRIMARY KEY,
      topic TEXT NOT NULL,
      level TEXT NOT NULL,
      source TEXT NOT NULL,
      year INTEGER,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      total_topic INTEGER,
      task_number INTEGER,
      tasks_count INTEGER,
      text TEXT,
      options TEXT,
      correct TEXT,
      explanation TEXT
    )`,
  'pl_t_results': `
    CREATE TABLE pl_t_results (
      id SERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      task_id INTEGER NOT NULL,
      level TEXT NOT NULL,
      source TEXT NOT NULL,
      correct INTEGER,
      incorrect INTEGER,
      lang TEXT NOT NULL,
      part TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES pl_tasks(id),
      FOREIGN KEY (user_id) REFERENCES tg_users(user_id)
    )`,
  'pl_o_results': `
    CREATE TABLE pl_o_results (
      id SERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      opus_id INTEGER NOT NULL,
      level TEXT,
      lang TEXT,
      part TEXT,
      correct INTEGER,
      incorrect INTEGER,
      FOREIGN KEY (opus_id) REFERENCES pl_examples(id),
      FOREIGN KEY (user_id) REFERENCES tg_users(user_id)
    )`
}


module.exports.updateTables = function () {
  checkAndCreateTable('tg_users')
    .then(() => checkAndCreateTable('tg_msgs'))
    .then(() => checkAndCreateTable('pl_subjects'))
    .then(() => checkAndCreateTable('pl_examples'))
    .then(() => checkAndCreateTable('pl_words'))
    .then(() => checkAndCreateTable('pl_tasks'))
    .then(() => checkAndCreateTable('pl_t_results'))
    .then(() => checkAndCreateTable('pl_o_results'))
    .then(() => {
      console.log('All tables created or already exist.')
      if (process.env.LOAD_BASE_DICT === 'true') {
        loadDictionary()
      }
      if (process.env.LOAD_DOP_DICT === 'true') {
        addDataToWords()
      }
      if (process.env.LOAD_EXAM_PARTS === 'true') {
        const filename = process.env.EXAM_PARTS_NAME
        module.exports.addExamsData(filename)
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
          reject(new Error(err))
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

module.exports.addExamsData = async function (filename) {
  const dictionaryPath = path.join(__dirname, '../../data/pl/', `${filename}.json`)
  const data = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'))

  for (const entry of data) {
    await db.addNewTest(entry)
  }
}

async function addDataToWords() {
  const dictionaryPath = path.join(__dirname, '../../data/pl/', `${process.env.DICT_DOP_NAME}.json`)
  const data = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'))

  for (const entry of data) {
    addNewOpus(entry)
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

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word_forms LIKE $1", ['%ą%'])
  for (const row of unfilled_POS.rows) {
    if (row.word_forms &&
      (row.word_forms.includes(`ą,`) || row.word_forms.endsWith(`ą`)) &&
      !row.word_forms.includes(`a,`)) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word_forms LIKE $1", ['%em%'])
  for (const row of unfilled_POS.rows) {
    if (row.word_forms &&
      (row.word_forms.includes(`em,`) || row.word_forms.endsWith(`em`)) &&
      !row.word_forms.includes(`a,`)) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word_forms LIKE $1", ['%ami%'])
  for (const row of unfilled_POS.rows) {
    if (row.word_forms &&
      (row.word_forms.includes(`ami,`) || row.word_forms.endsWith(`ami`)) &&
      !row.word_forms.includes(`a,`)) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word_forms LIKE $1", ['%ach%'])
  for (const row of unfilled_POS.rows) {
    if (row.word_forms &&
      (row.word_forms.includes(`ach,`) || row.word_forms.endsWith(`ach`)) &&
      !row.word_forms.includes(`a,`)) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word LIKE $1", ['%anin']);
  for (const row of unfilled_POS.rows) {
    if (row.word.endsWith('anin')) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word LIKE $1", ['%anie']);
  for (const row of unfilled_POS.rows) {
    if (row.word.endsWith('anie')) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word LIKE $1", ['%stwo']);
  for (const row of unfilled_POS.rows) {
    if (row.word.endsWith('stwo')) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word LIKE $1", ['%owie']);
  for (const row of unfilled_POS.rows) {
    if (row.word.endsWith('owie')) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word LIKE $1", ['%isko']);
  for (const row of unfilled_POS.rows) {
    if (row.word.endsWith('isko')) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word LIKE $1", ['%nictwo']);
  for (const row of unfilled_POS.rows) {
    if (row.word.endsWith('nictwo')) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }

  unfilled_POS = await pool.query("SELECT id, word, word_forms FROM pl_words WHERE part_of_speech IS NULL AND word LIKE $1", ['%arz']);
  for (const row of unfilled_POS.rows) {
    if (row.word.endsWith('arz')) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
    }
  }

  unfilled_POS = await pool.query(`
    SELECT id, word, word_forms 
    FROM pl_words 
    WHERE part_of_speech IS NULL 
      AND (word LIKE '%ny' 
        OR word LIKE '%na'
        OR word LIKE '%ne'
        OR word LIKE '%owy'
        OR word LIKE '%owa'
        OR word LIKE '%owate'
        OR word LIKE '%owe'
        OR word LIKE '%ski'
        OR word LIKE '%ska'
        OR word LIKE '%skie'
        OR word LIKE '%i'
        OR word LIKE '%czy'        OR word LIKE '%owy'
        OR word LIKE '%y'
        OR word LIKE '%t' 
        OR word LIKE '%ty' 
        OR word LIKE '%e')
  `)

  for (const row of unfilled_POS.rows) {
    if (row.word.endsWith(`ny`) ||
      row.word.endsWith(`na`) ||
      row.word.endsWith(`ne`) ||
      row.word.endsWith(`owy`) ||
      row.word.endsWith(`owa`) ||
      row.word.endsWith(`owate`) ||
      row.word.endsWith(`owe`) ||
      row.word.endsWith(`ski`) ||
      row.word.endsWith(`ska`) ||
      row.word.endsWith(`skie`) ||
      row.word.endsWith(`i`) ||
      row.word.endsWith(`czy`) ||
      row.word.endsWith(`y`) ||
      row.word.endsWith(`t`) ||
      row.word.endsWith(`ty`) ||
      row.word.endsWith(`e`)
    ) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['przymiotnik', row.id]);
    }
  }

  unfilled_POS = await pool.query(`
  SELECT id, word, word_forms 
  FROM pl_words 
  WHERE part_of_speech IS NULL 
    AND (word LIKE '%e' 
      OR word LIKE '%o'
      OR word LIKE '%owo') 
`)

  for (const row of unfilled_POS.rows) {
    if (row.word.endsWith(`two`) ||
      row.word.endsWith(`no`) ||
      row.word.endsWith(`ło`) ||
      row.word.endsWith(`ko`)) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['rzeczownik', row.id])
      continue
    }
    if (row.word.endsWith(`e`) ||
      row.word.endsWith(`o`) ||
      row.word.endsWith(`owo`)) {
      await pool.query('UPDATE pl_words SET part_of_speech = $1 WHERE id = $2', ['przysłówek', row.id])
    }
  }

}