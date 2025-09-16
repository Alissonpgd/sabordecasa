// src/app/page.tsx
'use client'; // Continuamos usando 'use client' por causa da interatividade (useState)

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import PedidoModal from '@/components/PedidoModal';

interface Prato {
  id: string;
  nome_prato: string;
  descricao: string;
  preco: number;
  qtd_restante: number;
}

export default function Home() {
  const [cardapio, setCardapio] = useState<Prato[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrato, setSelectedPrato] = useState<Prato | null>(null);

  useEffect(() => {
    // Usamos onSnapshot para ouvir as atualizações em tempo real!
    const q = query(
      collection(db, 'cardapio'),
      where('ativo', '==', true),
      orderBy('criado_em', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const pratosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prato[];
      setCardapio(pratosData);
      setLoading(false);
    });

    // Limpa o "ouvinte" quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (prato: Prato) => {
    if (prato.qtd_restante > 0) {
      setSelectedPrato(prato);
    }
  };

  const handleCloseModal = () => {
    setSelectedPrato(null);
  };

  return (
    <>
      <main className="flex min-h-screen flex-col items-center p-4 md:p-24 bg-gray-50">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Cardápio do Dia</h1>

        {loading && <p>Carregando cardápio...</p>}

        {!loading && cardapio.length === 0 && (
          <p className="text-gray-500">Nenhum prato disponível no momento. Volte mais tarde!</p>
        )}

        <div className="w-full max-w-2xl space-y-4">
          {cardapio.map((prato) => (
            <div key={prato.id} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">{prato.nome_prato}</h2>
              <p className="text-gray-600 mt-2">{prato.descricao}</p>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4">
                <p className="text-xl font-bold text-green-700 mb-2 md:mb-0">
                  R$ {prato.preco.toFixed(2).replace('.', ',')}
                </p>
                <div className="flex items-center space-x-4">
                  <p className={`text-md font-medium ${prato.qtd_restante > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {prato.qtd_restante > 0 ? `Restam: ${prato.qtd_restante}` : 'Esgotado!'}
                  </p>
                  <button
                    onClick={() => handleOpenModal(prato)}
                    disabled={prato.qtd_restante === 0}
                    className="px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Pedir Agora
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <PedidoModal prato={selectedPrato} onClose={handleCloseModal} />
    </>
  );
}