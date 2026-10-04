import { useState, useEffect, useRef } from "react";

// Inline-editable name. An empty value shows `placeholder` (e.g. "You") in a lighter style.
export function EditableName({ value, placeholder, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  function commit() {
    const t = draft.trim();
    if (t) onChange(t); else setDraft(value);
    setEditing(false);
  }
  if (editing) {
    return (
      <input ref={inputRef} value={draft} placeholder={placeholder} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className="bg-transparent border-b border-amber-400 outline-none font-mono text-xs text-stone-500 placeholder-stone-300 w-16" />
    );
  }
  return (
    <button type="button" onClick={() => { setDraft(value); setEditing(true); }} title="Click to rename"
      className={`group inline-flex items-center gap-1 font-mono text-xs hover:text-amber-600 transition-colors ${value ? "text-stone-500" : "text-stone-400 italic"}`}>
      {value || placeholder}
      <svg className="w-3 h-3 text-stone-300 group-hover:text-amber-500 transition-colors" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    </button>
  );
}
