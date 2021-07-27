import 'mocha';
import { expect } from 'chai';
import { EDirectMessageEventTypeV1, TwitterApi } from '../src';
import { getUserClient } from '../src/test/utils';

let client: TwitterApi;

const TARGET_USER_ID = process.env.TARGET_DM_USER_ID as string;
const TEST_UUID = Math.random();
let isDmTestEnabled = false;

if (process.env.TARGET_DM_USER_ID) {
  isDmTestEnabled = true;
}

describe('DM endpoints for v1.1 API', () => {
  before(() => {
    client = getUserClient();
  });

  it('.sendDm/.getDmEvent/.deleteDm - Send a new direct message and fetch it.', async () => {
    if (!isDmTestEnabled) {
      return;
    }

    const v1Client = client.v1;
    const selfAccount = await client.currentUser();
    const msgText = `Hello, this is a new direct message from an automated script - UUID: ${TEST_UUID}`;

    const sentMessage = await v1Client.sendDm({
      recipient_id: TARGET_USER_ID,
      text: msgText,
    });

    expect(sentMessage.event.type).to.equal(EDirectMessageEventTypeV1.Create);

    // Get event to repeat action
    const messageEvent = await v1Client.getDmEvent(sentMessage.event.id);

    for (const evt of [sentMessage.event, messageEvent.event]) {
      const msgCreate = evt[EDirectMessageEventTypeV1.Create];
      expect(msgCreate).to.be.ok;
      expect(msgCreate).to.haveOwnProperty('message_data');
      expect(msgCreate.message_data.text).to.equal(msgText);
      expect(msgCreate.message_data.quick_reply).to.be.undefined;
      expect(msgCreate.message_data.quick_reply_response).to.be.undefined;
      expect(msgCreate.message_data.attachment).to.be.undefined;
      expect(msgCreate.message_data.ctas).to.be.undefined;
      expect(msgCreate.target.recipient_id).to.equal(TARGET_USER_ID);
      expect(msgCreate.sender_id).to.equal(selfAccount.id_str);
    }
  }).timeout(60 * 1000);

  it('.listDmEvents/.deleteDm - List DM events and delete every available DM sent to TARGET USER ID.', async () => {
    if (!isDmTestEnabled) {
      return;
    }

    const v1Client = client.v1;
    const selfAccount = await client.currentUser();

    const eventPaginator = await v1Client.listDmEvents();

    for await (const evt of eventPaginator) {
      expect(evt.type).to.equal(EDirectMessageEventTypeV1.Create);

      const msgCreate = evt[EDirectMessageEventTypeV1.Create];
      expect(msgCreate).to.be.ok;

      if (msgCreate.target.recipient_id !== TARGET_USER_ID) {
        continue;
      }

      expect(msgCreate).to.haveOwnProperty('message_data');
      expect(msgCreate.message_data.quick_reply).to.be.undefined;
      expect(msgCreate.message_data.quick_reply_response).to.be.undefined;
      expect(msgCreate.message_data.attachment).to.be.undefined;
      expect(msgCreate.message_data.ctas).to.be.undefined;
      expect(msgCreate.target.recipient_id).to.equal(TARGET_USER_ID);
      expect(msgCreate.sender_id).to.equal(selfAccount.id_str);

      await v1Client.deleteDm(evt.id);
    }
  }).timeout(60 * 1000);
});
