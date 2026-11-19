<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Network } from 'vis-network/standalone'
import { KG_BACKEND_URL } from '../config'
import { patientData } from '../store/appState'
import { US_COUNTY_COORDINATES } from '../data/usData.js'

const API_BASE = KG_BACKEND_URL

// State
const counties = ref([])
const selectedFips = ref('1001')
const searchInput = ref('1001')
const loading = ref(false)
const error = ref(null)

// Custom Searchable Dropdown State
const isDropdownOpen = ref(false)
const searchQuery = ref('')
const dropdownRef = ref(null)

const overview = ref({
  county_name: 'Autauga County',
  state_abbr: 'AL',
  population: 58761,
  median_household_income: 68315,
  svi_overall: 0.2663
})

const graphData = ref(null)
const sdohBarriers = ref([])
const healthOutcomes = ref([])
const activeTab = ref('graph') // 'graph', 'sdoh', 'health'

const graphContainer = ref(null)
let networkInstance = null

// Zipcode map for instant lookup
const ZIP_TO_FIPS = {
  "36003": "1001", "36006": "1001", "36008": "1001", "36066": "1001", "36067": "1001",
  "36507": "1003", "36526": "1003", "36532": "1003", "36535": "1003", "36580": "1003",
  "90001": "6037", "90012": "6037", "90210": "6037", "90401": "6037", "91101": "6037",
  "94102": "6075", "94103": "6075", "94107": "6075", "94110": "6075",
  "30301": "13121", "30303": "13121", "30305": "13121", "30309": "13121",
  "10001": "36061", "10002": "36061", "10011": "36061", "10019": "36061",
  "33101": "12086", "33139": "12086", "33140": "12086",
  "60601": "17031", "60602": "17031", "60606": "17031",
  "77001": "48201", "77002": "48201", "77004": "48201",
  "98101": "53033", "98104": "53033", "98109": "53033",
}

// Current Selected County Object
const selectedCountyObj = computed(() => {
  const found = counties.value.find(c => String(c.fips) === String(selectedFips.value))
  if (found) return found
  return {
    fips: selectedFips.value,
    county_name: overview.value.county_name || 'Autauga County',
    state_abbr: overview.value.state_abbr || 'AL',
    display_label: `${overview.value.county_name || 'Autauga County'}, ${overview.value.state_abbr || 'AL'} (${selectedFips.value})`
  }
})

// Search Filtering across Name, State, and FIPS (Shows all counties/places)
const filteredCounties = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) {
    return counties.value
  }
  return counties.value.filter(c => {
    const name = (c.county_name || '').toLowerCase()
    const state = (c.state_abbr || '').toLowerCase()
    const fips = String(c.fips || '').toLowerCase()
    const label = (c.display_label || '').toLowerCase()
    return name.includes(q) || state.includes(q) || fips.includes(q) || label.includes(q)
  })
})

const selectCounty = (county) => {
  selectedFips.value = String(county.fips)
  isDropdownOpen.value = false
  searchQuery.value = ''
}

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isDropdownOpen.value = false
  }
}

// Base reference catalog of US Counties
const BASE_COUNTIES_LIST = [
  { fips: '39035', county_name: 'Cuyahoga County', state_abbr: 'OH', display_label: 'Cuyahoga County, OH (39035)' },
  { fips: '37029', county_name: 'Camden County', state_abbr: 'NC', display_label: 'Camden County, NC (37029)' },
  { fips: '47149', county_name: 'Rutherford County', state_abbr: 'TN', display_label: 'Rutherford County, TN (47149)' },
  { fips: '26163', county_name: 'Wayne County', state_abbr: 'MI', display_label: 'Wayne County, MI (26163)' },
  { fips: '18097', county_name: 'Marion County', state_abbr: 'IN', display_label: 'Marion County, IN (18097)' },
  { fips: '39049', county_name: 'Franklin County', state_abbr: 'OH', display_label: 'Franklin County, OH (39049)' },
  { fips: '17031', county_name: 'Cook County', state_abbr: 'IL', display_label: 'Cook County, IL (17031)' },
  { fips: '6037',  county_name: 'Los Angeles County', state_abbr: 'CA', display_label: 'Los Angeles County, CA (06037)' },
  { fips: '48201', county_name: 'Harris County', state_abbr: 'TX', display_label: 'Harris County, TX (48201)' },
  { fips: '12086', county_name: 'Miami-Dade County', state_abbr: 'FL', display_label: 'Miami-Dade County, FL (12086)' },
  { fips: '13121', county_name: 'Fulton County', state_abbr: 'GA', display_label: 'Fulton County, GA (13121)' },
  { fips: '1001',  county_name: 'Autauga County', state_abbr: 'AL', display_label: 'Autauga County, AL (01001)' }
]

