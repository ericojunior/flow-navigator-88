export type AnswerMarker = "normal" | "positive" | "negative" | "warning";

export type NoteVisibility = "internal" | "external" | "both";

export interface NoteEntry {
  text: string;
  visibility: NoteVisibility;
}

export interface Answer {
  id: string;
  text: string;
  target: number | "end"; // question id or end
  marker: AnswerMarker;
  /** Legacy single note. Kept for back-compat; new code uses `notes`. */
  note?: string;
  /** Multiple notes with visibility. Max one internal + one external, OR a single "both". */
  notes?: NoteEntry[];
  /** Groups associated with the destination of this answer. */
  groupIds?: string[];
  /** When target === "end", optionally reference a classification from the catalog. */
  classificationId?: string;
  /** When set, overrides the catalog classification note locally for this answer. */
  classificationNoteOverride?: string;
}

export interface Question {
  id: number;
  title: string;
  description: string;
  answers: Answer[];
  /** Legacy single note. Kept for back-compat; new code uses `notes`. */
  note?: string;
  notes?: NoteEntry[];
}

export type QuestionStatus = "active" | "orphan" | "final" | "loop";

export interface QuestionGroup {
  id: string;
  name: string;
  color: string; // hex
}

export interface Classification {
  id: string;
  name: string;
  marker: AnswerMarker;
  code?: string;
  note: string;
  description?: string;
  category?: string;
  priority?: "low" | "medium" | "high";
  link?: string;
}

export interface Flow {
  version: string;
  questions: Record<number, Question>;
  rootId: number;
  groups?: QuestionGroup[];
  classifications?: Classification[];
}

/** Returns the unified notes list, including legacy single-string note as internal. */
export function getNotes(target: { notes?: NoteEntry[]; note?: string } | null | undefined): NoteEntry[] {
  if (!target) return [];
  if (target.notes && target.notes.length) return target.notes;
  if (target.note && target.note.trim()) return [{ text: target.note, visibility: "internal" }];
  return [];
}