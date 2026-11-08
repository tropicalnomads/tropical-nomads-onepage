import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { palette } from '../../one-pager/src/theme/palette.ts';
import { brandVariables } from '../src/brand.ts';

describe('one-pager brand', () => {
  it('uses the one-pager palette for the stylesheet variables', () => {
    assert.equal(brandVariables['--tn-color-brand-navy'], palette.brand.navy);
    assert.equal(brandVariables['--tn-color-brand-navy-elevated'], palette.brand.navyElevated);
    assert.equal(brandVariables['--tn-color-brand-navy-deep'], palette.brand.navyDeep);
    assert.equal(brandVariables['--tn-color-text-primary'], palette.brand.cream);
    assert.equal(brandVariables['--tn-color-brand-turquoise-rgb'], '46 196 182');
    assert.equal(brandVariables['--tn-color-brand-pink-rgb'], '255 79 163');
    assert.equal(brandVariables['--tn-color-brand-yellow-rgb'], '250 208 46');
  });

  it('covers every color variable the one-pager stylesheet reads', () => {
    const css = readFileSync(new URL('../../one-pager/src/styles/globals.css', import.meta.url), 'utf8');
    const used = [...css.matchAll(/var\((--tn-color-[a-z0-9-]+)\)/g)].map((match) => match[1] ?? '');
    assert.ok(used.length > 0);
    for (const name of used) {
      assert.equal(typeof brandVariables[name], 'string', name);
    }
  });

  it('imports the one-pager stylesheet, theme, and empty state', () => {
    const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
    const theme = readFileSync(new URL('../tailwind.config.ts', import.meta.url), 'utf8');
    const area = readFileSync(new URL('../src/components/AreaSection.tsx', import.meta.url), 'utf8');
    assert.match(css, /one-pager\/src\/styles\/globals\.css/);
    assert.match(theme, /one-pager\/tailwind\.config/);
    assert.match(area, /one-pager\/src\/components\/EmptyState/);
  });
});
