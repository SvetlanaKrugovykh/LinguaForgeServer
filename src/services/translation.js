const axios = require('axios')

module.exports.callTranslate = async function (text, direction) {
  try {

    if (!text || !direction || text.length < 7 || direction.length < 5) {
      console.log('Invalid text or direction:', { text, direction })
      return
    }

    const THROUGH_TOKEN = process.env.THROUGH_TOKEN
    const EMAIL = process.env.EMAIL

    let translatedText = text
    const directions = direction.includes('en') ? [direction] : [
      `${direction.split('_')[0]}_en`,
      `en_${direction.split('_')[1]}`
    ]

    for (const dir of directions) {
      const response = await axios.post(process.env.THROUGH_URL, {
        serviceId: "Translate-txt-to-txt",
        clientId: "Speech-to-TXT-Server",
        email: EMAIL,
        direction: dir,
        text: translatedText,
        token: THROUGH_TOKEN
      }, {
        headers: {
          Authorization: `${THROUGH_TOKEN}`
        }
      })
      translatedText = response.data?.replyData?.translated_text?.[0] || 'Default value if not found'
    }

    console.log(translatedText)
    return translatedText

  } catch (error) {
    console.error('Error translating text:', error)
  }
}