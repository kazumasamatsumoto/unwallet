import React, { useEffect, useState } from "react";
import { UnWallet } from "unwallet-client-sdk";
import { useLocation, useNavigate } from "react-router-dom";

// Functions and constants related to UnWallet
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

const Login = () => {
  const [unWallet, setUnWallet] = useState<UnWallet | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  let query = useQuery();
  let navigate = useNavigate();

  const idToken = query.get("id_token");

  useEffect(() => {
    async function initUnWallet() {
      const wallet = await UnWallet.init({
        clientID: "144261257165881",
        // env: "dev", testnet only
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
        setUserAddress(address); // This will trigger the next useEffect
      }
    }

    const savedAddress = localStorage.getItem("userAddress");
    if (savedAddress) {
      setUserAddress(savedAddress);
    }

    initUnWallet();
  }, [idToken, navigate]);

  useEffect(() => {
    // Whenever the userAddress changes, save it to local storage
    if (userAddress) {
      localStorage.setItem("userAddress", userAddress);

      // After storing to local storage, navigate to map
      if (idToken) {
        navigate("/map");
      }
    }
  }, [userAddress, idToken, navigate]);


  const handleLogin = () => {
    if (unWallet) {
      const nonce = generateNonce();

      unWallet.authorize({
        redirectURL: "https://unwallet-9b14a.web.app/",
        nonce: nonce,
      });
      navigate("/map");
    }
  };

  const handleNavigate = () => {
    navigate("/map");
  }

  return (
    <div className="App" style={{ background: '#282c34', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
    <header className="App-header" style={{ marginBottom: '2em' }}>
      <h1 style={{ marginBottom: '1em' }}>Welcome to UnWallet</h1>
      <button onClick={handleLogin} style={{ padding: '1em 2em', borderRadius: '2em', background: '#61dafb', border: 'none', color: '#282c34', fontSize: '1em', cursor: 'pointer' }}>Login with UnWallet</button>
      <button onClick={handleNavigate} style={{ marginTop: '1em', padding: '1em 2em', borderRadius: '2em', background: '#61dafb', border: 'none', color: '#282c34', fontSize: '1em', cursor: 'pointer' }}>Go to Map</button>
      {userAddress && <p style={{ marginTop: '2em' }}>Your address: {userAddress}</p>}
    </header>
  </div>
  );
};

export default Login;
