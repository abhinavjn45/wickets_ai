# 🏏 Wicket.ai — Complete Feature Specification
> A full-stack, cross-platform (Android + iOS) cricket scoring and management application inspired by CricHeroes.

---

## GLOBAL CONSTRAINTS & RULES

| Constraint | Details |
|---|---|
| **Platform** | Android + iOS (React Native / Expo) |
| **Auth** | Phone OTP + Optional Email/Social login |
| **Offline Support** | Scoring must work offline; sync when connected |
| **Roles** | Player, Team Admin, Scorer, Umpire, Tournament Organizer, Ground Owner, Academy Admin, Super Admin |
| **Cricket Formats** | T20, ODI, Test (multi-day), T10, 100-ball, Custom (user-defined overs) |
| **Language** | English (primary), Multi-language support (future) |
| **Accessibility** | Font scaling, high-contrast mode |
| **Security** | JWT tokens, rate limiting, input validation, HTTPS only |
| **Data Retention** | All match/player data stored permanently |
| **Scoring Accuracy** | Each ball is atomic — undo must revert exactly one ball |

---

## MODULE 1: AUTHENTICATION & USER MANAGEMENT

### 1.1 Registration & Login
- [ ] Phone number registration with OTP verification (SMS)
- [ ] Email + password registration (alternative)
- [ ] Google / Apple social login
- [ ] Guest mode (view only — no scoring)
- [ ] Auto-fill OTP from SMS
- [ ] Resend OTP with countdown timer (30s)
- [ ] Token refresh & session management

### 1.2 User Roles & Permissions
| Role | Permissions |
|---|---|
| **Player** | View stats, join teams, update own profile |
| **Team Admin** | Manage team roster, create matches, assign scorer |
| **Scorer** | Score matches they are assigned to |
| **Umpire** | Accept umpire assignments, sign off on legal deliveries |
| **Tournament Organizer** | Create/manage entire tournaments |
| **Ground Owner** | List grounds, manage ground bookings |
| **Academy Admin** | Manage academy roster, training sessions |
| **Super Admin** | Full platform control via web dashboard |

### 1.3 Constraints
- A user can hold multiple roles simultaneously
- Only verified scorers (passed a test or manually approved) can score tournament matches
- Match data edits require Scorer or Team Admin role

---

## MODULE 2: USER PROFILE

### 2.1 Personal Profile
- [ ] Profile photo with cropping
- [ ] Cover photo / banner
- [ ] Full name, username (unique handle @username)
- [ ] Date of birth
- [ ] City, State, Country (location)
- [ ] About / Bio section
- [ ] Playing role: Batsman / Bowler / All-rounder / Wicketkeeper
- [ ] Batting style: Right-hand / Left-hand
- [ ] Bowling style: Right-arm Fast / Slow / Spin (Off/Leg) / Left-arm variants
- [ ] Favorite shirt number
- [ ] Profile verification badge (linked phone)

### 2.2 Player Statistics Dashboard
- [ ] **Batting Stats**: Matches, Innings, Runs, HS (highest score), Average, Strike Rate, 50s, 100s, Ducks, Boundaries (4s/6s)
- [ ] **Bowling Stats**: Matches, Innings, Overs, Wickets, Economy, Average, Strike Rate, Best Figures, 5-wicket hauls, Maidens
- [ ] **Fielding Stats**: Catches, Stumpings, Run-outs
- [ ] Stats broken down by: All Formats / T20 / ODI / Test / Custom
- [ ] Stats broken down by: All Time / This Year / This Season
- [ ] Head-to-head comparison with any other player

### 2.3 Career Timeline
- [ ] Chronological list of all matches played
- [ ] Matches grouped by teams and tournaments
- [ ] Filter by: Date range, Format, Team, Tournament

### 2.4 Achievements & Badges
- [ ] Auto-awarded badges: First Fifty, Century Club, Hat-Trick Hero, 5-Wicket Hero, etc.
- [ ] Tournament-specific awards: Most Runs, Most Wickets, Player of the Tournament
- [ ] Per-match awards: Player of the Match, Best Bowler, Best Batsman
- [ ] Badges shown publicly on profile wall
- [ ] Badge progress tracker (e.g., "3 more wickets to first 5-wicket haul")

