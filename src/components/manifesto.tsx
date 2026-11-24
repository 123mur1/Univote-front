// Long manifestos collapse to a few lines with a native, keyboard-friendly toggle.
export function Manifesto({ text }: { text: string }) {
  if (!text) return null;
  if (text.length < 180) return <p className="mt-4 border-l-2 border-urblue-200 pl-3 text-sm leading-relaxed text-slate-700">{text}</p>;
  return (
    <details className="group/m mt-4">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <p className="border-l-2 border-urblue-200 pl-3 text-sm leading-relaxed text-slate-700 line-clamp-3 group-open/m:line-clamp-none">{text}</p>
        <span className="mt-2 inline-block pl-3 text-xs font-bold text-urblue group-open/m:hidden">Read full manifesto</span>
        <span className="mt-2 hidden pl-3 text-xs font-bold text-urblue group-open/m:inline-block">Show less</span>
      </summary>
    </details>
  );
}
