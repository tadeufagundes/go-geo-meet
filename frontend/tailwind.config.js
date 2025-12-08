/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                // Go Geo Brand Colors
                navy: {
                    50: '#e6eaf2',
                    100: '#c0c9de',
                    200: '#96a5c8',
                    300: '#6c81b2',
                    400: '#4d66a1',
                    500: '#2d4b91',
                    600: '#274489',
                    700: '#1f3b7e',
                    800: '#183274',
                    900: '#142b64', // Primary navy
                },
                cyan: {
                    DEFAULT: '#009FE3',
                    50: '#e0f4fc',
                    100: '#b3e4f7',
                    200: '#80d2f2',
                    300: '#4dc0ed',
                    400: '#26b3e9',
                    500: '#009FE3', // Primary cyan
                    600: '#0091d0',
                    700: '#007fba',
                    800: '#006ea4',
                    900: '#005080',
                },
                gold: {
                    DEFAULT: '#FFD700',
                    50: '#fffde6',
                    100: '#fff9c0',
                    200: '#fff596',
                    300: '#fff16b',
                    400: '#ffed4c',
                    500: '#FFD700', // Primary gold
                    600: '#ffc107',
                    700: '#ffab00',
                    800: '#ff9800',
                    900: '#ff6f00',
                },
            },
            fontFamily: {
                sans: ['Inter', 'Montserrat', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
