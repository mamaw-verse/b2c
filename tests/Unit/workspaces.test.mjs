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
