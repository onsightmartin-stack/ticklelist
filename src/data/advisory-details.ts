/** Caution notes and news links for countries with active conflicts or instability.
 *  Sources: ACLED, International Crisis Group, World Population Review (March 2026). */

export interface AdvisoryDetail {
  reason: string;
  caution: string;
  newsQuery: string;
}

/** Countries with active wars — shown with stripes on the map. */
export const advisoryDetails: Record<string, AdvisoryDetail> = {
  Ukraine: {
    reason: "Full-scale war with Russia since Feb 2022. Daily missile and drone strikes on civilian infrastructure.",
    caution: "Front-line regions shift constantly; mine and UXO contamination is extensive across eastern and southern oblasts.",
    newsQuery: "Ukraine war frontline 2026",
  },
  Russia: {
    reason: "Ongoing war in Ukraine and involvement in the US-Israel-Iran conflict. Risk of detention of Western nationals.",
    caution: "Several Western citizens have been detained on politically motivated charges.",
    newsQuery: "Russia war 2026",
  },
  Sudan: {
    reason: "Civil war between SAF and RSF since April 2023. Massive famine and displacement across Darfur and Khartoum.",
    caution: "Khartoum and Darfur are active combat zones. Humanitarian access severely restricted.",
    newsQuery: "Sudan civil war 2026",
  },
  Myanmar: {
    reason: "Civil war between the military junta and resistance forces since the 2021 coup. Junta losing territory.",
    caution: "Border regions are active combat zones. Air strikes on civilian areas and internet blackouts are common.",
    newsQuery: "Myanmar civil war 2026",
  },
  Iran: {
    reason: "Active war with US and Israel since late February 2026. Missile strikes on cities. Strait of Hormuz tensions.",
    caution: "Tehran and major cities under bombardment. All commercial flights suspended. Regional spillover across the Middle East.",
    newsQuery: "Iran war US Israel 2026",
  },
  Israel: {
    reason: "Ongoing military operations in Gaza since Oct 2023, plus active war with Iran since Feb 2026. Multi-front attacks.",
    caution: "Rocket sirens frequent. Airport disruptions. Border areas with Lebanon remain volatile.",
    newsQuery: "Israel Iran war Gaza 2026",
  },
  Palestine: {
    reason: "Devastated by the Israel-Gaza war since Oct 2023. Fragile ceasefire but ongoing military operations.",
    caution: "Gaza is largely destroyed. West Bank has military checkpoints and frequent raids.",
    newsQuery: "Palestine Gaza 2026",
  },
  Yemen: {
    reason: "Civil war between government and Houthi forces. Houthi attacks on Red Sea shipping draw international responses.",
    caution: "Humanitarian crisis among the worst globally. Houthi-controlled areas face regular air strikes.",
    newsQuery: "Yemen Houthi war 2026",
  },
  Syria: {
    reason: "Multi-faction civil war ongoing since 2011. ISIS remnants, Turkish operations, and Israeli strikes continue.",
    caution: "No stable governance in most regions. Unexploded ordnance is widespread.",
    newsQuery: "Syria conflict 2026",
  },
  Somalia: {
    reason: "Al-Shabaab insurgency with frequent bombings. Government controls limited territory outside Mogadishu.",
    caution: "Very limited infrastructure. Clan violence and piracy remain threats.",
    newsQuery: "Somalia Al-Shabaab 2026",
  },
  Afghanistan: {
    reason: "Taliban governance with active ISIS-K terrorism. Pakistan-Afghanistan border conflict escalated in early 2026.",
    caution: "No Western embassies operate. Severe restrictions on movement.",
    newsQuery: "Afghanistan conflict 2026",
  },
  Haiti: {
    reason: "Gang warfare has effectively collapsed the state. Armed groups control most of Port-au-Prince.",
    caution: "Airport and roads frequently blocked. Kidnapping-for-ransom is endemic.",
    newsQuery: "Haiti gang war 2026",
  },
  "DR Congo": {
    reason: "M23 rebel offensive in eastern Congo. Record air strikes recorded in early 2026.",
    caution: "Eastern provinces (Kivu, Ituri) are extremely dangerous.",
    newsQuery: "DR Congo M23 2026",
  },
  Ethiopia: {
    reason: "Post-Tigray war instability with ongoing ethnic violence in Amhara and Oromia regions.",
    caution: "Inter-ethnic clashes can block roads without warning.",
    newsQuery: "Ethiopia conflict 2026",
  },
};

