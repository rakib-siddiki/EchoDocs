'use client';

export default function ChatContainer() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto text-center">
      <h1 className="text-4xl font-extrabold mb-4">
        Welcome to the Chat Interface
      </h1>
      <p className="text-slate-400 text-lg mb-8 max-w-lg">
        Here you will be able to query your RAG knowledge engine and get cited answers.
        You can use the User menu in the top right to sign out.
      </p>
    </main>
  );
}
