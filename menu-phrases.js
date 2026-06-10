// Menu Phrase dictionary for Click-Simulation. This file is loaded as a content
// script (where it defines globals on `window`) and is also required directly by
// `node:test` via the CommonJS export guard at the bottom — same pattern as
// `helpers.js`, no bundler, no dependencies.
//
// A *Menu Action* (see CONTEXT.md) is one of the native YouTube menu operations
// Click-Simulation drives, named by an enum constant. A *Menu Phrase* is a
// localized string YouTube shows for a given action; we recognise an action by
// substring-matching the menu's visible text against its phrases, lowercased on
// both sides. All phrases for all actions live here — adding a language is one
// edit in this table.

const Action = Object.freeze({
  WatchLater: 'WatchLater',
  SaveToPlaylist: 'SaveToPlaylist',
  RemoveFrom: 'RemoveFrom',
  MenuButton: 'MenuButton',
});

// Phrases are stored lowercased (matching is case-insensitive on both sides).
// Item actions cover 10 languages. `MenuButton` covers only the 5 languages it
// has today as aria-labels — the gap vs the item actions is left visible on
// purpose; the missing translations are not fabricated.
const MENU_PHRASES = Object.freeze({
  [Action.WatchLater]: [
    'watch later',                  // en
    'regarder plus tard',           // fr
    'guardar para ver más tarde',   // es
    'speichern für später',         // de
    'salva per guardare più tardi', // it
    '保存して後で見る',                // ja
    '나중에 볼 동영상에 저장',          // ko
    'salvar para assistir mais tarde', // pt
    'сохранить для просмотра позже', // ru
    'حفظ للمشاهدة لاحقًا',          // ar
  ],
  [Action.SaveToPlaylist]: [
    'save to playlist',                 // en
    'enregistrer dans une playlist',    // fr
    'guardar en lista de reproducción', // es
    'in playlist speichern',            // de
    'salva nella playlist',             // it
    'プレイリストに保存',                  // ja
    '재생목록에 저장',                     // ko
    'salvar na playlist',               // pt
    'сохранить в плейлист',             // ru
    'حفظ في قائمة التشغيل',            // ar
  ],
  [Action.RemoveFrom]: [
    'remove from',     // en
    'supprimer de',    // fr
    'eliminar de',     // es
    'entfernen aus',   // de
    'rimuovi da',      // it
    'から削除',          // ja
    '에서 삭제',         // ko
    'remover de',      // pt
    'удалить из',      // ru
    'إزالة من',        // ar
  ],
  // aria-labels — only the 5 languages present today; gap is intentional.
  [Action.MenuButton]: [
    'more actions',     // en
    'autres actions',   // fr
    'más acciones',     // es
    'weitere aktionen', // de
    'altre azioni',     // it
  ],
});

// Pure checker: true when any of `action`'s Menu Phrases is a substring of
// `text`, comparing lowercased on both sides. No DOM access. Returns false for
// an unknown action or a non-string `text`.
function matches(action, text) {
  if (typeof text !== 'string') return false;
  const phrases = MENU_PHRASES[action];
  if (!phrases) return false;
  const haystack = text.toLowerCase();
  return phrases.some((phrase) => haystack.includes(phrase.toLowerCase()));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Action, matches };
}
