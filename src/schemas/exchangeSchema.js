module.exports.coToJestSchema = {
  description: 'Get Definition',
  tags: ['Definition'],
  summary: 'Get definition of a word',
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
      text: { type: 'string' },
    },
    required: ['text'],
  },
  response: {
    201: {
      description: 'Successful response',
      type: 'object',
      properties: {
        definition: { type: 'string' },
      },
      required: ['definition'],
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