import * as crypto from 'crypto';

export class OAuth2Helper {
  static getCodeVerifier() {
    return this.generateRandomString(128);
  }

  static getCodeChallengeFromVerifier(verifier: string) {
    return this.escapeBase64Url(
      crypto
        .createHash('sha256')
        .update(verifier)
        .digest('base64'),
    );
  }

  static getAuthHeader(clientId: string, clientSecret: string) {
    const key = encodeURIComponent(clientId) + ':' + encodeURIComponent(clientSecret);
    return Buffer.from(key).toString('base64');;
  }

  static generateRandomString(length: number) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    for (let i = 0; i < length; i++) {
      text += possible[Math.floor(Math.random() * possible.length)];
    }
    return text;
  }

  private static escapeBase64Url(string: string) {
    return string.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
}
