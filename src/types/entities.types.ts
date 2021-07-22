// Entities
export interface Entity {
  start: number;
  end: number;
}

export interface UrlEntity extends Entity {
  url: string; // https;//t.co/...
  expanded_url: string; // https://unfollow.ninja/
  display_url: string; // unfollow.ninja
  status?: string; // "200", present only on urls with previews
  title?: string //Unfollow Ninja, present only on urls with previews
  description?: string //peut signifier que..., present only on urls with previews
  unwound_url?: string //https://unfollow.ninja/, present only on urls with previews
}

export interface HashtagEntity extends Entity {
  hashtag: string;
}

export interface CashtagEntity extends Entity {
  cashtag: string;
}

export interface MentionEntity extends Entity {
  username: string;
}
