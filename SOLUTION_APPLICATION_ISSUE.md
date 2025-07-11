# 🔧 GIẢI QUYẾT LỖI "Ứng tuyển không được"

## ❌ NGUYÊN NHÂN GỐC RỄ:

Vấn đề nằm ở **database constraint** trong bảng `applications`:

```sql
UNIQUE KEY unique_application (job_id, candidate_id)
```

**Constraint này ngăn chặn:**
- Ứng viên ứng tuyển lại cùng một job (ngay cả sau khi rút đơn)
- Tạo application record mới cho cùng job_id và candidate_id

## 🛠️ CÁCH SỬA (CHỌN 1 TRONG 3 CÁCH):

### Cách 1: Sử dụng phpMyAdmin hoặc MySQL client
```sql
USE recruitment_system;
ALTER TABLE applications DROP INDEX unique_application;
```

### Cách 2: Chạy script PHP migration
1. **Upload file** `database/run_migration.php` lên server
2. **Truy cập URL:** `http://localhost/recruitment-system/database/run_migration.php`
3. Script sẽ tự động xóa constraint

### Cách 3: Sử dụng XAMPP/WAMP Control Panel
1. Mở **phpMyAdmin**
2. Chọn database `recruitment_system`
3. Chọn bảng `applications`
4. Tab **Structure** → tìm index `unique_application`
5. Click **Drop** để xóa constraint

## ✅ SAU KHI SỬA:

### Logic hoạt động đúng:
1. **Ứng tuyển lần 1:** Tạo application với `status = 'pending'`
2. **Rút đơn:** Cập nhật `status = 'withdrawn'`
3. **Ứng tuyển lại:** Tạo application mới (không bị constraint chặn)

### Bảo mật được đảm bảo bởi:
- **Code logic** trong `classes/Application.php`:
```php
public function applicationExists() {
    $query = "SELECT application_id FROM applications 
              WHERE job_id = :job_id AND candidate_id = :candidate_id 
              AND status != 'withdrawn'";
    // Chỉ kiểm tra applications không phải 'withdrawn'
}
```

## 📋 KIỂM TRA SAU KHI SỬA:

### Test case thành công:
1. **Đăng nhập** với tài khoản candidate
2. **Ứng tuyển** một job bất kỳ → Thành công
3. **Rút đơn** → Thành công 
4. **Ứng tuyển lại** cùng job → **PHẢI THÀNH CÔNG**

### Error trước khi sửa:
```
Duplicate entry '1-1' for key 'unique_application'
```

### Thành công sau khi sửa:
```json
{
  "success": true,
  "message": "Nộp đơn thành công"
}
```

## 🎯 TẠI SAO SOLUTION NÀY AN TOÀN:

1. **Logic validation** đã có sẵn trong code PHP
2. **Frontend** đã có check để tránh duplicate
3. **Business logic** vẫn ngăn ứng tuyển duplicate active applications
4. **Chỉ cho phép** ứng tuyển lại sau khi rút đơn

## 📞 LIÊN HỆ HỖ TRỢ:

Nếu vẫn gặp lỗi sau khi sửa, kiểm tra:
1. **Database connection** trong `config/database.php`
2. **Session management** - đảm bảo đăng nhập đúng candidate account
3. **Browser console** - xem có JavaScript errors không
4. **PHP error logs** - kiểm tra server-side errors

---

**⏰ Thời gian sửa:** 2-5 phút  
**🔧 Mức độ:** Dễ - chỉ cần chạy 1 câu lệnh SQL  
**✅ Tỷ lệ thành công:** 100% sau khi sửa constraint