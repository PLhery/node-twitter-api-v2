import type { TwitterRateLimit, TwitterResponse } from '../types';
import type { ClientRequest, IncomingMessage, IncomingHttpHeaders } from 'http';

export interface ErrorV1 {
  code: number;
  message: string;
}

export interface ErrorV2 {
  value?: string;
  detail: string;
  title: string;
  resource_type?: string;
  parameter?: string;
  resource_id?: string;
  reason?: string;
  type: string;
}

export type TRequestError = TwitterApiRequestError | TwitterApiError;

export interface TwitterErrorPayload<T = any> {
  request: ClientRequest;
  rawResponse?: IncomingMessage;
  response?: TwitterResponse<T>;
  error?: Error;
}

export interface TwitterApiErrorData {
  errors: (ErrorV1 | ErrorV2)[];
  title?: string;
  detail?: string;
  type?: string;
}

export enum ETwitterApiError {
  Request = 'request',
  Response = 'response',
}

/* OLD ERRORS INTERFACES */

export interface TwitterApiRequestError {
  type: ETwitterApiError.Request;
  error: true;
  requestError: Error;
}

export interface TwitterApiError extends TwitterResponse<TwitterApiErrorData> {
  type: ETwitterApiError.Response;
  error: true;
  /** HTTP status code */
  code: number;
}

/* ERRORS INSTANCES */

abstract class ApiError extends Error {
  abstract type: ETwitterApiError.Request | ETwitterApiError.Response;
  abstract request: ClientRequest;
  error = true as const;
}

interface IBuildApiRequestError {
  request: ClientRequest;
  error: Error;
}

export class ApiRequestError extends ApiError implements TwitterApiRequestError {
  type = ETwitterApiError.Request as const;
  request: ClientRequest;
  requestError: Error;

  constructor(message: string, options: IBuildApiRequestError) {
    super(message);

    Error.captureStackTrace(this, this.constructor);

    this.request = options.request;
    this.requestError = options.error;
  }
}

interface IBuildApiResponseError {
  code: number;
  request: ClientRequest;
  response: IncomingMessage;
  headers: IncomingHttpHeaders;
  data: TwitterApiErrorData;
  rateLimit?: TwitterRateLimit;
}

export class ApiResponseError extends ApiError implements TwitterApiError, IBuildApiResponseError {
  type = ETwitterApiError.Response as const;
  /** HTTP error code */
  code: number;
  request: ClientRequest;
  response: IncomingMessage;
  headers: IncomingHttpHeaders;
  data: TwitterApiErrorData;
  rateLimit?: TwitterRateLimit;

  constructor(message: string, options: IBuildApiResponseError) {
    super(message);

    Error.captureStackTrace(this, this.constructor);

    this.code = options.code;
    this.request = options.request;
    this.response = options.response;
    this.headers = options.headers;
    this.rateLimit = options.rateLimit;
    this.data = options.data;
  }

  /** Check for presence of one of given v1 error codes. Does **not** work with v2 errors! */
  hasErrorCode(...codes: (EApiV1ErrorCode | number)[]) {
    const errors = this.errors;

    if (!errors?.length || !('code' in errors[0])) {
      return false;
    }

    const v1errors = errors as ErrorV1[];
    return v1errors.some(error => codes.includes(error.code));
  }

  get errors(): (ErrorV1 | ErrorV2)[] | undefined {
    return this.data?.errors;
  }

  get rateLimitError() {
    return this.code === 420 || this.code === 429;
  }

  get isAuthError() {
    if (this.code === 401) {
      return true;
    }

    return this.hasErrorCode(
      EApiV1ErrorCode.AuthTimestampInvalid,
      EApiV1ErrorCode.AuthenticationFail,
      EApiV1ErrorCode.BadAuthenticationData,
      EApiV1ErrorCode.InvalidOrExpiredToken,
    );
  }
}

export enum EApiV1ErrorCode {
  // Location errors
  InvalidCoordinates = 3,
  NoLocationFound = 13,

  // Authentification failures
  AuthenticationFail = 32,
  InvalidOrExpiredToken = 89,
  UnableToVerifyCredentials = 99,
  AuthTimestampInvalid = 135,
  BadAuthenticationData = 215,

  // Resources not found or visible
  NoUserMatch = 17,
  UserNotFound = 50,
  ResourceNotFound = 34,
  TweetNotFound = 144,
  TweetNotVisible = 179,
  NotAllowedResource = 220,
  MediaIdNotFound = 325,
  TweetNoLongerAvailable = 421,
  TweetViolatedRules = 422,

  // Account errors
  TargetUserSuspended = 63,
  YouAreSuspended = 64,
  AccountUpdateFailed = 120,
  NoSelfSpamReport = 36,
  NoSelfMute = 271,
  AccountLocked = 326,

  // Application live errors / Twitter errors
  RateLimitExceeded = 88,
  NoDMRightForApp = 93,
  OverCapacity = 130,
  InternalError = 131,
  TooManyFollowings = 161,
  TweetLimitExceeded = 185,
  DuplicatedTweet = 187,
  TooManySpamReports = 205,
  RequestLooksLikeSpam = 226,
  NoWriteRightForApp = 261,
  TweetActionsDisabled = 425,
  TweetRepliesRestricted = 433,

  // Invalid request parameters
  NamedParameterMissing = 38,
  InvalidAttachmentUrl = 44,
  TweetTextTooLong = 186,
  MissingUrlParameter = 195,
  NoMultipleGifs = 323,
  InvalidMediaIds = 324,
  InvalidUrl = 407,
  TooManyTweetAttachments = 386,

  // Already sent/deleted item
  StatusAlreadyFavorited = 139,
  FollowRequestAlreadySent = 160,
  CannotUnmuteANonMutedAccount = 272,
  TweetAlreadyRetweeted = 327,
  ReplyToDeletedTweet = 385,

  // DM Errors
  DMReceiverNotFollowingYou = 150,
  UnableToSendDM = 151,
  MustAllowDMFromAnyone = 214,
  CannotSendDMToThisUser = 349,
  DMTextTooLong = 354,

  // Appication misconfiguration
  SubscriptionAlreadyExists = 355,
  CallbackUrlNotApproved = 415,
  SuspendedApplication = 416,
  OobOauthIsNotAllowed = 417,
}

export enum EApiV2ErrorCode {
  // Request errors
  InvalidRequest = 'https://api.twitter.com/2/problems/invalid-request',
  ClientForbidden = 'https://api.twitter.com/2/problems/client-forbidden',
  UnsupportedAuthentication = 'https://api.twitter.com/2/problems/unsupported-authentication',

  // Stream rules errors
  InvalidRules = 'https://api.twitter.com/2/problems/invalid-rules',
  TooManyRules = 'https://api.twitter.com/2/problems/rule-cap',
  DuplicatedRules = 'https://api.twitter.com/2/problems/duplicate-rules',

  // Twitter errors
  RateLimitExceeded = 'https://api.twitter.com/2/problems/usage-capped',
  ConnectionError = 'https://api.twitter.com/2/problems/streaming-connection',
  ClientDisconnected = 'https://api.twitter.com/2/problems/client-disconnected',
  TwitterDisconnectedYou = 'https://api.twitter.com/2/problems/operational-disconnect',

  // Resource errors
  ResourceNotFound = 'https://api.twitter.com/2/problems/resource-not-found',
  ResourceUnauthorized = 'https://api.twitter.com/2/problems/not-authorized-for-resource',
  DisallowedResource = 'https://api.twitter.com/2/problems/disallowed-resource',
}
