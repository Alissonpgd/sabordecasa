// src/lib/actions.ts
'use server';

// Importações do Firebase
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Importações do Next.js
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// MUDOU AQUI: Importação para JWT (usando jsonwebtoken)
import jwt from 'jsonwebtoken';

// --- CONFIGURAÇÃO DE AUTENTICAÇÃO ---

const adminPassword = process.env.ADMIN_PASSWORD;
const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-dev';
const cookieName = 'auth-token';

// Ação para realizar o LOGIN do administrador
export async function loginAction(formData: FormData) {
    const password = String(formData.get('password') ?? '');

    if (adminPassword && password === adminPassword) {
        const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '24h' });

        const cookieStore = await cookies();

        cookieStore.set(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });

        redirect('/admin');
        return { success: true };
    }

    return { success: false, error: 'Senha incorreta.' };
}

// Ação para realizar o LOGOUT do administrador (NÃO MUDA)
export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete(cookieName);
    redirect('/admin');
}

// Função auxiliar para verificar se o administrador está autenticado
export async function isAuthenticated() {
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;

    if (!token) return false;

    try {
        jwt.verify(token, jwtSecret);
        return true;
    } catch (error) {
        return false;
    }
}


// --- AÇÕES DE GERENCIAMENTO DO CARDÁPIO ---

// Ação para ADICIONAR um novo prato ao cardápio (NÃO MUDA)
export async function addPratoAction(formData: FormData) {
    const nome_prato = String(formData.get('nome_prato') ?? '').trim();
    const descricao = String(formData.get('descricao') ?? '').trim();
    const preco = Number.parseFloat(String(formData.get('preco') ?? ''));
    const qtd_inicial = Number.parseInt(String(formData.get('qtd_inicial') ?? '0'), 10);

    if (!nome_prato || !Number.isFinite(preco) || !Number.isInteger(qtd_inicial)) {
        return { success: false, message: 'Dados inválidos.' };
    }

    try {
        await addDoc(collection(db, 'cardapio'), {
            nome_prato,
            descricao,
            preco,
            qtd_inicial,
            qtd_restante: qtd_inicial,
            ativo: true,
            criado_em: serverTimestamp(),
        });
    } catch (error: any) {
        console.error('Erro ao adicionar prato: ', error);
        return { success: false, message: error.message ?? 'Erro desconhecido.' };
    }

    revalidatePath('/admin');
    return { success: true };
}

// Ação para DELETAR um prato do cardápio (NÃO MUDA)
export async function deletePratoAction(id: string) {
    if (!id) return;

    try {
        await deleteDoc(doc(db, 'cardapio', id));
    } catch (error) {
        console.error('Erro ao deletar prato: ', error);
    }

    revalidatePath('/admin');
}


// --- AÇÃO DE PROCESSAMENTO DE PEDIDO DO CLIENTE ---

// Ação para PROCESSAR um pedido de um cliente (NÃO MUDA)
export async function processarPedidoAction(
    pratoId: string,
    pratoNome: string,
    pratoPreco: number,
    formData: FormData
) {
    const nomeCliente = String(formData.get('nome') ?? '').trim();
    const endereco = String(formData.get('endereco') ?? '').trim();
    const pagamento = String(formData.get('pagamento') ?? '').trim();

    if (!nomeCliente || !endereco || !pagamento) {
        return { success: false, message: 'Por favor, preencha todos os campos.' };
    }

    try {
        const pratoRef = doc(db, 'cardapio', pratoId);

        await runTransaction(db, async (transaction) => {
            const pratoDoc = await transaction.get(pratoRef);
            if (!pratoDoc.exists()) {
                throw new Error('Prato não encontrado!');
            }

            const data = pratoDoc.data();
            const qtd_restante = Number(data?.qtd_restante ?? 0);
            if (qtd_restante > 0) {
                transaction.update(pratoRef, { qtd_restante: qtd_restante - 1 });
            } else {
                throw new Error('Estoque esgotado!');
            }
        });

        const mensagem = `Olá! Gostaria de fazer um pedido:
- Prato: *${pratoNome}*
- Nome: *${nomeCliente}*
- Endereço: *${endereco}*
- Pagamento: *${pagamento}*
- TOTAL: *R$ ${pratoPreco.toFixed(2).replace('.', ',')}*`;

        const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
        if (!whatsappNumber) {
            console.error('Número do WhatsApp não configurado.');
            return { success: false, message: 'Número do WhatsApp não configurado.' };
        }

        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensagem)}`;

        revalidatePath('/');
        return { success: true, link: whatsappLink };

    } catch (error: any) {
        console.error('Erro na transação: ', error);
        return { success: false, message: error.message || 'Ocorreu um erro ao processar seu pedido.' };
    }
}