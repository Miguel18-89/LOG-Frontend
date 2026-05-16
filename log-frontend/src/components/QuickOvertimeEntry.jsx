import { useState } from 'react';
import axios from 'axios';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import Box from '@mui/joy/Box';
import Input from '@mui/joy/Input';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Checkbox from '@mui/joy/Checkbox';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Divider from '@mui/joy/Divider';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://213.199.58.233:3000';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
});

function todayStr() {
    return new Date().toISOString().split('T')[0];
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

function formatHours(h) {
    const total = Math.round((h || 0) * 60);
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

const emptyForm = {
    date: todayStr(),
    entryTime: '09:00',
    exitTime: '',
    dinner: false,
    isHoliday: false,
    weekendLunch: false,
};

export default function QuickOvertimeEntry() {
    const [pin, setPin] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const showWeekendFields = isWeekendDate(form.date) || form.isHoliday;
    const hours = calcHours(form.date, form.entryTime, form.exitTime, form.isHoliday, form.dinner, form.weekendLunch);
    const nightType = detectNightType(form.exitTime);

    function handleFormChange(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    async function handleSubmit() {
        if (!pin.trim()) { toast.error('Introduza o seu PIN.'); return; }
        if (!form.exitTime) { toast.error('Indique a hora de saída.'); return; }
        if (form.date > todayStr()) { toast.error('Não é possível registar datas futuras.'); return; }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/emg/horas-extra/public`, {
                pin: pin.trim(),
                ...form,
                nightType,
            });
            setSuccess(true);
        } catch (err) {
            const msg = err.response?.data?.error || 'Erro ao guardar o registo.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    function handleReset() {
        setSuccess(false);
        setPin('');
        setForm(emptyForm);
    }

    if (success) {
        return (
            <Box sx={{ position: 'fixed', inset: 0, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#fff8e1' }}>
                <Sheet variant="outlined" sx={{ p: 4, borderRadius: 'lg', boxShadow: 'lg', textAlign: 'center', maxWidth: 360, width: '100%' }}>
                    <Typography sx={{ fontSize: '3.5rem', lineHeight: 1, mb: 1 }}>✓</Typography>
                    <Typography level="h4" sx={{ color: '#2e7d32', mb: 1 }}>Registo gravado!</Typography>
                    <Typography level="body-sm" sx={{ color: '#666', mb: 3 }}>
                        As suas horas extra foram registadas com sucesso.
                    </Typography>
                    <Button variant="outlined" color="warning" onClick={handleReset}>
                        Novo registo
                    </Button>
                </Sheet>
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'fixed', inset: 0, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#fff8e1' }}>
            <Sheet variant="outlined" sx={{ p: 3, borderRadius: 'lg', boxShadow: 'lg', maxWidth: 420, width: '100%' }}>
                <Typography level="h4" sx={{ mb: 0.5, fontWeight: 'bold', color: '#f57c00', textAlign: 'center' }}>
                    Horas Extra
                </Typography>
                <Typography level="body-xs" sx={{ textAlign: 'center', color: '#999', mb: 2 }}>
                    Registo rápido
                </Typography>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl required>
                        <FormLabel>PIN</FormLabel>
                        <Input
                            type="password"
                            placeholder="••••"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            slotProps={{
                                input: {
                                    style: { fontSize: '1.6rem', letterSpacing: '0.5rem', textAlign: 'center' },
                                    inputMode: 'numeric',
                                },
                            }}
                        />
                    </FormControl>

                    <FormControl required>
                        <FormLabel>Data</FormLabel>
                        <Input
                            type="date"
                            value={form.date}
                            slotProps={{ input: { max: todayStr() } }}
                            onChange={e => handleFormChange('date', e.target.value)}
                        />
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControl required sx={{ flex: 1 }}>
                            <FormLabel>Entrada</FormLabel>
                            <Select value={form.entryTime} onChange={(_, v) => handleFormChange('entryTime', v ?? '')} placeholder="--:--">
                                {TIME_OPTIONS.map(t => <Option key={t} value={t}>{t}</Option>)}
                            </Select>
                        </FormControl>
                        <FormControl required sx={{ flex: 1 }}>
                            <FormLabel>Saída</FormLabel>
                            <Select value={form.exitTime} onChange={(_, v) => handleFormChange('exitTime', v ?? '')} placeholder="--:--">
                                {TIME_OPTIONS.map(t => <Option key={t} value={t}>{t}</Option>)}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Checkbox
                            label="Jantar"
                            checked={form.dinner}
                            onChange={e => handleFormChange('dinner', e.target.checked)}
                        />
                        <Checkbox
                            label="Feriado"
                            checked={form.isHoliday}
                            onChange={e => handleFormChange('isHoliday', e.target.checked)}
                        />
                        {showWeekendFields && (
                            <Checkbox
                                label="Almoço fim de semana"
                                checked={form.weekendLunch}
                                onChange={e => handleFormChange('weekendLunch', e.target.checked)}
                            />
                        )}
                    </Box>

                    {form.exitTime && (
                        <Box sx={{ bgcolor: '#fff3e0', borderRadius: 'sm', p: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555' }}>
                                <span>Horas 50%</span><strong>{formatHours(hours.h50)}</strong>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555' }}>
                                <span>Horas 75%</span><strong>{formatHours(hours.h75)}</strong>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555' }}>
                                <span>Horas 100%</span><strong>{formatHours(hours.h100)}</strong>
                            </Box>
                            {nightType === 'trabalhada' && (
                                <Box sx={{ mt: 0.5, fontSize: '0.82rem', color: '#e65100', fontWeight: 'bold' }}>
                                    Noite trabalhada detectada
                                </Box>
                            )}
                        </Box>
                    )}

                    <Button
                        color="warning"
                        loading={loading}
                        onClick={handleSubmit}
                        size="lg"
                        sx={{ mt: 0.5 }}
                    >
                        Guardar
                    </Button>
                </Box>
            </Sheet>
        </Box>
    );
}
