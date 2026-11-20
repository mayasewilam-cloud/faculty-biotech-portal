/**
 * Single source of truth for faculty staff name matching, aliases, and transliteration resolution.
 * Supports Egyptian Arabic-to-English transliterations and academic honorific titles.
 */

export const QUADRUPLET_ALIASES: Record<string, string> = {
  // Leadership & Administration
  "gehan safwat": "Prof. Dr. Gehan Safwat",
  "prof gehan safwat": "Prof. Dr. Gehan Safwat",
  "prof. gehan safwat": "Prof. Dr. Gehan Safwat",
  "dean": "Prof. Dr. Gehan Safwat",
  "faculty directorate": "Prof. Dr. Gehan Safwat",
  "yasmin abdel latif": "Prof. Dr. Yasmin Abdel Latif",
  "yasmin abdelatif": "Prof. Dr. Yasmin Abdel Latif",
  "yasmine abdellatif": "Prof. Dr. Yasmin Abdel Latif",
  "yassmin abdellatif": "Prof. Dr. Yasmin Abdel Latif",
  "prof. yasmine abdel atef": "Prof. Dr. Yasmin Abdel Latif",
  "yasmine abdel atef": "Prof. Dr. Yasmin Abdel Latif",
  "prof. yassmin abdellatif": "Prof. Dr. Yasmin Abdel Latif",
  "yasmin abdel latif mahmoud": "Prof. Dr. Yasmin Abdel Latif",
  "amr ageez": "Prof. Dr. Amr Ageez",
  "dr. amr ageez": "Prof. Dr. Amr Ageez",
  "amr mohamed ageez": "Prof. Dr. Amr Ageez",
  "prof. dr. amr ageez": "Prof. Dr. Amr Ageez",
  "haidan mostafa": "Prof. Dr. Haidan Mostafa",
  "haydan hady": "Prof. Dr. Haidan Mostafa",
  "karima nasr el dein": "Dr. Karima Nasr El Dein",
  "karima nasr el din": "Dr. Karima Nasr El Dein",
  "dr karema nasr": "Dr. Karima Nasr El Dein",
  "karema nasr": "Dr. Karima Nasr El Dein",
  "abdel aziz nasr": "Dr. Abdel Aziz Nasr",
  "abdelaziz nasr": "Dr. Abdel Aziz Nasr",
  "abdel aziz mohamed nasr": "Dr. Abdel Aziz Nasr",
  "mostafa bakry": "Dr. Mostafa Bakry",
  "mostafa el-bakry": "Dr. Mostafa Bakry",
  "mustafa mahmoud mohamed elbakry": "Dr. Mostafa Bakry",
  "samer ismail": "Dr. Samer Ismail",
  "samer el sayed": "Dr. Samer Ismail",
  "fayrouz sayed": "Dr. Fayrouz Sayed",
  "fayrouz el sayed": "Dr. Fayrouz Sayed",
  "mahmoud m. soliman": "Dr. Mahmoud M. Soliman",
  "mahmoud soliman dr": "Dr. Mahmoud M. Soliman",
  "zahra saleh": "Dr. Zahra Saleh",
  "dr. zahra saleh": "Dr. Zahra Saleh",
  "dr. zahra hussein": "Dr. Zahra Saleh",
  "dr. zahra hussien": "Dr. Zahra Saleh",
  "zahra hussein": "Dr. Zahra Saleh",
  "zahra hussien": "Dr. Zahra Saleh",
  "norhan yasser": "Dr. Nourhan Yasser",
  "nourhan yasser": "Dr. Nourhan Yasser",
  "fouad ashry": "LA. Fouad Ashry",
  "foad ashry": "LA. Fouad Ashry",
  "foaud ashry": "LA. Fouad Ashry",
  "shorouk mohamed": "LA. Shorouk Mohamed",
  "shorok mohamed": "LA. Shorouk Mohamed",
  "shourok mohamed": "LA. Shorouk Mohamed",
  "nashwa hamido": "LA. Nashwa Hamido",
  "salma effat": "LA. Salma Effat",
  "salma ahmed effat mohamed": "LA. Salma Effat",
  "youssef abo el-kheir": "LA. Youssef Abo El-Kheir",
  "youssef abo-el-kheir": "LA. Youssef Abo El-Kheir",
  "youssef aboulkier": "LA. Youssef Abo El-Kheir",
  "youssef ali salah-eldeen aboulkheir": "LA. Youssef Abo El-Kheir",
  "youssef abo elkhair": "LA. Youssef Abo El-Kheir",
  "la. youssef abo elkhair": "LA. Youssef Abo El-Kheir",
  "abdelrahman saad": "LA. Abdelrahman Saad",
  "abdelrahman saad kamel mohamed": "LA. Abdelrahman Saad",
  "nada el gazzar": "LA. Nada El Gazzar",
  "nada elgazzar": "LA. Nada El Gazzar",
  "nada elgazzr": "LA. Nada El Gazzar",
  "la. nada elgazzr": "LA. Nada El Gazzar",
  "nada hassan elgazzar": "LA. Nada El Gazzar",
  "nada gebril": "LA. Nada Gebril",
  "nada gebriel": "LA. Nada Gebril",
  "la. nada gebriel": "LA. Nada Gebril",
  "mohamed mansour": "LA. Mohamed Mansour",
  "mohmed mansour": "LA. Mohamed Mansour",
  "nouran yehia": "LA. Nouran Yehia",
  "noran yehia": "LA. Nouran Yehia",
  "nouran yehiea": "LA. Nouran Yehia",
  "la. nouran yehiea": "LA. Nouran Yehia",
  "nouran yehia hamed hemida": "LA. Nouran Yehia",
  "rawan ali": "LA. Rawan Ali",
  "rawan aly": "LA. Rawan Ali",
  "rawan salah bahaaeldein sayed": "LA. Rawan Ali",
  "norhan sabry": "LA. Norhan Sabry",
  "nourhan sabry": "LA. Norhan Sabry",
  "norhan maher": "LA. Norhan Sabry",
  "nourhan maher": "LA. Norhan Sabry",
  "ta. norhan maher": "LA. Norhan Sabry",
  "ta. nourhan maher": "LA. Norhan Sabry",
  "maram ahmed": "LA. Maram Ahmed",
  "maram adel": "LA. Maram Ahmed",
  "la. maram adel": "LA. Maram Ahmed",

  // Graduation Map & Assisting Staff (TAs & LAs)
  "hader refaee": "LA. Hadeer Refaee",
  "la. hader refaee": "LA. Hadeer Refaee",
  "hadeer refaee": "LA. Hadeer Refaee",
  "la. hadeer refaee": "LA. Hadeer Refaee",
  "maya abdelrazek": "TA. Maya Abdelrazek",
  "maya abdelrazik": "TA. Maya Abdelrazek",
  "maya abdelraziek": "TA. Maya Abdelrazek",
  "ta. maya abdelrazik": "TA. Maya Abdelrazek",
  "ta. maya abdelrazek": "TA. Maya Abdelrazek",
  "maya abderazk": "TA. Maya Abdelrazek",
  "t.a maya abdelrazek": "TA. Maya Abdelrazek",
  "maya hany": "TA. Maya Hany",
  "maya hany mohamed abd elfattah": "TA. Maya Hany",
  "maya sweilam": "TA. Maya Hany",
  "norhan el tayeb": "TA. Norhan El Tayeb",
  "nourhan el tayeb": "TA. Norhan El Tayeb",
  "norhan el hifnawy": "TA. Norhan El Hifnawy",
  "norhan hifnawy": "TA. Norhan El Hifnawy",
  "nourhan hifnawy": "TA. Norhan El Hifnawy",
  "ta. norhan hifnawy": "TA. Norhan El Hifnawy",
  "ta. norhan el hifnawy": "TA. Norhan El Hifnawy",
  "nourhan el-hifnawy": "TA. Norhan El Hifnawy",
  "nourahn hifnawy": "TA. Norhan El Hifnawy",
  "shahd el haggan": "TA. Shahd El Haggan",
  "shahd elhaggan": "TA. Shahd El Haggan",
  "shahd el tarabily": "TA. Shahd El Tarabily",
  "shahd tarabily": "TA. Shahd El Tarabily",
  "ta. shahd tarabily": "TA. Shahd El Tarabily",
  "hala moataz": "TA. Hala Moataz",
  "hala motaz": "TA. Hala Moataz",
  "ta. hala motaz": "TA. Hala Moataz",
  "ta. hala moataz": "TA. Hala Moataz",
  "hala moataz abdelhameed hassan": "TA. Hala Moataz",
  "chahd wael": "TA. Chahd Wael",
  "chahd wael hassan fahmy": "TA. Chahd Wael",
  "shahd fahmy": "TA. Chahd Wael",
  "ahmed tamer": "TA. Ahmed Tamer",
  "ahmed tamer mohamed abd elwa": "TA. Ahmed Tamer",
  "ahmed mohamed refaat elsayed": "TA. Ahmed Tamer",
  "habiba khaled": "TA. Habiba Khaled",
  "habiba moussa": "TA. Habiba Khaled",
  "habiba abdelrazik": "TA. Habiba Khaled",
  "habeba abdelrazik": "TA. Habiba Khaled",
  "habeba abdulrazik": "TA. Habiba Khaled",
  "ta. habiba abdelrazik": "TA. Habiba Khaled",
  "ta. habeba abdelrazik": "TA. Habiba Khaled",
  "ta. habeba abdulrazik": "TA. Habiba Khaled",
  "habiba khaled abdelrazek abdelaziz moussa": "TA. Habiba Khaled",
  "aya talaat": "TA. Aya Talaat",
  "aya talat": "TA. Aya Talaat",
  "ta. aya talat": "TA. Aya Talaat",
  "omnia hefny": "TA. Omnia Hefny",
  "omnia bassam": "TA. Omnia Hefny",
  "ta. omnia bassam": "TA. Omnia Hefny",
  "sara badawi": "TA. Sara Badawi",
  "sara badawy": "TA. Sara Badawi",
  "ta. sara badawy": "TA. Sara Badawi",
  "sara badwai fathy badawi": "TA. Sara Badawi",
  "shaza ahmed": "Dr. Shaza Ahmed",
  "shaza mohamed": "Dr. Shaza Ahmed",
  "ta. shaza mohamed": "Dr. Shaza Ahmed",
  "asmaa abdelhameed": "Ms. Asmaa Abdelhameed",
  "asmaa abdelhamid": "Ms. Asmaa Abdelhameed",
  "asmaa saleh": "Ms. Asmaa Abdelhameed",
  "asmaa abdel-hamed abdel-hamed saleh": "Ms. Asmaa Abdelhameed",
  "heba kamal": "Ms. Heba Kamal",
  "heba mohamed": "Ms. Heba Kamal",
  "hebatallah kamal abdel fattah": "Ms. Heba Kamal",
  "nashwa mahmoud": "Ms. Nashwa Mahmoud",
  "ms. nashwa mahmoude": "Ms. Nashwa Mahmoud",
  "menna gamal": "Ms. Menna Gamal",
  "menna hussein": "Ms. Menna Gamal",
  "mennat allah gamal mohamed hussein": "Ms. Menna Gamal"
};

