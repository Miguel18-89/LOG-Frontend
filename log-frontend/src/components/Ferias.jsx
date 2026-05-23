import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import IconButton from '@mui/joy/IconButton';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Textarea from '@mui/joy/Textarea';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import Divider from '@mui/joy/Divider';
import Chip from '@mui/joy/Chip';
import { MdAdd, MdCheck, MdClose, MdChevronLeft, MdChevronRight, MdPictureAsPdf } from 'react-icons/md';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext.jsx';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COLOR_APPROVED = '#c8e6c9';
const COLOR_PENDING = '#fff9c4';
const COLOR_WEEKEND = '#efefef';
const DAY_W = 20;
const NAME_W = 170;

function isWeekend(date) {
    const d = date.getDay();
    return d === 0 || d === 6;
}

// Always use local date parts to avoid UTC timezone off-by-one
function localDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getDaysInYear(year) {
    const days = [];
    const d = new Date(year, 0, 1);
    while (d.getFullYear() === year) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return days;
}

function buildVacationMap(vacations) {
    const map = {};
    for (const v of vacations) {
        if (v.status === 'cancelado') continue;
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

const MONTH_NAMES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function generateVacationPDF(employees, vacations, year) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const vMap = buildVacationMap(vacations);

    for (let m = 0; m < 12; m++) {
        if (m > 0) doc.addPage();
        const daysInMonth = new Date(year, m + 1, 0).getDate();

        doc.setFontSize(14);
        doc.setTextColor(245, 124, 0);
        doc.text(`Mapa de Férias ${year} – ${MONTH_NAMES_FULL[m]}`, 10, 12);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Gerado em ${new Date().toLocaleDateString('pt-PT')}`, 10, 18);
        doc.setTextColor(0);

        const head = [['Colaborador', ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1))]];
        const body = employees.map(emp => [
            emp.fullName,
            ...Array.from({ length: daysInMonth }, (_, i) => {
                const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                const entry = vMap[`${emp.id}|${dateStr}`];
                return entry ? (entry.status === 'aprovado' ? 'A' : 'P') : '';
            }),
        ]);

        const usableWidth = 277;
        const nameColW = 50;
        const dayColW = (usableWidth - nameColW) / daysInMonth;

        autoTable(doc, {
            head,
            body,
            startY: 22,
            margin: { left: 10, right: 10 },
            styles: { fontSize: 6, cellPadding: 0.8, halign: 'center', valign: 'middle' },
            headStyles: { fillColor: [245, 124, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
            columnStyles: Object.fromEntries([
                [0, { cellWidth: nameColW, halign: 'left' }],
                ...Array.from({ length: daysInMonth }, (_, i) => [i + 1, { cellWidth: dayColW }]),
            ]),
            didParseCell: (data) => {
                if (data.section !== 'body' || data.column.index === 0) return;
                const val = data.cell.raw;
                if (val === 'A') {
                    data.cell.styles.fillColor = [200, 230, 201];
                } else if (val === 'P') {
                    data.cell.styles.fillColor = [255, 249, 196];
                } else {
                    const date = new Date(year, m, data.column.index);
                    if (date.getDay() === 0 || date.getDay() === 6) {
                        data.cell.styles.fillColor = [235, 235, 235];
                    }
                }
            },
        });
    }

    // Legend on last page
    const finalY = (doc.lastAutoTable?.finalY ?? 180) + 8;
    doc.setFontSize(7);
    doc.setFillColor(200, 230, 201); doc.rect(10, finalY, 5, 4, 'F');
    doc.text('Aprovado', 17, finalY + 3);
    doc.setFillColor(255, 249, 196); doc.rect(35, finalY, 5, 4, 'F');
    doc.text('Pendente', 42, finalY + 3);
    doc.setFillColor(235, 235, 235); doc.rect(60, finalY, 5, 4, 'F');
    doc.text('Fim de semana', 67, finalY + 3);

    doc.save(`mapa_ferias_${year}.pdf`);
}

function buildMonthGroups(days) {
    const groups = [];
    let cur = -1;
    let count = 0;
    for (const d of days) {
        const m = d.getMonth();
        if (m !== cur) {
            if (count > 0) groups.push({ month: cur, count });
            cur = m;
            count = 1;
        } else {
            count++;
        }
    }
    if (count > 0) groups.push({ month: cur, count });
    return groups;
}

function isMonthEnd(d) {
    return d.getDate() === new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

const BLANK_FORM = { employee_id: '', startDate: '', endDate: '', notes: '' };

function buildApprovedDaysMap(vacations) {
    const map = {};
    for (const v of vacations) {
        if (v.status !== 'aprovado') continue;
        const d = new Date(v.startDate);
        const end = new Date(v.endDate);
        while (d <= end) {
            const day = d.getDay();
            if (day !== 0 && day !== 6) {
                map[v.employee_id] = (map[v.employee_id] || 0) + 1;
            }
            d.setDate(d.getDate() + 1);
        }
    }
    return map;
}

export default function Ferias() {
    const { user } = useAuth();
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [vacations, setVacations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState(BLANK_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(null); // vacation id
    const [rejectModal, setRejectModal] = useState(null); // { id, reason }

    const days = getDaysInYear(year);
    const monthGroups = buildMonthGroups(days);
    const vacationMap = buildVacationMap(vacations);
    const approvedDaysMap = buildApprovedDaysMap(vacations);

    // For role 0: find own employee record by matching workEmail
    const ownEmployee = user?.role < 1 ? employees.find(e => e.workEmail === user?.email) : null;

    const fetchVacations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/emg/ferias?year=${year}`);
            setVacations(res.data);
        } catch {
            toast.error('Erro ao carregar férias.');
        } finally {
            setLoading(false);
        }
    }, [year]);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await api.get('/emg/pessoal');
            setEmployees(res.data);
        } catch {
            toast.error('Erro ao carregar colaboradores.');
        }
    }, []);

    useEffect(() => { fetchVacations(); }, [fetchVacations]);
    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.employee_id || !form.startDate || !form.endDate) {
            toast.warning('Preencha todos os campos obrigatórios.');
            return;
        }
        if (new Date(form.endDate) < new Date(form.startDate)) {
            toast.warning('A data de fim não pode ser anterior à de início.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/emg/ferias', form);
            toast.success('Pedido de férias criado.');
            setShowAddModal(false);
            setForm(BLANK_FORM);
            fetchVacations();
        } catch {
            toast.error('Erro ao criar pedido.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleStatus(id, status, rejectionReason) {
        const messages = { aprovado: 'Férias aprovadas.', rejeitado: 'Férias rejeitadas.', cancelado: 'Pedido cancelado.' };
        try {
            await api.put(`/emg/ferias/${id}/status`, { status, rejectionReason: rejectionReason || undefined });
            toast.success(messages[status] ?? 'Estado atualizado.');
            setRejectModal(null);
            setCancelConfirm(null);
            fetchVacations();
        } catch {
            toast.error('Erro ao atualizar estado.');
        }
    }

    const sortedVacations = [...vacations].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    return (
        <>
            <Box sx={{ pb: 4 }}>

                {/* Page header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography level="h3" sx={{ fontWeight: 'bold', color: '#444' }}>Férias</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton variant="outlined" size="sm" onClick={() => setYear(y => y - 1)}>
                            <MdChevronLeft />
                        </IconButton>
                        <Typography level="title-lg" sx={{ minWidth: 56, textAlign: 'center', fontWeight: 'bold' }}>{year}</Typography>
                        <IconButton variant="outlined" size="sm" onClick={() => setYear(y => y + 1)} disabled={year >= currentYear + 1}>
                            <MdChevronRight />
                        </IconButton>
                        {user?.role >= 1 && (
                            <Button
                                startDecorator={<MdPictureAsPdf />}
                                size="sm"
                                variant="outlined"
                                color="neutral"
                                onClick={() => generateVacationPDF(employees, vacations, year)}
                                disabled={employees.length === 0}
                            >
                                Gerar PDF
                            </Button>
                        )}
                        <Button
                            startDecorator={<MdAdd />}
                            size="sm"
                            sx={{ ml: 1 }}
                            onClick={() => {
                                const preselect = user?.role < 1 ? (ownEmployee?.id || '') : '';
                                setForm({ ...BLANK_FORM, employee_id: preselect });
                                setShowAddModal(true);
                            }}
                        >
                            Novo Pedido
                        </Button>
                    </Box>
                </Box>

                {/* Legend */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    {[
                        { color: COLOR_APPROVED, label: 'Aprovado' },
                        { color: COLOR_PENDING, label: 'Pendente' },
                        { color: COLOR_WEEKEND, label: 'Fim de semana' },
                    ].map(({ color, label }) => (
                        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 14, height: 14, bgcolor: color, border: '1px solid #bbb', borderRadius: '3px' }} />
                            <Typography level="body-xs" sx={{ color: '#666' }}>{label}</Typography>
                        </Box>
                    ))}
                </Box>

                {/* Calendar map */}
                <Box
                    sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 'md',
                        bgcolor: '#fff',
                        mb: 4,
                        overflow: 'auto',
                        maxHeight: '55vh',
                        pb: 2,
                    }}
                >
                    {/* Month header */}
                    <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3, bgcolor: '#f5f5f5' }}>
                        <Box sx={{ width: NAME_W, flexShrink: 0, borderRight: '2px solid #ddd', borderBottom: '1px solid #ddd', position: 'sticky', left: 0, zIndex: 4, bgcolor: '#f5f5f5' }} />
                        {monthGroups.map(({ month, count }) => (
                            <Box
                                key={month}
                                sx={{
                                    minWidth: count * DAY_W,
                                    textAlign: 'center',
                                    borderRight: '2px solid #ddd',
                                    borderBottom: '1px solid #ddd',
                                    py: 0.4,
                                    fontSize: '0.68rem',
                                    fontWeight: 'bold',
                                    color: '#555',
                                    letterSpacing: '0.03em',
                                }}
                            >
                                {MONTHS[month]}
                            </Box>
                        ))}
                    </Box>

                    {/* Day numbers row */}
                    <Box sx={{ display: 'flex', position: 'sticky', top: 25, zIndex: 3, bgcolor: '#fafafa', borderBottom: '2px solid #ccc' }}>
                        <Box sx={{ width: NAME_W, flexShrink: 0, borderRight: '2px solid #ddd', position: 'sticky', left: 0, zIndex: 4, bgcolor: '#fafafa' }} />
                        {days.map(d => (
                            <Box
                                key={d.toISOString()}
                                sx={{
                                    minWidth: DAY_W,
                                    textAlign: 'center',
                                    fontSize: '0.5rem',
                                    color: isWeekend(d) ? '#bbb' : '#aaa',
                                    py: 0.2,
                                    borderRight: isMonthEnd(d) ? '2px solid #ccc' : '1px solid #eee',
                                }}
                            >
                                {d.getDate()}
                            </Box>
                        ))}
                    </Box>

                    {/* Employee rows */}
                    {loading ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography level="body-sm" sx={{ color: '#888' }}>A carregar...</Typography>
                        </Box>
                    ) : employees.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography level="body-sm" sx={{ color: '#888' }}>Sem colaboradores.</Typography>
                        </Box>
                    ) : (
                        employees.map((emp, i) => (
                            <Box
                                key={emp.id}
                                sx={{
                                    display: 'flex',
                                    borderBottom: '1px solid #f0f0f0',
                                    bgcolor: i % 2 === 0 ? '#fff' : '#fafafa',
                                }}
                            >
                                {/* Sticky name */}
                                <Box
                                    sx={{
                                        width: NAME_W,
                                        maxWidth: NAME_W,
                                        flexShrink: 0,
                                        borderRight: '2px solid #ddd',
                                        px: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        position: 'sticky',
                                        left: 0,
                                        bgcolor: i % 2 === 0 ? '#fff' : '#fafafa',
                                        zIndex: 2,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Typography
                                        level="body-xs"
                                        noWrap
                                        sx={{ color: '#333', fontWeight: 500, fontSize: '0.7rem', flex: 1, minWidth: 0 }}
                                    >
                                        {emp.fullName}
                                    </Typography>
                                    {approvedDaysMap[emp.id] > 0 && (
                                        <Typography
                                            level="body-xs"
                                            sx={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '0.65rem', flexShrink: 0 }}
                                        >
                                            {approvedDaysMap[emp.id]}d
                                        </Typography>
                                    )}
                                </Box>

                                {/* Day cells */}
                                {days.map(d => {
                                    const dateStr = localDateStr(d);
                                    const entry = vacationMap[`${emp.id}|${dateStr}`];
                                    let bg = isWeekend(d) ? COLOR_WEEKEND : 'transparent';
                                    if (entry) bg = entry.status === 'aprovado' ? COLOR_APPROVED : COLOR_PENDING;
                                    return (
                                        <Box
                                            key={dateStr}
                                            title={entry ? `${entry.status} – ${dateStr}` : dateStr}
                                            sx={{
                                                minWidth: DAY_W,
                                                height: 26,
                                                bgcolor: bg,
                                                borderRight: isMonthEnd(d) ? '2px solid #ccc' : '1px solid transparent',
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        ))
                    )}
                </Box>

                {/* Vacation requests list */}
                <Typography level="title-lg" sx={{ fontWeight: 'bold', color: '#444', mb: 1.5 }}>
                    Pedidos de Férias – {year}
                </Typography>

                {sortedVacations.length === 0 ? (
                    <Typography level="body-sm" sx={{ color: '#888' }}>Sem pedidos registados para {year}.</Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {sortedVacations.map(v => {
                            const start = new Date(v.startDate).toLocaleDateString('pt-PT');
                            const end = new Date(v.endDate).toLocaleDateString('pt-PT');
                            const nDays = Math.round((new Date(v.endDate) - new Date(v.startDate)) / 86400000) + 1;
                            const isOwn = v.createdBy?.id === user?.id;
                            const canCancel = isOwn && v.status !== 'cancelado' && v.status !== 'rejeitado';
                            const isCancelled = v.status === 'cancelado';
                            const chipColor = {
                                aprovado: COLOR_APPROVED,
                                rejeitado: '#ffcdd2',
                                cancelado: '#eeeeee',
                                pendente: COLOR_PENDING,
                            }[v.status] ?? COLOR_PENDING;
                            return (
                                <Box
                                    key={v.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        p: 1.5,
                                        borderRadius: 'md',
                                        border: '1px solid #e0e0e0',
                                        bgcolor: isCancelled ? '#fafafa' : '#fff',
                                        flexWrap: 'wrap',
                                        opacity: isCancelled ? 0.6 : 1,
                                    }}
                                >
                                    <Chip size="sm" sx={{ bgcolor: chipColor, color: '#333', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                        {v.status}
                                    </Chip>
                                    <Typography level="body-sm" sx={{ fontWeight: 'bold', minWidth: 150 }}>
                                        {v.employee?.fullName}
                                    </Typography>
                                    <Typography level="body-sm" sx={{ color: '#555' }}>
                                        {start} → {end}
                                    </Typography>
                                    <Typography level="body-xs" sx={{ color: '#888' }}>
                                        ({nDays} {nDays === 1 ? 'dia' : 'dias'})
                                    </Typography>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        {v.notes && (
                                            <Typography level="body-xs" sx={{ color: '#888', fontStyle: 'italic' }}>
                                                {v.notes}
                                            </Typography>
                                        )}
                                        {v.status === 'rejeitado' && v.rejectionReason && (
                                            <Typography level="body-xs" sx={{ color: '#c62828', fontStyle: 'italic' }}>
                                                Motivo: {v.rejectionReason}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                                        {user?.role >= 1 && v.status === 'pendente' && (
                                            <>
                                                <IconButton size="sm" color="success" variant="soft" title="Aprovar" onClick={() => handleStatus(v.id, 'aprovado')}>
                                                    <MdCheck />
                                                </IconButton>
                                                <IconButton size="sm" color="danger" variant="soft" title="Rejeitar" onClick={() => setRejectModal({ id: v.id, reason: '' })}>
                                                    <MdClose />
                                                </IconButton>
                                            </>
                                        )}
                                        {canCancel && (
                                            <Button size="sm" variant="outlined" color="neutral" onClick={() => setCancelConfirm(v.id)}>
                                                Cancelar
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>

            {/* Add vacation modal */}
            <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
                <ModalDialog sx={{ minWidth: 420, maxWidth: 500 }}>
                    <ModalClose />
                    <Typography level="title-lg" sx={{ mb: 2 }}>Novo Pedido de Férias</Typography>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography level="body-xs" sx={{ mb: 0.5, fontWeight: 'bold' }}>Colaborador *</Typography>
                                {user?.role < 1 ? (
                                    <Typography level="body-sm" sx={{ py: 0.75, px: 1, border: '1px solid #ddd', borderRadius: 'sm', bgcolor: '#f9f9f9', color: ownEmployee ? '#333' : '#e53935' }}>
                                        {ownEmployee ? ownEmployee.fullName : 'O seu utilizador não está associado a nenhum colaborador'}
                                    </Typography>
                                ) : (
                                    <Select
                                        value={form.employee_id || null}
                                        onChange={(_, v) => setForm(f => ({ ...f, employee_id: v }))}
                                        placeholder="Selecionar colaborador..."
                                        size="sm"
                                    >
                                        {employees.map(e => (
                                            <Option key={e.id} value={e.id}>{e.fullName}</Option>
                                        ))}
                                    </Select>
                                )}
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <Box>
                                    <Typography level="body-xs" sx={{ mb: 0.5, fontWeight: 'bold' }}>Data de início *</Typography>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.875rem' }}
                                        required
                                    />
                                </Box>
                                <Box>
                                    <Typography level="body-xs" sx={{ mb: 0.5, fontWeight: 'bold' }}>Data de fim *</Typography>
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        min={form.startDate || undefined}
                                        onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.875rem' }}
                                        required
                                    />
                                </Box>
                            </Box>
                            <Box>
                                <Typography level="body-xs" sx={{ mb: 0.5, fontWeight: 'bold' }}>Notas</Typography>
                                <Textarea
                                    value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    minRows={2}
                                    size="sm"
                                    placeholder="Opcional..."
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                                <Button variant="plain" color="neutral" size="sm" onClick={() => setShowAddModal(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" size="sm" loading={submitting}>
                                    Criar Pedido
                                </Button>
                            </Box>
                        </Box>
                    </form>
                </ModalDialog>
            </Modal>

            {/* Reject modal with reason */}
            <Modal open={!!rejectModal} onClose={() => setRejectModal(null)}>
                <ModalDialog variant="outlined" role="alertdialog" sx={{ maxWidth: 420 }}>
                    <Typography level="title-lg">Rejeitar Pedido</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography level="body-sm" sx={{ mb: 1.5 }}>
                        Pode indicar o motivo da rejeição. O colaborador será notificado por email.
                    </Typography>
                    <Textarea
                        value={rejectModal?.reason ?? ''}
                        onChange={e => setRejectModal(m => ({ ...m, reason: e.target.value }))}
                        minRows={3}
                        size="sm"
                        placeholder="Motivo da rejeição (opcional)..."
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="plain" color="neutral" size="sm" onClick={() => setRejectModal(null)}>
                            Cancelar
                        </Button>
                        <Button color="danger" size="sm" onClick={() => handleStatus(rejectModal.id, 'rejeitado', rejectModal.reason)}>
                            Rejeitar
                        </Button>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* Cancel confirm modal */}
            <Modal open={!!cancelConfirm} onClose={() => setCancelConfirm(null)}>
                <ModalDialog variant="outlined" role="alertdialog" sx={{ maxWidth: 380 }}>
                    <Typography level="title-lg">Cancelar Pedido</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography level="body-sm">Tem a certeza que deseja cancelar este pedido de férias?</Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="plain" color="neutral" size="sm" onClick={() => setCancelConfirm(null)}>
                            Voltar
                        </Button>
                        <Button color="danger" size="sm" onClick={() => handleStatus(cancelConfirm, 'cancelado')}>
                            Cancelar Pedido
                        </Button>
                    </Box>
                </ModalDialog>
            </Modal>
        </>
    );
}
