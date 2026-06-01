export type AnswerMarker = "normal" | "positive" | "negative" | "warning";

export interface Answer {
  id: string;
  text: string;
  target: number | "end"; // question id or end
  marker: AnswerMarker;
}

export interface Question {
  id: number;
  title: string;
  description: string;
  answers: Answer[];
}

export type QuestionStatus = "active" | "orphan" | "final" | "loop";

export interface Flow {
  version: string;
  questions: Record<number, Question>;
  rootId: number;
}