import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import Chip from '@mui/joy/Chip';
import Checkbox from '@mui/joy/Checkbox';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import {
    MdEdit, MdDelete, MdVisibility, MdPictureAsPdf, MdEmail, MdDraw, MdUploadFile, MdDownload,
    MdAddAPhoto, MdCheckCircle, MdRadioButtonUnchecked, MdClose,
} from 'react-icons/md';
import { toast } from 'react-toastify';
import api from '../services/api';
import SignaturePad from './SignaturePad';
import PhotoLightbox from './PhotoLightbox';
import {
    OBRA_TYPES, OBRA_STATUS, obraTypeLabel, obraStatusLabel, formatTimeRange,
    fmtDate, downloadObraPDF, obraPDFBase64, shrinkImage, allTechnicianNames,
} from '../utils/obraReport';

const TYPE_COLORS = {
    instalacao: { bg: '#e3f2fd', color: '#1565c0' },
    manutencao: { bg: '#fff9c4', color: '#f57f17' },
    reparacao: { bg: '#ffe0b2', color: '#e65100' },
};

const emptyForm = {
    client: '', obra: '', type: 'instalacao', status: 'em_curso',
    date: new Date().toISOString().slice(0, 10), startTime: '', endTime: '',
    tasks: '', materials: '', notes: '', technicianIds: [], externalTechnicians: [],
};

// Tolerantes a null: são chamados no corpo dos modais, que o MUI avalia mesmo fechados.
const docsOf = o => (o?.documents ?? []).filter(d => d.kind !== 'foto');
const photosOf = o => (o?.documents ?? []).filter(d => d.kind === 'foto');

/**
 * Miniatura de uma foto — o ficheiro precisa de token, por isso vai por axios.
 *
 * O que se descarrega é a foto inteira (não há miniaturas no servidor), pelo que
 * o URL é entregue a quem chama via `onReady`: o visualizador reaproveita-o e
 * abre de imediato, sem descarregar a mesma imagem uma segunda vez.
 */
