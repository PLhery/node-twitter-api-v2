import { EventEmitter } from 'events';
import type { IncomingMessage, ClientRequest } from 'http';
import { RequestHandlerHelper, TRequestFullData } from '../client-mixins/request-maker.mixin';
import { ETwitterStreamEvent } from '../types';
import TweetStreamParser, { EStreamParserEvent } from './TweetStreamParser';

interface ITweetStreamError {
  type: ETwitterStreamEvent.ConnectionError | ETwitterStreamEvent.TweetParseError;
  error: Error;
}

export class TweetStream<T = any> extends EventEmitter {
  public autoReconnect = false;
  public autoReconnectRetries = 5;
  protected retryTimeout?: NodeJS.Timeout;
  protected parser = new TweetStreamParser();

  constructor(
    protected req: ClientRequest,
    protected res: IncomingMessage,
    protected requestData: TRequestFullData,
  ) {
    super();

    this.initEventsFromParser();
    this.initEventsFromRequest();
  }

  // Event typings
  on(event: ETwitterStreamEvent.Data, handler: (data: T) => any): this;
  on(event: ETwitterStreamEvent.Error, handler: (errorPayload: ITweetStreamError) => any): this;
  on(event: ETwitterStreamEvent.ConnectionError, handler: (error: Error) => any): this;
  on(event: ETwitterStreamEvent.TweetParseError, handler: (error: Error) => any): this;
  on(event: ETwitterStreamEvent.ConnectionClosed, handler: () => any): this;
  on(event: ETwitterStreamEvent.DataKeepAlive, handler: () => any): this;
  on(event: ETwitterStreamEvent.ReconnectError, handler: (tries: number) => any): this;
  on(event: ETwitterStreamEvent.ReconnectLimitExceeded, handler: () => any): this;
  on(event: string | symbol, handler: (...args: any[]) => any): this;
  on(event: string | symbol, handler: (...args: any[]) => any) {
    return super.on(event, handler);
  }

  protected initEventsFromRequest() {
    const errorHandler = (err: any) => {
      this.emit(ETwitterStreamEvent.ConnectionError, err);
      this.emit(ETwitterStreamEvent.Error, {
        type: ETwitterStreamEvent.ConnectionError,
        error: err,
      });

      this.onConnectionError();
    };

    this.req.on('error', errorHandler);
    this.res.on('error', errorHandler);

    this.res.on('close', () => {
      this.close();
    });

    this.res.on('data', (chunk: Buffer) => {
      if (chunk.toString() === '\r\n') {
        return this.emit(ETwitterStreamEvent.DataKeepAlive);
      }

      this.parser.push(chunk.toString());
    });
  }

  protected initEventsFromParser() {
    this.parser.on(EStreamParserEvent.ParsedData, (eventData: any) => {
      this.emit(ETwitterStreamEvent.Data, eventData);
    });

    this.parser.on(EStreamParserEvent.ParseError, (error: any) => {
      this.emit(ETwitterStreamEvent.TweetParseError, error);
      this.emit(ETwitterStreamEvent.Error, {
        type: ETwitterStreamEvent.TweetParseError,
        error,
      });
    });
  }

  protected unbindRetryTimeout() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }
  }

  /** Terminate connection to Twitter. */
  close() {
    this.unbindRetryTimeout();
    this.emit(ETwitterStreamEvent.ConnectionClosed);

    if ('destroy' in this.req) {
      this.req.destroy();
    }
    else {
      // Deprecated - use .destroy instead.
      (this.req as ClientRequest).abort();
    }

    this.req.removeAllListeners();
    this.res.removeAllListeners();
  }

  /** Unbind all listeners, and close connection. */
  destroy() {
    this.removeAllListeners();
    this.close();
  }

  /**
   * Make a new request that creates a new `TweetStream` instance with
   * the same parameters, and bind current listeners to new stream.
   */
  async clone() {
    const newRequest = new RequestHandlerHelper(this.requestData);
    const newStream = await newRequest.makeRequestAsStream();

    // Clone attached listeners
    const listenerNames = this.eventNames();

    for (const listener of listenerNames) {
      const callbacks = this.listeners(listener);

      for (const callback of callbacks) {
        newStream.on(listener, callback as any);
      }
    }

    return newStream;
  }

  /** Make a new request to reconnect to Twitter. */
  async reconnect() {
    if (!this.req.destroyed) {
      this.close();
    }

    const { req, res } = await new RequestHandlerHelper(this.requestData).makeRequestAndResolveWhenReady();

    this.req = req;
    this.res = res;

    this.initEventsFromRequest();
  }

  protected async onConnectionError(retries = this.autoReconnectRetries) {
    this.unbindRetryTimeout();

    if (!this.autoReconnect) {
      return;
    }

    // Request is already destroyed
    if (this.req.destroyed) {
      return;
    }

    // Close connection silentely
    if ('destroy' in this.req) {
      this.req.destroy();
    }
    else {
      // Deprecated - use .destroy instead.
      (this.req as ClientRequest).abort();
    }

    try {
      await this.reconnect();
    } catch (e) {
      if (retries <= 0) {
        this.emit(ETwitterStreamEvent.ReconnectLimitExceeded);
        return;
      }

      this.emit(ETwitterStreamEvent.ReconnectError, this.autoReconnectRetries - retries);
      this.makeAutoReconnectRetry(retries);
    }
  }

  protected makeAutoReconnectRetry(retries: number) {
    const tryOccurence = (this.autoReconnectRetries - retries) + 1;
    const nextRetry = Math.min((tryOccurence ** 2) * 100, 20000);

    this.retryTimeout = setTimeout(() => {
      this.onConnectionError(retries - 1);
    }, nextRetry);
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, undefined> {
    let stack: T[] = [];
    const pusher = (data: T) => {
      stack.push(data);
    };

    this.on(ETwitterStreamEvent.Data, pusher);

    try {
      while (true) {
        if (this.req.aborted) {
          throw new Error('Connection closed');
        }

        if (stack.length) {
          const toGive = stack;
          stack = [];
          yield* toGive;
        }

        await new Promise<T>((resolve, reject) => {
          const rejecter = (error: any) => {
            this.off(ETwitterStreamEvent.Data, resolver);
            reject(error);
          };
          const resolver = (data: T) => {
            this.off(ETwitterStreamEvent.Error, rejecter);
            this.off(ETwitterStreamEvent.ConnectionClosed, rejecter);
            resolve(data);
          };

          this.once(ETwitterStreamEvent.Data, resolver);
          this.once(ETwitterStreamEvent.Error, rejecter);
          this.once(ETwitterStreamEvent.ConnectionClosed, rejecter);
        });
      }
    } finally {
      this.off(ETwitterStreamEvent.Data, pusher);
    }
  }
}

export default TweetStream;
