"use client";

type HeaderProps = {
  title?: string;
  subtitle?: string;
};

export function Header({
  title = "League Selection",
  subtitle = "Team registration and venue selection portal",
}: HeaderProps) {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
        {title}
      </h1>
      <p className="text-lg text-slate-600 max-w-lg mx-auto">{subtitle}</p>
    </div>
  );
}