function PhotoThumb({ obraId, photo, onReady, onOpen }) {
    const [url, setUrl] = useState(null);
    // Em ref para o descarregamento não recomeçar sempre que o pai redesenha.
    const readyRef = useRef(onReady);
    readyRef.current = onReady;

    useEffect(() => {
        let objectUrl;
        let cancelled = false;
        api.get(`/emg/obras/${obraId}/documentos/${photo.id}`, { responseType: 'blob' })
            .then(res => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(res.data);
                setUrl(objectUrl);
                readyRef.current?.(photo.id, objectUrl);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [obraId, photo.id]);

    return (
        <Box
            onClick={onOpen}
            title={onOpen ? 'Ver foto' : undefined}
            sx={{
                width: '100%', aspectRatio: '1', borderRadius: 'sm', overflow: 'hidden',
                border: '1px solid #e0e0e0', bgcolor: '#fafafa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: onOpen ? 'zoom-in' : 'default',
                '&:hover img': { transform: onOpen ? 'scale(1.05)' : 'none' },
            }}
        >
            {url
                ? <Box component="img" src={url} alt={photo.originalName}
                    sx={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform 150ms ease-out',
                    }} />
                : <Typography level="body-xs" sx={{ color: '#bbb' }}>...</Typography>}
        </Box>
    );
}

export default function Obras() {
    const routerLocation = useLocation();
    const navigate = useNavigate();
    // As permissões vêm do servidor em canEdit/canDelete por obra, em vez de serem
    // recalculadas aqui — a regra depende dos técnicos associados a cada obra.
    const [records, setRecords] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);

    const [filterClient, setFilterClient] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [appliedClient, setAppliedClient] = useState('');
    const [filterTechnician, setFilterTechnician] = useState('');
    const [appliedTechnician, setAppliedTechnician] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [openForm, setOpenForm] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formLoading, setFormLoading] = useState(false);
    const [externalInput, setExternalInput] = useState('');
    // Pedido que deu origem a esta obra, quando se chega aqui a partir de um
    // ticket. Fica guardado enquanto o formulário está aberto.
    const [fromTicket, setFromTicket] = useState(null);

    const [detail, setDetail] = useState(null);
    // URLs das fotos já descarregadas para as miniaturas, reaproveitados pelo
    // visualizador; e o índice da foto aberta (null = visualizador fechado).
    const [photoUrls, setPhotoUrls] = useState({});
    const [viewerIndex, setViewerIndex] = useState(null);

    const registerPhotoUrl = useCallback((photoId, url) => {
        setPhotoUrls(prev => ({ ...prev, [photoId]: url }));
    }, []);

    // Sair da ficha desmonta as miniaturas, e estas revogam os object URLs que
    // criaram. Guardar os antigos daria imagens em branco ao reabrir a obra.
    useEffect(() => {
        setPhotoUrls({});
        setViewerIndex(null);
    }, [detail?.id]);
    const [signing, setSigning] = useState(false);
    const [signerName, setSignerName] = useState('');
    const [uploading, setUploading] = useState(false);

    const [emailModal, setEmailModal] = useState(null);
    const [emailForm, setEmailForm] = useState({ clientEmail: '', sendToCompany: true, message: '', includePhotos: true });
    const [emailLoading, setEmailLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [photoPrompt, setPhotoPrompt] = useState(null);

    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    // Foto cuja legenda está a ser escrita: { id, value }.
    const [captionEdit, setCaptionEdit] = useState(null);

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/emg/obras', {
                params: {
                    page, pageSize,
                    client: appliedClient || undefined,
                    type: filterType || undefined,
                    status: filterStatus || undefined,
                    technician: appliedTechnician || undefined,
                    from: dateFrom || undefined,
                    to: dateTo || undefined,
                },
            });
            setRecords(res.data.data);
            setTotal(res.data.total);
        } catch {
            toast.error('Erro ao carregar obras.');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, appliedClient, appliedTechnician, filterType, filterStatus, dateFrom, dateTo]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        // Endpoint reduzido (so id e nome): o /emg/pessoal devolve dados pessoais e
        // esta limitado a gestores, pelo que um tecnico so se via a si proprio.
        api.get('/emg/pessoal/tecnicos')
            .then(res => setEmployees(Array.isArray(res.data) ? res.data : []))
            .catch(() => setEmployees([]));
    }, []);

    function handleFilter() {
        setAppliedClient(filterClient.trim());
        setAppliedTechnician(filterTechnician.trim());
        setPage(1);
    }

    function clearFilters() {
        setFilterClient('');
        setAppliedClient('');
        setFilterType('');
        setFilterStatus('');
        setFilterTechnician('');
        setAppliedTechnician('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    }

    function addExternal() {
        const name = externalInput.trim();
        if (!name) return;
        if (form.externalTechnicians.includes(name)) {
            toast.info('Esse técnico já está na lista.');
            return;
        }
        setForm(p => ({ ...p, externalTechnicians: [...p.externalTechnicians, name] }));
        setExternalInput('');
    }

    function removeExternal(name) {
        setForm(p => ({ ...p, externalTechnicians: p.externalTechnicians.filter(n => n !== name) }));
    }

    function openCreate() {
        setIsEdit(false);
        setEditId(null);
        setForm({ ...emptyForm });
        setExternalInput('');
        setFromTicket(null);
        setOpenForm(true);
    }

    // Chegada a partir de um ticket: abre o formulário já preenchido com o que o
    // pedido sabe. O estado do router é limpo a seguir, senão voltar atrás no
    // browser reabriria o formulário sem se ter pedido nada.
    useEffect(() => {
        const nova = routerLocation.state?.novaObra;
        if (!nova) return;
        setIsEdit(false);
        setEditId(null);
        setForm({ ...emptyForm, client: nova.client || '', obra: nova.obra || '' });
        setExternalInput('');
        setFromTicket(nova);
        setOpenForm(true);
        navigate(routerLocation.pathname, { replace: true, state: null });
    }, [routerLocation.state, routerLocation.pathname, navigate]);

    function openEdit(r) {
        setIsEdit(true);
        setEditId(r.id);
        setExternalInput('');
        setFromTicket(null);
        setForm({
            client: r.client, obra: r.obra, type: r.type, status: r.status || 'em_curso',
            date: r.date ? r.date.slice(0, 10) : '',
            startTime: r.startTime || '', endTime: r.endTime || '',
            tasks: r.tasks, materials: r.materials, notes: r.notes || '',
            technicianIds: (r.technicians ?? []).map(t => t.id),
            externalTechnicians: r.externalTechnicians ?? [],
        });
        setOpenForm(true);
    }

    async function refreshDetail(id) {
        const res = await api.get(`/emg/obras/${id}`);
        setDetail(res.data);
        return res.data;
    }

    async function openDetail(r) {
        try {
            setSigning(false);
            setSignerName('');
            await refreshDetail(r.id);
        } catch {
            toast.error('Erro ao carregar o detalhe.');
        }
    }

    async function handleSubmit() {
        const required = ['client', 'obra', 'tasks', 'materials'];
        if (required.some(f => !form[f]?.trim()) || !form.date) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }
        setFormLoading(true);
        try {
            if (isEdit) {
                await api.put(`/emg/obras/${editId}`, form);
                toast.success('Obra atualizada.');
                if (detail?.id === editId) await refreshDetail(editId);
            } else {
                await api.post('/emg/obras', {
                    ...form,
                    ...(fromTicket ? { ticket_id: fromTicket.ticket_id } : {}),
                });
                toast.success(fromTicket
                    ? `Obra criada e ligada ao ticket #${fromTicket.ticketNumber}.`
                    : 'Obra criada.');
                setFromTicket(null);
            }
            setOpenForm(false);
            fetchRecords();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao guardar.');
        } finally {
            setFormLoading(false);
        }
    }

    async function handleDelete() {
        try {
            await api.delete(`/emg/obras/${deleteConfirm.id}`);
            toast.success('Obra eliminada.');
            if (detail?.id === deleteConfirm.id) setDetail(null);
            fetchRecords();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao eliminar.');
        } finally {
            setDeleteConfirm({ open: false, id: null });
        }
    }

    async function handleSaveSignature(signatureData) {
        if (!signerName.trim()) {
            toast.error('Indique o nome de quem assina.');
            return;
        }
        try {
            await api.put(`/emg/obras/${detail.id}/assinatura`, {
                signatureData, signedByName: signerName.trim(),
            });
            await refreshDetail(detail.id);
            setSigning(false);
            setSignerName('');
            toast.success('Assinatura guardada.');
            fetchRecords();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao guardar a assinatura.');
        }
    }

    async function handleRemoveSignature() {
        try {
            await api.delete(`/emg/obras/${detail.id}/assinatura`);
            await refreshDetail(detail.id);
            toast.success('Assinatura removida.');
            fetchRecords();
        } catch {
            toast.error('Erro ao remover a assinatura.');
        }
    }

    async function handleUpload(files, kind) {
        const list = Array.from(files ?? []);
        if (list.length === 0) return;
        setUploading(true);
        try {
            for (const file of list) {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('kind', kind);
                await api.post(`/emg/obras/${detail.id}/documentos`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            await refreshDetail(detail.id);
            toast.success(kind === 'foto'
                ? `${list.length} foto(s) carregada(s).`
                : `${list.length} documento(s) carregado(s).`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao carregar o ficheiro.');
        } finally {
            setUploading(false);
        }
    }

    async function handleToggleStatus() {
        const next = detail.status === 'concluida' ? 'em_curso' : 'concluida';
        try {
            await api.put(`/emg/obras/${detail.id}`, { status: next });
            await refreshDetail(detail.id);
            fetchRecords();
            toast.success(next === 'concluida' ? 'Obra marcada como concluída.' : 'Obra reaberta.');
        } catch {
            toast.error('Erro ao atualizar o estado.');
        }
    }

    /** Descarrega e reduz as fotos da obra para poderem entrar no PDF. */
    async function loadPhotosForPDF(obra) {
        const photos = (obra.documents ?? []).filter(d => d.kind === 'foto');
        const out = [];
        for (const p of photos) {
            try {
                const res = await api.get(`/emg/obras/${obra.id}/documentos/${p.id}`, { responseType: 'blob' });
                out.push({ ...(await shrinkImage(res.data)), caption: p.caption });
            } catch {
                // Uma foto ilegível não deve impedir a geração do relatório.
                console.warn('Foto ignorada no relatório:', p.originalName);
            }
        }
        return out;
    }

    async function handleDownloadDoc(doc) {
        try {
            const res = await api.get(`/emg/obras/${detail.id}/documentos/${doc.id}`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.originalName;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Erro ao descarregar o documento.');
        }
    }

    async function handleSaveCaption() {
        try {
            await api.put(`/emg/obras/${detail.id}/documentos/${captionEdit.id}`, {
                caption: captionEdit.value,
            });
            await refreshDetail(detail.id);
            setCaptionEdit(null);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao guardar a legenda.');
        }
    }

    async function handleDeleteDoc(docId) {
        try {
            await api.delete(`/emg/obras/${detail.id}/documentos/${docId}`);
            await refreshDetail(detail.id);
            toast.success('Documento eliminado.');
        } catch {
            toast.error('Erro ao eliminar o documento.');
        }
    }

    async function handleSendEmail() {
        if (!emailForm.clientEmail.trim() && !emailForm.sendToCompany) {
            toast.error('Indique um destinatário.');
            return;
        }
        setEmailLoading(true);
        try {
            const photos = emailForm.includePhotos ? await loadPhotosForPDF(emailModal) : [];
            await api.post(`/emg/obras/${emailModal.id}/enviar`, {
                pdf: obraPDFBase64(emailModal, photos),
                clientEmail: emailForm.clientEmail.trim() || undefined,
                sendToCompany: emailForm.sendToCompany,
                message: emailForm.message.trim() || undefined,
            });
            toast.success('Relatório enviado.');
            setEmailModal(null);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao enviar o relatório.');
        } finally {
            setEmailLoading(false);
        }
    }

    function openEmailModal(obra) {
        const hasPhotos = (obra.documents ?? []).some(d => d.kind === 'foto');
        setEmailForm({ clientEmail: '', sendToCompany: true, message: '', includePhotos: hasPhotos });
        setEmailModal(obra);
    }

    /** Gera e descarrega o PDF; se houver fotos, pergunta antes se devem ir incluídas. */
    async function handleDownloadPDF(obra) {
        const full = obra.documents ? obra : (await api.get(`/emg/obras/${obra.id}`)).data;
        const photoCount = photosOf(full).length;

        if (photoCount > 0) {
            setPhotoPrompt({ obra: full, photoCount });
            return;
        }
        downloadObraPDF(full);
    }

    async function generateWithPhotos(include) {
        const { obra } = photoPrompt;
        setPhotoPrompt(null);
        let photos = [];
        if (include) {
            setPdfLoading(true);
            photos = await loadPhotosForPDF(obra);
            setPdfLoading(false);
        }
        downloadObraPDF(obra, photos);
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <Box sx={{ p: 2 }}>
            <Typography level="h3" sx={{ fontWeight: 'bold', color: '#444', mb: 2 }}>Obras</Typography>

            {/* Filtros */}
            <Box className="filtros" sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'flex-end' }}>
                <FormControl size="sm">
                    <FormLabel>Cliente</FormLabel>
                    <Input
                        placeholder="Pesquisar cliente..."
                        value={filterClient}
                        onChange={e => setFilterClient(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleFilter()}
                    />
                </FormControl>
                <FormControl size="sm">
                    <FormLabel>Tipo</FormLabel>
                    <Select
                        value={filterType}
                        onChange={(_, v) => { setFilterType(v ?? ''); setPage(1); }}
                        sx={{ minWidth: 170 }}
                    >
                        <Option value="">Todos</Option>
                        {OBRA_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                    </Select>
                </FormControl>
                <FormControl size="sm">
                    <FormLabel>Estado</FormLabel>
                    <Select
                        value={filterStatus}
                        onChange={(_, v) => { setFilterStatus(v ?? ''); setPage(1); }}
                        sx={{ minWidth: 150 }}
                    >
                        <Option value="">Todos</Option>
                        {OBRA_STATUS.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                    </Select>
                </FormControl>
                <FormControl size="sm">
                    <FormLabel>Técnico</FormLabel>
                    <Input
                        placeholder="Nome do técnico..."
                        value={filterTechnician}
                        onChange={e => setFilterTechnician(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleFilter()}
                    />
                </FormControl>
                <FormControl size="sm">
                    <FormLabel>De</FormLabel>
                    <Input type="date" value={dateFrom}
                        onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
                </FormControl>
                <FormControl size="sm">
                    <FormLabel>Até</FormLabel>
                    <Input type="date" value={dateTo}
                        onChange={e => { setDateTo(e.target.value); setPage(1); }} />
                </FormControl>
                <Button size="sm" onClick={handleFilter}>Filtrar</Button>
                <Button
                    size="sm"
                    variant={filterStatus === 'em_curso' ? 'solid' : 'outlined'}
                    color="warning"
                    onClick={() => { setFilterStatus(filterStatus === 'em_curso' ? '' : 'em_curso'); setPage(1); }}
                >
                    Só em curso
                </Button>
                <Button size="sm" variant="outlined" onClick={clearFilters}>Limpar</Button>
                <Box sx={{ ml: 'auto' }}>
                    <Button size="sm" color="warning" onClick={openCreate}>+ Nova Obra</Button>
                </Box>
            </Box>

            {/* Tabela */}
            <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'auto' }}>
                <Table borderAxis="xBetween" size="sm" sx={{ minWidth: 950 }}>
                    <thead>
                        <tr>
                            <th style={{ width: 70 }}>Obra #</th>
                            <th style={{ width: 100 }}>Data</th>
                            <th style={{ width: 105 }}>Horário</th>
                            <th>Cliente</th>
                            <th>Obra / Local</th>
                            <th style={{ width: 110 }}>Tipo</th>
                            <th style={{ width: 100, textAlign: 'center' }}>Estado</th>
                            <th>Técnicos</th>
                            <th style={{ width: 100, textAlign: 'center' }}>Assinatura</th>
                            <th style={{ width: 130, textAlign: 'center' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>A carregar...</td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Sem obras registadas.</td></tr>
                        ) : records.map(r => (
                            <tr key={r.id}>
                                <td style={{ fontWeight: 'bold', color: '#f57c00' }}>#{r.orderNumber}</td>
                                <td>{fmtDate(r.date)}</td>
                                <td style={{ fontSize: '0.8rem', color: '#555' }}>
                                    {formatTimeRange(r.startTime, r.endTime) || '—'}
                                </td>
                                <td>{r.client}</td>
                                <td>{r.obra}</td>
                                <td>
                                    <Box sx={{
                                        display: 'inline-block', px: 1, py: 0.25, borderRadius: 'sm',
                                        fontSize: '0.75rem', fontWeight: 'bold',
                                        bgcolor: TYPE_COLORS[r.type]?.bg, color: TYPE_COLORS[r.type]?.color,
                                    }}>
                                        {obraTypeLabel(r.type)}
                                    </Box>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <Chip
                                        size="sm"
                                        startDecorator={r.status === 'concluida' ? <MdCheckCircle /> : <MdRadioButtonUnchecked />}
                                        sx={r.status === 'concluida'
                                            ? { bgcolor: '#c8e6c9', color: '#2e7d32', fontWeight: 'bold' }
                                            : { bgcolor: '#fff9c4', color: '#f57f17', fontWeight: 'bold' }}
                                    >
                                        {obraStatusLabel(r.status)}
                                    </Chip>
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>
                                    {allTechnicianNames(r).join(', ') || '—'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {r.signedAt
                                        ? <Chip size="sm" sx={{ bgcolor: '#c8e6c9', color: '#2e7d32', fontWeight: 'bold' }}>Assinada</Chip>
                                        : <Chip size="sm" sx={{ bgcolor: '#eee', color: '#888' }}>Por assinar</Chip>}
                                </td>
                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    <IconButton size="sm" variant="plain" title="Ver" onClick={() => openDetail(r)}><MdVisibility /></IconButton>
                                    {r.canEdit && (
                                        <IconButton size="sm" variant="plain" title="Editar" onClick={() => openEdit(r)}><MdEdit /></IconButton>
                                    )}
                                    <IconButton size="sm" variant="plain" title="Relatório PDF" onClick={() => handleDownloadPDF(r)}><MdPictureAsPdf /></IconButton>
                                    {r.canDelete && (
                                        <IconButton size="sm" variant="plain" color="danger" title="Eliminar"
                                            onClick={() => setDeleteConfirm({ open: true, id: r.id })}><MdDelete /></IconButton>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Sheet>

            {/* Paginação */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Typography level="body-sm" sx={{ color: '#666' }}>
                    {total} obra(s) — página {page} de {totalPages}
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
                <ModalDialog sx={{ maxWidth: 680, width: '95%', overflow: 'auto', maxHeight: '92vh' }}>
                    <ModalClose />
                    <Typography level="h4" sx={{ color: '#f57c00', mb: 1 }}>
                        {isEdit ? 'Editar Obra' : 'Nova Obra'}
                    </Typography>
                    {!isEdit && fromTicket && (
                        <Typography level="body-sm" sx={{ color: '#666' }}>
                            A partir do <strong>Ticket #{fromTicket.ticketNumber}</strong> — fica ligada a ele ao guardar.
                        </Typography>
                    )}
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Cliente</FormLabel>
                                <Input value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))} />
                            </FormControl>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Obra / Local</FormLabel>
                                <Input value={form.obra} onChange={e => setForm(p => ({ ...p, obra: e.target.value }))} />
                            </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Tipo de trabalho</FormLabel>
                                <Select value={form.type} onChange={(_, v) => setForm(p => ({ ...p, type: v ?? 'instalacao' }))}>
                                    {OBRA_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                                </Select>
                            </FormControl>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Estado</FormLabel>
                                <Select value={form.status} onChange={(_, v) => setForm(p => ({ ...p, status: v ?? 'em_curso' }))}>
                                    {OBRA_STATUS.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="sm" required sx={{ flex: 1 }}>
                                <FormLabel>Data</FormLabel>
                                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                            </FormControl>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Hora de início</FormLabel>
                                <Input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
                            </FormControl>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Hora de fim</FormLabel>
                                <Input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
                            </FormControl>
                        </Box>
                        <FormControl size="sm" required>
                            <FormLabel>Tarefas efetuadas</FormLabel>
                            <Textarea minRows={3} value={form.tasks} onChange={e => setForm(p => ({ ...p, tasks: e.target.value }))} />
                        </FormControl>
                        <FormControl size="sm" required>
                            <FormLabel>Materiais aplicados</FormLabel>
                            <Textarea minRows={3} value={form.materials} onChange={e => setForm(p => ({ ...p, materials: e.target.value }))} />
                        </FormControl>
                        <FormControl size="sm">
                            <FormLabel>Observações</FormLabel>
                            <Textarea minRows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                        </FormControl>
                        <FormControl size="sm">
                            <FormLabel>Técnicos associados</FormLabel>
                            {employees.length === 0 ? (
                                <Typography level="body-xs" sx={{ color: '#999' }}>
                                    Sem colaboradores registados em Pessoal.
                                </Typography>
                            ) : (
                                <Box sx={{
                                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                                    gap: 0.5, maxHeight: 160, overflowY: 'auto',
                                    border: '1px solid #e0e0e0', borderRadius: 'sm', p: 1,
                                }}>
                                    {employees.map(e => (
                                        <Checkbox
                                            key={e.id}
                                            size="sm"
                                            label={e.fullName}
                                            checked={form.technicianIds.includes(e.id)}
                                            onChange={ev => setForm(p => ({
                                                ...p,
                                                technicianIds: ev.target.checked
                                                    ? [...p.technicianIds, e.id]
                                                    : p.technicianIds.filter(id => id !== e.id),
                                            }))}
                                        />
                                    ))}
                                </Box>
                            )}
                        </FormControl>

                        <FormControl size="sm">
                            <FormLabel>Outro técnico (não registado em Pessoal)</FormLabel>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Input
                                    sx={{ flex: 1 }}
                                    placeholder="Nome do técnico ocasional..."
                                    value={externalInput}
                                    onChange={e => setExternalInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') { e.preventDefault(); addExternal(); }
                                    }}
                                />
                                <Button variant="outlined" color="neutral" onClick={addExternal}>
                                    Adicionar
                                </Button>
                            </Box>
                            {form.externalTechnicians.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                                    {form.externalTechnicians.map(n => (
                                        <Chip
                                            key={n}
                                            size="sm"
                                            variant="soft"
                                            color="warning"
                                            endDecorator={
                                                <MdClose
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => removeExternal(n)}
                                                />
                                            }
                                        >
                                            {n}
                                        </Chip>
                                    ))}
                                </Box>
                            )}
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'flex-end' }}>
                            <Button variant="plain" color="neutral" onClick={() => setOpenForm(false)}>Cancelar</Button>
                            <Button color="warning" loading={formLoading} onClick={handleSubmit}>
                                {isEdit ? 'Atualizar' : 'Criar Obra'}
                            </Button>
                        </Box>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* Modal detalhe */}
            <Modal open={!!detail} onClose={() => { setViewerIndex(null); setDetail(null); }}>
                <ModalDialog sx={{ maxWidth: 720, width: '95%', overflow: 'auto', maxHeight: '92vh' }}>
                    <ModalClose />
                    {detail && <>
                        <Typography level="h4" sx={{ color: '#f57c00' }}>
                            Obra #{detail.orderNumber}
                        </Typography>
                        <Typography level="body-sm" sx={{ color: '#666' }}>
                            {detail.client} — {detail.obra}
                        </Typography>
                        <Divider sx={{ my: 1.5 }} />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.88rem', mb: 1.5 }}>
                            <Box><strong>Tipo:</strong> {obraTypeLabel(detail.type)}</Box>
                            <Box><strong>Data:</strong> {fmtDate(detail.date)}</Box>
                            <Box><strong>Horário:</strong> {formatTimeRange(detail.startTime, detail.endTime) || '—'}</Box>
                            <Box>
                                <strong>Estado:</strong>{' '}
                                <Chip
                                    size="sm"
                                    sx={detail.status === 'concluida'
                                        ? { bgcolor: '#c8e6c9', color: '#2e7d32', fontWeight: 'bold' }
                                        : { bgcolor: '#fff9c4', color: '#f57f17', fontWeight: 'bold' }}
                                >
                                    {obraStatusLabel(detail.status)}
                                </Chip>
                            </Box>
                            <Box sx={{ gridColumn: '1/-1' }}>
                                <strong>Técnicos:</strong> {allTechnicianNames(detail).join(', ') || '—'}
                            </Box>
                        </Box>

                        {detail.canEdit && <Button
                            size="sm"
                            variant={detail.status === 'concluida' ? 'outlined' : 'solid'}
                            color="success"
                            startDecorator={detail.status === 'concluida' ? <MdRadioButtonUnchecked /> : <MdCheckCircle />}
                            onClick={handleToggleStatus}
                        >
                            {detail.status === 'concluida' ? 'Reabrir obra' : 'Marcar como concluída'}
                        </Button>}

                        {detail.ticket && (
                            <Typography level="body-sm" sx={{ mb: 1.5 }}>
                                <strong>Origem:</strong>{' '}
                                <Chip size="sm" sx={{ bgcolor: '#ede7f6', color: '#4527a0' }}>
                                    Ticket #{detail.ticket.ticketNumber}
                                </Chip>{' '}
                                {detail.ticket.title}
                            </Typography>
                        )}

                        <Typography level="title-sm" sx={{ color: '#f57c00' }}>Tarefas efetuadas</Typography>
                        <Typography level="body-sm" sx={{ color: '#444', mb: 1.5, whiteSpace: 'pre-wrap' }}>{detail.tasks}</Typography>

                        <Typography level="title-sm" sx={{ color: '#f57c00' }}>Materiais aplicados</Typography>
                        <Typography level="body-sm" sx={{ color: '#444', mb: 1.5, whiteSpace: 'pre-wrap' }}>{detail.materials}</Typography>

                        {detail.notes && <>
                            <Typography level="title-sm" sx={{ color: '#f57c00' }}>Observações</Typography>
                            <Typography level="body-sm" sx={{ color: '#444', mb: 1.5, whiteSpace: 'pre-wrap' }}>{detail.notes}</Typography>
                        </>}

                        <Divider sx={{ my: 1.5 }} />

                        {/* Documentos */}
                        <Typography level="title-sm" sx={{ color: '#f57c00', mb: 1 }}>
                            Documentos (orçamento e esquemas)
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                            {docsOf(detail).length === 0
                                ? <Typography level="body-sm" sx={{ color: '#999' }}>Sem documentos.</Typography>
                                : docsOf(detail).map(d => (
                                    <Box key={d.id} sx={{
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        bgcolor: '#f9f9f9', borderRadius: 'sm', px: 1.5, py: 0.75,
                                    }}>
                                        <Typography level="body-sm" sx={{ flex: 1, wordBreak: 'break-all' }}>
                                            {d.originalName}
                                        </Typography>
                                        <IconButton size="sm" variant="plain" title="Descarregar" onClick={() => handleDownloadDoc(d)}>
                                            <MdDownload />
                                        </IconButton>
                                        {detail.canEdit && (
                                            <IconButton size="sm" variant="plain" color="danger" title="Eliminar" onClick={() => handleDeleteDoc(d.id)}>
                                                <MdDelete />
                                            </IconButton>
                                        )}
                                    </Box>
                                ))
                            }
                        </Box>
                        {detail.canEdit && <Button
                            component="label" size="sm" variant="outlined" color="neutral"
                            startDecorator={<MdUploadFile />} loading={uploading}
                        >
                            Carregar documento
                            <input
                                type="file" hidden multiple
                                onChange={e => { handleUpload(e.target.files, 'documento'); e.target.value = ''; }}
                            />
                        </Button>}

                        <Divider sx={{ my: 1.5 }} />

                        {/* Fotos */}
                        <Typography level="title-sm" sx={{ color: '#f57c00', mb: 1 }}>
                            Fotos do trabalho
                        </Typography>
                        {photosOf(detail).length === 0 ? (
                            <Typography level="body-sm" sx={{ color: '#999', mb: 1 }}>Sem fotos.</Typography>
                        ) : (
                            <Box sx={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                gap: 1, mb: 1,
                            }}>
                                {photosOf(detail).map((p, i) => (
                                    <Box key={p.id}>
                                        <Box sx={{ position: 'relative' }}>
                                        <PhotoThumb
                                            obraId={detail.id}
                                            photo={p}
                                            onReady={registerPhotoUrl}
                                            onOpen={() => setViewerIndex(i)}
                                        />
                                        {detail.canEdit && (
                                            <IconButton
                                                size="sm" variant="solid" color="danger" title="Eliminar foto"
                                                onClick={() => handleDeleteDoc(p.id)}
                                                sx={{ position: 'absolute', top: 4, right: 4, minHeight: 24, minWidth: 24 }}
                                            >
                                                <MdDelete />
                                            </IconButton>
                                        )}
                                        </Box>
                                        {/* A legenda é o que dá sentido à foto no
                                            relatório; fica logo por baixo dela. */}
                                        <Typography
                                            level="body-xs"
                                            onClick={detail.canEdit
                                                ? () => setCaptionEdit({ id: p.id, value: p.caption ?? '' })
                                                : undefined}
                                            sx={{
                                                mt: 0.5, lineHeight: 1.3,
                                                color: p.caption ? '#555' : '#bbb',
                                                cursor: detail.canEdit ? 'pointer' : 'default',
                                                '&:hover': detail.canEdit ? { color: '#f57c00' } : undefined,
                                            }}
                                        >
                                            {p.caption || (detail.canEdit ? '+ legenda' : '')}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                        {detail.canEdit && <Button
                            component="label" size="sm" variant="outlined" color="neutral"
                            startDecorator={<MdAddAPhoto />} loading={uploading}
                        >
                            Carregar fotos
                            <input
                                type="file" hidden multiple accept="image/*"
                                onChange={e => { handleUpload(e.target.files, 'foto'); e.target.value = ''; }}
                            />
                        </Button>}

                        <Divider sx={{ my: 1.5 }} />

                        {/* Assinatura */}
                        <Typography level="title-sm" sx={{ color: '#f57c00', mb: 1 }}>Assinatura do cliente</Typography>
                        {detail.signatureData && !signing ? (
                            <Box>
                                <Box
                                    component="img"
                                    src={detail.signatureData}
                                    alt="Assinatura do cliente"
                                    sx={{ maxWidth: 280, border: '1px solid #e0e0e0', borderRadius: 'sm', display: 'block' }}
                                />
                                <Typography level="body-xs" sx={{ color: '#666', mt: 0.5 }}>
                                    {detail.signedByName} — {new Date(detail.signedAt).toLocaleString('pt-PT')}
                                </Typography>
                                {/* A assinatura não se refaz: uma vez recolhida é definitiva.
                                    Se estiver errada, só um administrador a pode remover — e
                                    depois disso pode ser recolhida de novo. */}
                                {detail.canDelete && (
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <Button size="sm" variant="outlined" color="danger" onClick={handleRemoveSignature}>
                                            Remover assinatura
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        ) : signing ? (
                            <Box>
                                <FormControl size="sm" sx={{ mb: 1 }}>
                                    <FormLabel>Nome de quem assina</FormLabel>
                                    <Input
                                        value={signerName}
                                        onChange={e => setSignerName(e.target.value)}
                                        placeholder="Nome do responsável do cliente"
                                    />
                                </FormControl>
                                <SignaturePad
                                    onConfirm={handleSaveSignature}
                                    onCancel={() => { setSigning(false); setSignerName(''); }}
                                />
                            </Box>
                        ) : (
                            <Box>
                                <Typography level="body-sm" sx={{ color: '#999', mb: 1 }}>Ainda por assinar.</Typography>
                                {detail.canEdit && (
                                    <Button size="sm" color="warning" startDecorator={<MdDraw />} onClick={() => setSigning(true)}>
                                        Recolher assinatura
                                    </Button>
                                )}
                            </Box>
                        )}

                        <Divider sx={{ my: 1.5 }} />

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <Button size="sm" variant="outlined" color="neutral" startDecorator={<MdPictureAsPdf />}
                                loading={pdfLoading} onClick={() => handleDownloadPDF(detail)}>
                                Descarregar PDF
                            </Button>
                            {detail.canEdit && (
                                <Button size="sm" color="warning" startDecorator={<MdEmail />}
                                    onClick={() => openEmailModal(detail)}>
                                    Enviar por email
                                </Button>
                            )}
                        </Box>
                    </>}
                </ModalDialog>
            </Modal>

            {/* Modal enviar email */}
            <Modal open={!!emailModal} onClose={() => setEmailModal(null)}>
                <ModalDialog sx={{ maxWidth: 460, width: '95%' }}>
                    <ModalClose />
                    <Typography level="h4" sx={{ color: '#f57c00', mb: 1 }}>Enviar Relatório</Typography>
                    <Divider sx={{ mb: 2 }} />
                    {emailModal && !emailModal.signatureData && (
                        <Typography level="body-xs" sx={{ color: '#e65100', mb: 1.5 }}>
                            Atenção: esta obra ainda não está assinada pelo cliente.
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <FormControl size="sm">
                            <FormLabel>Email do cliente</FormLabel>
                            <Input
                                type="email" placeholder="cliente@exemplo.pt"
                                value={emailForm.clientEmail}
                                onChange={e => setEmailForm(p => ({ ...p, clientEmail: e.target.value }))}
                            />
                        </FormControl>
                        <Checkbox
                            size="sm"
                            label="Enviar também para a empresa"
                            checked={emailForm.sendToCompany}
                            onChange={e => setEmailForm(p => ({ ...p, sendToCompany: e.target.checked }))}
                        />
                        {photosOf(emailModal).length > 0 && (
                            <Checkbox
                                size="sm"
                                label={`Incluir registo fotográfico (${photosOf(emailModal).length} foto(s))`}
                                checked={emailForm.includePhotos}
                                onChange={e => setEmailForm(p => ({ ...p, includePhotos: e.target.checked }))}
                            />
                        )}
                        <FormControl size="sm">
                            <FormLabel>Mensagem (opcional)</FormLabel>
                            <Textarea
                                minRows={3}
                                value={emailForm.message}
                                onChange={e => setEmailForm(p => ({ ...p, message: e.target.value }))}
                            />
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                            <Button variant="plain" color="neutral" onClick={() => setEmailModal(null)}>Cancelar</Button>
                            <Button color="warning" loading={emailLoading} onClick={handleSendEmail}>Enviar</Button>
                        </Box>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* Legenda de uma foto */}
            <Modal open={!!captionEdit} onClose={() => setCaptionEdit(null)}>
                <ModalDialog sx={{ maxWidth: 460, width: '92%' }}>
                    <ModalClose />
                    <DialogTitle>Legenda da foto</DialogTitle>
                    <DialogContent>
                        <FormControl size="sm" sx={{ mt: 1 }}>
                            <FormLabel>O que se vê nesta foto</FormLabel>
                            <Textarea
                                minRows={2}
                                autoFocus
                                value={captionEdit?.value ?? ''}
                                onChange={e => setCaptionEdit(c => ({ ...c, value: e.target.value }))}
                            />
                            <Typography level="body-xs" sx={{ color: '#999', mt: 0.5 }}>
                                Aparece por baixo da foto no relatório. Deixe vazio para a remover.
                            </Typography>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button color="warning" onClick={handleSaveCaption}>Guardar</Button>
                        <Button variant="plain" onClick={() => setCaptionEdit(null)}>Cancelar</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>

            {/* Visualizador de fotos em ecrã inteiro */}
            {viewerIndex !== null && photosOf(detail).length > 0 && (
                <PhotoLightbox
                    photos={photosOf(detail)}
                    urls={photoUrls}
                    index={Math.min(viewerIndex, photosOf(detail).length - 1)}
                    onIndex={setViewerIndex}
                    onClose={() => setViewerIndex(null)}
                />
            )}

            {/* Incluir fotos no relatório? */}
            <Modal open={!!photoPrompt} onClose={() => setPhotoPrompt(null)}>
                <ModalDialog variant="outlined" sx={{ maxWidth: 420 }}>
                    <DialogTitle>Registo fotográfico</DialogTitle>
                    <Divider />
                    <DialogContent>
                        Esta obra tem {photoPrompt?.photoCount} foto(s).
                        Quer incluir o registo fotográfico no relatório?
                    </DialogContent>
                    <DialogActions>
                        <Button variant="solid" color="warning" onClick={() => generateWithPhotos(true)}>
                            Sim, incluir
                        </Button>
                        <Button variant="outlined" color="neutral" onClick={() => generateWithPhotos(false)}>
                            Não
                        </Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>

            {/* Confirmação de eliminação */}
            <Modal open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle>Confirmar eliminação</DialogTitle>
                    <Divider />
                    <DialogContent>
                        Tem a certeza que pretende eliminar esta obra? Os documentos associados também
                        serão apagados. Esta ação não pode ser revertida.
                    </DialogContent>
                    <DialogActions>
                        <Button variant="solid" color="danger" onClick={handleDelete}>Eliminar</Button>
                        <Button variant="plain" color="neutral" onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancelar</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        </Box>
    );
}
