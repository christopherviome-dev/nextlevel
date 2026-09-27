"use client";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import CustomerGate from "../../components/customer/CustomerGate";
import MessagesPanel from "../../components/MessagesPanel";

export default function MessagesPage() {
  return <CustomerGate title="Messages"><Messages /></CustomerGate>;
}
function Messages() {
  const [initial, setInitial] = useState(undefined);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the page address only exists in the browser
    setInitial(new URLSearchParams(window.location.search).get("c"));
  }, []);
  return (
    <div>
      <Nav />
      <div className="max-w-5xl mx-auto px-5 pt-6 pb-16">
        <h1 className="font-display font-extrabold text-xl text-ink mb-4">Messages</h1>
        {initial !== undefined && <MessagesPanel side="customer" initialId={initial} />}
      </div>
    </div>
  );
}
