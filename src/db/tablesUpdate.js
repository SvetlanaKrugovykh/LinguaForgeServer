const { Pool } = require('pg')
const dotenv = require('dotenv')

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
  'pl': `
    CREATE TABLE pl (
      id SERIAL PRIMARY KEY,
      phrase TEXT NOT NULL,
      ru TEXT NOT NULL,
      uk TEXT NOT NULL,
      en TEXT NOT NULL,
      part_of_speech VARCHAR(50),
      frequency INTEGER
    )`,
}


module.exports.updateTables = function () {
  checkAndCreateTable('tg_users')
    .then(() => checkAndCreateTable('tg_msgs'))
    .then(() => checkAndCreateTable('pl'))
    .then(() => {
      console.log('All tables created or already exist.')
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