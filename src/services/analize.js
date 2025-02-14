const db = require('../db/requests')

module.exports.checkText = async function (text) {
  const dataArray = await db.getWords(text)

  for (const row of dataArray) {
    if (!row.en || !row.ru || !row.uk) {
      await db.updateWord(row)
    }
  }
  return dataArray
}