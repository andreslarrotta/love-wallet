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
  orderBy 
} from "firebase/firestore";

// --- Categories ---
export const addCategory = async (userId, categoryData) => {
  return await addDoc(collection(db, "categories"), {
    ...categoryData,
    userId,
    createdAt: new Date()
  });
};

export const getCategories = async (userId) => {
  const q = query(
    collection(db, "categories"), 
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteCategory = async (id) => {
  return await deleteDoc(doc(db, "categories", id));
};

// --- People ---
export const addPerson = async (userId, name) => {
  return await addDoc(collection(db, "people"), {
    name,
    userId,
    createdAt: new Date()
  });
};

export const getPeople = async (userId) => {
  const q = query(
    collection(db, "people"), 
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deletePerson = async (id) => {
  return await deleteDoc(doc(db, "people", id));
};

// --- Expenses ---
export const addExpense = async (userId, expenseData) => {
  return await addDoc(collection(db, "expenses"), {
    ...expenseData,
    userId,
    createdAt: new Date()
  });
};

export const getExpenses = async (userId) => {
  const q = query(
    collection(db, "expenses"), 
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
