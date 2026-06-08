import { create } from "zustand";
import type {
  Flow,
  Question,
  Answer,
  AnswerMarker,
  QuestionGroup,
  Classification,
  QuestionCatalogItem,
  AnswerCatalogItem,
  NoteCatalogItem,
} from "./flow-types";

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
  return {
    version: "0.1.0-rascunho",
    questions: map,
    rootId: qs[0]?.id ?? 1,
    groups: [
      { id: "g-cad", name: "Cadastro", color: "#1351B4" },
      { id: "g-aten", name: "Atendimento", color: "#00A859" },
    ],
    classifications: [
      { id: "c-apto", name: "Apto", marker: "positive", code: "APT-01", note: "Usuário cumpre todos os requisitos e pode prosseguir." },
      { id: "c-inapto", name: "Inapto", marker: "negative", code: "INA-01", note: "Usuário não cumpre os requisitos. Encaminhar conforme protocolo." },
      { id: "c-presencial", name: "Encaminhar presencial", marker: "warning", code: "ENC-01", note: "Solicitar comparecimento à unidade mais próxima." },
    ],
    questionCatalog: [
      { id: "qc-1", title: "A empresa denunciada possui registro na ANS?", active: true },
      { id: "qc-2", title: "Houve comunicação prévia com antecedência mínima de 60 (sessenta) dias?", active: true },
      { id: "qc-3", title: "A administradora forneceu o número do protocolo de atendimento?", active: true },
      { id: "qc-4", title: "A cobrança foi efetuada pela operadora ou administradora de benefícios?", active: true },
      { id: "qc-5", title: "A operadora autorizou/agendou o procedimento solicitado?", active: true },
      { id: "qc-6", title: "A adaptação foi solicitada pelo responsável pelo contrato?", active: false },
      { id: "qc-7", title: "A administradora ofereceu alternativa de acesso ao boleto?", active: true },
      { id: "qc-8", title: "O beneficiário possui vínculo ativo com a operadora?", active: true },
    ],
    answerCatalog: [
      { id: "ac-1", text: "Sim", active: true },
      { id: "ac-2", text: "Não", active: true },
      { id: "ac-3", text: "Não sei", active: true },
      { id: "ac-4", text: "A Operadora autorizou/agendou, porém em município diferente do solicitado", active: true },
      { id: "ac-5", text: "A Operadora não aprovou os materiais necessários para a realização do procedimento", active: true },
      { id: "ac-6", text: "A Operadora solicitou laudo/relatório médico para dar continuidade ao processo de análise", active: true },
      { id: "ac-7", text: "A Ouvidoria não forneceu protocolo de atendimento", active: true },
      { id: "ac-8", text: "A administradora não possui ouvidoria", active: true },
      { id: "ac-9", text: "A adaptação foi decisão unilateral da operadora", active: true },
      { id: "ac-10", text: "O beneficiário não possui vínculo com a operadora/administradora notificada", active: true },
      { id: "ac-11", text: "A Operadora autorizou/agendou em bairro distante da residência do beneficiário", active: false },
    ],
    noteCatalog: [
      { id: "nc-1", title: "Base legal — Lei 9.656/98", text: "Trata-se de contrato firmado na vigência da Lei 9.656/98.", active: true },
      { id: "nc-2", title: "Prazo de comunicação", text: "A comunicação prévia deve respeitar a antecedência mínima de 60 (sessenta) dias.", active: true },
      { id: "nc-3", title: "Orientação ao analista", text: "Confirmar dados cadastrais junto ao sistema da operadora antes de prosseguir.", active: true },
      { id: "nc-4", title: "Atendimento de urgência/emergência", text: "Procedimentos de urgência/emergência têm regras específicas conforme RN vigente.", active: true },
      { id: "nc-5", title: "Encaminhamento à fiscalização", text: "Caso a operadora não responda em 5 dias úteis, encaminhar à fiscalização.", active: true },
    ],
  };
}

