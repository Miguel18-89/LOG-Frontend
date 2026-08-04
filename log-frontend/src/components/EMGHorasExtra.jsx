import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import Table from '@mui/joy/Table';
import Button from '@mui/joy/Button';
import Box from '@mui/joy/Box';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Checkbox from '@mui/joy/Checkbox';
import IconButton from '@mui/joy/IconButton';
import Chip from '@mui/joy/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Divider from '@mui/joy/Divider';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import { toast } from 'react-toastify';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Feriados nacionais portugueses de data fixa (MM-DD) — não inclui feriados móveis
// (Carnaval, Sexta-feira Santa, Corpo de Deus), que devem ser marcados manualmente
// pelo colaborador através do tipo de registo "Feriado".
const FIXED_HOLIDAYS_MMDD = [
    '01-01', '04-25', '05-01', '06-10', '08-15', '10-05', '11-01', '12-01', '12-08', '12-25',
];

const MAX_VACATION_BUSINESS_DAYS = 15;

function formatHours(h) {
    const total = Math.round((h || 0) * 60);
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
});

function pad2(n) {
    return String(n).padStart(2, '0');
}

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

function currentTimeRoundedUp() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    if (m === 0) return `${String(h).padStart(2, '0')}:00`;
    if (m <= 30) return `${String(h).padStart(2, '0')}:30`;
    return `${String((h + 1) % 24).padStart(2, '0')}:00`;
}

function getUserName() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user?.name) return user.name;
    } catch {}
    try {
        const token = localStorage.getItem('token');
        if (!token) return '';
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.name || '';
    } catch {
        return '';
    }
}

function isWeekendDate(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T12:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
}

function isOvernightShift(entryTime, exitTime) {
    if (!entryTime || !exitTime) return false;
    const [eH, eM] = entryTime.split(':').map(Number);
    const [xH, xM] = exitTime.split(':').map(Number);
    return (xH * 60 + xM) < (eH * 60 + eM);
}

function isExitOnWeekend(dateStr, entryTime, exitTime) {
    if (!isOvernightShift(entryTime, exitTime)) return false;
    const d = new Date(dateStr + 'T12:00:00');
    const exitDate = new Date(d);
    exitDate.setDate(exitDate.getDate() + 1);
    return exitDate.getDay() === 0 || exitDate.getDay() === 6;
}

function detectNightType(exitTime) {
    if (!exitTime) return null;
    const [h, m] = exitTime.split(':').map(Number);
    const totalMin = h * 60 + m;
    if (totalMin >= 2 * 60 && totalMin < 9 * 60) return 'trabalhada';
    return null;
}

function calcHours(date, entryTime, exitTime, isHoliday, dinner, weekendLunch, exitIsHoliday = false) {
    if (!date || !entryTime || !exitTime) return { h50: 0, h75: 0, h100: 0 };
    const d = new Date(date + 'T12:00:00');
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const [eH, eM] = entryTime.split(':').map(Number);
    const [xH, xM] = exitTime.split(':').map(Number);
    let totalMin = (xH * 60 + xM) - (eH * 60 + eM);
    const overnight = totalMin <= 0;
    if (overnight) totalMin += 24 * 60;

    if (isWeekend || isHoliday) {
        let workMin = totalMin;
        if (weekendLunch) workMin -= 60;
        if (dinner) workMin -= 60;
        if (workMin <= 0) return { h50: 0, h75: 0, h100: 0 };
        return { h50: 0, h75: 0, h100: workMin / 60 };
    }

    const exitWeekend = isExitOnWeekend(date, entryTime, exitTime);

    if (overnight && (exitWeekend || exitIsHoliday)) {
        const minBefore = 24 * 60 - (eH * 60 + eM);
        const minAfter = xH * 60 + xM;
        let overtimeBefore = minBefore - 10 * 60;
        if (dinner) overtimeBefore -= 60;
        let h50 = 0, h75 = 0;
        if (overtimeBefore > 0) {
            const ot = overtimeBefore / 60;
            h50 = Math.min(ot, 1);
            h75 = Math.max(0, ot - 1);
        }
        let afterMin = minAfter;
        if (weekendLunch) afterMin -= 60;
        return { h50, h75, h100: Math.max(0, afterMin / 60) };
    }

    let overtimeMin = totalMin - 10 * 60;
    if (dinner) overtimeMin -= 60;
    if (overtimeMin <= 0) return { h50: 0, h75: 0, h100: 0 };

    const overtime = overtimeMin / 60;
    return { h50: Math.min(overtime, 1), h75: Math.max(0, overtime - 1), h100: 0 };
}

