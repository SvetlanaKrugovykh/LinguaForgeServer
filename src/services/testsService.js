const db = require('../db/requests')
module.exports.getTestData = async function (body) {
  try {

    const data = body.query
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


    const result = await db.getTasks(topic, level, source)

    if (data.total === '1') {
      return result[0]
    } else {
      return result
    }

  } catch (error) {
    console.error('Error getting test data:', error)
    return null
  }
}