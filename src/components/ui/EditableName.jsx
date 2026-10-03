import { useState, useEffect, useRef } from "react";

export function EditableName({ value, onChange }) {
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
      <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className="bg-transparent border-b border-amber-400 outline-none font-mono text-xs text-stone-500 w-16" />
    );
  }
  return (
    <button type="button" onClick={() => { setDraft(value); setEditing(true); }} title="Click to rename"
      className="font-mono text-xs text-stone-500 hover:text-amber-600 transition-colors border-b border-dashed border-stone-300 hover:border-amber-400">
      {value}
    </button>
  );
}
