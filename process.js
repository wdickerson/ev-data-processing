const stations = require('./charging-stations.json');
const zips = require('./zips.json');
const zipCoordinates = require('./zip-coordinates.json').features;

const fs = require('fs');
const geolib = require('geolib');

// Filter all of the US zip codes to just NY zip codes
const nyZipCoordinates = zipCoordinates.filter(zip => zip.properties.STATE == 'NY');

// Build a dictionary to map <zip code>: {lat, lng}
const nyZipCoordinatesMap = {};
nyZipCoordinates.forEach(zip => {
    nyZipCoordinatesMap[zip.properties.ZIP] = {
        latitude: zip.geometry.coordinates[1],
        longitude: zip.geometry.coordinates[0],
    }
});

const counties = {};
const zipToCountyCode = {};
zips.forEach(zip => {
    // Build a dictionary to map <zip code>: <county code>
    zipToCountyCode[zip.zip_code] = zip.county_code;

    // Build a dictionary to map 
    // <county_code> : 
    //   {county name, stations in county, stations within 5km, [list of lat/lng of county's zip codes]}
    counties[zip.county_code] = {
        county: zip.county,
        county_code: zip.county_code,
        stations_in_county: 0,
        stations_within_5km: 0,
        zip_coordinates: [],
    };
});

// For each county, populate the list of lat/lngs of the zips within the county
zips.forEach(zip => {
    if (nyZipCoordinatesMap[zip.zip_code]) {
        counties[zip.county_code].zip_coordinates.push(nyZipCoordinatesMap[zip.zip_code]);
    }
});

// For each charging station, increment stations_in_county of the appropriate county
stations.forEach(station => {
    const zip = station.zip;
    const countyCode = zipToCountyCode[zip];
    const county = counties[countyCode];
    if (county) county.stations_in_county++;
});

// For each charging station, increment stations_within_5km of each appropriate county
stations.forEach(station => {
    const stationCoordinates = {
        latitude: Number(station.latitude),
        longitude: Number(station.longitude),
    }

    const stationZip = station.zip;
    const stationCountyCode = zipToCountyCode[stationZip];
    Object.values(counties).forEach(county => {
        let isChargerWithin5km = false;
        if (stationCountyCode == county.county_code) isChargerWithin5km = true;
        county.zip_coordinates.forEach(coordinates => {
            // If set of coordinates is close enough to the charger,
            // inrement the county's stations_within_5km
            const distanceInMeters = geolib.getDistance(stationCoordinates, coordinates);
            if (distanceInMeters <= 5000) isChargerWithin5km = true;
        })
        if (isChargerWithin5km) county.stations_within_5km++;
    })
});

// Sort the counties alphabetically
const alphabeticalCounties = Object.values(counties).sort(
    (a, b) => a.county.localeCompare(b.county)
);

// Create the desired text to export to csv, and write to a file
let csv = 'county,stations in county,stations within 5km\n';
alphabeticalCounties.forEach(county => {
    csv += `${county.county},${county.stations_in_county},${county.stations_within_5km}\n`;
})
fs.writeFileSync('./chargers-by-county.csv', csv);
