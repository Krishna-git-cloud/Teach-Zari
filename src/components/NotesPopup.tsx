import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function NotesPopup({ storageKey }: { storageKey: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  // Load saved note
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setNote(saved);
  }, [storageKey]);

  // Save note
  const saveNote = () => {
    localStorage.setItem(storageKey, note);
    setOpen(false);
  };

  // Clear note
  const clearNote = () => {
    localStorage.removeItem(storageKey);
    setNote("");
    setOpen(false);
  };

  return (
    <>
      {/* Sticky tab */}
      <div
        className="fixed top-1/3 right-[-2px] bg-yellow-300 text-black font-semibold px-3 py-2 rounded-l-lg cursor-pointer shadow-md hover:bg-yellow-400 transition z-50"
        onClick={() => setOpen(true)}
      >
        📝 Note
      </div>

      {/* Background overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Sticky note panel */}
      <div
        className={`fixed right-4 top-10 w-72 bg-yellow-200 shadow-2xl rounded-md p-4 flex flex-col z-50 transform transition-all duration-300 origin-top-right
        ${open ? "rotate-1 translate-x-0 opacity-100" : "rotate-6 translate-x-full opacity-0"}`}
        style={{
          boxShadow:
            "2px 4px 10px rgba(0,0,0,0.2), inset 0 -6px 20px rgba(0,0,0,0.05)",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg text-yellow-900">Sticky Note</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-600 hover:text-black text-xl"
          >
            ✖
          </button>
        </div>

        {/* Note area */}
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write your note..."
          className="flex-1 p-2 rounded border border-yellow-300 resize-none bg-yellow-100 focus:outline-none focus:ring focus:ring-yellow-400"
        />

        {/* Actions */}
        <div className="mt-3 flex justify-between">
          {note && (
            <Button
              onClick={clearNote}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Clear
            </Button>
          )}
          <Button
            onClick={saveNote}
            className="ml-auto bg-green-500 text-white hover:bg-green-600"
          >
            Save
          </Button>
        </div>
      </div>
    </>
  );
} 