/**
 * Phonetic / transliteration normalizer for Egyptian Arabic-to-English faculty names
 */
export function normalizeStaffName(name: string): string {
  if (!name) return '';
  let s = name.toLowerCase().trim();
  // Strip honorific titles
  s = s.replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '');
  // Strip non-alphanumeric except spaces
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  // Normalize whitespace
  s = s.replace(/\s+/g, ' ').trim();

  // Normalize common Arabic particles (el, al, abd, abdel, abo)
  s = s.replace(/\b(el|al)\s+/g, '');
  s = s.replace(/\babd\s+el\s+/g, 'abdel');
  s = s.replace(/\babd\s+/g, 'abdel');
  s = s.replace(/\babdel\s+/g, 'abdel');
  s = s.replace(/\babo\s+el\s*/g, 'aboule');
  s = s.replace(/\babou\s+el\s*/g, 'aboule');

  // Phonetic substitutions:
  const p = s
    .replace(/ee/g, 'e')
    .replace(/ie/g, 'e')
    .replace(/i/g, 'e')
    .replace(/y/g, 'e')
    .replace(/ou/g, 'o')
    .replace(/oa/g, 'o')
    .replace(/u/g, 'o')
    .replace(/ph/g, 'f')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/q/g, 'k')
    .replace(/z/g, 's')
    .replace(/c/g, 'k')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/aa/g, 'a')
    .replace(/h(?=[bcdfghjklmnpqrstvwxz]|$)/g, '') // silent h
    .replace(/(.)\1+/g, '$1'); // collapse duplicate consonants

  return p.replace(/\s+/g, '');
}

