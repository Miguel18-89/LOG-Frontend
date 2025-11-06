import React from 'react';
import api from '../services/api';
import IconButton from '@mui/joy/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/joy/Tooltip';
import { toast } from 'react-toastify';
import { showConfirmationToast } from '../utils/showConfirmationToast';

const StoreDocuments = ({ documents, isEditing, onDeleteSuccess }) => {

    const handleDownload = async (id, filename) => {
        try {
            const res = await api.get(`/documents/view/${id}`, {
                responseType: 'blob' 
            });

            const contentType = res.headers['content-type'] || '';
            const blob = new Blob([res.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'download';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            const status = err.response?.status;
            if (status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                toast.warn('Sessão inválida. Por favor, inicie sessão novamente.');
                if (typeof onUnauthorized === 'function') onUnauthorized();
                return;
            }
            console.error('Erro ao descarregar documento:', err);
            toast.error('Erro ao descarregar o documento');
        }
    };

    const handleDelete = async (id) => {
        showConfirmationToast({
            message: 'Eliminar este documento?',
            onConfirm: async () => {
                try {
                    await api.delete(`/documents/${id}`);
                    onDeleteSuccess();
                    toast.success("Documento apagado com sucesso");
                } catch (err) {
                    console.error("Erro ao apagar documento:", err);
                    toast.error("Erro ao apagar documento");
                }
            }
        });
    };

    return (
        <div>
            <h3>Documentos da Loja</h3>

            {documents.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#666' }}>
                    Loja sem documentos adicionados
                </p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {documents.map(doc => (
                        <li
                            key={doc.id}
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                        >
                            <span>{doc.originalName}</span>
                            {!isEditing ? (
                                <Tooltip title="Descarregar">
                                    <IconButton
                                        onClick={() => handleDownload(doc.id, doc.originalName)}
                                        color="neutral"
                                    >
                                        <DownloadIcon />
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <Tooltip title="Apagar">
                                    <IconButton
                                        onClick={() => handleDelete(doc.id)}
                                        color="neutral"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default StoreDocuments;