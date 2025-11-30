"use client";

interface ArcadePerformer {
  name: string;
  cards: number;
  location: string;
  rank: number;
}

const arcadePerformers: ArcadePerformer[] = [
  { name: "Olivia", cards: 44, location: "QT", rank: 1 },
  { name: "Hannah", cards: 33, location: "CHC", rank: 2 },
  { name: "Miki", cards: 24, location: "CHC", rank: 3 },
  { name: "Sarah", cards: 22, location: "AKL", rank: 4 },
  { name: "Mike", cards: 21, location: "AKL", rank: 5 },
  { name: "Emma", cards: 19, location: "QT", rank: 6 },
  { name: "David", cards: 18, location: "CHC", rank: 7 },
  { name: "Lisa", cards: 15, location: "AKL", rank: 8 },
  { name: "Tom", cards: 14, location: "QT", rank: 9 },
  { name: "Alex", cards: 12, location: "CHC", rank: 10 },
];

export default function IndividualArcadeTab() {
  const getPillStyle = (rank: number) => {
    if (rank <= 3) {
      return "bg-[#10B981] text-white";
    } else if (rank >= 8) {
      return "bg-[#EF4444] text-white";
    }
    return "bg-gray-100 text-[#374151]";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-2xl font-semibold text-[#0A0A0A] mb-6">
        Individual Arcade Performance
      </h2>
      <div className="space-y-3">
        {arcadePerformers.map((performer) => (
          <div
            key={`${performer.name}-${performer.rank}`}
            className={`flex items-center justify-between px-4 py-3 rounded-lg ${getPillStyle(
              performer.rank
            )}`}
          >
            <span className="text-sm font-medium uppercase tracking-wide">
              {performer.name} {performer.cards} CARDS – {performer.location}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

