// // tailwind.config.js
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         primary: {
//           default: "#009689",   // màu chính
//           hover: "#009699",      // khi hover
//           light: "#33b3a2",     // nhạt hơn nếu cần
//         },
//       },
//     },
//   },
//   plugins: [],
// };
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
          default: "#009689",   // màu chính
          hover: "#009699",      // khi hover
          light: "#33b3a2",     // nhạt hơn nếu cần
        },
        instagram: {
          blue: "#0095f6",
          red: "#ed4956",
          purple: "#8a3ab9",
          yellow: "#fccc63",
        }
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionProperty: {
        'width': 'width',
        'height': 'height',
      }
    },
  },
  plugins: [],
};
