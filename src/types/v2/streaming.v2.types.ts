// ---------------
// -- Streaming --
// ---------------

// -- Get stream rules --

import { DataAndMetaV2, MetaV2, SentMeta } from './shared.v2.types';

export interface StreamingV2GetRulesParams {
  /** Comma-separated list of rule IDs. If omitted, all rules are returned. */
  ids: string;
}

export interface StreamingV2Rule {
  /** Unique identifier of this rule. */
  id: string;
  /** The rule text as submitted when creating the rule. */
  value: string;
  /** The tag label as defined when creating the rule. */
  tag?: string;
}

export type StreamingV2GetRulesResult = DataAndMetaV2<StreamingV2Rule[], SentMeta>;

// -- Add / delete stream rules --

export interface StreamingV2AddRulesParams {
  /** Specifies the operation you want to perform on the rules. */
  add: {
    /**
     * The tag label.
     * This is a free-form text you can use to identify the rules that matched a specific Tweet in the streaming response.
     * Tags can be the same across rules.
     */
    tag?: string;
    /**
     * The rule text.
     * If you are using a Standard Project at the Basic access level,
     * you can use the basic set of operators, can submit up to 25 concurrent rules, and can submit rules up to 512 characters long.
     * If you are using an Academic Research Project at the Basic access level,
     * you can use all available operators, can submit up to 1,000 concurrent rules, and can submit rules up to 1,024 characters long.
     */
    value: string;
  }[];
}

export interface StreamingV2DeleteRulesParams {
  /** Specifies the operation you want to perform on the rules. */
  delete: {
    /** Array of rule IDs, each one representing a rule already active in your stream. IDs must be submitted as strings. */
    ids: string[];
  };
}

export type StreamingV2UpdateRulesParams = StreamingV2AddRulesParams | StreamingV2DeleteRulesParams;

export interface StreamingV2UpdateRulesQuery {
  /**
   * Set to true to test a the syntax of your rule without submitting it.
   * This is useful if you want to check the syntax of a rule before removing one or more of your existing rules.
   */
  dry_run: boolean;
}

export type StreamingV2UpdateRulesAddResult = DataAndMetaV2<StreamingV2Rule[], {
  /** The time when the request body was returned. */
  sent: string;
  summary: {
    created: number;
    not_created: number;
  };
}>;

export type StreamingV2UpdateRulesDeleteResult = MetaV2<SentMeta & {
  summary: {
    deleted: number;
    not_deleted: number;
  };
}>;

export type StreamingV2UpdateRulesResult = StreamingV2UpdateRulesAddResult | StreamingV2UpdateRulesDeleteResult;
