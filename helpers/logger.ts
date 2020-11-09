import { createLogger, format, transports } from 'winston'
import ConfigMan from './config'
const { combine, timestamp, json } = format

const levels = {
  error: 0,
  info: 1,
  request: 2,
  response: 3,
  debug: 4
}

const winLogger = createLogger({
  levels,
  level: ConfigMan.get('logLevel'),
  format: combine(timestamp(), json()),
  defaultMeta: { service: 'radius' },
  transports: [new transports.File({ filename: ConfigMan.get('logFilename') })]
})

export const Logger = params => winLogger.log(params)

export default Logger
