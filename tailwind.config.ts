export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
        extend: {
            keyframes: {
                'shutter-press': {
                    '0%, 100%': {
                        transform: 'scale(1)'
                    },

                    '50%': {
                        transform: 'scale(0.8)'
                    }
                },

                'button-press': {
                    '0%, 100%': {
                        transform: 'scale(1)'
                    },

                    '10%': {
                        transform: 'scale(1.05)'
                    },

                    '50%': {
                        transform: 'scale(0.8)'
                    }
                }
            },

            animation: {
                'shutter-press': 'shutter-press 0.15s ease-in-out',
                'button-press': 'button-press 0.15s ease-in-out'
            }
        },
    },
    plugins: [],
}

