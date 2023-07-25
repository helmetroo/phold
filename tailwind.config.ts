export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
        extend: {
            keyframes: {
                'fade-out': {
                    '0%': {
                        opacity: 1
                    },

                    '100%': {
                        opacity: 0
                    }
                },

                'shutter-flash': {
                    '0%, 100%': {
                        background: 'rgba(255,255,255,0)'
                    },

                    '50%': {
                        background: 'rgba(255,255,255,1)'
                    }
                },

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
                'fade-out': 'fade-out 0.25s ease-out',
                'shutter-flash': 'shutter-flash 0.25s ease-in-out',
                'shutter-press': 'shutter-press 0.15s ease-in-out',
                'button-press': 'button-press 0.15s ease-in-out'
            }
        },
    },
    plugins: [],
}

