import { create } from "zustand";
import type { Flow, Question, Answer, AnswerMarker } from "./flow-types";

const initialQuestions: Question[] = [
  {
    id: 1,
    title: "Você é cidadão brasileiro?",
    description: "Identificação inicial do usuário.",
    answers: [
      { id: "a", text: "Sim", target: 2, marker: "positive" },
      { id: "b", text: "Não", target: 4, marker: "negative" },
    ],
  },
  {
    id: 2,
    title: "Possui CPF ativo?",
    description: "Verificação de cadastro no CPF.",
    answers: [
      { id: "a", text: "Sim", target: 3, marker: "positive" },
      { id: "b", text: "Não sei", target: "end", marker: "warning" },
      { id: "c", text: "Não", target: 4, marker: "negative" },
    ],
  },
  {
    id: 3,
    title: "Qual serviço deseja acessar?",
    description: "Seleção do serviço de interesse.",
    answers: [
      { id: "a", text: "Consultar plano", target: "end", marker: "normal" },
      { id: "b", text: "Atualizar cadastro", target: "end", marker: "normal" },
    ],
  },
  {
    id: 4,
    title: "Encaminhar para atendimento presencial",
    description: "O usuário será orientado a buscar uma unidade.",
    answers: [
      { id: "a", text: "Finalizar", target: "end", marker: "normal" },
    ],
  },
];

function buildFlow(qs: Question[]): Flow {
  const map: Record<number, Question> = {};
  qs.forEach((q) => (map[q.id] = q));
  return { version: "0.1.0-rascunho", questions: map, rootId: qs[0]?.id ?? 1 };
}

interface FlowState {
  flow: Flow;
  setFlow: (f: Flow) => void;
  updateQuestion: (id: number, patch: Partial<Question>) => void;
  updateAnswer: (qid: number, aid: string, patch: Partial<Answer>) => void;
  addAnswer: (qid: number) => void;
  removeAnswer: (qid: number, aid: string) => void;
  addQuestion: () => number;
  generateLargeFlow: (n?: number) => void;
  bumpVersion: () => void;
  renumberByFlow: () => void;
}

function nextId(flow: Flow): number {
  const ids = Object.keys(flow.questions).map(Number);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

export const useFlow = create<FlowState>((set, get) => ({
  flow: buildFlow(initialQuestions),
  setFlow: (f) => set({ flow: f }),
  updateQuestion: (id, patch) =>
    set((s) => ({
      flow: {
        ...s.flow,
        questions: {
          ...s.flow.questions,
          [id]: { ...s.flow.questions[id], ...patch },
        },
      },
    })),
  updateAnswer: (qid, aid, patch) =>
    set((s) => {
      const q = s.flow.questions[qid];
      if (!q) return s;
      const answers = q.answers.map((a) => (a.id === aid ? { ...a, ...patch } : a));
      return {
        flow: {
          ...s.flow,
          questions: { ...s.flow.questions, [qid]: { ...q, answers } },
        },
      };
    }),
  addAnswer: (qid) =>
    set((s) => {
      const q = s.flow.questions[qid];
      if (!q) return s;
      const id = `a${Date.now().toString(36)}`;
      const newA: Answer = { id, text: "Nova resposta", target: "end", marker: "normal" };
      return {
        flow: {
          ...s.flow,
          questions: { ...s.flow.questions, [qid]: { ...q, answers: [...q.answers, newA] } },
        },
      };
    }),
  removeAnswer: (qid, aid) =>
    set((s) => {
      const q = s.flow.questions[qid];
      if (!q) return s;
      return {
        flow: {
          ...s.flow,
          questions: {
            ...s.flow.questions,
            [qid]: { ...q, answers: q.answers.filter((a) => a.id !== aid) },
          },
        },
      };
    }),
  addQuestion: () => {
    const id = nextId(get().flow);
    set((s) => ({
      flow: {
        ...s.flow,
        questions: {
          ...s.flow.questions,
          [id]: {
            id,
            title: `Nova pergunta #${id}`,
            description: "",
            answers: [{ id: "a", text: "Finalizar", target: "end", marker: "normal" }],
          },
        },
      },
    }));
    return id;
  },
  generateLargeFlow: (n = 1000) => {
    const qs: Record<number, Question> = {};
    for (let i = 1; i <= n; i++) {
      const answers: Answer[] = [];
      const markers: AnswerMarker[] = ["positive", "negative", "warning", "normal"];
      const numA = 2 + (i % 3);
      for (let j = 0; j < numA; j++) {
        const targetIdx = i + j + 1 + Math.floor(Math.random() * 3);
        const target: number | "end" = targetIdx > n || Math.random() < 0.05 ? "end" : targetIdx;
        answers.push({
          id: `a${j}`,
          text: `Opção ${String.fromCharCode(65 + j)}`,
          target,
          marker: markers[j % markers.length],
        });
      }
      qs[i] = {
        id: i,
        title: `Pergunta gerada #${i}`,
        description: `Pergunta de teste número ${i} do fluxo simulado.`,
        answers,
      };
    }
    set({ flow: { version: "teste-1000", questions: qs, rootId: 1 } });
  },
  bumpVersion: () =>
    set((s) => {
      const parts = s.flow.version.split("-")[0].split(".");
      const patch = (parseInt(parts[2] || "0") + 1).toString();
      const v = `${parts[0]}.${parts[1]}.${patch}`;
      return { flow: { ...s.flow, version: v } };
    }),
  renumberByFlow: () =>
    set((s) => {
      const { flow } = s;
      const order: number[] = [];
      const visited = new Set<number>();
      const stack: number[] = [flow.rootId];
      while (stack.length) {
        const id = stack.shift()!;
        if (visited.has(id) || !flow.questions[id]) continue;
        visited.add(id);
        order.push(id);
        for (const a of flow.questions[id].answers) {
          if (typeof a.target === "number") stack.push(a.target);
        }
      }
      // append unreachable
      Object.keys(flow.questions)
        .map(Number)
        .forEach((id) => {
          if (!visited.has(id)) order.push(id);
        });
      const remap: Record<number, number> = {};
      order.forEach((oldId, idx) => (remap[oldId] = idx + 1));
      const newQs: Record<number, Question> = {};
      for (const oldId of order) {
        const q = flow.questions[oldId];
        const newId = remap[oldId];
        newQs[newId] = {
          ...q,
          id: newId,
          answers: q.answers.map((a) => ({
            ...a,
            target: typeof a.target === "number" ? remap[a.target] ?? "end" : "end",
          })),
        };
      }
      return { flow: { ...flow, questions: newQs, rootId: remap[flow.rootId] ?? 1 } };
    }),
}));

// helpers
export function getStatus(flow: Flow, id: number): "active" | "orphan" | "final" | "loop" {
  const q = flow.questions[id];
  if (!q) return "orphan";
  const incoming = Object.values(flow.questions).some((other) =>
    other.id !== id && other.answers.some((a) => a.target === id)
  );
  if (id !== flow.rootId && !incoming) return "orphan";
  if (q.answers.every((a) => a.target === "end")) return "final";
  // detect simple loop: can reach itself
  const seen = new Set<number>();
  const stack: number[] = [];
  for (const a of q.answers) if (typeof a.target === "number") stack.push(a.target);
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === id) return "loop";
    if (seen.has(cur)) continue;
    seen.add(cur);
    const nq = flow.questions[cur];
    if (!nq) continue;
    for (const a of nq.answers) if (typeof a.target === "number") stack.push(a.target);
  }
  return "active";
}

