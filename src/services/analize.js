const db = require('../db/requests')

module.exports.checkText = async function (text) {
  const dataArray = await db.getWords(text)

  if (process.env.TRANSLATE_WORDS === 'true') {
    for (const row of dataArray) {
      if (!row.en || !row.ru || !row.uk) {
        const updatedRow = await db.updateWord(row)
        if (updatedRow) { return updatedRow }
      }
    }
  }

  return dataArray
}