import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('resources/js/lib/workspaces.ts', 'utf8');

// Assert buyer.affiliate is defined in workspaceFeatures with default false
assert.match(
    source,
    /'buyer\.affiliate':\s*false/,
    'buyer.affiliate flag must default to false in workspaceFeatures',
);

// Assert the Affiliate nav item is gated by buyer.affiliate
assert.match(
    source,
    /label:\s*'Affiliate'[\s\S]*?feature:\s*'buyer\.affiliate'/,
    'Affiliate nav item must be gated by buyer.affiliate feature flag',
);

console.log('workspaces: buyer.affiliate flag and nav gating pass');

// Editors (docs/planning/15-blog.md §6.5) see only the blog items flagged for them.
assert.match(
    source,
    /label:\s*'Posts'[\s\S]*?audience:\s*\['admin',\s*'editor'\]/,
    'Blog Posts must be visible to editors',
);
assert.match(
    source,
    /label:\s*'My profile'[\s\S]*?audience:\s*\['editor'\]/,
    'My profile is the editor-only profile entry',
);
for (const label of ['Blog categories', 'Authors', 'Editors']) {
    const item = source.match(
        new RegExp(`label:\\s*'${label}',[\\s\\S]*?\\n\\s{20}\\},`),
    );
    assert.ok(item, `${label} nav item must exist`);
    assert.doesNotMatch(
        item[0],
        /audience:/,
        `${label} must stay admin-only (no audience flag)`,
    );
}
assert.match(
    source,
    /!\(item\.audience \?\? \['admin'\]\)\.includes\(adminAudience\)/,
    'admin nav items without an audience flag must default to admins only',
);

console.log('workspaces: editor audience gating passes');
