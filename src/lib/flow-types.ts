export type AnswerMarker = "normal" | "positive" | "negative" | "warning";

export interface Answer {
  id: string;
  text: string;
  target: number | "end"; // question id or end
  marker: AnswerMarker;
  note?: string;
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
  note?: string;
  groupIds?: string[];
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
}

export interface Flow {
  version: string;
  questions: Record<number, Question>;
  rootId: number;
  groups?: QuestionGroup[];
  classifications?: Classification[];
}