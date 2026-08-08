/**
 * Address fixtures — countries, regions (state/parish/province) and major
 * cities. Used by the address form's dropdown pickers so users pick from
 * real values instead of free-typing.
 *
 * Data is a pragmatic subset covering NOOD's primary markets. Extend the
 * REGIONS map as needed; CITIES fall back to the region's major cities.
 */

export type RegionFixture = {
  code: string;
  name: string;
  cities: string[];
};

export type CountryFixture = {
  code: string;
  name: string;
  regions: RegionFixture[];
};

// Countries that have full region/city fixtures.
export const ADDRESS_FIXTURES: CountryFixture[] = [
  {
    code: 'TT',
    name: 'Trinidad & Tobago',
    regions: [
      { code: 'POS', name: 'Port of Spain', cities: ['Port of Spain', 'St. James', 'Maraval', 'Cascade', 'Woodbrook', 'Belmont'] },
      { code: 'SGE', name: 'San Juan–Laventille', cities: ['San Juan', 'Laventille', 'Arima', 'Chaguanas', 'Curepe', 'St. Joseph', 'Tunapuna', 'Arouca', 'El Dorado'] },
      { code: 'CHA', name: 'Chaguanas', cities: ['Chaguanas', 'Felicity', 'Enterprise', 'Endeavour', 'Caroni'] },
      { code: 'ARC', name: 'Arima', cities: ['Arima', 'Blanchisseuse', 'La Horquetta'] },
      { code: 'SFO', name: 'San Fernando', cities: ['San Fernando', 'Marabella', 'Vistabella', 'Pleasantville', 'Gulf View', 'Mon Repos'] },
      { code: 'PTF', name: 'Point Fortin', cities: ['Point Fortin', 'Guapo', 'La Brea'] },
      { code: 'COU', name: 'Couva–Tabaquite–Talparo', cities: ['Couva', 'Tabaquite', 'Talparo', 'California', 'Claxton Bay', 'Gasparillo', 'Freeport'] },
      { code: 'PRT', name: 'Princes Town', cities: ['Princes Town', 'Moruga', 'Tableland', 'St. Mary\'s'] },
      { code: 'RCE', name: 'Rio Claro–Mayaro', cities: ['Rio Claro', 'Mayaro', 'Guayaguayare', 'Mafeking'] },
      { code: 'SIP', name: 'Siparia', cities: ['Siparia', 'Fyzabad', 'Cedros', 'Erin', 'Palo Seco'] },
      { code: 'PEN', name: 'Penal–Debe', cities: ['Penal', 'Debe', 'Barrackpore', 'Indian Walk'] },
      { code: 'DIE', name: 'Diego Martin', cities: ['Diego Martin', 'Carenage', 'Petit Valley', 'Westmoorings', 'Goodwood Park'] },
      { code: 'TUN', name: 'Tunapuna–Piarco', cities: ['Tunapuna', 'Piarco', 'Arouca', 'St. Augustine', 'Curepe'] },
      { code: 'MOB', name: 'Mayaro–Rio Claro', cities: ['Mayaro', 'Rio Claro'] },
      { code: 'TOB', name: 'Tobago', cities: ['Scarborough', 'Crown Point', 'Black Rock', 'Charlotteville', 'Roxborough', 'Plymouth', 'Bon Accord'] },
    ],
  },
  {
    code: 'US',
    name: 'United States',
    regions: [
      { code: 'AL', name: 'Alabama', cities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'] },
      { code: 'AK', name: 'Alaska', cities: ['Anchorage', 'Fairbanks', 'Juneau'] },
      { code: 'AZ', name: 'Arizona', cities: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'] },
      { code: 'AR', name: 'Arkansas', cities: ['Little Rock', 'Fayetteville', 'Fort Smith'] },
      { code: 'CA', name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose'] },
      { code: 'CO', name: 'Colorado', cities: ['Denver', 'Colorado Springs', 'Boulder', 'Aurora'] },
      { code: 'CT', name: 'Connecticut', cities: ['Hartford', 'New Haven', 'Stamford', 'Bridgeport'] },
      { code: 'DE', name: 'Delaware', cities: ['Wilmington', 'Dover', 'Newark'] },
      { code: 'FL', name: 'Florida', cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'] },
      { code: 'GA', name: 'Georgia', cities: ['Atlanta', 'Savannah', 'Augusta', 'Macon'] },
      { code: 'HI', name: 'Hawaii', cities: ['Honolulu', 'Hilo', 'Kailua'] },
      { code: 'ID', name: 'Idaho', cities: ['Boise', 'Meridian', 'Nampa'] },
      { code: 'IL', name: 'Illinois', cities: ['Chicago', 'Springfield', 'Naperville', 'Aurora'] },
      { code: 'IN', name: 'Indiana', cities: ['Indianapolis', 'Fort Wayne', 'Evansville'] },
      { code: 'IA', name: 'Iowa', cities: ['Des Moines', 'Cedar Rapids', 'Davenport'] },
      { code: 'KS', name: 'Kansas', cities: ['Wichita', 'Kansas City', 'Topeka'] },
      { code: 'KY', name: 'Kentucky', cities: ['Louisville', 'Lexington', 'Frankfort'] },
      { code: 'LA', name: 'Louisiana', cities: ['New Orleans', 'Baton Rouge', 'Shreveport'] },
      { code: 'ME', name: 'Maine', cities: ['Portland', 'Lewiston', 'Bangor'] },
      { code: 'MD', name: 'Maryland', cities: ['Baltimore', 'Annapolis', 'Rockville'] },
      { code: 'MA', name: 'Massachusetts', cities: ['Boston', 'Cambridge', 'Worcester', 'Springfield'] },
      { code: 'MI', name: 'Michigan', cities: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing'] },
      { code: 'MN', name: 'Minnesota', cities: ['Minneapolis', 'Saint Paul', 'Rochester'] },
      { code: 'MS', name: 'Mississippi', cities: ['Jackson', 'Gulfport', 'Hattiesburg'] },
      { code: 'MO', name: 'Missouri', cities: ['Kansas City', 'St. Louis', 'Springfield'] },
      { code: 'MT', name: 'Montana', cities: ['Billings', 'Missoula', 'Bozeman'] },
      { code: 'NE', name: 'Nebraska', cities: ['Omaha', 'Lincoln', 'Bellevue'] },
      { code: 'NV', name: 'Nevada', cities: ['Las Vegas', 'Reno', 'Henderson'] },
      { code: 'NH', name: 'New Hampshire', cities: ['Manchester', 'Nashua', 'Concord'] },
      { code: 'NJ', name: 'New Jersey', cities: ['Newark', 'Jersey City', 'Trenton', 'Paterson'] },
      { code: 'NM', name: 'New Mexico', cities: ['Albuquerque', 'Santa Fe', 'Las Cruces'] },
      { code: 'NY', name: 'New York', cities: ['New York', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'] },
      { code: 'NC', name: 'North Carolina', cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'] },
      { code: 'ND', name: 'North Dakota', cities: ['Fargo', 'Bismarck', 'Grand Forks'] },
      { code: 'OH', name: 'Ohio', cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'] },
      { code: 'OK', name: 'Oklahoma', cities: ['Oklahoma City', 'Tulsa', 'Norman'] },
      { code: 'OR', name: 'Oregon', cities: ['Portland', 'Salem', 'Eugene'] },
      { code: 'PA', name: 'Pennsylvania', cities: ['Philadelphia', 'Pittsburgh', 'Harrisburg', 'Allentown'] },
      { code: 'RI', name: 'Rhode Island', cities: ['Providence', 'Warwick', 'Cranston'] },
      { code: 'SC', name: 'South Carolina', cities: ['Charleston', 'Columbia', 'Greenville'] },
      { code: 'SD', name: 'South Dakota', cities: ['Sioux Falls', 'Rapid City', 'Aberdeen'] },
      { code: 'TN', name: 'Tennessee', cities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'] },
      { code: 'TX', name: 'Texas', cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'] },
      { code: 'UT', name: 'Utah', cities: ['Salt Lake City', 'Provo', 'West Valley City'] },
      { code: 'VT', name: 'Vermont', cities: ['Burlington', 'Montpelier', 'South Burlington'] },
      { code: 'VA', name: 'Virginia', cities: ['Virginia Beach', 'Richmond', 'Norfolk', 'Alexandria'] },
      { code: 'WA', name: 'Washington', cities: ['Seattle', 'Spokane', 'Tacoma', 'Bellevue'] },
      { code: 'WV', name: 'West Virginia', cities: ['Charleston', 'Huntington', 'Morgantown'] },
      { code: 'WI', name: 'Wisconsin', cities: ['Milwaukee', 'Madison', 'Green Bay'] },
      { code: 'WY', name: 'Wyoming', cities: ['Cheyenne', 'Casper', 'Laramie'] },
      { code: 'DC', name: 'District of Columbia', cities: ['Washington'] },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    regions: [
      { code: 'AB', name: 'Alberta', cities: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge'] },
      { code: 'BC', name: 'British Columbia', cities: ['Vancouver', 'Victoria', 'Kelowna', 'Surrey'] },
      { code: 'MB', name: 'Manitoba', cities: ['Winnipeg', 'Brandon', 'Steinbach'] },
      { code: 'NB', name: 'New Brunswick', cities: ['Moncton', 'Fredericton', 'Saint John'] },
      { code: 'NL', name: 'Newfoundland and Labrador', cities: ['St. John\'s', 'Corner Brook', 'Mount Pearl'] },
      { code: 'NS', name: 'Nova Scotia', cities: ['Halifax', 'Sydney', 'Dartmouth'] },
      { code: 'ON', name: 'Ontario', cities: ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton', 'London', 'Windsor'] },
      { code: 'PE', name: 'Prince Edward Island', cities: ['Charlottetown', 'Summerside'] },
      { code: 'QC', name: 'Quebec', cities: ['Montreal', 'Quebec City', 'Laval', 'Gatineau'] },
      { code: 'SK', name: 'Saskatchewan', cities: ['Saskatoon', 'Regina', 'Prince Albert'] },
      { code: 'YT', name: 'Yukon', cities: ['Whitehorse'] },
      { code: 'NT', name: 'Northwest Territories', cities: ['Yellowknife'] },
      { code: 'NU', name: 'Nunavut', cities: ['Iqaluit'] },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    regions: [
      { code: 'ENG', name: 'England', cities: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Bristol', 'Newcastle'] },
      { code: 'SCT', name: 'Scotland', cities: ['Glasgow', 'Edinburgh', 'Aberdeen', 'Dundee'] },
      { code: 'WLS', name: 'Wales', cities: ['Cardiff', 'Swansea', 'Newport'] },
      { code: 'NIR', name: 'Northern Ireland', cities: ['Belfast', 'Derry', 'Lisburn'] },
    ],
  },
  {
    code: 'JM',
    name: 'Jamaica',
    regions: [
      { code: 'KIN', name: 'Kingston', cities: ['Kingston', 'Portmore', 'Spanish Town'] },
      { code: 'SJM', name: 'St. Andrew', cities: ['Half Way Tree', 'New Kingston', 'Constant Spring'] },
      { code: 'SCA', name: 'St. Catherine', cities: ['Spanish Town', 'Portmore', 'Old Harbour', 'Linstead'] },
      { code: 'SCL', name: 'Clarendon', cities: ['May Pen', 'Chapelton'] },
      { code: 'SMA', name: 'Manchester', cities: ['Mandeville', 'Christiania'] },
      { code: 'SEL', name: 'St. Elizabeth', cities: ['Black River', 'Santa Cruz', 'Junction'] },
      { code: 'SWM', name: 'Westmoreland', cities: ['Savanna-la-Mar', 'Negril', 'Frome'] },
      { code: 'SHA', name: 'Hanover', cities: ['Lucea', 'Hopewell'] },
      { code: 'SJA', name: 'St. James', cities: ['Montego Bay', 'Cambridge', 'Anchovy'] },
      { code: 'TRE', name: 'Trelawny', cities: ['Falmouth', 'Albert Town'] },
      { code: 'SAA', name: 'St. Ann', cities: ['Ocho Rios', 'St. Ann\'s Bay', 'Runaway Bay'] },
      { code: 'SMR', name: 'St. Mary', cities: ['Port Maria', 'Highgate', 'Annotto Bay'] },
      { code: 'SPO', name: 'Portland', cities: ['Port Antonio', 'Buff Bay', 'Hope Bay'] },
      { code: 'STT', name: 'St. Thomas', cities: ['Morant Bay', 'Yallahs'] },
    ],
  },
  {
    code: 'BB',
    name: 'Barbados',
    regions: [
      { code: 'BB', name: 'Christ Church', cities: ['Oistins', 'Worthing', 'Dover'] },
      { code: 'BB', name: 'St. Michael', cities: ['Bridgetown', 'Fontabelle'] },
      { code: 'BB', name: 'St. George', cities: ['Bulkely'] },
      { code: 'BB', name: 'St. James', cities: ['Holetown', 'Westmoreland'] },
      { code: 'BB', name: 'St. Peter', cities: ['Speightstown', 'Mullins'] },
      { code: 'BB', name: 'St. Philip', cities: ['Six Cross Roads'] },
      { code: 'BB', name: 'St. Andrew', cities: ['Belleplaine'] },
      { code: 'BB', name: 'St. John', cities: ['Four Roads'] },
      { code: 'BB', name: 'St. Joseph', cities: ['Bathsheba'] },
      { code: 'BB', name: 'St. Lucy', cities: ['Checkley Hall'] },
      { code: 'BB', name: 'St. Thomas', cities: ['Welchman Hall'] },
    ],
  },
  {
    code: 'GY',
    name: 'Guyana',
    regions: [
      { code: 'GY', name: 'Demerara-Mahaica', cities: ['Georgetown', 'Linden'] },
      { code: 'GY', name: 'Essequibo Islands-West Demerara', cities: ['Vreed-en-Hoop', 'Parika'] },
      { code: 'GY', name: 'Mahaica-Berbice', cities: ['Fort Wellington'] },
      { code: 'GY', name: 'East Berbice-Corentyne', cities: ['New Amsterdam', 'Corriverton'] },
      { code: 'GY', name: 'Cuyuni-Mazaruni', cities: ['Bartica'] },
      { code: 'GY', name: 'Pomeroon-Supenaam', cities: ['Anna Regina'] },
      { code: 'GY', name: 'Potaro-Siparuni', cities: ['Mahdia'] },
      { code: 'GY', name: 'Upper Demerara-Berbice', cities: ['Linden'] },
    ],
  },
  {
    code: 'MX',
    name: 'Mexico',
    regions: [
      { code: 'MX', name: 'Ciudad de México', cities: ['Mexico City'] },
      { code: 'MX', name: 'Jalisco', cities: ['Guadalajara', 'Puerto Vallarta'] },
      { code: 'MX', name: 'Nuevo León', cities: ['Monterrey'] },
      { code: 'MX', name: 'Quintana Roo', cities: ['Cancún', 'Playa del Carmen', 'Tulum'] },
      { code: 'MX', name: 'Yucatán', cities: ['Mérida'] },
      { code: 'MX', name: 'Baja California', cities: ['Tijuana', 'Mexicali'] },
      { code: 'MX', name: 'Puebla', cities: ['Puebla'] },
      { code: 'MX', name: 'Guanajuato', cities: ['León', 'Guanajuato'] },
    ],
  },
  {
    code: 'BR',
    name: 'Brazil',
    regions: [
      { code: 'BR', name: 'São Paulo', cities: ['São Paulo', 'Campinas', 'Santos'] },
      { code: 'BR', name: 'Rio de Janeiro', cities: ['Rio de Janeiro', 'Niterói'] },
      { code: 'BR', name: 'Minas Gerais', cities: ['Belo Horizonte'] },
      { code: 'BR', name: 'Bahia', cities: ['Salvador'] },
      { code: 'BR', name: 'Paraná', cities: ['Curitiba'] },
      { code: 'BR', name: 'Pernambuco', cities: ['Recife'] },
      { code: 'BR', name: 'Distrito Federal', cities: ['Brasília'] },
    ],
  },
  {
    code: 'IN',
    name: 'India',
    regions: [
      { code: 'IN', name: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur'] },
      { code: 'IN', name: 'Delhi', cities: ['New Delhi'] },
      { code: 'IN', name: 'Karnataka', cities: ['Bengaluru', 'Mysuru'] },
      { code: 'IN', name: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore'] },
      { code: 'IN', name: 'West Bengal', cities: ['Kolkata'] },
      { code: 'IN', name: 'Gujarat', cities: ['Ahmedabad', 'Surat'] },
      { code: 'IN', name: 'Telangana', cities: ['Hyderabad'] },
      { code: 'IN', name: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur'] },
      { code: 'IN', name: 'Rajasthan', cities: ['Jaipur'] },
      { code: 'IN', name: 'Kerala', cities: ['Kochi', 'Thiruvananthapuram'] },
    ],
  },
];

export function getCountryFixtures(): { code: string; name: string }[] {
  return ADDRESS_FIXTURES.map((c) => ({ code: c.code, name: c.name }));
}

export function getCountryByCode(code: string): CountryFixture | undefined {
  return ADDRESS_FIXTURES.find((c) => c.code.toUpperCase() === String(code || '').trim().toUpperCase());
}

export function getRegionsForCountry(countryCode: string): RegionFixture[] {
  return getCountryByCode(countryCode)?.regions || [];
}

export function getCitiesForRegion(countryCode: string, regionName: string): string[] {
  const country = getCountryByCode(countryCode);
  const region = country?.regions.find(
    (r) => r.name.toLowerCase() === String(regionName || '').trim().toLowerCase()
  );
  return region?.cities || [];
}

/** Whether a country has structured region/city fixtures. */
export function hasFixturesForCountry(countryCode: string): boolean {
  return Boolean(getCountryByCode(countryCode));
}
