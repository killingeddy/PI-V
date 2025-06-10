import axios from "axios";

export const api = axios.create({
  baseURL: "https://pi-v-cgf1.onrender.com",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});