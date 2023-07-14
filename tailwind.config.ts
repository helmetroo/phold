export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
        extend: {
            keyframes: {
                'button-press': {
                    '0%, 100%': {
                        transform: 'scale(1)'
                    },

                    '50%': {
                        transform: 'scale(0.8)'
                    }
                }
            },

            animation: {
                'button-press': 'button-press 0.15s ease-in-out'
            }
        },
    },
    plugins: [],
}

