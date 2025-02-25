const db = require('../db/requests')
require('dotenv').config()

module.exports.checkText = async function (text) {
  const dataArray = await db.getWords(text)

  if (process.env.TRANSLATE_WORDS === 'true') {
    for (const row of dataArray) {
      if (!row.en || !row.ru || !row.uk) {
        const updatedRows = await db.updateWord(row)
        if (updatedRows) { return updatedRows }
      }
    }
  }

  return dataArray
}