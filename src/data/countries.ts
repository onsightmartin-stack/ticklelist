export type ClimbStatus = "climbed" | "mainland_climbed" | "legal_high_point" | "visited" | "not_visited";

export interface CountryHighPoint {
  country: string;
  continent: string;
  highPoint: string;
  elevation: string;
  /** Other names for the same summit (native / English / Peakbagger spelling). */
  altNames?: string[];
  status: ClimbStatus;
  year?: number;
  month?: number; // 1-12
  note?: string; // e.g. "Mainland HP only"
  unMember?: boolean; // false for non-UN member states such as Taiwan
}

// 193 UN members + Taiwan + Antarctica = 195 targets
export const countries: CountryHighPoint[] = [
  // ═══════════════════════════════════════
  // EUROPE — Climbed
  // ═══════════════════════════════════════
  { country: "France", continent: "Europe", highPoint: "Mont Blanc", elevation: "4,807 m", status: "climbed", year: 2023, month: 7 },
  { country: "Italy", continent: "Europe", highPoint: "Mont Blanc", elevation: "4,807 m", status: "climbed", year: 2023, month: 7 },
  { country: "Austria", continent: "Europe", highPoint: "Großglockner", elevation: "3,797 m", status: "climbed", year: 2021, month: 8 },
  { country: "Spain", continent: "Europe", highPoint: "Pico del Teide", elevation: "3,715 m", status: "climbed", year: 2026, month: 1 },
  { country: "Germany", continent: "Europe", highPoint: "Zugspitze", elevation: "2,962 m", status: "climbed", year: 2019, month: 7 },
  { country: "Slovenia", continent: "Europe", highPoint: "Triglav", elevation: "2,864 m", status: "climbed", year: 2023, month: 7 },
  { country: "Slovakia", continent: "Europe", highPoint: "Gerlachovský štít", elevation: "2,654 m", status: "climbed", year: 2021, month: 9 },
  { country: "Liechtenstein", continent: "Europe", highPoint: "Grauspitz", elevation: "2,600 m", status: "climbed", year: 2025, month: 7 },
  { country: "Poland", continent: "Europe", highPoint: "Rysy", elevation: "2,499 m", status: "climbed", year: 2025, month: 6 },
  { country: "Norway", continent: "Europe", highPoint: "Galdhøpiggen", elevation: "2,469 m", status: "climbed", year: 2022, month: 6 },
  { country: "Portugal", continent: "Europe", highPoint: "Montanha do Pico", elevation: "2,351 m", status: "climbed", year: 2025, month: 2 },
  { country: "Sweden", continent: "Europe", highPoint: "Kebnekaise (Nordtoppen)", elevation: "2,097 m", status: "visited", note: "Sydtoppen summited 2019; Nordtoppen (2,096.8 m) has been the true highpoint since 2019 as Sydtoppen's glacier melts" },
  { country: "Croatia", continent: "Europe", highPoint: "Dinara", elevation: "1,831 m", status: "climbed", year: 2023, month: 4 },
  { country: "Czech Republic", continent: "Europe", highPoint: "Sněžka", elevation: "1,603 m", status: "climbed", year: 2022, month: 8 },
  { country: "Finland", continent: "Europe", highPoint: "Halti", elevation: "1,324 m", status: "climbed", year: 2023, month: 6 },
  { country: "Ireland", continent: "Europe", highPoint: "Carrauntoohil", elevation: "1,039 m", status: "climbed", year: 2026, month: 7 },
  { country: "Hungary", continent: "Europe", highPoint: "Kékes", elevation: "1,014 m", status: "climbed", year: 2021, month: 9 },
  { country: "San Marino", continent: "Europe", highPoint: "Monte Titano", elevation: "739 m", status: "climbed", year: 2024, month: 4 },
  { country: "Belgium", continent: "Europe", highPoint: "Signal de Botrange", elevation: "694 m", status: "climbed", year: 2021, month: 8 },
  { country: "Luxembourg", continent: "Europe", highPoint: "Kneiff", elevation: "560 m", status: "climbed", year: 2021, month: 8 },
  { country: "Estonia", continent: "Europe", highPoint: "Suur Munamägi", elevation: "318 m", status: "climbed", year: 2022, month: 5 },
  { country: "Latvia", continent: "Europe", highPoint: "Gaizinkalns", elevation: "312 m", status: "climbed", year: 2022, month: 5 },
  { country: "Lithuania", continent: "Europe", highPoint: "Aukstojas", elevation: "294 m", status: "climbed", year: 2022, month: 8 },
  { country: "Malta", continent: "Europe", highPoint: "Ta' Dmejrek", elevation: "253 m", status: "climbed", year: 2025, month: 3 },
  { country: "Monaco", continent: "Europe", highPoint: "Chemin des Révoires", elevation: "162 m", status: "climbed", year: 2025, month: 7 },

  // EUROPE — Mainland climbed (territorial HP not yet done)
  { country: "Denmark", continent: "Europe", highPoint: "Gunnbjørn Fjeld", elevation: "3,694 m", status: "mainland_climbed", note: "Mainland HP Møllehøj (171 m) summited" },
  { country: "Netherlands", continent: "Europe", highPoint: "Mount Scenery", elevation: "870 m", status: "mainland_climbed", note: "Mainland HP Vaalserberg (322 m) summited" },

  // EUROPE — Not yet climbed
  { country: "Russia", continent: "Europe", highPoint: "Elbrus", elevation: "5,642 m", status: "not_visited" },
  { country: "Georgia", continent: "Europe", highPoint: "Shkhara", elevation: "5,193 m", status: "not_visited" },
  { country: "Switzerland", continent: "Europe", highPoint: "Monte Rosa (Dufourspitze)", elevation: "4,633 m", status: "visited" },
  { country: "Azerbaijan", continent: "Europe", highPoint: "Bazardüzü", elevation: "4,466 m", status: "not_visited" },
  { country: "Armenia", continent: "Europe", highPoint: "Aragats", elevation: "4,090 m", status: "not_visited" },
  { country: "Andorra", continent: "Europe", highPoint: "Pic de Coma Pedrosa", elevation: "2,943 m", status: "not_visited" },
  { country: "Bulgaria", continent: "Europe", highPoint: "Musala", elevation: "2,925 m", status: "visited" },
  { country: "Greece", continent: "Europe", highPoint: "Mount Olympus (Mytikas)", elevation: "2,918 m", status: "visited" },
  { country: "Albania", continent: "Europe", highPoint: "Korab", elevation: "2,753 m", status: "not_visited" },
  { country: "North Macedonia", continent: "Europe", highPoint: "Korab", elevation: "2,753 m", status: "visited" },
  { country: "Romania", continent: "Europe", highPoint: "Moldoveanu", elevation: "2,544 m", status: "visited" },
  { country: "Montenegro", continent: "Europe", highPoint: "Zla Kolata", elevation: "2,525 m", status: "not_visited" },
  { country: "Bosnia and Herzegovina", continent: "Europe", highPoint: "Maglić", elevation: "2,386 m", status: "not_visited" },
  { country: "Iceland", continent: "Europe", highPoint: "Hvannadalshnjúkur", elevation: "2,109 m", status: "visited" },
  { country: "Ukraine", continent: "Europe", highPoint: "Hoverla", elevation: "2,061 m", status: "climbed", year: 2026, month: 8 },
  { country: "Serbia", continent: "Europe", highPoint: "Rudoka e Madhe (Velika Rudoka)", elevation: "2,658 m", status: "visited", note: "In Kosovo (disputed); Midžor (2,169 m) is the highpoint of Serbia excluding Kosovo" },
  { country: "United Kingdom", continent: "Europe", highPoint: "Ben Nevis", elevation: "1,345 m", status: "climbed", year: 2026, month: 7, note: "Counted as the UK high point here — mainland Britain. The territorial HP, Mount Paget on South Georgia (2,934 m), is not counted under my definition" },
  { country: "Moldova", continent: "Europe", highPoint: "Bălăneşti", elevation: "430 m", status: "not_visited" },
  { country: "Belarus", continent: "Europe", highPoint: "Hara Dzyarzhynskaya", elevation: "345 m", status: "not_visited" },
  { country: "Vatican City", continent: "Europe", highPoint: "Vatican Hill", elevation: "78 m", status: "not_visited", unMember: false },

  // ═══════════════════════════════════════
  // ASIA — Climbed
  // ═══════════════════════════════════════
  { country: "Taiwan", continent: "Asia", highPoint: "Yushan", elevation: "3,951 m", status: "climbed", year: 2024, month: 9, unMember: false },
  { country: "Malaysia", continent: "Asia", highPoint: "Kinabalu", elevation: "4,095 m", status: "climbed", year: 2023, month: 2 },
  { country: "Japan", continent: "Asia", highPoint: "Fuji-san", elevation: "3,776 m", status: "climbed", year: 2024, month: 7 },
  { country: "Vietnam", continent: "Asia", highPoint: "Fan Si Pan", elevation: "3,147 m", status: "climbed", year: 2023, month: 1 },
  { country: "East Timor", continent: "Asia", highPoint: "Foho Ramelau", elevation: "2,963 m", status: "climbed", year: 2025, month: 11 },
  { country: "Thailand", continent: "Asia", highPoint: "Doi Inthanon", elevation: "2,565 m", status: "climbed", year: 2023, month: 1 },
  { country: "Cyprus", continent: "Asia", highPoint: "Mount Olympus", elevation: "1,951 m", altNames: ["Chionistra"], status: "legal_high_point", year: 2025, month: 10, note: "Legal HP — true summit sits on UK Sovereign Base land (Troodos station)" },
  { country: "South Korea", continent: "Asia", highPoint: "Halla-san", elevation: "1,950 m", status: "legal_high_point", year: 2024, month: 6, note: "Legal HP — actual summit restricted" },
  { country: "Jordan", continent: "Asia", highPoint: "Jabal Umm ad Dami", elevation: "1,854 m", status: "climbed", year: 2022, month: 4 },
  { country: "Cambodia", continent: "Asia", highPoint: "Phnom Aoral", elevation: "1,813 m", status: "climbed", year: 2023, month: 2 },
  { country: "Singapore", continent: "Asia", highPoint: "Bukit Timah", elevation: "164 m", status: "climbed", year: 2023, month: 2 },

  // ASIA — Visited
  { country: "Nepal", continent: "Asia", highPoint: "Mount Everest", elevation: "8,849 m", status: "visited" },
  { country: "Indonesia", continent: "Asia", highPoint: "Puncak Jaya", elevation: "4,884 m", altNames: ["Carstensz Pyramid"], status: "visited" },

  // ASIA — Not yet
  { country: "China", continent: "Asia", highPoint: "Mount Everest", elevation: "8,849 m", status: "visited" },
  { country: "Pakistan", continent: "Asia", highPoint: "K2", elevation: "8,609 m", status: "not_visited" },
  { country: "India", continent: "Asia", highPoint: "Kangchenjunga", elevation: "8,586 m", status: "visited" },
  { country: "Tajikistan", continent: "Asia", highPoint: "Ismoil Somoni Peak", elevation: "7,495 m", altNames: ["Pik Ismail Samani"], status: "not_visited" },
  { country: "Kyrgyzstan", continent: "Asia", highPoint: "Jengish Chokusu", elevation: "7,439 m", altNames: ["Pik Pobeda"], status: "not_visited" },
  { country: "Kazakhstan", continent: "Asia", highPoint: "Khan Tengri", elevation: "7,010 m", status: "not_visited" },
  { country: "Bhutan", continent: "Asia", highPoint: "Gangkhar Puensum", elevation: "7,570 m", altNames: ["Gangkar Punsum"], status: "not_visited" },
  { country: "Afghanistan", continent: "Asia", highPoint: "Noshaq", elevation: "7,492 m", status: "not_visited" },
  { country: "Turkey", continent: "Asia", highPoint: "Mount Ararat", elevation: "5,137 m", status: "visited" },
  { country: "Iran", continent: "Asia", highPoint: "Damavand", elevation: "5,609 m", status: "not_visited" },
  { country: "Myanmar", continent: "Asia", highPoint: "Hkakabo Razi", elevation: "5,881 m", status: "not_visited" },
  { country: "Uzbekistan", continent: "Asia", highPoint: "Alpomish", elevation: "4,651 m", status: "not_visited" },
  { country: "Turkmenistan", continent: "Asia", highPoint: "Aýrybaba", elevation: "3,139 m", status: "not_visited" },
  { country: "Mongolia", continent: "Asia", highPoint: "Khüiten Peak", elevation: "4,356 m", status: "not_visited" },
  { country: "Laos", continent: "Asia", highPoint: "Phou Bia", elevation: "2,830 m", status: "not_visited" },
  { country: "Philippines", continent: "Asia", highPoint: "Mount Apo", elevation: "2,954 m", status: "visited" },
  { country: "Sri Lanka", continent: "Asia", highPoint: "Pidurutalagala", elevation: "2,524 m", status: "visited" },
  { country: "Bangladesh", continent: "Asia", highPoint: "Saka Haphong", elevation: "1,052 m", altNames: ["Mowdok Mual", "Tlangmoy", "Keokradong"], status: "not_visited", note: "Peakbagger records Mowdok Mual / Saka Haphong (1,052 m) as the country high point, not Keokradong" },
  { country: "North Korea", continent: "Asia", highPoint: "Paektu-san", elevation: "2,744 m", status: "not_visited" },
  { country: "Lebanon", continent: "Asia", highPoint: "Qurnat as Sawda'", elevation: "3,088 m", status: "not_visited" },
  { country: "Yemen", continent: "Asia", highPoint: "Jabal An-Nabi Shu'ayb", elevation: "3,666 m", status: "not_visited" },
  { country: "Saudi Arabia", continent: "Asia", highPoint: "Jabal Ferwa", elevation: "3,002 m", altNames: ["Jabal Farwa"], status: "not_visited" },
  { country: "Oman", continent: "Asia", highPoint: "Jabal Akhdar (Jebel Shams)", elevation: "3,018 m", altNames: ["Jebel Shams"], status: "not_visited" },
  { country: "Syria", continent: "Asia", highPoint: "Mount Hermon", elevation: "2,814 m", status: "not_visited" },
  { country: "Iraq", continent: "Asia", highPoint: "Cheekha Dar", elevation: "3,611 m", status: "not_visited" },
  { country: "Israel", continent: "Asia", highPoint: "Mount Meron", elevation: "1,204 m", status: "not_visited" },
  { country: "UAE", continent: "Asia", highPoint: "Jabal Jais", elevation: "1,934 m", status: "visited" },
  { country: "Kuwait", continent: "Asia", highPoint: "Mutla Ridge", elevation: "291 m", altNames: ["Kuwait High Point"], status: "not_visited" },
  { country: "Bahrain", continent: "Asia", highPoint: "Jabal ad Dukhan", elevation: "134 m", status: "not_visited" },
  { country: "Qatar", continent: "Asia", highPoint: "Tuwayyir al Hamir", elevation: "103 m", altNames: ["Al Galail"], status: "not_visited" },
  { country: "Brunei", continent: "Asia", highPoint: "Bukit Pagon", elevation: "1,850 m", status: "not_visited" },
  { country: "Maldives", continent: "Asia", highPoint: "Unnamed (Addu Atoll)", elevation: "5 m", status: "not_visited" },

  // ═══════════════════════════════════════
  // AFRICA — Climbed
  // ═══════════════════════════════════════
  { country: "Morocco", continent: "Africa", highPoint: "Jebel Toubkal", elevation: "4,167 m", status: "climbed", year: 2025, month: 5 },
  { country: "Cape Verde", continent: "Africa", highPoint: "Pico do Fogo", elevation: "2,829 m", status: "climbed", year: 2025, month: 3 },

  // AFRICA — Not yet
  { country: "Tanzania", continent: "Africa", highPoint: "Mount Kilimanjaro", elevation: "5,895 m", status: "not_visited" },
  { country: "Kenya", continent: "Africa", highPoint: "Batian (Mount Kenya)", elevation: "5,199 m", status: "not_visited" },
  { country: "Uganda", continent: "Africa", highPoint: "Margherita Peak", elevation: "5,109 m", altNames: ["Mount Stanley"], status: "not_visited" },
  { country: "DR Congo", continent: "Africa", highPoint: "Margherita Peak", elevation: "5,109 m", status: "not_visited" },
  { country: "Rwanda", continent: "Africa", highPoint: "Karisimbi", elevation: "4,507 m", status: "not_visited" },
  { country: "Ethiopia", continent: "Africa", highPoint: "Ras Dashen", elevation: "4,543 m", status: "not_visited" },
  { country: "Cameroon", continent: "Africa", highPoint: "Mount Cameroon", elevation: "4,040 m", status: "not_visited" },
  { country: "Algeria", continent: "Africa", highPoint: "Mount Tahat", elevation: "2,908 m", status: "not_visited" },
  { country: "South Africa", continent: "Africa", highPoint: "Mafadi", elevation: "3,451 m", status: "not_visited" },
  { country: "Lesotho", continent: "Africa", highPoint: "Thabana Ntlenyana", elevation: "3,482 m", status: "not_visited" },
  { country: "Eswatini", continent: "Africa", highPoint: "Emlembe", elevation: "1,862 m", status: "not_visited" },
  { country: "Malawi", continent: "Africa", highPoint: "Sapitwa", elevation: "3,002 m", status: "not_visited" },
  { country: "Mozambique", continent: "Africa", highPoint: "Monte Binga", elevation: "2,436 m", status: "not_visited" },
  { country: "Zimbabwe", continent: "Africa", highPoint: "Mount Nyangani", elevation: "2,593 m", status: "not_visited" },
  { country: "Zambia", continent: "Africa", highPoint: "Mafinga Central", elevation: "2,339 m", status: "not_visited" },
  { country: "Madagascar", continent: "Africa", highPoint: "Maromokotro", elevation: "2,876 m", status: "not_visited" },
  { country: "Angola", continent: "Africa", highPoint: "Morro de Môco", elevation: "2,622 m", status: "not_visited" },
  { country: "Namibia", continent: "Africa", highPoint: "Brandberg (Königstein)", elevation: "2,573 m", status: "not_visited" },
  { country: "Botswana", continent: "Africa", highPoint: "Otse Hill", elevation: "1,491 m", status: "not_visited" },
  { country: "Nigeria", continent: "Africa", highPoint: "Chappal Waddi", elevation: "2,419 m", status: "not_visited" },
  { country: "Ghana", continent: "Africa", highPoint: "Mount Afadjato", elevation: "885 m", status: "not_visited" },
  { country: "Côte d'Ivoire", continent: "Africa", highPoint: "Mount Nimba", elevation: "1,752 m", status: "not_visited" },
  { country: "Guinea", continent: "Africa", highPoint: "Mount Nimba", elevation: "1,744 m", altNames: ["Mont Richard-Molard"], status: "not_visited" },
  { country: "Senegal", continent: "Africa", highPoint: "Unnamed peak near Nepen Diakha", elevation: "648 m", status: "not_visited" },
  { country: "Mali", continent: "Africa", highPoint: "Hombori Tondo", elevation: "1,155 m", status: "not_visited" },
  { country: "Burkina Faso", continent: "Africa", highPoint: "Ténakourou", elevation: "747 m", status: "not_visited" },
  { country: "Niger", continent: "Africa", highPoint: "Mont Idoukal-n-Taghès", elevation: "2,002 m", status: "not_visited" },
  { country: "Chad", continent: "Africa", highPoint: "Emi Koussi", elevation: "3,445 m", status: "not_visited" },
  { country: "Sudan", continent: "Africa", highPoint: "Deriba Caldera", elevation: "3,042 m", status: "not_visited" },
  { country: "South Sudan", continent: "Africa", highPoint: "Kinyeti", elevation: "3,182 m", status: "not_visited" },
  { country: "Libya", continent: "Africa", highPoint: "Bikku Bitti", elevation: "2,350 m", altNames: ["Pic Bette"], status: "not_visited" },
  { country: "Tunisia", continent: "Africa", highPoint: "Jebel ech Chambi", elevation: "1,544 m", status: "not_visited" },
  { country: "Egypt", continent: "Africa", highPoint: "Mount Catherine", elevation: "2,653 m", altNames: ["Gebel Katherîna"], status: "not_visited" },
  { country: "Eritrea", continent: "Africa", highPoint: "Emba Soira", elevation: "3,018 m", status: "not_visited" },
  { country: "Djibouti", continent: "Africa", highPoint: "Moussa Ali", elevation: "2,021 m", status: "not_visited" },
  { country: "Somalia", continent: "Africa", highPoint: "Shimbiris", elevation: "2,438 m", status: "not_visited" },
  { country: "Comoros", continent: "Africa", highPoint: "Karthala", elevation: "2,361 m", status: "not_visited" },
  { country: "Mauritius", continent: "Africa", highPoint: "Piton de la Petite Rivière Noire", elevation: "828 m", status: "not_visited" },
  { country: "Seychelles", continent: "Africa", highPoint: "Morne Seychellois", elevation: "905 m", status: "not_visited" },
  { country: "Burundi", continent: "Africa", highPoint: "Mount Heha", elevation: "2,670 m", status: "not_visited" },
  { country: "Republic of the Congo", continent: "Africa", highPoint: "Mont Nabemba", elevation: "1,020 m", status: "not_visited" },
  { country: "Central African Republic", continent: "Africa", highPoint: "Mont Ngaoui", elevation: "1,410 m", status: "not_visited" },
  { country: "Equatorial Guinea", continent: "Africa", highPoint: "Pico Basilé", elevation: "3,008 m", status: "not_visited" },
  { country: "Gabon", continent: "Africa", highPoint: "Mont Iboundji", elevation: "1,575 m", status: "not_visited" },
  { country: "São Tomé and Príncipe", continent: "Africa", highPoint: "Pico de São Tomé", elevation: "2,024 m", status: "not_visited" },
  { country: "Benin", continent: "Africa", highPoint: "Mont Sokbaro", elevation: "658 m", status: "not_visited" },
  { country: "Togo", continent: "Africa", highPoint: "Mont Atilakoutse", elevation: "991 m", altNames: ["Mount Atilakoutse"], status: "not_visited" },
  { country: "Sierra Leone", continent: "Africa", highPoint: "Loma Mansa", elevation: "1,942 m", status: "not_visited" },
  { country: "Liberia", continent: "Africa", highPoint: "Mount Wuteve", elevation: "1,448 m", status: "not_visited" },
  { country: "Guinea-Bissau", continent: "Africa", highPoint: "Dongol Ronde", elevation: "266 m", altNames: ["Mt Ronde"], status: "not_visited" },
  { country: "Gambia", continent: "Africa", highPoint: "Sare Firasu Hill", elevation: "51 m", status: "not_visited" },
  { country: "Mauritania", continent: "Africa", highPoint: "Kediet ej Jill", elevation: "915 m", altNames: ["Kdeyyat ej Joul"], status: "not_visited" },

  // ═══════════════════════════════════════
  // SOUTH AMERICA
  // ═══════════════════════════════════════
  { country: "Argentina", continent: "South America", highPoint: "Aconcagua", elevation: "6,962 m", status: "not_visited" },
  { country: "Chile", continent: "South America", highPoint: "Ojos del Salado", elevation: "6,893 m", status: "not_visited" },
  { country: "Peru", continent: "South America", highPoint: "Huascarán", elevation: "6,755 m", status: "not_visited" },
  { country: "Bolivia", continent: "South America", highPoint: "Nevado Sajama", elevation: "6,542 m", status: "not_visited" },
  { country: "Ecuador", continent: "South America", highPoint: "Chimborazo", elevation: "6,267 m", status: "not_visited" },
  { country: "Colombia", continent: "South America", highPoint: "Pico Simón Bolívar", elevation: "5,720 m", altNames: ["Pico Bolívar"], status: "not_visited" },
  { country: "Venezuela", continent: "South America", highPoint: "Pico Bolívar", elevation: "4,981 m", status: "not_visited" },
  { country: "Brazil", continent: "South America", highPoint: "Pico da Neblina", elevation: "2,996 m", status: "not_visited" },
  { country: "Guyana", continent: "South America", highPoint: "Mount Roraima", elevation: "2,806 m", status: "not_visited" },
  { country: "Suriname", continent: "South America", highPoint: "Juliana Top", elevation: "1,256 m", status: "not_visited" },
  { country: "Paraguay", continent: "South America", highPoint: "Cerro Peró", elevation: "842 m", altNames: ["Cerro Tres Kandú"], status: "not_visited" },
  { country: "Uruguay", continent: "South America", highPoint: "Cerro Catedral", elevation: "514 m", status: "not_visited" },

  // ═══════════════════════════════════════
  // NORTH & CENTRAL AMERICA + CARIBBEAN
  // ═══════════════════════════════════════
  { country: "USA", continent: "North America", highPoint: "Denali", elevation: "6,190 m", status: "visited" },
  { country: "Canada", continent: "North America", highPoint: "Mount Logan", elevation: "5,959 m", status: "not_visited" },
  { country: "Mexico", continent: "North America", highPoint: "Pico de Orizaba", elevation: "5,636 m", status: "not_visited" },
  { country: "Guatemala", continent: "North America", highPoint: "Volcán Tajumulco", elevation: "4,220 m", status: "not_visited" },
  { country: "Costa Rica", continent: "North America", highPoint: "Cerro Chirripó", elevation: "3,819 m", status: "not_visited" },
  { country: "Panama", continent: "North America", highPoint: "Volcán Barú", elevation: "3,474 m", status: "not_visited" },
  { country: "Honduras", continent: "North America", highPoint: "Cerro Las Minas", elevation: "2,870 m", status: "not_visited" },
  { country: "El Salvador", continent: "North America", highPoint: "Cerro El Pital", elevation: "2,730 m", status: "not_visited" },
  { country: "Nicaragua", continent: "North America", highPoint: "Mogotón", elevation: "2,106 m", status: "not_visited" },
  { country: "Dominica", continent: "North America", highPoint: "Morne Diablatins", elevation: "1,435 m", altNames: ["Morne Diablotins"], status: "not_visited" },
  { country: "Jamaica", continent: "North America", highPoint: "Blue Mountain Peak", elevation: "2,254 m", status: "not_visited" },
  { country: "Cuba", continent: "North America", highPoint: "Pico Turquino", elevation: "1,974 m", status: "not_visited" },
  { country: "Haiti", continent: "North America", highPoint: "Pic la Selle", elevation: "2,674 m", status: "not_visited" },
  { country: "Dominican Republic", continent: "North America", highPoint: "Pico Duarte", elevation: "3,101 m", status: "not_visited" },
  { country: "Trinidad and Tobago", continent: "North America", highPoint: "El Cerro del Aripo", elevation: "941 m", status: "not_visited" },
  { country: "Saint Kitts and Nevis", continent: "North America", highPoint: "Mount Liamuiga", elevation: "1,156 m", status: "not_visited" },
  { country: "Saint Lucia", continent: "North America", highPoint: "Mount Gimie", elevation: "952 m", status: "not_visited" },
  { country: "Saint Vincent and the Grenadines", continent: "North America", highPoint: "La Soufrière", elevation: "1,233 m", status: "not_visited" },
  { country: "Grenada", continent: "North America", highPoint: "Mount Saint Catherine", elevation: "840 m", status: "not_visited" },
  { country: "Barbados", continent: "North America", highPoint: "Mount Hillaby", elevation: "340 m", status: "not_visited" },
  { country: "Antigua and Barbuda", continent: "North America", highPoint: "Boggy Peak", elevation: "402 m", altNames: ["Mount Obama"], status: "not_visited" },
  { country: "Bahamas", continent: "North America", highPoint: "Mount Alvernia", elevation: "63 m", status: "not_visited" },
  { country: "Belize", continent: "North America", highPoint: "Doyle's Delight", elevation: "1,174 m", status: "not_visited" },

  // ═══════════════════════════════════════
  // OCEANIA
  // ═══════════════════════════════════════
  { country: "Australia", continent: "Oceania", highPoint: "Mount Kosciuszko", elevation: "2,228 m", status: "not_visited" },
  { country: "New Zealand", continent: "Oceania", highPoint: "Aoraki / Mount Cook", elevation: "3,718 m", status: "not_visited" },
  { country: "Papua New Guinea", continent: "Oceania", highPoint: "Mount Wilhelm", elevation: "4,509 m", status: "not_visited" },
  { country: "Fiji", continent: "Oceania", highPoint: "Tomanivi", elevation: "1,324 m", status: "not_visited" },
  { country: "Solomon Islands", continent: "Oceania", highPoint: "Mount Popomanaseu", elevation: "2,335 m", status: "not_visited" },
  { country: "Vanuatu", continent: "Oceania", highPoint: "Tabwemasana", elevation: "1,879 m", status: "not_visited" },
  { country: "Samoa", continent: "Oceania", highPoint: "Mount Silisili", elevation: "1,858 m", status: "not_visited" },
  { country: "Tonga", continent: "Oceania", highPoint: "Unnamed on Kao Island", elevation: "1,109 m", status: "not_visited" },
  { country: "Kiribati", continent: "Oceania", highPoint: "Unnamed on Banaba", elevation: "81 m", status: "not_visited" },
  { country: "Micronesia", continent: "Oceania", highPoint: "Nanlaud", elevation: "782 m", status: "not_visited" },
  { country: "Palau", continent: "Oceania", highPoint: "Mount Ngerchelchuus", elevation: "242 m", status: "not_visited" },
  { country: "Marshall Islands", continent: "Oceania", highPoint: "Unnamed on Likiep", elevation: "10 m", status: "not_visited" },
  { country: "Nauru", continent: "Oceania", highPoint: "Command Ridge", elevation: "65 m", status: "not_visited" },
  { country: "Tuvalu", continent: "Oceania", highPoint: "Unnamed on Niulakita", elevation: "5 m", status: "not_visited" },

  // ═══════════════════════════════════════
  // ANTARCTICA
  // ═══════════════════════════════════════
  { country: "Antarctica", continent: "Antarctica", highPoint: "Vinson Massif", elevation: "4,892 m", status: "not_visited", unMember: false, note: "Not owned by any country — Antarctica is governed by the Antarctic Treaty and no nation holds sovereignty over it. It's counted here because the mission covers every piece of land on Earth, and every piece of land belongs to a country." },
];

export const TOTAL_TARGET = 195; // 193 UN + Taiwan + Antarctica
export const getClimbed = () => countries.filter(c => c.status === "climbed" && c.unMember !== false);
export const getMainlandClimbed = () => countries.filter(c => c.status === "mainland_climbed");
export const getLegalHighPoint = () => countries.filter(c => c.status === "legal_high_point");
export const getVisited = () => countries.filter(c => c.status === "visited");
export const getNotVisited = () => countries.filter(c => c.status === "not_visited");
