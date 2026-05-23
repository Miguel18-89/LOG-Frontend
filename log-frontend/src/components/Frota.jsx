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
import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import TabPanel from '@mui/joy/TabPanel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import { toast } from 'react-toastify';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const TIRE_TYPES = [
    { value: 'front', label: 'Frontais' },
    { value: 'rear',  label: 'Traseiros' },
    { value: 'both',  label: 'Todos' },
];
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('pt-PT') : '—'; }
function fmtKm(k) { return k != null ? `${k.toLocaleString('pt-PT')} km` : '—'; }

function daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    return Math.floor((new Date(dateStr) - Date.now()) / 86400000);
}

function rowBg(v) {
    const d = Math.min(daysUntil(v.nextInspectionDate), daysUntil(v.insuranceExpiryDate));
    if (d < 15) return '#ffcdd2';
    if (d < 30) return '#ffe0b2';
    return undefined;
}

function cellDate(dateStr) {
    const d = daysUntil(dateStr);
    if (!dateStr || d === Infinity) return <span style={{ color: '#bbb' }}>—</span>;
    if (d >= 30) return <span>{fmtDate(dateStr)}</span>;
    const bg    = d < 15 ? '#ffcdd2' : '#ffe0b2';
    const color = d < 15 ? '#c62828' : '#e65100';
    const label = d < 0 ? ' (expirado)' : ` (${d}d)`;
    return (
        <span style={{ display:'inline-block', padding:'1px 7px', borderRadius:4, background:bg, color, fontWeight:'bold', fontSize:'0.78rem' }}>
            {fmtDate(dateStr)}{label}
        </span>
    );
}

function alertBadge(dateStr, label) {
    const d = daysUntil(dateStr);
    const color = d < 15 ? '#c62828' : d < 30 ? '#e65100' : '#2e7d32';
    const bg    = d < 15 ? '#ffcdd2' : d < 30 ? '#ffe0b2' : '#e8f5e9';
    return (
        <Box sx={{ display:'flex', flexDirection:'column', gap:0.25 }}>
            <Typography level="body-xs" sx={{ color:'#888' }}>{label}</Typography>
            <Box sx={{ px:1, py:0.25, borderRadius:'sm', bgcolor: bg, color, fontWeight:'bold', fontSize:'0.78rem', display:'inline-block' }}>
                {fmtDate(dateStr)}{d < 30 && d !== Infinity ? ` (${d}d)` : ''}
            </Box>
        </Box>
    );
}

const emptyVehicle = { brand:'', model:'', plate:'', registrationYear: new Date().getFullYear(), registrationMonth: 1, nextInspectionDate:'', insuranceExpiryDate:'', tireSize:'' };
const emptyTire    = { date:'', location:'', km:'', type:'both', notes:'' };
const emptyOil     = { date:'', location:'', km:'', notes:'' };
const emptyRepair  = { date:'', fault:'', repairLocation:'', km:'', notes:'' };

