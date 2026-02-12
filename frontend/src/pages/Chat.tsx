import { useEffect } from "react";
import { api } from "../api";

export default function Chat() {
  useEffect(() => {
    api.get("/health").then((res) => console.log(res.data));
  }, []);

  return <div className="p-4">Chat Page</div>;
}
