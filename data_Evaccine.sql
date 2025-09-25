
-- Tạo database chính
CREATE DATABASE EvaccineDB;
GO

-- Sử dụng database vừa tạo
USE EvaccineDB;
GO



-- Bảng users (quản lý tài khoản người dùng)
CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,          -- Email bắt buộc, dùng để đăng nhập
    phone NVARCHAR(15) NULL,                      -- Số điện thoại (không bắt buộc, chỉ để liên hệ)
    password_hash NVARCHAR(255) NOT NULL,         -- Mật khẩu đã mã hóa
    role NVARCHAR(20) NOT NULL CHECK (role IN ('admin','staff','customer')), -- Phân quyền
    last_login DATETIME NULL,                     -- Lần đăng nhập gần nhất
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')), -- Trạng thái tài khoản
    created_at DATETIME DEFAULT GETDATE()         -- Ngày giờ tạo tài khoản
);
GO

-- chức năng quên mật khẩu → gửi email,
CREATE TABLE password_resets (
    reset_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    reset_token NVARCHAR(255) NOT NULL,       -- Token reset password (link gửi qua email)
    expires_at DATETIME NOT NULL,             -- Thời gian hết hạn
    is_used BIT DEFAULT 0,                    -- Đã sử dụng chưa
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
GO

-- Bảng family_members (quản lý hồ sơ gia đình/ thành viên phụ thuộc)
CREATE TABLE family_members (
    member_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,                        
    full_name NVARCHAR(100) NOT NULL,  -- Họ tên thành viên
    date_of_birth DATE,
    gender NVARCHAR(10) CHECK (gender IN ('male','female','other')), -- Giới tính: nam, nữ, khác
    relation NVARCHAR(50),                    -- Quan hệ với chủ tài khoản (con, vợ, chồng…)     
	notes NVARCHAR(MAX),					-- ghi chú y tế (dị ứng, bệnh nền).
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE  -- Nếu xóa user thì xóa luôn các thành viên của họ
);

GO
-- Bảng medical_staff (nhân viên y tế )
CREATE TABLE medical_staff (
    staff_id INT PRIMARY KEY,              -- Trùng với user_id (1-1 với bảng users)
    department NVARCHAR(100),              -- Khoa/phòng ban (VD: Nhi, Nội, Tiêm chủng)
    specialization NVARCHAR(100),          -- Chuyên môn (VD: Bác sĩ, Điều dưỡng, Dược sĩ)
    license_number NVARCHAR(50),           -- Số chứng chỉ hành nghề
    work_shift NVARCHAR(50),               -- Ca làm việc (sáng/chiều/tối)
    hire_date DATE,                        -- Ngày bắt đầu làm việc
    status NVARCHAR(20) DEFAULT 'active',   -- Trạng thái: active, inactive
	notes NVARCHAR(MAX)	,				  -- để quản lý thêm thông tin khác (VD: tình trạng công tác)
    FOREIGN KEY (staff_id) REFERENCES users(user_id)
);


/*

-- Bảng department (khoa/phòng ban)
-- Mục đích: quản lý danh sách các khoa/phòng, tránh nhập text trùng lặp, chuẩn hóa dữ liệu
CREATE TABLE department (
    department_id INT PRIMARY KEY IDENTITY(1,1),   -- Khóa chính tự tăng
    name NVARCHAR(100) NOT NULL UNIQUE,            -- Tên khoa/phòng (VD: Nhi, Nội, Tiêm chủng)
    description NVARCHAR(255) NULL                 -- Mô tả thêm về khoa/phòng (tùy chọn)
);

-- Bảng work_shift (ca làm việc)
-- Mục đích: chuẩn hóa ca làm việc cho nhân viên y tế
CREATE TABLE work_shift (
    work_shift_id INT PRIMARY KEY IDENTITY(1,1),       -- Khóa chính tự tăng
    name NVARCHAR(50) NOT NULL UNIQUE,            -- Tên ca (VD: sáng, chiều, tối)
    start_time TIME NOT NULL,                      -- Thời gian bắt đầu ca
    end_time TIME NOT NULL,                        -- Thời gian kết thúc ca
    description NVARCHAR(255) NULL                -- Ghi chú thêm về ca làm việc (tùy chọn)
);
GO


-- Bảng medical_staff (nhân viên y tế )
CREATE TABLE medical_staff (
    staff_id INT PRIMARY KEY,              -- Trùng với user_id (1-1 với bảng users)
    department_id INT NOT NULL,              -- Khoa/phòng ban (VD: Nhi, Nội, Tiêm chủng)
    specialization NVARCHAR(100),          -- Chuyên môn (VD: Bác sĩ, Điều dưỡng, Dược sĩ)
    license_number NVARCHAR(50),           -- Số chứng chỉ hành nghề
    work_shift_id INT NOT NULL,               -- Ca làm việc (sáng/chiều/tối)
    hire_date DATE,                        -- Ngày bắt đầu làm việc
    status NVARCHAR(20) DEFAULT 'active',   -- Trạng thái: active, inactive
	notes NVARCHAR(MAX)	,				  -- để quản lý thêm thông tin khác (VD: tình trạng công tác)
    FOREIGN KEY (staff_id) REFERENCES users(user_id),
	FOREIGN KEY (department_id) REFERENCES department(department_id),
    FOREIGN KEY (work_shift_id) REFERENCES work_shift(work_shift_id)
);



*/


GO

-- Bảng vaccines (danh mục vaccine)
CREATE TABLE vaccines (
    vaccine_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,                     -- Tên vaccine        
    manufacturer NVARCHAR(100),                      -- Nhà sản xuất       
    origin NVARCHAR(100),                            -- Nguồn gốc xuất xứ  
	vaccine_type NVARCHAR(50),						-- Loại vaccine (mRNA, Vector, Bất hoạt…)            
    price DECIMAL(12,2),                             -- Giá bán     
    doses_required INT CHECK (doses_required BETWEEN 1 AND 5), -- Số liều khuyến nghị (1-5 mũi)
    interval_days INT,                               -- Khoảng cách (ngày) giữa các mũi
    age_group NVARCHAR(50),                          -- Nhóm tuổi chỉ định
    indications NVARCHAR(MAX),                       -- Công dụng, chỉ định tiêm     
    contraindications NVARCHAR(MAX),                 -- Chống chỉ định    
    storage_requirements NVARCHAR(255),              -- Điều kiện bảo quản
	 description NVARCHAR(MAX),						-- Mô tả/ghi chú thêm
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')), -- Tình trạng vaccine
	side_effects NVARCHAR(MAX),						-- tác dụng phụ thường gặp.
	approval_date DATE,								-- ngày được cấp phép lưu hành.
    created_at DATETIME DEFAULT GETDATE()            -- Ngày tạo bản ghi
);
GO

-- Bảng suppliers (quản lý nhà cung cấp vaccine)
CREATE TABLE suppliers (
    supplier_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,          -- Tên nhà cung cấp
    contact_person NVARCHAR(100),         -- Người liên hệ
    phone NVARCHAR(20),                   -- Số điện thoại
    email NVARCHAR(100),                  -- Email
    address NVARCHAR(255),                -- Địa chỉ
    tax_code NVARCHAR(50),                -- Mã số thuế (nếu có)
    notes NVARCHAR(MAX),                  -- Ghi chú thêm
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),     -- Trạng thái: "active" (đang hợp tác), "inactive" (ngừng hợp tác).
);
GO

