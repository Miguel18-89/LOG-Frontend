import { useState, useEffect, useCallback } from 'react';
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
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import {
    MdEdit, MdDelete, MdVisibility, MdSend,
    MdLink, MdLinkOff, MdWarningAmber, MdAddCircleOutline,
} from 'react-icons/md';
import { toast } from 'react-toastify';
import api from '../services/api';
import AttachmentsSection from './AttachmentsSection';
import {
    RecordCard, CardHeader, CardField, CardChips, CardActions,
} from './RecordCards';
import { useIsPhone } from '../hooks/useIsPhone';
import { fmtDate } from '../utils/obraReport';
import {
    TICKET_TYPES, TICKET_PRIORITIES, TICKET_STATUSES,
    TYPE_COLORS, PRIORITY_COLORS, STATUS_COLORS,
    ticketTypeLabel, ticketPriorityLabel, ticketStatusLabel,
    describeEntry, fmtDateTime, isOverdue, needsAttention, daysOpen,
    emptyTicketForm, ticketToForm,
} from '../utils/tickets';

/** Etiqueta colorida, no mesmo estilo que as Obras já usam. */
function Tag({ colors, children }) {
    return (
        <Box sx={{
            display: 'inline-block', px: 1, py: 0.25, borderRadius: 'sm',
            fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap',
            bgcolor: colors?.bg, color: colors?.color,
        }}>
            {children}
        </Box>
    );
}

/**
 * Lista de tickets. Serve as duas rotas: a principal, com os que estao por
 * fechar, e a dos fechados. E o mesmo ecra com o mesmo detalhe, filtros e
 * paginacao -- duplica-lo para mudar um filtro era garantir que as duas copias
 * divergiam a primeira correcao.
 */
