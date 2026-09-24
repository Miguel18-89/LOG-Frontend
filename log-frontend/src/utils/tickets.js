export const TICKET_TYPES = [
    { value: 'assistencia', label: 'Assistência' },
    { value: 'tarefa', label: 'Tarefa' },
];

export const TICKET_PRIORITIES = [
    { value: 'baixa', label: 'Baixa' },
    { value: 'normal', label: 'Normal' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' },
];

export const TICKET_STATUSES = [
    { value: 'aberto', label: 'Aberto' },
    { value: 'atribuido', label: 'Atribuído' },
    { value: 'em_curso', label: 'Em curso' },
    { value: 'fechado', label: 'Fechado' },
    { value: 'cancelado', label: 'Cancelado' },
];

// Estados que contam como trabalho por fazer — o mesmo critério do servidor.
export const OPEN_STATUSES = ['aberto', 'atribuido', 'em_curso'];

export const TYPE_COLORS = {
    assistencia: { bg: '#e3f2fd', color: '#1565c0' },
    tarefa: { bg: '#ede7f6', color: '#4527a0' },
};

export const PRIORITY_COLORS = {
    baixa: { bg: '#eceff1', color: '#546e7a' },
    normal: { bg: '#e8f5e9', color: '#2e7d32' },
    alta: { bg: '#fff3e0', color: '#e65100' },
    urgente: { bg: '#ffebee', color: '#c62828' },
};

export const STATUS_COLORS = {
    aberto: { bg: '#fff9c4', color: '#f57f17' },
    atribuido: { bg: '#e1f5fe', color: '#0277bd' },
    em_curso: { bg: '#e3f2fd', color: '#1565c0' },
    fechado: { bg: '#c8e6c9', color: '#2e7d32' },
    cancelado: { bg: '#eeeeee', color: '#757575' },
};

const label = (list, value) => list.find(i => i.value === value)?.label ?? value;

export const ticketTypeLabel = v => label(TICKET_TYPES, v);
export const ticketPriorityLabel = v => label(TICKET_PRIORITIES, v);
export const ticketStatusLabel = v => label(TICKET_STATUSES, v);

const FIELD_LABELS = {
    status: 'o estado',
    assignee_id: 'o responsável',
    priority: 'a prioridade',
    expectedDate: 'a data prevista',
    dueDate: 'a data limite',
    title: 'o assunto',
    type: 'o tipo',
};

/** Traduz os valores guardados em bruto no histórico para o que se lê no ecrã. */
function readable(field, value) {
    if (value === null || value === undefined || value === '') return 'vazio';
    if (field === 'status') return ticketStatusLabel(value);
    if (field === 'priority') return ticketPriorityLabel(value);
    if (field === 'type') return ticketTypeLabel(value);
    if (field === 'expectedDate' || field === 'dueDate') {
        return new Date(value).toLocaleDateString('pt-PT');
    }
    return value;
}

/**
 * Uma entrada do histórico em português corrente.
 *
 * O servidor guarda os valores em bruto (`em_curso`, `urgente`) e só o responsável
 * é guardado pelo nome, para o histórico continuar legível mesmo que a conta
 * desapareça. A tradução para etiquetas acontece aqui, onde estão as listas.
 */
export function describeEntry(entry) {
    const { field, fromValue, toValue } = entry;

    if (field === 'description') return 'editou a descrição';
    if (field === 'mensagem_eliminada') {
        return toValue ? `eliminou uma mensagem de ${toValue}` : 'eliminou uma mensagem';
    }
    if (field === 'obra_ligada') return `ligou a obra ${toValue}`;
    if (field === 'obra_desligada') return `desligou a obra ${toValue}`;
    if (field === 'rma_ligado') return `ligou o RMA ${toValue}`;
    if (field === 'rma_desligado') return `desligou o RMA ${toValue}`;

    if (field === 'assignee_id') {
        if (!fromValue) return `atribuiu a ${toValue}`;
        if (!toValue) return `retirou o responsável (era ${fromValue})`;
        return `passou o ticket de ${fromValue} para ${toValue}`;
    }

    const what = FIELD_LABELS[field] ?? field;
    return `mudou ${what} de «${readable(field, fromValue)}» para «${readable(field, toValue)}»`;
}

/**
 * Quantos dias um ticket pode ficar por fechar, conforme a prioridade, antes de
 * passar a pedir atencao. Contam-se a partir da data de abertura.
 */
export const ATTENTION_DAYS = {
    urgente: 1,
    alta: 2,
    normal: 7,
    baixa: 14,
};

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Um ticket que ja passou do prazo da sua prioridade e ainda nao foi fechado.
 *
 * E o que pinta a linha de vermelho na lista. Distinto de `isOverdue`, que olha
 * para a data limite escrita a mao: esta regra e automatica e vale mesmo para os
 * tickets a que ninguem deu prazo nenhum, que sao a maioria.
 */
export function needsAttention(ticket) {
    if (!ticket || ticket.status === 'fechado' || ticket.status === 'cancelado') return false;
    const dias = ATTENTION_DAYS[ticket.priority];
    if (!dias) return false;
    return Date.now() - new Date(ticket.created_at).getTime() > dias * DIA_MS;
}

/** Ha quantos dias inteiros o ticket esta aberto. */
export function daysOpen(ticket) {
    if (!ticket?.created_at) return 0;
    return Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / DIA_MS);
}

/** Data e hora curtas, para a linha de tempo. */
export function fmtDateTime(value) {
    if (!value) return '';
    const d = new Date(value);
    return `${d.toLocaleDateString('pt-PT')} ${d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
}

/** Um ticket cuja data limite já passou e que ainda não foi fechado. */
export function isOverdue(ticket) {
    if (!ticket?.dueDate || !OPEN_STATUSES.includes(ticket.status)) return false;
    const due = new Date(ticket.dueDate);
    due.setHours(23, 59, 59, 999);
    return due < new Date();
}

export const emptyTicketForm = {
    type: 'assistencia',
    title: '',
    description: '',
    client: '',
    location: '',
    requestedBy: '',
    priority: 'normal',
    status: 'aberto',
    assignee_id: '',
    expectedDate: '',
    dueDate: '',
    closingNote: '',
};

/** Passa um ticket vindo da API para o formato do formulário. */
export function ticketToForm(t) {
    return {
        type: t.type,
        title: t.title,
        description: t.description,
        client: t.client ?? '',
        location: t.location ?? '',
        requestedBy: t.requestedBy ?? '',
        priority: t.priority,
        status: t.status,
        assignee_id: t.assignee_id ?? '',
        expectedDate: t.expectedDate ? t.expectedDate.slice(0, 10) : '',
        dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
        closingNote: t.closingNote ?? '',
    };
}
