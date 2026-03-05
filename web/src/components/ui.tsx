
export function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 11px",
        fontSize: 11.5,
        fontWeight: 500,
        fontFamily: "inherit",
        border: "1px solid #e2e8f0",
        borderRadius: 7,
        background: "white",
        color: "#64748b",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}