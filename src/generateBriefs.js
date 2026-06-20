import { db } from './firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateAllBriefs = async () => {
  const snapshot = await getDocs(collection(db, 'buildings'));
  const buildings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // Only generate for top 5 highest risk buildings to save quota
  const topBuildings = buildings
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 5);

  for (const building of topBuildings) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a fire safety officer in Mumbai. Give a 3-sentence risk assessment for this building. Be specific and direct. Building data: Name: ${building.name}, Address: ${building.address}, Age: ${building.age_years} years, Floors: ${building.floors}, Type: ${building.occupancy_type}, Construction: ${building.construction_type}, Fire NOC Status: ${building.noc_status}, Complaints in last 3 years: ${building.complaints_last_3yrs}, Sprinkler system: ${building.sprinkler_present ? 'Present' : 'Absent'}, Risk Score: ${building.risk_score}/100. Also mention the network/communication risk during a fire emergency at this building.`
              }]
            }]
          })
        }
      );
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        await setDoc(doc(collection(db, 'buildings'), building.id), {
          cached_brief: text
        }, { merge: true });
        console.log(`✅ Cached brief for: ${building.name}`);
      } else {
        console.log(`⚠️ No text returned for: ${building.name}`, data);
      }

      // Wait 5 seconds between calls to respect rate limit
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.log(`❌ Failed for: ${building.name}`, error);
    }
  }
  console.log('🎉 Done caching briefs!');
};