import { useState, useEffect } from 'react';
import api from '../services/api';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Typography from '@mui/joy/Typography';
import Table from '@mui/joy/Table';
import Sheet from '@mui/joy/Sheet';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Divider from '@mui/joy/Divider';
import Textarea from '@mui/joy/Textarea';
import IconButton from '@mui/joy/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = [
    { value: 'no_cliente',       label: 'No cliente para recolher' },
    { value: 'em_armazem',       label: 'Em armazém' },
    { value: 'em_reparacao',     label: 'Em reparação' },
    { value: 'reparado_armazem', label: 'Reparado e em armazém' },
    { value: 'entregue',         label: 'Entregue ao cliente' },
];

function statusLabel(val) {
    return STATUS_OPTIONS.find(s => s.value === val)?.label ?? val;
}

function rowBg(rma) {
    if (rma.status === 'entregue') return '#e8f5e9';
    const days = Math.floor((Date.now() - new Date(rma.openDate)) / 86400000);
    if (days > 60) return '#ffcdd2';
    if (days > 30) return '#ffe0b2';
    if (days > 15) return '#fff9c4';
    return undefined;
}

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-PT');
}

const emptyForm = {
    brand: '', model: '', serialNumber: '', fault: '',
    client: '', location: '', requestedBy: '',
    status: 'no_cliente', repairLocation: '',
};