### 2.5 Umpire Profile
- [ ] Register as an umpire
- [ ] Umpire certification level (enter manually; future: verified)
- [ ] Availability status: Available / Busy
- [ ] Preferred city/radius for assignments
- [ ] Matches officiated (count), visible on profile
- [ ] Ratings and reviews from tournament organizers
- [ ] Umpire can sign off on match completion

### 2.6 Scorer Profile
- [ ] Register as a scorer
- [ ] Scoring experience level (Self-assessed / Verified)
- [ ] Availability status
- [ ] Matches scored (count)
- [ ] Ratings from organizers

---

## MODULE 3: TEAM MANAGEMENT

### 3.1 Team Creation
- [ ] Team name, short name (3-letter code, e.g., "MUM")
- [ ] Team logo upload
- [ ] Team home ground (linked to ground profiles)
- [ ] Team category: Senior / Under-19 / Under-16 / Women's / Corporate / Friends

### 3.2 Team Roster
- [ ] Add players by username/phone search
- [ ] Assign roles: Captain, Vice-Captain, Wicketkeeper
- [ ] Mark players as Active/Inactive
- [ ] Player invites with accept/decline flow
- [ ] Remove player (by Team Admin only)
- [ ] Guest players (unnamed) for casual matches
- [ ] Maximum squad size: configurable (default 15)

### 3.3 Team Statistics
- [ ] Team match history (wins, losses, draws, NR)
- [ ] Win % and NRR (Net Run Rate) tracker
- [ ] Top performers per team (auto-calculated)
- [ ] Head-to-head team records

### 3.4 Constraints
- A player can be in multiple teams simultaneously
- Only the Team Admin (creator or promoted member) can manage roster
- Team deletion requires all members to leave first OR Admin force-delete

---

## MODULE 4: MATCH MANAGEMENT

### 4.1 Match Creation
- [ ] Individual Match (between two teams, no tournament)
- [ ] Tournament Match (linked to a tournament fixture)
- [ ] Match Name (optional)
- [ ] Select Home Team + Away Team
- [ ] Select Ground (from ground database or custom location)
- [ ] Select Date & Time
- [ ] Format: T20 / ODI / Test / Custom
- [ ] Overs per innings (if custom)
- [ ] Powerplay overs (configurable)
- [ ] Ball type: Tennis / Leather / Tape
- [ ] Match Officials: Assign Umpire(s) (1 or 2), Scorer
- [ ] Third Umpire (optional)

### 4.2 Toss
- [ ] Record toss winner and decision (Bat or Bowl)
- [ ] Toss timestamp logged

### 4.3 Playing XI Selection
- [ ] Select 11 players from squad for each team
- [ ] Designate Captain, Vice-Captain, Wicketkeeper
- [ ] Batting order input

### 4.4 Match States
| State | Description |
|---|---|
| `UPCOMING` | Fixture set, not started |
| `TOSS` | Toss in progress |
| `LIVE` | Innings in progress |
| `INNINGS_BREAK` | Between innings |
| `DLS_HALT` | Match halted, DLS calculations in progress |
| `COMPLETE` | Both innings done, result declared |
| `ABANDONED` | Match called off (No Result) |
| `TIED` | Match scores equal |
| `SUPER_OVER` | Super over in progress |

---

## MODULE 5: THE SCORING ENGINE (CORE)

> **This is the most critical module.** Every ball is an atomic unit. All stats flow from the ball-by-ball data.

### 5.1 Ball Recording
Each ball stores:
- [ ] Ball number (over.ball format, e.g., 4.3 = 4th over, 3rd ball)
- [ ] Bowler (in this over)
- [ ] Batsman on strike
- [ ] Non-striker
- [ ] Runs scored off the bat
- [ ] Extras type & value (see 5.2)
- [ ] Dismissal (see 5.3)
- [ ] Shot type (optional enrichment)
- [ ] Fielder involved (catches, run-outs, stumpings)

