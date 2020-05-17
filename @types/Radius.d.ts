declare namespace Radius {
  type Options = {
    authorizationPort: number;
    accountingPort: number;
    [key: string]: any;
  };

  type Client = {
    ip: string;
    secret: string;
    address: string;
    connection: {
      family: 'IPv4' | 'IPv6';
      port: number;
      size: number;
    };
  };
}