-- Bảng vaccine_inventory (quản lý kho vaccine)
CREATE TABLE vaccine_inventory (
    inventory_id INT IDENTITY(1,1) PRIMARY KEY,       
    vaccine_id INT NOT NULL,                           
    supplier_id INT NOT NULL,                   -- id nhà cung cấp
    staff_id INT,                               -- ID nhân viên nhập kho
    batch_number NVARCHAR(50),                  -- Số lô sản xuất         
    quantity INT NOT NULL,                      -- Số lượng còn lại trong kho    
    import_date DATE,                           -- Ngày nhập kho
    expiration_date DATE,                       -- Ngày hết hạn    
    updated_at DATETIME DEFAULT GETDATE(),      -- Thời gian cập nhật gần nhất 
    FOREIGN KEY (vaccine_id) REFERENCES vaccines(vaccine_id),
    FOREIGN KEY (staff_id) REFERENCES medical_staff(staff_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);
GO

-- Bảng appointments (quản lý lịch hẹn tiêm)
CREATE TABLE appointments (
    appointment_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,            -- Người đặt lịch              
    member_id INT,                    -- Thành viên được tiêm             
    vaccine_id INT NOT NULL,              -- Vaccine được chọn        
    appointment_date DATETIME NOT NULL,      -- Ngày giờ hẹn tiêm    
	staff_id INT NULL,                         -- Nhân viên phụ trách (nếu phân công)
    notes NVARCHAR(MAX),                       -- Ghi chú đặc biệt
    status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')), -- Trạng thái: chờ xác nhận, đã xác nhận, đã tiêm, hủy
    created_at DATETIME DEFAULT GETDATE(),       -- Thời điểm đặt lịch
	appointment_type NVARCHAR(20),			--phân biệt đặt lịch lần đầu / nhắc lại.
	confirmed_at DATETIME,					-- ngày được xác nhận.
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (member_id) REFERENCES family_members(member_id),
    FOREIGN KEY (vaccine_id) REFERENCES vaccines(vaccine_id)
);
GO

-- Bảng vaccination_records (ghi nhận mũi tiêm)
CREATE TABLE vaccination_records (
    record_id INT IDENTITY(1,1) PRIMARY KEY,
    member_id INT NOT NULL,                -- Người được tiêm      
    vaccine_id INT NOT NULL,                 -- Loại vaccine   
    staff_id INT,                          -- Nhân viên y tế 
	batch_number NVARCHAR(50),			   -- ghi lại số lô vaccine thực tế tiêm (dù đã có ở inventory, nhưng cần lưu để truy vết).
	dose_number INT CHECK (dose_number BETWEEN 1 AND 5), -- Mũi tiêm thứ mấy
    injection_date DATETIME NOT NULL,         -- Ngày tiêm    
	next_due_date DATETIME NULL,           -- Ngày hẹn tiêm mũi tiếp theo
    reaction NVARCHAR(MAX),                  -- Phản ứng sau tiêm (nếu có)    
    FOREIGN KEY (member_id) REFERENCES family_members(member_id),
    FOREIGN KEY (vaccine_id) REFERENCES vaccines(vaccine_id),
    FOREIGN KEY (staff_id) REFERENCES users(user_id)
);
GO

-- Bảng notifications (thông báo, nhắc lịch)
CREATE TABLE notifications (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,  
    user_id INT NOT NULL,                 -- Người nhận thông báo
	title NVARCHAR(100),                 -- Tiêu đề thông báo
    message NVARCHAR(MAX) NOT NULL,       -- Nội dung thông báo
    type NVARCHAR(20) DEFAULT 'system' CHECK (type IN ('reminder','system','custom')),  -- Loại thông báo: nhắc lịch, hệ thống, tùy chỉnh
    is_read BIT DEFAULT 0,                 -- Đã đọc hay chưa (0: chưa đọc, 1: đã đọc)
    created_at DATETIME DEFAULT GETDATE(),        -- Thời gian tạo thông báo
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
GO

-- Bảng reports (báo cáo thống kê)
CREATE TABLE reports (
    report_id INT IDENTITY(1,1) PRIMARY KEY,
    report_type NVARCHAR(50),                 -- Loại báo cáo (daily, monthly, inventory…)
    generated_at DATETIME DEFAULT GETDATE(),     -- Thời gian hệ thống tạo báo cáo
	created_by INT,								--  ai đã tạo báo cáo (admin/staff).
    data NVARCHAR(MAX)                               -- Nội dung dữ liệu báo cáo ( Lưu JSON dạng text)
);
GO