export default function Frota() {
    const [vehicles, setVehicles]   = useState([]);
    const [search, setSearch]       = useState('');
    const [loading, setLoading]     = useState(false);

    const [openForm, setOpenForm]   = useState(false);
    const [isEdit, setIsEdit]       = useState(false);
    const [editId, setEditId]       = useState(null);
    const [form, setForm]           = useState(emptyVehicle);
    const [formLoading, setFormLoading] = useState(false);

    const [detail, setDetail]       = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const [tireForm, setTireForm]     = useState(emptyTire);
    const [oilForm, setOilForm]       = useState(emptyOil);
    const [repairForm, setRepairForm] = useState(emptyRepair);
    const [subLoading, setSubLoading] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState({ open:false, id:null, type:null, rid:null });

    useEffect(() => { fetchVehicles(); }, []);

    async function fetchVehicles(plateSearch) {
        setLoading(true);
        try {
            const res = await api.get('/emg/frota', { params: { plate: plateSearch || undefined } });
            setVehicles(res.data);
        } catch { toast.error('Erro ao carregar viaturas.'); }
        finally { setLoading(false); }
    }

    function handleSearch() { fetchVehicles(search); }

    async function refreshDetail(id) {
        const res = await api.get(`/emg/frota/${id}`);
        setDetail(res.data);
    }

    function openCreate() {
        setIsEdit(false); setEditId(null);
        setForm({ ...emptyVehicle });
        setOpenForm(true);
    }

    function openEdit(v) {
        setIsEdit(true); setEditId(v.id);
        setForm({
            brand: v.brand, model: v.model, plate: v.plate,
            registrationYear: v.registrationYear, registrationMonth: v.registrationMonth,
            nextInspectionDate: v.nextInspectionDate ? v.nextInspectionDate.split('T')[0] : '',
            insuranceExpiryDate: v.insuranceExpiryDate ? v.insuranceExpiryDate.split('T')[0] : '',
            tireSize: v.tireSize || '',
        });
        setOpenForm(true);
    }

    async function openDetail(v) {
        try { const res = await api.get(`/emg/frota/${v.id}`); setDetail(res.data); setActiveTab(0); }
        catch { toast.error('Erro ao carregar detalhe.'); }
    }

    async function handleSubmitVehicle() {
        if (!form.brand || !form.model || !form.plate || !form.registrationYear || !form.registrationMonth)
            return toast.error('Preencha todos os campos obrigatórios.');
        setFormLoading(true);
        try {
            if (isEdit) { await api.put(`/emg/frota/${editId}`, form); toast.success('Viatura actualizada.'); }
            else        { await api.post('/emg/frota', form); toast.success('Viatura criada.'); }
            setOpenForm(false);
            fetchVehicles(search);
        } catch (err) { toast.error(err.response?.data?.error || 'Erro ao guardar.'); }
        finally { setFormLoading(false); }
    }

    async function handleAddTire() {
        if (!tireForm.date || !tireForm.location || !tireForm.km) return toast.error('Preencha todos os campos.');
        setSubLoading(true);
        try { await api.post(`/emg/frota/${detail.id}/tires`, tireForm); await refreshDetail(detail.id); setTireForm(emptyTire); toast.success('Mudança de pneus registada.'); }
        catch { toast.error('Erro ao guardar.'); }
        finally { setSubLoading(false); }
    }

    async function handleAddOil() {
        if (!oilForm.date || !oilForm.location || !oilForm.km) return toast.error('Preencha todos os campos.');
        setSubLoading(true);
        try { await api.post(`/emg/frota/${detail.id}/oil`, oilForm); await refreshDetail(detail.id); setOilForm(emptyOil); toast.success('Mudança de óleo registada.'); }
        catch { toast.error('Erro ao guardar.'); }
        finally { setSubLoading(false); }
    }

    async function handleAddRepair() {
        if (!repairForm.date || !repairForm.fault || !repairForm.repairLocation || !repairForm.km) return toast.error('Preencha todos os campos.');
        setSubLoading(true);
        try { await api.post(`/emg/frota/${detail.id}/repairs`, repairForm); await refreshDetail(detail.id); setRepairForm(emptyRepair); toast.success('Reparação registada.'); }
        catch { toast.error('Erro ao guardar.'); }
        finally { setSubLoading(false); }
    }

    async function handleDelete() {
        const { id, type, rid } = deleteConfirm;
        try {
            if (type === 'vehicle') { await api.delete(`/emg/frota/${id}`); fetchVehicles(search); if (detail?.id === id) setDetail(null); }
            else if (type === 'tire')   { await api.delete(`/emg/frota/${id}/tires/${rid}`);   await refreshDetail(id); }
            else if (type === 'oil')    { await api.delete(`/emg/frota/${id}/oil/${rid}`);     await refreshDetail(id); }
            else if (type === 'repair') { await api.delete(`/emg/frota/${id}/repairs/${rid}`); await refreshDetail(id); }
            toast.success('Eliminado com sucesso.');
        } catch { toast.error('Erro ao eliminar.'); }
        finally { setDeleteConfirm({ open:false, id:null, type:null, rid:null }); }
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography level="h3" sx={{ fontWeight: 'bold', color: '#444', mb: 2 }}>Frota</Typography>
            {/* Legenda */}
            <Box sx={{ display:'flex', gap:2, mb:2, fontSize:'0.78rem', flexWrap:'wrap' }}>
                {[{ color:'#ffcdd2', label:'< 15 dias' }, { color:'#ffe0b2', label:'< 1 mês' }].map(l => (
                    <Box key={l.label} sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                        <Box sx={{ width:14, height:14, borderRadius:2, bgcolor:l.color, border:'1px solid #ccc' }} />
                        <span style={{ color:'#555' }}>{l.label} (seguro ou inspecção)</span>
                    </Box>
                ))}
            </Box>

            {/* Barra de pesquisa */}
            <Box sx={{ display:'flex', gap:2, mb:2, alignItems:'flex-end', flexWrap:'wrap' }}>
                <FormControl size="sm">
                    <FormLabel>Matrícula</FormLabel>
                    <Input placeholder="Ex: AB-12-CD" value={search} onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                </FormControl>
                <Button size="sm" onClick={handleSearch}>Pesquisar</Button>
                <Button size="sm" variant="outlined" onClick={() => { setSearch(''); fetchVehicles(); }}>Limpar</Button>
                <Box sx={{ ml:'auto' }}>
                    <Button size="sm" color="warning" onClick={openCreate}>+ Nova Viatura</Button>
                </Box>
            </Box>

            {/* Tabela */}
            <Sheet variant="outlined" sx={{ borderRadius:'sm', overflow:'auto' }}>
                <Table borderAxis="xBetween" size="sm" sx={{ minWidth: 900 }}>
                    <thead>
                        <tr>
                            <th>Matrícula</th>
                            <th>Marca / Modelo</th>
                            <th>Ano/Mês matrícula</th>
                            <th>Próxima Inspecção</th>
                            <th>Validade Seguro</th>
                            <th>Medida Pneus</th>
                            <th style={{ width:100, textAlign:'center' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign:'center', padding:'2rem', color:'#999' }}>A carregar...</td></tr>
                        ) : vehicles.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign:'center', padding:'2rem', color:'#999' }}>Sem viaturas.</td></tr>
                        ) : vehicles.map(v => (
                            <tr key={v.id} style={{ backgroundColor: rowBg(v) }}>
                                <td><strong>{v.plate}</strong></td>
                                <td>{v.brand} {v.model}</td>
                                <td>{MONTHS[v.registrationMonth - 1]} {v.registrationYear}</td>
                                <td>{cellDate(v.nextInspectionDate)}</td>
                                <td>{cellDate(v.insuranceExpiryDate)}</td>
                                <td>{v.tireSize || '—'}</td>
                                <td style={{ textAlign:'center' }}>
                                    <IconButton size="sm" variant="plain" onClick={() => openDetail(v)}><VisibilityIcon fontSize="small" /></IconButton>
                                    <IconButton size="sm" variant="plain" onClick={() => openEdit(v)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="sm" variant="plain" color="danger" onClick={() => setDeleteConfirm({ open:true, id:v.id, type:'vehicle', rid:null })}><DeleteIcon fontSize="small" /></IconButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Sheet>

            {/* Modal criar/editar viatura */}
            <Modal open={openForm} onClose={() => setOpenForm(false)}>
                <ModalDialog sx={{ maxWidth:580, width:'95%', overflow:'auto', maxHeight:'90vh' }}>
                    <ModalClose />
                    <Typography level="h4" sx={{ color:'#f57c00', mb:1 }}>{isEdit ? 'Editar Viatura' : 'Nova Viatura'}</Typography>
                    <Divider sx={{ mb:2 }} />
                    <Box sx={{ display:'flex', flexDirection:'column', gap:1.5 }}>
                        <Box sx={{ display:'flex', gap:2 }}>
                            <FormControl size="sm" required sx={{ flex:1 }}>
                                <FormLabel>Marca</FormLabel>
                                <Input value={form.brand} onChange={e => setForm(p=>({...p, brand:e.target.value}))} />
                            </FormControl>
                            <FormControl size="sm" required sx={{ flex:1 }}>
                                <FormLabel>Modelo</FormLabel>
                                <Input value={form.model} onChange={e => setForm(p=>({...p, model:e.target.value}))} />
                            </FormControl>
                        </Box>
                        <Box sx={{ display:'flex', gap:2 }}>
                            <FormControl size="sm" required sx={{ flex:1 }}>
                                <FormLabel>Matrícula</FormLabel>
                                <Input value={form.plate} onChange={e => setForm(p=>({...p, plate:e.target.value.toUpperCase()}))} placeholder="AB-12-CD" />
                            </FormControl>
                            <FormControl size="sm" sx={{ flex:1 }}>
                                <FormLabel>Medida de pneus</FormLabel>
                                <Input value={form.tireSize} onChange={e => setForm(p=>({...p, tireSize:e.target.value}))} placeholder="Ex: 205/55 R16" />
                            </FormControl>
                        </Box>
                        <Box sx={{ display:'flex', gap:2 }}>
                            <FormControl size="sm" required sx={{ flex:1 }}>
                                <FormLabel>Ano matrícula</FormLabel>
                                <Select value={form.registrationYear} onChange={(_, v) => setForm(p=>({...p, registrationYear:v}))}>
                                    {YEARS.map(y => <Option key={y} value={y}>{y}</Option>)}
                                </Select>
                            </FormControl>
                            <FormControl size="sm" required sx={{ flex:1 }}>
                                <FormLabel>Mês matrícula</FormLabel>
                                <Select value={form.registrationMonth} onChange={(_, v) => setForm(p=>({...p, registrationMonth:v}))}>
                                    {MONTHS.map((m, i) => <Option key={i+1} value={i+1}>{m}</Option>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ display:'flex', gap:2 }}>
                            <FormControl size="sm" sx={{ flex:1 }}>
                                <FormLabel>Próxima Inspecção</FormLabel>
                                <Input type="date" value={form.nextInspectionDate} onChange={e => setForm(p=>({...p, nextInspectionDate:e.target.value}))} />
                            </FormControl>
                            <FormControl size="sm" sx={{ flex:1 }}>
                                <FormLabel>Validade Seguro</FormLabel>
                                <Input type="date" value={form.insuranceExpiryDate} onChange={e => setForm(p=>({...p, insuranceExpiryDate:e.target.value}))} />
                            </FormControl>
                        </Box>
                        <Box sx={{ display:'flex', gap:2, mt:1, justifyContent:'flex-end' }}>
                            <Button variant="plain" color="neutral" onClick={() => setOpenForm(false)}>Cancelar</Button>
                            <Button color="warning" loading={formLoading} onClick={handleSubmitVehicle}>{isEdit ? 'Actualizar' : 'Criar'}</Button>
                        </Box>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* Modal detalhe */}
            <Modal open={!!detail} onClose={() => setDetail(null)}>
                <ModalDialog sx={{ maxWidth:700, width:'95%', overflow:'auto', maxHeight:'92vh' }}>
                    <ModalClose />
                    {detail && <>
                        <Typography level="h4" sx={{ color:'#f57c00' }}>{detail.plate} — {detail.brand} {detail.model}</Typography>
                        <Box sx={{ display:'flex', gap:3, flexWrap:'wrap', my:1 }}>
                            <Typography level="body-sm">Matrícula: <strong>{MONTHS[detail.registrationMonth-1]} {detail.registrationYear}</strong></Typography>
                            {detail.tireSize && <Typography level="body-sm">Pneus: <strong>{detail.tireSize}</strong></Typography>}
                        </Box>
                        <Box sx={{ display:'flex', gap:3, flexWrap:'wrap', mb:1 }}>
                            {alertBadge(detail.nextInspectionDate, 'Próxima Inspecção')}
                            {alertBadge(detail.insuranceExpiryDate, 'Validade Seguro')}
                        </Box>
                        <Divider sx={{ my:1.5 }} />

                        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} size="sm">
                            <TabList>
                                <Tab>Pneus ({detail.tireChanges.length})</Tab>
                                <Tab>Óleo ({detail.oilChanges.length})</Tab>
                                <Tab>Reparações ({detail.repairs.length})</Tab>
                            </TabList>

                            {/* PNEUS */}
                            <TabPanel value={0}>
                                <Box sx={{ display:'flex', flexDirection:'column', gap:1, mb:1.5 }}>
                                    {detail.tireChanges.length === 0
                                        ? <Typography level="body-sm" sx={{ color:'#999' }}>Sem registos.</Typography>
                                        : detail.tireChanges.map(t => (
                                            <Box key={t.id} sx={{ bgcolor:'#f9f9f9', borderRadius:'sm', p:1.5, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                                                <Box>
                                                    <Typography level="body-xs" sx={{ color:'#888' }}>{fmtDate(t.date)} — {TIRE_TYPES.find(x=>x.value===t.type)?.label} — {fmtKm(t.km)}</Typography>
                                                    <Typography level="body-sm"><strong>{t.location}</strong>{t.notes ? ` · ${t.notes}` : ''}</Typography>
                                                    <Typography level="body-xs" sx={{ color:'#aaa' }}>por {t.createdBy?.name}</Typography>
                                                </Box>
                                                <IconButton size="sm" color="danger" variant="plain" onClick={() => setDeleteConfirm({ open:true, id:detail.id, type:'tire', rid:t.id })}><DeleteIcon fontSize="small" /></IconButton>
                                            </Box>
                                        ))
                                    }
                                </Box>
                                <Divider sx={{ mb:1.5 }} />
                                <Typography level="title-xs" sx={{ mb:1 }}>Novo registo</Typography>
                                <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1 }}>
                                    <FormControl size="sm"><FormLabel>Data</FormLabel><Input type="date" value={tireForm.date} onChange={e=>setTireForm(p=>({...p,date:e.target.value}))} /></FormControl>
                                    <FormControl size="sm"><FormLabel>Tipo</FormLabel>
                                        <Select value={tireForm.type} onChange={(_, v)=>setTireForm(p=>({...p,type:v}))}>
                                            {TIRE_TYPES.map(t=><Option key={t.value} value={t.value}>{t.label}</Option>)}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="sm"><FormLabel>Local</FormLabel><Input value={tireForm.location} onChange={e=>setTireForm(p=>({...p,location:e.target.value}))} /></FormControl>
                                    <FormControl size="sm"><FormLabel>Kms</FormLabel><Input type="number" value={tireForm.km} onChange={e=>setTireForm(p=>({...p,km:e.target.value}))} /></FormControl>
                                    <FormControl size="sm" sx={{ gridColumn:'1/-1' }}><FormLabel>Notas</FormLabel><Input value={tireForm.notes} onChange={e=>setTireForm(p=>({...p,notes:e.target.value}))} /></FormControl>
                                </Box>
                                <Button size="sm" color="warning" loading={subLoading} onClick={handleAddTire} sx={{ mt:1 }}>Guardar</Button>
                            </TabPanel>

                            {/* ÓLEO */}
                            <TabPanel value={1}>
                                <Box sx={{ display:'flex', flexDirection:'column', gap:1, mb:1.5 }}>
                                    {detail.oilChanges.length === 0
                                        ? <Typography level="body-sm" sx={{ color:'#999' }}>Sem registos.</Typography>
                                        : detail.oilChanges.map(o => (
                                            <Box key={o.id} sx={{ bgcolor:'#f9f9f9', borderRadius:'sm', p:1.5, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                                                <Box>
                                                    <Typography level="body-xs" sx={{ color:'#888' }}>{fmtDate(o.date)} — {fmtKm(o.km)}</Typography>
                                                    <Typography level="body-sm"><strong>{o.location}</strong>{o.notes ? ` · ${o.notes}` : ''}</Typography>
                                                    <Typography level="body-xs" sx={{ color:'#aaa' }}>por {o.createdBy?.name}</Typography>
                                                </Box>
                                                <IconButton size="sm" color="danger" variant="plain" onClick={() => setDeleteConfirm({ open:true, id:detail.id, type:'oil', rid:o.id })}><DeleteIcon fontSize="small" /></IconButton>
                                            </Box>
                                        ))
                                    }
                                </Box>
                                <Divider sx={{ mb:1.5 }} />
                                <Typography level="title-xs" sx={{ mb:1 }}>Novo registo</Typography>
                                <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1 }}>
                                    <FormControl size="sm"><FormLabel>Data</FormLabel><Input type="date" value={oilForm.date} onChange={e=>setOilForm(p=>({...p,date:e.target.value}))} /></FormControl>
                                    <FormControl size="sm"><FormLabel>Kms</FormLabel><Input type="number" value={oilForm.km} onChange={e=>setOilForm(p=>({...p,km:e.target.value}))} /></FormControl>
                                    <FormControl size="sm" sx={{ gridColumn:'1/-1' }}><FormLabel>Local</FormLabel><Input value={oilForm.location} onChange={e=>setOilForm(p=>({...p,location:e.target.value}))} /></FormControl>
                                    <FormControl size="sm" sx={{ gridColumn:'1/-1' }}><FormLabel>Notas</FormLabel><Input value={oilForm.notes} onChange={e=>setOilForm(p=>({...p,notes:e.target.value}))} /></FormControl>
                                </Box>
                                <Button size="sm" color="warning" loading={subLoading} onClick={handleAddOil} sx={{ mt:1 }}>Guardar</Button>
                            </TabPanel>

                            {/* REPARAÇÕES */}
                            <TabPanel value={2}>
                                <Box sx={{ display:'flex', flexDirection:'column', gap:1, mb:1.5 }}>
                                    {detail.repairs.length === 0
                                        ? <Typography level="body-sm" sx={{ color:'#999' }}>Sem registos.</Typography>
                                        : detail.repairs.map(r => (
                                            <Box key={r.id} sx={{ bgcolor:'#f9f9f9', borderRadius:'sm', p:1.5, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                                                <Box>
                                                    <Typography level="body-xs" sx={{ color:'#888' }}>{fmtDate(r.date)} — {fmtKm(r.km)}</Typography>
                                                    <Typography level="body-sm"><strong>{r.fault}</strong> — {r.repairLocation}{r.notes ? ` · ${r.notes}` : ''}</Typography>
                                                    <Typography level="body-xs" sx={{ color:'#aaa' }}>por {r.createdBy?.name}</Typography>
                                                </Box>
                                                <IconButton size="sm" color="danger" variant="plain" onClick={() => setDeleteConfirm({ open:true, id:detail.id, type:'repair', rid:r.id })}><DeleteIcon fontSize="small" /></IconButton>
                                            </Box>
                                        ))
                                    }
                                </Box>
                                <Divider sx={{ mb:1.5 }} />
                                <Typography level="title-xs" sx={{ mb:1 }}>Nova reparação</Typography>
                                <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1 }}>
                                    <FormControl size="sm"><FormLabel>Data</FormLabel><Input type="date" value={repairForm.date} onChange={e=>setRepairForm(p=>({...p,date:e.target.value}))} /></FormControl>
                                    <FormControl size="sm"><FormLabel>Kms</FormLabel><Input type="number" value={repairForm.km} onChange={e=>setRepairForm(p=>({...p,km:e.target.value}))} /></FormControl>
                                    <FormControl size="sm" sx={{ gridColumn:'1/-1' }}><FormLabel>Avaria</FormLabel><Input value={repairForm.fault} onChange={e=>setRepairForm(p=>({...p,fault:e.target.value}))} /></FormControl>
                                    <FormControl size="sm" sx={{ gridColumn:'1/-1' }}><FormLabel>Local de reparação</FormLabel><Input value={repairForm.repairLocation} onChange={e=>setRepairForm(p=>({...p,repairLocation:e.target.value}))} /></FormControl>
                                    <FormControl size="sm" sx={{ gridColumn:'1/-1' }}><FormLabel>Notas</FormLabel><Textarea minRows={2} value={repairForm.notes} onChange={e=>setRepairForm(p=>({...p,notes:e.target.value}))} /></FormControl>
                                </Box>
                                <Button size="sm" color="warning" loading={subLoading} onClick={handleAddRepair} sx={{ mt:1 }}>Guardar</Button>
                            </TabPanel>
                        </Tabs>
                    </>}
                </ModalDialog>
            </Modal>

            {/* Confirmação de eliminação */}
            <Modal open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open:false, id:null, type:null, rid:null })}>
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle>Confirmar eliminação</DialogTitle>
                    <Divider />
                    <DialogContent>Tem a certeza que pretende eliminar este registo? Esta acção não pode ser revertida.</DialogContent>
                    <DialogActions>
                        <Button variant="solid" color="danger" onClick={handleDelete}>Eliminar</Button>
                        <Button variant="plain" color="neutral" onClick={() => setDeleteConfirm({ open:false, id:null, type:null, rid:null })}>Cancelar</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        </Box>
    );
}
