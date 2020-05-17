declare namespace Radius {
  type Options = {
    authorizationPort: number;
    accountingPort: number;
    [key: string]: any;
  };

  type ClientRegistry = Pick<Client, 'ip' | 'secret' | 'name'>;

  type Client = {
    ip: string;
    secret: string;
    name?: string;
    address: string;
    connection: {
      family: 'IPv4' | 'IPv6';
      port: number;
      size: number;
    };
  };
}
