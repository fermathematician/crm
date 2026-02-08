import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
    children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
    // String -> true e null -> false
    const isAuthenticated = !!localStorage.getItem('token');

    // Se o token for autenticado eu retorno children (por enquanto meu dashboard), senão redireciono para a página de login
    return isAuthenticated ? children : <Navigate to="/" />;
}