/** Caution notes for countries that aren't in active war but have instability.
 *  These are shown as notes in info boxes, NOT as stripes on the map. */
export const cautionNotes: Record<string, { note: string; newsQuery: string }> = {
  Iraq: {
    note: "ISIS remnants and militia violence in disputed territories. Kurdistan Region is relatively safer.",
    newsQuery: "Iraq security 2026",
  },
  Nigeria: {
    note: "Boko Haram in northeast, mass banditry and kidnapping in northwest. Lagos and Abuja are safer but road travel in the north is risky.",
    newsQuery: "Nigeria security 2026",
  },
  Pakistan: {
    note: "TTP terrorism surging in Balochistan and KPK. Cross-border tensions with Afghanistan. Major cities are relatively safer.",
    newsQuery: "Pakistan terrorism 2026",
  },
  "Burkina Faso": {
    note: "Jihadist insurgency controls large areas. Military junta struggling with security. Overland travel is very dangerous.",
    newsQuery: "Burkina Faso insurgency 2026",
  },
  Mali: {
    note: "Jihadist insurgency in the north and centre. Wagner/Africa Corps presence. UN peacekeepers have withdrawn.",
    newsQuery: "Mali security 2026",
  },
  Niger: {
    note: "Post-coup instability with jihadi attacks and spillover from Mali and Burkina Faso. Western military partners departed.",
    newsQuery: "Niger security 2026",
  },
  Chad: {
    note: "Terrorism along the Lake Chad Basin and armed banditry in rural areas. Northern border is dangerous.",
    newsQuery: "Chad security 2026",
  },
  "Central African Republic": {
    note: "Armed groups operate outside government control. Roads are dangerous. Humanitarian access restricted.",
    newsQuery: "Central African Republic 2026",
  },
  Mozambique: {
    note: "ISIS-linked insurgency in Cabo Delgado province. Electoral violence destabilized parts of the south.",
    newsQuery: "Mozambique Cabo Delgado 2026",
  },
  Colombia: {
    note: "ELN and FARC dissident groups in rural areas. Major cities are generally safe but rural travel requires planning.",
    newsQuery: "Colombia ELN 2026",
  },
  Ecuador: {
    note: "Drug war escalation with gang violence. Coastal cities most affected. Quito is safer.",
    newsQuery: "Ecuador gang violence 2026",
  },
  Mexico: {
    note: "Cartel violence in Sinaloa, Tamaulipas, and Guerrero. Tourist corridors are policed but violence can erupt.",
    newsQuery: "Mexico cartel violence 2026",
  },
  "South Sudan": {
    note: "Ethnic violence and inter-communal fighting. Famine conditions persist. Infrastructure nearly nonexistent outside Juba.",
    newsQuery: "South Sudan violence 2026",
  },
  Libya: {
    note: "Divided between rival governments. Militia clashes erupt without warning. No stable governance.",
    newsQuery: "Libya conflict 2026",
  },
  Lebanon: {
    note: "Spillover from Iran-Israel war. Hezbollah involvement. Economic collapse with degraded essential services.",
    newsQuery: "Lebanon crisis 2026",
  },
  Algeria: {
    note: "Mount Tahat (Hoggar Mountains) is closed for climbing until further notice. Algerian authorities have restricted access to the Atakor plateau region.",
    newsQuery: "Algeria Hoggar Tahat climbing 2026",
  },
};
/** Build a Google News search URL. */
export function getNewsUrl(query: string): string {
  return `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en`;
}
