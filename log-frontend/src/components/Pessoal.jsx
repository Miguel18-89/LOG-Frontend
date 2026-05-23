import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Button, Table, Input, Modal, ModalDialog, ModalClose,
    Typography, Sheet, Tabs, TabList, Tab, TabPanel, FormLabel,
    Select, Option, Divider, IconButton,
} from '@mui/joy';
import { MdAdd, MdEdit, MdDelete, MdDownload, MdUploadFile, MdCheck, MdClose } from 'react-icons/md';
import { toast } from 'react-toastify';
import api from '../services/api';

const API_URL = import.meta.env.VITE_API_URL;

const CONTRACT_TYPES = [
    { value: 'termo_certo', label: 'Termo Certo' },
    { value: 'termo_incerto', label: 'Termo Incerto' },
    { value: 'sem_termo', label: 'Sem Termo' },
];

const emptyEmployee = {
    fullName: '', nif: '', cc: '', niss: '', birthDate: '',
    address: '', phone: '', personalEmail: '', workEmail: '',
    emergencyContactName: '', emergencyContactRel: '', emergencyContactPhone: '',
    admissionDate: '', contractType: '', jobCategory: '',
    iban: '', insurancePolicy: '', medicalFitnessDate: '',
};

const emptyTraining = { name: '', date: '', hours: '', file: null };

const today = new Date().toISOString().slice(0, 10);
const prevYear = new Date().getFullYear() - 1;
const minTrainingDate = `${prevYear}-01-01`;

function fmt(d) {
    return d ? new Date(d).toLocaleDateString('pt-PT') : '—';
}

function contractLabel(type) {
    return CONTRACT_TYPES.find(c => c.value === type)?.label || type || '—';
}

function medicalAlert(date) {
    if (!date) return null;
    const days = Math.ceil((new Date(date) - new Date()) / 86400000);
    if (days < 0) return { bg: '#ffcdd2', text: 'Expirada' };
    if (days <= 15) return { bg: '#ffcdd2', text: `${days}d restantes` };
    if (days <= 30) return { bg: '#ffe0b2', text: `${days}d restantes` };
    return null;
}

function truncateName(name, maxLen = 26) {
    if (!name || name.length <= maxLen) return name || '';
    const dot = name.lastIndexOf('.');
    if (dot > 0 && name.length - dot <= 6) {
        const ext = name.slice(dot);
        return name.slice(0, maxLen - ext.length - 1) + '…' + ext;
    }
    return name.slice(0, maxLen - 1) + '…';
}

function InfoRow({ label, value, span }) {
    return (
        <Box sx={{ gridColumn: span === 2 ? '1/-1' : undefined }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>{label}</Typography>
            <Typography level="body-sm" sx={{ wordBreak: 'break-all' }}>{value || '—'}</Typography>
        </Box>
    );
}

function Field({ label, children, span }) {
    return (
        <Box sx={{ gridColumn: span === 2 ? '1/-1' : undefined }}>
            <FormLabel sx={{ mb: 0.5 }}>{label}</FormLabel>
            {children}
        </Box>
    );
}

function PersonalSection({ form, fSet }) {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Field label="Nome Completo *" span={2}>
                <Input value={form.fullName} onChange={fSet('fullName')} />
            </Field>
            <Field label="NIF">
                <Input value={form.nif} onChange={fSet('nif')} />
            </Field>
            <Field label="CC / BI">
                <Input value={form.cc} onChange={fSet('cc')} />
            </Field>
            <Field label="NISS">
                <Input value={form.niss} onChange={fSet('niss')} />
            </Field>
            <Field label="Data de Nascimento">
                <Input type="date" value={form.birthDate} onChange={fSet('birthDate')}
                    slotProps={{ input: { max: today } }} />
            </Field>
            <Field label="Morada" span={2}>
                <Input value={form.address} onChange={fSet('address')} />
            </Field>
            <Field label="Contacto Telefónico">
                <Input value={form.phone} onChange={fSet('phone')} />
            </Field>
            <Field label="Email Pessoal">
                <Input type="email" value={form.personalEmail} onChange={fSet('personalEmail')} />
            </Field>
            <Field label="Email de Trabalho">
                <Input type="email" value={form.workEmail} onChange={fSet('workEmail')} />
            </Field>
            <Box sx={{ gridColumn: '1/-1' }}>
                <Typography level="title-xs" sx={{ color: 'text.secondary', mt: 0.5, mb: 1 }}>
                    Contacto de Emergência
                </Typography>
            </Box>
            <Field label="Nome">
                <Input value={form.emergencyContactName} onChange={fSet('emergencyContactName')} placeholder="Nome completo" />
            </Field>
            <Field label="Relação">
                <Input value={form.emergencyContactRel} onChange={fSet('emergencyContactRel')} placeholder="Cônjuge, Pai, Mãe…" />
            </Field>
            <Field label="Telefone" span={2}>
                <Input value={form.emergencyContactPhone} onChange={fSet('emergencyContactPhone')} placeholder="Número de telefone" />
            </Field>
        </Box>
    );
}

