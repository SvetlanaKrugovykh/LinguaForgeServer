const gTTsService = require('../services/gTTsService')
const translationService = require('../services/translateService')
const analizeService = require('../services/analize')
const { mergeMP3Files } = require('../services/mergeService')
const fs = require('fs')
const path = require('path')

const MAX_FILE_SIZE = 5 * 1024 * 1024

module.exports.gTTs = async function (request, reply) {
  try {
    const { query } = request.body
    const sentences = query.text.split(/[\.\?]/).map(sentence => sentence.trim()).filter(sentence => sentence.length > 0)
    const queries = sentences.map(sentence => ({
      userId: query.userId,
      text: sentence,
      lang: query.lang
    }))

    const results = await gTTsService.gTTs(queries)
    const fileNamesArray = results.map(result => result.filePath)
    const outputFile = await mergeMP3Files(query.userId, fileNamesArray)

    if (outputFile && fs.existsSync(outputFile)) {
      const fileBuffer = fs.readFileSync(outputFile)
      if (fileBuffer.length > MAX_FILE_SIZE) {
        return reply.status(413).send({ error: 'File too large', details: `The generated file exceeds the size limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB` })
      }
      const base64File = fileBuffer.toString('base64')
      return reply.send({ file: base64File })
    } else {
      return reply.status(500).send({ error: 'Error processing request', details: 'Output file not found or invalid' })
    }
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.coToJest = async function (request, reply) {
  try {
    const { text } = request.body
    const data = await analizeService.checkText(text)
    if (data?.traslated && data.traslated === true) return reply.send(data)

    const results = await translationService.g_translateText(text, 'pl', 'en')
    return reply.send(results)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}
