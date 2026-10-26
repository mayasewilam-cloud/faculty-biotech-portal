CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_by_id INTEGER NOT NULL,
  assigned_to_id INTEGER NOT NULL,
  department TEXT NOT NULL,
  hat_id INTEGER,
  committee_id INTEGER,
  committee_name TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  deadline DATETIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completion_notes TEXT,
  completion_url TEXT,
  completed_at DATETIME,
  dean_feedback TEXT,
  dean_acknowledged INTEGER DEFAULT 0,
  attachment_name TEXT,
  attachment_type TEXT,
  attachment_size INTEGER,
  attachment_url TEXT,
  tr INTEGER,
  start_date TEXT,
  due_time TEXT,
  comment_type TEXT,
  received_by TEXT,
  form_link TEXT,
  submission_type TEXT,
  is_confidential INTEGER DEFAULT 0,
  request_prompt TEXT,
  group_id TEXT,
  task_owner_id INTEGER,
  task_owner_name TEXT,
  requires_dean_approval INTEGER DEFAULT 0,
  responsibility_model TEXT DEFAULT 'standard',
  parent_task_id INTEGER,
  drive_link TEXT,
  action_plan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action_type TEXT NOT NULL,
  task_id INTEGER,
  title TEXT NOT NULL,
  details TEXT,
  metadata TEXT,
  ip_address TEXT DEFAULT '127.0.0.1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO users (id, email, password_hash, full_name, title, role, department, phone, avatar) VALUES
