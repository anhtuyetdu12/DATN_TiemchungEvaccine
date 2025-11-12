-- Table: vaccines_disease
CREATE TABLE vaccines_disease (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  cause NVARCHAR(MAX),
  symptom NVARCHAR(MAX),
  prevention NVARCHAR(MAX),
  status NVARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Table: vaccines_vaccinecategory
CREATE TABLE vaccines_vaccinecategory (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  image NVARCHAR(300),
  status BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Table: vaccines_vaccine
CREATE TABLE vaccines_vaccine (
  id INT IDENTITY(1,1) PRIMARY KEY,
  category_id INT FOREIGN KEY REFERENCES vaccines_vaccinecategory(id),
  disease_id INT NOT NULL FOREIGN KEY REFERENCES vaccines_disease(id),
  name NVARCHAR(255) NOT NULL,
  manufacturer NVARCHAR(255),
  origin NVARCHAR(100),
  vaccine_type NVARCHAR(255),
  unit NVARCHAR(50) NOT NULL DEFAULT 'liều',
  price DECIMAL(12,2),
  doses_required INT DEFAULT 1,
  interval_days INT,
  min_age INT NOT NULL,
  max_age INT,
  age_unit NVARCHAR(10) NOT NULL DEFAULT 'tuổi',
  schedule_text NVARCHAR(MAX),
  indications NVARCHAR(MAX),
  contraindications NVARCHAR(MAX),
  storage_requirements NVARCHAR(255),
  side_effects NVARCHAR(MAX),
  description NVARCHAR(MAX),
  efficacy_text NVARCHAR(MAX),
  pregnancy_note NVARCHAR(MAX),
  deferral_note NVARCHAR(MAX),
  other_notes NVARCHAR(MAX),
  approval_date DATE,
  image NVARCHAR(300),
  status NVARCHAR(20) DEFAULT 'active',
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  low_stock_threshold INT DEFAULT 20,
  slug NVARCHAR(255) UNIQUE
);

-- Table: vaccines_vaccinepackagegroup
CREATE TABLE vaccines_vaccinepackagegroup (
  id INT IDENTITY(1,1) PRIMARY KEY,
  title NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  [order] INT DEFAULT 0,                  -- dùng [order] để tránh trùng từ khóa
  status BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  slug NVARCHAR(255) UNIQUE
);


-- Table: vaccines_vaccinepackage
CREATE TABLE vaccines_vaccinepackage (
  id INT IDENTITY(1,1) PRIMARY KEY,
  group_id INT FOREIGN KEY REFERENCES vaccines_vaccinepackagegroup(id),
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  image NVARCHAR(300),
  status BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  slug NVARCHAR(255) UNIQUE
);

-- Table: vaccines_vaccinepackagedisease
CREATE TABLE vaccines_vaccinepackagedisease (
  id INT IDENTITY(1,1) PRIMARY KEY,
  package_id INT NOT NULL FOREIGN KEY REFERENCES vaccines_vaccinepackage(id),
  disease_id INT NOT NULL FOREIGN KEY REFERENCES vaccines_disease(id),
  slug NVARCHAR(255) UNIQUE
);

-- Table: vaccines_vaccinepackagedisease_vaccines
CREATE TABLE vaccines_vaccinepackagedisease_vaccines (
  id INT IDENTITY(1,1) PRIMARY KEY,
  vaccinepackagedisease_id INT NOT NULL FOREIGN KEY REFERENCES vaccines_vaccinepackagedisease(id),
  vaccine_id INT NOT NULL FOREIGN KEY REFERENCES vaccines_vaccine(id)
);

-- Table: users_customuser
CREATE TABLE users_customuser (
  id INT IDENTITY(1,1) PRIMARY KEY,
  full_name NVARCHAR(255) NOT NULL DEFAULT 'Unknown',
  email NVARCHAR(254) NOT NULL UNIQUE,
  phone NVARCHAR(15),
  role NVARCHAR(20) NOT NULL CHECK (role IN ('admin','staff','customer')),
  must_change_password BIT DEFAULT 0,
  last_login DATETIME2,
  status NVARCHAR(20) DEFAULT 'active',
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  is_staff BIT DEFAULT 0,
  is_active BIT DEFAULT 1,
  password NVARCHAR(128) NOT NULL,
  is_superuser BIT DEFAULT 0
);

-- Table: users_medicalstaff
CREATE TABLE users_medicalstaff (
  user_id INT PRIMARY KEY FOREIGN KEY REFERENCES users_customuser(id),
  department NVARCHAR(100) NOT NULL,
  specialization NVARCHAR(100) NOT NULL,
  license_number NVARCHAR(50) NOT NULL,
  work_shift NVARCHAR(50) NOT NULL,
  hire_date DATE DEFAULT CAST(SYSUTCDATETIME() as date),
  status NVARCHAR(20) DEFAULT 'active',
  notes NVARCHAR(MAX)
);

-- Table: records_familymember
CREATE TABLE records_familymember (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL FOREIGN KEY REFERENCES users_customuser(id),
  full_name NVARCHAR(255) NOT NULL,
  nickname NVARCHAR(255),
  relation NVARCHAR(50) NOT NULL,
  gender NVARCHAR(10) NOT NULL CHECK (gender IN ('male','female','other')),
  date_of_birth DATE,
  phone NVARCHAR(20),
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  is_self BIT DEFAULT 0
);

-- Table: vaccines_booking
CREATE TABLE vaccines_booking (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL FOREIGN KEY REFERENCES users_customuser(id),
  member_id INT NOT NULL FOREIGN KEY REFERENCES records_familymember(id),
  vaccine_id INT FOREIGN KEY REFERENCES vaccines_vaccine(id),
  package_id INT FOREIGN KEY REFERENCES vaccines_vaccinepackage(id),
  appointment_date DATE,
  location NVARCHAR(255),
  status NVARCHAR(20) NOT NULL DEFAULT 'pending',
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Table: vaccines_bookingitem
CREATE TABLE vaccines_bookingitem (
  id INT IDENTITY(1,1) PRIMARY KEY,
  booking_id INT NOT NULL FOREIGN KEY REFERENCES vaccines_booking(id),
  vaccine_id INT NOT NULL FOREIGN KEY REFERENCES vaccines_vaccine(id),
  quantity INT DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0
);

-- Table: records_vaccinationrecord
CREATE TABLE records_vaccinationrecord (
  id INT IDENTITY(1,1) PRIMARY KEY,
  family_member_id INT FOREIGN KEY REFERENCES records_familymember(id),
  disease_id INT FOREIGN KEY REFERENCES vaccines_disease(id),
  vaccine_id INT FOREIGN KEY REFERENCES vaccines_vaccine(id),
  dose_number INT,
  vaccine_name NVARCHAR(255),
  vaccine_lot NVARCHAR(100),
  vaccination_date DATE,
  next_dose_date DATE,
  note NVARCHAR(MAX),
  source_booking_id INT FOREIGN KEY REFERENCES vaccines_booking(id)
);

-- Table: inventory_vaccinestocklot
CREATE TABLE inventory_vaccinestocklot (
  id INT IDENTITY(1,1) PRIMARY KEY,
  vaccine_id INT NOT NULL FOREIGN KEY REFERENCES vaccines_vaccine(id),
  lot_number NVARCHAR(100) NOT NULL,
  expiry_date DATE NOT NULL,
  quantity_total INT DEFAULT 0,
  quantity_available INT DEFAULT 0,
  location NVARCHAR(255),
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Table: inventory_bookingallocation
CREATE TABLE inventory_bookingallocation (
  id INT IDENTITY(1,1) PRIMARY KEY,
  booking_item_id INT NOT NULL FOREIGN KEY REFERENCES vaccines_bookingitem(id),
  lot_id INT NOT NULL FOREIGN KEY REFERENCES inventory_vaccinestocklot(id),
  quantity INT DEFAULT 0,
  status NVARCHAR(20) DEFAULT 'reserved',
  reserved_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
