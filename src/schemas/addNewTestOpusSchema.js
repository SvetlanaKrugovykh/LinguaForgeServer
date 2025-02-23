module.exports.addNewOpusSchema = {
  description: 'Add New Opus',
  tags: ['Opus'],
  summary: 'Add a new opus',
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
      topic: { type: 'string' },
      level: { type: 'string' },
      source: { type: 'string' },
      year: { type: 'integer' },
      type: { type: 'string' },
      value: { type: 'string' },
      total_topic: { type: 'integer' },
      task_number: { type: 'integer' },
      tasks_count: { type: 'integer' },
      text: { type: 'string' },
      options: { type: 'string' },
      correct: { type: 'string' },
      explanation: { type: 'string' },
    },
    required: ['topic', 'level', 'source', 'year', 'type', 'value', 'total_topic', 'task_number', 'tasks_count', 'text', 'options', 'correct', 'explanation'],
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