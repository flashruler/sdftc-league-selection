"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Day } from "../../convex/lib/schedule";
import { useState } from "react";
import { Header } from "./components/registration/Header";
import { TeamNumberInput } from "./components/registration/TeamNumberInput";
import { ScheduleSelector, DAY_LABEL } from "./components/registration/ScheduleSelector";
import { RegistrationClosedCard } from "./components/registration/RegistrationClosedCard";
import { ConfirmationDialog, type RegistrationSummary } from "./components/registration/ConfirmationDialog";

export default function Home() {
  const [teamNumber, setTeamNumber] = useState("");
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Required confirmation email
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmation, setConfirmation] = useState<RegistrationSummary | null>(null);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(confirmEmail.trim());

  const schedules = useQuery(api.timeSlots.getSchedules);
  const registrationStatus = useQuery(api.registrations.isRegistrationOpen);
  const isValidTeam = /^\d{1,5}$/.test(teamNumber);
  const teamAvailability = useQuery(
    api.registrations.checkTeamAvailability,
    teamNumber && isValidTeam ? { teamNumber } : "skip"
  );
  const registerDay = useMutation(api.registrations.registerDay);
  const showRegistrationForm = Boolean(isValidTeam && teamAvailability?.isAvailable && registrationStatus?.isOpen);
  // A day can become unavailable while the page is open (filled up or closed by an admin)
  const canSubmit = Boolean(isValidEmail && selectedDay && !schedules?.[selectedDay].unavailable && !submitting);

  const handleTeamNumberChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 5);
    setTeamNumber(sanitized);
    setSelectedDay(null);
    setConfirmEmail("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedDay) return;
    setSubmitting(true);
    try {
      const result = await registerDay({ teamNumber, day: selectedDay, email: confirmEmail.trim() });
      setConfirmation(result.summary);
      // Reset form
      setTeamNumber("");
      setSelectedDay(null);
      setConfirmEmail("");
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message.replace(/^.*Uncaught Error: /, "").split("\n")[0] : error}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Show registration closed message if not open
  if (registrationStatus && !registrationStatus.isOpen) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Header />
            <RegistrationClosedCard deadlineFormatted={registrationStatus.deadlineFormatted} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Header />

          {/* Registration Deadline Info */}
          {registrationStatus?.deadlineFormatted && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 text-amber-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">
                  <strong>Registration Deadline:</strong> {registrationStatus.deadlineFormatted}
                </p>
              </div>
            </div>
          )}

          <ConfirmationDialog summary={confirmation} onClose={() => setConfirmation(null)} />

          <TeamNumberInput
            teamNumber={teamNumber}
            onChange={handleTeamNumberChange}
            availability={teamAvailability}
            isValid={isValidTeam}
          />

          {/* Registration Form */}
          {showRegistrationForm && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Choose Your Schedule</h2>
                  <p className="text-slate-600">Saturday or Sunday, for the whole season.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <ScheduleSelector schedules={schedules} selected={selectedDay} onSelect={setSelectedDay} />

                {/* Required confirmation email */}
                <div className="mt-2 space-y-2">
                  <label htmlFor="confirm-email" className="block text-slate-700 font-medium">
                    Email for confirmation receipt
                  </label>
                  <input
                    id="confirm-email"
                    type="email"
                    inputMode="email"
                    required
                    placeholder="coach@example.org"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500">Required. We’ll send your schedule to this address.</p>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-lg transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {submitting ? "Registering…" : selectedDay ? `Register as a ${DAY_LABEL[selectedDay]} team` : "Choose a schedule"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}