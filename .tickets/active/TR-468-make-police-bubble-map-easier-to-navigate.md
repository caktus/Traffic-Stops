---
id: TR-468
github_issue: 468
github_url: https://github.com/caktus/Traffic-Stops/issues/468
last_synced: '2026-11-18T16:44:35.968968+00:00'
synced_hash: a2a7b782810b18da061974573cb4af219e790ddfbec30894d47c5272b79ead1f
title: Make police bubble map easier to navigate
type: Bug
assignee: '@me'
labels:
- phase/in-progress
context:
  relates_to: []
---

As a user, I want to identify and select police departments in dense areas, so that I can explore disparities across North Carolina.

Large overlapping bubbles make departments difficult to find and hover, particularly in the Triangle and Charlotte. Some agencies, including Raleigh PD and CMPD, are obscured.

### To Do
- Explore ways to reduce overlap while preserving bubble-size meaning.

## AC
- [ ] Users can identify and select Raleigh PD, CMPD, and other overlapping departments.
- [ ] Dense areas remain usable without large bubbles blocking smaller bubbles.
- [ ] Each department's tooltip and agency details remain accessible.

<!-- tickets:research -->
- The map plots every agency marker at the latitude and longitude supplied by the police disparities API, without displacement, clustering, zoom controls, or an agency search (`frontend/src/Components/AgencyDisparities/PoliceBubbleMap.js:199-231`; `frontend/src/Components/AgencyDisparities/MapPrimitives.js:10-23`).
- Bubble radius is logarithmically scaled from 4 to 24 map units and clamped at the 95th percentile of total stops. Large bubbles are intentionally rendered first so smaller bubbles sit above them, but that ordering only controls the hit target for partial overlap; it cannot make a fully covered marker independently reachable (`frontend/src/Components/AgencyDisparities/PoliceBubbleMap.js:29-30, 56-85, 126-132`).
- Coordinates are Census place centroids, not police-station or jurisdiction coordinates. Agencies are linked to an ACS profile ID, and the view joins all agencies with the same profile ID to the same most-recent Gazetteer latitude/longitude (`nc/models.py:443-461, 479-537`; `tsdata/acs.py:156-213`). Exact coordinate collisions are therefore possible when multiple agencies map to one Census place.
- The API requires coordinates, a valid stop-rate ratio, and at least 100 stops for the selected race before an agency is shown. Raleigh PD or CMPD not appearing can therefore mean either overlap or an eligibility/coordinate condition in the endpoint; production response data should be checked before implementation (`nc/views/likelihood.py:526-590`).
- Hovering redraws the current bubble above the others and shows a cursor-following tooltip, but the replay is `pointerEvents="none"`, so it does not create a persistent picker for underlying agencies. Clicking immediately navigates away to the agency details page (`frontend/src/Components/AgencyDisparities/PoliceBubbleMap.js:93-116, 218-231`).
- The existing alternative is a paginated, sortable data table opened with "View Data". It links agency names to their detail pages but has no table search or map-to-row synchronization (`frontend/src/Components/AgencyDisparities/DisparityTable.js:10-64`; `frontend/src/Components/AgencyDisparities/DisparityTableModal.js:65-77`).
- There are no frontend tests for this component. Backend tests cover coordinate flow and map eligibility, but not collision behavior or frontend marker interaction (`nc/tests/api/test_disparities.py:210-286`; `nc/tests/test_likelihood_comparison.py:819-940`).

### Implementation implications
- A smaller fixed maximum radius would reduce overlap but cannot solve exact-coordinate collisions or guarantee access to every agency.
- Zooming helps nearby places, but it does not resolve agencies at identical coordinates and should not be the only remedy.
- Candidate solutions should preserve truthful size encoding while providing an explicit way to select an occluded agency, such as collision displacement/spiderfying, clustering with selection, or a linked searchable agency list. The exact solution should be evaluated against Raleigh, CMPD, and at least one pair sharing a Census profile ID.
- Production verification: confirm the selected year/race, the presence of Raleigh PD and CMPD in `/api/disparities/police/`, their coordinates and stop totals, and the number of agencies sharing each coordinate pair.

