import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function AnimatedBackground() {
    return (_jsxs("div", { className: "fixed inset-0 -z-10 overflow-hidden bg-white dark:bg-slate-950", children: [_jsxs("div", { className: "absolute inset-0", children: [_jsx("div", { className: "absolute h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl animate-wave-slow", style: {
                            animation: 'wave1 20s ease-in-out infinite',
                            top: '10%',
                            left: '5%',
                        } }), _jsx("div", { className: "absolute h-96 w-96 rounded-full bg-blue-500/10 blur-3xl", style: {
                            animation: 'wave2 25s ease-in-out infinite',
                            top: '50%',
                            right: '10%',
                        } }), _jsx("div", { className: "absolute h-96 w-96 rounded-full bg-cyan-500/8 blur-3xl", style: {
                            animation: 'wave3 30s ease-in-out infinite',
                            bottom: '15%',
                            left: '20%',
                        } }), _jsx("div", { className: "absolute h-80 w-80 rounded-full bg-teal-500/8 blur-3xl", style: {
                            animation: 'wave4 22s ease-in-out infinite',
                            top: '30%',
                            right: '25%',
                        } })] }), _jsx("style", { children: `
        @keyframes wave1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          33% {
            transform: translate(50px, -30px) scale(1.1);
            opacity: 0.8;
          }
          66% {
            transform: translate(-30px, 40px) scale(0.9);
            opacity: 0.5;
          }
        }

        @keyframes wave2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          25% {
            transform: translate(-40px, 50px) scale(1.15);
            opacity: 0.7;
          }
          50% {
            transform: translate(30px, -40px) scale(0.95);
            opacity: 0.6;
          }
          75% {
            transform: translate(50px, 30px) scale(1.05);
            opacity: 0.8;
          }
        }

        @keyframes wave3 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.4;
          }
          40% {
            transform: translate(60px, -50px) scale(1.2) rotate(45deg);
            opacity: 0.7;
          }
          80% {
            transform: translate(-50px, 60px) scale(0.85) rotate(-30deg);
            opacity: 0.5;
          }
        }

        @keyframes wave4 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translate(-60px, -60px) scale(1.3);
            opacity: 0.8;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .absolute {
            animation: none !important;
          }
        }
      ` })] }));
}