function ContractSection({ form, fSet, setForm }) {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Field label="Data de Admissão">
                <Input type="date" value={form.admissionDate} onChange={fSet('admissionDate')} />
            </Field>
            <Field label="Tipo de Contrato">
                <Select value={form.contractType || ''} onChange={(_, v) => setForm(f => ({ ...f, contractType: v }))}
                    placeholder="Selecionar…">
                    {CONTRACT_TYPES.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
                </Select>
            </Field>
            <Field label="Categoria Profissional / Função" span={2}>
                <Input value={form.jobCategory} onChange={fSet('jobCategory')} />
            </Field>
            <Field label="IBAN" span={2}>
                <Input value={form.iban} onChange={fSet('iban')} placeholder="PT50…" />
            </Field>
            <Field label="Apólice de Seguro de Acidentes de Trabalho" span={2}>
                <Input value={form.insurancePolicy} onChange={fSet('insurancePolicy')} />
            </Field>
            <Field label="Validade — Ficha de Aptidão Médica" span={2}>
                <Input type="date" value={form.medicalFitnessDate} onChange={fSet('medicalFitnessDate')} />
            </Field>
        </Box>
    );
}

export default function Pessoal() {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [detailTab, setDetailTab] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState(emptyEmployee);
    const [addOpen, setAddOpen] = useState(false);
    const [addTab, setAddTab] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [trainingForm, setTrainingForm] = useState(emptyTraining);
    const [deleteTrainingConfirm, setDeleteTrainingConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [trainingYear, setTrainingYear] = useState('');
    const [editTrainingId, setEditTrainingId] = useState(null);
    const [editTrainingForm, setEditTrainingForm] = useState(emptyTraining);
    const [deleteMedicalConfirm, setDeleteMedicalConfirm] = useState(false);
    const fileInputRef = useRef(null);
    const editFileInputRef = useRef(null);
    const medicalFileInputRef = useRef(null);

    const fetchEmployees = useCallback(async () => {
        try {
            const params = search ? { name: search } : {};
            const res = await api.get('/emg/pessoal', { params });
            setEmployees(res.data);
        } catch {
            toast.error('Erro ao carregar colaboradores.');
        }
    }, [search]);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    const fetchEmployee = useCallback(async (id) => {
        try {
            const res = await api.get(`/emg/pessoal/${id}`);
            setSelected(res.data);
        } catch {
            toast.error('Erro ao carregar colaborador.');
        }
    }, []);

    const openDetail = (emp) => {
        setDetailTab(0);
        setEditMode(false);
        setEditTrainingId(null);
        setTrainingYear('');
        setSelected(emp);
        fetchEmployee(emp.id);
    };

    const startEdit = () => {
        setForm({
            fullName: selected.fullName || '',
            nif: selected.nif || '',
            cc: selected.cc || '',
            niss: selected.niss || '',
            birthDate: selected.birthDate ? selected.birthDate.slice(0, 10) : '',
            address: selected.address || '',
            phone: selected.phone || '',
            personalEmail: selected.personalEmail || '',
            workEmail: selected.workEmail || '',
            emergencyContactName: selected.emergencyContactName || '',
            emergencyContactRel: selected.emergencyContactRel || '',
            emergencyContactPhone: selected.emergencyContactPhone || '',
            admissionDate: selected.admissionDate ? selected.admissionDate.slice(0, 10) : '',
            contractType: selected.contractType || '',
            jobCategory: selected.jobCategory || '',
            iban: selected.iban || '',
            insurancePolicy: selected.insurancePolicy || '',
            medicalFitnessDate: selected.medicalFitnessDate ? selected.medicalFitnessDate.slice(0, 10) : '',
        });
        setEditMode(true);
    };

    const fSet = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSave = async () => {
        if (!form.fullName.trim()) { toast.error('Nome obrigatório.'); return; }
        try {
            setSaving(true);
            if (selected) {
                await api.put(`/emg/pessoal/${selected.id}`, form);
                await fetchEmployee(selected.id);
                fetchEmployees();
                setEditMode(false);
                toast.success('Colaborador atualizado.');
            } else {
                await api.post('/emg/pessoal', form);
                setAddOpen(false);
                setForm(emptyEmployee);
                setAddTab(0);
                fetchEmployees();
                toast.success('Colaborador criado.');
            }
        } catch (e) {
            toast.error(e.response?.data?.error || 'Erro ao guardar.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/emg/pessoal/${deleteConfirm.id}`);
            setDeleteConfirm(null);
            setSelected(null);
            fetchEmployees();
            toast.success('Colaborador eliminado.');
        } catch {
            toast.error('Erro ao eliminar.');
        }
    };

    /* ── Medical file ── */

    const handleUploadMedicalFile = async (file) => {
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await api.post(`/emg/pessoal/${selected.id}/medical-file`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSelected(res.data);
            if (medicalFileInputRef.current) medicalFileInputRef.current.value = '';
            toast.success('Ficha carregada.');
        } catch {
            toast.error('Erro ao carregar ficheiro.');
        }
    };

    const handleDownloadMedicalFile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/emg/pessoal/${selected.id}/medical-file`,
                { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = selected.medicalFitnessOriginalName || 'ficha_medica';
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Erro ao descarregar ficheiro.');
        }
    };

    const handleDeleteMedicalFile = async () => {
        try {
            const res = await api.delete(`/emg/pessoal/${selected.id}/medical-file`);
            setSelected(res.data);
            setDeleteMedicalConfirm(false);
            toast.success('Ficheiro eliminado.');
        } catch {
            toast.error('Erro ao eliminar ficheiro.');
        }
    };

    /* ── Trainings ── */

    const handleAddTraining = async () => {
        if (!trainingForm.name || !trainingForm.date || !trainingForm.hours) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }
        try {
            setSaving(true);
            const fd = new FormData();
            fd.append('name', trainingForm.name);
            fd.append('date', trainingForm.date);
            fd.append('hours', trainingForm.hours);
            if (trainingForm.file) fd.append('file', trainingForm.file);
            await api.post(`/emg/pessoal/${selected.id}/trainings`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await fetchEmployee(selected.id);
            setTrainingForm(emptyTraining);
            if (fileInputRef.current) fileInputRef.current.value = '';
            toast.success('Formação adicionada.');
        } catch {
            toast.error('Erro ao adicionar formação.');
        } finally {
            setSaving(false);
        }
    };

    const startEditTraining = (t) => {
        setEditTrainingId(t.id);
        setEditTrainingForm({ name: t.name, date: t.date.slice(0, 10), hours: String(t.hours), file: null });
        if (editFileInputRef.current) editFileInputRef.current.value = '';
    };

    const handleUpdateTraining = async (trainingId) => {
        try {
            setSaving(true);
            const fd = new FormData();
            fd.append('name', editTrainingForm.name);
            fd.append('date', editTrainingForm.date);
            fd.append('hours', editTrainingForm.hours);
            if (editTrainingForm.file) fd.append('file', editTrainingForm.file);
            await api.put(`/emg/pessoal/${selected.id}/trainings/${trainingId}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setEditTrainingId(null);
            await fetchEmployee(selected.id);
            toast.success('Formação atualizada.');
        } catch {
            toast.error('Erro ao atualizar formação.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTraining = async () => {
        try {
            await api.delete(`/emg/pessoal/${selected.id}/trainings/${deleteTrainingConfirm.id}`);
            setDeleteTrainingConfirm(null);
            await fetchEmployee(selected.id);
            toast.success('Formação eliminada.');
        } catch {
            toast.error('Erro ao eliminar formação.');
        }
    };

    const handleDownload = async (trainingId, originalName) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${API_URL}/emg/pessoal/${selected.id}/trainings/${trainingId}/file`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = originalName || 'certificado';
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Erro ao descarregar ficheiro.');
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography level="h3">Pessoal</Typography>
                <Button startDecorator={<MdAdd />}
                    onClick={() => { setForm(emptyEmployee); setAddTab(0); setAddOpen(true); }}>
                    Novo Colaborador
                </Button>
            </Box>

            <Box sx={{ mb: 2, maxWidth: 320 }}>
                <Input placeholder="Pesquisar por nome…" value={search}
                    onChange={e => setSearch(e.target.value)} />
            </Box>

            <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'auto' }}>
                <Table stickyHeader hoverRow>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Função</th>
                            <th>Admissão</th>
                            <th>Contrato</th>
                            <th>Apt. Médica</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                Nenhum colaborador registado.
                            </td></tr>
                        ) : employees.map(emp => {
                            const alert = medicalAlert(emp.medicalFitnessDate);
                            return (
                                <tr key={emp.id} onClick={() => openDetail(emp)} style={{ cursor: 'pointer' }}>
                                    <td><strong>{emp.fullName}</strong></td>
                                    <td>{emp.jobCategory || '—'}</td>
                                    <td>{fmt(emp.admissionDate)}</td>
                                    <td>{contractLabel(emp.contractType)}</td>
                                    <td>
                                        {emp.medicalFitnessDate ? (
                                            <span style={{ background: alert?.bg, padding: '2px 8px', borderRadius: 4, fontSize: '0.85rem' }}>
                                                {fmt(emp.medicalFitnessDate)}{alert ? ` · ${alert.text}` : ''}
                                            </span>
                                        ) : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Sheet>

            {/* ── Add Modal ── */}
            <Modal open={addOpen} onClose={() => setAddOpen(false)}>
                <ModalDialog sx={{ width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
                    <ModalClose />
                    <Typography level="h4" sx={{ mb: 1 }}>Novo Colaborador</Typography>
                    <Tabs value={addTab} onChange={(_, v) => setAddTab(v)}>
                        <TabList>
                            <Tab>Dados Pessoais</Tab>
                            <Tab>Dados Contratuais</Tab>
                        </TabList>
                        <TabPanel value={0} sx={{ pt: 2 }}><PersonalSection form={form} fSet={fSet} /></TabPanel>
                        <TabPanel value={1} sx={{ pt: 2 }}><ContractSection form={form} fSet={fSet} setForm={setForm} /></TabPanel>
                    </Tabs>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="plain" onClick={() => setAddOpen(false)}>Cancelar</Button>
                        <Button loading={saving} onClick={handleSave}>Guardar</Button>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* ── Detail Modal ── */}
            {selected && (
                <Modal open={!!selected} onClose={() => { setSelected(null); setEditMode(false); setEditTrainingId(null); }}>
                    <ModalDialog sx={{ width: '100%', maxWidth: 820, maxHeight: '92vh', overflowY: 'auto' }}>
                        <ModalClose />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, pr: 4 }}>
                            <Box>
                                <Typography level="h4">{selected.fullName}</Typography>
                                {selected.jobCategory && (
                                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>{selected.jobCategory}</Typography>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                                {!editMode ? (
                                    <>
                                        <Button size="sm" variant="outlined" startDecorator={<MdEdit />} onClick={startEdit}>Editar</Button>
                                        <Button size="sm" variant="outlined" color="danger"
                                            startDecorator={<MdDelete />} onClick={() => setDeleteConfirm(selected)}>Eliminar</Button>
                                    </>
                                ) : (
                                    <>
                                        <Button size="sm" variant="plain" onClick={() => setEditMode(false)}>Cancelar</Button>
                                        <Button size="sm" loading={saving} onClick={handleSave}>Guardar</Button>
                                    </>
                                )}
                            </Box>
                        </Box>

                        <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)}>
                            <TabList>
                                <Tab>Dados Pessoais</Tab>
                                <Tab>Dados Contratuais</Tab>
                                <Tab>Formações ({selected.trainings?.length ?? 0})</Tab>
                            </TabList>

                            {/* Tab 0 */}
                            <TabPanel value={0} sx={{ pt: 2 }}>
                                {editMode ? <PersonalSection form={form} fSet={fSet} /> : (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <InfoRow label="Nome Completo" value={selected.fullName} span={2} />
                                        <InfoRow label="NIF" value={selected.nif} />
                                        <InfoRow label="CC / BI" value={selected.cc} />
                                        <InfoRow label="NISS" value={selected.niss} />
                                        <InfoRow label="Data de Nascimento" value={fmt(selected.birthDate)} />
                                        <InfoRow label="Morada" value={selected.address} span={2} />
                                        <InfoRow label="Contacto Telefónico" value={selected.phone} />
                                        <InfoRow label="Email Pessoal" value={selected.personalEmail} />
                                        <InfoRow label="Email de Trabalho" value={selected.workEmail} />
                                        <Box sx={{ gridColumn: '1/-1' }}><Divider /></Box>
                                        <Box sx={{ gridColumn: '1/-1' }}>
                                            <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 'md' }}>Contacto de Emergência</Typography>
                                        </Box>
                                        <InfoRow label="Nome" value={selected.emergencyContactName} />
                                        <InfoRow label="Relação" value={selected.emergencyContactRel} />
                                        <InfoRow label="Telefone" value={selected.emergencyContactPhone} />
                                    </Box>
                                )}
                            </TabPanel>

                            {/* Tab 1 */}
                            <TabPanel value={1} sx={{ pt: 2 }}>
                                {editMode ? <ContractSection form={form} fSet={fSet} setForm={setForm} /> : (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <InfoRow label="Data de Admissão" value={fmt(selected.admissionDate)} />
                                        <InfoRow label="Tipo de Contrato" value={contractLabel(selected.contractType)} />
                                        <InfoRow label="Categoria Profissional / Função" value={selected.jobCategory} span={2} />
                                        <InfoRow label="IBAN" value={selected.iban} span={2} />
                                        <InfoRow label="Apólice de Seguro de Acidentes de Trabalho" value={selected.insurancePolicy} span={2} />
                                        <Box sx={{ gridColumn: '1/-1' }}>
                                            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>Ficha de Aptidão Médica — validade</Typography>
                                            {selected.medicalFitnessDate ? (() => {
                                                const alert = medicalAlert(selected.medicalFitnessDate);
                                                return <span style={{ background: alert?.bg, padding: '2px 10px', borderRadius: 4 }}>
                                                    {fmt(selected.medicalFitnessDate)}{alert ? ` · ${alert.text}` : ''}
                                                </span>;
                                            })() : <Typography level="body-sm">—</Typography>}
                                        </Box>
                                        {/* Medical fitness file — always visible */}
                                        <Box sx={{ gridColumn: '1/-1' }}>
                                            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>Ficha de Aptidão Médica — documento</Typography>
                                            <input ref={medicalFileInputRef} type="file" style={{ display: 'none' }}
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                onChange={e => { if (e.target.files[0]) handleUploadMedicalFile(e.target.files[0]); }} />
                                            {selected.medicalFitnessFilename ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    <Typography level="body-sm" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                        {selected.medicalFitnessOriginalName || selected.medicalFitnessFilename}
                                                    </Typography>
                                                    <Button size="sm" variant="plain" startDecorator={<MdDownload />}
                                                        onClick={handleDownloadMedicalFile}>Descarregar</Button>
                                                    <Button size="sm" variant="outlined" startDecorator={<MdUploadFile />}
                                                        onClick={() => medicalFileInputRef.current?.click()}>Substituir</Button>
                                                    <IconButton size="sm" color="danger" onClick={() => setDeleteMedicalConfirm(true)}>
                                                        <MdDelete />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                <Button size="sm" variant="outlined" startDecorator={<MdUploadFile />}
                                                    onClick={() => medicalFileInputRef.current?.click()}>
                                                    Carregar Ficha
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </TabPanel>

                            {/* Tab 2: Trainings */}
                            <TabPanel value={2} sx={{ pt: 2 }}>
                                <Sheet variant="soft" sx={{ p: 2, borderRadius: 'sm', mb: 2 }}>
                                    <Typography level="title-sm" sx={{ mb: 1.5 }}>Adicionar Formação</Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 1.5, mb: 1.5 }}>
                                        <Field label="Nome da Formação *">
                                            <Input value={trainingForm.name}
                                                onChange={e => setTrainingForm(f => ({ ...f, name: e.target.value }))} />
                                        </Field>
                                        <Field label="Data *">
                                            <Input type="date" value={trainingForm.date}
                                                slotProps={{ input: { min: minTrainingDate, max: today } }}
                                                onChange={e => setTrainingForm(f => ({ ...f, date: e.target.value }))} />
                                        </Field>
                                        <Field label="N.º Horas *">
                                            <Input type="number" min="0.5" step="0.5" value={trainingForm.hours}
                                                onChange={e => setTrainingForm(f => ({ ...f, hours: e.target.value }))} />
                                        </Field>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Button size="sm" variant="outlined" startDecorator={<MdUploadFile />}
                                            onClick={() => fileInputRef.current?.click()}>
                                            {trainingForm.file ? truncateName(trainingForm.file.name) : 'Anexar Certificado'}
                                        </Button>
                                        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            style={{ display: 'none' }}
                                            onChange={e => setTrainingForm(f => ({ ...f, file: e.target.files[0] || null }))} />
                                        <Button size="sm" loading={saving}
                                            disabled={!trainingForm.name || !trainingForm.date || !trainingForm.hours}
                                            onClick={handleAddTraining}>Adicionar</Button>
                                    </Box>
                                </Sheet>

                                {(() => {
                                    const allTrainings = selected.trainings || [];
                                    const years = [...new Set(allTrainings.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a);
                                    const filtered = trainingYear
                                        ? allTrainings.filter(t => new Date(t.date).getFullYear() === parseInt(trainingYear))
                                        : allTrainings;
                                    const totalHours = filtered.reduce((s, t) => s + t.hours, 0);

                                    return (
                                        <>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography level="body-sm">Ano:</Typography>
                                                    <Select size="sm" value={trainingYear}
                                                        onChange={(_, v) => setTrainingYear(v || '')} sx={{ minWidth: 110 }}>
                                                        <Option value="">Todos</Option>
                                                        {years.map(y => <Option key={y} value={String(y)}>{y}</Option>)}
                                                    </Select>
                                                </Box>
                                                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                                                    {filtered.length} formação{filtered.length !== 1 ? 'ões' : ''} · <strong>{totalHours}h</strong>
                                                </Typography>
                                            </Box>

                                            <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'auto' }}>
                                                <input ref={editFileInputRef} type="file"
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: 'none' }}
                                                    onChange={e => setEditTrainingForm(f => ({ ...f, file: e.target.files[0] || null }))} />
                                                <Table size="sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Formação</th>
                                                            <th style={{ width: 110 }}>Data</th>
                                                            <th style={{ width: 75 }}>Horas</th>
                                                            <th>Certificado</th>
                                                            <th style={{ width: 80 }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filtered.length === 0 ? (
                                                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#666' }}>
                                                                Nenhuma formação{trainingYear ? ` em ${trainingYear}` : ''}.
                                                            </td></tr>
                                                        ) : filtered.map(t => editTrainingId === t.id ? (
                                                            <tr key={t.id} style={{ background: '#f0f4ff' }}>
                                                                <td><Input size="sm" value={editTrainingForm.name}
                                                                    onChange={e => setEditTrainingForm(f => ({ ...f, name: e.target.value }))} /></td>
                                                                <td><Input size="sm" type="date" value={editTrainingForm.date}
                                                                    slotProps={{ input: { min: minTrainingDate, max: today } }}
                                                                    onChange={e => setEditTrainingForm(f => ({ ...f, date: e.target.value }))} /></td>
                                                                <td><Input size="sm" type="number" min="0.5" step="0.5"
                                                                    value={editTrainingForm.hours}
                                                                    onChange={e => setEditTrainingForm(f => ({ ...f, hours: e.target.value }))} /></td>
                                                                <td>
                                                                    <Button size="sm" variant="outlined" startDecorator={<MdUploadFile />}
                                                                        onClick={() => editFileInputRef.current?.click()}>
                                                                        {editTrainingForm.file
                                                                            ? truncateName(editTrainingForm.file.name)
                                                                            : truncateName(t.originalName || 'Trocar ficheiro')}
                                                                    </Button>
                                                                </td>
                                                                <td>
                                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                        <IconButton size="sm" color="success" onClick={() => handleUpdateTraining(t.id)}>
                                                                            <MdCheck />
                                                                        </IconButton>
                                                                        <IconButton size="sm" onClick={() => setEditTrainingId(null)}>
                                                                            <MdClose />
                                                                        </IconButton>
                                                                    </Box>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            <tr key={t.id}>
                                                                <td>{t.name}</td>
                                                                <td>{fmt(t.date)}</td>
                                                                <td>{t.hours}h</td>
                                                                <td>
                                                                    {t.filename ? (
                                                                        <Button size="sm" variant="plain" startDecorator={<MdDownload />}
                                                                            onClick={() => handleDownload(t.id, t.originalName)}>
                                                                            {truncateName(t.originalName || 'Descarregar')}
                                                                        </Button>
                                                                    ) : '—'}
                                                                </td>
                                                                <td>
                                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                        <IconButton size="sm" onClick={() => startEditTraining(t)}><MdEdit /></IconButton>
                                                                        <IconButton size="sm" color="danger"
                                                                            onClick={() => setDeleteTrainingConfirm(t)}><MdDelete /></IconButton>
                                                                    </Box>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </Sheet>
                                        </>
                                    );
                                })()}
                            </TabPanel>
                        </Tabs>
                    </ModalDialog>
                </Modal>
            )}

            {/* Delete Employee */}
            <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
                <ModalDialog>
                    <ModalClose />
                    <Typography level="h4">Eliminar Colaborador</Typography>
                    <Typography sx={{ mt: 1 }}>
                        Tem a certeza que deseja eliminar <strong>{deleteConfirm?.fullName}</strong>?
                        Todos os dados e formações serão apagados permanentemente.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="plain" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
                        <Button color="danger" onClick={handleDelete}>Eliminar</Button>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* Delete Training */}
            <Modal open={!!deleteTrainingConfirm} onClose={() => setDeleteTrainingConfirm(null)}>
                <ModalDialog>
                    <ModalClose />
                    <Typography level="h4">Eliminar Formação</Typography>
                    <Typography sx={{ mt: 1 }}>
                        Tem a certeza que deseja eliminar <strong>{deleteTrainingConfirm?.name}</strong>?
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="plain" onClick={() => setDeleteTrainingConfirm(null)}>Cancelar</Button>
                        <Button color="danger" onClick={handleDeleteTraining}>Eliminar</Button>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* Delete Medical File */}
            <Modal open={deleteMedicalConfirm} onClose={() => setDeleteMedicalConfirm(false)}>
                <ModalDialog>
                    <ModalClose />
                    <Typography level="h4">Eliminar Ficheiro</Typography>
                    <Typography sx={{ mt: 1 }}>Tem a certeza que deseja eliminar a ficha de aptidão médica?</Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="plain" onClick={() => setDeleteMedicalConfirm(false)}>Cancelar</Button>
                        <Button color="danger" onClick={handleDeleteMedicalFile}>Eliminar</Button>
                    </Box>
                </ModalDialog>
            </Modal>
        </>
    );
}
