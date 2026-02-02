# Snapshots

Snapshots capture the state of a running sandbox, including the filesystem and installed packages. Use snapshots to skip setup time on subsequent runs.

## [When to use snapshots](#when-to-use-snapshots)

*   Faster startups: Skip dependency installation by snapshotting after setup.
*   Checkpointing: Save progress on long-running tasks.
*   Sharing environments: Give teammates an identical starting point.

## [Create a snapshot](#create-a-snapshot)

Call `snapshot()` on a running sandbox:

Once you create a snapshot, the sandbox shuts down automatically and becomes unreachable. You don't need to stop it afterwards.

CLITypeScriptPython

```
import { Sandbox } from '@vercel/sandbox';
 
const sandbox = await Sandbox.create();
 
// Install dependencies, configure environment, etc.
await sandbox.runCommand('npm', ['install']);
 
// Snapshot and get the ID
const snapshot = await sandbox.snapshot();
console.log(snapshot.snapshotId);
```

## [Create a sandbox from a snapshot](#create-a-sandbox-from-a-snapshot)

Pass the snapshot ID when creating a new sandbox:

CLITypeScriptPython

```
const sandbox = await Sandbox.create({
  source: { type: 'snapshot', snapshotId: 'snap_abc123' },
});
```

## [List snapshots](#list-snapshots)

View all snapshots for your project:

CLITypeScriptPython

```
import { Snapshot } from '@vercel/sandbox';
 
const { json: { snapshots } } = await Snapshot.list();
for (const snapshot of snapshots) {
  console.log(snapshot.snapshotId, snapshot.status);
}
```

## [Retrieve an existing snapshot](#retrieve-an-existing-snapshot)

Look up a snapshot by ID:

CLITypeScriptPython

```
import { Snapshot } from '@vercel/sandbox';
 
const snapshot = await Snapshot.get({ snapshotId: 'snap_abc123' });
console.log(snapshot.status); // "created" | "deleted" | "failed"
```

## [Delete a snapshot](#delete-a-snapshot)

Remove snapshots you no longer need:

CLITypeScriptPython

```
await snapshot.delete();
```

## [Snapshot limits](#snapshot-limits)

*   Snapshots expire after 7 days
*   See [Pricing and Limits](/docs/vercel-sandbox/pricing#snapshot-storage) for storage costs and limits