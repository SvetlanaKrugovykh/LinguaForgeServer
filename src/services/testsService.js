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
module.exports.getSubjects = async function () {
  try {
    const result = await db.getSubjects()
    return result
  } catch (error) {
    console.error('Error getting subjects:', error)
    return null
  }
}

module.exports.getTestData = async function (body) {
  try {
    const data = body.query
    const userId = data.userId
    const taskId = data?.taskId || null
    const checkTest = data?.checkTest || false
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


    const result = await db.getTasks(topic, level, source, userId, taskId)
    if (!result || result.length === 0) return null
    if (checkTest) {
      const checkData = await module.exports.checkTestQuality(result[0])
      if (checkData) result[0].checkData = checkData
    }

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
    const opusId = data?.opusId || null
    const source = 'TELC'
    const level = 'B1-B2'
    let topic = 'Pisanie'
    const size = data.size

    if (data.part4_6 === '5') topic = 'Mówienie'
    if (data.part4_6 === '6') topic = 'Słownictwo'

    const result = await db.getOpuses(topic, level, source, size, userId, opusId)
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

module.exports.checkTestQuality = async function (data) {
  const checkData = executeResult(data, `pl`)
  return checkData
}


async function executeResult(result, _lang) {

  try {
    const checkData = {}
    let optionsWithPrawdaFalsz
    if (result?.options) {
      optionsWithPrawdaFalsz = result.options.replace(/prawda\/fałsz/g, 'a) prawda b) fałsz')
    } else {
      optionsWithPrawdaFalsz = 'a) b) c)'
    }

    const options = optionsWithPrawdaFalsz.split(/(?=\s[a-z]\))/).map(option => `${option.trim()}`).join('\n').replace('a)', '\na)')
    if (!result?.text) return "!!!TEXT not filled!!!"
    const formattedText = result.text.replace(/(\d{1,3}\.)/g, '\n\n$1')

    const updatedOptions = options.replace(/(\d{1,3}\.)/g, '\n\n$1')
    const question = `${formattedText}\n\n}${updatedOptions}`

    const numberMatchesText = formattedText.match(/\d{1,3}\./g)
    const numberMatchesOptions = updatedOptions.match(/\d{1,3}\./g)
    const numberMatches = [...new Set([...(numberMatchesText || []), ...(numberMatchesOptions || [])])]
    let numbers = numberMatches.map(num => num.trim().replace('.', '')).sort((a, b) => a - b)

    const letterMatchesText = formattedText.match(/[a-z]\)/g)
    const letterMatchesOptions = updatedOptions.match(/[a-z]\)/g)
    const letterMatches = [...new Set([...(letterMatchesText || []), ...(letterMatchesOptions || [])])]
    let letters = letterMatches.map(letter => letter[0]).sort()

    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')
    letters = alphabet.filter(letter => {
      const lastLetter = letters[letters.length - 1]
      return letter <= lastLetter && !letters.includes(letter)
    }).concat(letters)

    if (numbers.length === 0 && letters.length > 0) {
      numbers = ['1']
    }

    if (letters.length === 0 && numbers.length > 0) {
      letters = ['a', 'b', 'c']
    }

    const keyboard = []
    numbers.forEach(num => {
      const row = []
      letters.forEach(letter => {
        row.push({ text: `${num}▫${letter}` })
      })
      keyboard.push(row)
    })

    checkData.question = question
    checkData.numbers = numbers
    checkData.letters = letters
    checkData.keyboard = keyboard
    checkData.correct = result.correct.replace(/(\d{1,3}\.)\s*prawda/g, '$1 a)').replace(/(\d{1,3}\.)\s*fałsz/g, '$1 b)')

    const correctNumbers = (result.correct.match(/\d{1,3}\./g) || []).map(num => num.trim().replace('.', '')).sort((a, b) => a - b)
    const correctLetters = (result.correct.match(/[a-z](?=\s)/g) || []).map(letter => letter[0]).sort()
    checkData.correctNumbers = correctNumbers
    checkData.correctLetters = correctLetters

    if (numbers.length > 1) {
      const differences = numbers.filter(num => !correctNumbers.includes(num)).concat(correctNumbers.filter(num => !numbers.includes(num)))
      if (differences.length > 0) {
        checkData.differences = differences
        console.log('!!! Discrepancies found between numbers and correctNumbers!!!:', differences)
      }
    }

    return checkData
  } catch (error) {
    console.error(error)
  }
}