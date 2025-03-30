module.exports = {
  description: 'Exchange Rate Operations',
  tags: ['Exchange Rate'],
  summary: 'Get or Set exchange rates',
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
      currency: { type: 'string', description: 'Currency code (e.g., UAH, USD)' },
      rate_to_pln: { type: 'number', description: 'Exchange rate to PLN' },
      date: { type: 'string', format: 'date', description: 'Date for the exchange rate (YYYY-MM-DD)' },
    },
    required: ['currency', 'rate_to_pln', 'date'],
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