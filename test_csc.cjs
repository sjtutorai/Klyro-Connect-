const { Country, State, City } = require('country-state-city');
console.log(Country.getAllCountries().slice(0,2).map(c => c.name));
console.log(State.getStatesOfCountry('US').slice(0,2).map(s => s.name));
