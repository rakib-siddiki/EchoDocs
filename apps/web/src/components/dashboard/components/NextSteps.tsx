'use client';

export function NextSteps() {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full text-left">
      <h2 className="text-lg font-semibold mb-2">Next Steps</h2>
      <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
        <li>Upload documents to seed your vector database</li>
        <li>Connect your GitHub repository for automated sync</li>
        <li>Navigate to the chat to query grounded responses</li>
      </ul>
    </div>
  );
}
