import { useCommandPalette } from "@/hooks/use-command-palette";

export function useSearch() {
  const { query, setQuery, activeTab, setActiveTab, isOpen, setOpen, reset } = useCommandPalette();

  return {
    query,
    setQuery,
    activeTab,
    setActiveTab,
    isOpen,
    setOpen,
    reset,
  };
}