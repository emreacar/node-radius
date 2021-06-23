import { IRadius } from './../types'

const config: IRadius.Options = {
  authorizationPort: 1812,
  accountingPort: 1813,
  requestPort: 16379,
  dictionary: [],
  logLevels: {
    console: 1,
    error: 1,
    info: 1,
    packet: 1,
    debug: 1
  }
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
