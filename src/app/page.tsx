"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export default function Home() {
  const [teamNumber, setTeamNumber] = useState("");
  // Map of regular venueId -> selected timeSlotId
  const [selectedRegular, setSelectedRegular] = useState<Record<string, string>>({});
  // Selected championship timeSlotId
  const [selectedChampionship, setSelectedChampionship] = useState<string>("");
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const timeSlots = useQuery(api.timeSlots.getAvailable);
  const registrationStatus = useQuery(api.registrations.isRegistrationOpen);
  const teamAvailability = useQuery(
    api.registrations.checkTeamAvailability,
    teamNumber ? { teamNumber } : "skip"
  );
  // Use the new bulk selections mutation; cast until Convex codegen updates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registerSelections = useMutation((api as any).registrations.registerSelections);

  const handleTeamNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamNumber(e.target.value);
    setShowRegistrationForm(false);
    setSelectedRegular({});
    setSelectedChampionship("");
  };

  const handleProceed = () => {
    if (teamAvailability?.isAvailable && registrationStatus?.isOpen) {
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
      alert("Please pick one day for each regular venue (Venue 1, Venue 2, Venue 3).");
      return;
    }
    if (!selectedChampionship) {
      alert("Please pick one championship day.");
      return;
    }

    try {
      const result = await registerSelections({
        teamNumber,
        selections: {
          regular: selectedRegularIds as any,
          championship: selectedChampionship as any,
        },
      });
      
      alert(result.message);
      // Reset form
      setTeamNumber("");
      setSelectedRegular({});
      setSelectedChampionship("");
      setShowRegistrationForm(false);
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
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                FIRST Tech Challenge
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                League Selection
              </h1>
              <p className="text-lg text-slate-600 max-w-lg mx-auto">
                Team registration and venue selection portal
              </p>
            </div>
            
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
                  {registrationStatus.deadlineFormatted 
                    ? `Registration deadline was: ${registrationStatus.deadlineFormatted}`
                    : "Registration is currently not available"
                  }
                </p>
                <div className="mt-6 text-sm text-slate-500">
                  Please contact your league coordinator for more information.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              FIRST Tech Challenge
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              League Selection
            </h1>
            <p className="text-lg text-slate-600 max-w-lg mx-auto">
              Team registration and venue selection portal
            </p>
          </div>

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

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium">1</div>
                <span className="ml-2 text-sm font-medium text-slate-700">Enter Team Number</span>
              </div>
              <div className="w-16 h-0.5 bg-slate-300"></div>
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  showRegistrationForm ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-500'
                }`}>2</div>
                <span className={`ml-2 text-sm font-medium ${
                  showRegistrationForm ? 'text-slate-700' : 'text-slate-500'
                }`}>Pick Venue 1, 2, 3 days + Championship</span>
              </div>
            </div>
          </div>

          {/* Team Number Input */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Step 1: Enter Your Team Number</h2>
                <p className="text-slate-600">Please enter your FTC team number to begin the registration process.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Team Number
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={teamNumber}
                    onChange={handleTeamNumberChange}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter team number (e.g., 12345)"
                  />
                  <button
                    onClick={handleProceed}
                    disabled={!teamNumber || !teamAvailability?.isAvailable || !registrationStatus?.isOpen}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
              
              {teamNumber && teamAvailability && (
                <div className="mt-4">
                  {teamAvailability.isAvailable ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-lg">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Team number is available</span>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Team {teamNumber} is already registered</span>
                      </div>
                      {teamAvailability.existingRegistration && (
                        <p className="text-sm text-red-600 mt-2">
                          Registered on: {new Date(teamAvailability.existingRegistration.registrationDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

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
                  <p className="text-slate-600">Pick one day for each regular venue (Venue 1, Venue 2, Venue 3), and one championship day.</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                {(() => {
                  if (!timeSlots) return null;
                  const regular = timeSlots.filter((s) => s.venueType === "regular");
                  const byVenue = regular.reduce<Record<string, typeof regular>>((acc, s) => {
                    const key = String(s.venueId);
                    acc[key] = acc[key] || [];
                    acc[key].push(s);
                    return acc;
                  }, {});
                  const venueOrder = Object.keys(byVenue);

                  return (
                    <div className="space-y-6">
                      {venueOrder.map((venueId) => {
                        const slots = byVenue[venueId].sort((a, b) => a.day.localeCompare(b.day));
                        const venueName = slots[0]?.venueName ?? "Venue";
                        const selected = selectedRegular[venueId];
                        return (
                          <div key={venueId} className="border border-slate-200 rounded-xl p-5">
                            <div className="mb-3 font-semibold text-slate-900">{venueName}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {slots.map((slot) => (
                                <label
                                  key={slot._id}
                                  className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                                    !slot.isAvailable
                                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                      : selected === slot._id
                                      ? "border-blue-500 bg-blue-50 shadow"
                                      : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`regular-${venueId}`}
                                    value={slot._id}
                                    checked={selected === slot._id}
                                    onChange={() => setSelectedRegular((prev) => ({ ...prev, [venueId]: String(slot._id) }))}
                                    disabled={!slot.isAvailable}
                                    className="sr-only"
                                  />
                                  {selected === slot._id && slot.isAvailable && (
                                    <div className="absolute top-3 right-3">
                                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    <div className="text-slate-700">{slot.day}</div>
                                    <div className="flex items-center justify-between">
                                      <div className={`text-xs font-medium ${slot.isAvailable ? "text-green-600" : "text-red-600"}`}>
                                        {slot.isAvailable ? `${slot.spotsRemaining} spots left` : "FULL"}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {slot.currentCount}/{slot.capacity}
                                      </div>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${slot.isAvailable ? "bg-green-500" : "bg-red-500"}`}
                                        style={{ width: `${(slot.currentCount / slot.capacity) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Championship selection */}
                {(() => {
                  if (!timeSlots) return null;
                  const champ = timeSlots.filter((s) => s.venueType === "championship").sort((a, b) => a.day.localeCompare(b.day));
                  if (champ.length === 0) return null;
                  const venueName = champ[0].venueName;
                  return (
                    <div className="border border-slate-200 rounded-xl p-5">
                      <div className="mb-3 font-semibold text-slate-900">{venueName}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {champ.map((slot) => (
                          <label
                            key={slot._id}
                            className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                              !slot.isAvailable
                                ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                                : selectedChampionship === slot._id
                                ? "border-blue-500 bg-blue-50 shadow"
                                : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
                            }`}
                          >
                            <input
                              type="radio"
                              name="championship"
                              value={slot._id}
                              checked={selectedChampionship === slot._id}
                              onChange={() => setSelectedChampionship(String(slot._id))}
                              disabled={!slot.isAvailable}
                              className="sr-only"
                            />
                            {selectedChampionship === slot._id && slot.isAvailable && (
                              <div className="absolute top-3 right-3">
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <div className="space-y-2">
                              <div className="text-slate-700">{slot.day}</div>
                              <div className="flex items-center justify-between">
                                <div className={`text-xs font-medium ${slot.isAvailable ? "text-green-600" : "text-red-600"}`}>
                                  {slot.isAvailable ? `${slot.spotsRemaining} spots left` : "FULL"}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {slot.currentCount}/{slot.capacity}
                                </div>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${slot.isAvailable ? "bg-green-500" : "bg-red-500"}`}
                                  style={{ width: `${(slot.currentCount / slot.capacity) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="submit"
                  className="w-full py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-lg transition-colors"
                >
                  Submit Selections
                </button>
              </form>
            </div>
          )}

          {/* Available Slots Overview */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Available Slots Overview</h2>
                <p className="text-slate-600">Current availability across all venues and days</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeSlots?.map((slot) => (
                <div
                  key={slot._id}
                  className={`border-2 rounded-xl p-5 transition-all ${
                    slot.isAvailable 
                      ? "border-green-200 bg-green-50" 
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="font-semibold text-slate-900">{slot.venueName}</div>
                    <div className="text-sm text-slate-600">{slot.day}</div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        slot.isAvailable ? "text-green-700" : "text-red-700"
                      }`}>
                        {slot.currentCount}/{slot.capacity} teams
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        slot.isAvailable 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {slot.isAvailable ? "Available" : "Full"}
                      </span>
                    </div>
                    
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          slot.isAvailable ? "bg-green-500" : "bg-red-500"
                        }`}
                        style={{ width: `${(slot.currentCount / slot.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}