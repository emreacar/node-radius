const logger = require('debug')

const error = logger('error')
const info = logger('info')
const debug = logger('debug')

/**
 * Add ENV Variable for set enabled log levels,
 * @example DEBUG=info, debug... for multiple level sperate commas.
 */
// logger.enable('info, debug, error')

export default {
  info,
  debug,
  error
}