### Live browser observations (2026-11-18)
- At the running localhost page with `Year: All` and `Race: Black`, the police API returned 131 agencies. Both `Charlotte-Mecklenburg Police Department` (95,083 total stops) and `Raleigh Police Department` (51,423 total stops) are present; there were no agencies with exactly duplicated latitude/longitude values. This is therefore visible overlap, not merely missing records.
- CMPD and Raleigh are the first and second bubbles in descending total-stop draw order, respectively, and both use the clamped 24-unit radius. Their centers are then covered by later, smaller agencies.
- Hovering CMPD's actual projected center produced the tooltip for `Mint Hill Police Department`; hovering Raleigh PD's projected center produced `Knightdale Police Department`. Direct access to the two highest-volume agencies is blocked by the topmost nearby markers under normal pointer behavior.
- The state-level overview visibly contains broad, dense clusters in the Charlotte area and central Triangle. Reducing radius may expose more of the map, but the live centroid behavior shows that a user still needs a deterministic way to choose a covered agency.
- The evidence supports retaining the underlying geographic placement and total-stop size encoding while adding interaction for overlapping points. A linked searchable/persistent agency picker, collision displacement, or clustering that exposes all members would make the hidden agencies reachable; the optimal approach still needs comparison and UX validation.

### External pattern research
- Mapbox's point-clustering model separates clustered features from unclustered points and recomputes clusters as the camera changes. A cluster can carry summary properties, and Mapbox demonstrates custom cluster symbols such as a donut with a member count; this supports a multiscale model rather than showing the same 24-pixel bubbles at every scale (`https://docs.mapbox.com/mapbox-gl-js/example/cluster-html/`; `https://docs.mapbox.com/ios/maps/examples/point-clustering/`).
- Datawrapper recommends grouping only overlapping symbols or using geographic bins when a packed symbol map becomes chaotic. Its grouped symbols can expose the members through grouped tooltips, and it explicitly calls for checking mobile/tablet views after tuning grouping behavior (`https://www.datawrapper.de/docs/grouping-symbols-in-symbol-maps`).
- Esri treats identical or overlapping points as a symbol-placement problem. Its documented patterns are to disperse markers based on symbol spacing or use callout-style labels so individual features remain visible; this aligns with spiderfying or collision displacement, but introduces visual offsets that must be distinguished from true coordinates (`https://support.esri.com/en-us/knowledge-base/how-to-offset-overlapping-point-feature-symbols-in-arcg-000025395`).
- These patterns suggest a hybrid rule: keep the statewide view simple with clusters or grouped summaries, expose individual agencies at closer scale or on cluster selection, and provide a text-based fallback when screen-space symbols still collide.

### Large-agency grouping observation (2026-11-18)
- For `Year: All` and `Race: Black`, 9 of 131 agencies have at least 15,000 total stops: Charlotte-Mecklenburg, Raleigh, Fayetteville, Greensboro, Winston-Salem, Concord, High Point, Durham, and Cary. The current 15,000+ cutoff is therefore a useful and recognizable cutoff.
- A large-agency isolation view would leave a small, readable set of nine while still placing them geographically. Hiding large agencies can separately reveal nearby smaller departments, including the current Charlotte and Triangle occluders.
- Because the default dense view still contains all bubbles, a volume toggle only improves use when users know to use it. A single `Large agencies` toggle should therefore mean `large only` rather than merely add/remove a legend category.

<!-- tickets:approaches -->
### Option 1 — Searchable agency selector with overlap-aware picking
Keep every bubble at its Census place centroid. Add agency search and make clicking an overlap or dense point open a compact member picker. Selecting an agency highlights it, shows its data, and provides its details link.

- Preserves true placement and the total-stops size encoding.
- Guarantees reachability by name for Raleigh PD, CMPD, and all other agencies.
- Lowest implementation burden and strongest keyboard/touch fallback.
- The statewide map can still look dense; this fixes selection more than the visual impression of clutter.

### Option 2 — Adaptive clustering with member inspection
At the statewide scale, replace dense overlapping bubbles with cluster glyphs. A cluster could show the number of agencies and the category mix, while click opens the member list; zooming reveals individual proportional bubbles. At maximum detail, use search or spiderfying for remaining collisions.

