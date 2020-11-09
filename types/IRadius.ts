export declare namespace IRadius {
  type Options = {
    authorizationPort: number
    accountingPort: number
    dictionary: []
    logger: {
      host: string
      port: number
    }
    [key: string]: any
  }

  type ClientRegistry = Pick<Client, 'ip' | 'secret' | 'name'>

  type Client = {
    ip: string
    secret: string
    name?: string
    address: string
    connection: {
      family: 'IPv4' | 'IPv6'
      port: number
      size: number
    }
  }
}
