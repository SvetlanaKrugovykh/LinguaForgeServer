const axios = require('axios')
const { google } = require('google-auth-library')
const path = require('path')

require('dotenv').config()

const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS
const GOOGLE_LANGUAGE_API_SCOPE = process.env.GOOGLE_LANGUAGE_API_SCOPE

// Get Google Cloud access token using service account
async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: [GOOGLE_LANGUAGE_API_SCOPE]
  })
  const client = await auth.getClient()
  const accessToken = await client.getAccessToken()
  return accessToken.token
}

/**
 * Analyze a single word using Google Cloud Natural Language API
 * @param {string} word - Word to analyze
 * @param {string} language - Language code (pl, en, fr, ru...)
 * @returns {Promise<Object>} - Analysis result
 */
async function analyzeOneWord(word, language = 'ru') {
  const accessToken = await getAccessToken()
  const apiUrl = process.env.GOOGLE_LANGUAGE_API_URL
  const apiResp = await axios.post(
    apiUrl,
    {
      document: { type: 'PLAIN_TEXT', language, content: word },
      encodingType: 'UTF8'
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 8000
    }
  )
  return apiResp.data
}

module.exports = { analyzeOneWord }
