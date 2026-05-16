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

function todayStr() {
    return new Date().toISOString().split('T')[0];
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

function detectNightType(exitTime) {
    if (!exitTime) return null;
    const [h, m] = exitTime.split(':').map(Number);
    const totalMin = h * 60 + m;
    if (totalMin >= 2 * 60 && totalMin < 9 * 60) return 'trabalhada';
    return null;
}

function calcHours(date, entryTime, exitTime, isHoliday, dinner, weekendLunch) {
    if (!date || !entryTime || !exitTime) return { h50: 0, h75: 0, h100: 0 };
    const d = new Date(date + 'T12:00:00');
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const [eH, eM] = entryTime.split(':').map(Number);
    const [xH, xM] = exitTime.split(':').map(Number);
    let totalMin = (xH * 60 + xM) - (eH * 60 + eM);
    if (totalMin <= 0) totalMin += 24 * 60;

    if (isWeekend || isHoliday) {
        let workMin = totalMin;
        if (weekendLunch) workMin -= 60;
        if (dinner) workMin -= 60;
        if (workMin <= 0) return { h50: 0, h75: 0, h100: 0 };
        return { h50: 0, h75: 0, h100: workMin / 60 };
    }

    let overtimeMin = totalMin - 10 * 60;
    if (dinner) overtimeMin -= 60;
    if (overtimeMin <= 0) return { h50: 0, h75: 0, h100: 0 };

    const overtime = overtimeMin / 60;
    return { h50: Math.min(overtime, 1), h75: Math.max(0, overtime - 1), h100: 0 };
}

const emptyForm = {
    date: '',
    entryTime: '',
    exitTime: '',
    dinner: false,
    isHoliday: false,
    weekendLunch: false,
    hours50: 0,
    hours75: 0,
    hours100: 0,
    nightType: '',
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
            if (['date', 'entryTime', 'exitTime', 'isHoliday', 'dinner', 'weekendLunch'].includes(field)) {
                const { h50, h75, h100 } = calcHours(
                    updated.date, updated.entryTime, updated.exitTime,
                    updated.isHoliday, updated.dinner, updated.weekendLunch
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
        setForm({ ...emptyForm, date: todayStr(), entryTime: '09:00' });
        setOpenModal(true);
    }

    function handleOpenEditModal(record) {
        setIsEdit(true);
        setEditId(record.id);
        setForm({
            date: record.date ? record.date.split('T')[0] : '',
            entryTime: record.entryTime || '',
            exitTime: record.exitTime || '',
            dinner: record.dinner || false,
            isHoliday: false,
            weekendLunch: record.weekendLunch || false,
            hours50: record.hours50 || 0,
            hours75: record.hours75 || 0,
            hours100: record.hours100 || 0,
            nightType: record.nightType || '',
        });
        setOpenModal(true);
    }

    async function handleSubmit() {
        if (!form.date || !form.entryTime || !form.exitTime) {
            toast.error('Preencha a data, hora de entrada e hora de saída.');
            return;
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
        } catch {
            toast.error(isEdit ? 'Erro ao actualizar o registo.' : 'Erro ao guardar o registo.');
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

    function handleSendEmail() {
        if (records.length === 0) {
            toast.warning('Sem registos para enviar.');
            return;
        }
        setSendConfirm({ open: true, comment: '' });
    }

    async function handleSendEmailConfirm() {
        setSending(true);
        setSendConfirm(prev => ({ ...prev, open: false }));
        try {
            const monthName = MONTHS[month - 1];
            const doc = new jsPDF();

            const userName = getUserName();
            doc.setFontSize(14);
            doc.setTextColor(245, 124, 0);
            doc.text(`Horas Extra — ${userName ? userName + ' — ' : ''}${monthName} ${year}`, 14, 18);

            autoTable(doc, {
                startY: 26,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [245, 124, 0], textColor: 255, fontStyle: 'bold' },
                footStyles: { fillColor: [255, 243, 224], textColor: [191, 54, 12], fontStyle: 'bold' },
                head: [['Data', 'Entrada', 'Saída', 'Jantar', 'Horas 50%', 'Horas 75%', 'Horas 100%', 'Tipo de Noite']],
                body: records.map(r => [
                    r.date ? new Date(r.date).toLocaleDateString('pt-PT') : '---',
                    r.entryTime || '---',
                    r.exitTime || '---',
                    r.dinner ? 'Sim' : 'Não',
                    formatHours(r.hours50),
                    formatHours(r.hours75),
                    formatHours(r.hours100),
                    r.nightType === 'trabalhada' ? 'Trabalhada'
                        : r.nightType === 'fora_de_casa' ? 'Fora de casa'
                        : '---',
                ]),
                foot: [[
                    { content: 'Totais:', colSpan: 4, styles: { halign: 'right' } },
                    formatHours(totals.h50),
                    formatHours(totals.h75),
                    formatHours(totals.h100),
                    `${totals.nightsWorked} trabalhada(s) / ${totals.nightsAway} fora de casa`,
                ]],
            });

            const pdfBase64 = doc.output('datauristring').split(',')[1];

            await api.post('/emg/horas-extra/enviar', {
                pdf: pdfBase64,
                month,
                year,
                monthName,
                comment: sendConfirm.comment.trim(),
            });
            toast.success('Email enviado com sucesso.');
        } catch (err) {
            console.error('Erro ao enviar email:', err);
            toast.error('Erro ao enviar email. Verifique a consola para mais detalhes.');
        } finally {
            setSending(false);
        }
    }

    const showWeekendFields = isWeekendDate(form.date) || form.isHoliday;

    const totals = records.reduce(
        (acc, r) => ({
            h50: acc.h50 + (r.hours50 || 0),
            h75: acc.h75 + (r.hours75 || 0),
            h100: acc.h100 + (r.hours100 || 0),
            nightsAway: acc.nightsAway + (r.nightType === 'fora_de_casa' ? 1 : 0),
            nightsWorked: acc.nightsWorked + (r.nightType === 'trabalhada' ? 1 : 0),
        }),
        { h50: 0, h75: 0, h100: 0, nightsAway: 0, nightsWorked: 0 }
    );
    const totalHours = totals.h50 + totals.h75 + totals.h100;

    return (
        <>
            <Sheet
                variant="outlined"
                sx={{ mx: 'auto', p: 3, borderRadius: 'sm', boxShadow: 'lg', backgroundColor: '#fff', maxWidth: 1100 }}
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
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                        <Button size="sm" color="success" loading={sending} onClick={handleSendEmail}>
                            Enviar Horas
                        </Button>
                        <Button size="sm" color="warning" onClick={handleOpenModal}>
                            + Adicionar Registo
                        </Button>
                    </Box>
                </Box>

                <div style={{ overflowX: 'auto' }}>
                    <Table borderAxis="xBetween" size="sm" stripe="odd" sx={{ minWidth: 800 }}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th style={{ textAlign: 'center' }}>Entrada</th>
                                <th style={{ textAlign: 'center' }}>Saída</th>
                                <th style={{ textAlign: 'center' }}>Jantar</th>
                                <th style={{ textAlign: 'center' }}>Horas 50%</th>
                                <th style={{ textAlign: 'center' }}>Horas 75%</th>
                                <th style={{ textAlign: 'center' }}>Horas 100%</th>
                                <th style={{ textAlign: 'center' }}>Tipo de Noite</th>
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
                                    <td style={{ textAlign: 'center' }}>{r.entryTime || '---'}</td>
                                    <td style={{ textAlign: 'center' }}>{r.exitTime || '---'}</td>
                                    <td style={{ textAlign: 'center' }}>{r.dinner ? '✓' : '✗'}</td>
                                    <td style={{ textAlign: 'center' }}>{formatHours(r.hours50)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatHours(r.hours75)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatHours(r.hours100)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {r.nightType === 'trabalhada' ? 'Trabalhada'
                                            : r.nightType === 'fora_de_casa' ? 'Fora de casa'
                                            : '---'}
                                    </td>
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
                            <tfoot>
                                <tr style={{ fontWeight: 'bold', backgroundColor: '#fff8e1' }}>
                                    <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem', color: '#e65100' }}>Totais:</td>
                                    <td style={{ textAlign: 'center' }}>{formatHours(totals.h50)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatHours(totals.h75)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatHours(totals.h100)}</td>
                                    <td colSpan={2} style={{ textAlign: 'center', fontSize: '0.82rem', color: '#555' }}>
                                        {totals.nightsWorked} noite(s) trabalhada(s)<br />
                                        {totals.nightsAway} noite(s) fora de casa
                                    </td>
                                </tr>
                                <tr style={{ backgroundColor: '#fff3e0', fontWeight: 'bold' }}>
                                    <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem', color: '#e65100' }}>Total geral:</td>
                                    <td colSpan={5} style={{ color: '#bf360c', fontSize: '1rem' }}>{formatHours(totalHours)}</td>
                                </tr>
                            </tfoot>
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
                            <FormLabel>Data</FormLabel>
                            <Input type="date" value={form.date} slotProps={{ input: { max: todayStr() } }} onChange={e => handleFormChange('date', e.target.value)} />
                        </FormControl>

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

                        <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'flex-end' }}>
                            <Button variant="plain" color="neutral" onClick={closeModal}>Cancelar</Button>
                            <Button color="warning" loading={loading} onClick={handleSubmit}>
                                {isEdit ? 'Actualizar' : 'Guardar'}
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

            {/* Modal confirmação de envio de email */}
            <Modal open={sendConfirm.open} onClose={() => setSendConfirm({ open: false, comment: '' })}>
                <ModalDialog sx={{ maxWidth: 460, width: '95%' }}>
                    <DialogTitle>Enviar Horas Extra</DialogTitle>
                    <Divider />
                    <DialogContent>
                        <Typography level="body-sm" sx={{ mb: 1.5 }}>
                            Será enviado um email com as horas extra de <strong>{MONTHS[month - 1]} {year}</strong> para <strong>geral@emg.com.pt</strong> e para o seu email.
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
