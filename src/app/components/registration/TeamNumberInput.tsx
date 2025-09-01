"use client";

type Availability = {
  isAvailable: boolean;
  existingRegistration?: { registrationDate: number } | null;
} | undefined;

type TeamNumberInputProps = {
  teamNumber: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  canContinue: boolean;
  availability: Availability;
  isValid: boolean;
};

export function TeamNumberInput({
  teamNumber,
  onChange,
  onContinue,
  canContinue,
  availability,
  isValid,
}: TeamNumberInputProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Step 1: Enter Your Team Number</h2>
          <p className="text-slate-600">Please enter your FTC team number to begin the registration process.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Team Number</label>
          <div className="flex gap-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              value={teamNumber}
              onChange={(e) => onChange(e.target.value)}
              className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                teamNumber && !isValid
                  ? "border-red-400 focus:ring-red-500 focus:border-transparent"
                  : "border-slate-300 focus:ring-orange-500 focus:border-transparent"
              }`}
              placeholder="Enter team number"
              aria-invalid={teamNumber ? !isValid : undefined}
              aria-describedby="teamNumberHelp"
            />
            <button
              onClick={onContinue}
              disabled={!canContinue}
              className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Continue
            </button>
          </div>
          <p id="teamNumberHelp" className="mt-2 text-sm text-slate-500">
            Must be 4 or 5 digits.
          </p>
          {teamNumber && !isValid && (
            <p className="text-sm text-red-600">Team number is invalid. Please try again.</p>
          )}
        </div>

        {teamNumber && availability && (
          <div className="mt-4">
            {availability.isAvailable ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Team number is available</span>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Team {teamNumber} is already registered</span>
                </div>
                {availability.existingRegistration && (
                  <p className="text-sm text-red-600 mt-2">
                    Registered on: {new Date(availability.existingRegistration.registrationDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
