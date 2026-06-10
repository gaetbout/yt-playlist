# Watch Later stays on Click-Simulation permanently

The official YouTube Data API v3 cannot add to or remove from the special
**Watch Later** playlist (id `WL`): `playlistItems.insert`/`delete` against `WL`
return `playlistOperationUnsupported`. Watch Later is the extension's most-used
action, so we keep its Quick-Add Button on **Click-Simulation forever** — even
once every other Target Playlist migrates to the API. This is a deliberate,
permanent hybrid: a future reader will see one button driving YouTube's menus by
reading visible text while the rest use a clean API, and should understand it is
the *only* way to automate Watch Later, not an oversight.

The rejected alternative was dropping Watch Later entirely to keep the codebase
100% API-clean; we chose to retain it because the feature's value outweighs the
cost of maintaining one fragile button.

## Consequences

- The Click-Simulation code path (open native menu → match item by visible text
  across languages) can never be deleted; it must keep pace with YouTube UI
  changes for the Watch Later button alone.
- When the API migration happens, expect a hybrid: `ClickSimAdapter` for Watch
  Later, `ApiAdapter` for all other Target Playlists.

## Known constraints for the future API migration (not yet decided)

- **OAuth 2.0 is mandatory** for any write operation. In a Manifest V3 extension
  this means a Google Cloud project, an OAuth consent screen (likely subject to
  Google verification), and `chrome.identity` for the auth flow.
- **Quota:** default 10,000 units/day. `playlistItems.insert` costs 50 units,
  so roughly 200 adds/day before throttling. Acceptable for personal use.
