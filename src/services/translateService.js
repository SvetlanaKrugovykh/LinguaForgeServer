const { Translate } = require('@google-cloud/translate').v2
const axios = require('axios')
const { getCredentials } = require('../guards/getCredentials')
require('dotenv').config()

module.exports.g_translateText = async function (text, sourceLanguage, targetLanguage) {
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

module.exports.translateWord = async function (word, sourceLanguage, targetLanguage) {
  try {
    const response = await axios.post(process.env.TRANSLATOR, {
      q: word,
      source: sourceLanguage,
      target: targetLanguage,
      format: 'text'
    })
    return response.data.translatedText
  } catch (error) {
    console.error('Translate error:', error)
  }
}

module.exports.translateLWord = async function (word, sourceLanguage, targetLanguage) {
  try {
    const response = await axios.post(process.env.TRANSLATOR_URL, {
      text: word,
      direction: `${sourceLanguage}_${targetLanguage}`,
    })
    return response.data.translated_text[0]
  } catch (error) {
    console.error('Translate error:', error)
  }
}