/**
 * Match a task assigned member string against a specific user object
 */
export function isNameMatchingStaff(memberString: string, user: { full_name?: string; email?: string } | null | undefined): boolean {
  if (!memberString || !user) return false;
  const mLower = memberString.toLowerCase().trim();
  const uFullName = (user.full_name || '').toLowerCase().trim();
  const uEmail = (user.email || '').toLowerCase().trim();

  if (uEmail && mLower === uEmail) return true;
  if (mLower === uFullName || uFullName.includes(mLower) || mLower.includes(uFullName)) return true;

  // 1. Check explicit aliases
  const mRawClean = mLower.replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9]/g, '');
  const uRawClean = uFullName.replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9]/g, '');

  for (const [k, v] of Object.entries(QUADRUPLET_ALIASES)) {
    const kClean = k.toLowerCase().replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9]/g, '');
    if (kClean === mRawClean) {
      const vClean = v.toLowerCase().replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9]/g, '');
      if (vClean === uRawClean || uRawClean.includes(vClean) || vClean.includes(uRawClean)) return true;
    }
  }

  // 2. Phonetic full match
  const mPhon = normalizeStaffName(memberString);
  const uPhon = normalizeStaffName(user.full_name || '');
  if (mPhon && uPhon && (mPhon === uPhon || mPhon.includes(uPhon) || uPhon.includes(mPhon))) return true;

  // 3. Multi-token match: First name + last name must match
  const mTokens = mLower.replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
  const uTokens = uFullName.replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);

  if (mTokens.length >= 2 && uTokens.length >= 2) {
    const mFirst = normalizeStaffName(mTokens[0]);
    const mLast = normalizeStaffName(mTokens[mTokens.length - 1]);
    const uFirst = normalizeStaffName(uTokens[0]);
    const uLast = normalizeStaffName(uTokens[uTokens.length - 1]);
    if (mFirst === uFirst && (mLast === uLast || mFirst === uLast)) return true;
  }

  return false;
}

