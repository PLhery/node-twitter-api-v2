import { request } from 'http'

export default class TwitterApi {
  private _bearerToken;

  constructor(bearerToken: string) {
    this._bearerToken = bearerToken;
  }

  public get(url: string) {
    const req = request(url, {headers: {authorization: this._bearerToken}});

    let response = '';
    req.on('data', chunk => response += chunk);

    return new Promise((resolve, reject) => {
      req.on('error', (e) => reject(e));
      req.on('end', () => resolve(JSON.parse(response)));
    });
  }
}