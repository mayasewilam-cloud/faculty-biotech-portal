// Public Faculty Directory for Login Pre-Fill and Quick Search
export interface PublicStaffMember {
  id: number;
  email: string;
  full_name: string;
  ar_name?: string;
  title: string;
  rank: string;
  rank_ar?: string;
  role: string;
  department: string;
  category: "leadership" | "professors" | "doctors" | "la" | "ta" | "ra_n112" | "prototyping_ra" | "administration";
}

export const ALL_FACULTY_STAFF: PublicStaffMember[] = [
  {
    "id": 99,
    "email": "admin@faculty.edu",
    "full_name": "System Administrator",
    "title": "Eng.",
    "rank": "Eng.",
    "role": "admin",
    "department": "Central University Governance",
    "category": "leadership"
  },
  {
    "id": 6496,
    "email": "gsafwat@msa.edu.eg",
    "full_name": "Prof. Dr. Gehan Safwat",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "dean",
    "department": "Faculty Administration",
    "category": "leadership"
  },
  {
    "id": 1002,
    "email": "aageez@msa.edu.eg",
    "full_name": "Prof. Dr. Amr Ageez",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Medical Biotechnology",
    "category": "professors"
  },
  {
    "id": 1003,
    "email": "ali.diab@msa.edu.eg",
    "full_name": "Prof. Dr. Ali Diab",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Agricultural Biotechnology",
    "category": "professors"
  },
  {
    "id": 1004,
    "email": "abakkar@msa.edu.eg",
    "full_name": "Prof. Dr. Ashraf Bakkar",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Industrial Biotechnology",
    "category": "professors"
  },
  {
    "id": 1005,
    "email": "aaref@msa.edu.eg",
    "full_name": "Prof. Dr. Ahmed Aref",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Environmental Biotechnology",
    "category": "professors"
  },
  {
    "id": 1006,
    "email": "naibrahim@msa.edu.eg",
    "full_name": "Prof. Dr. Nabil Ibrahim",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Medical Biotechnology",
    "category": "professors"
  },
  {
    "id": 1007,
    "email": "khaled.sharaf@msa.edu.eg",
    "full_name": "Prof. Dr. Khaled Sharaf",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Pharmaceutical Biotechnology",
    "category": "professors"
  },
  {
    "id": 1008,
    "email": "hamsalem@msa.edu.eg",
    "full_name": "Prof. Dr. Haidan Mostafa",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Bioinformatics & Genomics",
    "category": "professors"
  },
  {
    "id": 1009,
    "email": "ylatif@msa.edu.eg",
    "full_name": "Prof. Dr. Yasmin Abdel Latif",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Molecular Genetics",
    "category": "professors"
  },
  {
    "id": 1010,
    "email": "rania.amer@msa.edu.eg",
    "full_name": "Prof. Dr. Rania Amer",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Agricultural Biotechnology",
    "category": "professors"
  },
  {
    "id": 1011,
    "email": "mhamouda@msa.edu.eg",
    "full_name": "Dr. Sami Hamouda",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Medical Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1012,
    "email": "hotaha@msa.edu.eg",
    "full_name": "Dr. Hossam Taha",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Industrial Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1013,
    "email": "ahmrefaat@msa.edu.eg",
    "full_name": "Dr. Ahmed Refaat",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Environmental Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1014,
    "email": "amrady@msa.edu.eg",
    "full_name": "Dr. Amgad Rady",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Pharmaceutical Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1015,
    "email": "melbakry@msa.edu.eg",
    "full_name": "Dr. Mostafa Bakry",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Medical Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1016,
    "email": "ssmohamed@msa.edu.eg",
    "full_name": "Dr. Samer Ismail",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Molecular Genetics",
    "category": "doctors"
  },
  {
    "id": 1017,
    "email": "imaher@msa.edu.eg",
    "full_name": "Dr. Ingy Elhefny",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Bioinformatics & Genomics",
    "category": "doctors"
  },
  {
    "id": 1018,
    "email": "aigomaa@msa.edu.eg",
    "full_name": "Dr. Ahmed Gomaa",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Agricultural Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1019,
    "email": "fsayed@msa.edu.eg",
    "full_name": "Dr. Fayrouz Sayed",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Medical Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1020,
    "email": "kamnasreldein@msa.edu.eg",
    "full_name": "Dr. Karima Nasr El Dein",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Industrial Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1021,
    "email": "mshodhod@msa.edu.eg",
    "full_name": "Dr. Mohamed Hodhod",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Environmental Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1022,
    "email": "samhisham@msa.edu.eg",
    "full_name": "Dr. Sameh Khalaf",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Pharmaceutical Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1023,
    "email": "raazab@msa.edu.eg",
    "full_name": "Dr. Rania Momtaz",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Bioinformatics & Genomics",
    "category": "doctors"
  },
  {
    "id": 1024,
    "email": "abnasr@msa.edu.eg",
    "full_name": "Dr. Abdel Aziz Nasr",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Molecular Genetics",
    "category": "doctors"
  },
  {
    "id": 1025,
    "email": "mshafei@msa.edu.eg",
    "full_name": "Dr. Mai Ahmed",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Agricultural Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1026,
    "email": "ymuhammed@msa.edu.eg",
    "full_name": "Dr. Yara Ahmed",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Medical Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1027,
    "email": "zsaleh@msa.edu.eg",
    "full_name": "Dr. Zahra Saleh",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Industrial Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1028,
    "email": "shabib@msa.edu.eg",
    "full_name": "Dr. Shaza Ahmed",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Environmental Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1029,
    "email": "mmsuleyman@msa.edu.eg",
    "full_name": "Dr. Mahmoud M. Soliman",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Pharmaceutical Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1030,
    "email": "ehahmed@msa.edu.eg",
    "full_name": "Dr. Ehab Ahmed",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Bioinformatics & Genomics",
    "category": "doctors"
  },
  {
    "id": 1031,
    "email": "melrefaie@msa.edu.eg",
    "full_name": "Dr. Marwa Kenawy",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Molecular Genetics",
    "category": "doctors"
  },
  {
    "id": 1032,
    "email": "nyasser@msa.edu.eg",
    "full_name": "Dr. Nourhan Yasser",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Agricultural Biotechnology",
    "category": "doctors"
  },
  {
    "id": 1033,
    "email": "gtibrahim@msa.edu.eg",
    "full_name": "Dr. Gehad Tarek",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Medical Biotechnology",
    "category": "doctors"
  },
  {
    "id": 2001,
    "email": "amany.abdelhakim@msa.edu.eg",
    "full_name": "Prof. Dr. Amany Abdel Hakim",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Medical Biotechnology",
    "category": "professors"
  },
  {
    "id": 2002,
    "email": "hisham.eissa@msa.edu.eg",
    "full_name": "Prof. Dr. Hisham Eissa",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Industrial Biotechnology",
    "category": "professors"
  },
  {
    "id": 2003,
    "email": "gamal.shebl@msa.edu.eg",
    "full_name": "Prof. Dr. Gamal Shebl",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Agricultural Biotechnology",
    "category": "professors"
  },
  {
    "id": 2004,
    "email": "yasser.abdelhady@msa.edu.eg",
    "full_name": "Prof. Dr. Yasser Abdelhady",
    "title": "Prof. Dr.",
    "rank": "Prof. Dr.",
    "role": "professor",
    "department": "Environmental Biotechnology",
    "category": "professors"
  },
  {
    "id": 2005,
    "email": "salma.nabhan@msa.edu.eg",
    "full_name": "Dr. Salma Nabhan",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Pharmaceutical Biotechnology",
    "category": "doctors"
  },
  {
    "id": 2006,
    "email": "ahmed.noureldin@msa.edu.eg",
    "full_name": "Dr. Ahmed Nour El Din",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Molecular Genetics",
    "category": "doctors"
  },
  {
    "id": 2007,
    "email": "mohamed.ghoneim@msa.edu.eg",
    "full_name": "Dr. Mohamed Ghoneim",
    "title": "Dr.",
    "rank": "Dr.",
    "role": "dr",
    "department": "Bioinformatics & Genomics",
    "category": "doctors"
  },
  {
    "id": 3001,
    "email": "hallam@msa.edu.eg",
    "full_name": "LA. Hoda Allam",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3002,
    "email": "fashry@msa.edu.eg",
    "full_name": "LA. Fouad Ashry",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3003,
    "email": "marameldemardash10@gmail.com",
    "full_name": "LA. Maram Ahmed",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3004,
    "email": "shosama@msa.edu.eg",
    "full_name": "LA. Shorouk Mohamed",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3005,
    "email": "makhalaf@msa.edu.eg",
    "full_name": "LA. Mahmoud Soliman",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3006,
    "email": "nasmohamed@msa.edu.eg",
    "full_name": "LA. Nashwa Hamido",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3007,
    "email": "salahmed@msa.edu.eg",
    "full_name": "LA. Salma Effat",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3008,
    "email": "yaboulkheir@msa.edu.eg",
    "full_name": "LA. Youssef Abo El-Kheir",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3009,
    "email": "samahmoud@msa.edu.eg",
    "full_name": "LA. Salma Omar",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3010,
    "email": "abdsaad@msa.edu.eg",
    "full_name": "LA. Abdelrahman Saad",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3011,
    "email": "nhelgazzar@msa.edu.eg",
    "full_name": "LA. Nada El Gazzar",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3012,
    "email": "mmshahat@msa.edu.eg",
    "full_name": "LA. Mohamed Mansour",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3013,
    "email": "nhemida@msa.edu.eg",
    "full_name": "LA. Nouran Yehia",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3014,
    "email": "hhrefaei@msa.edu.eg",
    "full_name": "LA. Hadeer Refaee",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3015,
    "email": "rawmagdy@msa.edu.eg",
    "full_name": "LA. Rawan Ali",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3016,
    "email": "nsbary@msa.edu.eg",
    "full_name": "LA. Norhan Sabry",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3017,
    "email": "mmzhassan@msa.edu.eg",
    "full_name": "LA. Mariam Zaki",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3018,
    "email": "mazaki@msa.edu.eg",
    "full_name": "LA. Malak Haseeb",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 3019,
    "email": "ngebriel@msa.edu.eg",
    "full_name": "LA. Nada Gebril",
    "title": "LA.",
    "rank": "LA.",
    "role": "la",
    "department": "Academic Staff",
    "category": "la"
  },
  {
    "id": 4020,
    "email": "sbadwai@msa.edu.eg",
    "full_name": "TA. Sara Badawi",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4021,
    "email": "hfady@msa.edu.eg",
    "full_name": "TA. Hesham Fady",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4022,
    "email": "maabdelrazek@msa.edu.eg",
    "full_name": "TA. Maya Abdelrazek",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4023,
    "email": "nouahmed@msa.edu.eg",
    "full_name": "TA. Nour Ahmed",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4024,
    "email": "nshsalaheldien@msa.edu.eg",
    "full_name": "TA. Nada Sherif",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4025,
    "email": "awalid@msa.edu.eg",
    "full_name": "TA. Amr Walid",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4026,
    "email": "ayaelgohary@msa.edu.eg",
    "full_name": "TA. Aya El Gohary",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4027,
    "email": "yomaged@msa.edu.eg",
    "full_name": "TA. Youssef Maged",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4028,
    "email": "mhany@msa.edu.eg",
    "full_name": "TA. Maya Hany",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4029,
    "email": "mefahim@msa.edu.eg",
    "full_name": "TA. Mohamed Fahim",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4030,
    "email": "amtalaat@msa.edu.eg",
    "full_name": "TA. Aya Talaat",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4031,
    "email": "ohefny@msa.edu.eg",
    "full_name": "TA. Omnia Hefny",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4032,
    "email": "sandy.wael@msa.edu.eg",
    "full_name": "TA. Sandy Wael",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4033,
    "email": "hkmoussa@msa.edu.eg",
    "full_name": "TA. Habiba Khaled",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4034,
    "email": "zsamir@msa.edu.eg",
    "full_name": "TA. Zohor Samir",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4035,
    "email": "sabdelsalam@msa.edu.eg",
    "full_name": "TA. Shahd El Tarabily",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4036,
    "email": "norhan.el.tayeb@msa.edu.eg",
    "full_name": "TA. Norhan El Tayeb",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4037,
    "email": "nelhefnawy@msa.edu.eg",
    "full_name": "TA. Norhan El Hifnawy",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4038,
    "email": "fehab@msa.edu.eg",
    "full_name": "TA. Faten Ehab",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4039,
    "email": "hmmhamed@msa.edu.eg",
    "full_name": "TA. Hagar Magdy",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4040,
    "email": "saayman@msa.edu.eg",
    "full_name": "TA. Sara Ayman",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4041,
    "email": "shahd.el.haggan@msa.edu.eg",
    "full_name": "TA. Shahd El Haggan",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4042,
    "email": "hmoataz@msa.edu.eg",
    "full_name": "TA. Hala Moataz",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4043,
    "email": "cwael@msa.edu.eg",
    "full_name": "TA. Chahd Wael",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4044,
    "email": "komar@msa.edu.eg",
    "full_name": "TA. Kenoz Omar",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4045,
    "email": "karma.ashour@msa.edu.eg",
    "full_name": "TA. Karma Ashour",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4046,
    "email": "rasalah@msa.edu.eg",
    "full_name": "TA. Rawan Salah",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 4047,
    "email": "atamer@msa.edu.eg",
    "full_name": "TA. Ahmed Tamer",
    "title": "TA.",
    "rank": "TA.",
    "role": "ta",
    "department": "Academic Staff",
    "category": "ta"
  },
  {
    "id": 5001,
    "email": "asmaa.abdelhameed@msa.edu.eg",
    "full_name": "Ms. Asmaa Abdelhameed",
    "title": "Ms.",
    "rank": "Ms.",
    "role": "staff",
    "department": "Academic Administration",
    "category": "administration"
  },
  {
    "id": 5002,
    "email": "heba.kamal@msa.edu.eg",
    "full_name": "Ms. Heba Kamal",
    "title": "Ms.",
    "rank": "Ms.",
    "role": "staff",
    "department": "Academic Administration",
    "category": "administration"
  },
  {
    "id": 5003,
    "email": "nashwa.mahmoud@msa.edu.eg",
    "full_name": "Ms. Nashwa Mahmoud",
    "title": "Ms.",
    "rank": "Ms.",
    "role": "staff",
    "department": "Academic Administration",
    "category": "administration"
  },
  {
    "id": 5004,
    "email": "menna.gamal@msa.edu.eg",
    "full_name": "Ms. Menna Gamal",
    "title": "Ms.",
    "rank": "Ms.",
    "role": "staff",
    "department": "Academic Administration",
    "category": "administration"
  },
  {
    "id": 6001,
    "email": "mostafa.hesham@msa.edu.eg",
    "full_name": "RA. Mostafa Hesham",
    "title": "RA.",
    "rank": "RA.",
    "role": "staff",
    "department": "Research & Laboratories",
    "category": "ra_n112"
  },
  {
    "id": 6002,
    "email": "silvia.nashaat@msa.edu.eg",
    "full_name": "RA. Silvia Nashaat",
    "title": "RA.",
    "rank": "RA.",
    "role": "staff",
    "department": "Research & Laboratories",
    "category": "ra_n112"
  },
  {
    "id": 6003,
    "email": "rojana.ashraf@msa.edu.eg",
    "full_name": "RA. Rojana Ashraf",
    "title": "RA.",
    "rank": "RA.",
    "role": "staff",
    "department": "Research & Laboratories",
    "category": "ra_n112"
  },
  {
    "id": 6004,
    "email": "salma.hossam@msa.edu.eg",
    "full_name": "RA. Salma Hossam",
    "title": "RA.",
    "rank": "RA.",
    "role": "staff",
    "department": "Research & Laboratories",
    "category": "ra_n112"
  },
  {
    "id": 6005,
    "email": "moaz.mandour@msa.edu.eg",
    "full_name": "RA. Moaz Mandour",
    "title": "RA.",
    "rank": "RA.",
    "role": "staff",
    "department": "Research & Laboratories",
    "category": "ra_n112"
  },
  {
    "id": 6006,
    "email": "karma.osama@msa.edu.eg",
    "full_name": "RA. Karma Osama",
    "title": "RA.",
    "rank": "RA.",
    "role": "staff",
    "department": "Research & Laboratories",
    "category": "ra_n112"
  },
  {
    "id": 6007,
    "email": "radwa.kamal@msa.edu.eg",
    "full_name": "RA. Radwa Kamal",
    "title": "RA.",
    "rank": "RA.",
    "role": "staff",
    "department": "Research & Laboratories",
    "category": "ra_n112"
  },
  {
    "id": 6008,
    "email": "rahma.hussain@msa.edu.eg",
    "full_name": "RA. Rahma Hussain",
    "title": "RA.",
    "rank": "RA.",
    "role": "staff",
    "department": "Research & Laboratories",
    "category": "ra_n112"
  }
];
