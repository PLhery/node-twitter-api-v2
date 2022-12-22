import { TimelineV2Paginator } from './v2.paginator';
import { DMEventV2, GetDMEventV2Params, GetDMEventV2Result } from '../types/v2/dm.v2.types';

export abstract class DMTimelineV2Paginator<TShared = any> extends TimelineV2Paginator<GetDMEventV2Result, GetDMEventV2Params, DMEventV2, TShared> {
    protected getItemArray() {
        return this.events;
    }

    /**
     * Events returned by paginator.
     */
    get events() {
        return this._realData.data ?? [];
    }

    get meta() {
        return super.meta as GetDMEventV2Result['meta'];
    }
}

export class FullDMTimelineV2Paginator extends DMTimelineV2Paginator {
    protected _endpoint = 'dm_events';
}

export class OneToOneDMTimelineV2Paginator extends DMTimelineV2Paginator<{ participant_id: string }> {
    protected _endpoint = 'dm_conversations/with/:participant_id/dm_events';
}

export class ConversationDMTimelineV2Paginator extends DMTimelineV2Paginator<{ dm_conversation_id: string }> {
    protected _endpoint = 'dm_conversations/:dm_conversation_id/dm_events';
}
