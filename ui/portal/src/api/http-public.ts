import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "/";

export const httpPublic = axios.create({
  baseURL, // ex.: https://api.qa.ahocultural.com/v1
  withCredentials: false,
});

// Interceptor de resposta: opcional (log/normalização de erro)
httpPublic.interceptors.response.use(
  (resp) => resp,
  (error) => Promise.reject(error)
);
