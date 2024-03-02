// import graylog2 from 'graylog2'
// import { hostname } from 'os'

// const gLogger = new graylog2.graylog({
//   servers: [
//     {
//       host: '',
//       port: 49514
//     }
//   ],
//   hostname: hostname() || 'node-radius',
//   facility: 'Radius'
// })

// gLogger.on('error', function (error) {
//   console.error(`(PID: ${process.pid}) Error while trying to write to graylog2:`, error)
// })

export const Logger = params => {
  console.log('LOG', params)
  // gLogger.log(params)
}

export default Logger