### 5.2 Extras System
| Extra | Counted In | Adds To | Free Hit? |
|---|---|---|---|
| Wide (WD) | Bowling figures (bad delivery) | Team total only | No |
| No-Ball (NB) | Bowling figures | Team total | Yes (next ball free hit) |
| Bye (B) | Not charged to bowler | Team total | No |
| Leg Bye (LB) | Not charged to bowler | Team total | No |
| Penalty Runs (5) | Neither | Team total | No |

- [ ] Wide + additional runs (e.g., Wide + 2 runs = 3 extras)
- [ ] No-Ball + runs off bat still credited to batsman
- [ ] No-Ball + byes (charged as NB+B, not to batsman or bowler)
- [ ] Overstepping no-ball vs. waist-high full toss no-ball (same rules)

### 5.3 Dismissal Types
| Dismissal | Stats Impact |
|---|---|
| Bowled | Wicket for bowler; out for batsman |
| Caught | Wicket for bowler; catch for fielder |
| LBW | Wicket for bowler |
| Run Out | NOT a wicket for bowler; credited to fielder(s) |
| Stumped | Wicket for bowler; stumping for wicketkeeper |
| Hit Wicket | Wicket for bowler |
| Handled Ball | Batsman out; NOT credited to bowler |
| Obstructed Field | Batsman out; NOT credited to bowler |
| Retired Out | Batsman out; NOT credited to bowler |
| Retired Hurt | NOT Out; can resume batting later |
| Timed Out | New batsman out before facing a ball |

- [ ] Caught & Bowled (bowler is also the catcher)
- [ ] Run-out at non-striker end (no wicket for bowler)
- [ ] Fielder involved in run-out (1 or 2 fielders)
- [ ] 5 wickets in an over (hat-trick detection, 5-wicket haul detection)

### 5.4 Over Management
- [ ] Auto-advance to next over after 6 legal deliveries
- [ ] Automatic strike change end-of-over
- [ ] Bowler cannot bowl consecutive overs (unless Super Over)
- [ ] Bowler bowling limit: 20% of total overs (e.g., 4 overs in T20)
- [ ] Maiden over detection (auto-flagged if 0 runs off bat in a complete over, no wides/no-balls)
- [ ] Over-by-over summary (auto-generated)
- [ ] Free hit tracking (after no-ball)

### 5.5 Powerplay Rules
- [ ] Mandatory Powerplay: first N overs (configurable, default: 6 in ODI, 6 in T20)
- [ ] Batting Powerplay: optional, taken by batting team (ODI only)
- [ ] Visual powerplay indicator in scoring UI
- [ ] Runs scored during powerplay tracked separately

### 5.6 Partnerships
- [ ] Auto-calculate partnership runs + balls for every pair of batsmen
- [ ] Track which pairs have batted together
- [ ] Partnership broken on each dismissal

### 5.7 Undo / Edit
- [ ] Undo last ball (within same session, no time limit)
- [ ] Edit past ball (requires scorer + admin approval for tournament matches)
- [ ] Edit log: records who edited, what changed, and when
- [ ] Undo chain: can undo multiple balls back (e.g., go back 3 balls)

### 5.8 DLS Method (Duckworth-Lewis-Stern)
- [ ] ICC DLS Calculator 5.0 standard integrated
- [ ] Apply DLS in 1st or 2nd innings
- [ ] Input: Overs lost, Wickets lost at point of interruption
- [ ] Auto-revised target calculation
- [ ] Show par score at every stage of 2nd innings
- [ ] Multiple interruption support

### 5.9 Super Over
- [ ] Trigger super over from match screen (when match is tied)
- [ ] 1 over per team, 2 wickets = innings over
- [ ] Separate super over scorecard
- [ ] Super over result determines match winner

### 5.10 Multi-Day / Test Match Specific
- [ ] Up to 5 days, 2 innings per team
- [ ] Follow-on rule (configurable lead threshold)
- [ ] Declare innings option for batting team
- [ ] Tea/Lunch/Drinks break logging
- [ ] Day's play summary (runs, wickets, overs for the day)

