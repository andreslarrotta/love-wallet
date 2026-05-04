import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  orderBy,
  getDoc
} from "firebase/firestore";

// --- Wallets ---
export const createPersonalWallet = async (userEmail) => {
  return await addDoc(collection(db, "wallets"), {
    name: "Personal",
    type: "personal",
    members: [userEmail],
    createdAt: new Date()
  });
};

export const createSharedWallet = async (userEmail, partnerEmail) => {
  return await addDoc(collection(db, "wallets"), {
    name: "Compartida",
    type: "shared",
    members: [userEmail, partnerEmail],
    createdAt: new Date()
  });
};

export const getUserWallets = async (userEmail) => {
  const q = query(
    collection(db, "wallets"),
    where("members", "array-contains", userEmail)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// --- Categories ---
export const addCategory = async (walletId, categoryData) => {
  return await addDoc(collection(db, "categories"), {
    ...categoryData,
    walletId,
    createdAt: new Date()
  });
};

export const getCategories = async (walletId) => {
  if (!walletId) return [];
  const q = query(
    collection(db, "categories"), 
    where("walletId", "==", walletId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateCategory = async (id, categoryData) => {
  return await updateDoc(doc(db, "categories", id), categoryData);
};

export const deleteCategory = async (id) => {
  return await deleteDoc(doc(db, "categories", id));
};

// --- People ---
export const addPerson = async (walletId, name) => {
  return await addDoc(collection(db, "people"), {
    name,
    walletId,
    createdAt: new Date()
  });
};

export const getPeople = async (walletId) => {
  if (!walletId) return [];
  const q = query(
    collection(db, "people"), 
    where("walletId", "==", walletId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deletePerson = async (id) => {
  return await deleteDoc(doc(db, "people", id));
};

// --- Expenses ---
export const addExpense = async (walletId, expenseData) => {
  return await addDoc(collection(db, "expenses"), {
    ...expenseData,
    walletId,
    createdAt: new Date()
  });
};

export const getExpenses = async (walletId) => {
  if (!walletId) return [];
  const q = query(
    collection(db, "expenses"), 
    where("walletId", "==", walletId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteExpense = async (id) => {
  return await deleteDoc(doc(db, "expenses", id));
};
