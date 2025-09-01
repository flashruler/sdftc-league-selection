"use client";

type StepIndicatorProps = {
  active: boolean;
};

export function StepIndicator({ active }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium">
            1
          </div>
          <span className="ml-2 text-sm font-medium text-slate-700">
            Enter Team Number
          </span>
        </div>
        <div className="w-16 h-0.5 bg-slate-300"></div>
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              active ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-500"
            }`}
          >
            2
          </div>
          <span
            className={`ml-2 text-sm font-medium ${
              active ? "text-slate-700" : "text-slate-500"
            }`}
          >
            Pick your league and events!
          </span>
        </div>
      </div>
    </div>
  );
}
