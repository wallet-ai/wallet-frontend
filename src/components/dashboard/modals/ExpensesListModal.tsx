import { useMonthlyData } from "@/context/MonthlyDataContext";
import { useSelectedMonth } from "@/context/SelectedMonthContext";
import { useExpenses } from "@/hooks/useApi";
import { useBankConnections } from "@/hooks/useBankConnections";
import { Calendar, ShoppingBag, Trash2, X } from "lucide-react";
import { useState } from "react";

interface ExpensesListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpensesListModal({
  isOpen,
  onClose,
}: ExpensesListModalProps) {
  const { deleteExpense } = useExpenses();
  const { selectedMonth, selectedYear } = useSelectedMonth();
  const { expenses } = useMonthlyData(selectedMonth, selectedYear);
  const { connectedBanks } = useBankConnections();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [animatingIds, setAnimatingIds] = useState<Set<number>>(new Set());

  const visibleExpenses = expenses.filter(
    (expense) => !deletedIds.has(expense.id)
  );

  const handleClose = () => {
    setDeletedIds(new Set());
    setAnimatingIds(new Set());
    onClose();
  };

  const handleDelete = async (expenseId: number) => {
    if (!expenseId) return;
    setDeletingId(expenseId);
    try {
      setAnimatingIds((prev) => new Set(prev).add(expenseId));
      setTimeout(() => {
        setDeletedIds((prev) => new Set(prev).add(expenseId));
      }, 300);
      await deleteExpense(expenseId);
      window.dispatchEvent(
        new CustomEvent("expenseDeleted", {
          detail: { id: expenseId, month: selectedMonth, year: selectedYear },
        })
      );
    } catch (error) {
      console.error("Erro ao deletar despesa:", error);
      setAnimatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(expenseId);
        return newSet;
      });
      setDeletedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(expenseId);
        return newSet;
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Alimentação: "🍽️",
      Transporte: "🚗",
      Aluguel: "🏠",
      Saúde: "⚕️",
      Educação: "📚",
      Lazer: "🎮",
      Outros: "💸",
    };
    return icons[category] || "💸";
  };

  const getExpenseIcon = (expense: any) => {
    if (!expense.itemId) {
      return (
        <span className="text-lg">{getCategoryIcon(expense.category)}</span>
      );
    }
    const bank = connectedBanks.find((b) => b.id === expense.itemId);
    console.log("Bank for itemId:", expense.itemId, bank);
    if (bank?.imageUrl) {
      return (
        <img
          src={bank.imageUrl}
          alt={bank.name}
          className="w-6 h-6 rounded-lg object-cover"
        />
      );
    }
    return <span className="text-lg">🏦</span>;
  };

  if (!isOpen) return null;

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Gastos de {monthNames[selectedMonth]} {selectedYear}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              {visibleExpenses.length} gasto
              {visibleExpenses.length !== 1 ? "s" : ""} encontrado
              {visibleExpenses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-6">
          {visibleExpenses.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag
                size={48}
                className="text-neutral-300 mx-auto mb-4"
              />
              <p className="text-neutral-500 text-lg">
                Nenhuma despesa encontrada
              </p>
              <p className="text-neutral-400 text-sm mt-1">
                Os gastos deste mês aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className={`flex items-center justify-between p-4 bg-neutral-50 rounded-xl transition-all duration-300 ease-in-out overflow-hidden ${
                    animatingIds.has(expense.id)
                      ? "opacity-0 transform scale-95 translate-x-4 max-h-0 py-0 mb-0"
                      : "opacity-100 transform scale-100 translate-x-0 max-h-96 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                        {getExpenseIcon(expense)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          {expense.description || "Despesa"}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          {expense.data && (
                            <span className="text-sm text-neutral-500 flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(expense.data).toLocaleDateString(
                                "pt-BR"
                              )}
                            </span>
                          )}
                          {expense.category && (
                            <span className="text-xs text-neutral-500 capitalize">
                              {expense.category}
                            </span>
                          )}
                          {expense.tipo && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                expense.tipo === "recorrente"
                                  ? "bg-danger-100 text-danger-700"
                                  : "bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              {expense.tipo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-danger-600 text-lg">
                      R${" "}
                      {Number(expense.valor).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={
                        expense.source !== "MANUAL" || deletingId === expense.id
                      }
                      className={`p-2 rounded-lg transition-colors group ${
                        expense.source !== "MANUAL"
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-danger-50"
                      }`}
                      title={
                        expense.source !== "MANUAL"
                          ? "Despesa importada do Open Finance"
                          : "Excluir despesa"
                      }
                    >
                      {deletingId === expense.id ? (
                        <div className="w-4 h-4 border-2 border-danger-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2
                          size={16}
                          className={
                            expense.source !== "MANUAL"
                              ? "text-neutral-300"
                              : "text-neutral-400 group-hover:text-danger-600"
                          }
                        />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {visibleExpenses.length > 0 && (
          <div className="border-t border-neutral-200 p-6">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 font-medium">
                Total do mês:
              </span>
              <span className="text-xl font-bold text-danger-600">
                R${" "}
                {visibleExpenses
                  .reduce((acc, expense) => acc + Number(expense.valor), 0)
                  .toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
