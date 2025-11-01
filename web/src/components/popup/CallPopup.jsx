import useSocket from "@/hooks/useSocket";

export default function CallPopup({ call, onAccept, onDecline }) {
  const { emit } = useSocket();
  if (!call) return null;
  
  const { fromUserId, fromUserName, roomId } = call;

  const handleAccept = () => {
    if (typeof onAccept === "function") onAccept(call);
  };

  const handleDecline = () => {
    if (typeof onDecline === "function") onDecline(call);
  };

  return (
    <div style={{
      position: "fixed",
      right: 20,
      bottom: 20,
      zIndex: 9999,
      background: "white",
      border: "1px solid #e5e7eb",
      padding: 12,
      borderRadius: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
    }}>
      <div style={{ marginBottom: 8 }}>
        <strong>{fromUserName || fromUserId}</strong> đang gọi bạn
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleAccept} style={{ background: "#10b981", color: "white", padding: "6px 10px", borderRadius: 6 }}>Chấp nhận</button>
        <button onClick={handleDecline} style={{ background: "#ef4444", color: "white", padding: "6px 10px", borderRadius: 6 }}>Từ chối</button>
      </div>
    </div>
  );
}