/**
 * Resolve any faculty member name or email to their exact User account from a user directory
 */
export function resolveStaffMember(mName: string, users: any[]): any | undefined {
  if (!mName || !Array.isArray(users) || users.length === 0) return undefined;
  const rawClean = mName.toLowerCase().replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9]/g, '');

  // 1. Direct ID or email match
  const byEmail = users.find(u => u.email && u.email.toLowerCase().trim() === mName.toLowerCase().trim());
  if (byEmail) return byEmail;

  // 2. Check explicit QUADRUPLET_ALIASES
  for (const [k, v] of Object.entries(QUADRUPLET_ALIASES)) {
    const kClean = k.toLowerCase().replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9]/g, '');
    if (kClean === rawClean) {
      const targetClean = v.toLowerCase().replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9]/g, '');
      const m = users.find(u => {
        const uClean = (u.full_name || '').toLowerCase().replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9]/g, '');
        return uClean === targetClean || uClean.includes(targetClean) || targetClean.includes(uClean);
      });
      if (m) return m;
    }
  }

  // 3. Raw normalized substring match
  const rawDirect = users.find(u => {
    const uClean = (u.full_name || '').toLowerCase().replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9]/g, '');
    return uClean === rawClean || uClean.includes(rawClean) || rawClean.includes(uClean);
  });
  if (rawDirect) return rawDirect;

  // 4. Phonetic / Transliteration match
  const phonM = normalizeStaffName(mName);
  if (phonM.length >= 4) {
    const phonDirect = users.find(u => {
      const uPhon = normalizeStaffName(u.full_name || '');
      return uPhon === phonM || uPhon.includes(phonM) || phonM.includes(uPhon);
    });
    if (phonDirect) return phonDirect;
  }

  // 5. Token-based phonetic match (First name + last name)
  const mTokens = mName.toLowerCase().replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
  if (mTokens.length >= 2) {
    const firstPhon = normalizeStaffName(mTokens[0]);
    const lastPhon = normalizeStaffName(mTokens[mTokens.length - 1]);
    for (const u of users) {
      const uTokens = (u.full_name || '').toLowerCase().replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t: string) => t.length > 2);
      if (uTokens.length >= 2) {
        const uFirstPhon = normalizeStaffName(uTokens[0]);
        const uLastPhon = normalizeStaffName(uTokens[uTokens.length - 1]);
        if (firstPhon === uFirstPhon && lastPhon === uLastPhon) {
          return u;
        }
      }
    }
  }

  return undefined;
}
