const gTTsService = require('../services/gTTsService')
const analizeService = require('../services/analize')
const testsService = require('../services/testsService')
const opusService = require('../services/opusService')
const usersService = require('../services/usersService')
const { mergeMP3Files } = require('../services/mergeService')
const fs = require('fs')
const path = require('path')

const MAX_FILE_SIZE = 5 * 1024 * 1024


module.exports.userSettingsSave = async function (request, reply) {
  try {
    const body = request.body
    const dataArray = await usersService.saveUserSet(body)

    return reply.send(dataArray)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.addNewTest = async function (request, reply) {
  try {
    const body = request.body
    const dataArray = await testsService.addNewTest(body)
    return reply.send(dataArray)
  }
  catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.addNewOpus = async function (request, reply) {
  try {
    const body = request.body
    const dataArray = await opusService.addNewOpus(body)
    return reply.send(dataArray)
  }
  catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}
module.exports.getSubjects = async function (request, reply) {
  try {
    const dataArray = await testsService.getSubjects()
    return reply.send(dataArray)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.gTTs = async function (request, reply) {
  try {
    const { query } = request.body
    const sentences = query.text.split(/[\.\?]/).map(sentence => sentence.trim()).filter(sentence => sentence.length > 0)

    const splitSentence = (sentence, maxLength) => {
      const parts = [];
      let currentPart = ''

      sentence.split(' ').forEach(word => {
        if ((currentPart + ' ' + word).trim().length <= maxLength) {
          currentPart = (currentPart + ' ' + word).trim();
        } else {
          parts.push(currentPart);
          currentPart = word;
        }
      })

      if (currentPart) {
        parts.push(currentPart);
      }

      return parts
    }

    const queries = sentences.flatMap(sentence => splitSentence(sentence, 200).map(part => ({
      userId: query.userId,
      text: part,
      lang: query.lang
    })))

    const results = await gTTsService.gTTs(queries)
    const fileNamesArray = results.map(result => result.filePath)
    const outputFile = await mergeMP3Files(query.userId, fileNamesArray)

    if (outputFile && fs.existsSync(outputFile)) {
      if (query?.isReturnFile === true) {
        const fileBuffer = fs.readFileSync(outputFile)
        if (fileBuffer.length > MAX_FILE_SIZE) {
          return reply.status(413).send({ error: 'File too large', details: `The generated file exceeds the size limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB` })
        }
        const base64File = fileBuffer.toString('base64')
        return reply.send({ file: base64File })
      } else {
        return reply.send({ message: `File ${path.basename(outputFile)} saved successfully`, filename: outputFile })
      }
    } else {
      return reply.status(500).send({ error: 'Error processing request', details: 'Output file not found or invalid' })
    }
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.coToJest = async function (request, reply) {
  try {
    const { text, userId } = request.body
    const dataArray = await analizeService.checkText(text, userId)

    return reply.send(dataArray)


  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.wordEdit = async function (request, reply) {
  try {
    const { data } = request.body
    const dataArray = await analizeService.wordEditor(data)

    return reply.send(dataArray)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.getTest = async function (request, reply) {
  try {
    const dataArray = await testsService.getTestData(request.body)

    return reply.send(dataArray)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}


module.exports.getOpus = async function (request, reply) {
  try {
    const dataArray = await testsService.getOpusData(request.body)

    return reply.send(dataArray)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.userDataMemorize = async function (request, reply) {
  try {
    const dataArray = await testsService.setUserData(request.body)

    return reply.send(dataArray)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.userOpusSave = async function (request, reply) {
  try {
    const body = request.body
    const dataArray = await opusService.saveUserOpusSet(body)

    return reply.send(dataArray)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}

module.exports.userWordSave = async function (request, reply) {
  try {
    const body = request.body
    const dataArray = await opusService.saveUserWord(body)

    return reply.send(dataArray)
  } catch (error) {
    reply.status(500).send({ error: 'Error processing request', details: error.message })
  }
}