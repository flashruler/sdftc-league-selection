"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { Header } from "./components/registration/Header";
import { StepIndicator } from "./components/registration/StepIndicator";
import { TeamNumberInput } from "./components/registration/TeamNumberInput";
import { RegularVenueSelector } from "./components/registration/RegularVenueSelector";
import { ChampionshipSelector } from "./components/registration/ChampionshipSelector";
import { SlotsOverview } from "./components/registration/SlotsOverview";
import { RegistrationClosedCard } from "./components/registration/RegistrationClosedCard";

export default function Home() {
  const [teamNumber, setTeamNumber] = useState("");
  // Map of regular venueId -> selected timeSlotId
  const [selectedRegular, setSelectedRegular] = useState<Record<string, string>>({});
  // Selected championship timeSlotId
  const [selectedChampionship, setSelectedChampionship] = useState<string>("");
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  // Optional confirmation email
  const [wantsEmail, setWantsEmail] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  const timeSlots = useQuery(api.timeSlots.getAvailable);
  const registrationStatus = useQuery(api.registrations.isRegistrationOpen);
  const isValidTeam = /^\d{1,5}$/.test(teamNumber);
  const teamAvailability = useQuery(
    api.registrations.checkTeamAvailability,
    teamNumber && isValidTeam ? { teamNumber } : "skip"
  );
  const registerSelections = useMutation(api.registrations.registerSelections);

  const handleTeamNumberChange = (value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 5);
    setTeamNumber(sanitized);
    setShowRegistrationForm(false);
    setSelectedRegular({});
    setSelectedChampionship("");
    setWantsEmail(false);
    setConfirmEmail("");
  };

  const handleProceed = () => {
    if (isValidTeam && teamAvailability?.isAvailable && registrationStatus?.isOpen) {
      setShowRegistrationForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNumber) return;

    // Build selection payload
    if (!timeSlots) return;

    const regularSlots = timeSlots.filter((s) => s.venueType === "regular");
    const regularVenueIds = Array.from(new Set(regularSlots.map((s) => s.venueId)));
    const selectedRegularIds = regularVenueIds
      .map((vid) => selectedRegular[String(vid)])
      .filter(Boolean);

    if (selectedRegularIds.length !== regularVenueIds.length) {
      alert("Please pick one day for each league meet.");
      return;
    }
    if (!selectedChampionship) {
      alert("Please pick a League Championship");
      return;
    }

    try {
      const result = await registerSelections({
        teamNumber,
        selections: {
          regular: selectedRegularIds as unknown as Id<"timeSlots">[],
          championship: selectedChampionship as unknown as Id<"timeSlots">,
        },
        ...(wantsEmail && confirmEmail ? { email: confirmEmail.trim() } : {}),
      });

      alert(result.message);
      // Reset form
      setTeamNumber("");
      setSelectedRegular({});
      setSelectedChampionship("");
      setShowRegistrationForm(false);
      setWantsEmail(false);
      setConfirmEmail("");
    } catch (error) {
      alert(`Error: ${error}`);
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

          <StepIndicator active={showRegistrationForm} />

          <TeamNumberInput
            teamNumber={teamNumber}
            onChange={handleTeamNumberChange}
            onContinue={handleProceed}
            canContinue={Boolean(isValidTeam && teamAvailability?.isAvailable && registrationStatus?.isOpen)}
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
                  <h2 className="text-xl font-semibold text-slate-900">Step 2: Make Your Selections</h2>
                  <p className="text-slate-600">Pick a League and a day for each league meet.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <ChampionshipSelector
                  timeSlots={timeSlots}
                  selected={selectedChampionship}
                  onSelect={setSelectedChampionship}
                />
                <RegularVenueSelector
                  timeSlots={timeSlots}
                  selectedRegular={selectedRegular}
                  onSelect={(venueId, slotId) => setSelectedRegular((prev) => ({ ...prev, [venueId]: slotId }))}
                />

                {/* Optional confirmation email */}
                <div className="mt-2 space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wantsEmail}
                      onChange={(e) => setWantsEmail(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-slate-700">Email me a confirmation receipt</span>
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    placeholder="coach@example.org"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    disabled={!wantsEmail}
                    className={`w-full rounded-lg border px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      wantsEmail ? "border-slate-300" : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  />
                  <p className="text-xs text-slate-500">Optional. We’ll send your selections to this address.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-lg transition-colors"
                >
                  Submit Selections
                </button>
              </form>
            </div>
          )}

          {!showRegistrationForm && <SlotsOverview timeSlots={timeSlots} />}
        </div>
      </div>
    </main>
  );
}