function formatSituacao(r) {
    if (r.recordType === 'ferias') return 'Férias';
    if (r.recordType === 'falta') return 'Falta';
    if (r.recordType === 'feriado') return 'Feriado';
    if (r.nightType === 'trabalhada') return 'Trabalhada';
    if (r.nightType === 'fora_de_casa') return 'Fora de casa';
    return '---';
}

function isWorkRecord(r) {
    return !r.recordType || r.recordType === 'trabalho';
}

function countBusinessDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    let count = 0;
    const cur = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    while (cur <= end) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
}

function getMissingBusinessDays(records, year, month) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    const isFutureMonth = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1);
    if (isFutureMonth) return [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

    const presentDates = new Set(records.map(r => r.date ? r.date.split('T')[0] : null).filter(Boolean));
    const missing = [];
    for (let day = 1; day <= lastDay; day++) {
        const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
        if (isWeekendDate(dateStr)) continue;
        const mmdd = `${pad2(month)}-${pad2(day)}`;
        if (FIXED_HOLIDAYS_MMDD.includes(mmdd)) continue;
        if (!presentDates.has(dateStr)) missing.push(dateStr);
    }
    return missing;
}

const emptyForm = {
    date: '',
    recordType: 'trabalho',
    entryTime: '',
    exitTime: '',
    dinner: false,
    isHoliday: false,
    exitIsHoliday: false,
    weekendLunch: false,
    hours50: 0,
    hours75: 0,
    hours100: 0,
    nightType: '',
    client: '',
    obra: '',
};

