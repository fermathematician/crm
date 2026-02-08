import React from 'react';
import { Navigate } from 'react-router-dom';PrivateRoute
import { jwtDecode } from 'jwt-decode';

interface PrivateRouteProps {
    children: React.ReactNode;
}

interface JWTPayLoad {
    sub: string; // Id
    email: string;
    exp: number; // Data de expiração
}

export function PrivateRoute({ children }: PrivateRouteProps) {
    const token = localStorage.getItem('token');

    if(!token) {
        return <Navigate to="/" />;
    }

    try {
        const decoded = jwtDecode<JWTPayLoad>(token);

        const currentTime = Date.now() / 1000; 

        if (decoded.exp < currentTime) {
            localStorage.removeItem('token');
            alert("Sua sessão expirou. Faça login novamente.");
            return <Navigate to="/" />;
        }

        return children;
    }catch(error) {
        localStorage.removeItem('token');
        return <Navigate to="/" />;
    }
}