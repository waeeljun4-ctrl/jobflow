/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],
    theme: {
        extend: {
            colors: {
                ink: {
                    DEFAULT: '#161B22',
                    2: '#1F2530',
                },
                slate: {
                    DEFAULT: '#475467',
                },
                cream: {
                    DEFAULT: '#F7F8FA',
                    2: '#EEF0F3',
                    3: '#E2E5EA',
                },
                muted: '#6B7280',
                primary: {
                    DEFAULT: '#2563EB',
                    light: '#3B82F6',
                    pale: '#EFF4FF',
                    dark: '#1D4ED8',
                },
                stage: {
                    locked: '#9CA3AF',
                    available: '#2563EB',
                    progress: '#D97706',
                    done: '#16A34A',
                },
            },
            fontFamily: {
                cairo: ['Cairo', 'sans-serif'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
};