### 5.11 Live Scorecard
- [ ] Live running scorecard visible to all viewers (real-time)
- [ ] Current partnership, last 5 balls (over timeline)
- [ ] Required run rate (RRR) in 2nd innings
- [ ] Current run rate (CRR)
- [ ] Projected score (based on CRR)
- [ ] Team total, wickets, overs (large display)

---

## MODULE 6: SCORECARD & ANALYTICS

### 6.1 Batting Scorecard (Per Match)
- [ ] Per-batsman row: Runs, Balls, 4s, 6s, SR, Dismissal, Fielder, Bowler
- [ ] Extras breakdown (WD, NB, B, LB, P)
- [ ] Fall of Wickets (score & over at each wicket)
- [ ] Partnerships table

### 6.2 Bowling Scorecard (Per Match)
- [ ] Per-bowler row: Overs, Maidens, Runs, Wickets, Economy, No-Balls, Wides

### 6.3 Over-by-Over Breakdown
- [ ] Each over: Balls sequence (dot, run, 4, 6, W, WD, NB, etc.)
- [ ] Runs per over bar chart (Manhattan graph)

### 6.4 Advanced Analytics
- [ ] **Wagon Wheel**: Plot each shot on a fielding diagram based on direction
- [ ] **Manhattan Graph**: Bar chart of runs per over (batting perspective)
- [ ] **Worm Graph**: Cumulative runs vs overs comparison (both teams on same chart)
- [ ] **Run Rate Graph**: CRR vs RRR line chart
- [ ] **Pitch Map**: Heatmap of where each ball pitched (length & line)
- [ ] **Wagon Wheel (Bowler)**: Show where a bowler's deliveries went
- [ ] **Dot Ball %**: % of balls that were dots per over / per bowler
- [ ] **Boundary %**: % of balls that were boundaries
- [ ] **MVP Score**: Algorithmic Most Valuable Player calculation

### 6.5 Sharable Scorecards
- [ ] Generate image scorecard (shareable on WhatsApp/Instagram)
- [ ] PDF export of full scorecard
- [ ] Short link to live/completed match scorecard
- [ ] Custom team branding on shared scorecards (logo overlay)

---

## MODULE 7: TOURNAMENT MANAGEMENT

### 7.1 Tournament Creation
- [ ] Tournament name, short name, banner image
- [ ] Host city / multiple venues
- [ ] Start date - End date
- [ ] Format: League (Round Robin), Knockout, Group Stage + Knockout, Custom
- [ ] Cricket format: T20 / ODI / Custom overs
- [ ] Age category: Open, U14, U16, U19, U23, Women's, Veterans (35+)
- [ ] Ball type: Leather / Tennis
- [ ] Max teams, min teams
- [ ] Entry fee (optional)
- [ ] Prize details (text)
- [ ] Organizer contact details

### 7.2 Team Registration
- [ ] Registration form for teams
- [ ] Player registration with kit number option
- [ ] Registered player maximum per team (e.g., 2 guest players allowed)
- [ ] Approval flow: Organizer approves team registration
- [ ] Registration deadline

### 7.3 Fixture Generation
- [ ] Smart auto-schedule generator
- [ ] Manual fixture creation override
- [ ] Assign ground and time slot to each fixture
- [ ] Support byes in odd-team knockouts
- [ ] Group stage with configurable number of groups

### 7.4 Points Table
- [ ] Auto-calculated: Played, Won, Lost, Tied, NR, Points, NRR
- [ ] ICC-compliant points system (2 pts for win, 1 for NR/Tie, 0 for loss)
- [ ] Custom points system option
- [ ] NRR calculated real-time from match data

### 7.5 Tournament Leaderboards
- [ ] Most Runs (batting)
- [ ] Most Wickets (bowling)
- [ ] Best Batting Average
- [ ] Best Bowling Economy
- [ ] Most Catches
- [ ] Most 4s / 6s
- [ ] Orange Cap (runs) and Purple Cap (wickets) style tracking

