// Highlights dates, years, times, and quantities in body text using the
// tenant's primary gradient — giving admissions-critical info visual weight
// without requiring the content editor to add markup.
//
// Matched patterns (intentionally narrow to avoid false positives):
//   Dates    05/6/2026  01/07  30/6
//   Years    2015  2026
//   Times    8h00  17h30
//   Ranges   05/6 → 08/6  (arrow syntax common in Vietnamese notices)

const HIGHLIGHT_RE =
  /(\d{1,2}\/\d{1,2}(?:\/\d{4})?(?:\s*[→–-]\s*\d{1,2}\/\d{1,2}(?:\/\d{4})?)?|\b20\d{2}\b|\d{1,2}h\d{2})/g;

export function HighlightedText({ text }: { text: string }) {
  const parts = text.split(HIGHLIGHT_RE);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-semibold text-transparent"
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
