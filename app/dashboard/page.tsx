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
 const updateClaim = async (claimId: string, status: string) => {
  await fetch(`/api/claims/${claimId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  // reload dashboard
  location.reload();
};
  return (
  <div style={{ padding: "20px", color: "white" }}>
    <h2>Dashboard</h2>

    {/* My Items */}
    <h3>My Items</h3>
    {data.myItems.length === 0 ? (
      <p>No items</p>
    ) : (
      data.myItems.map((item: any) => (
        <div key={item.id}>
          <p>{item.title}</p>
        </div>
      ))
    )}

    {/* My Claims */}
    <h3>My Claims</h3>
    {data.myClaims.length === 0 ? (
      <p>No claims</p>
    ) : (
      data.myClaims.map((claim: any) => (
        <div key={claim.id}>
          <p>
            {claim.item.title} — {claim.status}
          </p>
        </div>
      ))
    )}

    {/* Claims on My Items */}
    <h3>Claims On My Items</h3>
    {data.claimsOnMyItems.length === 0 ? (
      <p>No claims</p>
    ) : (
      data.claimsOnMyItems.map((claim: any) => (
        <div key={claim.id}>
          <p>
            {claim.user.name} claimed {claim.item.title} — {claim.status}
          </p>

          {/* 🔥 Approve / Reject buttons */}
          {claim.status === "pending" && (
            <>
              <button onClick={() => updateClaim(claim.id, "approved")}>
                Approve
              </button>
              <button onClick={() => updateClaim(claim.id, "rejected")}>
                Reject
              </button>
            </>
          )}
        </div>
      ))
    )}
  </div>
);
}