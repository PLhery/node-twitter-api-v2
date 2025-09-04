import 'mocha';
import { expect } from 'chai';
import { RequestHandlerHelper } from '../src/client-mixins/request-handler.helper';
import type { IncomingMessage } from 'http';

class TestRequestHandlerHelper extends RequestHandlerHelper<any> {
  public parse(res: IncomingMessage) {
    return this.getRateLimitFromResponse(res);
  }
}

describe('Rate limit parsing', () => {
  it('includes user 24-hour limits when present', () => {
    const helper = new TestRequestHandlerHelper({
      url: new URL('https://example.com'),
      options: {},
    } as any);

    const res = {
      headers: {
        'x-rate-limit-limit': '15',
        'x-rate-limit-remaining': '14',
        'x-rate-limit-reset': '100',
        'x-app-limit-24hour-limit': '5000',
        'x-app-limit-24hour-remaining': '4999',
        'x-app-limit-24hour-reset': '200',
        'x-user-limit-24hour-limit': '1000',
        'x-user-limit-24hour-remaining': '999',
        'x-user-limit-24hour-reset': '300',
      },
    } as unknown as IncomingMessage;

    const rateLimit = helper.parse(res)!;
    expect(rateLimit.limit).to.equal(15);
    expect(rateLimit.day).to.deep.equal({ limit: 5000, remaining: 4999, reset: 200 });
    expect(rateLimit.userDay).to.deep.equal({ limit: 1000, remaining: 999, reset: 300 });
  });
});

