module.exports.userSetSchema = {
  description: 'Set User Data',
  tags: ['User'],
  summary: 'Set user data',
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
      user_id: { type: 'integer' },
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      username: { type: 'string' },
      language_code: { type: 'string' },
    },
    required: ['user_id', 'first_name', 'last_name', 'username', 'language_code'],
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