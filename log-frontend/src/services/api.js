import axios from 'axios'

const api = axios.create({

    //baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    baseURL: import.meta.env.VITE_API_URL || 'http://213.199.58.233:3000',
})

export default api;