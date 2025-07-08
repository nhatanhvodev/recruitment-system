# Hệ thống Tuyển dụng JobPortal

Một hệ thống tuyển dụng trực tuyến hoàn chỉnh được xây dựng bằng HTML, CSS, PHP và MySQL, dựa trên thiết kế use case diagram được cung cấp.

## 🌟 Tính năng

### Dành cho ứng viên:
- Đăng ký và đăng nhập tài khoản
- Tìm kiếm việc làm theo từ khóa, địa điểm, loại công việc
- Xem chi tiết công việc
- Ứng tuyển các vị trí
- Quản lý đơn ứng tuyển
- Cập nhật hồ sơ cá nhân

### Dành cho nhà tuyển dụng:
- Đăng ký tài khoản nhà tuyển dụng
- Đăng tin tuyển dụng
- Quản lý đơn ứng tuyển
- Xem hồ sơ ứng viên

### Dành cho Admin:
- Quản lý người dùng
- Phê duyệt tin tuyển dụng
- Xem thống kê hệ thống

## 🛠️ Công nghệ sử dụng

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.4+
- **Database**: MySQL 8.0+
- **Web Server**: Apache/Nginx
- **Icons**: Font Awesome 6.0

## 📋 Yêu cầu hệ thống

- PHP 7.4 hoặc cao hơn
- MySQL 8.0 hoặc cao hơn
- Apache/Nginx web server
- Extension PHP: PDO, PDO_MYSQL

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd recruitment-system
```

### 2. Cấu hình web server

#### Với XAMPP:
1. Copy thư mục project vào `htdocs`
2. Khởi động Apache và MySQL
3. Truy cập `http://localhost/recruitment-system/public`

#### Với WAMP:
1. Copy thư mục project vào `www`
2. Khởi động các service
3. Truy cập `http://localhost/recruitment-system/public`

### 3. Tạo database

1. Mở phpMyAdmin hoặc MySQL client
2. Import file `database/schema.sql`
3. Database `recruitment_system` sẽ được tạo với dữ liệu mẫu

### 4. Cấu hình database

Chỉnh sửa file `config/database.php`:

```php
private $host = 'localhost';
private $db_name = 'recruitment_system';
private $username = 'root';  // Thay đổi username MySQL
private $password = '';      // Thay đổi password MySQL
```

### 5. Cấu hình web server

#### Apache (.htaccess)

Tạo file `.htaccess` trong thư mục `public`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]

# Enable CORS for API
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

## 📁 Cấu trúc thư mục

```
recruitment-system/
├── config/
│   └── database.php          # Cấu hình database
├── classes/
│   ├── User.php             # Class người dùng
│   ├── Job.php              # Class công việc
│   └── Application.php      # Class đơn ứng tuyển
├── auth/
│   ├── login.php            # API đăng nhập
│   ├── register.php         # API đăng ký
│   └── logout.php           # API đăng xuất
├── api/
│   ├── jobs.php             # API công việc
│   ├── applications.php     # API đơn ứng tuyển
│   └── companies.php        # API công ty
├── public/
│   ├── index.html           # Trang chủ
│   ├── login.html           # Trang đăng nhập
│   ├── register.html        # Trang đăng ký
│   ├── dashboard.html       # Dashboard ứng viên
│   ├── css/
│   │   └── style.css        # Stylesheet chính
│   └── js/
│       ├── common.js        # JavaScript chung
│       └── jobs.js          # JavaScript xử lý công việc
├── database/
│   └── schema.sql           # Database schema
└── README.md
```

## 🎯 Sử dụng

### 1. Truy cập hệ thống

Mở trình duyệt và truy cập: `http://localhost/recruitment-system/public`

### 2. Tài khoản mặc định

**Admin:**
- Email: `admin@recruitment.com`
- Password: `password`

### 3. Chức năng chính

#### Trang chủ:
- Xem danh sách việc làm
- Tìm kiếm việc làm
- Đăng ký/Đăng nhập

