module.exports.getTestOrOpusSchema = {
  description: 'Get Test or Opus',
  tags: ['Test', 'Opus'],
  summary: 'Get test or opus data',
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
          part1_3: { type: 'string', nullable: true },
          part4_6: { type: 'string', nullable: true },
          lang: { type: 'string' },
          isReturnFile: { type: 'boolean', nullable: true },
          total: { type: 'integer', nullable: true },
          size: { type: 'string', nullable: true },
        },
        required: ['userId', 'lang'],
        oneOf: [
          { required: ['part1_3', 'isReturnFile', 'total'] },
          { required: ['part4_6', 'size'] }
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
        data: { type: 'object' },
      },
      required: ['data'],
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