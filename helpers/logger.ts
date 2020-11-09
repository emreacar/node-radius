import graylog2 from 'graylog2'
import ConfigMan from './config'

const gLogger = new graylog2.graylog({
  servers: [{ host: 'nglog.turancoskun.com', port: 49514 }],
  hostname: 'node-radius',
  facility: 'Radius'
})

gLogger.on('error', function (error) {
  console.error('Error while trying to write to graylog2:', error)
})

export const Logger = params => {
  gLogger.log(params)
}

export default Logger
