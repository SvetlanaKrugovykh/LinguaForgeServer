const path = require('path')
require('dotenv').config()

const OUT_CATALOG = process.env.OUT_CATALOG || 'out'

function estimateReadingTime(text, wpm = 150) {
  const words = text.trim().split(/\s+/).length
  return (words / wpm) * 60
}

module.exports.splitTextByDuration = function (text, segmentDuration) {
  const words = text.trim().split(/\s+/)
  const segments = []
  let current = []

  for (const word of words) {
    current.push(word)
    const currentText = current.join(' ')
    if (estimateReadingTime(currentText) >= segmentDuration) {
      segments.push(currentText)
      current = []
    }
  }

  if (current.length) segments.push(current.join(' '))
  return segments
}


module.exports.splitTextToSentences = function (text, maxLength = 200) {
  const sentences = text.split(/[\.\?]/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)

  const result = []
  for (const sentence of sentences) {
    let currentPart = ''
    for (const word of sentence.split(' ')) {
      if ((currentPart + ' ' + word).trim().length <= maxLength) {
        currentPart = (currentPart + ' ' + word).trim()
      } else {
        if (currentPart) result.push(currentPart)
        currentPart = word
      }
    }
    if (currentPart) result.push(currentPart)
  }
  return result
}