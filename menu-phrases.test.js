const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Action, matches } = require('./menu-phrases.js');

test('matches: each action matches its own known phrases', () => {
  assert.equal(matches(Action.WatchLater, 'Watch later'), true);
  assert.equal(matches(Action.WatchLater, 'Regarder plus tard'), true);
  assert.equal(matches(Action.SaveToPlaylist, 'Save to playlist'), true);
  assert.equal(matches(Action.SaveToPlaylist, 'Enregistrer dans une playlist'), true);
  assert.equal(matches(Action.RemoveFrom, 'Remove from Watch later'), true);
  assert.equal(matches(Action.RemoveFrom, 'Supprimer de la playlist'), true);
  assert.equal(matches(Action.MenuButton, 'More actions'), true);
  assert.equal(matches(Action.MenuButton, 'Autres actions'), true);
});

test('matches: case-insensitive on both sides (mixed case input)', () => {
  assert.equal(matches(Action.WatchLater, 'WATCH LATER'), true);
  assert.equal(matches(Action.WatchLater, 'wAtCh LaTeR'), true);
  assert.equal(matches(Action.SaveToPlaylist, 'SAVE TO PLAYLIST'), true);
  assert.equal(matches(Action.RemoveFrom, 'REMOVE FROM'), true);
});

test('matches: substring match within a longer surrounding string', () => {
  assert.equal(matches(Action.WatchLater, '  Watch later  '), true);
  assert.equal(matches(Action.SaveToPlaylist, 'Save to playlist…'), true);
});

test('matches: non-Latin phrases match', () => {
  assert.equal(matches(Action.WatchLater, '保存して後で見る'), true);
  assert.equal(matches(Action.RemoveFrom, 'から削除'), true);
  assert.equal(matches(Action.SaveToPlaylist, '재생목록에 저장'), true);
});

test('matches: does not match another action\'s phrases', () => {
  assert.equal(matches(Action.WatchLater, 'Save to playlist'), false);
  assert.equal(matches(Action.SaveToPlaylist, 'Watch later'), false);
  assert.equal(matches(Action.RemoveFrom, 'Save to playlist'), false);
  assert.equal(matches(Action.MenuButton, 'Watch later'), false);
});

test('matches: a non-matching string returns false', () => {
  assert.equal(matches(Action.WatchLater, 'Share'), false);
  assert.equal(matches(Action.SaveToPlaylist, 'Download'), false);
  assert.equal(matches(Action.RemoveFrom, ''), false);
});

test('matches: non-string text returns false', () => {
  assert.equal(matches(Action.WatchLater, null), false);
  assert.equal(matches(Action.WatchLater, undefined), false);
  assert.equal(matches(Action.WatchLater, 42), false);
  assert.equal(matches(Action.WatchLater, {}), false);
});

test('matches: unknown action returns false', () => {
  assert.equal(matches('NotAnAction', 'Watch later'), false);
  assert.equal(matches(undefined, 'Watch later'), false);
});
