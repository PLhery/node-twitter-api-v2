import { ITwitterApiBeforeRequestConfigHookArgs, ITwitterApiClientPlugin } from '../types';
import { RateLimiter } from 'limiter';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const limiterTypes = {
  '15r/15m': {
    tokensPerInterval: 15,
    interval: FIFTEEN_MINUTES,
  },
  '75r/15m': {
    tokensPerInterval: 75,
    interval: FIFTEEN_MINUTES,
  },
  '180r/15m': {
    tokensPerInterval: 180,
    interval: FIFTEEN_MINUTES,
  },
};
type LimiterType = keyof typeof limiterTypes;

const endponts: Record<string, LimiterType> = {
  '/1.1/application/rate_limit_status.json': '180r/15m',
  '/2/users/me': '75r/15m',
  //TODO: Add more endpoints
};

type Limiters = {
  [key in LimiterType]?: RateLimiter;
}

class TwitterApiRateLimiterPlugin implements ITwitterApiClientPlugin {
  // Default limiter is set to 15 requests in a 15 minute window
  protected _limiters: Limiters = {};

  public async onBeforeRequestConfig({url}: ITwitterApiBeforeRequestConfigHookArgs){

    const { pathname } = url;

    // default to '15r/15m' limiter if endpoint is not in list
    const typeOfLimiter = endponts[pathname] || '15r/15m';
    const existingLimiter = this._limiters[typeOfLimiter];

    if(!existingLimiter){
      this._limiters[typeOfLimiter] = new RateLimiter(limiterTypes[typeOfLimiter]);
    }

    await this._limiters[typeOfLimiter]?.removeTokens(1);
  }

  public getActiveLimiters = () => this._limiters;

}

export default TwitterApiRateLimiterPlugin;