export default function Tickets({ apenasFechados = false }) {
    const navigate = useNavigate();
    const routerLocation = useLocation();
    const isPhone = useIsPhone();
    // Em ecra estreito os filtros ocupavam meio ecra antes de se ver um ticket.
    const [showFilters, setShowFilters] = useState(false);
    const [records, setRecords] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);

    const [filterSearch, setFilterSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [onlyMine, setOnlyMine] = useState(false);
    const [onlyOpen, setOnlyOpen] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [openForm, setOpenForm] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyTicketForm);
    const [formLoading, setFormLoading] = useState(false);

    const [detail, setDetail] = useState(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Listas para ligar obras e RMAs, carregadas só quando são precisas.
    const [linkOpen, setLinkOpen] = useState(null); // 'obra' | 'rma' | null
    const [linkOptions, setLinkOptions] = useState([]);
    const [linkChoice, setLinkChoice] = useState('');

    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
    // Os ultimos fechados, so na pagina principal e sem filtros.
    const [recentClosed, setRecentClosed] = useState([]);

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/emg/tickets', {
                params: {
                    page, pageSize,
                    search: appliedSearch || undefined,
                    type: filterType || undefined,
                    status: apenasFechados ? 'fechado' : (filterStatus || undefined),
                    // A lista principal esconde os fechados; eles tem pagina propria.
                    hideClosed: apenasFechados ? undefined : 'true',
                    priority: filterPriority || undefined,
                    mine: onlyMine ? 'true' : undefined,
                    open: onlyOpen ? 'true' : undefined,
                    from: dateFrom || undefined,
                    to: dateTo || undefined,
                },
            });
            setRecords(res.data.data);
            setTotal(res.data.total);
        } catch {
            toast.error('Erro ao carregar tickets.');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, appliedSearch, filterType, filterStatus, filterPriority,
        onlyMine, onlyOpen, dateFrom, dateTo, apenasFechados]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    useEffect(() => {
        // Endpoint reduzido (só id e nome): o /users devolve dados de conta e está
        // limitado a administradores, pelo que um colaborador não conseguiria
        // atribuir um ticket a um colega.
        api.get('/emg/tickets/utilizadores')
            .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
            .catch(() => setUsers([]));
    }, []);

    // Os ultimos fechados sao um atalho de leitura, nao uma lista de trabalho:
    // por isso ignoram os filtros e vivem so na pagina principal.
    const fetchRecentClosed = useCallback(async () => {
        if (apenasFechados) return;
        try {
            const res = await api.get('/emg/tickets', {
                params: { page: 1, pageSize: 10, status: 'fechado' },
            });
            setRecentClosed(res.data.data ?? []);
        } catch {
            setRecentClosed([]);
        }
    }, [apenasFechados]);

    useEffect(() => { fetchRecentClosed(); }, [fetchRecentClosed]);

    // Chegada a partir de uma obra ou de um RMA, a pedir este ticket.
    useEffect(() => {
        const abrir = routerLocation.state?.abrirTicket;
        if (!abrir) return;
        navigate(routerLocation.pathname, { replace: true, state: null });
        api.get(`/emg/tickets/${abrir}`)
            .then(res => setDetail(res.data))
            .catch(() => toast.error('Não foi possível abrir esse ticket.'));
    }, [routerLocation.state, routerLocation.pathname, navigate]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    function handleFilter() {
        setAppliedSearch(filterSearch.trim());
        setPage(1);
    }

    function clearFilters() {
        setFilterSearch('');
        setAppliedSearch('');
        setFilterType('');
        setFilterStatus('');
        setFilterPriority('');
        setOnlyMine(false);
        setOnlyOpen(false);
        setDateFrom('');
        setDateTo('');
        setPage(1);
    }

    function openCreate() {
        setIsEdit(false);
        setEditId(null);
        setForm({ ...emptyTicketForm });
        setOpenForm(true);
    }

    function openEdit(t) {
        setIsEdit(true);
        setEditId(t.id);
        setForm(ticketToForm(t));
        setOpenForm(true);
    }

    async function refreshDetail(id) {
        const res = await api.get(`/emg/tickets/${id}`);
        setDetail(res.data);
        return res.data;
    }

    async function openDetail(t) {
        try {
            setMessage('');
            setLinkOpen(null);
            await refreshDetail(t.id);
        } catch {
            toast.error('Erro ao carregar o detalhe.');
        }
    }

    async function handleSubmit() {
        if (!form.title.trim() || !form.description.trim()) {
            toast.error('Assunto e descrição são obrigatórios.');
            return;
        }
        setFormLoading(true);
        try {
            // O estado só se envia na edição: na criação é o servidor que decide
            // entre aberto e atribuído, conforme tenha ou não responsável.
            const payload = { ...form };
            if (!isEdit) delete payload.status;

            if (isEdit) {
                await api.put(`/emg/tickets/${editId}`, payload);
                toast.success('Ticket atualizado.');
                if (detail?.id === editId) await refreshDetail(editId);
            } else {
                await api.post('/emg/tickets', payload);
                toast.success('Ticket aberto.');
            }
            setOpenForm(false);
            fetchRecords();
            fetchRecentClosed();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao guardar.');
        } finally {
            setFormLoading(false);
        }
    }

    /** Alterações rápidas a partir do detalhe, sem abrir o formulário. */
    async function patchDetail(fields, successMsg) {
        try {
            await api.put(`/emg/tickets/${detail.id}`, fields);
            await refreshDetail(detail.id);
            fetchRecords();
            fetchRecentClosed();
            if (successMsg) toast.success(successMsg);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao atualizar.');
        }
    }

    async function handleDelete() {
        try {
            await api.delete(`/emg/tickets/${deleteConfirm.id}`);
            toast.success('Ticket eliminado.');
            if (detail?.id === deleteConfirm.id) setDetail(null);
            fetchRecords();
            fetchRecentClosed();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao eliminar.');
        } finally {
            setDeleteConfirm({ open: false, id: null });
        }
    }

    async function handleDeleteMessage(entryId) {
        try {
            const res = await api.delete(`/emg/tickets/${detail.id}/mensagens/${entryId}`);
            setDetail(res.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao eliminar a mensagem.');
        }
    }

    async function handleSendMessage() {
        if (!message.trim()) return;
        setSending(true);
        try {
            await api.post(`/emg/tickets/${detail.id}/mensagens`, { message: message.trim() });
            setMessage('');
            await refreshDetail(detail.id);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao enviar a mensagem.');
        } finally {
            setSending(false);
        }
    }

    /** Carrega as obras ou os RMAs que se podem ligar a este ticket. */
    async function openLink(kind) {
        setLinkChoice('');
        setLinkOpen(kind);
        try {
            const url = kind === 'obra' ? '/emg/obras' : '/emg/rma';
            const res = await api.get(url, { params: { pageSize: 100 } });
            setLinkOptions(res.data.data ?? []);
        } catch {
            toast.error('Erro ao carregar a lista.');
            setLinkOptions([]);
        }
    }

    /**
     * Abre o formulário de nova obra já preenchido com o que o pedido tem, e com
     * a ligação ao ticket. Reaproveita o formulário das Obras em vez de repetir
     * aqui um mais pobre: a obra precisa de técnicos, documentos e assinatura.
     */
    function handleCreateWorkOrder() {
        navigate('/EMG/Obras', {
            state: {
                novaObra: {
                    client: detail.client ?? '',
                    obra: detail.location ?? '',
                    ticket_id: detail.id,
                    ticketNumber: detail.ticketNumber,
                },
            },
        });
    }

    async function handleLink() {
        if (!linkChoice) return;
        try {
            const url = `/emg/tickets/${detail.id}/${linkOpen === 'obra' ? 'obras' : 'rmas'}`;
            const body = linkOpen === 'obra' ? { workOrderId: linkChoice } : { rmaId: linkChoice };
            const res = await api.post(url, body);
            setDetail(res.data);
            setLinkOpen(null);
            toast.success(linkOpen === 'obra' ? 'Obra ligada.' : 'RMA ligado.');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao ligar.');
        }
    }

    async function handleUnlink(kind, id) {
        try {
            const res = await api.delete(`/emg/tickets/${detail.id}/${kind === 'obra' ? 'obras' : 'rmas'}/${id}`);
            setDetail(res.data);
            toast.success(kind === 'obra' ? 'Obra desligada.' : 'RMA desligado.');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao desligar.');
        }
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography level="h3" sx={{ fontWeight: 'bold', color: '#444', mb: 2 }}>
                {apenasFechados ? 'Tickets Fechados' : 'Tickets'}
            </Typography>

            {/* Filtros */}
            {isPhone && (
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                    <Button size="sm" variant="outlined" sx={{ flex: 1 }}
                        onClick={() => setShowFilters(v => !v)}>
                        {showFilters ? 'Esconder filtros' : 'Filtros e pesquisa'}
                    </Button>
                    {!apenasFechados && (
                        <Button size="sm" color="warning" onClick={openCreate}>+ Novo</Button>
                    )}
                </Box>
            )}
            <Box className="filtros" sx={{
                display: isPhone && !showFilters ? 'none' : 'flex',
                gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-end', mb: 2,
            }}>
                <FormControl size="sm">
                    <FormLabel>Pesquisar</FormLabel>
                    <Input
                        placeholder="Assunto, cliente ou descrição..."
                        value={filterSearch}
                        onChange={e => setFilterSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleFilter()}
                        sx={{ minWidth: 220 }}
                    />
                </FormControl>
                <FormControl size="sm">
                    <FormLabel>Tipo</FormLabel>
                    <Select value={filterType} onChange={(_, v) => { setFilterType(v ?? ''); setPage(1); }} sx={{ minWidth: 150 }}>
                        <Option value="">Todos</Option>
                        {TICKET_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                    </Select>
                </FormControl>
                {!apenasFechados && (
                    <FormControl size="sm">
                        <FormLabel>Estado</FormLabel>
                        <Select value={filterStatus} onChange={(_, v) => { setFilterStatus(v ?? ''); setPage(1); }} sx={{ minWidth: 150 }}>
                            <Option value="">Todos</Option>
                            {TICKET_STATUSES.filter(s => s.value !== 'fechado')
                                .map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                        </Select>
                    </FormControl>
                )}
                <FormControl size="sm">
                    <FormLabel>Prioridade</FormLabel>
                    <Select value={filterPriority} onChange={(_, v) => { setFilterPriority(v ?? ''); setPage(1); }} sx={{ minWidth: 140 }}>
                        <Option value="">Todas</Option>
                        {TICKET_PRIORITIES.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
                    </Select>
                </FormControl>
                <FormControl size="sm">
                    <FormLabel>De</FormLabel>
                    <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
                </FormControl>
                <FormControl size="sm">
                    <FormLabel>Até</FormLabel>
                    <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
                </FormControl>
                <Button size="sm" onClick={handleFilter}>Filtrar</Button>
                <Button
                    size="sm" color="primary"
                    variant={onlyMine ? 'solid' : 'outlined'}
                    onClick={() => { setOnlyMine(v => !v); setPage(1); }}
                >
                    Os meus
                </Button>
                {!apenasFechados && (
                    <Button
                        size="sm" color="warning"
                        variant={onlyOpen ? 'solid' : 'outlined'}
                        onClick={() => { setOnlyOpen(v => !v); setPage(1); }}
                    >
                        Só por atribuir
                    </Button>
                )}
                <Button size="sm" variant="outlined" onClick={clearFilters}>Limpar</Button>
                <Box sx={{ ml: 'auto' }}>
                    {!apenasFechados && (
                        <Button size="sm" color="warning" onClick={openCreate}>+ Novo Ticket</Button>
                    )}
                </Box>
            </Box>

            {/* Tabela, em ecra largo */}
            <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'auto', display: isPhone ? 'none' : 'block' }}>
                <Table borderAxis="xBetween" size="sm" sx={{ minWidth: 1000 }}>
                    <thead>
                        <tr>
                            <th style={{ width: 70 }}>Ticket #</th>
                            <th style={{ width: 110 }}>Tipo</th>
                            <th>Assunto</th>
                            <th>Cliente</th>
                            <th style={{ width: 100 }}>Prioridade</th>
                            <th style={{ width: 110 }}>Estado</th>
                            <th style={{ width: 140 }}>Responsável</th>
                            <th style={{ width: 110 }}>Data limite</th>
                            <th style={{ width: 80 }}>Aberto há</th>
                            <th style={{ width: 110, textAlign: 'center' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>A carregar...</td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                {apenasFechados ? 'Sem tickets fechados.' : 'Nada por fechar.'}
                            </td></tr>
                        ) : records.map(r => (
                            // Vermelho quando o ticket ja passou do prazo da sua
                            // prioridade sem ser fechado.
                            <tr key={r.id} style={needsAttention(r) ? { backgroundColor: '#ffebee' } : undefined}>
                                <td style={{ fontWeight: 'bold', color: '#f57c00' }}>#{r.ticketNumber}</td>
                                <td><Tag colors={TYPE_COLORS[r.type]}>{ticketTypeLabel(r.type)}</Tag></td>
                                <td>{r.title}</td>
                                <td>{r.client || '—'}</td>
                                <td><Tag colors={PRIORITY_COLORS[r.priority]}>{ticketPriorityLabel(r.priority)}</Tag></td>
                                <td><Tag colors={STATUS_COLORS[r.status]}>{ticketStatusLabel(r.status)}</Tag></td>
                                <td style={{ fontSize: '0.85rem' }}>{r.assignee?.name ?? <span style={{ color: '#c62828' }}>Por atribuir</span>}</td>
                                <td style={{ fontSize: '0.85rem' }}>
                                    {r.dueDate ? (
                                        <span style={isOverdue(r) ? { color: '#c62828', fontWeight: 'bold' } : undefined}>
                                            {isOverdue(r) && <MdWarningAmber style={{ verticalAlign: '-2px', marginRight: 2 }} />}
                                            {fmtDate(r.dueDate)}
                                        </span>
                                    ) : '—'}
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>
                                    {r.status === 'fechado'
                                        ? '—'
                                        : <span style={needsAttention(r) ? { color: '#c62828', fontWeight: 'bold' } : undefined}>
                                            {daysOpen(r)} dia(s)
                                        </span>}
                                </td>
                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    <IconButton size="sm" variant="plain" title="Ver" onClick={() => openDetail(r)}><MdVisibility /></IconButton>
                                    <IconButton size="sm" variant="plain" title="Editar" onClick={() => openEdit(r)}><MdEdit /></IconButton>
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

            {/* Cartoes, em ecra estreito: a tabela pede 1000px e nao cabe num telemovel */}
            {isPhone && (
                <Box>
                    {loading ? (
                        <Typography level="body-sm" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                            A carregar...
                        </Typography>
                    ) : records.length === 0 ? (
                        <Typography level="body-sm" sx={{ color: '#999', textAlign: 'center', py: 4 }}>
                            {apenasFechados ? 'Sem tickets fechados.' : 'Nada por fechar.'}
                        </Typography>
                    ) : records.map(r => (
                        <RecordCard key={r.id} highlight={needsAttention(r)} onClick={() => openDetail(r)}>
                            <CardHeader
                                left={`#${r.ticketNumber}`}
                                right={r.status === 'fechado'
                                    ? (r.closedAt ? `fechado ${fmtDate(r.closedAt)}` : 'fechado')
                                    : `${daysOpen(r)} dia(s)`}
                            />
                            <Typography level="title-sm">{r.title}</Typography>
                            <CardField label="Cliente">{r.client}</CardField>
                            <CardField label="Responsável">
                                {r.assignee?.name ?? <span style={{ color: '#c62828' }}>Por atribuir</span>}
                            </CardField>
                            {r.dueDate && (
                                <CardField label="Data limite">
                                    <span style={isOverdue(r) ? { color: '#c62828', fontWeight: 'bold' } : undefined}>
                                        {fmtDate(r.dueDate)}
                                    </span>
                                </CardField>
                            )}
                            <CardChips>
                                <Tag colors={TYPE_COLORS[r.type]}>{ticketTypeLabel(r.type)}</Tag>
                                <Tag colors={PRIORITY_COLORS[r.priority]}>{ticketPriorityLabel(r.priority)}</Tag>
                                <Tag colors={STATUS_COLORS[r.status]}>{ticketStatusLabel(r.status)}</Tag>
                            </CardChips>
                            <CardActions>
                                <IconButton size="sm" variant="plain" title="Editar"
                                    onClick={e => { e.stopPropagation(); openEdit(r); }}><MdEdit /></IconButton>
                                {r.canDelete && (
                                    <IconButton size="sm" variant="plain" color="danger" title="Eliminar"
                                        onClick={e => { e.stopPropagation(); setDeleteConfirm({ open: true, id: r.id }); }}>
                                        <MdDelete />
                                    </IconButton>
                                )}
                            </CardActions>
                        </RecordCard>
                    ))}
                </Box>
            )}

            {/* Paginação */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Typography level="body-sm" sx={{ color: '#666' }}>
                    {total} ticket(s) — página {page} de {totalPages}
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

            {/* Os ultimos fechados: atalho de leitura, sem filtros nem paginacao */}
            {!apenasFechados && recentClosed.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography level="title-md" sx={{ color: '#444' }}>
                            Últimos fechados
                        </Typography>
                        <Button size="sm" variant="plain" onClick={() => navigate('/EMG/TicketsFechados')}>
                            Ver todos ›
                        </Button>
                    </Box>
                    {isPhone && recentClosed.map(r => (
                        <RecordCard key={r.id} onClick={() => openDetail(r)}>
                            <CardHeader
                                left={`#${r.ticketNumber}`}
                                right={r.closedAt ? fmtDate(r.closedAt) : ''}
                            />
                            <Typography level="title-sm">{r.title}</Typography>
                            <CardField label="Cliente">{r.client}</CardField>
                            <CardField label="Responsável">{r.assignee?.name}</CardField>
                        </RecordCard>
                    ))}
                    <Sheet variant="outlined" sx={{
                        borderRadius: 'sm', overflow: 'auto', display: isPhone ? 'none' : 'block',
                    }}>
                        <Table borderAxis="xBetween" size="sm" sx={{ minWidth: 700 }}>
                            <thead>
                                <tr>
                                    <th style={{ width: 70 }}>Ticket #</th>
                                    <th>Assunto</th>
                                    <th>Cliente</th>
                                    <th style={{ width: 140 }}>Responsável</th>
                                    <th style={{ width: 120 }}>Fechado em</th>
                                    <th style={{ width: 60, textAlign: 'center' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentClosed.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 'bold', color: '#f57c00' }}>#{r.ticketNumber}</td>
                                        <td>{r.title}</td>
                                        <td>{r.client || '—'}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{r.assignee?.name ?? '—'}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{r.closedAt ? fmtDate(r.closedAt) : '—'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <IconButton size="sm" variant="plain" title="Ver"
                                                onClick={() => openDetail(r)}><MdVisibility /></IconButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Sheet>
                </Box>
            )}

            {/* Modal criar / editar */}
            <Modal open={openForm} onClose={() => setOpenForm(false)}>
                <ModalDialog sx={{ maxWidth: 680, width: '95%', overflow: 'auto', maxHeight: '92vh' }}>
                    <ModalClose />
                    <Typography level="h4" sx={{ color: '#f57c00', mb: 1 }}>
                        {isEdit ? 'Editar Ticket' : 'Novo Ticket'}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Tipo</FormLabel>
                                <Select value={form.type} onChange={(_, v) => setForm(p => ({ ...p, type: v ?? 'assistencia' }))}>
                                    {TICKET_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                                </Select>
                            </FormControl>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Prioridade</FormLabel>
                                <Select value={form.priority} onChange={(_, v) => setForm(p => ({ ...p, priority: v ?? 'normal' }))}>
                                    {TICKET_PRIORITIES.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
                                </Select>
                            </FormControl>
                            {isEdit && (
                                <FormControl size="sm" sx={{ flex: 1 }}>
                                    <FormLabel>Estado</FormLabel>
                                    <Select value={form.status} onChange={(_, v) => setForm(p => ({ ...p, status: v ?? 'aberto' }))}>
                                        {TICKET_STATUSES.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>

                        <FormControl size="sm" required>
                            <FormLabel>Assunto</FormLabel>
                            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                        </FormControl>
                        <FormControl size="sm" required>
                            <FormLabel>Descrição</FormLabel>
                            <Textarea minRows={4} value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                        </FormControl>

                        {/* Cliente e local só fazem sentido num pedido de assistência. */}
                        {form.type === 'assistencia' && (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl size="sm" sx={{ flex: 1 }}>
                                    <FormLabel>Cliente</FormLabel>
                                    <Input value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))} />
                                </FormControl>
                                <FormControl size="sm" sx={{ flex: 1 }}>
                                    <FormLabel>Local</FormLabel>
                                    <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                                </FormControl>
                                <FormControl size="sm" sx={{ flex: 1 }}>
                                    <FormLabel>Quem pediu</FormLabel>
                                    <Input value={form.requestedBy} onChange={e => setForm(p => ({ ...p, requestedBy: e.target.value }))} />
                                </FormControl>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Responsável</FormLabel>
                                <Select
                                    value={form.assignee_id}
                                    onChange={(_, v) => setForm(p => ({ ...p, assignee_id: v ?? '' }))}
                                >
                                    <Option value="">Por atribuir</Option>
                                    {users.map(u => <Option key={u.id} value={u.id}>{u.name}</Option>)}
                                </Select>
                            </FormControl>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Data prevista</FormLabel>
                                <Input type="date" value={form.expectedDate}
                                    onChange={e => setForm(p => ({ ...p, expectedDate: e.target.value }))} />
                            </FormControl>
                            <FormControl size="sm" sx={{ flex: 1 }}>
                                <FormLabel>Data limite</FormLabel>
                                <Input type="date" value={form.dueDate}
                                    onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                            </FormControl>
                        </Box>

                        {isEdit && form.status === 'fechado' && (
                            <FormControl size="sm">
                                <FormLabel>Nota de fecho</FormLabel>
                                <Textarea minRows={2} value={form.closingNote}
                                    onChange={e => setForm(p => ({ ...p, closingNote: e.target.value }))} />
                            </FormControl>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="outlined" onClick={() => setOpenForm(false)}>Cancelar</Button>
                        <Button color="warning" loading={formLoading} onClick={handleSubmit}>Guardar</Button>
                    </Box>
                </ModalDialog>
            </Modal>

            {/* Modal de detalhe */}
            <Modal open={!!detail} onClose={() => setDetail(null)}>
                <ModalDialog sx={{ maxWidth: 780, width: '95%', overflow: 'auto', maxHeight: '92vh' }}>
                    <ModalClose />
                    {detail && (
                        <>
                            <Typography level="h4" sx={{ color: '#f57c00' }}>
                                Ticket #{detail.ticketNumber} — {detail.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, mb: 1.5 }}>
                                <Tag colors={TYPE_COLORS[detail.type]}>{ticketTypeLabel(detail.type)}</Tag>
                                <Tag colors={PRIORITY_COLORS[detail.priority]}>{ticketPriorityLabel(detail.priority)}</Tag>
                                <Tag colors={STATUS_COLORS[detail.status]}>{ticketStatusLabel(detail.status)}</Tag>
                            </Box>
                            <Divider sx={{ mb: 1.5 }} />

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 1, mb: 1.5 }}>
                                <Typography level="body-sm"><strong>Aberto por:</strong> {detail.createdBy?.name ?? '—'}</Typography>
                                <Typography level="body-sm"><strong>Em:</strong> {fmtDateTime(detail.created_at)}</Typography>
                                <Typography level="body-sm"><strong>Responsável:</strong> {detail.assignee?.name ?? 'por atribuir'}</Typography>
                                {detail.client && <Typography level="body-sm"><strong>Cliente:</strong> {detail.client}</Typography>}
                                {detail.location && <Typography level="body-sm"><strong>Local:</strong> {detail.location}</Typography>}
                                {detail.requestedBy && <Typography level="body-sm"><strong>Quem pediu:</strong> {detail.requestedBy}</Typography>}
                                {detail.expectedDate && <Typography level="body-sm"><strong>Prevista:</strong> {fmtDate(detail.expectedDate)}</Typography>}
                                {detail.dueDate && (
                                    <Typography level="body-sm" sx={isOverdue(detail) ? { color: '#c62828', fontWeight: 'bold' } : undefined}>
                                        <strong>Data limite:</strong> {fmtDate(detail.dueDate)}{isOverdue(detail) && ' (em atraso)'}
                                    </Typography>
                                )}
                                {detail.closedAt && <Typography level="body-sm"><strong>Fechado em:</strong> {fmtDateTime(detail.closedAt)}</Typography>}
                            </Box>

                            <Typography level="title-sm" sx={{ color: '#f57c00' }}>Descrição</Typography>
                            <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', mb: 1.5 }}>{detail.description}</Typography>
                            {detail.closingNote && (
                                <>
                                    <Typography level="title-sm" sx={{ color: '#f57c00' }}>Nota de fecho</Typography>
                                    <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', mb: 1.5 }}>{detail.closingNote}</Typography>
                                </>
                            )}

                            {/* Atalhos de estado, sem ter de abrir o formulário */}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                                {detail.status !== 'em_curso' && detail.status !== 'fechado' && (
                                    <Button size="sm" variant="outlined" onClick={() => patchDetail({ status: 'em_curso' }, 'Ticket em curso.')}>
                                        Marcar em curso
                                    </Button>
                                )}
                                {detail.status !== 'fechado' && (
                                    <Button size="sm" color="success" variant="outlined"
                                        onClick={() => patchDetail({ status: 'fechado' }, 'Ticket fechado.')}>
                                        Fechar ticket
                                    </Button>
                                )}
                                {detail.status === 'fechado' && (
                                    <Button size="sm" variant="outlined" onClick={() => patchDetail({ status: 'em_curso' }, 'Ticket reaberto.')}>
                                        Reabrir
                                    </Button>
                                )}
                                {!detail.assignee_id && (
                                    <Button size="sm" variant="outlined" onClick={() => openEdit(detail)}>Atribuir</Button>
                                )}
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            {/* Obras e RMAs ligados */}
                            <Typography level="title-sm" sx={{ color: '#f57c00', mb: 1 }}>Trabalho associado</Typography>
                            {(detail.workOrders ?? []).length === 0 && (detail.rmas ?? []).length === 0 && (
                                <Typography level="body-sm" sx={{ color: '#999', mb: 1 }}>
                                    Ainda nada. Ligue a obra ou o RMA que este pedido originou.
                                </Typography>
                            )}
                            {(detail.workOrders ?? []).map(o => (
                                <Box key={o.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    {/* A etiqueta e o link: leva a pagina das Obras
                                        ja com esta obra aberta. */}
                                    <Chip
                                        size="sm"
                                        title="Abrir a obra"
                                        sx={{ bgcolor: '#fff3e0', color: '#e65100', cursor: 'pointer' }}
                                        onClick={() => navigate('/EMG/Obras', { state: { abrirObra: o.id } })}
                                    >
                                        Obra #{o.orderNumber}
                                    </Chip>
                                    <Typography level="body-sm" sx={{ flex: 1 }}>{o.client} — {o.obra} ({fmtDate(o.date)})</Typography>
                                    <IconButton size="sm" variant="plain" color="danger" title="Desligar"
                                        onClick={() => handleUnlink('obra', o.id)}><MdLinkOff /></IconButton>
                                </Box>
                            ))}
                            {(detail.rmas ?? []).map(r => (
                                <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Chip
                                        size="sm"
                                        title="Abrir o RMA"
                                        sx={{ bgcolor: '#e3f2fd', color: '#1565c0', cursor: 'pointer' }}
                                        onClick={() => navigate('/EMG/Assistencia', { state: { abrirRma: r.id } })}
                                    >
                                        RMA #{r.rmaNumber}
                                    </Chip>
                                    <Typography level="body-sm" sx={{ flex: 1 }}>{r.brand} {r.model}</Typography>
                                    <IconButton size="sm" variant="plain" color="danger" title="Desligar"
                                        onClick={() => handleUnlink('rma', r.id)}><MdLinkOff /></IconButton>
                                </Box>
                            ))}
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                <Button size="sm" color="warning" startDecorator={<MdAddCircleOutline />}
                                    onClick={handleCreateWorkOrder}>
                                    Criar obra
                                </Button>
                                <Button size="sm" variant="outlined" startDecorator={<MdLink />} onClick={() => openLink('rma')}>
                                    Ligar RMA
                                </Button>
                                {/* Para o caso de a obra já existir, feita antes de alguém
                                    se lembrar de a ligar ao pedido. */}
                                <Button size="sm" variant="plain" startDecorator={<MdLink />} onClick={() => openLink('obra')}>
                                    Ligar obra existente
                                </Button>
                            </Box>
                            {linkOpen && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                                    <Select
                                        size="sm" placeholder={linkOpen === 'obra' ? 'Escolha a obra...' : 'Escolha o RMA...'}
                                        value={linkChoice} onChange={(_, v) => setLinkChoice(v ?? '')} sx={{ flex: 1 }}
                                    >
                                        {linkOptions.map(o => (
                                            <Option key={o.id} value={o.id}>
                                                {linkOpen === 'obra'
                                                    ? `#${o.orderNumber} — ${o.client} — ${o.obra}`
                                                    : `#${o.rmaNumber} — ${o.brand} ${o.model} (${o.client})`}
                                            </Option>
                                        ))}
                                    </Select>
                                    <Button size="sm" color="warning" disabled={!linkChoice} onClick={handleLink}>Ligar</Button>
                                    <Button size="sm" variant="plain" onClick={() => setLinkOpen(null)}>Cancelar</Button>
                                </Box>
                            )}

                            <Divider sx={{ my: 1.5 }} />

                            {/* Anexos: documentos em lista e fotos em grelha, com legenda */}
                            <AttachmentsSection
                                basePath={`/emg/tickets/${detail.id}`}
                                documents={detail.documents ?? []}
                                onChanged={() => refreshDetail(detail.id)}
                            />

                            <Divider sx={{ my: 1.5 }} />

                            {/* Linha de tempo */}
                            <Typography level="title-sm" sx={{ color: '#f57c00', mb: 1 }}>Histórico</Typography>
                            <Box sx={{ pr: 1 }}>
                                <Box sx={{ mb: 1 }}>
                                    <Typography level="body-xs" sx={{ color: '#888' }}>
                                        {fmtDateTime(detail.created_at)} · {detail.createdBy?.name ?? '—'}
                                    </Typography>
                                    <Typography level="body-sm">abriu o ticket</Typography>
                                </Box>
                                {(detail.entries ?? []).map(e => (
                                    <Box key={e.id} sx={{ mb: 1 }}>
                                        <Typography level="body-xs" sx={{ color: '#888' }}>
                                            {fmtDateTime(e.created_at)} · {e.createdBy?.name ?? '—'}
                                        </Typography>
                                        {e.kind === 'mensagem' ? (
                                            <Box sx={{
                                                display: 'flex', alignItems: 'flex-start', gap: 0.5,
                                                bgcolor: '#f7f7f7', borderRadius: 'sm', p: 1,
                                                borderLeft: '3px solid #f57c00',
                                            }}>
                                                <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', flex: 1 }}>
                                                    {e.message}
                                                </Typography>
                                                {/* So o administrador apaga, e so mensagens: o registo
                                                    de alteracoes e o rasto do que aconteceu. */}
                                                {detail.canDelete && (
                                                    <IconButton
                                                        size="sm" variant="plain" color="danger"
                                                        title="Eliminar mensagem"
                                                        onClick={() => handleDeleteMessage(e.id)}
                                                    >
                                                        <MdDelete />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography level="body-sm" sx={{ color: '#555' }}>{describeEntry(e)}</Typography>
                                        )}
                                    </Box>
                                ))}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'flex-end' }}>
                                <FormControl size="sm" sx={{ flex: 1 }}>
                                    <FormLabel>Escrever mensagem</FormLabel>
                                    <Textarea minRows={2} value={message} onChange={e => setMessage(e.target.value)} />
                                </FormControl>
                                <Button size="sm" color="warning" startDecorator={<MdSend />}
                                    loading={sending} disabled={!message.trim()} onClick={handleSendMessage}>
                                    Enviar
                                </Button>
                            </Box>
                        </>
                    )}
                </ModalDialog>
            </Modal>

            {/* Confirmação de eliminação */}
            <Modal open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
                <ModalDialog variant="outlined" role="alertdialog">
                    <DialogTitle>Eliminar ticket</DialogTitle>
                    <DialogContent>
                        Tem a certeza? O histórico do ticket é eliminado com ele. As obras e os RMAs
                        ligados não são apagados — apenas deixam de apontar para este pedido.
                    </DialogContent>
                    <DialogActions>
                        <Button color="danger" onClick={handleDelete}>Sim, eliminar</Button>
                        <Button variant="plain" onClick={() => setDeleteConfirm({ open: false, id: null })}>Não</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        </Box>
    );
}
