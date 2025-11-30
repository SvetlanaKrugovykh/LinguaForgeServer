const db = require('../db/requests')
require('dotenv').config()

module.exports.checkText = async function (text, userId, lang) {
  let checkGender = false
  if (text) {
    if (text.startsWith('Subject:')) {
      return checkSubjectWord(text, userId)
    }

    const dataArray = await db.getWords(text, lang)
    if (lang='de') checkGender = true

    if (process.env.TRANSLATE_WORDS === 'true') {
      for (const row of dataArray) {
        if (!row.en || !row.ru || !row.uk || (checkGender && !row.gender)) {
          const updatedRows = await db.updateWord(row, lang, checkGender)
          if (updatedRows) {
            return updatedRows
          }
        }
      }
    }

    return dataArray
  }

  return null
}

module.exports.wordEditor = async function (data) {
  try {
    const dataArray = await db.manualUpdateWord(data)

    return dataArray
  } catch (error) {
    console.log('Error updating word:', error)
    return null
  }
}

async function checkSubjectWord(text, userId) {
  try {
    const subject = text.replace('Subject:', '').trim()
    const result = await db.getOpuses(undefined, undefined, undefined, undefined, userId, undefined, subject)
    return result

  } catch (error) {
    console.log('Error checking subject word:', error)
    return { example: null, words: [] }
  }
}