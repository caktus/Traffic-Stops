# Likelihood of Stop: County vs Agency Level Discrepancies

Two related bugs caused the county-level choropleth map and the agency-level
data table to show different disparity ratios for the same county.

## Bug 1: Small-city agencies inflating county stop rates

**Symptom:** The county choropleth showed a much higher disparity ratio than any
individual agency shown for that county (e.g. Yancey County: 5.74x county vs 3.73x Sheriff).

**Cause:** The county aggregate summed stops from *all* agencies in a county,
including small-city agencies (population under 10,000). Those same agencies were
correctly excluded from agency-level results because they failed the minimum
population filter. The result was stops in the numerator with no matching visible
agency, artificially inflating the county rate.

**Fix:** The county stop aggregation now applies the same population filter as the
agency level — only stops from agencies whose own ACS geography exceeds the minimum
population threshold are counted toward the county total.

---

## Bug 2: County average in hover table using wrong population denominator

**Symptom:** The agency hover table showed a `times_likely_county_average` that
differed from the county value on the choropleth map for multi-agency counties
(e.g. Moore County: 2.74x in the table vs 2.65x on the map).

**Cause:** The hover table computed the county average by summing the individual
ACS populations of each qualifying agency and using that as the denominator. For
counties with multiple agencies, each agency's ACS coverage is scoped to its own
city or place boundary, so their sum is smaller than the true county ACS population.
The choropleth used the correct county-geography ACS population, producing a
different rate.

**Fix:** The hover table now reads `times_likely_county_average` directly from the
county-level comparison (which uses the county ACS geography), ensuring the table
and map always display the same value.
