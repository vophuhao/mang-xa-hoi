import React, { useEffect, useState } from "react";

import { useSearchParams } from "react-router-dom";

import useSocket from "@/hooks/useSocket";

export default function CallPage() {
  const [search] = useSearchParams();
  const callId = search.get("callId");
  const type = search.get("type");
  const role = search.get("role"); // 'caller' or 'callee'
  const other = search.get("to") || search.get("from");
  const { socket, on, off, emit } = useSocket();
  const [status, setStatus] = useState(role === "caller" ? "waiting" : "ready"); // waiting, accepted, declined
  const [info, setInfo] = useState(null);

  useEffect(() => {
    // Caller listens for response
    const handleCallResponse = (payload) => {
      if (!payload || payload.callId !== callId) return;
      if (payload.accepted) {
        setStatus("accepted");
        setInfo(payload);
        console.log("Call accepted, payload:", payload);
        // TODO: start WebRTC negotiation here
      } else {
        setStatus("declined");
        setInfo(payload);
        console.log("Call declined:", payload);
        // optional: close tab after short delay
        setTimeout(() => window.close(), 2000);
      }
    };

    // Callee might receive cancel
    const handleCallCancel = (payload) => {
      if (!payload || payload.callId !== callId) return;
      setStatus("cancelled");
      setTimeout(() => window.close(), 1500);
    };

    on("call_response", handleCallResponse);
    on("call_cancel", handleCallCancel);

    // If caller closes tab before response, notify server to cancel
    const handleBeforeUnload = () => {
      if (role === "caller" && status === "waiting") {
        emit("call_cancel", { callId, fromUserId: other, toUserId: other });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      off("call_response", handleCallResponse);
      off("call_cancel", handleCallCancel);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [on, off, emit, callId, role, other, status]);

  return (
    <div className="p-6">
      <h2>Cuộc gọi {type === "video" ? "video" : "thoại"}</h2>
      <p>Call id: {callId}</p>
      <p>Vai trò: {role}</p>
      <p>Người kia: {other}</p>

      {role === "caller" && (
        <div className="mt-4">
          {status === "waiting" && <p>Đang chờ người nhận trả lời...</p>}
          {status === "accepted" && <p>Người nhận đã chấp nhận — bắt đầu kết nối (WebRTC)...</p>}
          {status === "declined" && <p>Người nhận từ chối cuộc gọi.</p>}
        </div>
      )}

      {role === "callee" && (
        <div className="mt-4">
          <p>Bạn đã vào màn hình cuộc gọi. Nếu bạn vừa chấp nhận, chờ kết nối WebRTC...</p>
        </div>
      )}

      <p className="mt-4 text-gray-600">(Placeholder — tích hợp WebRTC sau)</p>
    </div>
  );
}