### 7.6 Tournament Officials
- [ ] Assign scorer(s) per fixture
- [ ] Assign umpire(s) per fixture
- [ ] Match referee (optional)
- [ ] Officials cannot be playing in the same match they officiate

### 7.7 Tournament Notifications
- [ ] Push notification to all teams: fixture announced, match reminder, result posted
- [ ] Notification to scorer: assigned to a match

### 7.8 Constraints
- Tournament matches can only be scored by assigned scorer(s)
- Only organizer can edit fixture after publish (with audit log)
- Tournament cannot be deleted if matches are already played

---

## MODULE 8: GROUND MANAGEMENT

### 8.1 Ground Profiles
- [ ] Ground name
- [ ] Full address + Google Maps pin
- [ ] Photos (multiple)
- [ ] Facilities: Floodlights, Dressing Rooms, Parking, Canteen, Practice Nets
- [ ] Pitch type: Turf / Matting / Synthetic
- [ ] Number of pitches available

### 8.2 Ground Booking
- [ ] Define time slots (morning/afternoon/evening)
- [ ] Pricing per slot
- [ ] Availability calendar
- [ ] Booking request flow (user requests → ground owner confirms)
- [ ] Booking status: Pending / Confirmed / Cancelled
- [ ] Cancellation policy text
- [ ] Prevent double-booking of same slot

### 8.3 Ground Reviews
- [ ] Star rating (1–5) per ground
- [ ] Written review
- [ ] Reply from ground owner
- [ ] Report fake review

---

## MODULE 9: ACADEMY & CLUB MANAGEMENT

### 9.1 Academy Profile
- [ ] Academy name, logo, description
- [ ] Head coach name and contact
- [ ] Location (city, address)
- [ ] Disciplines offered: Batting, Bowling, Fielding, Fitness
- [ ] Fees (text/structured)
- [ ] Photos

### 9.2 Academy Members
- [ ] Add students/players to academy
- [ ] Role: Coach, Student, Support Staff
- [ ] Track which matches students played (linked to profiles)

### 9.3 Club Profile
- [ ] Similar to Team but permanent, city-level entity
- [ ] Club can have multiple teams
- [ ] Club leaderboards (aggregated stats across all club members)

---

## MODULE 10: COMMUNITY & SOCIAL FEED

### 10.1 Cricket Feed (Home Screen)
- [ ] Personalized feed based on: Teams you follow, Players you follow, Tournaments you follow
- [ ] Feed items: Match results, Player achievements, New badges earned, Tournament updates, Highlights
- [ ] Follow / Unfollow players, teams, tournaments
- [ ] Like on feed items
- [ ] Share feed item (generates deep link)

### 10.2 Looking For (Discovery)
- [ ] Looking for: Player / Umpire / Scorer / Opponent Team
- [ ] Post a "Looking For" request with requirements
- [ ] Browse and respond to others' requests
- [ ] Filter by City, Format, Date

### 10.3 In-App Messaging
- [ ] Direct messages between users
- [ ] Group chat for team members
- [ ] System notifications visible in message center

### 10.4 Search
- [ ] Global search: Players, Teams, Matches, Tournaments, Grounds, Academies
- [ ] Filters per category
- [ ] Recent search history
- [ ] Voice search support

---

## MODULE 11: NOTIFICATIONS

| Type | Channel |
|---|---|
| Match starting soon | Push |
| You are assigned as scorer | Push + In-App |
| Your team has a new fixture | Push |
| Your match result | Push |
| Someone followed you | In-App |
| New badge earned | Push + In-App |
| Tournament registration approved | Push |
| Ground booking confirmed | Push |
| Direct message received | Push |

- [ ] Notification preferences (per-type toggle)
- [ ] Notification history (last 90 days)
- [ ] Mark all as read

---

## MODULE 12: AI-POWERED FEATURES

### 12.1 AI Match Highlights
- [ ] Auto-generate text highlights after match completion
- [ ] Key moments detected: 50s, 100s, hat-tricks, sixes, 5-wicket hauls, tight finishes
- [ ] Highlight reel shareable card (image/text)