interface FlowState {
  flow: Flow;
  setFlow: (f: Flow) => void;
  updateQuestion: (id: number, patch: Partial<Question>) => void;
  updateAnswer: (qid: number, aid: string, patch: Partial<Answer>) => void;
  addAnswer: (qid: number, fromCatalogId?: string) => void;
  removeAnswer: (qid: number, aid: string) => void;
  addQuestion: (fromCatalogId?: string) => number;
  generateLargeFlow: (n?: number) => void;
  bumpVersion: () => void;
  renumberByFlow: () => void;
  // Groups
  addGroup: (name: string, color?: string) => string;
  updateGroup: (id: string, patch: Partial<QuestionGroup>) => void;
  removeGroup: (id: string) => void;
  toggleAnswerGroup: (qid: number, aid: string, gid: string) => void;
  // Classifications
  addClassification: (c?: Partial<Classification>) => string;
  updateClassification: (id: string, patch: Partial<Classification>) => void;
  removeClassification: (id: string) => void;
  // Catalogs
  addQuestionCatalogItem: (item: Omit<QuestionCatalogItem, "id">) => string;
  addAnswerCatalogItem: (item: Omit<AnswerCatalogItem, "id">) => string;
  addNoteCatalogItem: (item: Omit<NoteCatalogItem, "id">) => string;
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
  addAnswer: (qid, fromCatalogId) =>
    set((s) => {
      const q = s.flow.questions[qid];
      if (!q) return s;
      const id = `a${Date.now().toString(36)}`;
      const cat = fromCatalogId
        ? (s.flow.answerCatalog ?? []).find((c) => c.id === fromCatalogId)
        : null;
      const newA: Answer = {
        id,
        text: cat?.text ?? "Nova resposta",
        target: "end",
        marker: "normal",
        catalogId: cat?.id,
      };
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
  addQuestion: (fromCatalogId) => {
    const id = nextId(get().flow);
    const cat = fromCatalogId
      ? (get().flow.questionCatalog ?? []).find((c) => c.id === fromCatalogId)
      : null;
    set((s) => ({
      flow: {
        ...s.flow,
        questions: {
          ...s.flow.questions,
          [id]: {
            id,
            title: cat?.title ?? `Nova pergunta #${id}`,
            description: cat?.description ?? "",
            catalogId: cat?.id,
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
  // ---------- Groups ----------
  addGroup: (name, color) => {
    const id = `g-${Date.now().toString(36)}`;
    const palette = ["#1351B4", "#00A859", "#C0392B", "#FFCD07", "#6B7280", "#8E44AD"];
    set((s) => ({
      flow: {
        ...s.flow,
        groups: [
          ...(s.flow.groups ?? []),
          { id, name: name.trim() || "Novo grupo", color: color || palette[(s.flow.groups?.length ?? 0) % palette.length] },
        ],
      },
    }));
    return id;
  },
  updateGroup: (id, patch) =>
    set((s) => ({
      flow: {
        ...s.flow,
        groups: (s.flow.groups ?? []).map((g) => (g.id === id ? { ...g, ...patch } : g)),
      },
    })),
  removeGroup: (id) =>
    set((s) => {
      const questions = { ...s.flow.questions };
      Object.keys(questions).map(Number).forEach((qid) => {
        const q = questions[qid];
        const answers = q.answers.map((a) =>
          a.groupIds?.includes(id) ? { ...a, groupIds: a.groupIds.filter((g) => g !== id) } : a
        );
        questions[qid] = { ...q, answers };
      });
      return {
        flow: {
          ...s.flow,
          questions,
          groups: (s.flow.groups ?? []).filter((g) => g.id !== id),
        },
      };
    }),
  toggleAnswerGroup: (qid, aid, gid) =>
    set((s) => {
      const q = s.flow.questions[qid];
      if (!q) return s;
      const answers = q.answers.map((a) => {
        if (a.id !== aid) return a;
        const current = a.groupIds ?? [];
        const next = current.includes(gid) ? current.filter((g) => g !== gid) : [...current, gid];
        return { ...a, groupIds: next };
      });
      return {
        flow: {
          ...s.flow,
          questions: { ...s.flow.questions, [qid]: { ...q, answers } },
        },
      };
    }),
  // ---------- Classifications ----------
  addClassification: (c) => {
    const id = `c-${Date.now().toString(36)}`;
    const created: Classification = {
      id,
      name: c?.name?.trim() || "Nova classificação",
      marker: c?.marker ?? "normal",
      code: c?.code,
      note: c?.note ?? "",
    };
    set((s) => ({
      flow: { ...s.flow, classifications: [...(s.flow.classifications ?? []), created] },
    }));
    return id;
  },
  updateClassification: (id, patch) =>
    set((s) => ({
      flow: {
        ...s.flow,
        classifications: (s.flow.classifications ?? []).map((c) =>
          c.id === id ? { ...c, ...patch } : c
        ),
      },
    })),
  removeClassification: (id) =>
    set((s) => {
      const questions = { ...s.flow.questions };
      Object.keys(questions).map(Number).forEach((qid) => {
        const q = questions[qid];
        const answers = q.answers.map((a) =>
          a.classificationId === id ? { ...a, classificationId: undefined, classificationNoteOverride: undefined } : a
        );
        questions[qid] = { ...q, answers };
      });
      return {
        flow: {
          ...s.flow,
          questions,
          classifications: (s.flow.classifications ?? []).filter((c) => c.id !== id),
        },
      };
    }),
  // ---------- Catalogs ----------
  addQuestionCatalogItem: (item) => {
    const id = `qc-${Date.now().toString(36)}`;
    set((s) => ({
      flow: {
        ...s.flow,
        questionCatalog: [...(s.flow.questionCatalog ?? []), { id, ...item }],
      },
    }));
    return id;
  },
  addAnswerCatalogItem: (item) => {
    const id = `ac-${Date.now().toString(36)}`;
    set((s) => ({
      flow: {
        ...s.flow,
        answerCatalog: [...(s.flow.answerCatalog ?? []), { id, ...item }],
      },
    }));
    return id;
  },
  addNoteCatalogItem: (item) => {
    const id = `nc-${Date.now().toString(36)}`;
    set((s) => ({
      flow: {
        ...s.flow,
        noteCatalog: [...(s.flow.noteCatalog ?? []), { id, ...item }],
      },
    }));
    return id;
  },
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