import graylog2 from 'graylog2'

const gLogger = new graylog2.graylog({
  servers: [
    {
      host: 'nglog.turancoskun.com',
      port: 49514
    }
  ],
  hostname: 'node-radius',
  facility: 'Radius'
})

gLogger.on('error', function (error) {
  console.error('Error while trying to write to graylog2:', error)
})

export const Logger = params => {
  console.log(params)
  // gLogger.log(params)
}

export default Logger
