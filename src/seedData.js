import { db } from './firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const buildings = [
  {
    id: "bld_001",
    name: "Shree Krupa Apartments",
    address: "Kalbadevi Road, Dharavi, Mumbai",
    lat: 19.0410, lng: 72.8526,
    ward: "Dharavi",
    age_years: 47, floors: 4,
    occupancy_type: "residential",
    construction_type: "brick",
    noc_status: "expired",
    noc_expiry_days: -620,
    complaints_last_3yrs: 5,
    sprinkler_present: false
  },
  {
    id: "bld_002",
    name: "Lotus Business Tower",
    address: "Lower Parel, Mumbai",
    lat: 19.0017, lng: 72.8302,
    ward: "Lower Parel",
    age_years: 8, floors: 18,
    occupancy_type: "commercial",
    construction_type: "RCC",
    noc_status: "valid",
    noc_expiry_days: 340,
    complaints_last_3yrs: 0,
    sprinkler_present: true
  },
  {
    id: "bld_003",
    name: "Sagar Niwas",
    address: "Colaba Causeway, Colaba, Mumbai",
    lat: 18.9067, lng: 72.8147,
    ward: "Colaba",
    age_years: 62, floors: 5,
    occupancy_type: "mixed",
    construction_type: "brick",
    noc_status: "expired",
    noc_expiry_days: -1100,
    complaints_last_3yrs: 7,
    sprinkler_present: false
  },
  {
    id: "bld_004",
    name: "Highland Residency",
    address: "Andheri West, Mumbai",
    lat: 19.1197, lng: 72.8468,
    ward: "Andheri West",
    age_years: 15, floors: 12,
    occupancy_type: "residential",
    construction_type: "RCC",
    noc_status: "valid",
    noc_expiry_days: 200,
    complaints_last_3yrs: 1,
    sprinkler_present: true
  },
  {
    id: "bld_005",
    name: "Crawford Trade Center",
    address: "Crawford Market, Mumbai",
    lat: 18.9470, lng: 72.8347,
    ward: "Crawford Market",
    age_years: 55, floors: 6,
    occupancy_type: "commercial",
    construction_type: "brick",
    noc_status: "expired",
    noc_expiry_days: -900,
    complaints_last_3yrs: 9,
    sprinkler_present: false
  },
  {
    id: "bld_006",
    name: "Bandra Heights",
    address: "Hill Road, Bandra West, Mumbai",
    lat: 19.0596, lng: 72.8295,
    ward: "Bandra West",
    age_years: 12, floors: 14,
    occupancy_type: "mixed",
    construction_type: "RCC",
    noc_status: "valid",
    noc_expiry_days: 150,
    complaints_last_3yrs: 0,
    sprinkler_present: true
  },
  {
    id: "bld_007",
    name: "Worli Sea Face Hotel",
    address: "Worli, Mumbai",
    lat: 19.0096, lng: 72.8175,
    ward: "Worli",
    age_years: 22, floors: 9,
    occupancy_type: "hotel",
    construction_type: "RCC",
    noc_status: "applied",
    noc_expiry_days: -10,
    complaints_last_3yrs: 2,
    sprinkler_present: true
  },
  {
    id: "bld_008",
    name: "Ghatkopar Industrial Estate",
    address: "LBS Marg, Ghatkopar West, Mumbai",
    lat: 19.0860, lng: 72.9081,
    ward: "Ghatkopar West",
    age_years: 38, floors: 3,
    occupancy_type: "industrial",
    construction_type: "steel frame",
    noc_status: "expired",
    noc_expiry_days: -450,
    complaints_last_3yrs: 6,
    sprinkler_present: false
  },
  {
    id: "bld_009",
    name: "Kurla Junction Mall",
    address: "LBS Marg, Kurla West, Mumbai",
    lat: 19.0654, lng: 72.8794,
    ward: "Kurla West",
    age_years: 10, floors: 7,
    occupancy_type: "commercial",
    construction_type: "RCC",
    noc_status: "valid",
    noc_expiry_days: 280,
    complaints_last_3yrs: 1,
    sprinkler_present: true
  },
  {
    id: "bld_010",
    name: "Dadar Chowk Chambers",
    address: "Dadar West, Mumbai",
    lat: 19.0186, lng: 72.8429,
    ward: "Dadar West",
    age_years: 41, floors: 5,
    occupancy_type: "mixed",
    construction_type: "brick",
    noc_status: "expired",
    noc_expiry_days: -730,
    complaints_last_3yrs: 4,
    sprinkler_present: false
  },
  {
    id: "bld_011",
    name: "Borivali Park View",
    address: "Borivali West, Mumbai",
    lat: 19.2307, lng: 72.8567,
    ward: "Borivali West",
    age_years: 6, floors: 16,
    occupancy_type: "residential",
    construction_type: "RCC",
    noc_status: "valid",
    noc_expiry_days: 400,
    complaints_last_3yrs: 0,
    sprinkler_present: true
  },
  {
    id: "bld_012",
    name: "Mohammad Ali Road Guesthouse",
    address: "Mohammad Ali Road, Mumbai",
    lat: 18.9583, lng: 72.8328,
    ward: "Mohammad Ali Road",
    age_years: 58, floors: 4,
    occupancy_type: "hotel",
    construction_type: "brick",
    noc_status: "expired",
    noc_expiry_days: -1300,
    complaints_last_3yrs: 8,
    sprinkler_present: false
  },
  {
    id: "bld_013",
    name: "Powai Tech Park",
    address: "Powai, Mumbai",
    lat: 19.1176, lng: 72.9060,
    ward: "Powai",
    age_years: 5, floors: 20,
    occupancy_type: "commercial",
    construction_type: "RCC",
    noc_status: "valid",
    noc_expiry_days: 500,
    complaints_last_3yrs: 0,
    sprinkler_present: true
  },
  {
    id: "bld_014",
    name: "Mazgaon Old Chambers",
    address: "Mazgaon, Mumbai",
    lat: 18.9647, lng: 72.8439,
    ward: "Mazgaon",
    age_years: 65, floors: 4,
    occupancy_type: "residential",
    construction_type: "brick",
    noc_status: "expired",
    noc_expiry_days: -1500,
    complaints_last_3yrs: 6,
    sprinkler_present: false
  },
  {
    id: "bld_015",
    name: "Malad Link Plaza",
    address: "Link Road, Malad West, Mumbai",
    lat: 19.1864, lng: 72.8493,
    ward: "Malad West",
    age_years: 9, floors: 11,
    occupancy_type: "mixed",
    construction_type: "RCC",
    noc_status: "valid",
    noc_expiry_days: 220,
    complaints_last_3yrs: 1,
    sprinkler_present: true
  },
  {
    id: "bld_016",
    name: "Bhendi Bazaar Trade Hub",
    address: "Bhendi Bazaar, Mumbai",
    lat: 18.9559, lng: 72.8311,
    ward: "Bhendi Bazaar",
    age_years: 70, floors: 3,
    occupancy_type: "commercial",
    construction_type: "brick",
    noc_status: "expired",
    noc_expiry_days: -1800,
    complaints_last_3yrs: 10,
    sprinkler_present: false
  },
  {
    id: "bld_017",
    name: "Chembur Crystal Towers",
    address: "Chembur, Mumbai",
    lat: 19.0522, lng: 72.9005,
    ward: "Chembur",
    age_years: 7, floors: 15,
    occupancy_type: "residential",
    construction_type: "RCC",
    noc_status: "valid",
    noc_expiry_days: 310,
    complaints_last_3yrs: 0,
    sprinkler_present: true
  },
  {
    id: "bld_018",
    name: "Grant Road Lodge",
    address: "Grant Road, Mumbai",
    lat: 18.9633, lng: 72.8147,
    ward: "Grant Road",
    age_years: 50, floors: 4,
    occupancy_type: "hotel",
    construction_type: "brick",
    noc_status: "expired",
    noc_expiry_days: -600,
    complaints_last_3yrs: 5,
    sprinkler_present: false
  },
  {
    id: "bld_019",
    name: "Vikhroli Corporate Park",
    address: "Vikhroli West, Mumbai",
    lat: 19.1071, lng: 72.9258,
    ward: "Vikhroli West",
    age_years: 4, floors: 22,
    occupancy_type: "commercial",
    construction_type: "RCC",
    noc_status: "valid",
    noc_expiry_days: 600,
    complaints_last_3yrs: 0,
    sprinkler_present: true
  },
  {
    id: "bld_020",
    name: "Khar Danda Fishing Colony",
    address: "Khar Danda, Khar West, Mumbai",
    lat: 19.0728, lng: 72.8276,
    ward: "Khar West",
    age_years: 44, floors: 3,
    occupancy_type: "residential",
    construction_type: "brick",
    noc_status: "expired",
    noc_expiry_days: -800,
    complaints_last_3yrs: 4,
    sprinkler_present: false
  }
];

export const seedBuildings = async () => {
  console.log('Starting seed...');
  for (const building of buildings) {
    const score = calculateRiskScore(building);
    await setDoc(doc(collection(db, 'buildings'), building.id), {
      ...building,
      risk_score: score
    });
    console.log(`Seeded: ${building.name} — Risk Score: ${score}`);
  }
  console.log('All buildings seeded successfully!');
};

function calculateRiskScore(b) {
  let score = 0;
  // Age factor (max 25 points)
  score += Math.min(25, b.age_years * 0.5);
  // NOC status (max 25 points)
  if (b.noc_status === 'expired') score += 25;
  else if (b.noc_status === 'applied') score += 10;
  else score += 0;
  // Complaints (max 20 points)
  score += Math.min(20, b.complaints_last_3yrs * 2.5);
  // No sprinkler (15 points)
  if (!b.sprinkler_present) score += 15;
  // Construction type (max 10 points)
  if (b.construction_type === 'brick') score += 10;
  else if (b.construction_type === 'steel frame') score += 5;
  // Floors factor (max 5 points)
  if (b.floors <= 4) score += 5;
  return Math.round(Math.min(100, score));
}