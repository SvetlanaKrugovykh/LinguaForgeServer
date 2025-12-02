module.exports.userGetSchema = {
  description: 'Get User Data',
  tags: ['User'],
  summary: 'Get user data',
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
      chat_id: { type: 'integer' },
    },
    required: ['chat_id'],
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