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
import api from '../services/api';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import IconButton from '@mui/joy/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/joy/Tooltip';
import { toast } from 'react-toastify';
import { showConfirmationToast } from '../utils/showConfirmationToast';
import '../styles/StoreComments.css';




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
                        storeId: storeId
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
        <Box className="comments-container">
            <Typography level="title-lg" className="comments-title">
                Comentários
            </Typography>

            {storeComments.length > 0 ? (
                <List className="comments-list">
                    {storeComments.map((comment) => {
                        const isOwnComment = comment.created_by === currentLoggedUser.id;
                        const isEdited = comment.updated === true;
                        const isEditing = editingComment?.id === comment.id;

                        return (
                            <ListItem
                                key={comment.id}
                                className={`comment-item ${isOwnComment ? 'comment-item-own' : 'comment-item-other'}`}
                            >
                                <Box className={`comment-box ${isOwnComment ? 'comment-box-own' : 'comment-box-other'}`}>
                                    <Typography level="body-xs" className="comment-header">
                                        {comment.createdBy.name ?? 'Desconhecido'} —{' '}
                                        {safeFormatDate(comment.created_at)}
                                        {isEdited && ' (editado)'}
                                    </Typography>

                                    {isEditing ? (
                                        <>
                                            <Textarea
                                                className="comment-edit-textarea"
                                                minRows={2}
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Edita o teu comentário..."
                                            />
                                            <Box className="comment-actions">
                                                <Tooltip title="Guardar" placement="top">
                                                    <IconButton size="sm" onClick={handleCommentSubmit}>
                                                        <SaveIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </>
                                    ) : (
                                        <>
                                            <Typography level="body-sm" className="comment-content">
                                                {comment.message}
                                            </Typography>

                                            {isOwnComment && (
                                                <Box className="comment-actions">
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
                                        </>
                                    )}
                                </Box>
                            </ListItem>
                        );
                    })}
                </List>
            ) : (
                <Typography level="body-xs" className="no-comments-message">
                    Nenhum comentário ainda.
                </Typography>
            )}

            <Box className="new-comment-form">
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