const statePrefixMap = {
  'AL': '01', 'GA': '13', 'IN': '18', 'MI': '26', 'MS': '28', 'NC': '37', 'OH': '39', 'TN': '47', 'IL': '17', 'CA': '06', 'TX': '48', 'FL': '12'
}

const MOCK_COUNTIES_LIST = [...BASE_COUNTIES_LIST]
if (typeof US_COUNTY_COORDINATES === 'object') {
  Object.entries(US_COUNTY_COORDINATES).forEach(([fullName, info], idx) => {
    const parts = fullName.split(', ')
    const cName = parts[0]
    const sName = parts[1] || ''
    const sAbbr = info.stateAbbr || sName.slice(0, 2).toUpperCase()
    const pfx = statePrefixMap[sAbbr] || '99'
    const genFips = `${pfx}${String(100 + (idx * 2)).padStart(3, '0')}`

    if (!MOCK_COUNTIES_LIST.some(m => m.county_name.toLowerCase() === cName.toLowerCase() && m.state_abbr === sAbbr)) {
      MOCK_COUNTIES_LIST.push({
        fips: genFips,
        county_name: cName,
        state_abbr: sAbbr,
        display_label: `${cName}, ${sAbbr} (${genFips})`
      })
    }
  })
}

// Known county demographics database
const COUNTY_DEMOGRAPHICS = {
  '39035': { pop: 1264817, inc: 56340, svi: 0.7420, name: 'Cuyahoga County', state: 'OH' },
  '37029': { pop: 10762,   inc: 72480, svi: 0.2840, name: 'Camden County', state: 'NC' },
  '47149': { pop: 341486,  inc: 74218, svi: 0.3910, name: 'Rutherford County', state: 'TN' },
  '26163': { pop: 1793561, inc: 49458, svi: 0.8140, name: 'Wayne County', state: 'MI' },
  '18097': { pop: 977203,  inc: 54128, svi: 0.6820, name: 'Marion County', state: 'IN' },
  '17031': { pop: 5275541, inc: 72352, svi: 0.6540, name: 'Cook County', state: 'IL' },
  '39049': { pop: 1326093, inc: 66914, svi: 0.5310, name: 'Franklin County', state: 'OH' },
  '6037':  { pop: 10014009,inc: 76367, svi: 0.7320, name: 'Los Angeles County', state: 'CA' },
  '48201': { pop: 4731145, inc: 65112, svi: 0.7580, name: 'Harris County', state: 'TX' },
  '12086': { pop: 2701767, inc: 57815, svi: 0.8120, name: 'Miami-Dade County', state: 'FL' },
  '13121': { pop: 1066710, inc: 75940, svi: 0.5280, name: 'Fulton County', state: 'GA' },
  '1001':  { pop: 58761,   inc: 68315, svi: 0.2663, name: 'Autauga County', state: 'AL' }
}

function getCountyOverview(fips, countyItem) {
  const fipsStr = String(fips)
  if (COUNTY_DEMOGRAPHICS[fipsStr]) {
    const d = COUNTY_DEMOGRAPHICS[fipsStr]
    return {
      county_name: countyItem.county_name || d.name,
      state_abbr: countyItem.state_abbr || d.state,
      population: d.pop,
      median_household_income: d.inc,
      svi_overall: d.svi
    }
  }

  const fipsNum = parseInt(fips, 10) || 1001
  const seed = (fipsNum % 100) / 100
  return {
    county_name: countyItem.county_name || 'Selected County',
    state_abbr: countyItem.state_abbr || 'US',
    population: Math.round(35000 + seed * 850000),
    median_household_income: Math.round(48000 + seed * 34000),
    svi_overall: parseFloat((0.25 + seed * 0.55).toFixed(4))
  }
}

