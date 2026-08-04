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
import Divider from '@mui/joy/Divider';
import { toast } from 'react-toastify';

function formatCurrency(v) {
    return `${(v || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function formatDate(d) {
    return d ? new Date(d).toLocaleDateString('pt-PT') : '---';
}

function typeLabel(type) {
    if (type === 'credito') return 'Crédito (horas extra)';
    if (type === 'despesa') return 'Despesa';
    if (type === 'ajuste') return 'Ajuste';
    return type;
}

function formatHoursShort(h) {
    const total = Math.round((h || 0) * 60);
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    return mm === 0 ? `${hh}h` : `${hh}h${String(mm).padStart(2, '0')}`;
}

// Descreve quantas horas de cada escalão (100/75/50%) compõem um crédito — a percentagem já
// inclui o acréscimo sobre a taxa base (100% = taxa base + 100%, etc.).
function formatBreakdown(e) {
    if (e.type !== 'credito') return '---';
    const parts = [];
    if (e.hours100) parts.push(`${formatHoursShort(e.hours100)} a 100%`);
    if (e.hours75) parts.push(`${formatHoursShort(e.hours75)} a 75%`);
    if (e.hours50) parts.push(`${formatHoursShort(e.hours50)} a 50%`);
    if (parts.length > 0) return parts.join(' + ');
    return e.hours != null ? formatHoursShort(e.hours) : '---';
}

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

const emptyAdjustment = { date: todayStr(), description: '', value: '' };
const emptyExpense = { date: todayStr(), description: '', value: '' };

export default function EMGBancoHoras() {
    const [balance, setBalance] = useState(0);
    const [hourlyRate, setHourlyRate] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rateInput, setRateInput] = useState('');
    const [savingRate, setSavingRate] = useState(false);
    const [adjustmentModal, setAdjustmentModal] = useState({ open: false, ...emptyAdjustment });
    const [expenseModal, setExpenseModal] = useState({ open: false, ...emptyExpense });
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [typeFilter, setTypeFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [generatingStatement, setGeneratingStatement] = useState(false);

    useEffect(() => {
        fetchBalance();
    }, [page, pageSize, typeFilter, sortOrder]);

    async function fetchBalance() {
        setLoading(true);
        try {
            const res = await api.get('/emg/banco-horas', {
                params: { page, pageSize, type: typeFilter || undefined, sort: sortOrder },
            });
            setBalance(res.data.balance || 0);
            setHourlyRate(res.data.hourlyRate);
            setRateInput(res.data.hourlyRate != null ? String(res.data.hourlyRate) : '');
            setEntries(Array.isArray(res.data.entries) ? res.data.entries : []);
            setTotal(res.data.total || 0);
        } catch {
            toast.error('Erro ao carregar o banco de horas.');
        } finally {
            setLoading(false);
        }
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    async function handleGenerateStatement() {
        setGeneratingStatement(true);
        try {
            const res = await api.get('/emg/banco-horas', {
                params: { page: 1, pageSize: 100000, sort: 'asc' },
            });
            const allEntries = Array.isArray(res.data.entries) ? res.data.entries : [];
            const currentBalance = res.data.balance || 0;
            const userName = getUserName();

            const doc = new jsPDF();
            doc.setFontSize(14);
            doc.setTextColor(245, 124, 0);
            doc.text(`Extrato do Banco de Horas${userName ? ' — ' + userName : ''}`, 14, 18);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Gerado em ${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT')}`, 14, 24);
            doc.setTextColor(0);

            let runningBalance = 0;
            const body = allEntries.map(e => {
                runningBalance += e.value || 0;
                return [
                    formatDate(e.date),
                    typeLabel(e.type),
                    e.description || '---',
                    formatBreakdown(e),
                    e.hourlyRate != null ? formatCurrency(e.hourlyRate) : '---',
                    formatCurrency(e.value),
                    formatCurrency(runningBalance),
                ];
            });

            autoTable(doc, {
                startY: 30,
                styles: { fontSize: 7 },
                headStyles: { fillColor: [245, 124, 0], textColor: 255, fontStyle: 'bold' },
                head: [['Data', 'Tipo', 'Descrição', 'Horas', 'Taxa/h à data', 'Valor', 'Saldo acumulado']],
                body,
                foot: [[
                    { content: 'Saldo atual:', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: formatCurrency(currentBalance), styles: { fontStyle: 'bold' } },
                ]],
                footStyles: { fillColor: [255, 243, 224], textColor: [191, 54, 12] },
            });

            doc.save(`extrato-banco-horas-${userName ? userName.replace(/\s+/g, '-') + '-' : ''}${todayStr()}.pdf`);
        } catch {
            toast.error('Erro ao gerar o extrato.');
        } finally {
            setGeneratingStatement(false);
        }
    }

    // Entradas novas aparecem sempre na 1ª página (ordenadas por data desc); se já lá estivermos,
    // o próprio fetchBalance() chamado a seguir trata do refresh.
    function refreshAfterNewEntry() {
        if (page !== 1) setPage(1);
        else fetchBalance();
    }

    async function handleSaveRate() {
        const value = parseFloat(rateInput);
        if (!value || value <= 0) {
            toast.error('Indique uma taxa horária válida.');
            return;
        }
        setSavingRate(true);
        try {
            await api.put('/emg/banco-horas/taxa', { hourlyRate: value });
            toast.success('Taxa horária atualizada.');
            fetchBalance();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao atualizar a taxa horária.');
        } finally {
            setSavingRate(false);
        }
    }

    function openAdjustmentModal() {
        setAdjustmentModal({ open: true, ...emptyAdjustment });
    }

    function closeAdjustmentModal() {
        setAdjustmentModal({ open: false, ...emptyAdjustment });
    }

    async function handleSaveAdjustment() {
        const value = parseFloat(adjustmentModal.value);
        if (!adjustmentModal.date) { toast.error('Indique a data.'); return; }
        if (!value) { toast.error('Indique um valor (positivo ou negativo).'); return; }
        setSaving(true);
        try {
            await api.post('/emg/banco-horas/ajuste', {
                date: adjustmentModal.date,
                description: adjustmentModal.description.trim() || undefined,
                value,
            });
            toast.success('Ajuste registado.');
            closeAdjustmentModal();
            refreshAfterNewEntry();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao registar o ajuste.');
        } finally {
            setSaving(false);
        }
    }

    function openExpenseModal() {
        setExpenseModal({ open: true, ...emptyExpense });
    }

    function closeExpenseModal() {
        setExpenseModal({ open: false, ...emptyExpense });
    }

    async function handleSaveExpense() {
        const value = parseFloat(expenseModal.value);
        if (!expenseModal.date) { toast.error('Indique a data.'); return; }
        if (!expenseModal.description.trim()) { toast.error('Indique a descrição.'); return; }
        if (!value || value <= 0) { toast.error('Indique um valor positivo.'); return; }
        setSaving(true);
        try {
            await api.post('/emg/banco-horas/despesa', {
                date: expenseModal.date,
                description: expenseModal.description.trim(),
                value,
            });
            toast.success('Despesa registada.');
            closeExpenseModal();
            refreshAfterNewEntry();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao registar a despesa.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <Sheet
                variant="outlined"
                sx={{ mx: 'auto', p: 3, borderRadius: 'sm', boxShadow: 'lg', backgroundColor: '#fff', maxWidth: 900 }}
            >
                <Typography level="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#f57c00', textAlign: 'center' }}>
                    Banco de Horas
                </Typography>

                <Box sx={{ bgcolor: '#fff8e1', borderRadius: 'sm', p: 2.5, mb: 3, textAlign: 'center' }}>
                    <Typography level="body-sm" sx={{ color: '#888' }}>Saldo atual</Typography>
                    <Typography level="h2" sx={{ color: '#bf360c', fontWeight: 'bold' }}>
                        {loading ? '...' : formatCurrency(balance)}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <FormControl size="sm">
                        <FormLabel>Taxa horária (€/h)</FormLabel>
                        <Input
                            type="number"
                            value={rateInput}
                            slotProps={{ input: { min: 0, step: 0.01 } }}
                            onChange={e => setRateInput(e.target.value)}
                            sx={{ maxWidth: 160 }}
                        />
                    </FormControl>
                    <Button size="sm" color="warning" loading={savingRate} onClick={handleSaveRate}>
                        Guardar taxa
                    </Button>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button size="sm" variant="outlined" color="success" loading={generatingStatement} onClick={handleGenerateStatement}>
                            Gerar Extrato
                        </Button>
                        <Button size="sm" variant="outlined" color="neutral" onClick={openAdjustmentModal}>
                            + Ajuste
                        </Button>
                        <Button size="sm" variant="outlined" color="danger" onClick={openExpenseModal}>
                            + Despesa
                        </Button>
                    </Box>
                </Box>

                {hourlyRate == null && (
                    <Typography level="body-sm" sx={{ color: '#bf360c', mb: 2 }}>
                        Ainda não definiu a sua taxa horária — defina-a para poder passar horas extra para o banco de horas.
                    </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <FormControl size="sm">
                        <FormLabel>Tipo</FormLabel>
                        <Select
                            value={typeFilter}
                            onChange={(_, v) => { setTypeFilter(v ?? ''); setPage(1); }}
                            sx={{ minWidth: 160 }}
                        >
                            <Option value="">Todos</Option>
                            <Option value="credito">Horas</Option>
                            <Option value="ajuste">Ajustes</Option>
                            <Option value="despesa">Despesas</Option>
                        </Select>
                    </FormControl>
                    <FormControl size="sm">
                        <FormLabel>Ordenar por</FormLabel>
                        <Select
                            value={sortOrder}
                            onChange={(_, v) => { setSortOrder(v ?? 'desc'); setPage(1); }}
                            sx={{ minWidth: 180 }}
                        >
                            <Option value="desc">Mais recentes primeiro</Option>
                            <Option value="asc">Mais antigos primeiro</Option>
                        </Select>
                    </FormControl>
                </Box>

                <div style={{ overflowX: 'auto' }}>
                    <Table borderAxis="xBetween" size="sm" stripe="odd" sx={{ minWidth: 600 }}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Tipo</th>
                                <th>Descrição</th>
                                <th style={{ textAlign: 'center' }}>Horas</th>
                                <th style={{ textAlign: 'center' }}>Taxa/h à data</th>
                                <th style={{ textAlign: 'right' }}>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                        {loading ? 'A carregar...' : typeFilter ? 'Sem movimentos para este filtro.' : 'Sem movimentos no banco de horas.'}
                                    </td>
                                </tr>
                            ) : entries.map(e => (
                                <tr key={e.id}>
                                    <td>{formatDate(e.date)}</td>
                                    <td>{typeLabel(e.type)}</td>
                                    <td>{e.description || '---'}</td>
                                    <td style={{ textAlign: 'center' }}>{formatBreakdown(e)}</td>
                                    <td style={{ textAlign: 'center' }}>{e.hourlyRate != null ? formatCurrency(e.hourlyRate) : '---'}</td>
                                    <td style={{ textAlign: 'right', color: e.value < 0 ? '#c62828' : '#2e7d32', fontWeight: 'bold' }}>
                                        {formatCurrency(e.value)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                    <Typography level="body-sm" sx={{ color: '#666' }}>
                        {total} movimento(s) — página {page} de {totalPages}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="sm" variant="outlined" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Anterior</Button>
                        <Button size="sm" variant="outlined" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Seguinte ›</Button>
                    </Box>
                    <FormControl size="sm" orientation="horizontal" sx={{ gap: 1, ml: 'auto' }}>
                        <FormLabel sx={{ mb: 0 }}>Linhas:</FormLabel>
                        <Select value={pageSize} onChange={(_, v) => { setPageSize(v); setPage(1); }} sx={{ minWidth: 80 }}>
                            {[10, 20, 30].map(n => <Option key={n} value={n}>{n}</Option>)}
                        </Select>
                    </FormControl>
                </Box>
            </Sheet>

            {/* Modal Ajuste */}
            <Modal open={adjustmentModal.open} onClose={closeAdjustmentModal}>
                <ModalDialog sx={{ maxWidth: 420, width: '95%' }}>
                    <ModalClose />
                    <Typography level="h4" sx={{ mb: 1, color: '#f57c00' }}>Ajuste ao Banco de Horas</Typography>
                    <Typography level="body-xs" sx={{ color: '#888', mb: 2 }}>
                        Use para definir o saldo inicial (ex: banco de horas já acumulado manualmente) ou para
                        corrigir o saldo. O valor pode ser positivo ou negativo.
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <FormControl size="sm" required>
                            <FormLabel>Data</FormLabel>
                            <Input
                                type="date"
                                value={adjustmentModal.date}
                                onChange={e => setAdjustmentModal(prev => ({ ...prev, date: e.target.value }))}
                            />
                        </FormControl>
                        <FormControl size="sm">
                            <FormLabel>Descrição (opcional)</FormLabel>
                            <Input
                                value={adjustmentModal.description}
                                placeholder="Ex: Saldo inicial migrado do controlo manual"
                                onChange={e => setAdjustmentModal(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </FormControl>
                        <FormControl size="sm" required>
                            <FormLabel>Valor (€, use negativo para descontar)</FormLabel>
                            <Input
                                type="number"
                                value={adjustmentModal.value}
                                slotProps={{ input: { step: 0.01 } }}
                                onChange={e => setAdjustmentModal(prev => ({ ...prev, value: e.target.value }))}
                            />
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'flex-end' }}>
                            <Button variant="plain" color="neutral" onClick={closeAdjustmentModal}>Cancelar</Button>
                            <Button color="warning" loading={saving} onClick={handleSaveAdjustment}>Guardar</Button>
                        </Box>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* Modal Despesa */}
            <Modal open={expenseModal.open} onClose={closeExpenseModal}>
                <ModalDialog sx={{ maxWidth: 420, width: '95%' }}>
                    <ModalClose />
                    <Typography level="h4" sx={{ mb: 1, color: '#f57c00' }}>Nova Despesa</Typography>
                    <Typography level="body-xs" sx={{ color: '#888', mb: 2 }}>
                        Regista um valor a descontar ao saldo do banco de horas.
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <FormControl size="sm" required>
                            <FormLabel>Data</FormLabel>
                            <Input
                                type="date"
                                value={expenseModal.date}
                                onChange={e => setExpenseModal(prev => ({ ...prev, date: e.target.value }))}
                            />
                        </FormControl>
                        <FormControl size="sm" required>
                            <FormLabel>Descrição</FormLabel>
                            <Input
                                value={expenseModal.description}
                                placeholder="Ex: Adiantamento"
                                onChange={e => setExpenseModal(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </FormControl>
                        <FormControl size="sm" required>
                            <FormLabel>Valor (€)</FormLabel>
                            <Input
                                type="number"
                                value={expenseModal.value}
                                slotProps={{ input: { min: 0, step: 0.01 } }}
                                onChange={e => setExpenseModal(prev => ({ ...prev, value: e.target.value }))}
                            />
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'flex-end' }}>
                            <Button variant="plain" color="neutral" onClick={closeExpenseModal}>Cancelar</Button>
                            <Button color="danger" loading={saving} onClick={handleSaveExpense}>Guardar</Button>
                        </Box>
                    </Box>
                </ModalDialog>
            </Modal>
        </>
    );
}
