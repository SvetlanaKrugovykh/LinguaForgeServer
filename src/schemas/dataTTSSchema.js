module.exports = {
  description: 'Generate TTS',
  tags: ['TTS'],
  summary: 'Generate TTS from text',
  headers: {
    type: 'object',
    properties: {
      Authorization: { type: 'string' },
    },
    required: ['Authorization'],
  },
  body: {
    type: 'object',
    properties: {
      query: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          text: { type: 'string' },
          lang: { type: 'string' },
          isReturnFile: { type: 'boolean' },
        },
        required: ['userId', 'text', 'lang', 'isReturnFile'],
      },
    },
    required: ['query'],
  },
  response: {
    201: {
      description: 'Successful response',
      type: 'object',
      properties: {
        file: { type: 'string' },
      },
      required: ['file'],
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        statusCode: { type: 'integer' },
        error: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['statusCode', 'error', 'message'],
    },
  },
}