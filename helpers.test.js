const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractVideoId, isEligibleThumbnail, resolveButton2, getPlaylistContext } = require('./helpers.js');

test('extractVideoId: valid watch URL returns the id', () => {
  assert.equal(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('extractVideoId: ignores extra params before and after v', () => {
  assert.equal(extractVideoId('https://www.youtube.com/watch?list=WL&v=abc123&t=42'), 'abc123');
  assert.equal(extractVideoId('https://www.youtube.com/watch?v=abc123&t=42'), 'abc123');
});

test('extractVideoId: non-watch URL returns null', () => {
  assert.equal(extractVideoId('https://www.youtube.com/playlist?list=WL'), null);
  assert.equal(extractVideoId('https://www.youtube.com/'), null);
});

test('extractVideoId: watch URL missing v param returns null', () => {
  assert.equal(extractVideoId('https://www.youtube.com/watch?list=PL123'), null);
});

test('extractVideoId: malformed / non-string input returns null', () => {
  assert.equal(extractVideoId(''), null);
  assert.equal(extractVideoId(null), null);
  assert.equal(extractVideoId(undefined), null);
  assert.equal(extractVideoId(42), null);
  assert.equal(extractVideoId({}), null);
});

test('isEligibleThumbnail: eligible single video returns true', () => {
  assert.equal(isEligibleThumbnail({}), true);
  assert.equal(isEligibleThumbnail({
    hasMixBadge: false,
    hasPlaylistIndicator: false,
    isMixTitle: false,
    hasPlaylistBadge: false,
    hasPlaylistMetadata: false,
    hasPlaylistLink: false,
    isShortsVideo: false,
    isPlaylistHeader: false,
    isSearchSuggestion: false,
    isVideoPlayer: false,
  }), true);
});

test('isEligibleThumbnail: Mix tile returns false', () => {
  assert.equal(isEligibleThumbnail({ hasMixBadge: true }), false);
  assert.equal(isEligibleThumbnail({ isMixTitle: true }), false);
});

test('isEligibleThumbnail: playlist tile returns false', () => {
  assert.equal(isEligibleThumbnail({ hasPlaylistIndicator: true }), false);
  assert.equal(isEligibleThumbnail({ hasPlaylistBadge: true }), false);
  assert.equal(isEligibleThumbnail({ hasPlaylistMetadata: true }), false);
  assert.equal(isEligibleThumbnail({ hasPlaylistLink: true }), false);
});

test('isEligibleThumbnail: Shorts returns false', () => {
  assert.equal(isEligibleThumbnail({ isShortsVideo: true }), false);
});

test('isEligibleThumbnail: search suggestion returns false', () => {
  assert.equal(isEligibleThumbnail({ isSearchSuggestion: true }), false);
});

test('isEligibleThumbnail: player area returns false', () => {
  assert.equal(isEligibleThumbnail({ isVideoPlayer: true }), false);
});

test('isEligibleThumbnail: playlist header returns false', () => {
  assert.equal(isEligibleThumbnail({ isPlaylistHeader: true }), false);
});

test('isEligibleThumbnail: null / undefined descriptor returns true', () => {
  assert.equal(isEligibleThumbnail(null), true);
  assert.equal(isEligibleThumbnail(undefined), true);
});

test('resolveButton2: valid name renders enabled with the name passed through', () => {
  assert.deepEqual(resolveButton2('Musique'), {
    render: true, enabled: true, playlistName: 'Musique',
  });
});

test('resolveButton2: surrounding whitespace is trimmed in the passed-through name', () => {
  assert.deepEqual(resolveButton2('  My Mix  '), {
    render: true, enabled: true, playlistName: 'My Mix',
  });
});

test('resolveButton2: empty name renders disabled', () => {
  assert.deepEqual(resolveButton2(''), {
    render: true, enabled: false, playlistName: '',
  });
});

test('resolveButton2: whitespace-only name renders disabled', () => {
  assert.deepEqual(resolveButton2('   '), {
    render: true, enabled: false, playlistName: '',
  });
});

test('resolveButton2: unset / non-string config renders disabled', () => {
  assert.deepEqual(resolveButton2(undefined), {
    render: true, enabled: false, playlistName: '',
  });
  assert.deepEqual(resolveButton2(null), {
    render: true, enabled: false, playlistName: '',
  });
  assert.deepEqual(resolveButton2(42), {
    render: true, enabled: false, playlistName: '',
  });
});

test('getPlaylistContext: Watch Later playlist page', () => {
  assert.deepEqual(getPlaylistContext('https://www.youtube.com/playlist?list=WL'), {
    isPlaylistPage: true, listId: 'WL',
  });
});

test('getPlaylistContext: arbitrary playlist page', () => {
  assert.deepEqual(getPlaylistContext('https://www.youtube.com/playlist?list=PLabc123'), {
    isPlaylistPage: true, listId: 'PLabc123',
  });
  // list param after another query param still resolves
  assert.deepEqual(getPlaylistContext('https://www.youtube.com/playlist?foo=bar&list=PLxyz'), {
    isPlaylistPage: true, listId: 'PLxyz',
  });
});

test('getPlaylistContext: non-playlist pages have no playlist context', () => {
  assert.deepEqual(getPlaylistContext('https://www.youtube.com/'), {
    isPlaylistPage: false, listId: null,
  });
  assert.deepEqual(getPlaylistContext('https://www.youtube.com/feed/subscriptions'), {
    isPlaylistPage: false, listId: null,
  });
  // /playlist with no list param is not a usable playlist page
  assert.deepEqual(getPlaylistContext('https://www.youtube.com/playlist'), {
    isPlaylistPage: false, listId: null,
  });
});

test('getPlaylistContext: watch page carrying a list param is NOT a playlist page', () => {
  assert.deepEqual(getPlaylistContext('https://www.youtube.com/watch?v=abc123&list=WL'), {
    isPlaylistPage: false, listId: 'WL',
  });
  assert.deepEqual(getPlaylistContext('https://www.youtube.com/watch?v=abc123&list=PLxyz&index=2'), {
    isPlaylistPage: false, listId: 'PLxyz',
  });
});

test('getPlaylistContext: non-string input returns empty context', () => {
  assert.deepEqual(getPlaylistContext(null), { isPlaylistPage: false, listId: null });
  assert.deepEqual(getPlaylistContext(undefined), { isPlaylistPage: false, listId: null });
  assert.deepEqual(getPlaylistContext(42), { isPlaylistPage: false, listId: null });
});
