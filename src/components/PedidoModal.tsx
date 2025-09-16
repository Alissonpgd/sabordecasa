// src/components/PedidoModal.tsx
'use client';

import { useState, useTransition } from 'react';
import { processarPedidoAction } from '@/lib/actions';

interface Prato {
    id: string;
    nome_prato: string;
    preco: number;
}

interface PedidoModalProps {
    prato: Prato | null;
    onClose: () => void;
}

export default function PedidoModal({ prato, onClose }: PedidoModalProps) {
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!prato) return null;

    const handleSubmit = (formData: FormData) => {
        setErrorMessage(null);
        startTransition(async () => {
            const result = await processarPedidoAction(prato.id, prato.nome_prato, prato.preco, formData);
            if (result.success && result.link) {
                window.location.href = result.link;
            } else {
                setErrorMessage(result.message || 'Falha ao processar o pedido.');
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">&times;</button>
                <h2 className="text-2xl font-bold mb-2">Finalizar Pedido</h2>
                <p className="text-lg mb-6">Você está pedindo: <span className="font-semibold">{prato.nome_prato}</span></p>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Seu Nome</label>
                        <input type="text" name="nome" id="nome" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">Endereço de Entrega</label>
                        <input type="text" name="endereco" id="endereco" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="pagamento" className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                        <select name="pagamento" id="pagamento" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="Pix">Pix</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Cartão na Entrega">Cartão na Entrega</option>
                        </select>
                    </div>
                    {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {isPending ? 'Processando...' : 'Confirmar e Enviar para WhatsApp'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}