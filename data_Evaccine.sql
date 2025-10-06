
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



GO
-- Bảng vaccines (danh mục vaccine)
CREATE TABLE vaccines (
    vaccine_id INT IDENTITY(1,1) PRIMARY KEY,

    disease_id INT NOT NULL 
        FOREIGN KEY REFERENCES diseases(disease_id), 
        -- Mối quan hệ: vaccine này phòng bệnh gì

    name NVARCHAR(100) NOT NULL,               -- Tên vắc xin (VD: Qdenga, Pfizer, Moderna…)
    manufacturer NVARCHAR(100),                -- Nhà sản xuất (Sanofi, Pfizer…)
    origin NVARCHAR(100),                      -- Xuất xứ (Pháp, Mỹ, Nhật…)
    vaccine_type NVARCHAR(50),                 -- Loại (mRNA, Vector, Bất hoạt…)
    price DECIMAL(12,2),                       -- Giá bán
    doses_required INT CHECK (doses_required BETWEEN 1 AND 5), 
        -- Số mũi khuyến nghị (1-5 mũi)
    interval_days INT,                         -- Khoảng cách giữa 2 mũi (tính theo ngày)
    age_group NVARCHAR(50),                    -- Nhóm tuổi chỉ định (VD: Trẻ 2–11 tuổi, ≥18 tuổi)
    indications NVARCHAR(MAX),                 -- Công dụng/chỉ định (VD: phòng ngừa sốt xuất huyết)
    contraindications NVARCHAR(MAX),           -- Chống chỉ định (VD: dị ứng, suy giảm miễn dịch…)
    storage_requirements NVARCHAR(255),        -- Điều kiện bảo quản (VD: 2-8°C, đông lạnh…)
    description NVARCHAR(MAX),                 -- Mô tả thêm chi tiết về vaccine
    status NVARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active','inactive')), 
        -- Trạng thái (còn sử dụng / ngưng lưu hành)
    side_effects NVARCHAR(MAX),                -- Tác dụng phụ thường gặp (VD: sốt nhẹ, đau chỗ tiêm)
    approval_date DATE,                        -- Ngày được cấp phép
    created_at DATETIME DEFAULT GETDATE()      -- Ngày tạo bản ghi
);

GO


CREATE TABLE diseases (
    disease_id INT IDENTITY(1,1) PRIMARY KEY,  -- Khóa chính, định danh bệnh
    name NVARCHAR(100) NOT NULL,               -- Tên bệnh (VD: Sốt xuất huyết Dengue)
    description NVARCHAR(MAX),                 -- Mô tả chi tiết về bệnh, nguyên nhân, đường lây    
    symptoms NVARCHAR(MAX),                    -- Các triệu chứng thường gặp (sốt, phát ban, ho…    
    complications NVARCHAR(MAX),               -- Biến chứng nguy hiểm (VD: sốc, xuất huyết, suy hô hấp…)   
    created_at DATETIME DEFAULT GETDATE()      -- Ngày tạo bản ghi (phục vụ audit/log)
);
GO

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