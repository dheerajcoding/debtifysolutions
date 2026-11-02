import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { AVATAR } from "../lib/viz.js";
import { Html } from "./ui.jsx";

// "Ask Jay" floating button and chat sheet.
export default function Chat() {
  const { chat, openChat, closeChat, sendChat, askPerson, x } = useApp();
  const [q, setQ] = useState("");
  const msgsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [chat.msgs, chat.typing, chat.open]);

  const send = () => {
    const v = q.trim();
    if (!v) return;
    setQ("");
    sendChat(v);
    inputRef.current?.focus();
  };

  if (!chat.open)
    return (
      <button className="fab" onClick={openChat}>
        <Html as="span" html={AVATAR} style={{ display: "contents" }} />
        <span className="fab-label">{x.ask}</span>
      </button>
    );

  return (
    <div className="chat">
      <header>
        <span>
          <Html as="span" html={AVATAR} style={{ display: "contents" }} />
          {x.ask}
        </span>
        <button onClick={closeChat}>{x.close}</button>
      </header>
      <div className="msgs" ref={msgsRef}>
        {[["a", x.chatHi], ...chat.msgs].map(([w, t], i) => (
          <p key={i} className={"m " + (w === "u" ? "u" : "")}>{t}</p>
        ))}
        {chat.typing && <p className="small">…</p>}
      </div>
      <div className="chatin">
        <input ref={inputRef} className="field" placeholder={x.typeQ} maxLength={500} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <button onClick={send}>{x.send}</button>
      </div>
      <button className="person" onClick={askPerson}>{x.person}</button>
    </div>
  );
}