### 12.2 CricInsights (Analytics Engine)
- [ ] Player form tracker: Last 5/10 matches trend chart
- [ ] Strengths & weaknesses analysis (e.g., "Scores 40% of runs in boundaries")
- [ ] Head-to-head player analysis
- [ ] Comparable player suggestions ("Your stats are similar to X")

### 12.3 Smart Suggestions
- [ ] Suggest starting XI based on recent form
- [ ] Bowling change recommendations (economy + wickets weighted)

---

## MODULE 13: LIVE STREAMING (FUTURE PHASE)

- [ ] In-app RTMP stream key generation
- [ ] OBS / VMix integration instructions
- [ ] Score overlay/ticker (HTML widget URL for OBS)
- [ ] YouTube / Facebook live push (via API)
- [ ] Viewer count display
- [ ] Live commentary text (auto-generated from ball events)

---

## MODULE 14: SUBSCRIPTION & MONETIZATION

### 14.1 Free Tier
- All core scoring features
- Basic player profile
- Up to 3 tournament organizer seats

### 14.2 CricScorer PRO (Paid)
- [ ] Advanced CricInsights analytics
- [ ] Custom app theme
- [ ] Ad-free experience
- [ ] PRO badge on profile
- [ ] Discounts on merchandise (if applicable)
- [ ] Priority in umpire/scorer discovery listings

### 14.3 Tournament Pro Package (Organizer Paid)
- [ ] Custom tournament app page with branding
- [ ] Live streaming integration
- [ ] Sponsor banner placement
- [ ] "Power Promote" to show tournament in discovery feeds

### 14.4 Constraints
- Free trial for PRO (14 days)
- In-app payment via Stripe / Razorpay
- Subscription auto-renews monthly/yearly
- Refund policy: No refunds for partial months

---

## MODULE 15: SETTINGS & ADMINISTRATION

### 15.1 App Settings
- [ ] Dark mode / Light mode / System default
- [ ] Font size (Small / Medium / Large)
- [ ] Language preference
- [ ] Units (metric/imperial for pitch distances — future)
- [ ] Linked accounts (Google, Apple)
- [ ] Delete account (GDPR compliant, 30-day grace period)

### 15.2 Privacy
- [ ] Profile visibility: Public / Friends only / Private
- [ ] Stats visibility toggle per category
- [ ] Block/unblock users

### 15.3 Super Admin Web Panel
- [ ] User management (ban, verify, promote)
- [ ] Match oversight (edit any match with audit log)
- [ ] Ground approval workflow
- [ ] Content moderation (reviews, posts)
- [ ] Analytics dashboard (DAU, MAU, matches scored per day)

---

## DEVELOPMENT PHASES (RECOMMENDED ORDER)

| Phase | Modules | Goal |
|---|---|---|
| **Phase 1** | Auth, User Profile, Team Management | Onboarding + Teams |
| **Phase 2** | Match Creation, Scoring Engine | Core Cricket Scoring (MVP) |
| **Phase 3** | Scorecard, Analytics, Sharing | Insights + Virality |
| **Phase 4** | Tournament Management | Organizer market |
| **Phase 5** | Community Feed, Messaging, Notifications | Social engagement |
| **Phase 6** | Ground + Academy Management | Ecosystem expansion |
| **Phase 7** | AI Features, Streaming, Subscriptions | Monetization |

---

## TECH STACK (RECOMMENDED)

| Layer | Technology |
|---|---|
| **Mobile** | React Native (Expo) |
| **State Management** | Zustand + React Query |
| **Navigation** | Expo Router (file-based) |
| **Backend** | Node.js + Express |
| **Database** | MySQL |
| **Real-time** | Socket.IO |
| **Auth** | JWT + OTP via Twilio/MSG91 |
| **Storage** | Cloudinary (images) / S3 |
| **Payments** | Razorpay (India) / Stripe (Global) |
| **Push Notifications** | Expo Push Notifications / Firebase FCM |
| **Maps** | Google Maps API |
| **CI/CD** | EAS Build (Expo Application Services) |
| **Hosting** | Railway / Render / AWS |
