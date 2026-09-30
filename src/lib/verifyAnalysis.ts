import { DEMO_DOCUMENTS, DEMO_EVENTS } from './demoData';
import { runFullAnalysis } from './analysis';

export function verifyDemoAnalysis() {
  const result = runFullAnalysis(DEMO_EVENTS, DEMO_DOCUMENTS, 45);

  const passedConflicts = result.conflicts.length === 2;
  const passedGaps = result.gaps.length === 1 && result.gaps[0].days === 115;
  const matchedLoops = result.openLoops.filter((l) => l.status === 'matched').length;
  const unmatchedLoops = result.openLoops.filter((l) => l.status === 'unmatched').length;
  const passedLoops = matchedLoops === 3 && unmatchedLoops === 1;

  console.log('[MediChron Verification Check]');
  console.log(`- Conflicts count: ${result.conflicts.length} (Expected: 2) -> ${passedConflicts ? 'PASSED' : 'FAILED'}`);
  console.log(`- Gaps count: ${result.gaps.length}, days: ${result.gaps[0]?.days} (Expected: 1 gap of 115 days) -> ${passedGaps ? 'PASSED' : 'FAILED'}`);
  console.log(`- Open loops: matched=${matchedLoops}, unmatched=${unmatchedLoops} (Expected: 3 matched, 1 unmatched) -> ${passedLoops ? 'PASSED' : 'FAILED'}`);

  return {
    allPassed: passedConflicts && passedGaps && passedLoops,
    conflicts: result.conflicts,
    gaps: result.gaps,
    openLoops: result.openLoops,
  };
}
