import axios from 'axios';

/**
 * URL da API, num sítio só. Quem precisar do endereço em bruto (para `fetch`
 * direto de ficheiros, por exemplo) importa daqui em vez de repetir o valor —
 * antes estava escrito em três ficheiros, e um deles ficou sem alternativa,
 * gerando pedidos para "undefined/..." sempre que a variável não estava definida.
 */
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.emg.pt';

const api = axios.create({
    baseURL: API_URL,
});

export default api;
