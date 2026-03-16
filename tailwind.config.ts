
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		extend: {
			colors: {
				"poke-red": "#ef4444",
				"poke-cyan": "#00f0ff",
				"poke-yellow": "#ffd700",
				"poke-green": "#22c55e",
				"poke-blue": "#3b82f6",
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'rotate-rock': {
					'0%': { transform: 'rotate(-10deg)' },
					'50%': { transform: 'rotate(10deg)' },
					'100%': { transform: 'rotate(-10deg)' }
				}
			},
			animation: {
				'fade-in': 'fade-in 0.5s ease-out',
				'spin-slow': 'spin-slow 6s linear infinite',
				'rotate-gentle': 'rotate-rock 4s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