- Gives the map a cleaner overview and avoids misleadingly painting a large bubble over many agencies.
- Supports a familiar map progression: summary first, detail on zoom/click.
- Requires defining cluster size, color/category aggregation, total-stops aggregation, and when clusters dissolve. It changes the meaning of what a symbol represents at different scales.

### Option 3 — Collision displacement with true-location anchors
Spread overlapping bubbles into a small circle or spiral around their actual location, with lines back to a visible anchor dot. Trigger this automatically for dense groups or only after selecting a cluster.

- Makes every agency immediately visible as an individual bubble at one scale.
- Preserves approximate geography and keeps total-stops bubbles visible.
- Can make Triangle and Charlotte layouts busy, misread displaced position as true geography, and create unstable layouts as filters change. It needs careful mobile sizing and leader-line behavior.

### Option 4 — Regional detail insets plus statewide overview
Keep the North Carolina overview and add larger inset views for the Triangle and Charlotte. The insets retain bubble size and geography while giving dense points more room; the main map points into the active inset on selection.

- Fits the reported problem locations and does not require users to learn pan/zoom.
- Keeps an immediately readable statewide comparison.
- Adds significant page space, fixed regional boundaries, and a second navigation model. It also does not automatically solve future dense areas or tiny exact collisions.

### Option 5 — Small-marker mode or density toggle
Offer two map modes: total-stops bubbles and equal-size point markers. Keep the first for volume comparison and use the second for finding agencies without large-circle occlusion. Selecting a mode could persist while filters change.

- Very direct and preserves both visual goals: compare volume in one mode, find agencies in the other.
- Does not solve nearby equal-size markers by itself and asks users to understand two encodings.
- Could complement Options 1-3 with little conceptual overhead.

### Rejected as a complete solution — Smaller bubbles only
A lower maximum radius can reduce partial overlap, but it cannot guarantee reachability and weakens the volume comparison.

### Shortlist
The strongest combinations are:
- **Low-complexity, explicit navigation:** Option 1 + modest bubble-size tuning.
- **Best map-first experience:** Option 2 with a member picker fallback, then spiderfy only groups that remain unresolved.
- **Best for comparison:** Option 5 + Option 1, giving users a finder mode and a volume mode.

Regional insets are useful if the product team wants to emphasize Charlotte and the Triangle permanently. Full automatic displacement is the least attractive as the primary strategy because it visually moves data without solving discoverability as clearly as search or a member list.

### Option 6 — Volume filter with a major-agency view
Add a mutually exclusive agency-volume control above the map: `All agencies`, `Major agencies (15,000+ stops)`, and optionally `Smaller agencies (< 15,000 stops)`. The 15,000+ cutoff becomes an actionable filter, not only a size reference.

- The live all-years/Black dataset contains nine major agencies, so a major-agency view immediately exposes CMPD and Raleigh PD without changing their locations or radius scale.
- A smaller-agency view removes the largest occluding circles and makes dense local departments easier to inspect.
- This is substantially simpler than zooming or collision layout and directly addresses the user's proposed idea.
- A plain show/hide checkbox is too ambiguous: four interpretations are possible when large agencies are hidden or shown. A labeled segmented control is clearer.
- Fixed thresholds can produce different group sizes by year, race, or data refresh. The interface should state the cutoff and handle an empty major group gracefully.
- This improves focused views but leaves the all-agencies default dense. It should therefore be paired with either a search/picker or an automatic major-agency emphasis, rather than presented as the only fix.

### Updated recommendation
Use a volume segmented control as a low-complexity first enhancement: `All`, `15,000+ stops`, and `Under 15,000 stops`. Pair it with the existing total-stops legend and an agency search/picker. This preserves the current map while giving users direct paths to the two major cases: finding CMPD/Raleigh and uncovering smaller local departments. If that still feels like too much UI, begin with `Major agencies only` as a toggle plus search.

### Selected direction — Three agency-volume views
Use a labeled segmented control with:
- `All agencies`
- `15,000+ stops`
- `Under 15,000 stops`