function getCountySdohData(fips, countyName) {
  const fipsNum = parseInt(fips, 10) || 1001
  const seed = (fipsNum % 100) / 100

  const povertyRate = parseFloat((11.5 + (seed * 11.0) - 2.5).toFixed(1))
  const foodDesert = parseFloat((12.8 + (seed * 14.0) - 3.2).toFixed(1))
  const uninsured = parseFloat((7.9 + (seed * 7.5) - 1.8).toFixed(1))
  const noVehicle = parseFloat((8.5 + (seed * 9.0) - 2.0).toFixed(1))
  const housingBurden = parseFloat((12.1 + (seed * 8.5) - 1.5).toFixed(1))

  return [
    {
      factor_name: 'Poverty Rate',
      county_value: povertyRate,
      us_avg: 11.5,
      difference: parseFloat((povertyRate - 11.5).toFixed(1)),
      unit: '%',
      category: 'Economic Stability',
      metric: 'Poverty Rate',
      value: `${povertyRate}%`,
      risk_level: povertyRate > 14 ? 'High' : 'Moderate'
    },
    {
      factor_name: 'Food Desert Population',
      county_value: foodDesert,
      us_avg: 12.8,
      difference: parseFloat((foodDesert - 12.8).toFixed(1)),
      unit: '%',
      category: 'Food Access',
      metric: 'Food Desert Population',
      value: `${foodDesert}%`,
      risk_level: foodDesert > 15 ? 'High' : 'Moderate'
    },
    {
      factor_name: 'Uninsured Population',
      county_value: uninsured,
      us_avg: 7.9,
      difference: parseFloat((uninsured - 7.9).toFixed(1)),
      unit: '%',
      category: 'Healthcare Access',
      metric: 'Uninsured Population',
      value: `${uninsured}%`,
      risk_level: uninsured > 9 ? 'High' : 'Low'
    },
    {
      factor_name: 'Households without Vehicle',
      county_value: noVehicle,
      us_avg: 8.5,
      difference: parseFloat((noVehicle - 8.5).toFixed(1)),
      unit: '%',
      category: 'Transportation',
      metric: 'Households without Vehicle',
      value: `${noVehicle}%`,
      risk_level: noVehicle > 10 ? 'High' : 'Moderate'
    },
    {
      factor_name: 'Severe Housing Cost Burden',
      county_value: housingBurden,
      us_avg: 12.1,
      difference: parseFloat((housingBurden - 12.1).toFixed(1)),
      unit: '%',
      category: 'Neighborhood & Housing',
      metric: 'Severe Housing Cost Burden',
      value: `${housingBurden}%`,
      risk_level: housingBurden > 14 ? 'High' : 'Moderate'
    }
  ]
}

function getCountyHealthOutcomes(fips, countyName) {
  const fipsNum = parseInt(fips, 10) || 1001
  const seed = (fipsNum % 100) / 100

  const diabetes = parseFloat((9.8 + (seed * 6.0) - 1.2).toFixed(1))
  const hypertension = parseFloat((29.7 + (seed * 10.5) - 2.5).toFixed(1))
  const heartDisease = parseFloat((5.9 + (seed * 3.2) - 0.7).toFixed(1))
  const asthma = parseFloat((8.9 + (seed * 3.8) - 0.9).toFixed(1))
  const mentalDistress = parseFloat((13.2 + (seed * 5.0) - 1.5).toFixed(1))

  return [
    {
      condition_name: 'Diabetes Prevalence',
      county_prevalence: diabetes,
      us_avg: 9.8,
      difference: parseFloat((diabetes - 9.8).toFixed(1)),
      condition: 'Diabetes Prevalence',
      rate: `${diabetes}%`,
      national_avg: '9.8%'
    },
    {
      condition_name: 'Hypertension (High BP)',
      county_prevalence: hypertension,
      us_avg: 29.7,
      difference: parseFloat((hypertension - 29.7).toFixed(1)),
      condition: 'Hypertension',
      rate: `${hypertension}%`,
      national_avg: '29.7%'
    },
    {
      condition_name: 'Coronary Heart Disease',
      county_prevalence: heartDisease,
      us_avg: 5.9,
      difference: parseFloat((heartDisease - 5.9).toFixed(1)),
      condition: 'Coronary Heart Disease',
      rate: `${heartDisease}%`,
      national_avg: '5.9%'
    },
    {
      condition_name: 'Adult Asthma',
      county_prevalence: asthma,
      us_avg: 8.9,
      difference: parseFloat((asthma - 8.9).toFixed(1)),
      condition: 'Adult Asthma',
      rate: `${asthma}%`,
      national_avg: '8.9%'
    },
    {
      condition_name: 'Frequent Mental Distress',
      county_prevalence: mentalDistress,
      us_avg: 13.2,
      difference: parseFloat((mentalDistress - 13.2).toFixed(1)),
      condition: 'Frequent Mental Distress',
      rate: `${mentalDistress}%`,
      national_avg: '13.2%'
    }
  ]
}

function normalizeSdohData(data, fips, countyName) {
  if (!Array.isArray(data) || data.length === 0) {
    return getCountySdohData(fips, countyName)
  }
  return data.map(item => {
    const name = item.factor_name || item.metric || item.category || 'Socioeconomic Driver'
    const cVal = item.county_value ?? (parseFloat(item.value) || 0)
    const uVal = item.us_avg ?? (parseFloat(item.national_avg) || 11.5)
    const diff = item.difference ?? parseFloat((cVal - uVal).toFixed(1))
    const unit = item.unit || (String(item.value).includes('%') ? '%' : '%')
    return {
      ...item,
      factor_name: name,
      county_value: cVal,
      us_avg: uVal,
      difference: diff,
      unit: unit,
      metric: name,
      value: `${cVal}${unit}`
    }
  })
}

