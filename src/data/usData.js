// States & Counties Dataset strictly matching synthetic_county_context_50_FINAL.csv

export const US_STATES = [
  "Alabama", "Georgia", "Indiana", "Michigan", "Mississippi", "North Carolina", "Ohio", "Tennessee"
]

export const US_COUNTIES_BY_STATE = {
  "Alabama": [
    "Limestone County", "Colbert County", "Jefferson County", "Washington County", 
    "Marion County", "Clay County", "Pike County", "Butler County", 
    "Monroe County", "Wilcox County"
  ],
  "Georgia": [
    "Columbia County", "Greene County", "Fannin County", "Heard County", 
    "Chattahoochee County", "Upson County", "Pulaski County", "Colquitt County", 
    "Jefferson County", "Calhoun County"
  ],
  "Indiana": [
    "Marion County", "Lake County", "Allen County", "Hamilton County", 
    "St. Joseph County", "Elkhart County", "Tippecanoe County"
  ],
  "Michigan": [
    "Wayne County", "Oakland County", "Macomb County", "Kent County", 
    "Genesee County", "Washtenaw County", "Ingham County"
  ],
  "Mississippi": [
    "Hancock County", "Tate County", "Stone County", "Tippah County", 
    "Franklin County", "Attala County", "Wayne County", "Clay County", 
    "Washington County", "Tunica County"
  ],
  "North Carolina": [
    "Camden County", "Mecklenburg County", "Clay County", "Davidson County", 
    "Caldwell County", "Jackson County", "Montgomery County", "Wayne County", 
    "Hyde County", "Bertie County"
  ],
  "Ohio": [
    "Cuyahoga County", "Franklin County", "Hamilton County", "Summit County", 
    "Montgomery County", "Lucas County", "Butler County", "Adams County"
  ],
  "Tennessee": [
    "Rutherford County", "Moore County", "Sevier County", "Cannon County", 
    "Bedford County", "Henry County", "Hawkins County", "Lawrence County", 
    "Johnson County", "Lauderdale County"
  ]
}

