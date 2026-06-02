// app/produtos/page.tsx
import { createClient } from "@/lib/supabase/server";
import { parseProduto, type ProdutoRow } from "@/types/Types";
import { GestaoProdutos } from "@/components/gestao-produtos";

// Server Component: faz o select no Supabase e entrega os dados prontos.
// Após salvar/excluir, router.refresh() no client refaz este fetch.
export default async function ProdutosPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("produtos")
    .select("*")
    .order("nome", { ascending: true });

  // numeric vem como string -> normaliza para number
  const produtos = ((data ?? []) as ProdutoRow[]).map(parseProduto);

return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* CABEÇALHO e o resto do código da página... */}
        <div className="p-4">
          <GestaoProdutos produtos={produtos} />
        </div>
      </div>
    </div>
  );
}
