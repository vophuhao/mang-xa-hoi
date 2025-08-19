// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dèault: "#009689",   // màu chính
          hover: "#009699",      // khi hover
          light: "#33b3a2",     // nhạt hơn nếu cần
        },
      },
    },
  },
  plugins: [],
};
