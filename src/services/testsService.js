const db = require('../db/requests')
const gTTsService = require('./gTTsService')
const { mergeMP3Files } = require('./mergeService')

module.exports.addNewTest = async function (body) {
  try {
    const result = await db.addNewTest(body)
    return result
  } catch (error) {
    console.error('Error adding new test:', error)
    return null
  }
}

module.exports.getTestData = async function (body) {
  try {
    const data = body.query
    const userId = data.userId
    const source = 'TELC'
    const level = 'B1-B2'
    let topic = 'Rozumienie tekstów pisanych'

    switch (data.part1_3) {
      case '1':
        topic = 'ROZUMIENIE ZE SŁUCHU'
        break
      case '2':
        topic = 'Rozumienie tekstów pisanych'
        break
      case '3':
        topic = 'POPRAWNOŚĆ GRAMATYCZNA'
        break
    }


    const result = await db.getTasks(topic, level, source, userId)
    if (!result || result.length === 0) return null


    if (data.part1_3 === '1') {
      return await saveVoiceTask(data, result[0])
    } else {
      return result[0]
    }

  } catch (error) {
    console.error('Error getting test data:', error)
    return null
  }
}

module.exports.getOpusData = async function (body) {
  try {
    const data = body.query
    const userId = data.userId
    const source = 'TELC'
    const level = 'B1-B2'
    let topic = 'Pisanie'
    const size = data.size

    if (data.part4_6 === '5') topic = 'Mówienie'
    if (data.part4_6 === '6') topic = 'Słownictwo'

    const result = await db.getOpuses(topic, level, source, size, userId)
    if (!result || result.length === 0) return null

    return result

  } catch (error) {
    console.error('Error getting test data:', error)
    return null
  }
}


async function saveVoiceTask(data, result) {
  const { userId, lang } = data
  try {
    const sentences = result.text.split(/[\.\?]/).map(sentence => sentence.trim()).filter(sentence => sentence.length > 0)
    const queries = sentences.map(sentence => ({
      userId: userId,
      text: sentence,
      lang: lang
    }))

    const results = await gTTsService.gTTs(queries)
    const fileNamesArray = results.map(result => result.filePath)
    const outputFile = await mergeMP3Files(userId, fileNamesArray)

    result.audio = outputFile
    return result
  } catch (error) {
    console.error('Error saving voice task:', error)
    return null
  }
}

module.exports.setUserData = async function (body) {
  try {
    const data = body.query
    const result = await db.setUserTasksData(data)
    return result
  } catch (error) {
    console.error('Error setting user data:', error)
    return null
  }
}