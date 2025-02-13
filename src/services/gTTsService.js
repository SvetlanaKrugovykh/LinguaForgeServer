require('dotenv').config()
const googleTTS = require("google-tts-api")
const axios = require('axios')
const fs = require('fs')
const path = require('path')

module.exports.gTTs = async (queries) => {
  const results = []
  const gURL = process.env.GOOGLE_TTS_URL
  const TEMP_CATALOG = process.env.TEMP_CATALOG

  if (!fs.existsSync(TEMP_CATALOG)) {
    fs.mkdirSync(TEMP_CATALOG)
  }

  for (const query of queries) {
    const { userId, text, lang } = query
    try {
      const url = googleTTS.getAudioUrl(text, {
        lang: lang,
        slow: false,
        host: gURL,
      })

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
      })

      const filePath = path.join(TEMP_CATALOG, `${userId}_${Date.now()}_${lang}.mp3`)
      const writer = fs.createWriteStream(filePath)

      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      results.push({ text, lang, filePath })
    } catch (error) {
      console.error(`Error generating TTS for text: ${text}`, error)
      results.push({ text, lang, error: error.message })
    }
  }

  return results
}