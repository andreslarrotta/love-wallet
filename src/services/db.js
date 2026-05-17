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
  getDoc,
  arrayUnion
} from "firebase/firestore";


// --- Wallets ---
export const createPersonalWallet = async (userEmail) => {
  return await addDoc(collection(db, "wallets"), {
    name: "Personal",
    type: "personal",
    members: [userEmail],
    incomes: { [userEmail]: 0 },
    createdAt: new Date()
  });
};

export const createSharedWallet = async (userEmail, partnerEmail) => {
  return await addDoc(collection(db, "wallets"), {
    name: "Compartida",
    type: "shared",
    members: [userEmail, partnerEmail],
    incomes: { [userEmail]: 0, [partnerEmail]: 0 },
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

export const updateWalletIncomes = async (walletId, incomes) => {
  return await updateDoc(doc(db, "wallets", walletId), { incomes, updatedAt: new Date() });
};

export const updateWalletIncomeSources = async (walletId, incomeSources) => {
  return await updateDoc(doc(db, "wallets", walletId), { incomeSources, updatedAt: new Date() });
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
    createdAt: expenseData.createdAt || new Date()
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

export const updateExpense = async (id, expenseData) => {
  return await updateDoc(doc(db, "expenses", id), expenseData);
};

export const deleteExpense = async (id) => {
  return await deleteDoc(doc(db, "expenses", id));
};

// --- Notifications & Tokens ---
export const saveFcmToken = async (userEmail, token) => {
  if (!userEmail || !token) return;
  const q = query(collection(db, "users"), where("email", "==", userEmail));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    await addDoc(collection(db, "users"), {
      email: userEmail,
      fcmTokens: [token],
      updatedAt: new Date()
    });
  } else {
    const userDoc = snapshot.docs[0];
    await updateDoc(doc(db, "users", userDoc.id), {
      fcmTokens: arrayUnion(token),
      updatedAt: new Date()
    });
  }
};


// --- Goals ---
export const addGoal = async (walletId, goalData) => {
  return await addDoc(collection(db, "goals"), {
    ...goalData,
    walletId,
    createdAt: new Date()
  });
};

export const getGoals = async (walletId) => {
  if (!walletId) return [];
  const q = query(
    collection(db, "goals"), 
    where("walletId", "==", walletId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });
};

export const updateGoal = async (id, goalData) => {
  return await updateDoc(doc(db, "goals", id), goalData);
};

export const deleteGoal = async (id) => {
  return await deleteDoc(doc(db, "goals", id));
};

// --- Goal Contributions ---
export const addContribution = async (walletId, contributionData) => {
  return await addDoc(collection(db, "contributions"), {
    ...contributionData,
    walletId,
    createdAt: new Date()
  });
};

export const getContributions = async (walletId, goalId = null) => {
  if (!walletId) return [];
  let q;
  if (goalId) {
    q = query(
      collection(db, "contributions"), 
      where("walletId", "==", walletId),
      where("goalId", "==", goalId)
    );
  } else {
    q = query(
      collection(db, "contributions"), 
      where("walletId", "==", walletId)
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });
};

export const deleteContribution = async (id) => {
  return await deleteDoc(doc(db, "contributions", id));
};

