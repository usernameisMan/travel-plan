"use client";
import { useAuth0 } from "@auth0/auth0-react";
import Link from "next/link";

export default function AuthButton() {
  const { isAuthenticated, logout, isLoading, user } = useAuth0();

  if (isLoading)
    return (
      <div className="px-5 py-2 rounded-lg bg-[#35b368] text-white font-semibold shadow hover:bg-[#2d9a5a] transition text-base focus:outline-none focus:ring-2 focus:ring-[#35b368]">
        Loading...
      </div>
    );

  if (isAuthenticated) {
    return (
      <>
        {isAuthenticated && (
          // <div>
          //   <img src={user?.picture} alt={user?.name} />
          //   <h2>{user?.name}</h2>
          //   <p>{user?.email}</p>
          //   <button
          //     className="px-5 py-2 rounded-lg bg-[#35b368] text-white font-semibold shadow hover:bg-[#2d9a5a] transition text-base focus:outline-none focus:ring-2 focus:ring-[#35b368]"
          //     onClick={() =>
          //       logout({
          //         logoutParams: { returnTo: window.location.origin },
          //       })
          //     }
          //   >
          //     Logout
          //   </button>
          // </div>
          <Link href="/profile">
            <button className="px-5 py-2 rounded-lg bg-[#35b368] text-white font-semibold shadow hover:bg-[#2d9a5a] transition text-base focus:outline-none focus:ring-2 focus:ring-[#35b368]">
              {user?.name}
            </button>
          </Link>
        )}
      </>
    );
  }
  return (
    <Link href="/login">
      <button className="px-5 py-2 rounded-lg bg-[#35b368] text-white font-semibold shadow hover:bg-[#2d9a5a] transition text-base focus:outline-none focus:ring-2 focus:ring-[#35b368]">
        Login
      </button>
    </Link>
  );
}
