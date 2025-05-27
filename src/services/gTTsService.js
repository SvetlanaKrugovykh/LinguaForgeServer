require('dotenv').config()
const googleTTS = require("google-tts-api")
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports.gTTs = async (queries) => {
  const results = []
  const gURL = process.env.GOOGLE_TTS_URL
  const TEMP_CATALOG = process.env.TEMP_CATALOG

  if (!fs.existsSync(TEMP_CATALOG)) {
    fs.mkdirSync(TEMP_CATALOG)
    await sleep(200)
  }

  if (queries.length && queries[0].text && queries[0].text.length > 0) {
    try {
      const warmupUrl = googleTTS.getAudioUrl('test', {
        lang: queries[0].lang || 'en',
        slow: false,
        host: gURL,
      })
      await axios.get(warmupUrl)
      await sleep(200)
    } catch (e) {
      console.warn('Google TTS warmup failed:', e.message)
    }
  }

  for (const query of queries) {
    const { userId, text, lang } = query
    let filePath = ''
    let success = false
    let lastError = null

    for (let attempt = 1; attempt <= 3; attempt++) {
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

        filePath = path.join(TEMP_CATALOG, `${userId}_${Date.now()}_${lang}.mp3`)
        const writer = fs.createWriteStream(filePath)
        response.data.pipe(writer)

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve)
          writer.on('error', reject)
        })

        await sleep(50)

        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath)
          if (stats.size > 100) {
            success = true
            break
          } else {
            fs.unlinkSync(filePath)
            console.warn(`Attempt ${attempt}: File too small for text: "${text}"`)
          }
        } else {
          console.warn(`Attempt ${attempt}: File not created for text: "${text}"`)
        }
      } catch (error) {
        lastError = error
        console.warn(`Attempt ${attempt} failed for text: "${text}"`, error.message)
        await sleep(100)
      }
    }

    if (success) {
      results.push({ text, lang, filePath })
    } else {
      results.push({ text, lang, error: lastError ? lastError.message : 'Failed to generate file' })
      console.error(`Failed to generate TTS for text: "${text}" after 3 attempts`)
    }
  }

  return results
}