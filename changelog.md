1.3.0
-----
- Doc: Improve rate-limit documentation #47 #32
- Feat: Public Direct Messages (DMs) 1.1 endpoints support: wrappers, typings, docs and tests #48
- Feat: New 05/06/07-2021 v2 endpoints wrappers #50
- Feat: Paginator mode for .following/.followers for v2 #50
- Fix: Many fixes for tweet streams auto-reconnect, handle connection errors more smoothly #50
- Feat: New events for tweet streams, that includes lost connection and reconnections #50
- Feat: Handle stream errors deliveries in a dedicated .DataError event (for v2 tweet streams) #50
- Fix: Corrections for body-mode auto-detection (mainly for manual API requests) #53

1.2.0
-----
- Fix: fetchLast was throwing an error with timelines #43
- Feat: Add .meta and .includes in v2 paginators #35 #46
- Feat: Add some missing attributes to tweetEntity typings #42

1.1.1
-----
- Fix: in streams, the KeepAlive was not emitted #33

1.1.0
-----
- Add the new v2 likes endpoint
- Fix: add some missing media types

1.0.0
-----
First Stable Version
- More tests, way more documentation
- Add every missing v2 endpoints
- Remove the two dependencies (form-data and oauth)
- Improve error management
- Fix issues with node12
- Fix issues with the auth API

0.4.0
-----
- Add V1 and V2 streaming V2 endpoints
- Add V2 followers and following endpoints
- Refactor / various fixes

0.3.0
-----
- Add the four API v2 user endpoints
- Improve type definitions
- Minor v2 search refactor

0.2.3
-----
- Fix npm package (was not built)

0.2.1
-----
- Export typescript definitions

0.2.0
-----
- Link and Oauth auth
- PUT/PATCH/DELETE
- improve get/post methods (build query strings, v1/v2 urls, ...)
- read/write/DMs segmentation
- native media chunked upload, with simultaneous send of file parts

0.1.0
-----
- First foundations