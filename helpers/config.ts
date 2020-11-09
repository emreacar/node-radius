import { IRadius } from './../types'

const config: IRadius.Options = {
  authorizationPort: 1812,
  accountingPort: 1813,
  requestPort: 16379,
  dictionary: [],
  logLevels: {
    error: 1,
    info: 1,
    debug: 1,
    request: 1,
    response: 1
  },
  logLevel: 'debug',
  logFilename: 'logs/combined.log'
}

export const ConfigMan = {
  init: (customOptions = {}): IRadius.Options => {
    return {
      ...config,
      ...customOptions
    }
  },
  set: (key, value) => {
    config[key] = value
  },
  get: key => {
    return config[key] || false
  }
}

export default ConfigMan