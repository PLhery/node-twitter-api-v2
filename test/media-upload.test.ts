import 'mocha';
import { expect } from 'chai';
import { TwitterApi } from '../src';
import { getUserClient } from '../src/test/utils';
import fs from 'fs';
import path from 'path';

let client: TwitterApi;
const dirname = __dirname;

const jpgImg = path.resolve(dirname, 'assets', 'lolo.jpg');
const gifImg = path.resolve(dirname, 'assets', 'pec.gif');
const maxTimeout = 1000 * 60;

describe('Media upload for v1.1 API', () => {
  before(() => {
    client = getUserClient();
  });

  it('Upload a JPG image from filepath', async () => {
    // Upload media (from path)
    const fromPath = await client.v1.uploadMedia(jpgImg);
    expect(fromPath).to.be.an('string');
    expect(fromPath).to.have.length.greaterThan(0);
  }).timeout(maxTimeout);

  it('Upload a JPG image from buffer', async () => {
    // Upload media (from buffer)
    const fromBuffer = await client.v1.uploadMedia(await fs.promises.readFile(jpgImg), { type: 'jpg' });
    expect(fromBuffer).to.be.an('string');
    expect(fromBuffer).to.have.length.greaterThan(0);
  }).timeout(maxTimeout);

  it('Upload a JPG image from file handle', async () => {
    // Upload media (from fileHandle)
    const fromHandle = await client.v1.uploadMedia(await fs.promises.open(jpgImg, 'r'), { type: 'jpg' })
    expect(fromHandle).to.be.an('string');
    expect(fromHandle).to.have.length.greaterThan(0);
  }).timeout(maxTimeout);

  it('Upload a JPG image from numbered file handle', async () => {
    // Upload media (from numbered fileHandle)
    const fromNumberFh = await client.v1.uploadMedia(fs.openSync(jpgImg, 'r'), { type: 'jpg', maxConcurrentUploads: 1 });
    expect(fromNumberFh).to.be.an('string');
    expect(fromNumberFh).to.have.length.greaterThan(0);
  }).timeout(maxTimeout);

  it('Upload a GIF image from filepath', async () => {
    // Upload media (from path)
    const fromPath = await client.v1.uploadMedia(gifImg);
    expect(fromPath).to.be.an('string');
    expect(fromPath).to.have.length.greaterThan(0);
  }).timeout(maxTimeout);

  it('Upload a GIF image from buffer', async () => {
    // Upload media (from buffer)
    const fromBuffer = await client.v1.uploadMedia(await fs.promises.readFile(gifImg), { type: 'jpg' });
    expect(fromBuffer).to.be.an('string');
    expect(fromBuffer).to.have.length.greaterThan(0);
  }).timeout(maxTimeout);

  it('Upload a GIF image from file handle', async () => {
    // Upload media (from fileHandle)
    const fromHandle = await client.v1.uploadMedia(await fs.promises.open(gifImg, 'r'), { type: 'jpg' })
    expect(fromHandle).to.be.an('string');
    expect(fromHandle).to.have.length.greaterThan(0);
  }).timeout(maxTimeout);

  it('Upload a GIF image from numbered file handle', async () => {
    // Upload media (from numbered fileHandle)
    const fromNumberFh = await client.v1.uploadMedia(fs.openSync(gifImg, 'r'), { type: 'jpg', maxConcurrentUploads: 1 });
    expect(fromNumberFh).to.be.an('string');
    expect(fromNumberFh).to.have.length.greaterThan(0);
  }).timeout(maxTimeout);
});
