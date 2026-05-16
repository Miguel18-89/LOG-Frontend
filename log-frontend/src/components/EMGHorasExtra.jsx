import { useState, useEffect } from 'react';
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
import Divider from '@mui/joy/Divider';
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

// Opções de hora em intervalos de 30 minutos
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
});

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

function calcHours(date, entryTime, exitTime, isHoliday, dinner) {
    if (!date || !entryTime || !exitTime) return { h50: 0, h75: 0, h100: 0 };
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0=Dom, 6=Sáb
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const [eH, eM] = entryTime.split(':').map(Number);
    const [xH, xM] = exitTime.split(':').map(Number);
    let totalMin = (xH * 60 + xM) - (eH * 60 + eM);
    if (totalMin <= 0) totalMin += 24 * 60;

    // Descontar 10h (9h trabalho + 1h almoço) e 1h de jantar se aplicável
    let overtimeMin = totalMin - 10 * 60;
    if (dinner) overtimeMin -= 60;
    if (overtimeMin <= 0) return { h50: 0, h75: 0, h100: 0 };

    const overtime = overtimeMin / 60;
    if (isWeekend || isHoliday) return { h50: 0, h75: 0, h100: overtime };
    return { h50: Math.min(overtime, 1), h75: Math.max(0, overtime - 1), h100: 0 };
}

