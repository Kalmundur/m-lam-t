# Alþingi XML fixtures

Trimmed copies of real responses from https://www.althingi.is/altext/xml/, downloaded on 2026-10-16. The tests in `scripts/althingi.test.ts` use them.

| File | Source | Trimmed to |
|---|---|---|
| `current-session.xml` | `loggjafarthing/yfirstandandi/` | unchanged |
| `vote-list.xml` | `atkvaedagreidslur/?lthing=157` | 4 votes: declared (68142), electronic and passed (69251), electronic and rejected (68284), roll call (68544) |
| `vote-detail.xml` | `atkvaedagreidslur/atkvaedagreidsla/?numer=69066` | 8 of 63 members, two of each vote value that occurred |
| `seat-history.xml` | `thingmenn/thingmadur/thingseta/?nr=1329` | seats in sessions 157–158, including the change of group on 13.04.2026 |

The member lists are trimmed, so their counts no longer add up to the totals in the vote. Nothing in the files was edited except by removing whole elements.
