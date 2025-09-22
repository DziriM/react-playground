// frontend/src/components/ItemsList.tsx
import { useQuery } from "@tanstack/react-query";
import React from "react";

type Item = { id: number; name: string };

async function fetchItems(): Promise<Item[]> {
  const res = await fetch("/api/items");
  if (!res.ok) throw new Error("Failed to load items");
  return res.json() as Promise<Item[]>;
}

export default function ItemsList() {
  const { data, isLoading, isError } = useQuery<Item[], Error>({
    queryKey: ["items"],
    queryFn: fetchItems,
    staleTime: 15_000,
  });

  if (isLoading) return <div>Chargement items…</div>;
  if (isError) return <div>Erreur chargement items</div>;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 8 }}>Liste items</h3>
      <ul>
        {data?.map((i: Item) => <li key={i.id}>{i.name}</li>) ?? (
          <li>Aucun item</li>
        )}
      </ul>
    </div>
  );
}
