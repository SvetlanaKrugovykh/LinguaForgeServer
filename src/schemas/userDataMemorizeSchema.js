module.exports.userDataMemorizeSchema = {
  description: 'Memorize User Data',
  tags: ['User'],
  summary: 'Memorize user data',
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
          part: { type: 'string' },
          lang: { type: 'string' },
          currentTest: { type: 'object', nullable: true },
          currentOpus: { type: 'object', nullable: true },
          success: { type: 'integer' },
        },
        required: ['userId', 'part', 'lang', 'success'],
        oneOf: [
          { required: ['currentTest'] },
          { required: ['currentOpus'] }
        ],
      },
    },
    required: ['query'],
  },
  response: {
    201: {
      description: 'Successful response',
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      required: ['message'],
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