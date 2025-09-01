"use client";

type Props = {
  deadlineFormatted?: string | null;
};

export function RegistrationClosedCard({ deadlineFormatted }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
        <div className="flex items-center gap-3 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold">Registration Closed</h2>
        </div>
      </div>
      <div className="p-8 text-center">
        <p className="text-slate-700 text-lg">
          {deadlineFormatted
            ? `Registration deadline was: ${deadlineFormatted}`
            : "Registration is currently not available"}
        </p>
        <div className="mt-6 text-sm text-slate-500">
          Please contact your league coordinator for more information.
        </div>
      </div>
    </div>
  );
}
