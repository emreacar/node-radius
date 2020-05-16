import logger from 'debug';

/**
 * Add ENV Variable for set enabled log levels,
 * @example DEBUG=info, debug... for multiple level sperate commas.
 */

// logger.enable('info, debug, error')

export const error = logger('error');
export const info = logger('info');
export const debug = logger('debug');
