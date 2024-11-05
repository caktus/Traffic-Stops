
curl --user "forwardjustice:trafficstops" --insecure --header "Host: staging.nccopwatch.org" --head https://staging-origin.nccopwatch.org/api/agency/-1/search-rate/



time for i in {1..2}; curl --user "forwardjustice:trafficstops" --insecure --header "Host: staging.nccopwatch.org" --head https://staging-origin.nccopwatch.org/api/agency/-1/search-rate/; done;