export function diagnose(flow: Flow) {
  const ids = Object.keys(flow.questions).map(Number);
  const incoming: Record<number, number> = {};
  ids.forEach((i) => (incoming[i] = 0));
  const danglingAnswers: { qid: number; aid: string }[] = [];
  ids.forEach((i) => {
    flow.questions[i].answers.forEach((a) => {
      if (typeof a.target === "number") {
        if (flow.questions[a.target]) incoming[a.target]++;
        else danglingAnswers.push({ qid: i, aid: a.id });
      }
    });
  });
  const orphans = ids.filter((i) => i !== flow.rootId && incoming[i] === 0);
  const noAnswers = ids.filter((i) => flow.questions[i].answers.length === 0);
  const finals = ids.filter((i) => flow.questions[i].answers.every((a) => a.target === "end"));
  // reachability + loops via DFS
  const reachable = new Set<number>();
  const loops: number[] = [];
  const stack: [number, Set<number>][] = [[flow.rootId, new Set()]];
  while (stack.length) {
    const [cur, path] = stack.pop()!;
    if (!flow.questions[cur]) continue;
    reachable.add(cur);
    const newPath = new Set(path);
    newPath.add(cur);
    for (const a of flow.questions[cur].answers) {
      if (typeof a.target === "number") {
        if (newPath.has(a.target)) {
          if (!loops.includes(a.target)) loops.push(a.target);
        } else {
          stack.push([a.target, newPath]);
        }
      }
    }
  }
  const unreachable = ids.filter((i) => !reachable.has(i));
  // longest path approx (BFS depth from root)
  const depth: Record<number, number> = {};
  const queue: number[] = [flow.rootId];
  depth[flow.rootId] = 0;
  while (queue.length) {
    const cur = queue.shift()!;
    const q = flow.questions[cur];
    if (!q) continue;
    for (const a of q.answers) {
      if (typeof a.target === "number" && depth[a.target] === undefined) {
        depth[a.target] = depth[cur] + 1;
        queue.push(a.target);
      }
    }
  }
  const longPaths = Object.entries(depth)
    .filter(([, d]) => d > 20)
    .map(([id]) => Number(id));
  // duplicates by title
  const byTitle: Record<string, number[]> = {};
  ids.forEach((i) => {
    const t = flow.questions[i].title.trim().toLowerCase();
    (byTitle[t] ||= []).push(i);
  });
  const duplicates = Object.values(byTitle).filter((arr) => arr.length > 1);
  return { orphans, noAnswers, finals, loops, unreachable, longPaths, duplicates, danglingAnswers };
}