The control sits with the police map controls, before or beside the size legend. `All agencies` is the default and preserves the current map. The two focused modes filter only which agency bubbles are rendered and keep the current coordinates, colors, disparity-category toggles, size scale, tooltips, and click navigation.

This direction was selected because the large-agency mode reduces the live map from 131 agencies to nine, including CMPD and Raleigh PD. The smaller-agency mode removes the largest occluding bubbles and exposes local departments. The three labels make the behavior unambiguous without requiring users to infer how independent volume checkboxes combine.

### Short design for review
- Intent: let users separate high-volume agencies from smaller/local agencies without losing the bubble-map comparison.
- Goal: make CMPD, Raleigh PD, and smaller departments easier to locate in dense areas.
- Non-goal: change stop-volume meaning, move agencies away from their Census place centroids, or add map pan/zoom in this iteration.
- Selection behavior: the control is mutually exclusive and defaults to `All agencies`; it remains selected when race or year changes.
- Empty state: if a focused group has no agencies after filters are applied, show a short message instead of an empty, unexplained map.
- Accessibility: provide a labeled group with visible pressed/selected state and full keyboard interaction.
- Validation: verify all three modes for `All years / Black`, confirm CMPD and Raleigh PD appear in `15,000+`, confirm their nearby smaller agencies appear in `Under 15,000`, and verify mobile layout does not obscure the map controls.

This volume split addresses the main occlusion pattern but may not make every smaller-agency collision independently selectable. If user testing still finds covered departments, the next iteration should add agency search or an overlap member picker rather than more visual displacement.

<!-- tickets:plan -->
# Police Bubble Map Volume Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mutually exclusive volume control to the police bubble map so users can view all agencies, major agencies with at least 15,000 total stops, or smaller agencies below 15,000 total stops.

**Architecture:** Keep the API payload, geographic coordinates, color categories, bubble-size scale, tooltips, and navigation unchanged. Add local React state in `PoliceBubbleMap` for the active volume mode, derive the rendered markers through one filter function, and use a small styled segmented control above the size legend.

**Tech Stack:** React 18, JavaScript, styled-components, react-simple-maps, ESLint, and shared-browser verification.

**Spec:** `.tickets/draft/TR-438-make-police-bubble-map-easier-to-navigate.md` (`research` and `approaches` sections, selected direction and short design).

## Global Constraints

- Do not add dependencies or change the disparities API.
- Use exactly 15,000 total stops as the major-agency cutoff, with 15,000 included in the major group.
- The volume modes are mutually exclusive: `all`, `major`, and `smaller`; default to `all`.
- Keep all rows in the View Data table and calculate bubble radii from the full response so the size legend remains stable across modes.
- Preserve the current disparity-category and sub-threshold filters and combine them with the volume filter.
- Do not move bubbles, change coordinates, or add pan/zoom in this implementation.
- Clear hover state when the volume mode changes so a hidden bubble cannot remain highlighted.
- The focused empty state is a short inline status message; do not remove the county map.

## Review Focus

- Exact boundary: 15,000 belongs to `15,000+ stops`; 14,999 belongs to `Under 15,000 stops`.
- Combined filters: volume filtering must not bypass disparity-category or sub-threshold visibility choices.
- Empty combinations: selecting a group with no remaining rows must show a status message without throwing.
- Filter stability: changing year or race must preserve the selected volume mode while clearing stale hover state.
- Accessibility and mobile: each mode must be keyboard-operable, expose selected state, and remain readable when controls wrap.

---

### Task 1: Verify the missing behavior in the shared browser

**Files:**
- Verify: `frontend/src/Components/AgencyDisparities/PoliceBubbleMap.js`

- [ ] **Step 1: Refresh the shared browser and confirm the controls are absent**

Use the shared page at `http://localhost:3000/agency-disparities` with `Year: All` and `Race: Black`. Confirm there are no `All agencies`, `15,000+ stops`, or `Under 15,000 stops` controls and record that all 131 bubbles currently render together.

- [ ] **Step 2: Record the live baseline**

Use the page accessibility snapshot and SVG marker count as the baseline. Confirm CMPD and Raleigh PD remain present in the API but are covered at their map positions.

### Task 2: Implement the volume filter and controls

