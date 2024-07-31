# Các kiến thức mới

## Một số toán tử đặc biệt trong MongooDB

1. `$push`: Thêm một phần tử vào mảng.
2. `$set`: Cập nhật giá trị của một trường.
3. `$inc`: Tăng giá trị của một trường số học.
4. `$pull`: Xóa phần tử khỏi mảng.
5. `$addToSet`: Thêm một phần tử vào mảng nếu phần tử đó chưa tồn tại trong mảng.

## Phương thức cần lưu ý

1. `save()`:
   1. Phương thức save() sẽ lưu các thay đổi của tài liệu vào cơ sở dữ liệu.
   2. **save()** `không thực hiện` **populate lại** các `trường liên quan`. ( tức là nếu thay đổi các trường populate thì lúc trả về sẽ k trả về populate của trường bị thay đổi)

2. `Regex trong MongoDB` là một hàm được biểu hiện bởi cú pháp $regex
   1. `cung cấp khả năng` **tìm kiếm** các chuỗi match với **biểu thức chính quy** mà chúng ta sử dụng trong truy vấn