#### Dashboard ứng viên:
- Quản lý đơn ứng tuyển
- Cập nhật hồ sơ
- Xem thống kê

#### Ứng tuyển:
- Click "Ứng tuyển" trên job card
- Điền thư xin việc
- Gửi đơn ứng tuyển

## 🔧 API Endpoints

### Authentication
- `POST /auth/login.php` - Đăng nhập
- `POST /auth/register.php` - Đăng ký
- `POST /auth/logout.php` - Đăng xuất

### Jobs
- `GET /api/jobs.php` - Lấy danh sách việc làm
- `GET /api/jobs.php?job_id=1` - Lấy chi tiết việc làm
- `POST /api/jobs.php` - Tạo việc làm mới (recruiter/admin)
- `PUT /api/jobs.php` - Cập nhật việc làm (recruiter/admin)

### Applications
- `POST /api/applications.php` - Nộp đơn ứng tuyển
- `GET /api/applications.php?candidate_applications=1` - Lấy đơn của ứng viên
- `GET /api/applications.php?job_id=1` - Lấy đơn theo việc làm
- `PUT /api/applications.php` - Cập nhật trạng thái đơn

### Companies
- `GET /api/companies.php` - Lấy danh sách công ty

## 📱 Responsive Design

Hệ thống được thiết kế responsive, hoạt động tốt trên:
- Desktop (1200px+)
- Tablet (768px - 1199px) 
- Mobile (< 768px)

## 🎨 Giao diện

- Thiết kế modern với gradient background
- Color scheme chuyên nghiệp (Blue #2c5aa0)
- Typography dễ đọc với Segoe UI
- Icons từ Font Awesome
- Smooth animations và transitions

## ⚙️ Tính năng nâng cao

### Session Management
- Sử dụng PHP Sessions cho authentication
- Auto-logout khi session hết hạn
- Remember login state

### Security
- Password hashing với bcrypt
- SQL injection protection với PDO
- XSS protection với htmlspecialchars
- CSRF protection (có thể thêm)

### Performance
- Optimized database queries
- Lazy loading cho images
- Minified CSS/JS (production)
- Database indexing

## 🔍 Troubleshooting

### Lỗi database connection:
1. Kiểm tra MySQL service đã chạy
2. Verify database credentials trong `config/database.php`
3. Đảm bảo database `recruitment_system` đã được tạo

### Lỗi 404 khi call API:
1. Kiểm tra mod_rewrite đã enable
2. Verify file `.htaccess` có đúng config
3. Check file permissions

### Lỗi CORS:
1. Thêm CORS headers trong `.htaccess`
2. Hoặc cấu hình trong virtual host

## 🚀 Deployment

### Production Checklist:
1. Thay đổi database credentials
2. Enable HTTPS
3. Minify CSS/JS files
4. Configure error reporting
5. Setup backup system
6. Configure proper file permissions

### Environment Variables:
Tạo file `config/env.php`:

```php
<?php
define('DB_HOST', 'your-host');
define('DB_NAME', 'your-database');
define('DB_USER', 'your-username');  
define('DB_PASS', 'your-password');
define('ENVIRONMENT', 'production');
?>
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra documentation
2. Search existing issues
3. Create new issue với detailed description

## 🗂️ Database Schema

### Các bảng chính:
- `users` - Thông tin người dùng
- `candidates` - Thông tin ứng viên
- `recruiters` - Thông tin nhà tuyển dụng
- `companies` - Thông tin công ty
- `jobs` - Danh sách việc làm
- `applications` - Đơn ứng tuyển
- `profiles` - Hồ sơ ứng viên
- `messages` - Tin nhắn
- `statistics` - Thống kê hệ thống

### Relationships:
- User 1:1 Candidate/Recruiter/Admin
- Company 1:N Jobs
- Job 1:N Applications
- Candidate 1:N Applications
- Candidate 1:1 Profile

---

Được phát triển với ❤️ bởi JobPortal Team
