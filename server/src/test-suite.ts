import { MatchService } from './services/matchService';
import { PairingCodeManager } from './auth/pairingCodeManager';
import { IdempotencyStore } from './websocket/idempotencyStore';
import { validateRemoteCommand } from './websocket/commandValidator';
import { canControlMatch, hasPermission } from './auth/roles';
import { getDatabaseAdapter } from './database';
import { RemoteCommand } from 'shared';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PRO FOOTBALL LIVE STUDIO v2 TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(testName: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details || 'Assertion failed'}`);
    }
  }

  // TEST 1: Database Adapter & Defaults
  const db = await getDatabaseAdapter();
  const matches = await db.getMatches();
  assert('DB Adapter initializes and loads default matches', matches.length > 0);

  // TEST 2: Pairing Code Manager
  const matchId = matches[0].id;
  const pairCode = PairingCodeManager.generateCodeForMatch(matchId);
  assert('Pairing Code generated is 6 digits', /^\d{6}$/.test(pairCode));

  const session = PairingCodeManager.validateCode(pairCode);
  assert('Pairing Code validation retrieves valid session', session !== null && session.matchId === matchId);

  // TEST 3: Idempotency Store
  const testCmdId = 'cmd-unique-test-123';
  assert('IdempotencyStore reports false for unseen commandId', !IdempotencyStore.has(testCmdId));

  IdempotencyStore.set(testCmdId, {
    commandId: testCmdId,
    matchId,
    success: true,
    version: 1,
    timestamp: Date.now(),
  });
  assert('IdempotencyStore reports true for cached commandId', IdempotencyStore.has(testCmdId));

  // TEST 4: Command Validation
  const validCommand: RemoteCommand = {
    commandId: 'cmd-test-add-goal',
    matchId,
    userId: 'user-op-1',
    timestamp: Date.now(),
    expectedVersion: 1,
    action: 'ADD_GOAL',
    payload: { team: 'home' },
  };
  const valResult = validateRemoteCommand(validCommand);
  assert('Command validator accepts valid ADD_GOAL command', valResult.valid === true);

  const invalidCommand = {
    commandId: 'cmd-invalid',
    matchId,
    action: 'ADD_GOAL',
    payload: { team: 'invalid_team' }, // Must be home or away
  };
  const valInvalidResult = validateRemoteCommand(invalidCommand);
  assert('Command validator rejects invalid payload', valInvalidResult.valid === false);

  // TEST 5: RBAC Role Permissions
  assert('ADMIN has OPERATOR permissions', hasPermission('ADMIN', 'OPERATOR'));
  assert('OPERATOR can control match', canControlMatch('OPERATOR'));
  assert('VIEWER cannot control match', !canControlMatch('VIEWER'));

  // TEST 6: MatchService Business Logic
  const matchService = MatchService.getInstance();
  await matchService.initialize();

  const initialMatch = matchService.getMatch(matchId)!;
  const initialVersion = initialMatch.version;
  const initialHomeScore = initialMatch.homeScore;

  // Execute Goal
  const goalResult = await matchService.executeCommand(validCommand);
  assert('ADD_GOAL increments homeScore', goalResult.match.homeScore === initialHomeScore + 1);
  assert('ADD_GOAL increments version', goalResult.match.version === initialVersion + 1);
  assert('ADD_GOAL activates GOAL_CELEBRATION scene', goalResult.match.activeScene === 'GOAL_CELEBRATION');

  // Execute Undo Goal
  const undoResult = await matchService.executeCommand({
    commandId: 'cmd-test-undo-goal',
    matchId,
    userId: 'user-op-1',
    timestamp: Date.now(),
    expectedVersion: goalResult.match.version,
    action: 'UNDO_GOAL',
    payload: { team: 'home' },
  });
  assert('UNDO_GOAL restores homeScore', undoResult.match.homeScore === initialHomeScore);
  assert('UNDO_GOAL resets active scene to MATCH_LIVE', undoResult.match.activeScene === 'MATCH_LIVE');

  // Clock Control
  await matchService.executeCommand({
    commandId: 'cmd-test-clock-start',
    matchId,
    userId: 'user-op-1',
    timestamp: Date.now(),
    expectedVersion: undoResult.match.version,
    action: 'START_CLOCK',
    payload: {},
  });
  const runningMatch = matchService.getMatch(matchId)!;
  assert('START_CLOCK sets clock.running to true', runningMatch.clock.running === true);

  await matchService.executeCommand({
    commandId: 'cmd-test-clock-pause',
    matchId,
    userId: 'user-op-1',
    timestamp: Date.now(),
    expectedVersion: runningMatch.version,
    action: 'PAUSE_CLOCK',
    payload: {},
  });
  const pausedMatch = matchService.getMatch(matchId)!;
  assert('PAUSE_CLOCK sets clock.running to false', pausedMatch.clock.running === false);

  console.log(`\n====================================================`);
  console.log(`📊 TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log(`====================================================`);

  await matchService.destroy();
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
