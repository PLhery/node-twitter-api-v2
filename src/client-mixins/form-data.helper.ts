type TStringable = { toString(): string; };

// This class is partially inspired by https://github.com/form-data/form-data/blob/master/lib/form_data.js
// All credits to their authors.
export class FormDataHelper {
  protected _boundary: string = '';
  protected _chunks: Buffer[] = [];

  protected readonly LINE_BREAK = '\r\n';
  protected readonly DEFAULT_CONTENT_TYPE = 'application/octet-stream';

  protected bodyAppend(...values: (Buffer | string)[]) {
    const allAsBuffer = values.map(val => val instanceof Buffer ? val : Buffer.from(val));
    this._chunks.push(...allAsBuffer);
  }

  append(field: string, value: Buffer | string | TStringable) {
    const convertedValue = value instanceof Buffer ? value : value.toString();

    const header = this.getMultipartHeader(field, convertedValue);

    this.bodyAppend(header, convertedValue, this.LINE_BREAK);
  }

  getHeaders() {
    return {
      'content-type': 'multipart/form-data; boundary=' + this.getBoundary(),
    };
  }

  getLength() {
    return this._chunks.reduce((acc, cur) => acc + cur.length, 0);
  }

  getBuffer() {
    const footerLength = Buffer.from(this.getMultipartFooter());
    const totalBuffer = Buffer.alloc(this.getLength() + footerLength.length);

    let i = 0;
    for (const chunk of this._chunks) {
      for (let j = 0; j < chunk.length; i++, j++) {
        totalBuffer[i] = chunk[j];
      }
    }

    // Add the footer
    for (let j = 0; j < footerLength.length; i++, j++) {
      totalBuffer[i] = footerLength[j];
    }

    // console.log('Buffer:', totalBuffer.toString('utf-8'))
    return totalBuffer;
  }

  protected getBoundary() {
    if (!this._boundary) {
      this.generateBoundary();
    }

    return this._boundary;
  }

  protected lastBoundary() {
    return '--' + this.getBoundary() + '--' + this.LINE_BREAK;
  }

  protected generateBoundary() {
    // This generates a 50 character boundary similar to those used by Firefox.
    let boundary = '--------------------------';
    for (let i = 0; i < 24; i++) {
      boundary += Math.floor(Math.random() * 10).toString(16);
    }

    this._boundary = boundary;
  }

  protected getMultipartHeader(field: string, value: string | Buffer) {
    // In this lib no need to guess more the content type, octet stream is ok of buffers
    const contentType = value instanceof Buffer ? this.DEFAULT_CONTENT_TYPE : '';

    let contents = '';
    const headers  = {
      // add custom disposition as third element or keep it two elements if not
      'Content-Disposition': ['form-data', `name="${field}"`],
      // if no content type. allow it to be empty array
      'Content-Type': contentType,
    };

    for (const [prop, header] of Object.entries(headers)) {
      // skip nullish headers.
      if (!header) {
        continue;
      }

      let headerAsArray = !Array.isArray(header) ? [header] : header;

      // add non-empty headers.
      if (headerAsArray.length) {
        contents += prop + ': ' + headerAsArray.join('; ') + this.LINE_BREAK;
      }
    }

    return '--' + this.getBoundary() + this.LINE_BREAK + contents + this.LINE_BREAK;
  }

  protected getMultipartFooter() {
    return this.lastBoundary();
  }
}
