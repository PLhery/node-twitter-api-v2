import { EventEmitter } from 'events';
import type { IncomingMessage, ClientRequest } from 'http';
import { EStreamParserEvent, ETwitterStreamEvent } from '../types';
import TweetStreamParser from './TweetStreamParser';

export default class TweetStream extends EventEmitter {
  protected parser = new TweetStreamParser();

  constructor(
    protected req: ClientRequest,
    protected res: IncomingMessage,
  ) {
    super();

    this.initEventsFromParser();
    this.initEventsFromRequest();
  }

  protected initEventsFromRequest() {
    this.res.on('error', (err: any) => {
      this.emit(ETwitterStreamEvent.ConnectionError, err);
      this.emit(ETwitterStreamEvent.Error, {
        type: ETwitterStreamEvent.ConnectionError,
        error: err,
      });
    });

    this.res.on('close', () => {
      this.close();
    });

    this.res.on('data', chunk => {
      if (chunk === '\r\n') {
        return this.emit(ETwitterStreamEvent.DataKeepAlive);
      }

      this.parser.push(chunk);
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

  close() {
    this.emit(ETwitterStreamEvent.ConnectionClosed);

    if ('destroy' in this.req) {
      this.req.destroy();
    }
    else {
      // Deprecated - use .destroy instead.
      (this.req as ClientRequest).abort();
    }
  }
}