**Files:**
- Modify: `frontend/src/Components/AgencyDisparities/PoliceBubbleMap.js`
- Modify: `frontend/src/Components/AgencyDisparities/AgencyDisparities.styled.js`

**Interfaces:**
- Consumes: `AGENCY_VOLUME_FILTERS` and `filterAgenciesByVolume` from Task 1.
- Produces: a selected `volumeFilter` state, accessible volume controls, filtered markers, and a visible empty state.

- [ ] **Step 1: Add the volume constants and pure filter function**

At module scope, define `MAJOR_AGENCY_STOPS = 20000`, `AGENCY_VOLUME_FILTERS = { ALL: 'all', MAJOR: 'major', SMALLER: 'smaller' }`, and `filterAgenciesByVolume`. Treat missing or nonnumeric `total_stops` as `0` so those rows belong to the smaller group.

- [ ] **Step 2: Add `volumeFilter` state and mode-changing handler**

Default `volumeFilter` to `AGENCY_VOLUME_FILTERS.ALL`. Add a handler that sets the mode and calls `clearHover()`.

- [ ] **Step 3: Add a styled segmented control above the size legend**

Render `VolumeFilter` as a `role="group"` labeled `Agency stop volume`. Render `VolumeFilterButton` buttons labeled `All agencies`, `15,000+ stops`, and `Under 15,000 stops`; each button receives `aria-pressed` for its mode and invokes the handler. Style the selected mode distinctly and preserve wrapping at tablet/mobile widths.

- [ ] **Step 4: Compose all marker filters in the existing order**

Apply `showSubThreshold`, `hiddenCategories`, then `filterAgenciesByVolume` before sorting large bubbles first. Do not filter the rows passed to `DisparityTable` or the rows used to calculate the size scale and legend.

- [ ] **Step 5: Add the filtered empty state**

When the resulting marker array is empty, render a visible `role="status"` message: `No agencies match the selected volume and disparity filters.` Keep the county map mounted below the controls.

- [ ] **Step 6: Verify the implementation in the shared browser**

Refresh the shared browser and confirm all three controls render, `All agencies` starts selected, `15,000+ stops` shows nine markers, and `Under 15,000 stops` shows the remaining markers without the major bubbles. Confirm CMPD and Raleigh PD tooltips are reachable in the major view.

- [ ] **Step 7: Commit the tested implementation**

```bash
git add frontend/src/Components/AgencyDisparities/PoliceBubbleMap.js frontend/src/Components/AgencyDisparities/frontend/src/Components/AgencyDisparities/AgencyDisparities.styled.js
git commit -m "feat: add police map volume filters"
```

### Task 3: Validate the complete frontend behavior

**Files:**- Verify: `frontend/src/Components/AgencyDisparities/PoliceBubbleMap.js`
- Verify: `frontend/src/Components/AgencyDisparities/AgencyDisparities.styled.js`

- [ ] **Step 1: Run ESLint on the changed files**

Run: `cd frontend && npx eslint --no-fix src/Components/AgencyDisparities/PoliceBubbleMap.js src/Components/AgencyDisparities/AgencyDisparities.styled.js`

Expected: exit 0 with no errors or warnings introduced by the change.

- [ ] **Step 2: Run the production frontend build**

Run: `cd frontend && npm run build`

Expected: build completes successfully.

- [ ] **Step 3: Verify all modes in the shared browser**

Using the shared browser page at `http://localhost:3000/agency-disparities`, refresh and select `Year: All` and `Race: Black`. Verify `All agencies` renders 131 bubbles; `15,000+ stops` renders nine bubbles and exposes the CMPD and Raleigh PD tooltips; and `Under 15,000 stops` removes the nine major-agency bubbles while retaining smaller agencies. Inspect the shared browser accessibility snapshot, hover and click one agency in each focused mode, confirm changing race or year preserves the selected volume mode, and capture a final screenshot showing the controls and map without console errors.

- [ ] **Step 4: Verify mobile layout and accessibility**

At phone and tablet widths, verify the volume labels do not overflow, keyboard Tab reaches each control, Space/Enter activates the focused control, and the selected control exposes `aria-pressed="true"`.