export default function AssistenciaTecnica() {
    const [records, setRecords]       = useState([]);
    const [total, setTotal]           = useState(0);
    const [page, setPage]             = useState(1);
    const [pageSize, setPageSize]     = useState(10);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [loading, setLoading]       = useState(false);

    const [openForm, setOpenForm]     = useState(false);
    const [isEdit, setIsEdit]         = useState(false);
    const [editId, setEditId]         = useState(null);
    const [form, setForm]             = useState(emptyForm);
    const [formLoading, setFormLoading] = useState(false);

    const [detailRMA, setDetailRMA]   = useState(null);
    const [newUpdate, setNewUpdate]   = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

    useEffect(() => { fetchRecords(); }, [page, pageSize, filterStatus, filterClient]);

    async function fetchRecords() {
        setLoading(true);
        try {
            const res = await api.get('/emg/rma', {
                params: { page, pageSize, status: filterStatus || undefined, client: filterClient || undefined },
            });
            setRecords(res.data.data);
            setTotal(res.data.total);
        } catch { toast.error('Erro ao carregar registos.'); }
        finally { setLoading(false); }
    }

    function handleFilter() { setPage(1); fetchRecords(); }

    function openCreate() {
        setIsEdit(false); setEditId(null);
        setForm({ ...emptyForm });
        setOpenForm(true);
    }

    function openEdit(r) {
        setIsEdit(true); setEditId(r.id);
        setForm({
            brand: r.brand, model: r.model, serialNumber: r.serialNumber,
            fault: r.fault, client: r.client, location: r.location,
            requestedBy: r.requestedBy, status: r.status,
            repairLocation: r.repairLocation || '',
        });
        setOpenForm(true);
    }

    async function openDetail(r) {
        try {
            const res = await api.get(`/emg/rma/${r.id}`);
            setDetailRMA(res.data);
            setNewUpdate('');
        } catch { toast.error('Erro ao carregar detalhe.'); }
    }

    async function handleSubmit() {
        const required = ['brand','model','serialNumber','fault','client','location','requestedBy'];
        if (required.some(f => !form[f]?.trim())) {
            toast.error('Preencha todos os campos obrigatórios.'); return;
        }
        setFormLoading(true);
        try {
            if (isEdit) {
                await api.put(`/emg/rma/${editId}`, form);
                toast.success('RMA actualizado.');
            } else {
                await api.post('/emg/rma', form);
                toast.success('RMA criado.');
            }
            setOpenForm(false);
            fetchRecords();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao guardar.');
        } finally { setFormLoading(false); }
    }

    async function handleDelete() {
        try {
            await api.delete(`/emg/rma/${deleteConfirm.id}`);
            toast.success('RMA eliminado.');
            setDeleteConfirm({ open: false, id: null });
            fetchRecords();
        } catch { toast.error('Erro ao eliminar.'); }
    }

    async function handleAddUpdate() {
        if (!newUpdate.trim()) return;
        setUpdateLoading(true);
        try {
            await api.post(`/emg/rma/${detailRMA.id}/updates`, { message: newUpdate });
            const res = await api.get(`/emg/rma/${detailRMA.id}`);
            setDetailRMA(res.data);
            setNewUpdate('');
            toast.success('Actualização adicionada.');
        } catch { toast.error('Erro ao adicionar actualização.'); }
        finally { setUpdateLoading(false); }
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <Box sx={{ p: 2 }}>
            <Typography level="h3" sx={{ fontWeight: 'bold', color: '#444', mb: 2 }}>Assistência Técnica</Typography>
            {/* Legenda de cores */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, fontSize: '0.78rem' }}>
                {[
                    { color: '#ffcdd2', label: '> 2 meses' },
                    { color: '#ffe0b2', label: '> 1 mês' },
                    { color: '#fff9c4', label: '> 15 dias' },
                    { color: '#e8f5e9', label: 'Entregue' },
                ].map(l => (
                    <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: 2, bgcolor: l.color, border: '1px solid #ccc' }} />
                        <span style={{ color: '#555' }}>{l.label}</span>
                    </Box>
                ))}
            </Box>

            {/* Filtros */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'flex-end' }}>
                <FormControl size="sm">
                    <FormLabel>Estado</FormLabel>
                    <Select value={filterStatus} onChange={(_, v) => setFilterStatus(v ?? '')} sx={{ minWidth: 200 }} placeholder="Todos">
                        <Option value="">Todos</Option>
                        {STATUS_OPTIONS.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                    </Select>
                </FormControl>
                <FormControl size="sm">
                    <FormLabel>Cliente</FormLabel>
                    <Input placeholder="Pesquisar cliente..." value={filterClient} onChange={e => setFilterClient(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleFilter()} />
                </FormControl>
                <Button size="sm" onClick={handleFilter}>Filtrar</Button>
                <Button size="sm" variant="outlined" onClick={() => { setFilterStatus(''); setFilterClient(''); setPage(1); }}>Limpar</Button>
                <Box sx={{ ml: 'auto' }}>
                    <Button size="sm" color="warning" onClick={openCreate}>+ Novo RMA</Button>
                </Box>
            </Box>

            {/* Tabela */}
            <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'auto' }}>
                <Table borderAxis="xBetween" size="sm" sx={{ minWidth: 1100 }}>
                    <thead>
                        <tr>
                            <th style={{ width: 70 }}>RMA #</th>
                            <th>Data</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Nº Série</th>
                            <th>Avaria</th>
                            <th>Cliente</th>
                            <th>Local</th>
                            <th>Pedido por</th>
                            <th>Estado</th>
                            <th style={{ width: 100, textAlign: 'center' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>A carregar...</td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Sem registos.</td></tr>
                        ) : records.map(r => (
                            <tr key={r.id} style={{ backgroundColor: rowBg(r) }}>
                                <td style={{ fontWeight: 'bold', color: '#f57c00' }}>#{r.rmaNumber}</td>
                                <td>{fmtDate(r.openDate)}</td>
                                <td>{r.brand}</td>
                                <td>{r.model}</td>
                                <td>{r.serialNumber}</td>
                                <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.fault}</td>
                                <td>{r.client}</td>
                                <td>{r.location}</td>
                                <td>{r.requestedBy}</td>
                                <td>
                                    <Box sx={{ display: 'inline-block', px: 1, py: 0.25, borderRadius: 'sm', fontSize: '0.75rem',
                                        bgcolor: r.status === 'entregue' ? '#c8e6c9' : r.status === 'em_reparacao' ? '#ffe0b2' : '#e3f2fd',
                                        color: r.status === 'entregue' ? '#2e7d32' : r.status === 'em_reparacao' ? '#e65100' : '#1565c0',
                                        fontWeight: 'bold' }}>
                                        {statusLabel(r.status)}
                                    </Box>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <IconButton size="sm" variant="plain" onClick={() => openDetail(r)}><VisibilityIcon fontSize="small" /></IconButton>
                                    <IconButton size="sm" variant="plain" onClick={() => openEdit(r)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="sm" variant="plain" color="danger" onClick={() => setDeleteConfirm({ open: true, id: r.id })}><DeleteIcon fontSize="small" /></IconButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Sheet>

            {/* Paginação */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Typography level="body-sm" sx={{ color: '#666' }}>
                    {total} registo(s) — página {page} de {totalPages}
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

            {/* Modal criar / editar */}
            <Modal open={openForm} onClose={() => setOpenForm(false)}>
                <ModalDialog sx={{ maxWidth: 640, width: '95%', overflow: 'auto', maxHeight: '90vh' }}>
                    <ModalClose />
                    <Typography level="h4" sx={{ color: '#f57c00', mb: 1 }}>{isEdit ? `Editar RMA #${records.find(r=>r.id===editId)?.rmaNumber ?? ''}` : 'Novo RMA'}</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Marca</FormLabel>
                                <Input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} />
                            </FormControl>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Modelo</FormLabel>
                                <Input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} />
                            </FormControl>
                        </Box>
                        <FormControl size="sm" required>
                            <FormLabel>Número de série</FormLabel>
                            <Input value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} />
                        </FormControl>
                        <FormControl size="sm" required>
                            <FormLabel>Avaria</FormLabel>
                            <Textarea minRows={2} value={form.fault} onChange={e => setForm(p => ({ ...p, fault: e.target.value }))} />
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Cliente</FormLabel>
                                <Input value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))} />
                            </FormControl>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Local</FormLabel>
                                <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                            </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Quem fez o pedido</FormLabel>
                                <Input value={form.requestedBy} onChange={e => setForm(p => ({ ...p, requestedBy: e.target.value }))} />
                            </FormControl>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Estado</FormLabel>
                                <Select value={form.status} onChange={(_, v) => setForm(p => ({ ...p, status: v ?? 'no_cliente' }))}>
                                    {STATUS_OPTIONS.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                                </Select>
                            </FormControl>
                        </Box>
                        {form.status === 'em_reparacao' && (
                            <FormControl size="sm">
                                <FormLabel>Local de reparação</FormLabel>
                                <Input value={form.repairLocation} onChange={e => setForm(p => ({ ...p, repairLocation: e.target.value }))} placeholder="Ex: Oficina X, Porto" />
                            </FormControl>
                        )}
                        <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'flex-end' }}>
                            <Button variant="plain" color="neutral" onClick={() => setOpenForm(false)}>Cancelar</Button>
                            <Button color="warning" loading={formLoading} onClick={handleSubmit}>{isEdit ? 'Actualizar' : 'Criar RMA'}</Button>
                        </Box>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* Modal detalhe + actualizações */}
            <Modal open={!!detailRMA} onClose={() => setDetailRMA(null)}>
                <ModalDialog sx={{ maxWidth: 660, width: '95%', overflow: 'auto', maxHeight: '90vh' }}>
                    <ModalClose />
                    {detailRMA && <>
                        <Typography level="h4" sx={{ color: '#f57c00' }}>RMA #{detailRMA.rmaNumber}</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.88rem', mb: 1 }}>
                            {[
                                ['Data abertura', fmtDate(detailRMA.openDate)],
                                ['Estado', statusLabel(detailRMA.status)],
                                ['Marca', detailRMA.brand],
                                ['Modelo', detailRMA.model],
                                ['Nº Série', detailRMA.serialNumber],
                                ['Cliente', detailRMA.client],
                                ['Local', detailRMA.location],
                                ['Pedido por', detailRMA.requestedBy],
                                ...(detailRMA.repairLocation ? [['Local reparação', detailRMA.repairLocation]] : []),
                            ].map(([k, v]) => (
                                <Box key={k}><strong>{k}:</strong> {v}</Box>
                            ))}
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <strong>Avaria:</strong>
                            <Typography level="body-sm" sx={{ mt: 0.5, color: '#444' }}>{detailRMA.fault}</Typography>
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                        <Typography level="title-sm" sx={{ mb: 1, color: '#f57c00' }}>Actualizações</Typography>
                        <Box sx={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
                            {detailRMA.updates.length === 0
                                ? <Typography level="body-sm" sx={{ color: '#999' }}>Sem actualizações.</Typography>
                                : detailRMA.updates.map(u => (
                                    <Box key={u.id} sx={{ bgcolor: '#f5f5f5', borderRadius: 'sm', p: 1.5 }}>
                                        <Typography level="body-xs" sx={{ color: '#888', mb: 0.5 }}>
                                            {u.createdBy?.name} — {new Date(u.created_at).toLocaleString('pt-PT')}
                                        </Typography>
                                        <Typography level="body-sm">{u.message}</Typography>
                                    </Box>
                                ))
                            }
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Textarea
                                size="sm" sx={{ flex: 1 }} minRows={2}
                                placeholder="Adicionar actualização..."
                                value={newUpdate}
                                onChange={e => setNewUpdate(e.target.value)}
                            />
                            <Button size="sm" color="warning" loading={updateLoading} onClick={handleAddUpdate} sx={{ alignSelf: 'flex-end' }}>
                                Guardar
                            </Button>
                        </Box>
                    </>}
                </ModalDialog>
            </Modal>

            {/* Confirmação de eliminação */}
            <Modal open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle>Confirmar eliminação</DialogTitle>
                    <Divider />
                    <DialogContent>Tem a certeza que pretende eliminar este RMA? Esta acção não pode ser revertida.</DialogContent>
                    <DialogActions>
                        <Button variant="solid" color="danger" onClick={handleDelete}>Eliminar</Button>
                        <Button variant="plain" color="neutral" onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancelar</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        </Box>
    );
}
