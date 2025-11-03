import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    FormControl,
    FormLabel,
    Textarea,
    Button,
    List,
    ListItem,
    ListItemDecorator,
    ListItemContent,
    Avatar,
} from '@mui/joy';
import api from '../services/api'; // ajusta o caminho conforme tua estrutura
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import IconButton from '@mui/joy/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/joy/Tooltip';
import { toast } from 'react-toastify';
import { showConfirmationToast } from '../utils/showConfirmationToast';




export default function StoreComments({ storeId, initialData }) {
    const [newComment, setNewComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false);
    const token = localStorage.getItem('token');
    const [currentLoggedUser, setCurrentLoggedUser] = useState({});
    const [storeComments, setStoreComments] = useState([]);
    const [editingComment, setEditingComment] = useState(null);


    const safeFormatDate = (isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        return isNaN(date.getTime())
            ? ''
            : format(date, "dd/MM/yyyy 'às' HH:mm", { locale: pt });
    };

    const fetchComments = async () => {
        try {
            const res = await api.get('/comments', {
                params: { storeId },
            });
            setStoreComments(res.data);
        } catch (err) {
            console.error('Erro ao carregar comentários:', err);
            toast.info('Não foi possível carregar os comentários.');
        }
    };


    useEffect(() => {
        if (storeId) fetchComments();
    }, [storeId]);


    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentLoggedUser(JSON.parse(storedUser));
        }
    }, []);


    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;
        setIsSubmitting(true);

        try {
            if (editingComment) {
                await api.put(
                    `/comments/${editingComment.id}`,
                    {
                        message: newComment,
                        updated: true,
                        userId: currentLoggedUser.id,
                        storeId:storeId
                    }
                );
            } else {
                await api.post(
                    `/comments`,
                    {
                        message: newComment,
                        userId: currentLoggedUser.id,
                        storeId: storeId
                    }
                );
            }

            setNewComment('');
            setEditingComment(null);
            await fetchComments();
        } catch (err) {
            console.error('Erro ao enviar comentário:', err);
            toast.error('Não foi possível enviar o comentário.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (comment) => {
        setEditingComment(comment);
        setNewComment(comment.message);
    };

    const handleDelete = async (commentId) => {
        showConfirmationToast({
            message: 'Apagar este comentário?',
            onConfirm: async () => {
                try {
                    await api.delete(`/comments/${commentId}`);
                    await fetchComments();
                } catch (err) {
                    console.error('Erro ao apagar comentário:', err);
                    toast.error('Não foi possível apagar o comentário.');
                }
            }
        })
    };


    return (
        <Box sx={{ mt: 6, mx: 'auto', px: 3, maxWidth: 730 }}>
            <Typography level="title-lg" fontWeight="bold" sx={{ color: '#f57c00', textAlign: 'center' }}>
                Comentários
            </Typography>

            {storeComments.length > 0 ? (
                <List sx={{ mt: 2, gap: 2 }}>
                    {storeComments.map((comment) => {
                        const isOwnComment = comment.created_by === currentLoggedUser.id;
                        const isEdited = comment.updated === true;
                        const isEditing = editingComment?.id === comment.id;

                        return (
                            <ListItem
                                key={comment.id}
                                sx={{
                                    display: 'flex',
                                    width: '100%',
                                    justifyContent: isOwnComment ? 'flex-end' : 'flex-start',
                                    px: 0,
                                }}
                            >
                                <Box
                                    sx={{
                                        maxWidth: 500,
                                        minWidth: 300,
                                        width: '100%',
                                        bgcolor: isOwnComment ? 'primary.softBg' : 'neutral.softBg',
                                        px: 2,
                                        py: 1.5,
                                        borderRadius: isOwnComment
                                            ? '8px 8px 0px 8px'
                                            : '8px 8px 8px 0px',
                                        boxShadow: 'sm',
                                        textAlign: isOwnComment ? 'right' : 'left',
                                    }}
                                >
                                    <Typography
                                        level="body-xs"
                                        sx={{
                                            color: 'neutral.500',
                                            textAlign: isOwnComment ? 'right' : 'left',
                                            flex: 1,
                                            fontWeight: "xl"
                                        }}
                                    >
                                        {comment.createdBy.name ?? 'Desconhecido'} —{' '}
                                        {safeFormatDate(comment.created_at)}
                                        {isEdited && ' (editado)'}
                                    </Typography>
                                    {isEditing ? (
                                        <>
                                            <Textarea
                                                minRows={2}
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Edita o teu comentário..."
                                                sx={{
                                                    width: '100%',
                                                    mt: 0.5,
                                                    resize: 'none',
                                                    borderRadius: 'md',
                                                    bgcolor: 'background.surface',
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    alignItems: 'center',
                                                    mt: 1,
                                                    width: '100%',
                                                    textAlign: 'right',
                                                }}
                                            >

                                                <Tooltip title="Guardar" placement="top">
                                                    <IconButton size="sm" onClick={handleCommentSubmit}>
                                                        <SaveIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </>
                                    ) : (
                                        <>
                                            <Typography level="body-sm">{comment.message}</Typography>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    mt: 1,
                                                }}
                                            >

                                                {isOwnComment && (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent: 'flex-end',
                                                            alignItems: 'center',
                                                            mt: 1,
                                                            width: '100%',
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        <Tooltip title="Editar" placement="top">
                                                            <IconButton
                                                                size="sm"
                                                                variant="plain"
                                                                onClick={() => handleEdit(comment)}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Eliminar" placement="top">
                                                            <IconButton
                                                                size="sm"
                                                                variant="plain"
                                                                onClick={() => handleDelete(comment.id)}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}

                                            </Box>
                                        </>
                                    )}
                                </Box>
                            </ListItem>
                        );
                    })}
                </List>

            ) : (
                <Typography level="body-xs" sx={{ mt: 2, color: 'neutral.500' }}>
                    Nenhum comentário ainda.
                </Typography>
            )}

            <Box sx={{ mt: 3 }}>
                <FormControl>
                    <FormLabel>Adicionar comentário</FormLabel>
                    <Textarea
                        minRows={2}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escreve aqui o teu comentário..."
                    />
                </FormControl>
                <Button
                    sx={{ mt: 1 }}
                    size="sm"
                    onClick={handleCommentSubmit}
                    loading={isSubmitting}
                >
                    Enviar comentário
                </Button>
            </Box>
        </Box>
    );
};
