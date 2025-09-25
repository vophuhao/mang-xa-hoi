# PostModal - Instagram-style Post Modal

PostModal là component modal giống Instagram để hiển thị chi tiết bài viết với khả năng tương tác comment.

## Cấu trúc

PostModal được chia thành 5 phần chính:

### 1. **PostMedia** (Bên trái)

- Hiển thị hình ảnh/video của bài viết
- Responsive: chiếm toàn bộ chiều rộng trên mobile, 50% trên desktop
- Background đen để làm nổi bật media

### 2. **PostHeader** (Bên phải - trên cùng)

- Thông tin người đăng (avatar, username, location)
- Nút options (3 chấm)

### 3. **CommentList** (Bên phải - giữa)

- Danh sách tất cả comments
- Scroll được với max-height
- Loading states và empty states
- Mỗi comment có:
  - Avatar và username của người comment
  - Nội dung comment
  - Thời gian đăng (format: 1s, 2m, 3h, 4d)
  - Số lượng like
  - Nút "Trả lời"
  - Nút like (hiện khi hover)
  - Menu options cho chủ comment (Edit/Delete)

### 4. **PostActions** (Bên phải - dưới comment list)

- Các nút tương tác: Like, Comment, Share, Save
- Hiển thị số lượng like

### 5. **CommentInput** (Bên phải - dưới cùng)

- Input để đăng comment mới
- Avatar của user hiện tại
- Nút gửi (chỉ active khi có text)
- Nút emoji (placeholder cho tương lai)
- Character counter (2200 ký tự max)

## Tính năng

### Modal Controls

- **Mở modal**: Click vào nút comment trong PostActions hoặc "Xem tất cả bình luận" trong PostComments
- **Đóng modal**:
  - Click nút X (góc phải trên, bên ngoài modal)
  - Click vào backdrop (vùng đen xung quanh modal)
  - Nhấn phím Escape
- **Responsive**: Tự động điều chỉnh layout cho mobile/desktop

### Comment Features

- **Thêm comment**: Gõ và nhấn Enter hoặc click nút Send
- **Like comment**: Click icon tim nhỏ (hiện khi hover)
- **Trả lời comment**: Click "Trả lời" sẽ focus vào input và thêm @username
- **Edit comment**: Chỉ chủ comment mới thấy, inline editing
- **Delete comment**: Chỉ chủ comment mới thấy, có confirmation

### UX Improvements

- **Optimistic updates**: Like/unlike ngay lập tức trước khi API response
- **Loading states**: Skeleton loading cho comments
- **Error handling**: Hiển thị lỗi khi không load được comments
- **Focus management**: Auto focus vào comment input khi click comment button
- **Scroll lock**: Ngăn scroll body khi modal mở
- **Keyboard navigation**: Support Escape để đóng modal

## Cách sử dụng

### 1. Import PostModal vào component cha

```jsx
import PostModal from "@/components/feed/PostModal";
```

### 2. Thêm state quản lý modal

```jsx
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedPost, setSelectedPost] = useState(null);
```

### 3. Render PostModal

```jsx
<PostModal
  post={selectedPost}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onUsernameClick={handleUsernameClick}
  onShareClick={handleShareClick}
/>
```

### 4. Mở modal từ PostActions hoặc PostComments

```jsx
const handleCommentClick = (post) => {
  setSelectedPost(post);
  setIsModalOpen(true);
};
```

## Dependencies

### Hooks được sử dụng:

- `useAuth`: Lấy thông tin user hiện tại
- `useComments`: Load danh sách comments
- `useCommentActions`: Thêm/sửa/xóa/like comments

### Components con:

- `PostMedia`: Hiển thị media
- `PostHeader`: Header với user info
- `PostActions`: Các nút tương tác
- `CommentList`: Danh sách comments
- `CommentInput`: Input đăng comment
- `CommentItem`: Item từng comment

### Icons (Lucide React):

- `X`: Đóng modal
- `Heart`: Like
- `MessageCircle`: Comment
- `Send`: Gửi comment
- `Smile`: Emoji (future)
- `MoreHorizontal`: Options menu

## Responsive Design

- **Desktop (lg+)**: Layout 2 cột, media bên trái, details bên phải
- **Mobile**: Layout 1 cột, media trên, details dưới
- **Max width**: 6xl (1152px)
- **Max height**: 90vh
- **Margin**: 16px từ mép màn hình

## Styling

- **Theme support**: Dark/light mode
- **Colors**: Tailwind CSS classes
- **Animations**: Hover effects, transitions
- **Z-index**: 50 cho modal overlay
- **Backdrop**: Black với 75% opacity

## Performance

- **Lazy loading**: Comments chỉ load khi modal mở
- **Optimistic updates**: UI update ngay, sync với server sau
- **Debounced**: Character counter chỉ update khi cần
- **Memory cleanup**: Remove event listeners khi unmount
