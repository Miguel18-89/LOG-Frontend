import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const DocumentUpload = ({ storeId, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [currentLoggedUser, setCurrentLoggedUser] = useState({});
  const fileInputRef = useRef(null); // referência ao input

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentLoggedUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Seleciona um ficheiro.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaded_by', currentLoggedUser.id);
    formData.append('store_id', storeId);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // limpar input e state
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess();
      toast.success('Documento carregado com sucesso!');
    } catch (err) {
      console.error('Erro ao carregar documento:', err);
      toast.error('Erro ao carregar documento.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Ficheiro PDF:
        <input
          type="file"
          accept=".pdf"
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files[0])}
        />
      </label>
      <button type="submit">Carregar Documento</button>
    </form>
  );
};

export default DocumentUpload;