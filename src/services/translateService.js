const axios = require('axios')
require('dotenv').config()

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
