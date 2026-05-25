import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 font-sans text-slate-100 p-8 relative overflow-hidden">
      {/* Decorative blurred glow objects */}
      <div className="absolute top-[15%] left-[25%] w-72 h-72 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[25%] w-80 h-80 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="mb-8 text-center z-10">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-sky-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2 tracking-tight">
          EchoDocs
        </h1>
        <p className="text-slate-400 text-sm font-light">
          AI-Powered RAG Knowledge Engine
        </p>
      </div>
      
      <div className="shadow-2xl shadow-black/50 rounded-2xl overflow-hidden backdrop-blur-md border border-white/10 z-10">
        <SignIn
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#a855f7',
              colorBackground: '#0f172a',
              colorInputBackground: '#1e293b',
              colorText: '#f8fafc',
              colorTextSecondary: '#94a3b8',
              colorInputText: '#f8fafc',
              colorBorder: '#334155',
            },
            elements: {
              card: {
                background: '#0f172a',
                border: 'none',
              },
              headerTitle: {
                color: '#f8fafc',
              },
              headerSubtitle: {
                color: '#94a3b8',
              },
              formFieldLabel: {
                color: '#f8fafc',
              },
              dividerText: {
                color: '#64748b',
              },
              footerActionText: {
                color: '#94a3b8',
              },
              socialButtonsBlockButton: {
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                '&:hover': {
                  background: '#334155',
                }
              },
              formButtonPrimary: {
                background: 'linear-gradient(to right, #8b5cf6, #d946ef)',
                border: 'none',
                color: '#ffffff',
                '&:hover': {
                  background: 'linear-gradient(to right, #7c3aed, #c084fc)',
                }
              },
              footerActionLink: {
                color: '#c084fc',
                '&:hover': {
                  color: '#a855f7',
                }
              }
            }
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
