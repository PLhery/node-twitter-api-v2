import { EventEmitter } from 'events';
import type { IncomingMessage, ClientRequest } from 'http';
import { RequestHandlerHelper, TRequestFullData } from '../client-mixins/request-maker.mixin';
import { ETwitterStreamEvent } from '../types';
import TweetStreamEventCombiner from './TweetStreamEventCombiner';
import TweetStreamParser, { EStreamParserEvent } from './TweetStreamParser';

interface ITweetStreamError {
  type: ETwitterStreamEvent.ConnectionError | ETwitterStreamEvent.TweetParseError | ETwitterStreamEvent.ReconnectError;
  error: Error;
}

export class TweetStream<T = any> extends EventEmitter {
  public autoReconnect = false;
  public autoReconnectRetries = 5;
  // 2 minutes without any Twitter signal
  public keepAliveTimeoutMs = 1000 * 120;

  protected retryTimeout?: NodeJS.Timeout;
  protected keepAliveTimeout?: NodeJS.Timeout;
  protected parser = new TweetStreamParser();

  constructor(
    protected req: ClientRequest,
    protected res: IncomingMessage,
    protected requestData: TRequestFullData,
  ) {
    super();

    this.onKeepAliveTimeout = this.onKeepAliveTimeout.bind(this);
    this.initEventsFromParser();
    this.initEventsFromRequest();
  }

  // Event typings
  on(event: ETwitterStreamEvent.Data, handler: (data: T) => any): this;
  on(event: ETwitterStreamEvent.Error, handler: (errorPayload: ITweetStreamError) => any): this;
  on(event: ETwitterStreamEvent.ConnectionLost, handler: () => any): this;
  on(event: ETwitterStreamEvent.ConnectionError, handler: (error: Error) => any): this;
  on(event: ETwitterStreamEvent.TweetParseError, handler: (error: Error) => any): this;
  on(event: ETwitterStreamEvent.ConnectionClosed, handler: () => any): this;
  on(event: ETwitterStreamEvent.DataKeepAlive, handler: () => any): this;
  on(event: ETwitterStreamEvent.ReconnectAttempt, handler: (tries: number) => any): this;
  on(event: ETwitterStreamEvent.ReconnectError, handler: (tries: number) => any): this;
  on(event: ETwitterStreamEvent.ReconnectLimitExceeded, handler: () => any): this;
  on(event: ETwitterStreamEvent.Reconnected, handler: () => any): this;
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
    // Usually, connection should not be closed by Twitter!
    this.res.on('close', () => errorHandler(new Error('Connection closed by Twitter.')));

    this.res.on('data', (chunk: Buffer) => {
      this.resetKeepAliveTimeout();

      if (chunk.toString() === '\r\n') {
        return this.emit(ETwitterStreamEvent.DataKeepAlive);
      }

      this.parser.push(chunk.toString());
    });

    // Starts the keep alive timeout
    this.resetKeepAliveTimeout();
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

  protected resetKeepAliveTimeout() {
    this.unbindKeepAliveTimeout();

    if (this.keepAliveTimeoutMs !== Infinity) {
      this.keepAliveTimeout = setTimeout(this.onKeepAliveTimeout, this.keepAliveTimeoutMs);
    }
  }

  protected onKeepAliveTimeout() {
    this.emit(ETwitterStreamEvent.ConnectionLost);
    this.onConnectionError();
  }

  protected unbindTimeouts() {
    this.unbindRetryTimeout();
    this.unbindKeepAliveTimeout();
  }

  protected unbindKeepAliveTimeout() {
    if (this.keepAliveTimeout) {
      clearTimeout(this.keepAliveTimeout);
      this.keepAliveTimeout = undefined;
    }
  }

  protected unbindRetryTimeout() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }
  }

  /** Terminate connection to Twitter. */
  close() {
    this.unbindTimeouts();
    this.emit(ETwitterStreamEvent.ConnectionClosed);

    this.req.removeAllListeners();
    this.res.removeAllListeners();

    if ('destroy' in this.req) {
      this.req.destroy();
    }
    else {
      // Deprecated - use .destroy instead.
      (this.req as ClientRequest).abort();
    }
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

    this.emit(ETwitterStreamEvent.Reconnected);
    this.initEventsFromRequest();
  }

  protected async onConnectionError(retries = this.autoReconnectRetries) {
    this.unbindTimeouts();

    // Close the request if necessary
    if (!this.req.destroyed) {
      this.req.removeAllListeners();
      this.res.removeAllListeners();

      // Close connection silentely
      if ('destroy' in this.req) {
        this.req.destroy();
      }
      else {
        // Deprecated - use .destroy instead.
        (this.req as ClientRequest).abort();
      }
    }

    // Terminate stream by events if necessary (no auto-reconnect or retries exceeded)
    if (!this.autoReconnect) {
      this.emit(ETwitterStreamEvent.ConnectionClosed);
      return;
    }
    if (retries <= 0) {
      this.emit(ETwitterStreamEvent.ReconnectLimitExceeded);
      this.emit(ETwitterStreamEvent.ConnectionClosed);
      return;
    }

    // If all other conditions fails, do a reconnect attempt
    try {
      this.emit(ETwitterStreamEvent.ReconnectAttempt, this.autoReconnectRetries - retries);
      await this.reconnect();
    } catch (e) {
      this.emit(ETwitterStreamEvent.ReconnectError, this.autoReconnectRetries - retries);
      this.emit(ETwitterStreamEvent.Error, {
        type: ETwitterStreamEvent.ReconnectError,
        error: new Error(`Reconnect error - ${this.autoReconnectRetries - retries} attempts made yet.`),
      });

      this.makeAutoReconnectRetry(retries);
    }
  }

  protected makeAutoReconnectRetry(retries: number) {
    const tryOccurence = (this.autoReconnectRetries - retries) + 1;
    const nextRetry = Math.min((tryOccurence ** 2) * 1000, 25000);

    this.retryTimeout = setTimeout(() => {
      this.onConnectionError(retries - 1);
    }, nextRetry);
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, undefined> {
    const eventCombiner = new TweetStreamEventCombiner(this);

    try {
      while (true) {
        if (this.req.aborted) {
          throw new Error('Connection closed');
        }

        if (eventCombiner.hasStack()) {
          yield* eventCombiner.popStack();
        }

        const { type, payload } = await eventCombiner.nextEvent();
        if (type === 'error') {
          throw payload;
        }
      }
    } finally {
      eventCombiner.destroy();
    }
  }
}

export default TweetStream;
