
const { Country, State, City } = require('country-state-city');

const countryCode = 'AR';
const country = Country.getCountryByCode(countryCode);
console.log(`Country: ${country.name}`);

const states = State.getStatesOfCountry(countryCode);
console.log(`States count: ${states.length}`);

// Find Buenos Aires Province (usually 'B') and CABA (usually 'C')
const baProvince = states.find(s => s.name.includes('Buenos Aires') && !s.name.includes('Ciudad'));
const caba = states.find(s => s.name.includes('Ciudad Autónoma'));

console.log('--- Buenos Aires Province ---');
if (baProvince) {
    console.log(`State: ${baProvince.name} (${baProvince.isoCode})`);
    const cities = City.getCitiesOfState(countryCode, baProvince.isoCode);
    console.log(`Cities count: ${cities.length}`);
    console.log('First 10 cities:', cities.slice(0, 10).map(c => c.name));
} else {
    console.log('Province not found');
}

console.log('--- CABA ---');
if (caba) {
    console.log(`State: ${caba.name} (${caba.isoCode})`);
    const cities = City.getCitiesOfState(countryCode, caba.isoCode);
    console.log(`Cities count: ${cities.length}`);
    console.log('First 10 cities:', cities.slice(0, 10).map(c => c.name));
}
