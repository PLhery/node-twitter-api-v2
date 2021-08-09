import EventEmitter from 'events';
import { ETwitterStreamEvent } from '../types';
import type TweetStream from './TweetStream';

type TweetStreamCombinerPayload<T> = { type: 'data', payload: T } | { type: 'error', payload?: any };

export class TweetStreamEventCombiner<T> extends EventEmitter {
  private stack: T[] = [];
  private onceNewEvent: (resolver: (value: TweetStreamCombinerPayload<T>) => void) => void;

  constructor(private stream: TweetStream<T>) {
    super();

    this.onStreamData = this.onStreamData.bind(this);
    this.onStreamError = this.onStreamError.bind(this);
    this.onceNewEvent = this.once.bind(this, 'event');

    // Init events from stream
    stream.on(ETwitterStreamEvent.Data, this.onStreamData);
    stream.on(ETwitterStreamEvent.Error, this.onStreamError);
    stream.on(ETwitterStreamEvent.ConnectionClosed, this.onStreamError);
  }

  /** Returns a new `Promise` that will `resolve` on next event (`data` or any sort of error). */
  nextEvent() {
    return new Promise(this.onceNewEvent);
  }

  /** Returns `true` if there's something in the stack. */
  hasStack() {
    return this.stack.length > 0;
  }

  /** Returns stacked data events, and clean the stack. */
  popStack() {
    const stack = this.stack;
    this.stack = [];
    return stack;
  }

  /** Cleanup all the listeners attached on stream. */
  destroy() {
    this.removeAllListeners();
    this.stream.off(ETwitterStreamEvent.Data, this.onStreamData);
    this.stream.off(ETwitterStreamEvent.Error, this.onStreamError);
    this.stream.off(ETwitterStreamEvent.ConnectionClosed, this.onStreamError);
  }

  private emitEvent(type: 'data' | 'error', payload?: any) {
    this.emit('event', { type, payload });
  }

  private onStreamError(payload?: any) {
    this.emitEvent('error', payload);
  }

  private onStreamData(payload: T) {
    this.stack.push(payload);
    this.emitEvent('data', payload);
  }
}

export default TweetStreamEventCombiner;
