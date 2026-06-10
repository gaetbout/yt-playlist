# YouTube Playlist Helper

A Chrome (Manifest V3) content-script extension that overlays quick-action
buttons on YouTube video thumbnails so the user can add a video to one of their
playlists in a single click, without opening YouTube's own menus.

## Language

**Target Playlist**:
A user-owned YouTube playlist that the extension can add videos to. Each
configured Target Playlist surfaces as one button on every eligible thumbnail.
_Avoid_: destination, list

**Quick-Add Button**:
A button the extension injects onto a thumbnail that, when clicked, adds that
video to a specific Target Playlist.
_Avoid_: plus button, save button

**Quick-Remove Button**:
A button the extension injects onto an item while viewing a playlist's page,
that removes that video from the playlist being viewed.
_Avoid_: x button, delete button

**Watch Later**:
YouTube's built-in special playlist (id `WL`). The official YouTube Data API
cannot add to or remove from it, so the Watch Later Quick-Add Button is a
**permanent Click-Simulation exception**: it stays click-based forever, even
after every other action migrates to the API. See ADR 0001.
_Avoid_: WL, later list

**Click-Simulation**:
The technique of performing playlist actions by programmatically opening
YouTube's native menus and clicking the matching item by reading its visible
text. Fragile across YouTube UI updates. To be replaced by the YouTube Data API
for all Target Playlists **except Watch Later**, which has no API support.
_Avoid_: DOM injection, scraping
