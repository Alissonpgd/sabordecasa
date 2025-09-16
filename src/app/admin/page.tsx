// src/app/admin/page.tsx

import { collection, getDocs, orderBy, query, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addPratoAction, deletePratoAction, isAuthenticated, logoutAction } from '@/lib/actions';
import LoginForm from './LoginForm'; // Importa nosso formulário de login

// Definindo o tipo do nosso prato para segurança de tipos
interface Prato {
    id: string;
    nome_prato: string;
    qtd_inicial: number;
    qtd_restante: number;
}

export default async function AdminPage() {
    const loggedIn = await isAuthenticated();

    // Se o usuário não estiver logado, mostra a tela de login.
    if (!loggedIn) {
        return <LoginForm />;
    }

    // Se chegou aqui, o usuário está logado. Buscamos os dados e mostramos o painel.
    const q = query(collection(db, 'cardapio'), orderBy('criado_em', 'desc'));
    const querySnapshot = await getDocs(q);
    // MUDANÇA SUTIL AQUI para ajudar o TypeScript
    const cardapio: Prato[] = querySnapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData; // Dizemos que 'data' é um DocumentData
        return {
            id: doc.id,
            nome_prato: data.nome_prato,
            qtd_inicial: data.qtd_inicial,
            qtd_restante: data.qtd_restante,
        };
    });

    return (
        <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Painel do Restaurante</h1>
                <form action={logoutAction as any}>
                    <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Sair
                    </button>
                </form>
            </div>

            {/* Seção 1: Formulário para Adicionar Prato (AGORA COMPLETO) */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold mb-4">Adicionar Novo Prato</h2>
                <form action={addPratoAction as any} className="space-y-4">
                    <div>
                        <label htmlFor="nome_prato" className="block text-sm font-medium text-gray-700">
                            Nome do Prato
                        </label>
                        <input
                            type="text"
                            name="nome_prato"
                            id="nome_prato"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Ex: Feijoada Completa"
                        />
                    </div>
                    <div>
                        <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
                            Descrição (opcional)
                        </label>
                        <input
                            type="text"
                            name="descricao"
                            id="descricao"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Ex: Acompanha arroz, couve e farofa"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="preco" className="block text-sm font-medium text-gray-700">
                                Preço (ex: 25.50)
                            </label>
                            <input
                                type="number"
                                name="preco"
                                id="preco"
                                step="0.01"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="qtd_inicial" className="block text-sm font-medium text-gray-700">
                                Quantidade Disponível
                            </label>
                            <input
                                type="number"
                                name="qtd_inicial"
                                id="qtd_inicial"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Adicionar ao Cardápio
                    </button>
                </form>
            </div>

            {/* Seção 2: Lista de Pratos Atuais (AGORA COMPLETA) */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Cardápio Ativo</h2>
                <div className="space-y-3">
                    {cardapio.length === 0 && (
                        <p className="text-gray-500">Nenhum prato ativo no momento. Adicione um acima!</p>
                    )}
                    {cardapio.map((prato) => (
                        <div
                            key={prato.id}
                            className="flex items-center justify-between rounded-md border p-3 hover:bg-gray-50"
                        >
                            <div>
                                <p className="font-semibold text-gray-800">{prato.nome_prato}</p>
                                <p className="text-sm text-gray-600">
                                    Estoque: {prato.qtd_restante} / {prato.qtd_inicial}
                                </p>
                            </div>
                            <form action={deletePratoAction.bind(null, prato.id) as any}>
                                <button
                                    type="submit"
                                    className="rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
                                >
                                    Remover
                                </button>
                            </form>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}