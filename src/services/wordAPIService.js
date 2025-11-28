const axios = require('axios')
const { GoogleAuth } = require('google-auth-library')
const path = require('path')
const { getCredentials } = require('../guards/getCredentials')
require('dotenv').config()


const GOOGLE_LANGUAGE_API_SCOPE = process.env.GOOGLE_LANGUAGE_API_SCOPE

// Get Google Cloud access token using service account
async function getAccessToken() {
  const serviceAccount = getCredentials()
  const auth = new GoogleAuth({
    credentials: serviceAccount,
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