export default function EMGHorasExtra() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [records, setRecords] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    const [sendConfirm, setSendConfirm] = useState({ open: false, comment: '' });
    const [missingDaysModal, setMissingDaysModal] = useState({ open: false, missing: [] });
    const [vacationModal, setVacationModal] = useState({ open: false, startDate: '', endDate: '' });
    const [vacationLoading, setVacationLoading] = useState(false);

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    useEffect(() => {
        fetchRecords();
    }, [year, month]);

    async function fetchRecords() {
        try {
            const res = await api.get('/emg/horas-extra', { params: { year, month } });
            setRecords(Array.isArray(res.data) ? res.data : []);
        } catch {
            setRecords([]);
        }
    }

    function handleFormChange(field, value) {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            if (['date', 'entryTime', 'exitTime', 'isHoliday', 'exitIsHoliday', 'dinner', 'weekendLunch'].includes(field)) {
                const { h50, h75, h100 } = calcHours(
                    updated.date, updated.entryTime, updated.exitTime,
                    updated.isHoliday, updated.dinner, updated.weekendLunch, updated.exitIsHoliday
                );
                updated.hours50 = h50;
                updated.hours75 = h75;
                updated.hours100 = h100;
            }
            if (field === 'exitTime') {
                const detected = detectNightType(value);
                if (detected) {
                    updated.nightType = detected;
                } else if (updated.nightType === 'trabalhada') {
                    updated.nightType = '';
                }
            }
            return updated;
        });
    }

    function handleOpenModal() {
        setIsEdit(false);
        setEditId(null);
        setForm({ ...emptyForm, date: todayStr(), entryTime: '09:00', exitTime: currentTimeRoundedUp() });
        setOpenModal(true);
    }

    function handleOpenEditModal(record) {
        setIsEdit(true);
        setEditId(record.id);
        setForm({
            date: record.date ? record.date.split('T')[0] : '',
            recordType: record.recordType || 'trabalho',
            entryTime: record.entryTime || '',
            exitTime: record.exitTime || '',
            dinner: record.dinner || false,
            isHoliday: false,
            exitIsHoliday: false,
            weekendLunch: record.weekendLunch || false,
            hours50: record.hours50 || 0,
            hours75: record.hours75 || 0,
            hours100: record.hours100 || 0,
            nightType: record.nightType || '',
            client: record.client || '',
            obra: record.obra || '',
        });
        setOpenModal(true);
    }

    async function handleSubmit() {
        if (!form.date) {
            toast.error('Indique a data.');
            return;
        }
        if (form.recordType === 'trabalho') {
            if (!form.entryTime || !form.exitTime) {
                toast.error('Preencha a hora de entrada e hora de saída.');
                return;
            }
            if ((form.nightType === 'trabalhada' || form.nightType === 'fora_de_casa') && (!form.client.trim() || !form.obra.trim())) {
                toast.error('Indique o cliente e a obra/local para noites trabalhadas ou fora de casa.');
                return;
            }
        }
        if (form.date > todayStr()) {
            toast.error('Não é possível registar horas para uma data futura.');
            return;
        }
        const duplicate = records.find(r => r.date && r.date.split('T')[0] === form.date && r.id !== editId);
        if (duplicate) {
            toast.error('Já existe um registo para esta data.');
            return;
        }
        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`/emg/horas-extra/${editId}`, form);
                toast.success('Registo actualizado.');
            } else {
                await api.post('/emg/horas-extra', form);
                toast.success('Registo adicionado.');
            }
            setOpenModal(false);
            setForm({ ...emptyForm, date: todayStr() });
            fetchRecords();
        } catch (err) {
            const msg = err.response?.data?.error;
            toast.error(msg || (isEdit ? 'Erro ao actualizar o registo.' : 'Erro ao guardar o registo.'));
        } finally {
            setLoading(false);
        }
    }

    function handleDeleteRequest(id) {
        setDeleteConfirm({ open: true, id });
    }

    async function handleDeleteConfirm() {
        try {
            await api.delete(`/emg/horas-extra/${deleteConfirm.id}`);
            toast.success('Registo eliminado.');
            fetchRecords();
        } catch {
            toast.error('Erro ao eliminar o registo.');
        } finally {
            setDeleteConfirm({ open: false, id: null });
        }
    }

    function closeModal() {
        setOpenModal(false);
        setForm({ ...emptyForm, date: todayStr() });
    }

    function handleOpenVacationModal() {
        setVacationModal({ open: true, startDate: todayStr(), endDate: todayStr() });
    }

    function closeVacationModal() {
        setVacationModal({ open: false, startDate: '', endDate: '' });
    }

    async function handleVacationSubmit() {
        const { startDate, endDate } = vacationModal;
        if (!startDate || !endDate) {
            toast.error('Indique a data de início e de fim.');
            return;
        }
        if (endDate < startDate) {
            toast.error('A data de fim deve ser posterior ou igual à data de início.');
            return;
        }
        const businessDays = countBusinessDays(startDate, endDate);
        if (businessDays === 0) {
            toast.error('O período não contém dias úteis.');
            return;
        }
        if (businessDays > MAX_VACATION_BUSINESS_DAYS) {
            toast.error(`O período não pode exceder ${MAX_VACATION_BUSINESS_DAYS} dias úteis. Submeta vários períodos separados.`);
            return;
        }
        setVacationLoading(true);
        try {
            const res = await api.post('/emg/horas-extra/ferias', { startDate, endDate });
            const { created, skipped } = res.data;
            let msg = `${created} dia(s) de férias adicionados.`;
            if (skipped && skipped.length > 0) msg += ` ${skipped.length} dia(s) já tinham registo e foram ignorados.`;
            toast.success(msg);
            closeVacationModal();
            fetchRecords();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao adicionar período de férias.');
        } finally {
            setVacationLoading(false);
        }
    }

    function handleSendEmail() {
        if (records.length === 0) {
            toast.warning('Sem registos para enviar.');
            return;
        }
        const missing = getMissingBusinessDays(records, year, month);
        if (missing.length > 0) {
            setMissingDaysModal({ open: true, missing });
            return;
        }
        setSendConfirm({ open: true, comment: '' });
    }

    async function handleSendEmailConfirm() {
        setSending(true);
        setSendConfirm(prev => ({ ...prev, open: false }));
        try {
            const monthName = MONTHS[month - 1];
            const userName = getUserName();
            const doc = new jsPDF();

            doc.setFontSize(14);
            doc.setTextColor(245, 124, 0);
            doc.text(`Horas Extra — ${userName ? userName + ' — ' : ''}${monthName} ${year}`, 14, 18);

            autoTable(doc, {
                startY: 26,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [245, 124, 0], textColor: 255, fontStyle: 'bold' },
                footStyles: { fillColor: [255, 243, 224], textColor: [191, 54, 12], fontStyle: 'bold' },
                head: [['Data', 'Entrada', 'Saída', 'Jantar', 'Horas 50%', 'Horas 75%', 'Horas 100%', 'Situação']],
                body: records.map(r => [
                    r.date ? new Date(r.date).toLocaleDateString('pt-PT') : '---',
                    isWorkRecord(r) ? (r.entryTime || '---') : '---',
                    isWorkRecord(r) ? (r.exitTime || '---') : '---',
                    isWorkRecord(r) ? (r.dinner ? 'Sim' : 'Não') : '---',
                    isWorkRecord(r) ? formatHours(r.hours50) : '---',
                    isWorkRecord(r) ? formatHours(r.hours75) : '---',
                    isWorkRecord(r) ? formatHours(r.hours100) : '---',
                    formatSituacao(r),
                ]),
                foot: [[
                    { content: 'Totais:', colSpan: 4, styles: { halign: 'right' } },
                    formatHours(totals.h50),
                    formatHours(totals.h75),
                    formatHours(totals.h100),
                    `${totals.nightsWorked} trabalhada(s) (50€) / ${totals.nightsAway} fora de casa (25€)`,
                ]],
            });

            const finalY = (doc.lastAutoTable?.finalY ?? 26) + 8;
            doc.setFontSize(9);
            doc.setTextColor(80);
            doc.text(
                `Férias: ${totals.feriasDays} dia(s)  ·  Faltas: ${totals.faltaDays} dia(s)  ·  Feriados: ${totals.feriadoDays} dia(s)`,
                14, finalY
            );

            const pdfBase64 = doc.output('datauristring').split(',')[1];

            const ajudasRows = records.filter(r => isWorkRecord(r) && (r.nightType === 'trabalhada' || r.nightType === 'fora_de_casa'));
            let pdfAjudasBase64 = null;
            if (ajudasRows.length > 0) {
                const docAjudas = new jsPDF();
                docAjudas.setFontSize(14);
                docAjudas.setTextColor(245, 124, 0);
                docAjudas.text(`Mapa de Ajudas de Custo — ${userName ? userName + ' — ' : ''}${monthName} ${year}`, 14, 18);

                autoTable(docAjudas, {
                    startY: 26,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [245, 124, 0], textColor: 255, fontStyle: 'bold' },
                    head: [['Dia', 'Entrada', 'Saída', 'Cliente', 'Obra/Local']],
                    body: ajudasRows.map(r => [
                        r.date ? new Date(r.date).toLocaleDateString('pt-PT') : '---',
                        r.entryTime || '---',
                        r.exitTime || '---',
                        r.client || '---',
                        r.obra || '---',
                    ]),
                });
                pdfAjudasBase64 = docAjudas.output('datauristring').split(',')[1];
            }

            await api.post('/emg/horas-extra/enviar', {
                pdf: pdfBase64,
                pdfAjudas: pdfAjudasBase64,
                month,
                year,
                monthName,
                comment: sendConfirm.comment.trim(),
            });
            toast.success('Email enviado com sucesso.');
        } catch (err) {
            console.error('Erro ao enviar email:', err);
            const serverMissing = err.response?.data?.missing;
            if (Array.isArray(serverMissing) && serverMissing.length > 0) {
                setMissingDaysModal({ open: true, missing: serverMissing });
            } else {
                toast.error(err.response?.data?.error || 'Erro ao enviar email. Verifique a consola para mais detalhes.');
            }
        } finally {
            setSending(false);
        }
    }

    const overnight = isOvernightShift(form.entryTime, form.exitTime);
    const exitWeekend = isExitOnWeekend(form.date, form.entryTime, form.exitTime);
    const showExitHoliday = overnight && !exitWeekend && !isWeekendDate(form.date) && !form.isHoliday;
    const showWeekendFields = isWeekendDate(form.date) || form.isHoliday;
    const showClientObra = form.recordType === 'trabalho' && (form.nightType === 'trabalhada' || form.nightType === 'fora_de_casa');

    const totals = records.reduce(
        (acc, r) => ({
            h50: acc.h50 + (r.hours50 || 0),
            h75: acc.h75 + (r.hours75 || 0),
            h100: acc.h100 + (r.hours100 || 0),
            nightsAway: acc.nightsAway + (r.nightType === 'fora_de_casa' ? 1 : 0),
            nightsWorked: acc.nightsWorked + (r.nightType === 'trabalhada' ? 1 : 0),
            feriasDays: acc.feriasDays + (r.recordType === 'ferias' ? 1 : 0),
            faltaDays: acc.faltaDays + (r.recordType === 'falta' ? 1 : 0),
            feriadoDays: acc.feriadoDays + (r.recordType === 'feriado' ? 1 : 0),
        }),
        { h50: 0, h75: 0, h100: 0, nightsAway: 0, nightsWorked: 0, feriasDays: 0, faltaDays: 0, feriadoDays: 0 }
    );
    const totalHours = totals.h50 + totals.h75 + totals.h100;

    return (
        <>
            <Sheet
                variant="outlined"
                sx={{
                    mx: 'auto', p: 3, borderRadius: 'sm', boxShadow: 'lg', backgroundColor: '#fff', maxWidth: 1100,
                    '& .col-hide': { display: { xs: 'none', md: 'table-cell' } },
                }}
            >
                <Typography level="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#f57c00', textAlign: 'center' }}>
                    Horas Extra
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <FormControl size="sm">
                        <FormLabel>Ano</FormLabel>
                        <Select value={year} onChange={(_, v) => setYear(v)} size="sm" sx={{ minWidth: 100 }}>
                            {years.map(y => <Option key={y} value={y}>{y}</Option>)}
                        </Select>
                    </FormControl>
                    <FormControl size="sm">
                        <FormLabel>Mês</FormLabel>
                        <Select value={month} onChange={(_, v) => setMonth(v)} size="sm" sx={{ minWidth: 140 }}>
                            {MONTHS.map((m, i) => <Option key={i + 1} value={i + 1}>{m}</Option>)}
                        </Select>
                    </FormControl>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button size="sm" color="success" loading={sending} onClick={handleSendEmail}>
                            Enviar Horas
                        </Button>
                        <Button size="sm" color="neutral" variant="outlined" onClick={handleOpenVacationModal}>
                            + Período de Férias
                        </Button>
                        <Button size="sm" color="warning" onClick={handleOpenModal}>
                            + Adicionar Registo
                        </Button>
                    </Box>
                </Box>

                {/* Totais — visível apenas em mobile */}
                {records.length > 0 && (
                    <Box sx={{ display: { xs: 'block', md: 'none' }, bgcolor: '#fff8e1', borderRadius: 'sm', p: 1.5, mb: 2 }}>
                        <Typography level="body-sm" sx={{ fontWeight: 'bold', color: '#e65100', mb: 1 }}>
                            Totais — {MONTHS[month - 1]} {year}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography level="body-sm" sx={{ color: '#555' }}>Horas 50%</Typography>
                                <Typography level="body-sm"><strong>{formatHours(totals.h50)}</strong></Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography level="body-sm" sx={{ color: '#555' }}>Horas 75%</Typography>
                                <Typography level="body-sm"><strong>{formatHours(totals.h75)}</strong></Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography level="body-sm" sx={{ color: '#555' }}>Horas 100%</Typography>
                                <Typography level="body-sm"><strong>{formatHours(totals.h100)}</strong></Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography level="body-sm" sx={{ color: '#555' }}>Noites trabalhadas (50€)</Typography>
                                <Typography level="body-sm"><strong>{totals.nightsWorked}</strong></Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography level="body-sm" sx={{ color: '#555' }}>Noites fora de casa (25€)</Typography>
                                <Typography level="body-sm"><strong>{totals.nightsAway}</strong></Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography level="body-sm" sx={{ color: '#555' }}>Férias / Faltas / Feriados</Typography>
                                <Typography level="body-sm"><strong>{totals.feriasDays} / {totals.faltaDays} / {totals.feriadoDays}</strong></Typography>
                            </Box>
                            <Divider sx={{ my: 0.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography level="body-sm" sx={{ fontWeight: 'bold', color: '#e65100' }}>Total geral</Typography>
                                <Typography level="body-sm" sx={{ fontWeight: 'bold', color: '#bf360c' }}>{formatHours(totalHours)}</Typography>
                            </Box>
                        </Box>
                    </Box>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <Table borderAxis="xBetween" size="sm" stripe="odd" sx={{ minWidth: { xs: 0, md: 800 } }}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th className="col-hide" style={{ textAlign: 'center' }}>Entrada</th>
                                <th className="col-hide" style={{ textAlign: 'center' }}>Saída</th>
                                <th className="col-hide" style={{ textAlign: 'center' }}>Jantar</th>
                                <th className="col-hide" style={{ textAlign: 'center' }}>Horas 50%</th>
                                <th className="col-hide" style={{ textAlign: 'center' }}>Horas 75%</th>
                                <th className="col-hide" style={{ textAlign: 'center' }}>Horas 100%</th>
                                <th className="col-hide" style={{ textAlign: 'center' }}>Situação</th>
                                <th style={{ textAlign: 'center', width: 80 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                        Sem registos para {MONTHS[month - 1]} {year}
                                    </td>
                                </tr>
                            ) : records.map(r => (
                                <tr key={r.id}>
                                    <td>{r.date ? new Date(r.date).toLocaleDateString('pt-PT') : '---'}</td>
                                    <td className="col-hide" style={{ textAlign: 'center' }}>{isWorkRecord(r) ? (r.entryTime || '---') : '---'}</td>
                                    <td className="col-hide" style={{ textAlign: 'center' }}>{isWorkRecord(r) ? (r.exitTime || '---') : '---'}</td>
                                    <td className="col-hide" style={{ textAlign: 'center' }}>{isWorkRecord(r) ? (r.dinner ? '✓' : '✗') : '---'}</td>
                                    <td className="col-hide" style={{ textAlign: 'center' }}>{isWorkRecord(r) ? formatHours(r.hours50) : '---'}</td>
                                    <td className="col-hide" style={{ textAlign: 'center' }}>{isWorkRecord(r) ? formatHours(r.hours75) : '---'}</td>
                                    <td className="col-hide" style={{ textAlign: 'center' }}>{isWorkRecord(r) ? formatHours(r.hours100) : '---'}</td>
                                    <td className="col-hide" style={{ textAlign: 'center' }}>{formatSituacao(r)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <IconButton size="sm" color="neutral" variant="plain" onClick={() => handleOpenEditModal(r)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="sm" color="danger" variant="plain" onClick={() => handleDeleteRequest(r.id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {records.length > 0 && (
                            <Box component="tfoot" sx={{ display: { xs: 'none', md: 'table-footer-group' } }}>
                                <tr style={{ fontWeight: 'bold', backgroundColor: '#fff8e1' }}>
                                    <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem', color: '#e65100' }}>Totais:</td>
                                    <td style={{ textAlign: 'center' }}>{formatHours(totals.h50)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatHours(totals.h75)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatHours(totals.h100)}</td>
                                    <td colSpan={2} style={{ textAlign: 'center', fontSize: '0.82rem', color: '#555' }}>
                                        {totals.nightsWorked} noite(s) trabalhada(s) (50€)<br />
                                        {totals.nightsAway} noite(s) fora de casa (25€)<br />
                                        Férias: {totals.feriasDays} · Faltas: {totals.faltaDays} · Feriados: {totals.feriadoDays}
                                    </td>
                                </tr>
                                <tr style={{ backgroundColor: '#fff3e0', fontWeight: 'bold' }}>
                                    <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem', color: '#e65100' }}>Total geral:</td>
                                    <td colSpan={5} style={{ color: '#bf360c', fontSize: '1rem' }}>{formatHours(totalHours)}</td>
                                </tr>
                            </Box>
                        )}
                    </Table>
                </div>
            </Sheet>

            {/* Modal criar / editar */}
            <Modal open={openModal} onClose={closeModal}>
                <ModalDialog sx={{ maxWidth: 500, width: '95%' }}>
                    <ModalClose />
                    <Typography level="h4" sx={{ mb: 1, color: '#f57c00' }}>
                        {isEdit ? 'Editar Registo' : 'Novo Registo'}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <FormControl size="sm" required>
                            <FormLabel>Tipo de registo</FormLabel>
                            <Select value={form.recordType} onChange={(_, v) => handleFormChange('recordType', v ?? 'trabalho')}>
                                <Option value="trabalho">Trabalho</Option>
                                <Option value="falta">Falta</Option>
                                <Option value="feriado">Feriado (não trabalhado)</Option>
                            </Select>
                        </FormControl>

                        <FormControl size="sm" required>
                            <FormLabel>Data</FormLabel>
                            <Input type="date" value={form.date} slotProps={{ input: { max: todayStr() } }} onChange={e => handleFormChange('date', e.target.value)} />
                        </FormControl>

                        {form.recordType === 'trabalho' && (
                            <>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <FormControl size="sm" required sx={{ flex: 1 }}>
                                        <FormLabel>Hora de entrada</FormLabel>
                                        <Select value={form.entryTime} onChange={(_, v) => handleFormChange('entryTime', v ?? '')} placeholder="--:--">
                                            {TIME_OPTIONS.map(t => <Option key={t} value={t}>{t}</Option>)}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="sm" required sx={{ flex: 1 }}>
                                        <FormLabel>Hora de saída</FormLabel>
                                        <Select value={form.exitTime} onChange={(_, v) => handleFormChange('exitTime', v ?? '')} placeholder="--:--">
                                            {TIME_OPTIONS.map(t => <Option key={t} value={t}>{t}</Option>)}
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mt: 0.5 }}>
                                    <Checkbox
                                        label="Jantar"
                                        checked={form.dinner}
                                        onChange={e => handleFormChange('dinner', e.target.checked)}
                                    />
                                    <Checkbox
                                        label="Feriado (força 100%)"
                                        checked={form.isHoliday}
                                        onChange={e => handleFormChange('isHoliday', e.target.checked)}
                                    />
                                    {showExitHoliday && (
                                        <Checkbox
                                            label="Saída em feriado"
                                            checked={form.exitIsHoliday}
                                            onChange={e => handleFormChange('exitIsHoliday', e.target.checked)}
                                        />
                                    )}
                                    {showWeekendFields && (
                                        <Checkbox
                                            label="Almoço de fim de semana"
                                            checked={form.weekendLunch}
                                            onChange={e => handleFormChange('weekendLunch', e.target.checked)}
                                        />
                                    )}
                                </Box>

                                <Divider />

                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <FormControl size="sm" sx={{ flex: 1 }}>
                                        <FormLabel>Horas 50%</FormLabel>
                                        <Input type="number" value={form.hours50}
                                            slotProps={{ input: { min: 0, step: 0.25 } }}
                                            onChange={e => handleFormChange('hours50', parseFloat(e.target.value) || 0)} />
                                    </FormControl>
                                    <FormControl size="sm" sx={{ flex: 1 }}>
                                        <FormLabel>Horas 75%</FormLabel>
                                        <Input type="number" value={form.hours75}
                                            slotProps={{ input: { min: 0, step: 0.25 } }}
                                            onChange={e => handleFormChange('hours75', parseFloat(e.target.value) || 0)} />
                                    </FormControl>
                                    <FormControl size="sm" sx={{ flex: 1 }}>
                                        <FormLabel>Horas 100%</FormLabel>
                                        <Input type="number" value={form.hours100}
                                            slotProps={{ input: { min: 0, step: 0.25 } }}
                                            onChange={e => handleFormChange('hours100', parseFloat(e.target.value) || 0)} />
                                    </FormControl>
                                </Box>

                                <Typography level="body-xs" sx={{ color: '#888', mt: -1 }}>
                                    Valores calculados automaticamente. Pode ajustar manualmente se necessário.
                                </Typography>

                                <FormControl size="sm">
                                    <FormLabel>Tipo de noite</FormLabel>
                                    <Select value={form.nightType} onChange={(_, v) => handleFormChange('nightType', v ?? '')}>
                                        <Option value="">Nenhuma</Option>
                                        <Option value="trabalhada">Noite trabalhada</Option>
                                        <Option value="fora_de_casa">Fora de casa</Option>
                                    </Select>
                                </FormControl>

                                {showClientObra && (
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <FormControl size="sm" required sx={{ flex: 1 }}>
                                            <FormLabel>Cliente</FormLabel>
                                            <Input value={form.client} onChange={e => handleFormChange('client', e.target.value)} placeholder="Nome do cliente" />
                                        </FormControl>
                                        <FormControl size="sm" required sx={{ flex: 1 }}>
                                            <FormLabel>Obra / Local</FormLabel>
                                            <Input value={form.obra} onChange={e => handleFormChange('obra', e.target.value)} placeholder="Local da obra" />
                                        </FormControl>
                                    </Box>
                                )}
                            </>
                        )}

                        {form.recordType !== 'trabalho' && (
                            <Typography level="body-sm" sx={{ color: '#666' }}>
                                {form.recordType === 'falta'
                                    ? 'Este dia será marcado como "Falta" no PDF de horas extra.'
                                    : 'Este dia será marcado como "Feriado" no PDF de horas extra.'}
                            </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'flex-end' }}>
                            <Button variant="plain" color="neutral" onClick={closeModal}>Cancelar</Button>
                            <Button color="warning" loading={loading} onClick={handleSubmit}>
                                {isEdit ? 'Actualizar' : 'Guardar'}
                            </Button>
                        </Box>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* Modal período de férias */}
            <Modal open={vacationModal.open} onClose={closeVacationModal}>
                <ModalDialog sx={{ maxWidth: 420, width: '95%' }}>
                    <ModalClose />
                    <Typography level="h4" sx={{ mb: 1, color: '#f57c00' }}>
                        Período de Férias
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography level="body-sm" sx={{ color: '#666', mb: 1.5 }}>
                        Cria automaticamente um registo "Férias" para cada dia útil do período (máximo {MAX_VACATION_BUSINESS_DAYS} dias úteis).
                        Fins de semana ficam de fora. Pode repetir para outros períodos.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Data início</FormLabel>
                                <Input
                                    type="date"
                                    value={vacationModal.startDate}
                                    onChange={e => setVacationModal(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </FormControl>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Data fim</FormLabel>
                                <Input
                                    type="date"
                                    value={vacationModal.endDate}
                                    onChange={e => setVacationModal(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'flex-end' }}>
                            <Button variant="plain" color="neutral" onClick={closeVacationModal}>Cancelar</Button>
                            <Button color="warning" loading={vacationLoading} onClick={handleVacationSubmit}>
                                Adicionar
                            </Button>
                        </Box>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* Modal confirmação de eliminação */}
            <Modal open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle>Confirmar eliminação</DialogTitle>
                    <Divider />
                    <DialogContent>
                        Tem a certeza que pretende eliminar este registo? Esta acção não pode ser revertida.
                    </DialogContent>
                    <DialogActions>
                        <Button variant="solid" color="danger" onClick={handleDeleteConfirm}>
                            Eliminar
                        </Button>
                        <Button variant="plain" color="neutral" onClick={() => setDeleteConfirm({ open: false, id: null })}>
                            Cancelar
                        </Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>

            {/* Modal dias úteis em falta */}
            <Modal open={missingDaysModal.open} onClose={() => setMissingDaysModal({ open: false, missing: [] })}>
                <ModalDialog variant="outlined" role="alertdialog" sx={{ maxWidth: 480, width: '95%' }}>
                    <DialogTitle>Dias úteis por preencher</DialogTitle>
                    <Divider />
                    <DialogContent>
                        <Typography level="body-sm" sx={{ mb: 1.5 }}>
                            Não é possível enviar as horas extra: faltam registos em <strong>{missingDaysModal.missing.length}</strong> dia(s)
                            útil(eis) de {MONTHS[month - 1]} {year}. Preencha-os (trabalho, férias, falta ou feriado) antes de enviar.
                        </Typography>
                        <Box sx={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {missingDaysModal.missing.map(d => (
                                <Chip key={d} size="sm" color="danger" variant="soft">
                                    {new Date(d + 'T12:00:00').toLocaleDateString('pt-PT')}
                                </Chip>
                            ))}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="solid" color="neutral" onClick={() => setMissingDaysModal({ open: false, missing: [] })}>
                            Fechar
                        </Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>

            {/* Modal confirmação de envio de email */}
            <Modal open={sendConfirm.open} onClose={() => setSendConfirm({ open: false, comment: '' })}>
                <ModalDialog sx={{ maxWidth: 460, width: '95%' }}>
                    <DialogTitle>Enviar Horas Extra</DialogTitle>
                    <Divider />
                    <DialogContent>
                        <Typography level="body-sm" sx={{ mb: 1.5 }}>
                            Será enviado um email com as horas extra de <strong>{MONTHS[month - 1]} {year}</strong> para <strong>geral@emg.com.pt</strong> e para o seu email.
                            {records.some(r => isWorkRecord(r) && (r.nightType === 'trabalhada' || r.nightType === 'fora_de_casa')) && (
                                ' Será também enviado o mapa de ajudas de custo do mesmo período.'
                            )}
                        </Typography>
                        <FormControl size="sm">
                            <FormLabel>Comentário (opcional)</FormLabel>
                            <textarea
                                rows={4}
                                value={sendConfirm.comment}
                                onChange={e => setSendConfirm(prev => ({ ...prev, comment: e.target.value }))}
                                placeholder="Adicione uma nota ao email..."
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid #cdd7e1',
                                    fontFamily: 'inherit',
                                    fontSize: '0.875rem',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="solid" color="success" onClick={handleSendEmailConfirm}>
                            Enviar
                        </Button>
                        <Button variant="plain" color="neutral" onClick={() => setSendConfirm({ open: false, comment: '' })}>
                            Cancelar
                        </Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        </>
    );
}