(99, 'admin@faculty.edu', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Admin', 'Higher Super Admin', 'admin', 'Central University Governance', '+20 2 3837-1500', 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin'),
(14686, 'menna.hussein@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Ms. Menna Hussein', 'Student Affairs Officer', 'staff', 'Academic Administration', '+20 2 3837-1501', 'https://api.dicebear.com/7.x/initials/svg?seed=Menna+Hussein'),
(13886, 'nashwa.mahmoud@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Ms. Nashwa Mahmoud', 'Administration Assistant', 'staff', 'Academic Administration', '+20 2 3837-1502', 'https://api.dicebear.com/7.x/initials/svg?seed=Nashwa+Mahmoud'),
(12698, 'heba.mohamed@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Ms. Heba Mohamed', 'Administration Assistant', 'staff', 'Academic Administration', '+20 2 3837-1503', 'https://api.dicebear.com/7.x/initials/svg?seed=Heba+Mohamed'),
(9783, 'asmaa.saleh@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Mrs. Asmaa Saleh', 'Office Manager', 'staff', 'Academic Administration', '+20 2 3837-1504', 'https://api.dicebear.com/7.x/initials/svg?seed=Asmaa+Saleh'),
(14191, 'rania.amer@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Prof. Dr. Rania Amer', 'Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1505', 'https://api.dicebear.com/7.x/initials/svg?seed=Rania+Amer'),
(13480, 'khaled.el-din@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Prof. Dr. Khaled El-Din', 'Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1506', 'https://api.dicebear.com/7.x/initials/svg?seed=Khaled+El-Din'),
(13036, 'haydan.hady@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Prof. Dr. Haydan Hady', 'Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1507', 'https://api.dicebear.com/7.x/initials/svg?seed=Haydan+Hady'),
(11488, 'nabil.mohamed@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Prof. Dr. Nabil Mohamed', 'Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1508', 'https://api.dicebear.com/7.x/initials/svg?seed=Nabil+Mohamed'),
(13260, 'yasmine.khalil@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Prof. Dr. Yasmine Khalil', 'Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1509', 'https://api.dicebear.com/7.x/initials/svg?seed=Yasmine+Khalil'),
(12737, 'nour.el-gendy@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Prof. Dr. Nour El-Gendy', 'Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1510', 'https://api.dicebear.com/7.x/initials/svg?seed=Nour+El-Gendy'),
(11183, 'ashraf.bakkar@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Prof. Dr. Ashraf Bakkar', 'Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1511', 'https://api.dicebear.com/7.x/initials/svg?seed=Ashraf+Bakkar'),
(6496, 'gehan.safwat@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Prof. Dr. Gehan Safwat', 'Dean of Faculty', 'admin', 'Faculty Leadership', '+20 2 3837-1512', 'https://api.dicebear.com/7.x/initials/svg?seed=Gehan+El-Husseiny'),
(6591, 'amr.ageez@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Prof. Dr. Amr Ageez', 'Vice Dean for Academic Affairs', 'admin', 'Faculty Leadership', '+20 2 3837-1513', 'https://api.dicebear.com/7.x/initials/svg?seed=Amr+Ageez'),
(7065, 'ahmed.aref@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Prof. Dr. Ahmed Aref', 'Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1514', 'https://api.dicebear.com/7.x/initials/svg?seed=Ahmed+Aref'),
(14237, 'mostafa.el-deeb@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Assoc. Prof. Dr. Mostafa El-Deeb', 'Assoc. Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1515', 'https://api.dicebear.com/7.x/initials/svg?seed=Mostafa+El-Deeb'),
(13537, 'ahmed.aal@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Assoc. Prof. Dr. Ahmed Aal', 'Assoc. Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1516', 'https://api.dicebear.com/7.x/initials/svg?seed=Ahmed+Aal'),
(6417, 'aly.sormany@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Assoc. Prof. Dr. Aly Sormany', 'Assoc. Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1517', 'https://api.dicebear.com/7.x/initials/svg?seed=Aly+Sormany'),
(7106, 'amgad.radwan@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Assoc. Prof. Dr. Amgad Radwan', 'Assoc. Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1518', 'https://api.dicebear.com/7.x/initials/svg?seed=Amgad+Radwan'),
(12400, 'hossam.mahmoud@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Assoc. Prof. Dr. Hossam Mahmoud', 'Assoc. Prof. Dr.', 'professor', 'Academic Staff', '+20 2 3837-1519', 'https://api.dicebear.com/7.x/initials/svg?seed=Hossam+Mahmoud'),
(12228, 'samer.ismail@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Samer Ismail', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1520', 'https://api.dicebear.com/7.x/initials/svg?seed=Samer+Ismail'),
(9580, 'shaza.habib@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Shaza Habib', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1521', 'https://api.dicebear.com/7.x/initials/svg?seed=Shaza+Habib'),
(6835, 'karima.el-din@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Karima El-Din', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1522', 'https://api.dicebear.com/7.x/initials/svg?seed=Karima+El-Din'),
(11103, 'yara.aly@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Yara Aly', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1523', 'https://api.dicebear.com/7.x/initials/svg?seed=Yara+Aly'),
(10213, 'abdel.mahmoud@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Abdel Mahmoud', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1524', 'https://api.dicebear.com/7.x/initials/svg?seed=Abdel+Mahmoud'),
(7833, 'fayrouz.hady@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Fayrouz Hady', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1525', 'https://api.dicebear.com/7.x/initials/svg?seed=Fayrouz+Hady'),
(4916, 'reham.osman@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Reham Osman', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1526', 'https://api.dicebear.com/7.x/initials/svg?seed=Reham+Osman'),
(13920, 'rania.azab@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Rania Azab', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1527', 'https://api.dicebear.com/7.x/initials/svg?seed=Rania+Azab'),
(13919, 'mai.shafei@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Mai Shafei', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1528', 'https://api.dicebear.com/7.x/initials/svg?seed=Mai+Shafei'),
(13804, 'sameh.khalaf@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Sameh Khalaf', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1529', 'https://api.dicebear.com/7.x/initials/svg?seed=Sameh+Khalaf'),
(14306, 'noha.soliman@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Noha Soliman', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1530', 'https://api.dicebear.com/7.x/initials/svg?seed=Noha+Soliman'),
(14298, 'mahmoud.baees@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Mahmoud Baees', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1531', 'https://api.dicebear.com/7.x/initials/svg?seed=Mahmoud+Baees'),
(13791, 'mohamed.hodhod@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Mohamed Hodhod', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1532', 'https://api.dicebear.com/7.x/initials/svg?seed=Mohamed+Hodhod'),
(13091, 'nourhan.maaz@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Nourhan Maaz', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1533', 'https://api.dicebear.com/7.x/initials/svg?seed=Nourhan+Maaz'),
(13707, 'ehab.ahmed@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Ehab Ahmed', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1534', 'https://api.dicebear.com/7.x/initials/svg?seed=Ehab+Ahmed'),
(12618, 'gehad.ibrahim@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Gehad Ibrahim', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1535', 'https://api.dicebear.com/7.x/initials/svg?seed=Gehad+Ibrahim'),
(12230, 'ahmed.mohamed@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Ahmed Mohamed', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1536', 'https://api.dicebear.com/7.x/initials/svg?seed=Ahmed+Mohamed'),
(11110, 'mahmoud.hamouda@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Mahmoud Hamouda', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1537', 'https://api.dicebear.com/7.x/initials/svg?seed=Mahmoud+Hamouda'),
(11093, 'zahra.hussein@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Zahra Hussein', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1538', 'https://api.dicebear.com/7.x/initials/svg?seed=Zahra+Hussein'),
(11101, 'engy.el-hefny@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Dr. Engy El-Hefny', 'Dr.', 'professor', 'Academic Staff', '+20 2 3837-1539', 'https://api.dicebear.com/7.x/initials/svg?seed=Engy+El-Hefny'),
(13072, 'nada.el-gazzar@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Nada El-Gazzar', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1540', 'https://api.dicebear.com/7.x/initials/svg?seed=Nada+El-Gazzar'),
(11633, 'maram.el-demerdash@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Maram El-Demerdash', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1541', 'https://api.dicebear.com/7.x/initials/svg?seed=Maram+El-Demerdash'),
(12600, 'nouran.hamida@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Nouran Hamida', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1542', 'https://api.dicebear.com/7.x/initials/svg?seed=Nouran+Hamida'),
(12593, 'mahmoud.khalaf@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Mahmoud Khalaf', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1543', 'https://api.dicebear.com/7.x/initials/svg?seed=Mahmoud+Khalaf'),
(12065, 'mohamed.zeid@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Mohamed Zeid', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1544', 'https://api.dicebear.com/7.x/initials/svg?seed=Mohamed+Zeid'),
(12270, 'shorouk.mohamed@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Shorouk Mohamed', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1545', 'https://api.dicebear.com/7.x/initials/svg?seed=Shorouk+Mohamed'),
(13820, 'abdel.saleh@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Abdel Saleh', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1546', 'https://api.dicebear.com/7.x/initials/svg?seed=Abdel+Saleh'),
(11132, 'hoda.allam@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Hoda Allam', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1547', 'https://api.dicebear.com/7.x/initials/svg?seed=Hoda+Allam'),
(12426, 'salma.raouf@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Salma Raouf', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1548', 'https://api.dicebear.com/7.x/initials/svg?seed=Salma+Raouf'),
(12279, 'fouad.ashry@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Fouad Ashry', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1549', 'https://api.dicebear.com/7.x/initials/svg?seed=Fouad+Ashry'),
(14353, 'youssef.kheir@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Youssef Kheir', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1550', 'https://api.dicebear.com/7.x/initials/svg?seed=Youssef+Kheir'),
(14417, 'salma.omar@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Salma Omar', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1551', 'https://api.dicebear.com/7.x/initials/svg?seed=Salma+Omar'),
(14019, 'mariam.khalil@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Mariam Khalil', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1552', 'https://api.dicebear.com/7.x/initials/svg?seed=Mariam+Khalil'),
(15241, 'rawan.aly@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Rawan Aly', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1553', 'https://api.dicebear.com/7.x/initials/svg?seed=Rawan+Aly'),
(15697, 'nada.hefny@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Nada Hefny', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1554', 'https://api.dicebear.com/7.x/initials/svg?seed=Nada+Hefny'),
(15267, 'hadeer.refaie@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Hadeer Refaie', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1555', 'https://api.dicebear.com/7.x/initials/svg?seed=Hadeer+Refaie'),
(15294, 'nourhan.wahed@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Nourhan Wahed', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1556', 'https://api.dicebear.com/7.x/initials/svg?seed=Nourhan+Wahed'),
(13257, 'nashwa.hamidou@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Nashwa Hamidou', 'Eng. / AL.', 'staff', 'Academic Staff', '+20 2 3837-1557', 'https://api.dicebear.com/7.x/initials/svg?seed=Nashwa+Hamidou'),
(13988, 'maya.sweilam@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Maya Sweilam', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1558', 'https://api.dicebear.com/7.x/initials/svg?seed=Maya+Sweilam'),
(13987, 'nada.sayed@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Nada Sayed', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1559', 'https://api.dicebear.com/7.x/initials/svg?seed=Nada+Sayed'),
(14451, 'aya.el-alawy@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Aya El-Alawy', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1560', 'https://api.dicebear.com/7.x/initials/svg?seed=Aya+El-Alawy'),
(14279, 'youssef.deif@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Youssef Deif', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1561', 'https://api.dicebear.com/7.x/initials/svg?seed=Youssef+Deif'),
(14236, 'aya.el-gowhary@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Aya El-Gowhary', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1562', 'https://api.dicebear.com/7.x/initials/svg?seed=Aya+El-Gowhary'),
(14326, 'maya.el-safty@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Maya El-Safty', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1563', 'https://api.dicebear.com/7.x/initials/svg?seed=Maya+El-Safty'),
(14509, 'mohamed.fahim@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Mohamed Fahim', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1564', 'https://api.dicebear.com/7.x/initials/svg?seed=Mohamed+Fahim'),
(14015, 'nour.basiouny@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Nour Basiouny', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1565', 'https://api.dicebear.com/7.x/initials/svg?seed=Nour+Basiouny'),
(13347, 'sara.el-gharably@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Sara El-Gharably', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1566', 'https://api.dicebear.com/7.x/initials/svg?seed=Sara+El-Gharably'),
(13602, 'hesham.el-dahshan@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Hesham El-Dahshan', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1567', 'https://api.dicebear.com/7.x/initials/svg?seed=Hesham+El-Dahshan'),
(14157, 'amr.marzouk@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Amr Marzouk', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1568', 'https://api.dicebear.com/7.x/initials/svg?seed=Amr+Marzouk'),
(15170, 'zohour.shazly@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Zohour Shazly', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1569', 'https://api.dicebear.com/7.x/initials/svg?seed=Zohour+Shazly'),
(15502, 'faten.latif@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Faten Latif', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1570', 'https://api.dicebear.com/7.x/initials/svg?seed=Faten+Latif'),
(15687, 'karma.ashour@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Karma Ashour', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1571', 'https://api.dicebear.com/7.x/initials/svg?seed=Karma+Ashour'),
(15667, 'shahd.el-haggan@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Shahd El-Haggan', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1572', 'https://api.dicebear.com/7.x/initials/svg?seed=Shahd+El-Haggan'),
(15266, 'nourhan.el-hefnawy@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Nourhan El-Hefnawy', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1573', 'https://api.dicebear.com/7.x/initials/svg?seed=Nourhan+El-Hefnawy'),
(15654, 'shahd.fahmy@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Shahd Fahmy', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1574', 'https://api.dicebear.com/7.x/initials/svg?seed=Shahd+Fahmy'),
(15655, 'hala.khorshid@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Hala Khorshid', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1575', 'https://api.dicebear.com/7.x/initials/svg?seed=Hala+Khorshid'),
(15215, 'nourhan.el-tayeb@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Nourhan El-Tayeb', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1576', 'https://api.dicebear.com/7.x/initials/svg?seed=Nourhan+El-Tayeb'),
(15503, 'hagar.mohamed@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Hagar Mohamed', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1577', 'https://api.dicebear.com/7.x/initials/svg?seed=Hagar+Mohamed'),
(15651, 'konouz.hassan@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Konouz Hassan', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1578', 'https://api.dicebear.com/7.x/initials/svg?seed=Konouz+Hassan'),
(15728, 'ahmed.mohamed1@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Ahmed Mohamed', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1579', 'https://api.dicebear.com/7.x/initials/svg?seed=Ahmed+Mohamed'),
(15653, 'rawan.ahmed@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Rawan Ahmed', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1580', 'https://api.dicebear.com/7.x/initials/svg?seed=Rawan+Ahmed'),
(15002, 'omnia.soliman@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Omnia Soliman', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1581', 'https://api.dicebear.com/7.x/initials/svg?seed=Omnia+Soliman'),
(15156, 'shahd.el-tarabily@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Shahd El-Tarabily', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1582', 'https://api.dicebear.com/7.x/initials/svg?seed=Shahd+El-Tarabily'),
(15168, 'sandy.helal@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Sandy Helal', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1583', 'https://api.dicebear.com/7.x/initials/svg?seed=Sandy+Helal'),
(15652, 'sara.diab@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Sara Diab', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1584', 'https://api.dicebear.com/7.x/initials/svg?seed=Sara+Diab'),
(15169, 'habiba.moussa@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Eng. Habiba Moussa', 'Eng. / TA.', 'staff', 'Academic Staff', '+20 2 3837-1585', 'https://api.dicebear.com/7.x/initials/svg?seed=Habiba+Moussa'),
(14889, 'mostafa.maksoud@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'RA. Mostafa Maksoud', 'RA.', 'staff', 'Prototyping RA', '+20 2 3837-1586', 'https://api.dicebear.com/7.x/initials/svg?seed=Mostafa+Maksoud'),
(15684, 'rahma.yassin@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Researcher Rahma Yassin', 'Research Assistant', 'staff', 'Prototyping RA', '+20 2 3837-1587', 'https://api.dicebear.com/7.x/initials/svg?seed=Rahma+Yassin'),
(15683, 'radwa.sabra@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Researcher Radwa Sabra', 'Research Assistant', 'staff', 'Prototyping RA', '+20 2 3837-1588', 'https://api.dicebear.com/7.x/initials/svg?seed=Radwa+Sabra'),
(14297, 'selvia.nashat@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Researcher Selvia Nashat', 'Research Assistant', 'staff', 'RA N112', '+20 2 3837-1589', 'https://api.dicebear.com/7.x/initials/svg?seed=Selvia+Nashat'),
(14294, 'rojana.ashraf@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Researcher Rojana Ashraf', 'Research Assistant', 'staff', 'RA N112', '+20 2 3837-1590', 'https://api.dicebear.com/7.x/initials/svg?seed=Rojana+Ashraf'),
(14388, 'salma.hossam@msa.edu.eg', '$2b$10$0DoOQZxisQ2Pfk5ZRCCvou8OnycoiE6Yj0hfEH5z5/WHxCtl4rfaa', 'Researcher Salma Hossam El-Din', 'Research Assistant', 'staff', 'RA N112', '+20 2 3837-1591', 'https://api.dicebear.com/7.x/initials/svg?seed=Salma+Hossam');

-- Seed Starter Governance Tasks (Assigned by Dean Gehan Safwat & Vice Dean Amr Ageez)
INSERT OR IGNORE INTO tasks (id, title, description, assigned_by_id, assigned_to_id, department, priority, deadline, status, completion_notes, completion_url, completed_at, dean_acknowledged) VALUES
(1, 'Submit NAQAAE Accreditation Course Syllabi (BIO301 & BIO402)', 'Review Course Learning Outcomes (CLOs) for Fall semester, map them against National Authority for Quality Assurance and Accreditation of Education (NAQAAE) standards, and submit PDF syllabi.', 6496, 14191, 'Academic Staff', 'high', datetime('now', '+3 days'), 'done', 'Completed curriculum review with departmental board. All CLOs mapped to NAQAAE benchmarks. Document verified.', 'https://drive.faculty.edu/biotech/syllabi-fall-2026.pdf', datetime('now', '-5 hours'), 1),
(2, 'DNA Sequencing Lab Safety Audit & Equipment Log', 'Conduct a safety walkthrough of the Genomics Laboratory (Lab 304). Verify PCR machine calibration, autoclaves, and inventory of Taq polymerases.', 6591, 12065, 'Academic Staff', 'urgent', datetime('now', '+2 days'), 'in_progress', 'Thermocyclers calibrated. Autoclave inspection completed. Compiling reagent restocking request for dean approval.', NULL, NULL, 0),
(3, 'Week 4 Lab Attendance Verification & Student Log', 'Audit attendance records across all practical molecular biology sections. Flag students with repeated unexcused absences.', 6496, 14686, 'Academic Administration', 'medium', datetime('now', '+4 days'), 'done', 'Audited registered students. Students flagged for advisory intervention. Report sent to student affairs.', 'https://drive.faculty.edu/attendance/week4.xlsx', datetime('now', '-1 day'), 0);

-- Seed Starter Activity Logs
INSERT OR IGNORE INTO activity_logs (id, user_id, user_name, user_role, action_type, task_id, title, details, ip_address) VALUES
(1, 6496, 'Prof. Dr. Gehan Safwat', 'admin', 'DEAN_VERIFIED', 1, 'Dean Executive Acknowledgment', 'Prof. Dr. Gehan Safwat verified NAQAAE course syllabi compliance.', '127.0.0.1'),
(2, 6591, 'Prof. Dr. Amr Ageez', 'admin', 'TASK_CREATED', 2, 'Academic Oversight Dispatch', 'Vice Dean Prof. Dr. Amr Ageez issued laboratory safety inspection directive.', '127.0.0.1');

-- ─────────────────────────────────────────────────────────────
-- HATS (Functional Working Groups, Committees, & Taskforces)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎩',
  color TEXT DEFAULT '#3b82f6',
  created_by_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hat_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hat_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(hat_id, user_id)
);

-- Seed Starter Faculty Hats
INSERT OR IGNORE INTO hats (id, name, description, icon, color, created_by_id) VALUES
(1, 'Accreditation & Quality Assurance Committee', 'Coordinates NAQAAE institutional compliance, course specifications, CLO mapping, and program development self-study reports.', '🎓', '#3b82f6', 6496),
(2, 'Examinations & Control Board', 'Oversees exam paper formulation, question bank verification, exam printing security, secret code assignment, and grading ledger audit.', '📝', '#10b981', 6591),
(3, 'Laboratory Safety & Equipment Taskforce', 'Manages autoclave/PCR machine inspections, reagent inventory logs, biosafety protocols, and chemical waste management across all practical labs.', '🧪', '#f59e0b', 6496),
(4, 'Academic Advising & Student Support Unit', 'Monitors student lab attendance thresholds, supports students on academic warning, and coordinates advisory intervention records.', '👥', '#8b5cf6', 6591),
(5, 'RA N112', 'Specialized research assistant cadre stationed in lab/office N112, coordinating experimental benchmarks and research throughput.', '🧪', '#06b6d4', 6496),
(6, 'Prototyping RA', 'Biotechnology prototyping and innovation research assistant unit, conducting specialized prototyping experiments and data modeling.', '🔬', '#ec4899', 6496);

-- Seed Starter Hat Members
INSERT OR IGNORE INTO hat_members (hat_id, user_id) VALUES
(1, 6496), (1, 6591), (1, 14191), (1, 13537), (1, 12228), (1, 9783),
(2, 6591), (2, 7065), (2, 14237), (2, 4916), (2, 12065), (2, 14686),
(3, 13480), (3, 6835), (3, 12600), (3, 15720), (3, 15683),
(4, 6417), (4, 9580), (4, 15714), (4, 12698), (4, 14686),
(5, 14388), (5, 14294), (5, 14297),
(6, 15684), (6, 15683), (6, 14889);

-- ─────────────────────────────────────────────────────────────
-- FORMAL PROCEEDINGS, PRESIDENTIAL DELEGATIONS, & MINUTES (MoM)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'departmental',
  hat_id INTEGER,
  hat_name TEXT,
  committee_id INTEGER,
  committee_name TEXT,
  date DATETIME NOT NULL,
  location TEXT NOT NULL,
  chair TEXT NOT NULL,
  rapporteur TEXT,
  objective TEXT,
  attendees TEXT,
  agenda TEXT,
  minutes_body TEXT,
  decisions TEXT,
  action_items TEXT,
  dean_briefing TEXT,
  recurrence TEXT,
  is_dean_request INTEGER DEFAULT 0,
  time_options TEXT,
  dean_notes TEXT,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by_id INTEGER NOT NULL,
  created_by_name TEXT NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- OFFICIAL FACULTY STANDING COMMITTEES (Statutory Governance)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS committees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  category TEXT NOT NULL DEFAULT 'standing',
  decree_ref TEXT,
  chair_id INTEGER NOT NULL,
  chair_name TEXT NOT NULL,
  chair_title TEXT,
  rapporteur_id INTEGER NOT NULL,
  rapporteur_name TEXT NOT NULL,
  rapporteur_title TEXT,
  description TEXT,
  mandates TEXT,
  pillar_code TEXT,
  pillar_name TEXT,
  icon TEXT DEFAULT '🏛️',
  color TEXT DEFAULT '#3b82f6',
  members TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- WEB PUSH NOTIFICATION SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT,
  auth TEXT,
  keys TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- DEAN AVAILABILITY SLOTS (Meeting Booking Alignment)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dean_availability_slots (
  id TEXT PRIMARY KEY,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT DEFAULT "Dean's Office (Building A, Room 301)",
  note TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- DATABASE PERFORMANCE & QUERY OPTIMIZATION INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_hat_id ON tasks(hat_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_task ON activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_type ON meetings(type);
CREATE INDEX IF NOT EXISTS idx_meetings_hat ON meetings(hat_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_hat_members_user ON hat_members(user_id);



