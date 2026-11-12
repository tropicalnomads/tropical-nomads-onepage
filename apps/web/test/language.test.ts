import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { locales, webAreas, type Locale } from 'tropical-nomads-shared';
import { areaDescription, areaText, presentText, shellCopy, type ShellCopy } from '../src/i18n/copy.ts';

describe('shell languages', () => {
  it('has every English label in Portuguese', () => {
    assert.deepEqual(Object.keys(shellCopy.en).sort(), Object.keys(shellCopy.pt).sort());
    assert.deepEqual(Object.keys(shellCopy.en.areas).sort(), Object.keys(shellCopy.pt.areas).sort());
    assert.deepEqual(Object.keys(shellCopy.en.areaDescriptions).sort(), Object.keys(shellCopy.pt.areaDescriptions).sort());
    assert.deepEqual(Object.keys(shellCopy.en.orders).sort(), Object.keys(shellCopy.pt.orders).sort());
    for (const language of locales) {
      for (const [key, value] of Object.entries(shellCopy[language] as ShellCopy)) {
        if (typeof value === 'string') {
          assert.notEqual(value.trim(), '', key);
        }
      }
      for (const area of webAreas) {
        assert.ok(areaText(language, area.id).trim().length > 0, `${language} ${area.id}`);
        assert.ok(areaDescription(language, area.id).trim().length > 0, `${language} ${area.id}`);
      }
    }
  });

  it('fails a missing or blank translation instead of returning it', () => {
    assert.throws(() => presentText('en', 'missing', undefined));
    assert.throws(() => presentText('pt', 'missing', ''));
    assert.throws(() => presentText('pt', 'missing', '   '));
  });

  it('uses only the shared language codes', () => {
    const languages = Object.keys(shellCopy) as Locale[];
    assert.deepEqual(languages.sort(), [...locales].sort());
  });
});