const db = require('../db/requests')
const trS = require('./translateService')
const { Translate } = require('@google-cloud/translate').v2
const { getCredentials } = require('../guards/getCredentials')
require('dotenv').config()

module.exports.cleanWordTranslates = async function () {
  try {
    const maxTestId = await db.getMaxWordId()

    const total = 2

    for (let i = maxTestId; i > (maxTestId - total); i--) {
      const row = await db.get1Word(i)

      const translations = {}
      translations.en = await trS.translateLWord(row.word, 'pl', 'en')
      translations.ru = await g1_translateText(translations.en, 'en', 'ru')
      translations.uk = await g1_translateText(translations.en, 'en', 'uk')
      await db.cleanWord(i, translations)
      console.log(row.word, translations)
    }

  } catch (error) {
    console.error('Error cleaning tests service:', error)
    return null
  }
}

async function g1_translateText(text, sourceLanguage, targetLanguage) {
  try {
    const CREDENTIALS = getCredentials()
    const translate = new Translate({ credentials: CREDENTIALS, projectId: CREDENTIALS.project_id })
    const [translation] = await translate.translate(text, {
      from: sourceLanguage,
      to: targetLanguage
    })
    return translation
  } catch (error) {
    console.error("Error:", error)
  }
}