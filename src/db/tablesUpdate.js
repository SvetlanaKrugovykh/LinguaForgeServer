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
  const words = fs.readFileSync(dictionaryPath, 'utf8').split('\n').map(word => word.trim())

  for (const word of words) {
    if (word) {
      await pool.query('INSERT INTO pl_words (word) VALUES ($1)', [word])
    }
  }
}

