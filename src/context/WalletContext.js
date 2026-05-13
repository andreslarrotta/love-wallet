"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getUserWallets, createPersonalWallet } from "@/services/db";

const WalletContext = createContext({});

export function WalletProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [activeWallet, setActiveWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  function resetWalletState() {
    setWallets([]);
    setActiveWallet(null);
    setLoading(false);
  }

  useEffect(() => {
    if (authLoading) return;
    if (user) loadWallets();
    else resetWalletState();
  }, [user, authLoading]);

  async function loadWallets() {
    if (!user) return;
    try {
      setLoading(true);
      let userWallets = await getUserWallets(user.email);
      
      // Auto-create personal wallet if it doesn't exist
      if (userWallets.length === 0) {
        await createPersonalWallet(user.email);
        userWallets = await getUserWallets(user.email);
      }

      // Deduplicate personal wallets (React Strict Mode bug mitigation)
      const uniqueWallets = [];
      const seenPersonal = new Set();
      for (const w of userWallets) {
        if (w.type === "personal") {
          if (!seenPersonal.has(w.members[0])) {
            uniqueWallets.push(w);
            seenPersonal.add(w.members[0]);
          }
        } else {
          uniqueWallets.push(w);
        }
      }

      setWallets(uniqueWallets);
      
      // Set active wallet to personal by default if not set
      if (!activeWallet) {
        const personalWallet = uniqueWallets.find(w => w.type === "personal") || uniqueWallets[0];
        setActiveWallet(personalWallet);
      } else {
        // Ensure the active wallet still exists and refresh its data
        const updated = uniqueWallets.find(w => w.id === activeWallet.id);
        if (updated) setActiveWallet(updated);
        else setActiveWallet(uniqueWallets[0] || null);
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
    } finally {
      setLoading(false);
    }
  }

  const switchWallet = (walletId) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) setActiveWallet(wallet);
  };

  return (
    <WalletContext.Provider value={{ wallets, activeWallet, switchWallet, loadWallets, loading: authLoading || loading }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