const emptyForm = {
    date: '',
    entryTime: '',
    exitTime: '',
    dinner: false,
    isHoliday: false,
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
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);

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
            if (['date', 'entryTime', 'exitTime', 'isHoliday', 'dinner'].includes(field)) {
                const { h50, h75, h100 } = calcHours(
                    updated.date, updated.entryTime, updated.exitTime, updated.isHoliday, updated.dinner
                );
                updated.hours50 = h50;
                updated.hours75 = h75;
                updated.hours100 = h100;
            }
            return updated;
        });
    }

    function handleOpenModal() {
        setForm({ ...emptyForm, date: todayStr() });
        setOpenModal(true);
    }

    async function handleSubmit() {
        if (!form.date || !form.entryTime || !form.exitTime) {
            toast.error('Preencha a data, hora de entrada e hora de saída.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/emg/horas-extra', form);
            toast.success('Registo adicionado.');
            setOpenModal(false);
            setForm({ ...emptyForm, date: todayStr() });
            fetchRecords();
        } catch {
            toast.error('Erro ao guardar o registo.');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        try {
            await api.delete(`/emg/horas-extra/${id}`);
            toast.success('Registo eliminado.');
            fetchRecords();
        } catch {
            toast.error('Erro ao eliminar o registo.');
        }
    }

    function closeModal() {
        setOpenModal(false);
        setForm({ ...emptyForm, date: todayStr() });
    }

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
                    sx={{
                        mx: 'auto',
                        p: 3,
                        borderRadius: 'sm',
                        boxShadow: 'lg',
                        backgroundColor: '#fff',
                        maxWidth: 1100,
                    }}
                >
                    <Typography
                        level="h4"
                        sx={{ mb: 2, fontWeight: 'bold', color: '#f57c00', textAlign: 'center' }}
                    >
                        Horas Extra
                    </Typography>

                    {/* Filtros + botão */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <FormControl size="sm">
                            <FormLabel>Ano</FormLabel>
                            <Select
                                value={year}
                                onChange={(_, v) => setYear(v)}
                                size="sm"
                                sx={{ minWidth: 100 }}
                            >
                                {years.map(y => <Option key={y} value={y}>{y}</Option>)}
                            </Select>
                        </FormControl>

                        <FormControl size="sm">
                            <FormLabel>Mês</FormLabel>
                            <Select
                                value={month}
                                onChange={(_, v) => setMonth(v)}
                                size="sm"
                                sx={{ minWidth: 140 }}
                            >
                                {MONTHS.map((m, i) => (
                                    <Option key={i + 1} value={i + 1}>{m}</Option>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            size="sm"
                            color="warning"
                            onClick={handleOpenModal}
                            sx={{ ml: 'auto' }}
                        >
                            + Adicionar Registo
                        </Button>
                    </Box>

                    {/* Tabela */}
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
                                    <th style={{ textAlign: 'center', width: 40 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            style={{ textAlign: 'center', padding: '2rem', color: '#999' }}
                                        >
                                            Sem registos para {MONTHS[month - 1]} {year}
                                        </td>
                                    </tr>
                                ) : records.map(r => (
                                    <tr key={r.id}>
                                        <td>
                                            {r.date
                                                ? new Date(r.date).toLocaleDateString('pt-PT')
                                                : '---'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{r.entryTime || '---'}</td>
                                        <td style={{ textAlign: 'center' }}>{r.exitTime || '---'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {r.dinner ? '✓' : '✗'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{formatHours(r.hours50)}</td>
                                        <td style={{ textAlign: 'center' }}>{formatHours(r.hours75)}</td>
                                        <td style={{ textAlign: 'center' }}>{formatHours(r.hours100)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {r.nightType === 'trabalhada'
                                                ? 'Trabalhada'
                                                : r.nightType === 'fora_de_casa'
                                                    ? 'Fora de casa'
                                                    : '---'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <IconButton
                                                size="sm"
                                                color="danger"
                                                variant="plain"
                                                onClick={() => handleDelete(r.id)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                            {records.length > 0 && (
                                <tfoot>
                                    <tr style={{ fontWeight: 'bold', backgroundColor: '#fff8e1' }}>
                                        <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem', color: '#e65100' }}>
                                            Totais:
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{formatHours(totals.h50)}</td>
                                        <td style={{ textAlign: 'center' }}>{formatHours(totals.h75)}</td>
                                        <td style={{ textAlign: 'center' }}>{formatHours(totals.h100)}</td>
                                        <td colSpan={2} style={{ textAlign: 'center', fontSize: '0.82rem', color: '#555' }}>
                                            {totals.nightsWorked} noite(s) trabalhada(s)<br />
                                            {totals.nightsAway} noite(s) fora de casa
                                        </td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#fff3e0', fontWeight: 'bold' }}>
                                        <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem', color: '#e65100' }}>
                                            Total geral:
                                        </td>
                                        <td colSpan={5} style={{ color: '#bf360c', fontSize: '1rem' }}>
                                            {formatHours(totalHours)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </Table>
                    </div>
            </Sheet>

            {/* Modal novo registo */}
            <Modal open={openModal} onClose={closeModal}>
                <ModalDialog sx={{ maxWidth: 500, width: '95%' }}>
                    <ModalClose />
                    <Typography level="h4" sx={{ mb: 1, color: '#f57c00' }}>
                        Novo Registo
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <FormControl size="sm" required>
                            <FormLabel>Data</FormLabel>
                            <Input
                                type="date"
                                value={form.date}
                                onChange={e => handleFormChange('date', e.target.value)}
                            />
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Hora de entrada</FormLabel>
                                <Select
                                    value={form.entryTime}
                                    onChange={(_, v) => handleFormChange('entryTime', v ?? '')}
                                    placeholder="--:--"
                                >
                                    {TIME_OPTIONS.map(t => (
                                        <Option key={t} value={t}>{t}</Option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Hora de saída</FormLabel>
                                <Select
                                    value={form.exitTime}
                                    onChange={(_, v) => handleFormChange('exitTime', v ?? '')}
                                    placeholder="--:--"
                                >
                                    {TIME_OPTIONS.map(t => (
                                        <Option key={t} value={t}>{t}</Option>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 4, mt: 0.5 }}>
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
                        </Box>

                        <Divider />

                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Horas 50%</FormLabel>
                                <Input
                                    type="number"
                                    value={form.hours50}
                                    slotProps={{ input: { min: 0, step: 0.25 } }}
                                    onChange={e => handleFormChange('hours50', parseFloat(e.target.value) || 0)}
                                />
                            </FormControl>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Horas 75%</FormLabel>
                                <Input
                                    type="number"
                                    value={form.hours75}
                                    slotProps={{ input: { min: 0, step: 0.25 } }}
                                    onChange={e => handleFormChange('hours75', parseFloat(e.target.value) || 0)}
                                />
                            </FormControl>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Horas 100%</FormLabel>
                                <Input
                                    type="number"
                                    value={form.hours100}
                                    slotProps={{ input: { min: 0, step: 0.25 } }}
                                    onChange={e => handleFormChange('hours100', parseFloat(e.target.value) || 0)}
                                />
                            </FormControl>
                        </Box>

                        <Typography level="body-xs" sx={{ color: '#888', mt: -1 }}>
                            Valores calculados automaticamente. Pode ajustar manualmente se necessário.
                        </Typography>

                        <FormControl size="sm">
                            <FormLabel>Tipo de noite</FormLabel>
                            <Select
                                value={form.nightType}
                                onChange={(_, v) => handleFormChange('nightType', v ?? '')}
                            >
                                <Option value="">Nenhuma</Option>
                                <Option value="trabalhada">Noite trabalhada</Option>
                                <Option value="fora_de_casa">Fora de casa</Option>
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'flex-end' }}>
                            <Button variant="plain" color="neutral" onClick={closeModal}>
                                Cancelar
                            </Button>
                            <Button color="warning" loading={loading} onClick={handleSubmit}>
                                Guardar
                            </Button>
                        </Box>
                    </Box>
                </ModalDialog>
            </Modal>
        </>
    );
}
