"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getUserWallets, createPersonalWallet } from "@/services/db";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const WalletContext = createContext({});

export function WalletProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [activeWallet, setActiveWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setWallets([]);
      setActiveWallet(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "wallets"),
      where("members", "array-contains", user.email)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        let userWallets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Auto-create personal wallet if it doesn't exist
        if (userWallets.length === 0) {
          await createPersonalWallet(user.email);
        }

        // Deduplicate and set wallets
        const uniqueWallets = [];
        const seenPersonal = new Set();
        for (const w of userWallets) {
          if (w.type === "personal") {
            const owner = w.members[0];
            if (!seenPersonal.has(owner)) {
              uniqueWallets.push(w);
              seenPersonal.add(owner);
            }
          } else {
            uniqueWallets.push(w);
          }
        }
        
        setWallets(uniqueWallets);

        // Manage active wallet - only update if actually different
        setActiveWallet(current => {
          if (!current) {
            return uniqueWallets.find(w => w.type === "personal") || uniqueWallets[0];
          }
          const updated = uniqueWallets.find(w => w.id === current.id);
          
          if (!updated) return uniqueWallets[0] || null;
          
          // Simple check to avoid redundant updates if nothing changed
          if (JSON.stringify(updated) === JSON.stringify(current)) {
            return current;
          }
          return updated;
        });
      } catch (error) {
        console.error("Error in wallet listener:", error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Wallet listener connection error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const loadWallets = () => {
    // This is now handled by the real-time listener, but we keep the name for compatibility
  };

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
