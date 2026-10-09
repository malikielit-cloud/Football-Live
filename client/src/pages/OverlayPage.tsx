import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MatchState } from 'shared';
import { socketClient } from '../lib/socket';
import { api } from '../lib/api';
import { ScoreboardOverlay } from '../features/scoreboard/ScoreboardOverlay';
import { GoalCelebrationOverlay } from '../features/scoreboard/GoalCelebrationOverlay';
import { CardPopupOverlay } from '../features/scoreboard/CardPopupOverlay';
import { PeriodBannerOverlay } from '../features/scoreboard/HalfTimeOverlay';
import { SponsorTakeoverOverlay } from '../features/scoreboard/SponsorTakeoverOverlay';
import { TickerBannerOverlay } from '../features/scoreboard/TickerBannerOverlay';

export const OverlayPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId') || '';
  const [matchState, setMatchState] = useState<MatchState | null>(null);

  useEffect(() => {
    // Set transparent background for OBS / Larix Broadcaster
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';

    socketClient.init();

    if (matchId) {
      socketClient.joinMatch(matchId);
      api
        .getMatch(matchId)
        .then((res) => setMatchState(res.match))
        .catch(console.error);
    } else {
      // Fallback: fetch first match if no param provided
      api
        .getMatches()
        .then((res) => {
          if (res.matches.length > 0) {
            const first = res.matches[0];
            setMatchState(first);
            socketClient.joinMatch(first.id);
          }
        })
        .catch(console.error);
    }

    const unsub = socketClient.subscribe((state) => {
      setMatchState(state);
    });

    return () => {
      unsub();
    };
  }, [matchId]);

  if (!matchState) {
    return null; // Keep completely transparent while loading
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent select-none">
      {/* 1. Scoreboard (Top Left) */}
      {(matchState.activeScene === 'MATCH_LIVE' ||
        matchState.activeScene === 'GOAL_CELEBRATION') && (
        <div className="absolute top-6 left-8 z-30">
          <ScoreboardOverlay state={matchState} />
        </div>
      )}

      {/* 2. Goal Celebration Popup */}
      {matchState.activeScene === 'GOAL_CELEBRATION' && (
        <GoalCelebrationOverlay goal={matchState.lastGoalEvent} />
      )}

      {/* 3. Card Popup */}
      <CardPopupOverlay card={matchState.lastCardEvent} />

      {/* 4. Half Time / Full Time Overlays */}
      {matchState.activeScene === 'HALF_TIME' && (
        <PeriodBannerOverlay state={matchState} title="HALF TIME • តង់ទី១ បញ្ចប់" />
      )}
      {(matchState.activeScene === 'FULL_TIME' ||
        matchState.activeScene === 'MATCH_RESULT') && (
        <PeriodBannerOverlay state={matchState} title="FULL TIME • ចប់ការប្រកួត" />
      )}

      {/* 5. Sponsor Fullscreen Takeover */}
      {matchState.activeScene === 'SPONSOR_FULLSCREEN' && (
        <SponsorTakeoverOverlay sponsor={matchState.sponsorBanner} />
      )}

      {/* 6. Scrolling Ticker at Bottom */}
      <TickerBannerOverlay ticker={matchState.ticker} />
    </div>
  );
};
