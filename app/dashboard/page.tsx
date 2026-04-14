"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
  const res = await fetch("/api/user/dashboard", {
    credentials: "include",
  });

  if (!res.ok) {
    console.error("API ERROR");
    return;
  }

  const result = await res.json();
  console.log("Dashboard:", result);

  setData(result);
};

    fetchDashboard();
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>

      {/* My Items */}
      <h2>My Items</h2>
      {data.myItems.map((item: any) => (
        <div key={item.id}>
          <p>{item.title}</p>
        </div>
      ))}

      {/* My Claims */}
      <h2>My Claims</h2>
      {data.myClaims.map((claim: any) => (
        <div key={claim.id}>
          <p>{claim.item.title} - {claim.status}</p>
        </div>
      ))}

      {/* Claims on My Items */}
      <h2>Claims On My Items</h2>
      {data.claimsOnMyItems.map((claim: any) => (
        <div key={claim.id}>
          <p>{claim.item.title} - {claim.user.name} ({claim.status})</p>
        </div>
      ))}
    </div>
  );
}