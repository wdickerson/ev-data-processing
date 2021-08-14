## Some data processing for a school project

This is just a script that determines how many electric vehicle charging stations are in and near each county in New York.

See inline comments in `process.env` for methodology.

## Running the script

1. Contact me for these three files (not publicly available):
`charging-stations.json`
`zips.json`
`zip-coordinates.json`

2. `npm install` to get install dependencies

3. `node process.env` to process the data

4. Youre results will be in `chargers-by-county.csv`, with columns: county, stations in county, stations within 5 km of county
