# 📸 Hướng dẫn thêm Avatar

## Vấn đề đã sửa

✅ **Đã sửa lỗi:** File `avatar_baro.png` cũ (4.9MB) là ảnh thang máy, không phải avatar.
- File cũ đã được đổi tên thành: `old_image_elevator.png`
- Hiện tại dùng: **UI Avatars** (avatar tự động tạo từ tên)

## Cách thêm ảnh Avatar thật

### Option 1: Tự động tạo Avatar (Hiện tại)

Website đang dùng **UI Avatars** - tự động tạo avatar với chữ cái đầu:
```
https://ui-avatars.com/api/?name=Tong+Gia+Bao&background=10a37f&color=fff&size=128
```

**Ưu điểm:**
- Không cần file ảnh
- Tự động hiển thị
- Nhẹ, load nhanh

### Option 2: Upload ảnh Avatar của bạn

**Bước 1:** Chuẩn bị ảnh
- Kích thước khuyến nghị: **256x256px** hoặc **512x512px**
- Format: PNG hoặc JPG
- Dung lượng: **< 500KB** (tối ưu)
- Hình vuông, có thể crop để tròn

**Bước 2:** Đặt tên file
```
avatar_baro.png
```

**Bước 3:** Upload vào thư mục
```
/home/barodev/tonggiabao-id/assets/images/avatar_baro.png
```

**Bước 4:** Cập nhật HTML (nếu cần)

Trong file `index.html`, thay đổi dòng:
```html
<!-- Hiện tại -->
<img src="https://ui-avatars.com/api/?name=Tong+Gia+Bao&background=10a37f&color=fff&size=128" alt="Tống Gia Bảo">

<!-- Đổi thành -->
<img src="./assets/images/avatar_baro.png" alt="Tống Gia Bảo" onerror="this.src='https://ui-avatars.com/api/?name=Tong+Gia+Bao&background=10a37f&color=fff&size=128'">
```

**Giải thích:**
- `src="./assets/images/avatar_baro.png"` - Dùng ảnh local
- `onerror="..."` - Nếu ảnh không load được, dùng UI Avatars làm backup

### Option 3: Dùng Gravatar

Nếu bạn có Gravatar:
```html
<img src="https://www.gravatar.com/avatar/YOUR_EMAIL_MD5?s=128&d=identicon" alt="Tống Gia Bảo">
```

## Tools để tạo/edit Avatar

### Online Tools:
1. **Remove Background:** https://remove.bg
2. **Crop Image:** https://crop-circle.imageonline.co
3. **Resize:** https://imageresizer.com
4. **Profile Pic Maker:** https://pfpmaker.com

### Desktop Apps:
- GIMP (Free)
- Photoshop
- Canva

## Lưu ý

- ⚠️ File ảnh KHÔNG nên > 1MB
- ⚠️ Nên dùng ảnh chân dung (headshot)
- ⚠️ Tránh ảnh có background phức tạp
- ✅ Nên crop thành hình vuông
- ✅ Nên dùng PNG với transparent background

## Test

Sau khi thêm ảnh:
1. Reload trang (Ctrl+F5)
2. Mở DevTools (F12) → Network tab
3. Check xem ảnh có load không
4. Nếu không load, check Console có lỗi gì

## Kích thước ảnh Avatar trong UI

| Location | Size |
|----------|------|
| Sidebar footer | 32x32px |
| Messages (nếu dùng) | 32x32px |
| Mobile sidebar | 32x32px |

→ Upload ảnh **256x256px** là đủ (browser sẽ tự scale)
