# 📱 Mạng Xã Hội - React & Express

Dự án này mô phỏng một mạng xã hội đơn giản với các tính năng đăng ký, đăng nhập, đăng bài, xem bài viết và tương tác. Frontend được xây dựng bằng **React** và backend bằng **ExpressJS**.

---

## 🚀 1. Công nghệ sử dụng

### **Frontend (React)**

* ReactJS + Vite 
* React Router DOM
* Axios
* Redux 
* TailwindCSS 

### **Backend (Express)**

* NodeJS + Express
* MongoDB + Mongoose 
* JWT Authentication
* Bcrypt
* Multer 

---

## ✅ 2. Chức năng chính

### 👤 **Người dùng**

* Đăng ký
* Đăng nhập (JWT)
* Cập nhật thông tin cá nhân
* Upload avatar

### 📝 **Bài viết**

* Tạo bài viết (văn bản + hình ảnh)
* Xem danh sách bài viết
* Like / Unlike
* Tạo danh sách yêu thích
* Chat trực tuyến
* Đăng story
* Comment

### 🔐 **Bảo mật**

* Gọi API với JWT Token
* Middleware xác thực backend

---

## 📁 3. Cấu trúc thư mục

### **Frontend**

```
web/
│── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── hooks/
│   ├── services/
│   └── App.jsx
└── package.json
```

### **Backend**

```
server/
│── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── index.js
└── package.json
```

---

## 🛠 4. Cài đặt dự án

### **Clone repo**

```
git clone <url-project>
cd project
```

### **Cài đặt frontend**

```
cd web
npm install
npm run dev
```

### **Cài đặt backend**

```
cd server
npm install
npm run dev
```

---

## 🔧 5. Cấu hình môi trường

Tạo file `.env` trong thư mục **server**:

```
PORT=****
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
```

---

## 📌 6. API chính

### 🔑 **Auth**

* POST `/auth/register`
* POST `/auth/login`
* GET `/auth/me`

### 📝 **Posts**

* POST `/posts`
* GET `/posts`
* POST `/posts/:id/like`
* POST `/posts/:id/comment`

---

## ✅ 7. Chạy toàn dự án

```
# Chạy backend
cd server
npm run dev

# Chạy frontend
cd web
npm run dev
```

---


Nếu muốn mình viết thêm **cấu trúc database**, **API chi tiết**, **diagram**, hoặc **demo UI**, cứ nói mình nhé!