export const US_COUNTY_COORDINATES = {
  // Alabama
  "Limestone County, Alabama": { lat: 34.8114, lon: -86.9839, city: "Athens", stateAbbr: "AL" },
  "Colbert County, Alabama": { lat: 34.7001, lon: -87.6253, city: "Tuscumbia", stateAbbr: "AL" },
  "Jefferson County, Alabama": { lat: 33.5539, lon: -86.8985, city: "Birmingham", stateAbbr: "AL" },
  "Washington County, Alabama": { lat: 31.4087, lon: -88.2078, city: "Chatom", stateAbbr: "AL" },
  "Marion County, Alabama": { lat: 34.1378, lon: -87.8878, city: "Hamilton", stateAbbr: "AL" },
  "Clay County, Alabama": { lat: 33.2709, lon: -85.8617, city: "Ashland", stateAbbr: "AL" },
  "Pike County, Alabama": { lat: 31.8021, lon: -85.9408, city: "Troy", stateAbbr: "AL" },
  "Butler County, Alabama": { lat: 31.7523, lon: -86.6803, city: "Greenville", stateAbbr: "AL" },
  "Monroe County, Alabama": { lat: 31.5728, lon: -87.3697, city: "Monroeville", stateAbbr: "AL" },
  "Wilcox County, Alabama": { lat: 31.9888, lon: -87.3045, city: "Camden", stateAbbr: "AL" },

  // Georgia
  "Columbia County, Georgia": { lat: 33.5434, lon: -82.2612, city: "Appling", stateAbbr: "GA" },
  "Greene County, Georgia": { lat: 33.5788, lon: -83.1651, city: "Greensboro", stateAbbr: "GA" },
  "Fannin County, Georgia": { lat: 34.8643, lon: -84.3199, city: "Blue Ridge", stateAbbr: "GA" },
  "Heard County, Georgia": { lat: 33.3039, lon: -85.1278, city: "Franklin", stateAbbr: "GA" },
  "Chattahoochee County, Georgia": { lat: 32.3467, lon: -84.7876, city: "Cusseta", stateAbbr: "GA" },
  "Upson County, Georgia": { lat: 32.8752, lon: -84.2981, city: "Thomaston", stateAbbr: "GA" },
  "Pulaski County, Georgia": { lat: 32.2343, lon: -83.4754, city: "Hawkinsville", stateAbbr: "GA" },
  "Colquitt County, Georgia": { lat: 31.1834, lon: -83.7689, city: "Moultrie", stateAbbr: "GA" },
  "Jefferson County, Georgia": { lat: 33.0543, lon: -82.4187, city: "Louisville", stateAbbr: "GA" },
  "Calhoun County, Georgia": { lat: 31.5284, lon: -84.6243, city: "Morgan", stateAbbr: "GA" },

  // Indiana
  "Marion County, Indiana": { lat: 39.7684, lon: -86.1581, city: "Indianapolis", stateAbbr: "IN" },
  "Lake County, Indiana": { lat: 41.4872, lon: -87.3784, city: "Crown Point", stateAbbr: "IN" },
  "Allen County, Indiana": { lat: 41.0938, lon: -85.0689, city: "Fort Wayne", stateAbbr: "IN" },
  "Hamilton County, Indiana": { lat: 40.0612, lon: -86.0521, city: "Noblesville", stateAbbr: "IN" },
  "St. Joseph County, Indiana": { lat: 41.6192, lon: -86.2917, city: "South Bend", stateAbbr: "IN" },
  "Elkhart County, Indiana": { lat: 41.6031, lon: -85.8642, city: "Elkhart", stateAbbr: "IN" },
  "Tippecanoe County, Indiana": { lat: 40.4079, lon: -86.8924, city: "Lafayette", stateAbbr: "IN" },

  // Michigan
  "Wayne County, Michigan": { lat: 42.3314, lon: -83.0458, city: "Detroit", stateAbbr: "MI" },
  "Oakland County, Michigan": { lat: 42.6389, lon: -83.2911, city: "Pontiac", stateAbbr: "MI" },
  "Macomb County, Michigan": { lat: 42.5028, lon: -83.0288, city: "Warren", stateAbbr: "MI" },
  "Kent County, Michigan": { lat: 42.9634, lon: -85.6681, city: "Grand Rapids", stateAbbr: "MI" },
  "Genesee County, Michigan": { lat: 43.0125, lon: -83.6875, city: "Flint", stateAbbr: "MI" },
  "Washtenaw County, Michigan": { lat: 42.2708, lon: -83.7263, city: "Ann Arbor", stateAbbr: "MI" },
  "Ingham County, Michigan": { lat: 42.6014, lon: -84.4367, city: "Lansing", stateAbbr: "MI" },

  // Mississippi
  "Hancock County, Mississippi": { lat: 30.3887, lon: -89.4791, city: "Bay St. Louis", stateAbbr: "MS" },
  "Tate County, Mississippi": { lat: 34.6543, lon: -89.9412, city: "Senatobia", stateAbbr: "MS" },
  "Stone County, Mississippi": { lat: 30.7932, lon: -89.1248, city: "Wiggins", stateAbbr: "MS" },
  "Tippah County, Mississippi": { lat: 34.7712, lon: -88.9082, city: "Ripley", stateAbbr: "MS" },
  "Franklin County, Mississippi": { lat: 31.4742, lon: -90.9012, city: "Meadville", stateAbbr: "MS" },
  "Attala County, Mississippi": { lat: 33.0894, lon: -89.5873, city: "Kosciusko", stateAbbr: "MS" },
  "Wayne County, Mississippi": { lat: 31.6423, lon: -88.6432, city: "Waynesboro", stateAbbr: "MS" },
  "Clay County, Mississippi": { lat: 33.6542, lon: -88.7512, city: "West Point", stateAbbr: "MS" },
  "Washington County, Mississippi": { lat: 33.2842, lon: -90.9512, city: "Greenville", stateAbbr: "MS" },
  "Tunica County, Mississippi": { lat: 34.6843, lon: -90.3842, city: "Tunica", stateAbbr: "MS" },

  // North Carolina
  "Camden County, North Carolina": { lat: 36.3275, lon: -76.1720, city: "Camden", stateAbbr: "NC" },
  "Mecklenburg County, North Carolina": { lat: 35.2271, lon: -80.8431, city: "Charlotte", stateAbbr: "NC" },
  "Clay County, North Carolina": { lat: 35.0567, lon: -83.7543, city: "Hayesville", stateAbbr: "NC" },
  "Davidson County, North Carolina": { lat: 35.7942, lon: -80.2112, city: "Lexington", stateAbbr: "NC" },
  "Caldwell County, North Carolina": { lat: 35.9184, lon: -81.5473, city: "Lenoir", stateAbbr: "NC" },
  "Jackson County, North Carolina": { lat: 35.2914, lon: -83.1412, city: "Sylva", stateAbbr: "NC" },
  "Montgomery County, North Carolina": { lat: 35.3421, lon: -79.8842, city: "Troy", stateAbbr: "NC" },
  "Wayne County, North Carolina": { lat: 35.3643, lon: -77.9712, city: "Goldsboro", stateAbbr: "NC" },
  "Hyde County, North Carolina": { lat: 35.4123, lon: -76.1542, city: "Swan Quarter", stateAbbr: "NC" },
  "Bertie County, North Carolina": { lat: 36.0712, lon: -77.0123, city: "Windsor", stateAbbr: "NC" },

  // Ohio
  "Cuyahoga County, Ohio": { lat: 41.4993, lon: -81.6944, city: "Cleveland", stateAbbr: "OH" },
  "Franklin County, Ohio": { lat: 39.9612, lon: -82.9988, city: "Columbus", stateAbbr: "OH" },
  "Hamilton County, Ohio": { lat: 39.1031, lon: -84.5120, city: "Cincinnati", stateAbbr: "OH" },
  "Summit County, Ohio": { lat: 41.0814, lon: -81.5190, city: "Akron", stateAbbr: "OH" },
  "Montgomery County, Ohio": { lat: 39.7589, lon: -84.1916, city: "Dayton", stateAbbr: "OH" },
  "Lucas County, Ohio": { lat: 41.6528, lon: -83.5379, city: "Toledo", stateAbbr: "OH" },
  "Butler County, Ohio": { lat: 39.4431, lon: -84.5789, city: "Hamilton", stateAbbr: "OH" },
  "Adams County, Ohio": { lat: 38.8451, lon: -83.4754, city: "West Union", stateAbbr: "OH" },

  // Tennessee
  "Rutherford County, Tennessee": { lat: 35.8456, lon: -86.3903, city: "Murfreesboro", stateAbbr: "TN" },
  "Moore County, Tennessee": { lat: 35.2842, lon: -86.3642, city: "Lynchburg", stateAbbr: "TN" },
  "Sevier County, Tennessee": { lat: 35.8770, lon: -83.5788, city: "Sevierville", stateAbbr: "TN" },
  "Cannon County, Tennessee": { lat: 35.8142, lon: -86.0642, city: "Woodbury", stateAbbr: "TN" },
  "Bedford County, Tennessee": { lat: 35.5142, lon: -86.4612, city: "Shelbyville", stateAbbr: "TN" },
  "Henry County, Tennessee": { lat: 36.3012, lon: -88.3242, city: "Paris", stateAbbr: "TN" },
  "Hawkins County, Tennessee": { lat: 36.4342, lon: -82.9412, city: "Rogersville", stateAbbr: "TN" },
  "Lawrence County, Tennessee": { lat: 35.2142, lon: -87.3342, city: "Lawrenceburg", stateAbbr: "TN" },
  "Johnson County, Tennessee": { lat: 36.4542, lon: -81.8012, city: "Mountain City", stateAbbr: "TN" },
  "Lauderdale County, Tennessee": { lat: 35.7612, lon: -89.6342, city: "Ripley", stateAbbr: "TN" }
}

export function getCountyCoords(county, state) {
  if (!county) return null
  const cleanCounty = county.includes('County') ? county : `${county} County`
  const key = `${cleanCounty}, ${state}`
  if (US_COUNTY_COORDINATES[key]) return US_COUNTY_COORDINATES[key]

  // Search case-insensitively
  for (const [k, v] of Object.entries(US_COUNTY_COORDINATES)) {
    if (k.toLowerCase().includes(cleanCounty.toLowerCase())) {
      if (!state || k.toLowerCase().includes(state.toLowerCase())) {
        return v
      }
    }
  }
  return null
}
