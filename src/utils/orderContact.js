// Legacy orders store the phone as a final metadata segment inside Note.
export function splitOrderNote(value) {
  const note = String(value || "").trim();
  const match = note.match(/(?:^|\s*\|\s*|\r?\n)\s*Телефон\s*:\s*([+()\d][+\d()\s.-]*)\s*$/iu);
  if (!match) return { comment:note, phone:"" };
  const phone = match[1].trim();
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return { comment:note, phone:"" };
  return { comment:note.slice(0,match.index).trim(), phone };
}

