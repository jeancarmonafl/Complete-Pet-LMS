module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#004B87',
        secondary: '#12B981'
      },
      boxShadow: {
        card: '0px 10px 30px rgba(15, 23, 42, 0.05)'
      }
    }
  },
  plugins: []
};