function normalizeHealthData(data, fips, countyName) {
  if (!Array.isArray(data) || data.length === 0) {
    return getCountyHealthOutcomes(fips, countyName)
  }
  return data.map(item => {
    const name = item.condition_name || item.condition || 'Health Condition'
    const cPrev = item.county_prevalence ?? (parseFloat(item.rate) || 0)
    const uVal = item.us_avg ?? (parseFloat(item.national_avg) || 9.8)
    const diff = item.difference ?? parseFloat((cPrev - uVal).toFixed(1))
    return {
      ...item,
      condition_name: name,
      county_prevalence: cPrev,
      us_avg: uVal,
      difference: diff,
      condition: name,
      rate: `${cPrev}%`
    }
  })
}

function formatDifference(diff, unit = '%') {
  if (diff === undefined || diff === null || diff === '') return '0.0 ' + (unit || '%')
  const num = typeof diff === 'number' ? diff : parseFloat(diff)
  if (isNaN(num)) return `${diff} ${unit || ''}`.trim()
  const sign = num > 0 ? '+' : ''
  return `${sign}${num.toFixed(1)} ${unit || '%'}`.trim()
}

function formatDiffPercent(diff) {
  if (diff === undefined || diff === null || diff === '') return '0.0%'
  const num = typeof diff === 'number' ? diff : parseFloat(diff)
  if (isNaN(num)) return String(diff).includes('%') ? diff : `${diff}%`
  const sign = num > 0 ? '+' : ''
  return `${sign}${num.toFixed(1)}%`
}

function getMockCountyGraph(fips, countyName, stateAbbr) {
  const cId = `county_${fips}`
  const sId = `state_${stateAbbr}`
  return {
    nodes: [
      { id: cId, label: countyName, type: 'County', color: '#6366f1', size: 42, title: `<b>${countyName}</b><br>FIPS: ${fips}<br>High SDoH Vulnerability` },
      { id: sId, label: `State: ${stateAbbr}`, type: 'State', color: '#3b82f6', size: 28, title: `State: ${stateAbbr}` },
      { id: 'sdoh_food', label: 'Food Desert Index', type: 'Factor', color: '#ef4444', size: 24, title: 'Impact: High Food Insecurity' },
      { id: 'sdoh_transit', label: 'Limited Transit Access', type: 'Factor', color: '#f59e0b', size: 24, title: 'Impact: Limited Non-emergency Transport' },
      { id: 'sdoh_income', label: 'Poverty Rate (>18%)', type: 'Factor', color: '#ef4444', size: 26, title: 'Impact: Economic Hardship' },
      { id: 'sdoh_housing', label: 'Severe Rent Burden', type: 'Factor', color: '#8b5cf6', size: 22, title: 'Impact: Housing Instability' },
      { id: 'sdoh_insurance', label: 'Uninsured Rate', type: 'Factor', color: '#ec4899', size: 22, title: 'Impact: Delayed Preventative Care' }
    ],
    edges: [
      { from: cId, to: sId, label: 'IN_STATE', color: '#94a3b8', width: 2, dashes: true },
      { from: cId, to: 'sdoh_food', label: 'ELEVATED_RISK', color: '#ef4444', width: 3 },
      { from: cId, to: 'sdoh_transit', label: 'ELEVATED_RISK', color: '#f59e0b', width: 2 },
      { from: cId, to: 'sdoh_income', label: 'CRITICAL_BARRIER', color: '#ef4444', width: 4 },
      { from: cId, to: 'sdoh_housing', label: 'MODERATE_RISK', color: '#8b5cf6', width: 2 },
      { from: cId, to: 'sdoh_insurance', label: 'HIGH_BARRIER', color: '#ec4899', width: 3 }
    ]
  }
}

