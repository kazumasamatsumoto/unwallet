import React, { useEffect, useState } from "react";
import { UnWallet } from "unwallet-client-sdk";
import logo from "./logo.svg";
import "./App.css";
import { useLocation } from "react-router-dom";

function generateNonce() {
  let array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function useQuery() {
  return new URLSearchParams(useLocation().hash.substring(1));
}

function App() {
  const [unWallet, setUnWallet] = useState<UnWallet | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  let query = useQuery();
  console.log(query);
  const idToken = query.get("id_token");
  console.log(idToken);

  useEffect(() => {
    async function initUnWallet() {
      const wallet = await UnWallet.init({
        clientID: "135243561738010",
        env: "dev",
      });

      setUnWallet(wallet);

      if (idToken) {
        const idTokenParts = idToken.split(".");
        const base64Url = idTokenParts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );

        const idTokenClaim = JSON.parse(jsonPayload);
        const address = idTokenClaim.sub;
        setUserAddress(address);
      }
    }

    initUnWallet();
  }, [idToken]);

  const handleLogin = () => {
    if (unWallet) {
      const nonce = generateNonce();

      unWallet.authorize({
        redirectURL: "https://unwallet-9b14a.web.app/",
        nonce: nonce,
      });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <button onClick={handleLogin}>Login with UnWallet</button>
        {userAddress && <p>Your address: {userAddress}</p>}
      </header>
    </div>
  );
}

export default App;
