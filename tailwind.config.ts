import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"./1777700128326551622.html"
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				oswald: ['Oswald', 'sans-serif'],
				roboto: ['Roboto', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				neon: {
					green: '#00FF87',
					yellow: '#FFD700',
					red: '#FF3B3B',
					blue: '#00B4FF',
				},
				sport: {
					dark: '#080C10',
					card: '#0F1519',
					border: '#1A2430',
					surface: '#141C24',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(16px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in-right': {
					from: { opacity: '0', transform: 'translateX(30px)' },
					to: { opacity: '1', transform: 'translateX(0)' }
				},
				'pulse-neon': {
					'0%, 100%': { boxShadow: '0 0 8px #00FF87, 0 0 20px #00FF8740' },
					'50%': { boxShadow: '0 0 16px #00FF87, 0 0 40px #00FF8780' }
				},
				'ticker': {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(-50%)' }
				},
				'blink': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.3' }
				},
				'count-up': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out forwards',
				'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
				'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
				'ticker': 'ticker 30s linear infinite',
				'blink': 'blink 1.5s ease-in-out infinite',
				'count-up': 'count-up 0.3s ease-out forwards',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