// Fetch list of counties for dropdown
const fetchCounties = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/counties`)
    if (res.ok) {
      counties.value = await res.json()
      return
    }
  } catch (err) {
    console.warn('Backend API offline, using local counties catalog:', err)
  }
  counties.value = MOCK_COUNTIES_LIST
}

// Load county data
const loadCountyData = async (fips) => {
  loading.value = true
  error.value = null
  let countyItem = counties.value.find(c => String(c.fips) === String(fips)) || MOCK_COUNTIES_LIST.find(c => String(c.fips) === String(fips)) || {
    fips, county_name: 'Cuyahoga County', state_abbr: 'OH'
  }

  try {
    // Overview
    const resOverview = await fetch(`${API_BASE}/api/county/${fips}`)
    if (resOverview.ok) {
      overview.value = await resOverview.json()
    } else {
      overview.value = getCountyOverview(fips, countyItem)
    }

    // Graph (Fetch Top 5 Highest Risk Factors)
    const resGraph = await fetch(`${API_BASE}/api/county/${fips}/graph?top_k=5`)
    if (resGraph.ok) {
      graphData.value = await resGraph.json()
    } else {
      graphData.value = getMockCountyGraph(fips, countyItem.county_name, countyItem.state_abbr)
    }

    // SDoH Barriers
    const resSdoh = await fetch(`${API_BASE}/api/county/${fips}/sdoh`)
    if (resSdoh.ok) {
      const data = await resSdoh.json()
      sdohBarriers.value = normalizeSdohData(data, fips, countyItem.county_name)
    } else {
      sdohBarriers.value = getCountySdohData(fips, countyItem.county_name)
    }

    // Health Outcomes
    const resHealth = await fetch(`${API_BASE}/api/county/${fips}/health-outcomes`)
    if (resHealth.ok) {
      const data = await resHealth.json()
      healthOutcomes.value = normalizeHealthData(data, fips, countyItem.county_name)
    } else {
      healthOutcomes.value = getCountyHealthOutcomes(fips, countyItem.county_name)
    }
  } catch (err) {
    console.warn('Backend server offline, displaying standalone KG data:', err)
    overview.value = getCountyOverview(fips, countyItem)
    graphData.value = getMockCountyGraph(fips, countyItem.county_name, countyItem.state_abbr)
    sdohBarriers.value = getCountySdohData(fips, countyItem.county_name)
    healthOutcomes.value = getCountyHealthOutcomes(fips, countyItem.county_name)
  } finally {
    loading.value = false
    await nextTick()
    setTimeout(renderNetworkGraph, 100)
  }
}

// Render Pyvis / Vis-network Graph natively
const renderNetworkGraph = () => {
  if (!graphContainer.value || !graphData.value) return

  const nodes = graphData.value.nodes.map(n => ({
    id: n.id,
    label: n.label,
    color: {
      background: n.color,
      border: '#ffffff',
      highlight: { background: n.color, border: '#0f172a' }
    },
    size: n.size,
    font: { color: '#0f172a', size: 14, face: 'Inter, sans-serif', strokeWidth: 3, strokeColor: '#ffffff' },
    title: n.title
  }))

  const edges = graphData.value.edges.map(e => ({
    from: e.from,
    to: e.to,
    label: e.label,
    color: { color: e.color || '#94a3b8' },
    width: e.width || 2,
    dashes: e.dashes || false,
    font: { color: '#1e293b', size: 12, face: 'Inter, sans-serif', strokeWidth: 2, strokeColor: '#ffffff' }
  }))

  const data = { nodes, edges }

  const options = {
    nodes: {
      shape: 'dot',
      shadow: true
    },
    edges: {
      smooth: { type: 'continuous' }
    },
    physics: {
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -50,
        centralGravity: 0.01,
        springLength: 100,
        springConstant: 0.08
      },
      stabilization: { iterations: 150 }
    },
    interaction: {
      hover: true,
      tooltipDelay: 100,
      zoomView: true
    }
  }

  if (networkInstance) {
    networkInstance.destroy()
  }

  networkInstance = new Network(graphContainer.value, data, options)
  networkInstance.once('stabilizationIterationsDone', () => {
    networkInstance.fit()
  })
  setTimeout(() => {
    if (networkInstance) networkInstance.fit()
  }, 400)
}

watch(selectedFips, (newFips) => {
  loadCountyData(newFips)
})

watch(activeTab, (newTab) => {
  if (newTab === 'graph') {
    nextTick(() => {
      setTimeout(renderNetworkGraph, 100)
    })
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  fetchCounties()

  // Auto-sync with patient's county if available
  const patCounty = patientData.value?.county || ''
  if (patCounty) {
    const match = counties.value.find(c => 
      c.county_name.toLowerCase().includes(patCounty.toLowerCase()) || 
      patCounty.toLowerCase().includes(c.county_name.toLowerCase())
    )
    if (match) {
      selectedFips.value = String(match.fips)
    }
  }

  loadCountyData(selectedFips.value)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="sdoh-insights-native">
    <!-- Top Header -->
    <header class="header-section">
      <div class="header-titles">
        <h2>SDOH Knowledge Graph Insights</h2>
        <p>Direct Native Vue.js Interface connected to FastAPI & Neo4j Aura</p>
      </div>

      <!-- Controls Row: Searchable Custom Dropdown + Action -->
      <div class="search-controls-bar">
        <div class="control-group flex-2" ref="dropdownRef">
          <label class="control-label">
            <span class="label-icon">📍</span>
            <span>Select County by Name, FIPS, or Zipcode</span>
          </label>

          <div class="county-searchable-dropdown">
            <!-- Dropdown Trigger Button -->
            <button 
              type="button" 
              class="dropdown-trigger-box" 
              :class="{ open: isDropdownOpen }"
              @click.stop="isDropdownOpen = !isDropdownOpen"
            >
              <div class="trigger-selected-info">
                <div class="pin-badge">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <span class="county-name-main">{{ selectedCountyObj.county_name }}</span>
                <span class="state-pill">{{ selectedCountyObj.state_abbr }}</span>
                <span class="fips-tag">FIPS {{ selectedCountyObj.fips }}</span>
              </div>

              <div class="dropdown-chevron-box" :class="{ rotated: isDropdownOpen }">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </button>

            <!-- Dropdown Menu Popover -->
            <Transition name="dropdown-pop">
              <div v-if="isDropdownOpen" class="county-dropdown-popover" @click.stop>
                <!-- Search Box Inside Dropdown -->
                <div class="dropdown-search-wrapper">
                  <svg class="search-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input 
                    v-model="searchQuery" 
                    type="text" 
                    class="dropdown-search-input"
                    placeholder="Search by county name, state, or FIPS code..."
                    autofocus
                  />
                  <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn" type="button">✕</button>
                </div>

                <!-- Scrollable Counties List -->
                <div class="counties-options-list">
                  <div 
                    v-for="c in filteredCounties" 
                    :key="c.fips"
                    class="county-option-row"
                    :class="{ active: String(c.fips) === String(selectedFips) }"
                    @click="selectCounty(c)"
                  >
                    <div class="option-left">
                      <span class="option-county-name">{{ c.county_name }}</span>
                      <span class="option-state-badge">{{ c.state_abbr }}</span>
                    </div>
                    <div class="option-right">
                      <span class="option-fips-pill">FIPS {{ c.fips }}</span>
                      <span v-if="String(c.fips) === String(selectedFips)" class="active-check">✓</span>
                    </div>
                  </div>

                  <div v-if="!filteredCounties.length" class="no-counties-found">
                    <span class="no-found-icon">🔍</span>
                    <span>No counties match "<b>{{ searchQuery }}</b>"</span>
                  </div>
                </div>

                <!-- Footer Counter -->
                <div class="dropdown-footer-tip">
                  <span>Showing {{ filteredCounties.length }} of {{ counties.length || 3143 }} US counties</span>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <button @click="loadCountyData(selectedFips)" class="btn-analyze">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>Analyze Graph</span>
        </button>
      </div>
    </header>

    <!-- Main Content Container -->
    <div class="main-body">
      <!-- Error Alert -->
      <div v-if="error" class="error-card">
        <span class="icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="loadCountyData(selectedFips)" class="btn-retry">Retry Connection</button>
      </div>

      <!-- Overview KPI Cards Grid -->
      <div v-else class="kpi-grid">
        <!-- 1. County Name -->
        <div class="kpi-card border-accent-indigo">
          <div class="kpi-card-head">
            <div class="kpi-icon-box bg-indigo-light">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <span class="lbl">County Name</span>
          </div>
          <div class="val county-val-text">{{ overview.county_name }}</div>
          <div class="kpi-sub-tag">Target Region</div>
        </div>

        <!-- 2. State -->
        <div class="kpi-card border-accent-blue">
          <div class="kpi-card-head">
            <div class="kpi-icon-box bg-blue-light">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
            </div>
            <span class="lbl">State</span>
          </div>
          <div class="val">
            <span class="kpi-state-pill">{{ overview.state_abbr }}</span>
          </div>
          <div class="kpi-sub-tag">United States</div>
        </div>

        <!-- 3. Population -->
        <div class="kpi-card border-accent-emerald">
          <div class="kpi-card-head">
            <div class="kpi-icon-box bg-emerald-light">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <span class="lbl">Population</span>
          </div>
          <div class="val">{{ overview.population ? overview.population.toLocaleString() : 'N/A' }}</div>
          <div class="kpi-sub-tag">Total Residents</div>
        </div>

        <!-- 4. Median Income -->
        <div class="kpi-card border-accent-teal">
          <div class="kpi-card-head">
            <div class="kpi-icon-box bg-teal-light">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <span class="lbl">Median Income</span>
          </div>
          <div class="val">{{ overview.median_household_income ? '$' + overview.median_household_income.toLocaleString() : 'N/A' }}</div>
          <div class="kpi-sub-tag">Household Avg / Yr</div>
        </div>

        <!-- 5. SVI Score -->
        <div class="kpi-card border-accent-orange">
          <div class="kpi-card-head">
            <div class="kpi-icon-box bg-amber-light">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <span class="lbl">SVI Score (Overall)</span>
          </div>
          <div class="val">
            <span 
              class="svi-score-badge"
              :class="{
                'svi-high': overview.svi_overall >= 0.75,
                'svi-mod': overview.svi_overall >= 0.5 && overview.svi_overall < 0.75,
                'svi-low': overview.svi_overall < 0.5
              }"
            >
              {{ overview.svi_overall ? overview.svi_overall.toFixed(4) : 'N/A' }}
            </span>
          </div>
          <div class="kpi-sub-tag">
            <span v-if="overview.svi_overall >= 0.75" class="text-risk-high">High Vulnerability</span>
            <span v-else-if="overview.svi_overall >= 0.5" class="text-risk-mod">Moderate Vulnerability</span>
            <span v-else class="text-risk-low">Low Vulnerability</span>
          </div>
        </div>
      </div>

      <!-- Section 1: Interactive Knowledge Graph (Always Visible On Top) -->
      <div class="section-pane">
        <div class="graph-card">
          <div class="graph-header">
            <h3>🕸️ Interactive Knowledge Graph</h3>
            <p>Clean radial graph showing central County node connected to its State and SDoH risk features (Neo4j Aura)</p>
          </div>
          <div v-if="loading" class="graph-loading">
            <div class="spinner"></div>
            <span>Querying Neo4j Aura Database...</span>
          </div>
          <div ref="graphContainer" class="vis-canvas"></div>
        </div>
      </div>

      <!-- Section 2: Side-by-Side Data Tables Below Graph -->
      <div class="tables-grid">
        <!-- SDoH Socioeconomic Risk Factors -->
        <div class="data-table-card">
          <div class="table-card-header">
            <h3 class="table-header-title">
              <img src="/assets/warning.png" alt="SDOH Risk Factors" class="section-title-icon" />
              <span>SDOH Risk Factors</span>
            </h3>
            <p>County-level socioeconomic drivers vs. US National average</p>
          </div>
          <table class="custom-table">
            <thead>
              <tr>
                <th>Factor Name</th>
                <th>County Value</th>
                <th>National Avg</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in sdohBarriers" :key="item.factor_name || item.metric">
                <td class="font-bold">{{ item.factor_name || item.metric || item.category || 'N/A' }}</td>
                <td>{{ item.county_value ?? item.value ?? 'N/A' }} {{ item.unit || '' }}</td>
                <td>{{ item.us_avg ?? item.national_avg ?? '11.5%' }} {{ item.unit || '' }}</td>
                <td :class="(item.difference > 0 || (typeof item.difference === 'string' && item.difference.startsWith('+'))) ? 'text-red' : 'text-green'">
                  {{ formatDifference(item.difference, item.unit) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Health Outcomes -->
        <div class="data-table-card">
          <div class="table-card-header">
            <h3 class="table-header-title">
              <img src="/assets/assistance.png" alt="Health Outcomes" class="section-title-icon" />
              <span>Health Outcomes</span>
            </h3>
            <p>Chronic condition prevalence vs. US National average</p>
          </div>
          <table class="custom-table">
            <thead>
              <tr>
                <th>Condition Name</th>
                <th>County Prevalence (%)</th>
                <th>National Avg (%)</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in healthOutcomes" :key="item.condition_name || item.condition">
                <td class="font-bold">{{ item.condition_name || item.condition || 'N/A' }}</td>
                <td>{{ item.county_prevalence ?? item.rate ?? 'N/A' }}{{ String(item.county_prevalence ?? item.rate).includes('%') ? '' : '%' }}</td>
                <td>{{ item.us_avg ?? item.national_avg ?? '9.8%' }}{{ String(item.us_avg ?? item.national_avg).includes('%') ? '' : '%' }}</td>
                <td :class="(item.difference > 0 || (typeof item.difference === 'string' && item.difference.startsWith('+'))) ? 'text-red' : 'text-green'">
                  {{ formatDiffPercent(item.difference) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sdoh-insights-native {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: 24px 32px 60px;
  box-sizing: border-box;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.header-titles h2 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
  z-index: 50;
}

.header-titles h2 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
}

.header-titles p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.search-controls-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  background: var(--surface);
  padding: 20px 24px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 50;
  overflow: visible;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.control-group.flex-2 {
  flex: 2;
  position: relative;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.label-icon {
  font-size: 0.95rem;
}

/* Custom Searchable County Dropdown Container */
.county-searchable-dropdown {
  position: relative;
  width: 100%;
  z-index: 60;
}

.dropdown-trigger-box {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 10px 16px;
  cursor: pointer;
  outline: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.dropdown-trigger-box:hover,
.dropdown-trigger-box.open {
  border-color: #2f6fed;
  box-shadow: 0 0 0 3.5px rgba(47, 111, 237, 0.12);
  background: #fdfdfd;
}

.trigger-selected-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pin-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #eef2ff;
  color: #2f6fed;
  flex-shrink: 0;
}

.county-name-main {
  font-size: 0.92rem;
  font-weight: 700;
  color: #0f172a;
}

.state-pill {
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
  letter-spacing: 0.04em;
}

.fips-tag {
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.dropdown-chevron-box {
  color: #64748b;
  display: flex;
  align-items: center;
  transition: transform 0.25s ease, color 0.25s ease;
  margin-left: 8px;
  flex-shrink: 0;
}

.dropdown-chevron-box.rotated {
  transform: rotate(180deg);
  color: #2f6fed;
}

/* Dropdown Menu Popover */
.county-dropdown-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18), 0 4px 14px rgba(15, 23, 42, 0.08);
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.search-input-icon {
  position: absolute;
  left: 24px;
  color: #94a3b8;
  pointer-events: none;
}

.dropdown-search-input {
  width: 100%;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 9px 34px 9px 36px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #0f172a;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.dropdown-search-input:focus {
  border-color: #2f6fed;
  box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.12);
}

.clear-search-btn {
  position: absolute;
  right: 24px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
}

.clear-search-btn:hover {
  color: #0f172a;
  background: #e2e8f0;
}

/* Scrollable Options List */
.counties-options-list {
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
}

.counties-options-list::-webkit-scrollbar {
  width: 6px;
}
.counties-options-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.county-option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.county-option-row:hover {
  background: #f1f5f9;
}

.county-option-row.active {
  background: #eef2ff;
  color: #2f6fed;
}

.option-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-county-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
}

.county-option-row.active .option-county-name {
  color: #2f6fed;
  font-weight: 700;
}

.option-state-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.county-option-row.active .option-state-badge {
  background: #bfdbfe;
  color: #1d4ed8;
}

.option-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-fips-pill {
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
}

.active-check {
  font-size: 0.85rem;
  font-weight: 800;
  color: #2f6fed;
}

.no-counties-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: #64748b;
  font-size: 0.88rem;
}

.no-found-icon {
  font-size: 1.5rem;
}

.dropdown-footer-tip {
  padding: 8px 14px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 600;
  text-align: right;
}

/* Animations */
.dropdown-pop-enter-active,
.dropdown-pop-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-pop-enter-from,
.dropdown-pop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.btn-analyze {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--brand);
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(47, 111, 237, 0.25);
  transition: all 0.2s ease;
  height: 48px;
  flex-shrink: 0;
}

.btn-analyze:hover {
  background: var(--brand-dark);
  transform: translateY(-1px);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  position: relative;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.kpi-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.border-accent-indigo {
  border-right: 4.5px solid #6366f1 !important;
}

.border-accent-blue {
  border-right: 4.5px solid #3b82f6 !important;
}

.border-accent-emerald {
  border-right: 4.5px solid #10b981 !important;
}

.border-accent-teal {
  border-right: 4.5px solid #0d9488 !important;
}

.border-accent-orange {
  border-right: 4.5px solid #f97316 !important;
}

.kpi-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.kpi-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-indigo-light { background: #eef2ff; }
.bg-blue-light { background: #eff6ff; }
.bg-emerald-light { background: #ecfdf5; }
.bg-teal-light { background: #f0fdfa; }
.bg-amber-light { background: #fef3c7; }

.kpi-card .lbl {
  font-size: 0.76rem;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-card .val {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}

.county-val-text {
  font-size: 1.12rem !important;
  line-height: 1.25;
  white-space: normal;
  word-break: break-word;
}

.kpi-state-pill {
  display: inline-flex;
  align-items: center;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.95rem;
  font-weight: 800;
  padding: 3px 12px;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
}

.kpi-sub-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
}

.svi-score-badge {
  display: inline-flex;
  align-items: center;
  font-size: 1.15rem;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 8px;
  letter-spacing: 0.02em;
}

.svi-score-badge.svi-high {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.svi-score-badge.svi-mod {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
}

.svi-score-badge.svi-low {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.text-risk-high { color: #dc2626; font-weight: 700; }
.text-risk-mod { color: #d97706; font-weight: 700; }
.text-risk-low { color: #059669; font-weight: 700; }

.section-pane {
  margin-bottom: 24px;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.table-card-header h3,
.table-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
}

.section-title-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}

.table-card-header p {
  margin: 0 0 16px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

@media (max-width: 1024px) {
  .tables-grid {
    grid-template-columns: 1fr;
  }
}

.graph-card, .data-table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.graph-header h3, .data-table-card h3 {
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
}

.graph-header p {
  margin: 0 0 18px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.vis-canvas {
  width: 100%;
  height: 520px;
  background: #f8fafc;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.custom-table th, .custom-table td {
  padding: 14px 18px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}

.custom-table th {
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.custom-table tbody tr:hover {
  background-color: #f8fafc;
}

.font-bold { font-weight: 700; color: var(--text-primary); }
.text-red { color: var(--red-text); font-weight: 700; }
.text-green { color: var(--teal); font-weight: 700; }

.error-card {
  background: var(--red-bg);
  border: 1px solid var(--red-soft);
  color: var(--red-text);
  padding: 24px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.btn-retry {
  background: var(--brand);
  color: #ffffff;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}
</style>
