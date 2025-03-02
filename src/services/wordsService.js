const db = require('../db/requests')
const trS = require('./translateService')


module.exports.cleanWordTranslates = async function () {
  try {
    const maxTestId = await db.getMaxWordId()

    const total = 400

    for (let i = maxTestId; i > (maxTestId - total); i--) {
      const row = await db.get1Word(i)

      const translations = {}
      translations.en = await trS.translateLWord(row.word, 'pl', 'en')
      translations.ru = await trS.g_translateText(translations.en, 'en', 'ru')
      translations.uk = await trS.g_translateText(translations.en, 'en', 'uk')
      await db.cleanWord(i, translations)
      console.log(row.word, translations)
    }

  } catch (error) {
    console.error('Error cleaning tests service:', error)
    return null
  }
}