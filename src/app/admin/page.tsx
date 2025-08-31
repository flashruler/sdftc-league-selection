"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

export default function AdminPage() {
  const registrations = useQuery(api.registrations.getAll);
  const timeSlots = useQuery(api.timeSlots.getAvailable);
  const setupVenues = useMutation(api.venues.setup);

  const handleSetupVenues = async () => {
    try {
      const result = await setupVenues({});
      alert(result.message);
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-6">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Admin Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              FTC League Selection
            </h1>
            <p className="text-lg text-slate-600 max-w-lg mx-auto">
              Administrative controls and registration management
            </p>
          </div>

          {/* Setup Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Initial Setup</h2>
                <p className="text-slate-600">Configure venues and time slots for the league</p>
              </div>
            </div>
            <button
              onClick={handleSetupVenues}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Setup Venues & Time Slots
            </button>
            <p className="text-sm text-slate-500 mt-3">
              Click this button to initialize the venues and time slots (only needs to be done once)
            </p>
          </div>

          {/* Capacity Overview */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Capacity Overview</h2>
                <p className="text-slate-600">Current registration status across all venues</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <span className="text-2xl font-bold text-slate-900">
                        {slot.currentCount}/{slot.capacity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        slot.isAvailable 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {slot.isAvailable ? "Available" : "Full"}
                      </span>
                    </div>
                    
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
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

          {/* Registrations Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">All Registrations</h2>
                <p className="text-slate-600">Manage team registrations and assignments</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Team #</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Venue</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Day</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations?.map((registration) => (
                    <tr key={registration._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-slate-900">
                        {registration.teamNumber}
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        {registration.venueName}
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        {registration.day}
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        {new Date(registration.registrationDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {(!registrations || registrations.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 px-4 text-center text-slate-500">
                        No registrations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
