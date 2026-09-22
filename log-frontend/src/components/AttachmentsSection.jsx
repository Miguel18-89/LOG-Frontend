import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import IconButton from '@mui/joy/IconButton';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Textarea from '@mui/joy/Textarea';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import { MdDelete, MdDownload, MdUploadFile, MdAddAPhoto } from 'react-icons/md';
import { toast } from 'react-toastify';
import api from '../services/api';
import PhotoLightbox from './PhotoLightbox';

/**
 * Miniatura de uma foto — o ficheiro precisa de token, por isso vai por axios.
 *
 * O que se descarrega é a foto inteira (o servidor não gera miniaturas), pelo que
 * o URL é entregue a quem chama via `onReady`: o visualizador reaproveita-o e abre
 * de imediato, sem descarregar a mesma imagem uma segunda vez.
 */
function Thumb({ basePath, photo, onReady, onOpen }) {
    const [url, setUrl] = useState(null);
    // Em ref para o descarregamento não recomeçar sempre que o pai redesenha.
    const readyRef = useRef(onReady);
    readyRef.current = onReady;

    useEffect(() => {
        let objectUrl;
        let cancelled = false;
        api.get(`${basePath}/documentos/${photo.id}`, { responseType: 'blob' })
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
    }, [basePath, photo.id]);

    return (
        <Box
            onClick={onOpen}
            title="Ver foto"
            sx={{
                width: '100%', aspectRatio: '1', borderRadius: 'sm', overflow: 'hidden',
                border: '1px solid #e0e0e0', bgcolor: '#fafafa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'zoom-in',
                '&:hover img': { transform: 'scale(1.05)' },
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

/**
 * Anexos de um registo: documentos em lista e fotos em grelha, com legenda.
 *
 * Partilhado entre os tickets e os RMAs, que têm exatamente a mesma necessidade.
 * `basePath` é o prefixo da API do registo (`/emg/tickets/<id>`), e é o que evita
 * ter uma cópia disto por módulo.
 */
export default function AttachmentsSection({ basePath, documents = [], canEdit = true, onChanged }) {
    const [uploading, setUploading] = useState(false);
    const [photoUrls, setPhotoUrls] = useState({});
    const [viewerIndex, setViewerIndex] = useState(null);
    const [captionEdit, setCaptionEdit] = useState(null);

    const docs = documents.filter(d => d.kind !== 'foto');
    const photos = documents.filter(d => d.kind === 'foto');

    const registerPhotoUrl = useCallback((photoId, url) => {
        setPhotoUrls(prev => ({ ...prev, [photoId]: url }));
    }, []);

    // Mudar de registo desmonta as miniaturas, e estas revogam os object URLs que
    // criaram. Guardar os antigos daria imagens em branco ao reabrir.
    useEffect(() => {
        setPhotoUrls({});
        setViewerIndex(null);
    }, [basePath]);

    async function handleUpload(files, kind) {
        const list = Array.from(files ?? []);
        if (list.length === 0) return;
        setUploading(true);
        try {
            for (const file of list) {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('kind', kind);
                await api.post(`${basePath}/documentos`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            await onChanged?.();
            toast.success(kind === 'foto'
                ? `${list.length} foto(s) carregada(s).`
                : `${list.length} ficheiro(s) carregado(s).`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao carregar o ficheiro.');
        } finally {
            setUploading(false);
        }
    }

    async function handleDownload(doc) {
        try {
            const res = await api.get(`${basePath}/documentos/${doc.id}`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.originalName;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Erro ao descarregar o ficheiro.');
        }
    }

    async function handleDelete(docId) {
        try {
            await api.delete(`${basePath}/documentos/${docId}`);
            await onChanged?.();
            toast.success('Anexo eliminado.');
        } catch {
            toast.error('Erro ao eliminar o anexo.');
        }
    }

    async function handleSaveCaption() {
        try {
            await api.put(`${basePath}/documentos/${captionEdit.id}`, { caption: captionEdit.value });
            await onChanged?.();
            setCaptionEdit(null);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao guardar a legenda.');
        }
    }

    return (
        <>
            <Typography level="title-sm" sx={{ color: '#f57c00', mb: 1 }}>Documentos</Typography>
            {docs.length === 0 ? (
                <Typography level="body-sm" sx={{ color: '#999', mb: 1 }}>Sem documentos.</Typography>
            ) : docs.map(d => (
                <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography level="body-sm" sx={{ flex: 1 }}>{d.originalName}</Typography>
                    <IconButton size="sm" variant="plain" title="Descarregar" onClick={() => handleDownload(d)}>
                        <MdDownload />
                    </IconButton>
                    {canEdit && (
                        <IconButton size="sm" variant="plain" color="danger" title="Eliminar"
                            onClick={() => handleDelete(d.id)}><MdDelete /></IconButton>
                    )}
                </Box>
            ))}
            {canEdit && (
                <Button component="label" size="sm" variant="outlined" startDecorator={<MdUploadFile />}
                    loading={uploading} sx={{ mt: 0.5 }}>
                    Carregar documento
                    <input type="file" hidden multiple
                        onChange={e => { handleUpload(e.target.files, 'documento'); e.target.value = ''; }} />
                </Button>
            )}

            <Typography level="title-sm" sx={{ color: '#f57c00', mt: 2, mb: 1 }}>Fotos</Typography>
            {photos.length === 0 ? (
                <Typography level="body-sm" sx={{ color: '#999', mb: 1 }}>Sem fotos.</Typography>
            ) : (
                <Box sx={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 1, mb: 1,
                }}>
                    {photos.map((p, i) => (
                        <Box key={p.id}>
                            <Box sx={{ position: 'relative' }}>
                                <Thumb
                                    basePath={basePath}
                                    photo={p}
                                    onReady={registerPhotoUrl}
                                    onOpen={() => setViewerIndex(i)}
                                />
                                {canEdit && (
                                    <IconButton
                                        size="sm" variant="solid" color="danger" title="Eliminar foto"
                                        onClick={() => handleDelete(p.id)}
                                        sx={{ position: 'absolute', top: 4, right: 4, minHeight: 24, minWidth: 24 }}
                                    >
                                        <MdDelete />
                                    </IconButton>
                                )}
                            </Box>
                            {/* A legenda é o que dá sentido à foto para quem a lê
                                depois; fica logo por baixo dela. */}
                            <Typography
                                level="body-xs"
                                onClick={canEdit
                                    ? () => setCaptionEdit({ id: p.id, value: p.caption ?? '' })
                                    : undefined}
                                sx={{
                                    mt: 0.5, lineHeight: 1.3,
                                    color: p.caption ? '#555' : '#bbb',
                                    cursor: canEdit ? 'pointer' : 'default',
                                    '&:hover': canEdit ? { color: '#f57c00' } : undefined,
                                }}
                            >
                                {p.caption || (canEdit ? '+ legenda' : '')}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}
            {canEdit && (
                <Button component="label" size="sm" variant="outlined" startDecorator={<MdAddAPhoto />}
                    loading={uploading}>
                    Carregar fotos
                    <input type="file" hidden multiple accept="image/*"
                        onChange={e => { handleUpload(e.target.files, 'foto'); e.target.value = ''; }} />
                </Button>
            )}

            {viewerIndex !== null && photos.length > 0 && (
                <PhotoLightbox
                    photos={photos}
                    urls={photoUrls}
                    index={Math.min(viewerIndex, photos.length - 1)}
                    onIndex={setViewerIndex}
                    onClose={() => setViewerIndex(null)}
                />
            )}

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
                                Deixe vazio para a remover.
                            </Typography>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button color="warning" onClick={handleSaveCaption}>Guardar</Button>
                        <Button variant="plain" onClick={() => setCaptionEdit(null)}>Cancelar</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        </>
    );
}
