/**
 * Auxiliares do calendário mensal de férias.
 *
 * São a cópia dos que a app usa (`LOG-mobile/src/utils/ferias.js`): as duas
 * plataformas têm de pintar exatamente os mesmos dias com as mesmas cores, e a
 * regra de qual estado ganha quando há sobreposição não pode divergir.
 */

export const MONTHS_FULL = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const EMPLOYEE_COLORS = [
    '#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00897b',
    '#3949ab', '#d81b60', '#6d4c41', '#039be5', '#7cb342', '#c0ca33',
];

export function colorForIndex(i) {
    return EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length];
}

/**
 * Semanas do mês a começar à segunda-feira, com as células de fora a null para
 * cada linha ter sempre sete entradas.
 */
export function buildMonthWeeks(year, month) {
    const first = new Date(year, month - 1, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
}

export function isWeekend(date) {
    const d = date.getDay();
    return d === 0 || d === 6;
}

/** Data como "AAAA-MM-DD" na hora local — nunca em UTC, que trocava o dia. */
export function localDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Mapa "colaborador|dia" → estado, para o calendário consultar sem percorrer
 * todos os pedidos em cada célula. Cancelados e rejeitados ficam de fora, e um
 * dia aprovado sobrepõe-se a um pendente do mesmo colaborador.
 */
export function buildVacationMap(vacations) {
    const map = {};
    for (const v of vacations) {
        if (v.status === 'cancelado' || v.status === 'rejeitado') continue;
        const start = new Date(v.startDate);
        const end = new Date(v.endDate);
        const d = new Date(start);
        while (d <= end) {
            const key = `${v.employee_id}|${localDateStr(d)}`;
            if (!map[key] || v.status === 'aprovado') {
                map[key] = { status: v.status, id: v.id };
            }
            d.setDate(d.getDate() + 1);
        }
    }
    return map;
}
